import re
import uuid
from typing import List, Optional, Tuple
from backend.auditors.base import BaseAuditor
from backend.parsers.pdf_parser import ParsedDocument, PDFParser
from backend.models.schemas import AuditIssue, Severity, IssueCategory, SourceAnchor, BoundingBox

def clean_numeric_str(val: str) -> Optional[float]:
    """Parses numeric strings like '$1,250.50', '(45.2)', '14%', '12.5M' to float."""
    if not val:
        return None
    s = val.strip().replace(",", "")
    s = re.sub(r'\s+', '', s)
    # Check for negative accounting format (e.g. (100))
    is_negative = False
    if s.startswith("(") and s.endswith(")"):
        is_negative = True
        s = s[1:-1]
    
    # Strip currency or symbols
    s = re.sub(r'[$€£¥%]', '', s).strip()
    
    # Multipliers
    mult = 1.0
    if s.endswith("k") or s.endswith("K"):
        mult = 1e3
        s = s[:-1]
    elif s.endswith("m") or s.endswith("M"):
        mult = 1e6
        s = s[:-1]
    elif s.endswith("b") or s.endswith("B"):
        mult = 1e9
        s = s[:-1]
        
    try:
        num = float(s) * mult
        return -num if is_negative else num
    except ValueError:
        return None

