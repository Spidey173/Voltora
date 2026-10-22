import re
import uuid
import os
import json
from typing import List, Optional, Tuple, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import httpx

from backend.auditors.base import BaseAuditor
from backend.parsers.pdf_parser import ParsedDocument, ExtractedSpan
from backend.models.schemas import AuditIssue, Severity, IssueCategory, SourceAnchor, BoundingBox

class ExtractedClaim:
    def __init__(self, subject: str, assertion: str, span: ExtractedSpan, value_num: Optional[float] = None, metric_unit: Optional[str] = None):
        self.subject = subject.lower().strip()
        self.assertion = assertion.strip()
        self.span = span
        self.value_num = value_num
        self.metric_unit = metric_unit

class SemanticAuditor(BaseAuditor):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")

    @property
    def name(self) -> str:
        return "Semantic Contradiction & Fact Verification Auditor"

    def audit(self, parsed: ParsedDocument) -> List[AuditIssue]:
        issues: List[AuditIssue] = []
        
        # 1. Extract claims across document
        claims = self._extract_claims(parsed)
        if len(claims) < 2:
            return issues

        # 2. Topic candidate pairing via TF-IDF cosine similarity
        candidate_pairs = self._pair_candidates_by_similarity(claims)

        # 3. Judge contradictions for candidate pairs
        for c1, c2, sim_score in candidate_pairs:
            contradiction_info = self._judge_contradiction(c1, c2)
            if contradiction_info:
                title, desc, severity, expected, actual, fix = contradiction_info
                issues.append(AuditIssue(
                    id=f"sem-contra-{c1.span.page}-{c2.span.page}-{uuid.uuid4().hex[:6]}",
                    title=title,
                    description=desc,
                    category=IssueCategory.CONTRADICTION,
                    severity=severity,
                    confidence=0.94,
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
                    delta="Mutually exclusive statements",
                    suggested_fix=fix
                ))

        return issues

    def _extract_claims(self, parsed: ParsedDocument) -> List[ExtractedClaim]:
        claims = []
        
        # Patterns for metric or fact claims
        # e.g., "revenue growth accelerated to 12%", "operating margin reached 22%", "implies 14% year-over-year revenue expansion"
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
            if len(text.split()) < 3 or len(text.split()) > 60:
                continue
            
            # Check for metric claims
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
                
                claims.append(ExtractedClaim(
                    subject=subj,
                    assertion=text,
                    span=span,
                    value_num=val_num,
                    metric_unit="%" if "%" in val_raw else ("$" if "$" in val_raw else "count")
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
                
                claims.append(ExtractedClaim(
                    subject=subj,
                    assertion=text,
                    span=span,
                    value_num=val_num,
                    metric_unit="%" if "%" in val_raw else ("$" if "$" in val_raw else "count")
                ))
            elif match_growth:
                val_num = float(match_growth.group(1))
                claims.append(ExtractedClaim(
                    subject=match_growth.group(2).strip(),
                    assertion=text,
                    span=span,
                    value_num=val_num,
                    metric_unit="%"
                ))
            else:
                # Store general assertion if contains strong declarative verbs or corporate status
                text_lower = text.lower()
                if any(w in text_lower for w in [
                    "exclusive", "no debt", "zero debt", "zero-debt", "zero liabilities", 
                    "debt of", "long-term debt", "credit facility", "debt notes", "convertible debt",
                    "subsidiaries in", "subsidiary operations", "international operations", 
                    "domestic footprint", "solely domestic", "terminated", "active"
                ]):
                    claims.append(ExtractedClaim(
                        subject=" ".join(text.split()[:4]),
                        assertion=text,
                        span=span
                    ))

        return claims

    def _pair_candidates_by_similarity(self, claims: List[ExtractedClaim]) -> List[Tuple[ExtractedClaim, ExtractedClaim, float]]:
        """Finds pairs of claims from different pages that address the same topic/metric."""
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
                    
                    # Only compare across different pages
                    if c1.span.page == c2.span.page:
                        continue

                    score = float(sim_matrix[i, j])
                    t1_low = c1.assertion.lower()
                    t2_low = c2.assertion.lower()
                    
                    # Check for metric similarity (e.g. revenue growth vs revenue expansion)
                    if c1.value_num is not None and c2.value_num is not None:
                        w1 = set(re.findall(r'\b\w{3,}\b', c1.subject.lower()))
                        w2 = set(re.findall(r'\b\w{3,}\b', c2.subject.lower()))
                        if (w1 & w2) or ("revenue" in t1_low and "revenue" in t2_low):
                            score += 0.60

                    # Check for debt topic overlap
                    if any(k in t1_low for k in ["debt", "credit facility", "debt notes"]) and \
                       any(k in t2_low for k in ["debt", "credit facility", "debt notes"]):
                        score += 0.60

                    # Check for international operations / footprint topic overlap
                    if any(k in t1_low for k in ["subsidiary", "subsidiaries", "international", "domestic"]) and \
                       any(k in t2_low for k in ["subsidiary", "subsidiaries", "international", "domestic"]):
                        score += 0.60

                    if score >= 0.20:
                        pairs.append((c1, c2, score))
        except Exception as e:
            print(f"[Pairing Error]: {e}")

        # Sort by similarity descending
        pairs.sort(key=lambda x: x[2], reverse=True)
        return pairs[:40]

    def _judge_contradiction(self, c1: ExtractedClaim, c2: ExtractedClaim) -> Optional[Tuple[str, str, Severity, str, str, str]]:
        """Judges whether two claims are contradictory."""
        t1 = c1.assertion.lower()
        t2 = c2.assertion.lower()

        # 1. Metric Value Contradiction
        # e.g., Page 1: "revenue growth 12%", Page 3: "revenue expansion 14%"
        if c1.value_num is not None and c2.value_num is not None and c1.metric_unit == c2.metric_unit:
            if abs(c1.value_num - c2.value_num) > 0.1:
                w1 = set(re.findall(r'\b\w{3,}\b', c1.subject.lower()))
                w2 = set(re.findall(r'\b\w{3,}\b', c2.subject.lower()))
                revenue_both = ("revenue" in t1 or "growth" in t1) and ("revenue" in t2 or "growth" in t2)
                if (w1 & w2) or revenue_both or (c1.subject in t2) or (c2.subject in t1):
                    unit_sym = "%" if c1.metric_unit == "%" else ""
                    return (
                        f"Direct Metric Contradiction: {c1.value_num}{unit_sym} vs {c2.value_num}{unit_sym}",
                        f"Page {c1.span.page} claims '{c1.subject}' reached {c1.value_num}{unit_sym}, while Page {c2.span.page} reports {c2.value_num}{unit_sym} for the same indicator.",
                        Severity.CRITICAL,
                        f"Consistent figure ({c1.value_num}{unit_sym} or {c2.value_num}{unit_sym})",
                        f"P.{c1.span.page}: {c1.value_num}{unit_sym} | P.{c2.span.page}: {c2.value_num}{unit_sym}",
                        f"Verify official source data and align metric to either {c1.value_num}{unit_sym} or {c2.value_num}{unit_sym} consistently."
                    )

        # 2. Polar Semantic Contradictions
        polar_opposites = [
            (
                ["zero debt", "zero-debt", "no debt", "debt-free", "zero long-term debt", "no external credit facilities"],
                ["credit facility", "debt notes", "convertible debt", "secured a $", "issued $", "liabilities of", "borrowings of"]
            ),
            (
                ["no foreign subsidiaries", "no international operations", "domestic footprint", "solely domestic", "exclusively domestic"],
                ["subsidiary operations", "subsidiaries in", "european union", "asia-pacific", "international operations"]
            ),
            (["terminated", "cancelled", "severed"], ["renewed", "extended", "active partnership"]),
            (["unanimously approved", "full board consent"], ["dissenting votes", "rejected by committee"]),
            (["decreased", "declined", "fell"], ["increased", "expanded", "grew"])
        ]

        for set_a, set_b in polar_opposites:
            match_a1 = any(k in t1 for k in set_a)
            match_b2 = any(k in t2 for k in set_b)
            match_b1 = any(k in t1 for k in set_b)
            match_a2 = any(k in t2 for k in set_a)

            if (match_a1 and match_b2) or (match_b1 and match_a2):
                topic = "Capital Structure" if ("debt" in t1 or "debt" in t2 or "credit" in t1 or "credit" in t2) else "Operational Footprint"
                return (
                    f"Polar Semantic Contradiction: {topic} Mismatch",
                    f"Page {c1.span.page} asserts an absolute state that is directly contradicted by Page {c2.span.page}.",
                    Severity.CRITICAL,
                    "Mutually aligned factual statements",
                    f"P.{c1.span.page}: \"{c1.span.text[:60]}...\" vs P.{c2.span.page}: \"{c2.span.text[:60]}...\"",
                    "Reconcile contradictory factual representations prior to publication or filing."
                )

        return None
