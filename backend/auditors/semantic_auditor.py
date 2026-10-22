import re
import uuid
import os
import logging
from typing import List, Optional, Tuple, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.auditors.base import BaseAuditor
from backend.parsers.pdf_parser import ParsedDocument, ExtractedSpan
from backend.models.schemas import (
    AuditIssue, Severity, IssueCategory, SourceAnchor, BoundingBox, CheckType, IssueStatus
)

logger = logging.getLogger("voltora.auditor.semantic")

def extract_period(text: str) -> Optional[str]:
    """Extracts fiscal year or year indicator from text (e.g. FY24, FY2024, 2024)."""
    m = re.search(
        r'\b(?:fy\s*([12][0-9]{3}|[0-9]{2})|fiscal\s+(?:year\s+)?([12][0-9]{3})|fiscal\s+([0-9]{2})|year\s+ending\s+[a-zA-Z]+\s+\d+,\s*([12][0-9]{3})|\b([12][0-9]{3})\b)',
        text,
        re.IGNORECASE
    )
    if m:
        val = m.group(1) or m.group(2) or m.group(3) or m.group(4) or m.group(5)
        if val and len(val) == 2:
            return "20" + val
        return val
    return None

def normalize_metric_name(text: str) -> Optional[str]:
    """Maps varied metric phrases to standardized canonical keys."""
    t = text.lower()
    if any(k in t for k in ["revenue growth", "revenue expansion", "sales growth", "growth in revenue"]):
        return "revenue_growth"
    if any(k in t for k in ["operating margin", "operating profit margin"]):
        return "operating_margin"
    if any(k in t for k in ["gross margin", "gross profit margin"]):
        return "gross_margin"
    if any(k in t for k in ["headcount", "employee count", "total employees"]):
        return "headcount"
    return None

class ExtractedClaim:
    def __init__(
        self,
        subject: str,
        assertion: str,
        span: ExtractedSpan,
        value_num: Optional[float] = None,
        metric_unit: Optional[str] = None,
        normalized_metric: Optional[str] = None,
        period: Optional[str] = None,
        entity: Optional[str] = None,
        claim_type: str = "metric",
        polarity: Optional[str] = None,
    ):
        self.subject = subject.lower().strip()
        self.assertion = assertion.strip()
        self.span = span
        self.value_num = value_num
        self.metric_unit = metric_unit
        self.normalized_metric = normalized_metric
        self.period = period
        self.entity = entity or "consolidated"
        self.claim_type = claim_type
        self.polarity = polarity

