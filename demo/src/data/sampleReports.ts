import type { AuditReport } from '../types';
import rawData from './sampleReports.json';

export const sampleReports: Record<string, AuditReport> = rawData as unknown as Record<string, AuditReport>;

export interface SampleDocMeta {
  id: string;
  title: string;
  subtitle: string;
  pages: number;
  issuesCount: number;
  healthScore: number;
  grade: string;
  isClean: boolean;
  tags: string[];
}

export interface SampleReportMetadata {
  id: string;
  title: string;
  pages: number;
  issuesCount: number;
}

export const sampleDocMetadata: SampleDocMeta[] = [
  {
    id: 'acme_fy24_annual_report',
    title: 'Acme Corp FY24 Annual Report',
    subtitle: '8 multi-dimensional injected findings (math, semantic, temporal, scale)',
    pages: 4,
    issuesCount: 8,
    healthScore: 5,
    grade: 'F',
    isClean: false,
    tags: ['8 Discrepancies', 'Math & Semantic', 'Full Schedule']
  },
  {
    id: 'clean_financial_statement',
    title: 'Apex Global Clean Statement',
    subtitle: 'Clean baseline control — all checks passed with 0 flagged issues',
    pages: 3,
    issuesCount: 0,
    healthScore: 100,
    grade: 'A+',
    isClean: true,
    tags: ['Clean Baseline', '0 Issues', 'Fully Reconciled']
  },
  {
    id: 'vertex_energy_audit',
    title: 'Vertex Energy Review',
    subtitle: '2 injected issues: in-text percentage rate error & milestone anomaly',
    pages: 2,
    issuesCount: 2,
    healthScore: 70,
    grade: 'C',
    isClean: false,
    tags: ['2 Findings', 'Timeline Inversion', 'Growth Variance']
  },
  {
    id: 'nova_clean_quarterly',
    title: 'Nova Clean Quarterly',
    subtitle: 'Clean quarterly filing baseline control — 0 flagged issues',
    pages: 1,
    issuesCount: 0,
    healthScore: 100,
    grade: 'A+',
    isClean: true,
    tags: ['Clean Baseline', '1 Page', '100 Score']
  },
  {
    id: 'solaris_edge_cases',
    title: 'Solaris Edge Cases & Schedules',
    subtitle: 'Negative regional outlays schedule, growth percentage discrepancy & milestone reversal',
    pages: 2,
    issuesCount: 2,
    healthScore: 70,
    grade: 'C',
    isClean: false,
    tags: ['Negative Schedules', '2 Findings', 'Edge Cases']
  }
];

export const sampleReportsList: SampleReportMetadata[] = sampleDocMetadata.map((m) => ({
  id: m.id,
  title: m.title,
  pages: m.pages,
  issuesCount: m.issuesCount,
}));
