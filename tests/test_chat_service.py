"""
Tests for evidence-grounded, qualified chat recommendations and safe fallbacks.
"""
import unittest
from backend.services.chat_service import ChatService
from backend.models.schemas import (
    AuditReport,
    AuditSummary,
    AuditIssue,
    IssueCategory,
    Severity,
    CheckType,
    IssueStatus,
    SourceAnchor,
    BoundingBox,
)


def make_report(doc_id: str, doc_name: str, issues: list[AuditIssue]) -> AuditReport:
    crit_count = sum(1 for i in issues if i.severity == Severity.CRITICAL)
    warn_count = sum(1 for i in issues if i.severity == Severity.WARNING)
    summary = AuditSummary(
        health_score=100 if len(issues) == 0 else 68,
        grade="A" if len(issues) == 0 else "D",
        total_issues=len(issues),
        critical_count=crit_count,
        warning_count=warn_count,
        info_count=0,
        pages_analyzed=4,
        tables_analyzed=2,
        audit_duration_ms=100.0,
        deterministic_count=len(issues),
        heuristic_count=0,
        needs_review_count=0,
        passed_checks_count=12,
    )
    return AuditReport(
        doc_id=doc_id,
        doc_name=doc_name,
        total_pages=4,
        summary=summary,
        issues=issues,
        pages=[],
        processing_time_ms=120.0,
    )


class TestChatService(unittest.TestCase):
    def setUp(self):
        self.chat_svc = ChatService()

    def test_clean_document_query_has_no_canned_acme_violations(self):
        """Clean document answers must NOT claim SEC rejections, SOX civil actions, or Acme figures."""
        report = make_report("clean_doc_01", "nova_clean_quarterly.pdf", [])
        resp = self.chat_svc.answer_document_query(report, "What discrepancies were found in this document?")

        answer = resp.answer.lower()
        self.assertNotIn("145m", answer)
        self.assertNotIn("sox 302 civil regulatory action", answer)
        self.assertNotIn("sec edgar rejection", answer)
        self.assertIn("no discrepancies", answer)

    def test_document_with_issues_grounds_in_actual_findings(self):
        """Document findings must cite the actual issues of the provided report."""
        issue = AuditIssue(
            id="solar_math_01",
            title="Solar Turbine Math Mismatch",
            description="Turbine energy generation totaled 450 GWh vs stated 600 GWh on Page 2",
            category=IssueCategory.MATH,
            severity=Severity.CRITICAL,
            confidence=0.98,
            check_type=CheckType.DETERMINISTIC,
            status=IssueStatus.CONFIRMED,
            explanation="Deterministic calculation: 450 GWh != 600 GWh",
            primary_anchor=SourceAnchor(
                page=2,
                bbox=BoundingBox(x0=0.1, y0=0.1, x1=0.9, y1=0.2),
                text="Turbine total: 600 GWh",
            ),
        )
        report = make_report("vertex_01", "vertex_energy_audit.pdf", [issue])
        resp = self.chat_svc.answer_document_query(report, "Summarize top discrepancies")

        answer = resp.answer
        self.assertIn("Solar Turbine Math Mismatch", answer)
        self.assertIn("Page 2", answer)
        # Verify it does not mention unrelated Acme annual report figures
        self.assertNotIn("Acme Corporation", answer)
        self.assertNotIn("$165M", answer)

    def test_audit_memo_draft_is_qualified_and_non_authoritative(self):
        """Audit memo must advise internal review, not claim legal or regulatory final authority."""
        issue = AuditIssue(
            id="solar_math_01",
            title="Solar Turbine Math Mismatch",
            description="Turbine energy generation totaled 450 GWh vs stated 600 GWh on Page 2",
            category=IssueCategory.MATH,
            severity=Severity.CRITICAL,
            confidence=0.98,
            check_type=CheckType.DETERMINISTIC,
            status=IssueStatus.CONFIRMED,
            explanation="Deterministic calculation: 450 GWh != 600 GWh",
            primary_anchor=SourceAnchor(
                page=2,
                bbox=BoundingBox(x0=0.1, y0=0.1, x1=0.9, y1=0.2),
                text="Turbine total: 600 GWh",
            ),
        )
        report = make_report("issue_doc", "quarterly_audit.pdf", [issue])
        resp = self.chat_svc.answer_document_query(report, "Draft audit resolution memo")

        answer = resp.answer
        self.assertIn("MEMORANDUM", answer)
        self.assertTrue(resp.memo_ready)
        # Should contain qualified notice that it is a tool-assisted review
        self.assertTrue(
            "automated" in answer.lower() or "independent audit" in answer.lower() or "internal review" in answer.lower()
        )

    def test_clean_document_never_claims_fully_verified(self):
        """A clean document check notes absence of issues within evaluated rules, not absolute verification."""
        report = make_report("clean_doc_02", "quarterly_clean.pdf", [])
        resp = self.chat_svc.answer_document_query(report, "What is the audit status?")

        answer = resp.answer
        self.assertIn("does not constitute an institutional audit opinion", answer)


if __name__ == "__main__":
    unittest.main()