class MathAuditor(BaseAuditor):
    @property
    def name(self) -> str:
        return "Deterministic Mathematical Auditor"

    def audit(self, parsed: ParsedDocument) -> List[AuditIssue]:
        issues: List[AuditIssue] = []
        
        # 1. Audit tables
        table_issues = self._audit_tables(parsed)
        issues.extend(table_issues)
        
        # 2. Audit in-text growth calculations and additions
        in_text_issues = self._audit_in_text_math(parsed)
        issues.extend(in_text_issues)
        
        return issues

    def _audit_tables(self, parsed: ParsedDocument) -> List[AuditIssue]:
        issues = []
        for tbl_idx, table in enumerate(parsed.tables):
            # Check for Total row
            total_row_idx = None
            for r_idx, row in enumerate(table.rows):
                first_cell = row[0].lower() if row else ""
                tokens = set(re.findall(r'\b\w+\b', first_cell))
                if tokens & {"total", "sum", "subtotal", "aggregate"} or "total" in first_cell:
                    total_row_idx = r_idx
                    break
            
            if total_row_idx is not None and total_row_idx > 0:
                # Check each numeric column
                num_cols = len(table.rows[0])
                for c_idx in range(1, num_cols):
                    col_values = []
                    valid = True
                    for r_idx in range(total_row_idx):
                        if c_idx < len(table.rows[r_idx]):
                            val_str = table.rows[r_idx][c_idx]
                            num = clean_numeric_str(val_str)
                            if num is not None:
                                col_values.append(num)
                            elif val_str and val_str != "-":
                                valid = False
                                break
                    
                    if valid and len(col_values) >= 2:
                        expected_sum = sum(col_values)
                        if c_idx < len(table.rows[total_row_idx]):
                            stated_total_str = table.rows[total_row_idx][c_idx]
                            stated_total = clean_numeric_str(stated_total_str)
                            if stated_total is not None:
                                delta = abs(stated_total - expected_sum)
                                # Allow tiny rounding margin
                                if delta > 0.05 * max(abs(stated_total), 1.0) and delta > 0.01:
                                    col_name = table.headers[c_idx] if c_idx < len(table.headers) else f"Column {c_idx+1}"
                                    row_name = table.rows[total_row_idx][0]
                                    
                                    # Locate span on the page
                                    span = PDFParser.find_best_span_for_text(parsed, stated_total_str, page=table.page)
                                    tbl_bbox = table.bbox
                                    bbox = BoundingBox(
                                        x0=span.bbox[0] if span else tbl_bbox[0],
                                        y0=span.bbox[1] if span else tbl_bbox[1],
                                        x1=span.bbox[2] if span else tbl_bbox[2],
                                        y1=span.bbox[3] if span else tbl_bbox[3],
                                    )
                                    
                                    issues.append(AuditIssue(
                                        id=f"math-tbl-{table.page}-{tbl_idx}-{c_idx}",
                                        title=f"Table Summation Mismatch in '{col_name}'",
                                        description=f"Column items sum up to {expected_sum:,.2f}, but the stated '{row_name}' is {stated_total:,.2f}. Discrepancy of {delta:,.2f}.",
                                        category=IssueCategory.MATH,
                                        severity=Severity.CRITICAL if delta > 1.0 else Severity.WARNING,
                                        confidence=0.99,
                                        primary_anchor=SourceAnchor(
                                            page=table.page,
                                            bbox=bbox,
                                            text=f"{row_name}: {stated_total_str} (Computed sum of components: {expected_sum:,.2f})",
                                            label="Stated Table Total"
                                        ),
                                        expected_value=f"{expected_sum:,.2f}",
                                        actual_value=f"{stated_total:,.2f}",
                                        delta=f"{delta:,.2f}",
                                        suggested_fix=f"Update table total to {expected_sum:,.2f} or review individual line items."
                                    ))

        return issues

    def _audit_in_text_math(self, parsed: ParsedDocument) -> List[AuditIssue]:
        issues = []
        
        # Regex for percentage growth statements:
        # e.g., "grew by 14% from $100M to $112M" or "increased 25% from 80 to 95"
        growth_pattern = re.compile(
            r'(?:grew|increased|rose|expanded|surged)\s+(?:by\s+)?([0-9]+(?:\.[0-9]+)?)\s*%\s+(?:from\s+)?[$€£]?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m|b|million|billion|thousand)?\s+to\s+[$€£]?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m|b|million|billion|thousand)?',
            re.IGNORECASE
        )
        
        # Regex for distribution sums:
        # e.g., "40% in Europe, 30% in Asia, and 20% in the Americas, totaling 100%"
        percent_total_pattern = re.compile(
            r'([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:in|for|from)[^.,;]+?,\s*([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:in|for|from)[^.,;]+?,?\s*(?:and\s*)?([0-9]+(?:\.[0-9]+)?)\s*%\s*[^;]+?(?:totaling|accounting for)\s*100\s*%',
            re.IGNORECASE
        )

        for span in parsed.spans:
            text = span.text
            
            # Check growth calculation
            for match in growth_pattern.finditer(text):
                stated_pct = float(match.group(1))
                val_from = float(match.group(2))
                val_to = float(match.group(4))
                
                if val_from > 0:
                    calculated_pct = ((val_to - val_from) / val_from) * 100.0
                    delta_pct = abs(stated_pct - calculated_pct)
                    if delta_pct > 1.0:  # more than 1% discrepancy
                        issues.append(AuditIssue(
                            id=f"math-growth-{span.page}-{uuid.uuid4().hex[:6]}",
                            title=f"Inaccurate Percentage Calculation: Stated {stated_pct:.1f}% vs Actual {calculated_pct:.1f}%",
                            description=f"Text claims an increase of {stated_pct:.1f}% from {val_from} to {val_to}, but mathematical growth is {calculated_pct:.1f}%. Discrepancy of {delta_pct:.1f} percentage points.",
                            category=IssueCategory.MATH,
                            severity=Severity.CRITICAL if delta_pct > 3.0 else Severity.WARNING,
                            confidence=0.98,
                            primary_anchor=SourceAnchor(
                                page=span.page,
                                bbox=BoundingBox(x0=span.bbox[0], y0=span.bbox[1], x1=span.bbox[2], y1=span.bbox[3]),
                                text=match.group(0),
                                label="Percentage Claim"
                            ),
                            expected_value=f"{calculated_pct:.1f}%",
                            actual_value=f"{stated_pct:.1f}%",
                            delta=f"{delta_pct:.1f}%",
                            suggested_fix=f"Correct stated growth rate from {stated_pct:.1f}% to {calculated_pct:.1f}%."
                        ))

            # Check percentage distribution sum in text
            for match in percent_total_pattern.finditer(text):
                p1 = float(match.group(1))
                p2 = float(match.group(2))
                p3 = float(match.group(3))
                total_pct = p1 + p2 + p3
                if abs(total_pct - 100.0) > 0.5:
                    issues.append(AuditIssue(
                        id=f"math-dist-{span.page}-{uuid.uuid4().hex[:6]}",
                        title=f"Percentage Breakdown Does Not Equal 100%",
                        description=f"Distribution shares ({p1:.1f}%, {p2:.1f}%, {p3:.1f}%) sum up to {total_pct:.1f}%, but are claimed to total 100%.",
                        category=IssueCategory.MATH,
                        severity=Severity.WARNING,
                        confidence=0.99,
                        primary_anchor=SourceAnchor(
                            page=span.page,
                            bbox=BoundingBox(x0=span.bbox[0], y0=span.bbox[1], x1=span.bbox[2], y1=span.bbox[3]),
                            text=match.group(0),
                            label="Percentage Breakdown"
                        ),
                        expected_value="100.0%",
                        actual_value=f"{total_pct:.1f}%",
                        delta=f"{abs(total_pct - 100.0):.1f}%",
                        suggested_fix=f"Adjust breakdown components to sum to exactly 100% (currently {total_pct:.1f}%)."
                    ))

            # Check percentage distribution in bullet lists or breakdown text
            text_lower = text.lower()
            if any(k in text_lower for k in ["distributed as follows", "revenue contribution", "segment breakdown", "percentage distribution", "allocation"]):
                pct_matches = [float(p) for p in re.findall(r'([0-9]+(?:\.[0-9]+)?)\s*%', text)]
                components = [p for p in pct_matches if abs(p - 100.0) > 0.01]
                if len(components) >= 2:
                    total_pct = sum(components)
                    if abs(total_pct - 100.0) > 0.5:
                        delta_pct = abs(total_pct - 100.0)
                        issues.append(AuditIssue(
                            id=f"math-dist-{span.page}-{uuid.uuid4().hex[:6]}",
                            title=f"Percentage Distribution Does Not Equal 100% (Sum: {total_pct:.1f}%)",
                            description=f"Segment allocations ({' + '.join(f'{p:.1f}%' for p in components)} = {total_pct:.1f}%) fail to reconcile to 100.0%. Discrepancy of {delta_pct:.1f} percentage points.",
                            category=IssueCategory.MATH,
                            severity=Severity.CRITICAL if delta_pct > 5.0 else Severity.WARNING,
                            confidence=0.99,
                            primary_anchor=SourceAnchor(
                                page=span.page,
                                bbox=BoundingBox(x0=span.bbox[0], y0=span.bbox[1], x1=span.bbox[2], y1=span.bbox[3]),
                                text=span.text[:120],
                                label="Percentage Allocation"
                            ),
                            expected_value="100.0%",
                            actual_value=f"{total_pct:.1f}%",
                            delta=f"{delta_pct:.1f}%",
                            suggested_fix=f"Reconcile percentage components to sum to exactly 100.0% (currently {total_pct:.1f}%)."
                        ))

        return issues