class SemanticAuditor(BaseAuditor):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")

    @property
    def name(self) -> str:
        return "Semantic Contradiction & Fact Verification Auditor"

    def audit(self, parsed: ParsedDocument) -> List[AuditIssue]:
        issues: List[AuditIssue] = []

        # 1. Extract structured claims across document
        claims = self._extract_claims(parsed)
        if len(claims) < 2:
            return issues

        # 2. Topic candidate pairing via TF-IDF cosine similarity
        candidate_pairs = self._pair_candidates_by_similarity(claims)

        # 3. Judge contradictions for candidate pairs
        seen_pairs = set()
        for c1, c2, sim_score in candidate_pairs:
            pair_key = (min(c1.span.page, c2.span.page), max(c1.span.page, c2.span.page), c1.normalized_metric or c1.subject[:20])
            if pair_key in seen_pairs:
                continue

            contradiction_info = self._judge_contradiction(c1, c2)
            if contradiction_info:
                seen_pairs.add(pair_key)
                title, desc, severity, status, explanation, expected, actual, fix = contradiction_info
                issues.append(AuditIssue(
                    id=f"sem-contra-{c1.span.page}-{c2.span.page}-{uuid.uuid4().hex[:6]}",
                    title=title,
                    description=desc,
                    category=IssueCategory.CONTRADICTION,
                    severity=severity,
                    confidence=0.94 if status == IssueStatus.CONFIRMED else 0.75,
                    check_type=CheckType.HEURISTIC,
                    status=status,
                    explanation=explanation,
                    primary_anchor=SourceAnchor(
                        page=c1.span.page,
                        bbox=BoundingBox(
                            x0=c1.span.bbox[0], y0=c1.span.bbox[1],
                            x1=c1.span.bbox[2], y1=c1.span.bbox[3]
                        ),
                        text=c1.span.text,
                        label=f"Claim on Page {c1.span.page}"
                    ),
                    secondary_anchor=SourceAnchor(
                        page=c2.span.page,
                        bbox=BoundingBox(
                            x0=c2.span.bbox[0], y0=c2.span.bbox[1],
                            x1=c2.span.bbox[2], y1=c2.span.bbox[3]
                        ),
                        text=c2.span.text,
                        label=f"Conflicting Statement on Page {c2.span.page}"
                    ),
                    expected_value=expected,
                    actual_value=actual,
                    delta="Mutually exclusive statements" if status == IssueStatus.CONFIRMED else "Potential contextual divergence",
                    suggested_fix=fix
                ))

        return issues

    def _extract_claims(self, parsed: ParsedDocument) -> List[ExtractedClaim]:
        claims = []

        metric_claim_regex = re.compile(
            r'\b([a-zA-Z\s]{3,35}?)\s+(accelerated\s+to|grew|expanded|increased|declined|fell|reached|totaled|was|were|stood\s+at)\s+([$€£¥]?\s*[0-9]+(?:\.[0-9]+)?\s*[%mkbMK]?)',
            re.IGNORECASE
        )
        expansion_regex = re.compile(
            r'\b([a-zA-Z\s]{3,35}?)\s+(?:implies|implies\s+a|represents)\s+([$€£¥]?\s*[0-9]+(?:\.[0-9]+)?\s*[%mkbMK]?)\s+([a-zA-Z\s\-]+)',
            re.IGNORECASE
        )
        pct_growth_regex = re.compile(
            r'\b([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:year-over-year\s+)?(revenue\s+expansion|revenue\s+growth|sales\s+growth)\b',
            re.IGNORECASE
        )

        for span in parsed.spans:
            text = span.text
            if len(text.split()) < 3 or len(text.split()) > 70:
                continue

            period = extract_period(text)
            text_lower = text.lower()

            match = metric_claim_regex.search(text)
            match_exp = expansion_regex.search(text)
            match_growth = pct_growth_regex.search(text)

            if match:
                subj = match.group(1).strip()
                val_raw = match.group(3).strip()
                val_clean = re.sub(r'[$€£¥%,\s]', '', val_raw)
                val_num = None
                try:
                    val_num = float(val_clean)
                except ValueError:
                    pass

                norm_metric = normalize_metric_name(subj)
                claims.append(ExtractedClaim(
                    subject=subj,
                    assertion=text,
                    span=span,
                    value_num=val_num,
                    metric_unit="%" if "%" in val_raw else ("$" if "$" in val_raw else "count"),
                    normalized_metric=norm_metric,
                    period=period,
                    claim_type="metric"
                ))
            elif match_exp:
                subj = (match_exp.group(1) + " " + match_exp.group(3)).strip()
                val_raw = match_exp.group(2).strip()
                val_clean = re.sub(r'[$€£¥%,\s]', '', val_raw)
                val_num = None
                try:
                    val_num = float(val_clean)
                except ValueError:
                    pass

                norm_metric = normalize_metric_name(subj)
                claims.append(ExtractedClaim(
                    subject=subj,
                    assertion=text,
                    span=span,
                    value_num=val_num,
                    metric_unit="%" if "%" in val_raw else ("$" if "$" in val_raw else "count"),
                    normalized_metric=norm_metric,
                    period=period,
                    claim_type="metric"
                ))
            elif match_growth:
                val_num = float(match_growth.group(1))
                claims.append(ExtractedClaim(
                    subject=match_growth.group(2).strip(),
                    assertion=text,
                    span=span,
                    value_num=val_num,
                    metric_unit="%",
                    normalized_metric="revenue_growth",
                    period=period,
                    claim_type="metric"
                ))

            # Check polar claims: Debt & Capital Structure
            if any(w in text_lower for w in ["zero debt", "zero-debt", "zero outstanding debt", "no debt", "debt-free", "zero long-term debt", "no external credit facilities"]):
                claims.append(ExtractedClaim(
                    subject="capital structure debt",
                    assertion=text,
                    span=span,
                    normalized_metric="debt_status",
                    period=period,
                    claim_type="polar",
                    polarity="none"
                ))
            elif any(w in text_lower for w in ["credit facility", "debt notes", "convertible debt", "secured a $", "issued $", "borrowings of"]):
                claims.append(ExtractedClaim(
                    subject="capital structure debt",
                    assertion=text,
                    span=span,
                    normalized_metric="debt_status",
                    period=period,
                    claim_type="polar",
                    polarity="active"
                ))

            # Check polar claims: Geographic / Subsidiary Operations
            if any(w in text_lower for w in ["no foreign subsidiaries", "no international operations", "domestic footprint", "solely domestic", "exclusively domestic"]):
                claims.append(ExtractedClaim(
                    subject="geographic operations",
                    assertion=text,
                    span=span,
                    normalized_metric="international_footprint",
                    period=period,
                    claim_type="polar",
                    polarity="none"
                ))
            elif any(w in text_lower for w in ["subsidiary operations", "subsidiaries in", "european union", "asia-pacific", "international operations"]):
                claims.append(ExtractedClaim(
                    subject="geographic operations",
                    assertion=text,
                    span=span,
                    normalized_metric="international_footprint",
                    period=period,
                    claim_type="polar",
                    polarity="active"
                ))

        return claims

    def _pair_candidates_by_similarity(self, claims: List[ExtractedClaim]) -> List[Tuple[ExtractedClaim, ExtractedClaim, float]]:
        pairs = []
        if len(claims) < 2:
            return pairs

        texts = [c.assertion for c in claims]
        try:
            vectorizer = TfidfVectorizer(stop_words='english', min_df=1)
            tfidf_matrix = vectorizer.fit_transform(texts)
            sim_matrix = cosine_similarity(tfidf_matrix)

            for i in range(len(claims)):
                for j in range(i + 1, len(claims)):
                    c1 = claims[i]
                    c2 = claims[j]

                    if c1.span.page == c2.span.page:
                        continue

                    score = float(sim_matrix[i, j])

                    # Direct boost if canonical metrics match
                    if c1.normalized_metric and c2.normalized_metric and c1.normalized_metric == c2.normalized_metric:
                        score += 0.70

                    if score >= 0.25:
                        pairs.append((c1, c2, score))
        except Exception as e:
            logger.warning("Error during claim candidate pairing: %s", e)

        pairs.sort(key=lambda x: x[2], reverse=True)
        return pairs[:40]

    def _judge_contradiction(
        self, c1: ExtractedClaim, c2: ExtractedClaim
    ) -> Optional[Tuple[str, str, Severity, IssueStatus, str, str, str, str]]:
        """Judges whether two claims contradict each other based on metric, entity, period, and polarity.
        Returns: (title, description, severity, status, explanation, expected_val, actual_val, suggested_fix)
        """
        # Rule 1: Period check. If both specify distinct time periods (e.g. 2023 vs 2024), they are not in conflict!
        if c1.period and c2.period and c1.period != c2.period:
            return None

        # Rule 2: Metric Value Contradiction
        if c1.claim_type == "metric" and c2.claim_type == "metric":
            # Both must refer to numeric values and the same units
            if c1.value_num is not None and c2.value_num is not None and c1.metric_unit == c2.metric_unit:
                # Must share the same normalized metric (or strong subject token overlap)
                same_metric = False
                if c1.normalized_metric and c2.normalized_metric and c1.normalized_metric == c2.normalized_metric:
                    same_metric = True
                else:
                    w1 = set(re.findall(r'\b\w{3,}\b', c1.subject))
                    w2 = set(re.findall(r'\b\w{3,}\b', c2.subject))
                    if len(w1 & w2) >= 2:
                        same_metric = True

                if same_metric and abs(c1.value_num - c2.value_num) > 0.1:
                    unit_sym = "%" if c1.metric_unit == "%" else ""
                    metric_label = (c1.normalized_metric or c1.subject).replace("_", " ").title()

                    # Check for ambiguity: if periods are unstated or context is slightly vague, mark as needs_review
                    is_ambiguous = (c1.period is None or c2.period is None) and (c1.normalized_metric is None or c2.normalized_metric is None)
                    status = IssueStatus.NEEDS_REVIEW if is_ambiguous else IssueStatus.CONFIRMED
                    severity = Severity.WARNING if status == IssueStatus.NEEDS_REVIEW else Severity.CRITICAL

                    explanation = (
                        f"Heuristic cross-page comparison: evaluated metric '{metric_label}' across Page {c1.span.page} "
                        f"(stated {c1.value_num}{unit_sym}) and Page {c2.span.page} (stated {c2.value_num}{unit_sym}). "
                        f"Both statements refer to the same indicator and comparable period ({c1.period or c2.period or 'current period'}), "
                        f"resulting in a direct numerical divergence of {abs(c1.value_num - c2.value_num):.2f}{unit_sym}."
                    )

                    return (
                        f"Direct Metric Contradiction: {c1.value_num}{unit_sym} vs {c2.value_num}{unit_sym}",
                        f"Page {c1.span.page} claims '{c1.subject}' reached {c1.value_num}{unit_sym}, while Page {c2.span.page} reports {c2.value_num}{unit_sym} for the same indicator.",
                        severity,
                        status,
                        explanation,
                        f"Consistent figure ({c1.value_num}{unit_sym} or {c2.value_num}{unit_sym})",
                        f"P.{c1.span.page}: {c1.value_num}{unit_sym} | P.{c2.span.page}: {c2.value_num}{unit_sym}",
                        f"Verify official source data and align metric to either {c1.value_num}{unit_sym} or {c2.value_num}{unit_sym} consistently."
                    )

        # Rule 3: Polar Categorical Contradictions (e.g. zero debt vs active debt; no foreign subsidiaries vs foreign subsidiaries)
        if c1.claim_type == "polar" and c2.claim_type == "polar":
            if c1.normalized_metric == c2.normalized_metric and c1.polarity and c2.polarity and c1.polarity != c2.polarity:
                topic = "Capital Structure / Debt" if c1.normalized_metric == "debt_status" else "Operational Footprint"
                period_str = c1.period or c2.period or "the reporting period"

                explanation = (
                    f"Heuristic semantic comparison: identified mutually exclusive representations for '{topic}' during {period_str}. "
                    f"Page {c1.span.page} asserts '{c1.polarity}' state (quote: \"{c1.span.text[:80]}...\"), "
                    f"while Page {c2.span.page} asserts '{c2.polarity}' state (quote: \"{c2.span.text[:80]}...\")."
                )

                return (
                    f"Polar Semantic Contradiction: {topic} Mismatch",
                    f"Page {c1.span.page} asserts an absolute state that is contradicted by Page {c2.span.page} for the same period.",
                    Severity.CRITICAL,
                    IssueStatus.CONFIRMED,
                    explanation,
                    "Mutually aligned factual statements",
                    f"P.{c1.span.page}: \"{c1.span.text[:60]}...\" vs P.{c2.span.page}: \"{c2.span.text[:60]}...\"",
                    "Reconcile contradictory factual representations prior to publication or filing."
                )

        return None
