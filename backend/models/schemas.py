from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field
from enum import Enum
import time

class Severity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"
    VERIFIED = "verified"

class IssueCategory(str, Enum):
    MATH = "math_discrepancy"
    CONTRADICTION = "semantic_contradiction"
    TEMPORAL = "temporal_inversion"
    UNIT = "unit_mismatch"
    FACTUAL_DRIFT = "factual_drift"

class BoundingBox(BaseModel):
    """Normalized coordinates [0.0, 1.0] relative to page dimensions."""
    x0: float = Field(..., description="Left coordinate (0-1)")
    y0: float = Field(..., description="Top coordinate (0-1)")
    x1: float = Field(..., description="Right coordinate (0-1)")
    y1: float = Field(..., description="Bottom coordinate (0-1)")

class SourceAnchor(BaseModel):
    page: int = Field(..., description="1-indexed page number")
    bbox: BoundingBox
    text: str = Field(..., description="Exact quoted text from document")
    label: Optional[str] = None  # e.g. "Primary Claim", "Conflicting Source", "Table Total"

class AuditIssue(BaseModel):
    id: str
    title: str
    description: str
    category: IssueCategory
    severity: Severity
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    primary_anchor: SourceAnchor
    secondary_anchor: Optional[SourceAnchor] = None
    expected_value: Optional[str] = None
    actual_value: Optional[str] = None
    delta: Optional[str] = None
    suggested_fix: Optional[str] = None
    created_at: float = Field(default_factory=time.time)

class PageEvidence(BaseModel):
    page: int
    text_spans: List[Dict[str, Any]] = []
    evidence_score: float = Field(default=1.0, description="0.0 (red/severe issues) to 1.0 (green/verified)")
    issue_ids: List[str] = []

class AuditSummary(BaseModel):
    health_score: int = Field(..., description="Document integrity score (0-100)")
    grade: str = Field(..., description="A+, A, B, C, D, F")
    total_issues: int
    critical_count: int
    warning_count: int
    info_count: int
    verified_claims_count: int
    tables_analyzed: int
    pages_analyzed: int
    audit_duration_ms: float

class AuditReport(BaseModel):
    doc_id: str
    doc_name: str
    total_pages: int
    summary: AuditSummary
    issues: List[AuditIssue]
    pages: List[PageEvidence]
    created_at: float = Field(default_factory=time.time)

class AskIssueRequest(BaseModel):
    issue_id: str
    question: str

class AskIssueResponse(BaseModel):
    issue_id: str
    answer: str
    evidence_quote_a: str
    evidence_quote_b: Optional[str] = None
    resolution_recommendation: str

class ChatDocRequest(BaseModel):
    query: str

class ChatDocResponse(BaseModel):
    answer: str
    relevant_pages: List[int] = []
    relevant_issue_ids: List[str] = []
    suggested_followups: List[str] = []
    memo_ready: bool = False
