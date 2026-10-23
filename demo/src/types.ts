export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface SourceAnchor {
  page: number;
  bbox: BoundingBox;
  text: string;
  label?: string;
}

export type IssueSeverity = 'critical' | 'warning' | 'info' | 'verified';
export type IssueCategory = 'math_discrepancy' | 'semantic_contradiction' | 'temporal_inversion' | 'unit_mismatch' | 'factual_drift';
export type CheckType = 'deterministic' | 'heuristic';
export type IssueStatus = 'confirmed' | 'needs_review';

export interface AuditIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory | string;
  severity: IssueSeverity;
  confidence: number;
  check_type?: CheckType;
  status?: IssueStatus;
  explanation?: string;
  primary_anchor: SourceAnchor;
  secondary_anchor?: SourceAnchor;
  expected_value?: string;
  actual_value?: string;
  delta?: string;
  suggested_fix?: string;
  created_at?: number;
}

export interface PageEvidence {
  page: number;
  text_spans: Array<{ text: string; bbox: [number, number, number, number] }>;
  evidence_score: number;
  issue_ids: string[];
}

export interface AuditSummary {
  health_score: number;
  grade: string;
  total_issues: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  deterministic_count?: number;
  heuristic_count?: number;
  needs_review_count?: number;
  passed_checks_count?: number;
  verified_claims_count: number;
  tables_analyzed: number;
  pages_analyzed: number;
  audit_duration_ms: number;
}

export interface AuditReport {
  doc_id: string;
  doc_name: string;
  total_pages: number;
  summary: AuditSummary;
  issues: AuditIssue[];
  pages: PageEvidence[];
  created_at?: number;
}

export interface BenchmarkMetrics {
  total_documents?: number;
  total_pages?: number;
  clean_documents_tested?: number;
  clean_document_false_positives?: number;
  skipped_documents?: Array<{ doc_id: string; file_path: string; reason: string }>;
  avg_latency_per_page_ms?: number;
  overall_precision?: number;
  overall_recall?: number;
  overall_f1?: number;
  micro_metrics?: { precision?: number; recall?: number; f1?: number };
  macro_metrics?: { precision?: number; recall?: number; f1?: number };
  categories?: Record<string, { ground_truth?: number; tp?: number; fp?: number; fn?: number; precision?: number; recall?: number; f1?: number }>;
  documents?: Array<{
    doc_id: string;
    file_path?: string;
    is_clean?: boolean;
    pages?: number;
    duration_ms?: number;
    health_score?: number;
    grade?: string;
    detected_issues_count?: number;
    ground_truth_count?: number;
    matched_count?: number;
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  citations?: Array<{ page: number; text: string }>;
  suggestedAction?: string;
  suggestedFollowups?: string[];
  memoReady?: boolean;
  relevantIssueIds?: string[];
}
