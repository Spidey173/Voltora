import type { BenchmarkMetrics } from '../types';

export const benchmarkData: BenchmarkMetrics = {
  total_documents: 5,
  total_pages: 12,
  clean_documents_tested: 2,
  clean_document_false_positives: 0,
  skipped_documents: [],
  avg_latency_per_page_ms: 69.9,
  overall_precision: 100.0,
  overall_recall: 100.0,
  overall_f1: 100.0,
  micro_metrics: {
    precision: 100.0,
    recall: 100.0,
    f1: 100.0
  },
  macro_metrics: {
    precision: 100.0,
    recall: 100.0,
    f1: 100.0
  },
  categories: {
    math_discrepancy: {
      ground_truth: 4,
      tp: 4,
      fp: 0,
      fn: 0,
      precision: 100.0,
      recall: 100.0,
      f1: 100.0
    },
    semantic_contradiction: {
      ground_truth: 3,
      tp: 3,
      fp: 0,
      fn: 0,
      precision: 100.0,
      recall: 100.0,
      f1: 100.0
    },
    temporal_inversion: {
      ground_truth: 4,
      tp: 4,
      fp: 0,
      fn: 0,
      precision: 100.0,
      recall: 100.0,
      f1: 100.0
    },
    unit_mismatch: {
      ground_truth: 1,
      tp: 1,
      fp: 0,
      fn: 0,
      precision: 100.0,
      recall: 100.0,
      f1: 100.0
    }
  },
  documents: [
    {
      doc_id: 'acme_fy24',
      file_path: 'sample_docs/acme_fy24_annual_report.pdf',
      is_clean: false,
      pages: 4,
      duration_ms: 329.1,
      health_score: 5,
      grade: 'F',
      detected_issues_count: 8,
      ground_truth_count: 8,
      matched_count: 8
    },
    {
      doc_id: 'apex_clean',
      file_path: 'sample_docs/clean_financial_statement.pdf',
      is_clean: true,
      pages: 3,
      duration_ms: 194.47,
      health_score: 100,
      grade: 'A+',
      detected_issues_count: 0,
      ground_truth_count: 0,
      matched_count: 0
    },
    {
      doc_id: 'vertex_energy',
      file_path: 'sample_docs/vertex_energy_audit.pdf',
      is_clean: false,
      pages: 2,
      duration_ms: 127.95,
      health_score: 70,
      grade: 'C',
      detected_issues_count: 2,
      ground_truth_count: 2,
      matched_count: 2
    },
    {
      doc_id: 'nova_clean',
      file_path: 'sample_docs/nova_clean_quarterly.pdf',
      is_clean: true,
      pages: 1,
      duration_ms: 64.03,
      health_score: 100,
      grade: 'A+',
      detected_issues_count: 0,
      ground_truth_count: 0,
      matched_count: 0
    },
    {
      doc_id: 'solaris_edge_cases',
      file_path: 'sample_docs/solaris_edge_cases.pdf',
      is_clean: false,
      pages: 2,
      duration_ms: 123.21,
      health_score: 70,
      grade: 'C',
      detected_issues_count: 2,
      ground_truth_count: 2,
      matched_count: 2
    }
  ]
};
