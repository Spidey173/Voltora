import React from 'react';
import type { AuditSummary } from '../types';

interface HealthWidgetsProps {
  summary: AuditSummary;
}

export const HealthWidgets: React.FC<HealthWidgetsProps> = ({ summary }) => {
  const getHealthMeta = (score: number, totalIssues: number) => {
    if (totalIssues === 0) {
      return {
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.25)',
        status: 'Passes Evaluated Rules',
        desc: 'No discrepancies detected within evaluated rules. Human review recommended.',
      };
    }
    if (score >= 80) {
      return {
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.25)',
        status: 'Minor Warnings',
        desc: 'Few contradictions detected; review highlighted notes.',
      };
    }
    if (score >= 60) {
      return {
        color: '#FFA133',
        bg: 'rgba(255, 161, 51, 0.14)',
        border: 'rgba(255, 161, 51, 0.28)',
        status: 'Needs Review',
        desc: 'Unexplained variances and conflicts between narrative and tables.',
      };
    }
    return {
      color: '#FF3838',
      bg: 'rgba(255, 56, 56, 0.14)',
      border: 'rgba(255, 56, 56, 0.30)',
      status: 'High Discrepancies',
      desc: 'Multiple critical contradictions require review and reconciliation.',
    };
  };

  const meta = getHealthMeta(summary.health_score, summary.total_issues);
  const detCount = summary.deterministic_count ?? 0;
  const heurCount = summary.heuristic_count ?? 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '14px',
        marginBottom: '18px',
      }}
    >
      {/* ═══ 1. HEALTH SCORE ═══ */}
      <div className="clean-panel" style={{ padding: '18px 20px', backgroundColor: '#140E11' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#BCA3A7', fontWeight: 500 }}>
            Document Integrity Score
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: meta.bg,
              color: meta.color,
              border: `1px solid ${meta.border}`,
            }}
          >
            Grade {summary.grade}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span
            className="font-heading"
            style={{ fontSize: '32px', fontWeight: 800, color: '#FFF1EE', lineHeight: 1 }}
          >
            {summary.health_score}
          </span>
          <span style={{ fontSize: '13px', color: '#806B70' }}>/ 100</span>
        </div>

        <div style={{ marginTop: '8px', fontSize: '12px', color: meta.color, fontWeight: 500 }}>
          {meta.status} — {meta.desc}
        </div>
      </div>

      {/* ═══ 2. ISSUES BREAKDOWN ═══ */}
      <div className="clean-panel" style={{ padding: '18px 20px', backgroundColor: '#140E11' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#BCA3A7', fontWeight: 500 }}>
            Detected Findings
          </span>
          <span style={{ fontSize: '12px', color: summary.total_issues > 0 ? '#FF5A1F' : '#10B981', fontWeight: 600 }}>
            {summary.total_issues} issues
          </span>
        </div>

        {/* Segmented bar */}
        <div
          style={{
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '9999px',
            overflow: 'hidden',
            display: 'flex',
            margin: '12px 0',
          }}
        >
          {summary.critical_count > 0 && (
            <div
              style={{
                width: `${(summary.critical_count / Math.max(1, summary.total_issues)) * 100}%`,
                backgroundColor: '#FF3838',
              }}
              title={`${summary.critical_count} Critical`}
            />
          )}
          {summary.warning_count > 0 && (
            <div
              style={{
                width: `${(summary.warning_count / Math.max(1, summary.total_issues)) * 100}%`,
                backgroundColor: '#FFA133',
              }}
              title={`${summary.warning_count} Warnings`}
            />
          )}
          {summary.info_count > 0 && (
            <div
              style={{
                width: `${(summary.info_count / Math.max(1, summary.total_issues)) * 100}%`,
                backgroundColor: '#FF7036',
              }}
              title={`${summary.info_count} Info`}
            />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
          <span style={{ color: '#FF3838', fontWeight: 500 }}>
            {summary.critical_count} Critical
          </span>
          <span style={{ color: '#FFA133', fontWeight: 500 }}>
            {summary.warning_count} Warning
          </span>
          <span style={{ color: '#10B981', fontWeight: 500 }}>
            {summary.passed_checks_count ?? summary.verified_claims_count} Checked
          </span>
        </div>
      </div>

      {/* ═══ 3. CHECK METHODOLOGIES ═══ */}
      <div className="clean-panel" style={{ padding: '18px 20px', backgroundColor: '#140E11' }}>
        <div style={{ fontSize: '12px', color: '#BCA3A7', fontWeight: 500, marginBottom: '8px' }}>
          Check Methodology
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span
            className="font-heading"
            style={{ fontSize: '24px', fontWeight: 800, color: '#FFF1EE', lineHeight: 1 }}
          >
            {detCount} Det / {heurCount} Heur
          </span>
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#BCA3A7' }}>
          {summary.total_issues === 0
            ? 'All evaluated tables and sequences reconciled.'
            : 'Deterministic arithmetic + semantic NLI pairing.'}
        </div>
      </div>

      {/* ═══ 4. AUDIT TELEMETRY ═══ */}
      <div className="clean-panel" style={{ padding: '18px 20px', backgroundColor: '#140E11' }}>
        <div style={{ fontSize: '12px', color: '#BCA3A7', fontWeight: 500, marginBottom: '8px' }}>
          Audit Scope
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span
            className="font-heading"
            style={{ fontSize: '32px', fontWeight: 800, color: '#FFF1EE', lineHeight: 1 }}
          >
            {summary.tables_analyzed}
          </span>
          <span style={{ fontSize: '13px', color: '#BCA3A7' }}>tables analyzed</span>
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#806B70' }}>
          {summary.pages_analyzed} pages audited in {(summary.audit_duration_ms / 1000).toFixed(2)}s
        </div>
      </div>
    </div>
  );
};
