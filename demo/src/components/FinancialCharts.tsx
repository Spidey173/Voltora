import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Layers,
  FileCheck2,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import type { AuditReport, AuditIssue } from '../types';

interface FinancialChartsProps {
  report: AuditReport;
  onSelectIssue: (issue: AuditIssue, targetPage?: number) => void;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ report, onSelectIssue }) => {
  const hasIssues = report.issues.length > 0;

  const chart1Data = hasIssues
    ? report.issues.map((issue) => ({
        name: issue.title.length > 22 ? issue.title.slice(0, 20) + '...' : issue.title,
        fullTitle: issue.title,
        page: issue.primary_anchor.page,
        severity: issue.severity,
        score: issue.severity === 'critical' ? 95 : issue.severity === 'warning' ? 60 : 30,
      }))
    : [
        { name: 'Math Cross-Footing', fullTitle: 'Arithmetic row/column balance evaluation', score: 100, severity: 'clean' },
        { name: 'Cross-Page Logic', fullTitle: 'NLI statement contradiction detection', score: 100, severity: 'clean' },
        { name: 'Unit Consistency', fullTitle: 'Standardized scale & currency denominations', score: 100, severity: 'clean' },
        { name: 'Fiscal Sequence', fullTitle: 'Chronological timeline & reporting periods', score: 100, severity: 'clean' },
        { name: 'Table Extraction', fullTitle: 'PyMuPDF visual schedule matrix parsing', score: 100, severity: 'clean' },
      ];

  const totalPages = Math.max(1, report.total_pages);
  const step = Math.max(1, Math.floor(totalPages / 7));
  const samplePages: number[] = [];
  for (let p = 1; p <= totalPages; p += step) {
    if (!samplePages.includes(p)) samplePages.push(p);
  }
  if (!samplePages.includes(totalPages)) samplePages.push(totalPages);

  const timelineNodes = samplePages.map((pageNum) => {
    const pageIssue = report.issues.find(
      (i) => i.primary_anchor.page === pageNum || i.secondary_anchor?.page === pageNum
    );

    if (pageIssue) {
      return {
        label: pageIssue.title.length > 20 ? pageIssue.title.slice(0, 18) + '...' : pageIssue.title,
        page: pageNum,
        issue: pageIssue,
        status: pageIssue.severity === 'critical' ? 'critical' : 'warning',
        note: `Flagged: ${pageIssue.title}`,
      };
    }

    return {
      label: `Page ${pageNum} Disclosures`,
      page: pageNum,
      issue: null,
      status: 'verified',
      note: 'Reconciled: All tested statements balance',
    };
  });

  const [activeNode, setActiveNode] = useState<number>(0);

  const pagesHeatmapData = Array.from({ length: totalPages }, (_, idx) => {
    const pageNum = idx + 1;
    const pageIssues = report.issues.filter(
      (i) => i.primary_anchor.page === pageNum || i.secondary_anchor?.page === pageNum
    );
    const pageEv = report.pages?.find((p) => p.page === pageNum);

    const issuesWeight = pageIssues.reduce((acc, issue) => {
      return acc + (issue.severity === 'critical' ? 40 : issue.severity === 'warning' ? 20 : 10);
    }, 0);

    const baseScore = pageEv ? pageEv.evidence_score : 50;
    const density = Math.min(100, baseScore + issuesWeight);

    return {
      name: `P.${pageNum}`,
      page: pageNum,
      density,
      issuesCount: pageIssues.length,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px', height: '100%', overflowY: 'auto' }}>
      {/* ═══ TOP: INTERACTIVE DOCUMENT FLOW TIMELINE ═══ */}
      <div
        className="clean-panel"
        style={{ padding: '20px 24px', backgroundColor: '#140E11', border: '1px solid rgba(255, 120, 80, 0.15)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 className="font-heading" style={{ fontSize: '15px', fontWeight: 700, color: '#FFF1EE', marginBottom: '2px' }}>
              Multi-Page Audit Trajectory
            </h3>
            <p style={{ fontSize: '12px', color: '#BCA3A7' }}>
              Sequential disclosure timeline extracted from {report.doc_name} ({report.total_pages} total pages)
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 90, 31, 0.08)',
              border: '1px solid rgba(255, 120, 80, 0.2)',
              fontSize: '11px',
              color: '#FFA87D',
            }}
          >
            <Calendar size={13} />
            <span>Interactive Flow Sequence</span>
          </div>
        </div>

        {/* Horizontal Node Track */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${timelineNodes.length}, 1fr)`,
            gap: '12px',
            position: 'relative',
          }}
        >
          {timelineNodes.map((node, idx) => {
            const isSelected = activeNode === idx;
            const isCrit = node.status === 'critical';
            const isWarn = node.status === 'warning';

            const accentColor = isCrit ? '#FF3838' : isWarn ? '#FFA133' : '#10B981';
            const accentBg = isCrit
              ? 'rgba(255, 56, 56, 0.12)'
              : isWarn
              ? 'rgba(255, 161, 51, 0.12)'
              : 'rgba(16, 185, 129, 0.12)';

            return (
              <div
                key={idx}
                onClick={() => {
                  setActiveNode(idx);
                  if (node.issue) {
                    onSelectIssue(node.issue, node.page);
                  }
                }}
                className="clean-card"
                style={{
                  padding: '12px',
                  backgroundColor: isSelected ? '#1F151A' : '#160E12',
                  border: isSelected ? `1px solid ${accentColor}` : '1px solid rgba(255, 120, 80, 0.12)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: accentBg,
                      color: accentColor,
                    }}
                  >
                    Page {node.page}
                  </span>
                  {isCrit ? (
                    <AlertCircle size={14} color="#FF3838" />
                  ) : isWarn ? (
                    <HelpCircle size={14} color="#FFA133" />
                  ) : (
                    <FileCheck2 size={14} color="#10B981" />
                  )}
                </div>

                <div
                  className="font-heading"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#FFF1EE',
                    marginBottom: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={node.label}
                >
                  {node.label}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#BCA3A7',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {node.note}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ 2 CHARTS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px', flex: 1 }}>
        {/* Chart 1: Materiality (if issues) or Checks Passed (if 0 issues) */}
        <div
          className="clean-panel"
          style={{ padding: '20px 24px', backgroundColor: '#140E11', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h4 className="font-heading" style={{ fontSize: '14px', fontWeight: 700, color: '#FFF1EE', marginBottom: '2px' }}>
              {hasIssues ? 'Discrepancy Severity & Impact' : 'Checks Passed'}
            </h4>
            <p style={{ fontSize: '11px', color: '#BCA3A7' }}>
              {hasIssues
                ? 'Calculated exposure rating assigned to detected contradictions'
                : 'Status across evaluated rule checks (100 = rule evaluated with zero flagged discrepancies)'}
            </p>
          </div>

          <div style={{ flex: 1, minHeight: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart1Data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 120, 80, 0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="#806B70" fontSize={11} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#806B70" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1216',
                    border: '1px solid rgba(255, 120, 80, 0.25)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#FFF1EE',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                  }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {chart1Data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.severity === 'critical'
                          ? '#FF3838'
                          : entry.severity === 'warning'
                          ? '#FFA133'
                          : entry.severity === 'clean' || entry.severity === 'verified'
                          ? '#10B981'
                          : '#FF5A1F'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Real Document Evidence Grounding Area Chart */}
        <div
          className="clean-panel"
          style={{ padding: '20px 24px', backgroundColor: '#140E11', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h4 className="font-heading" style={{ fontSize: '14px', fontWeight: 700, color: '#FFF1EE', marginBottom: '2px' }}>
                Evidence Grounding by Page
              </h4>
              <p style={{ fontSize: '11px', color: '#BCA3A7' }}>
                Extracted token density and finding concentration across pages
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 90, 31, 0.08)',
                color: '#FFA87D',
                fontSize: '11px',
              }}
            >
              <Layers size={12} />
              <span>{totalPages} Pages</span>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pagesHeatmapData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradientDemo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5A1F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF3838" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 120, 80, 0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="#806B70" fontSize={11} tickLine={false} />
                <YAxis stroke="#806B70" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1216',
                    border: '1px solid rgba(255, 120, 80, 0.25)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#FFF1EE',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                  }}
                  formatter={(val: any, _name: any, item: any) => [
                    `${val}% (Findings: ${item.payload.issuesCount})`,
                    'Evidence Index',
                  ]}
                />
                <Area type="monotone" dataKey="density" stroke="#FF5A1F" strokeWidth={2} fillOpacity={1} fill="url(#areaGradientDemo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
