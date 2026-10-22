import unittest
from backend.models.schemas import (
    CheckType,
    IssueCategory,
)
from backend.parsers.pdf_parser import ParsedDocument, ExtractedSpan, ExtractedTable
from backend.auditors.math_auditor import MathAuditor
from backend.auditors.semantic_auditor import SemanticAuditor
from backend.auditors.temporal_auditor import TemporalAuditor
from backend.auditors.unit_auditor import UnitAuditor


def make_doc(pages_spans: list[list[str]]) -> ParsedDocument:
    parsed = ParsedDocument(doc_id="test_doc", title="test.pdf", total_pages=len(pages_spans))
    for p_num, spans_text in enumerate(pages_spans, start=1):
        parsed.page_dimensions[p_num] = (612.0, 792.0)
        parsed.pages_text[p_num] = "\n".join(spans_text)
        for t in spans_text:
            parsed.spans.append(
                ExtractedSpan(
                    text=t,
                    page=p_num,
                    bbox=(0.1, 0.1, 0.9, 0.2),
                    raw_bbox=(10.0, 10.0, 200.0, 30.0),
                )
            )
    return parsed


class TestAuditors(unittest.TestCase):
    def test_math_addition_mismatch_is_deterministic_with_explanation(self):
        """Verify addition mismatch is classified as DETERMINISTIC and includes derivation."""
        doc = make_doc([
            [
                "Product Sales: $100M",
                "Service Revenue: $45M",
                "Total Revenue: $165M",
            ]
        ])
        doc.tables.append(
            ExtractedTable(
                page=1,
                bbox=(0.1, 0.1, 0.9, 0.9),
                headers=["Segment", "Amount"],
                rows=[
                    ["Product Sales", "100.00"],
                    ["Service Revenue", "45.00"],
                    ["Total Revenue", "165.00"],
                ],
                raw_cells=[],
            )
        )
        auditor = MathAuditor()
        issues = auditor.audit(doc)

        self.assertGreaterEqual(len(issues), 1)
        issue = next((i for i in issues if i.category == IssueCategory.MATH), None)
        self.assertIsNotNone(issue)
        self.assertEqual(issue.check_type, CheckType.DETERMINISTIC)
        self.assertIn("100.00", issue.explanation)
        self.assertIn("45.00", issue.explanation)
        self.assertIn("165.00", issue.explanation)

    def test_math_percentage_distribution_mismatch(self):
        """Verify percentages that do not sum to 100% are flagged deterministically."""
        doc = make_doc([
            [
                "60% in North America, 30% in Europe, and 5% in Asia, totaling 100% of deliveries.",
            ]
        ])
        auditor = MathAuditor()
        issues = auditor.audit(doc)

        dist_issues = [i for i in issues if "percentage breakdown" in i.title.lower()]
        self.assertEqual(len(dist_issues), 1)
        self.assertEqual(dist_issues[0].check_type, CheckType.DETERMINISTIC)
        self.assertIn("95.0%", dist_issues[0].explanation)

    def test_semantic_different_periods_do_not_contradict(self):
        """Revenue in FY23 vs FY24 should NOT trigger a contradiction."""
        doc = make_doc([
            ["In FY23, consolidated revenue was $120M."],
            ["In FY24, consolidated revenue was $160M."],
        ])
        auditor = SemanticAuditor()
        issues = auditor.audit(doc)

        contradictions = [i for i in issues if i.category == IssueCategory.CONTRADICTION]
        self.assertEqual(len(contradictions), 0, "Different fiscal periods must not trigger a contradiction")

    def test_semantic_same_period_contradiction_is_heuristic(self):
        """Conflicting statements for the same period must trigger a heuristic finding."""
        doc = make_doc([
            ["The company maintains zero outstanding debt under any credit facilities in FY24."],
            ["The company drew $120 million under its revolving credit facility in FY24."],
        ])
        auditor = SemanticAuditor()
        issues = auditor.audit(doc)

        contradictions = [i for i in issues if i.category == IssueCategory.CONTRADICTION]
        self.assertGreaterEqual(len(contradictions), 1)
        self.assertEqual(contradictions[0].check_type, CheckType.HEURISTIC)
        self.assertIsNotNone(contradictions[0].explanation)

    def test_temporal_distinct_projects_do_not_trigger_contradiction(self):
        """Events referring to distinct projects (e.g. Titan vs Genesis) must not trigger a contradiction."""
        doc = make_doc([
            ["Project Titan commercial deployment started in January 2024."],
            ["Project Genesis commercial deployment completed in December 2023."],
        ])
        auditor = TemporalAuditor()
        issues = auditor.audit(doc)

        temporal_issues = [i for i in issues if i.category == IssueCategory.TEMPORAL]
        self.assertEqual(len(temporal_issues), 0, "Distinct projects must not be cross-matched as contradictions")

    def test_unit_scale_divergence_detected(self):
        """Order-of-magnitude unit scale discrepancies (e.g., $42.5B vs $42.5M) are flagged."""
        doc = make_doc([
            ["Total operating expenses reached $42.5B in FY24."],
            ["Operating expenses were $42.5M in FY24."],
        ])
        auditor = UnitAuditor()
        issues = auditor.audit(doc)

        unit_issues = [i for i in issues if i.category == IssueCategory.UNIT]
        self.assertGreaterEqual(len(unit_issues), 1)
        self.assertEqual(unit_issues[0].check_type, CheckType.DETERMINISTIC)
        self.assertIn("1,000x", unit_issues[0].description)


if __name__ == "__main__":
    unittest.main()
