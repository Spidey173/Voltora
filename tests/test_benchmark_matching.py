"""
Tests for benchmark evaluation matching logic and metrics calculation.
Verifies that benchmark scoring strictly enforces category, page, and evidence tokens,
and rejects loose category-only or loose single-page overlap.
"""
import unittest
from eval.run_benchmark import matches_ground_truth
from backend.models.schemas import (
    AuditIssue,
    IssueCategory,
    Severity,
    CheckType,
    IssueStatus,
    SourceAnchor,
    BoundingBox,
)


def make_issue(
    issue_id: str,
    title: str,
    desc: str,
    category: IssueCategory,
    page: int,
    sec_page: int | None = None,
) -> AuditIssue:
    return AuditIssue(
        id=issue_id,
        title=title,
        description=desc,
        category=category,
        severity=Severity.CRITICAL,
        confidence=0.95,
        check_type=CheckType.DETERMINISTIC,
        status=IssueStatus.CONFIRMED,
        primary_anchor=SourceAnchor(
            page=page,
            bbox=BoundingBox(x0=0.1, y0=0.1, x1=0.9, y1=0.2),
            text=desc,
        ),
        secondary_anchor=(
            SourceAnchor(
                page=sec_page,
                bbox=BoundingBox(x0=0.1, y0=0.1, x1=0.9, y1=0.2),
                text=desc,
            )
            if sec_page
            else None
        ),
    )


class TestBenchmarkMatching(unittest.TestCase):
    def test_strict_matching_success(self):
        """A finding matching category, primary page, and evidence tokens is accepted."""
        gt = {
            "id": "gt_math_01",
            "category": "math_discrepancy",
            "page": 3,
            "description": "Component sum $145M fails to tie to $165M",
            "evidence_keywords": ["145", "165", "revenue"],
        }
        issue = make_issue(
            "iss_1",
            "Table Column Math Mismatch",
            "Sum of components $145M does not tie to stated Total Revenue of $165M",
            IssueCategory.MATH,
            page=3,
        )
        self.assertTrue(matches_ground_truth(issue, gt))

    def test_category_mismatch_rejected(self):
        """Even with identical page and evidence tokens, mismatched category is rejected."""
        gt = {
            "id": "gt_math_01",
            "category": "math_discrepancy",
            "page": 3,
            "description": "Component sum $145M fails to tie to $165M",
            "evidence_keywords": ["145", "165"],
        }
        issue = make_issue(
            "iss_2",
            "Semantic Contradiction",
            "Found $145M and $165M in conflict",
            IssueCategory.CONTRADICTION,
            page=3,
        )
        self.assertFalse(matches_ground_truth(issue, gt))

    def test_page_mismatch_rejected(self):
        """Category and keywords match, but different page is rejected (no loose matching)."""
        gt = {
            "id": "gt_math_01",
            "category": "math_discrepancy",
            "page": 3,
            "description": "Component sum $145M fails to tie to $165M",
            "evidence_keywords": ["145", "165"],
        }
        issue = make_issue(
            "iss_3",
            "Math Discrepancy",
            "Found $145M and $165M total sum mismatch",
            IssueCategory.MATH,
            page=1,  # Page 1 instead of Page 3
        )
        self.assertFalse(matches_ground_truth(issue, gt))

    def test_missing_evidence_tokens_rejected(self):
        """Category and page match, but none of the required evidence keywords are present."""
        gt = {
            "id": "gt_math_01",
            "category": "math_discrepancy",
            "page": 3,
            "description": "Component sum $145M fails to tie to $165M",
            "evidence_keywords": ["145", "165", "product sales"],
        }
        issue = make_issue(
            "iss_4",
            "Math Discrepancy",
            "General rounding variance detected on line item summary",
            IssueCategory.MATH,
            page=3,
        )
        self.assertFalse(matches_ground_truth(issue, gt))

    def test_cross_page_matching_requires_both_pages(self):
        """Cross-page ground truth requires both primary and secondary pages."""
        gt = {
            "id": "gt_contra_01",
            "category": "semantic_contradiction",
            "page": 1,
            "secondary_page": 4,
            "description": "Footnote facility contradiction",
            "evidence_keywords": ["credit", "debt"],
        }
        # Issue only anchors to page 1 without secondary anchor
        issue_single = make_issue(
            "iss_single",
            "Semantic Contradiction",
            "Zero debt claimed on credit facility",
            IssueCategory.CONTRADICTION,
            page=1,
        )
        self.assertFalse(matches_ground_truth(issue_single, gt))

        # Issue anchors to both page 1 and page 4
        issue_cross = make_issue(
            "iss_cross",
            "Semantic Contradiction",
            "Zero debt claimed on credit facility",
            IssueCategory.CONTRADICTION,
            page=1,
            sec_page=4,
        )
        self.assertTrue(matches_ground_truth(issue_cross, gt))


if __name__ == "__main__":
    unittest.main()
