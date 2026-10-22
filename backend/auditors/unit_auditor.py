import re
import uuid
from typing import List, Dict, Tuple
from backend.auditors.base import BaseAuditor
from backend.parsers.pdf_parser import ParsedDocument
from backend.models.schemas import AuditIssue, Severity, IssueCategory, SourceAnchor, BoundingBox

SCALE_MAP = {
    "thousand": 1e3, "thousands": 1e3, "k": 1e3,
    "million": 1e6, "millions": 1e6, "m": 1e6,
    "billion": 1e9, "billions": 1e9, "b": 1e9,
    "trillion": 1e12, "trillions": 1e12, "t": 1e12,
}

class ExtractedMetric:
    def __init__(self, metric_name: str, value: float, unit: str, scale_str: str, text: str, page: int, bbox: Tuple[float, float, float, float]):
        self.metric_name = metric_name.lower().strip()
        self.value = value
        self.unit = unit
        self.scale_str = scale_str
        self.text = text
        self.page = page
        self.bbox = bbox

class UnitAuditor(BaseAuditor):
    @property
    def name(self) -> str:
        return "Unit & Scale Consistency Auditor"

    def audit(self, parsed: ParsedDocument) -> List[AuditIssue]:
        issues: List[AuditIssue] = []
        metrics: List[ExtractedMetric] = []

        # Pattern: [Metric Name] [was/were/is/are/reached/totaled/aggregated to] [$€£]? [Value] [Million/Billion/Thousand]
        pattern = re.compile(
            r'\b([a-zA-Z\s]{3,40})\s+(?:was|were|is|are|reached|totaled|totalled|stood\s+at|amounted\s+to|aggregated\s+to|of)\s+([$€£¥]?)\s*([0-9]+(?:\.[0-9]+)?)\s*(million|billion|thousand|trillion|m|b|k)?\b',
            re.IGNORECASE
        )

        for span in parsed.spans:
            text = span.text
            for match in pattern.finditer(text):
                metric_raw = match.group(1).strip()
                # Clean metric name
                metric_clean = re.sub(r'^(the|our|total|company\'s|annual|consolidated|reported|net)\s+', '', metric_raw, flags=re.IGNORECASE).strip()
                metric_clean = re.sub(r'\s+(for|across|in|of)\s+.*$', '', metric_clean, flags=re.IGNORECASE).strip()
                metric_clean = metric_clean.replace("expenditures", "expenses").replace("expenditure", "expense")
                
                if len(metric_clean.split()) > 4 or len(metric_clean) < 3:
                    continue
                
                currency = match.group(2) or ""
                val_num = float(match.group(3))
                scale_word = (match.group(4) or "").lower()
                scale_factor = SCALE_MAP.get(scale_word, 1.0)
                
                full_val = val_num * scale_factor
                unit = currency or ("%" if "%" in text else "count")
                
                metrics.append(ExtractedMetric(
                    metric_name=metric_clean,
                    value=full_val,
                    unit=unit,
                    scale_str=scale_word or "units",
                    text=match.group(0),
                    page=span.page,
                    bbox=span.bbox
                ))

        # Check for scale or currency discrepancies between identical metric names across pages
        for i in range(len(metrics)):
            for j in range(i + 1, len(metrics)):
                m1 = metrics[i]
                m2 = metrics[j]
                
                # If metric names match or have very high overlap
                words1 = set(m1.metric_name.split())
                words2 = set(m2.metric_name.split())
                if words1 == words2 and m1.page != m2.page:
                    # 1. Scale mismatch (e.g. Millions vs Billions)
                    if m1.scale_str != m2.scale_str and m1.scale_str != "units" and m2.scale_str != "units":
                        ratio = max(m1.value, m2.value) / max(min(m1.value, m2.value), 1.0)
                        if ratio >= 100.0:  # factor of 1,000x or 1,000,000x difference!
                            issues.append(AuditIssue(
                                id=f"unit-scale-{m1.page}-{m2.page}-{uuid.uuid4().hex[:6]}",
                                title=f"Scale Order-of-Magnitude Mismatch: '{m1.scale_str.capitalize()}' vs '{m2.scale_str.capitalize()}'",
                                description=f"'{m1.metric_name}' is quoted as {m1.text} on Page {m1.page}, but reported as {m2.text} on Page {m2.page} (Factor of {ratio:,.0f}x difference).",
                                category=IssueCategory.UNIT,
                                severity=Severity.CRITICAL,
                                confidence=0.96,
                                primary_anchor=SourceAnchor(
                                    page=m1.page,
                                    bbox=BoundingBox(x0=m1.bbox[0], y0=m1.bbox[1], x1=m1.bbox[2], y1=m1.bbox[3]),
                                    text=m1.text,
                                    label=f"Page {m1.page} Scale: {m1.scale_str}"
                                ),
                                secondary_anchor=SourceAnchor(
                                    page=m2.page,
                                    bbox=BoundingBox(x0=m2.bbox[0], y0=m2.bbox[1], x1=m2.bbox[2], y1=m2.bbox[3]),
                                    text=m2.text,
                                    label=f"Page {m2.page} Scale: {m2.scale_str}"
                                ),
                                expected_value=f"Consistent scale for '{m1.metric_name}'",
                                actual_value=f"{m1.scale_str} vs {m2.scale_str}",
                                delta=f"{ratio:,.0f}x discrepancy",
                                suggested_fix=f"Standardize units across Page {m1.page} and Page {m2.page}."
                            ))

                    # 2. Currency mismatch ($ vs €)
                    if m1.unit and m2.unit and m1.unit in ["$", "€", "£", "¥"] and m2.unit in ["$", "€", "£", "¥"] and m1.unit != m2.unit:
                        issues.append(AuditIssue(
                            id=f"unit-curr-{m1.page}-{m2.page}-{uuid.uuid4().hex[:6]}",
                            title=f"Currency Inconsistency: '{m1.unit}' vs '{m2.unit}' without FX Conversion",
                            description=f"Page {m1.page} reports '{m1.metric_name}' in {m1.unit}, whereas Page {m2.page} states it in {m2.unit}.",
                            category=IssueCategory.UNIT,
                            severity=Severity.WARNING,
                            confidence=0.94,
                            primary_anchor=SourceAnchor(
                                page=m1.page,
                                bbox=BoundingBox(x0=m1.bbox[0], y0=m1.bbox[1], x1=m1.bbox[2], y1=m1.bbox[3]),
                                text=m1.text,
                                label=f"Page {m1.page} Currency: {m1.unit}"
                            ),
                            secondary_anchor=SourceAnchor(
                                page=m2.page,
                                bbox=BoundingBox(x0=m2.bbox[0], y0=m2.bbox[1], x1=m2.bbox[2], y1=m2.bbox[3]),
                                text=m2.text,
                                label=f"Page {m2.page} Currency: {m2.unit}"
                            ),
                            expected_value="Consistent reporting currency",
                            actual_value=f"{m1.unit} vs {m2.unit}",
                            delta="Currency divergence",
                            suggested_fix="Define a single base presentation currency or provide explicit foreign exchange conversion rates."
                        ))

        return issues
