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

export interface AuditIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory | string;
  severity: IssueSeverity;
  confidence: number;
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
  execution_time_seconds?: number;
  overall?: {
    precision?: number;
    recall?: number;
    f1_score?: number;
  };
  by_category?: Record<string, { precision?: number; recall?: number; f1_score?: number }>;
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
