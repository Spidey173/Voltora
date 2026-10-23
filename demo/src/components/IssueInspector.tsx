import React, { useState } from 'react';
import {
  CheckCircle2,
  Send,
  Loader2,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Clock,
  Scale,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type { AuditIssue, AuditReport } from '../types';
import { DemoService } from '../services/demoService';

interface IssueInspectorProps {
  report: AuditReport;
  activeIssue: AuditIssue | null;
  onSelectIssue: (issue: AuditIssue, targetPage?: number) => void;
  onHoverIssue: (issueId: string | null) => void;
  onClose?: () => void;
  onOpenAiChat?: (issue?: AuditIssue) => void;
}

export const IssueInspector: React.FC<IssueInspectorProps> = ({
  report,
  activeIssue,
  onSelectIssue,
  onHoverIssue,
  onClose,
  onOpenAiChat,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [auditorStatuses, setAuditorStatuses] = useState<Record<string, 'confirmed' | 'dismissed' | 'inquiry'>>({});
  const [chatStates, setChatStates] = useState<
    Record<
      string,
      {
        query: string;
        answer?: string;
        loading?: boolean;
        open?: boolean;
        recommendation?: string;
      }
    >
  >({});

  // Accurate Category Color and Metadata
  const getCategoryMeta = (category: string) => {
    if (category.includes('math')) {
      return {
        label: 'Math Discrepancy',
        color: '#FFA133',
        bg: 'rgba(255, 161, 51, 0.14)',
        border: 'rgba(255, 161, 51, 0.35)',
        icon: Calculator,
      };
    }
    if (category.includes('temporal')) {
      return {
        label: 'Timeline Anomaly',
        color: '#A855F7',
        bg: 'rgba(168, 85, 247, 0.14)',
        border: 'rgba(168, 85, 247, 0.35)',
        icon: Clock,
      };
    }
    if (category.includes('unit')) {
      return {
        label: 'Scale Mismatch',
        color: '#06B6D4',
        bg: 'rgba(6, 182, 212, 0.14)',
        border: 'rgba(6, 182, 212, 0.35)',
        icon: Scale,
      };
    }
    if (category.includes('unsupported')) {
      return {
        label: 'Unsupported Claim',
        color: '#F43F5E',
        bg: 'rgba(244, 63, 94, 0.14)',
        border: 'rgba(244, 63, 94, 0.35)',
        icon: AlertTriangle,
      };
    }
    return {
      label: 'Contradiction',
      color: '#FF3838',
      bg: 'rgba(255, 56, 56, 0.14)',
      border: 'rgba(255, 56, 56, 0.35)',
      icon: AlertTriangle,
    };
  };

  // Filter issues
  const filteredIssues = report.issues.filter((issue) => {
    if (filter === 'critical' && issue.severity !== 'critical') return false;
    if (filter === 'math' && !issue.category.includes('math')) return false;
    if (filter === 'contradiction' && !issue.category.includes('contradiction')) return false;
    if (filter === 'timeline' && !issue.category.includes('temporal') && !issue.category.includes('unit')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.description.toLowerCase().includes(q) ||
        issue.primary_anchor.text.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter tab counts
  const filterCounts = {
    all: report.issues.length,
    critical: report.issues.filter((i) => i.severity === 'critical').length,
    math: report.issues.filter((i) => i.category.includes('math')).length,
    contradiction: report.issues.filter((i) => i.category.includes('contradiction')).length,
    timeline: report.issues.filter((i) => i.category.includes('temporal') || i.category.includes('unit')).length,
  };

  // Micro-chat
  const handleAsk = async (issueId: string, customPrompt?: string) => {
    const currentState = chatStates[issueId] || { query: '' };
    const prompt = customPrompt || currentState.query;
    if (!prompt.trim()) return;

    setChatStates((prev) => ({
      ...prev,
      [issueId]: { ...prev[issueId], query: prompt, loading: true, open: true },
    }));

    try {
      const targetIssue = report.issues.find((i) => i.id === issueId);
      if (!targetIssue) throw new Error('Issue not found');
      const data = await DemoService.answerIssueQuery(targetIssue, prompt);
      setChatStates((prev) => ({
        ...prev,
        [issueId]: {
          query: prompt,
          answer: data.answer,
          recommendation: data.resolution_recommendation,
          loading: false,
          open: true,
        },
      }));} catch {
      setChatStates((prev) => ({
        ...prev,
        [issueId]: { ...prev[issueId], loading: false },
      }));
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#140E11',
        overflow: 'hidden',
      }}
    >
      {/* ═══ HEADER (44px) ═══ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: '44px',
          backgroundColor: '#140E11',
          borderBottom: '1px solid rgba(255, 120, 80, 0.12)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 className="font-heading" style={{ fontSize: '13px', fontWeight: 700, color: '#FFF1EE' }}>
            Document Findings
          </h3>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: report.issues.length === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 56, 56, 0.18)',
              color: report.issues.length === 0 ? '#10B981' : '#FF3838',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            {report.issues.length} {report.issues.length === 1 ? 'Issue' : 'Issues'}
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '4px', border: 'none', background: 'transparent', color: '#BCA3A7' }}
            title="Collapse Panel"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {report.issues.length === 0 ? (
        /* ═══ CASE 1: CLEAN AUDIT (0 ISSUES) ═══ */
        <div style={{ padding: '24px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            className="clean-card"
            style={{
              backgroundColor: '#1A1216',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.08)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
              }}
            >
              <CheckCircle2 size={28} color="#10B981" />
            </div>

            <h4 className="font-heading" style={{ fontSize: '16px', fontWeight: 700, color: '#FFF1EE', marginBottom: '6px' }}>
              No Issues Detected by Evaluated Checks
            </h4>
            <p style={{ fontSize: '12px', color: '#BCA3A7', lineHeight: 1.5 }}>
              No issues detected by the evaluated checks across the document pages. (Note: this reflects evaluated rule coverage and does not constitute a certified audit opinion).
            </p>
          </div>

          {/* Subsystem Audit Checklist */}
          <div
            className="clean-card"
            style={{
              backgroundColor: '#1A1216',
              border: '1px solid rgba(255, 120, 80, 0.12)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#FFF1EE', fontWeight: 700, marginBottom: '12px' }}>
              Evaluated Rule Subsystems
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              {[
                { title: 'Cross-Page Consistency', desc: '0 contradictory claims between text narratives and tables' },
                { title: 'Arithmetic Cross-Footing', desc: `Row and column totals reconciled across ${report.summary.tables_analyzed} tables` },
                { title: 'Chronological Sequence', desc: 'Fiscal years, quarters, and milestone order consistent' },
                { title: 'Scale & Currency Units', desc: 'Millions vs billions and currency tags standardized' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <CheckCircle2 size={15} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ color: '#FFF1EE', fontWeight: 600 }}>{item.title}</div>
                    <div style={{ color: '#806B70', fontSize: '11px' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ═══ CASE 2: ISSUES DETECTED — PROGRESSIVE DISCLOSURE FEED ═══ */
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 44px)' }}>
          {/* Filter & Search Bar */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255, 120, 80, 0.10)',
              backgroundColor: '#110B0E',
            }}
          >
            <input
              type="text"
              placeholder="Filter by keyword, amount, or page..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 120, 80, 0.16)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                color: '#FFF1EE',
                outline: 'none',
                marginBottom: '8px',
              }}
            />

            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                { id: 'all', label: `All (${filterCounts.all})` },
                { id: 'critical', label: `Critical (${filterCounts.critical})` },
                { id: 'math', label: `Math (${filterCounts.math})` },
                { id: 'contradiction', label: `Conflicts (${filterCounts.contradiction})` },
                { id: 'timeline', label: `Timeline (${filterCounts.timeline})` },
              ].map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      border: isActive ? 'none' : '1px solid rgba(255, 120, 80, 0.14)',
                      background: isActive ? 'linear-gradient(135deg, #FF3838 0%, #FF5A1F 100%)' : 'rgba(255, 255, 255, 0.03)',
                      color: isActive ? '#FFFFFF' : '#BCA3A7',
                      boxShadow: isActive ? '0 2px 8px rgba(255, 90, 31, 0.3)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progressive Disclosure Issue Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {filteredIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 18px', color: '#806B70', fontSize: '12px' }}>
                <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 10px auto' }} />
                {report.issues.length === 0 ? (
                  <>
                    <div style={{ fontWeight: 700, color: '#FFF1EE', fontSize: '13px', marginBottom: '6px' }}>
                      No Discrepancies Detected in Checked Scope
                    </div>
                    <div style={{ color: '#A89297', lineHeight: 1.5, maxWidth: '280px', margin: '0 auto 10px' }}>
                      Evaluated tables, percentage breakdowns, milestone timelines, and scale units reconciled consistently with automated rules.
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#6A565B' }}>
                      Note: Automated checks do not certify complete document accuracy.
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: '#BCA3A7' }}>No issues match the selected filter.</div>
                    <button
                      onClick={() => {
                        setFilter('all');
                        setSearchQuery('');
                      }}
                      className="btn-secondary"
                      style={{ marginTop: '10px', padding: '4px 10px', fontSize: '11px' }}
                    >
                      View All Issues ({report.issues.length})
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* ═══ FORWARD / BACKWARD FINDINGS STEPPER ═══ */}
                {activeIssue && filteredIssues.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      backgroundColor: 'rgba(255, 90, 31, 0.06)',
                      border: '1px solid rgba(255, 120, 80, 0.16)',
                      borderRadius: '6px',
                      marginBottom: '4px',
                    }}
                  >
                    <button
                      onClick={() => {
                        const currIdx = filteredIssues.findIndex((i) => i.id === activeIssue.id);
                        if (currIdx > 0) {
                          onSelectIssue(filteredIssues[currIdx - 1]);
                        }
                      }}
                      disabled={filteredIssues.findIndex((i) => i.id === activeIssue.id) <= 0}
                      className="btn-secondary"
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        opacity: filteredIssues.findIndex((i) => i.id === activeIssue.id) <= 0 ? 0.35 : 1,
                      }}
                      title="Previous Discrepancy"
                    >
                      <ChevronLeft size={13} />
                      <span>Prev</span>
                    </button>

                    <div style={{ fontSize: '11px', color: '#FFF1EE', fontWeight: 700 }}>
                      <span style={{ color: '#FFA87D' }}>Finding #{report.issues.findIndex((i) => i.id === activeIssue.id) + 1}</span>
                      <span style={{ color: '#806B70' }}> / {report.issues.length}</span>
                    </div>

                    <button
                      onClick={() => {
                        const currIdx = filteredIssues.findIndex((i) => i.id === activeIssue.id);
                        if (currIdx < filteredIssues.length - 1) {
                          onSelectIssue(filteredIssues[currIdx + 1]);
                        }
                      }}
                      disabled={filteredIssues.findIndex((i) => i.id === activeIssue.id) >= filteredIssues.length - 1}
                      className="btn-secondary"
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        opacity: filteredIssues.findIndex((i) => i.id === activeIssue.id) >= filteredIssues.length - 1 ? 0.35 : 1,
                      }}
                      title="Next Discrepancy"
                    >
                      <span>Next</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                )}

                {filteredIssues.map((issue) => {
                const isSelected = activeIssue?.id === issue.id;
                const globalIndex = report.issues.findIndex((i) => i.id === issue.id) + 1;
                const meta = getCategoryMeta(issue.category);
                const isConfirmed = auditorStatuses[issue.id] === 'confirmed';
                const isDismissed = auditorStatuses[issue.id] === 'dismissed';
                const chatState = chatStates[issue.id] || { query: '' };
                const Icon = meta.icon;

                /* ────────────────────────────────────────────────────────
                   CASE A: UNSELECTED COMPACT SCAN CARD (~68px)
                   Scannable, clean, zero suffocating clutter
                   ──────────────────────────────────────────────────────── */
                if (!isSelected) {
                  return (
                    <div
                      key={issue.id}
                      onMouseEnter={() => onHoverIssue(issue.id)}
                      onMouseLeave={() => onHoverIssue(null)}
                      onClick={() => onSelectIssue(issue)}
                      style={{
                        backgroundColor: '#171014',
                        border: '1px solid rgba(255, 120, 80, 0.12)',
                        borderLeft: `3.5px solid ${meta.color}`,
                        borderRadius: '6px',
                        padding: '9px 12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      className="hover:border-opacity-40"
                    >
                      {/* Top Row: Number, Category Badge & Page Indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              backgroundColor: meta.bg,
                              border: `1px solid ${meta.border}`,
                              color: meta.color,
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '3px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Icon size={10} />
                            <span>#{globalIndex} {meta.label}</span>
                          </span>

                          {issue.check_type && (
                            <span
                              style={{
                                fontSize: '8.5px',
                                fontWeight: 700,
                                color: issue.check_type === 'deterministic' ? '#38BDF8' : '#C084FC',
                                backgroundColor: issue.check_type === 'deterministic' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(192, 132, 252, 0.12)',
                                border: `1px solid ${issue.check_type === 'deterministic' ? 'rgba(56, 189, 248, 0.28)' : 'rgba(192, 132, 252, 0.28)'}`,
                                padding: '1px 4px',
                                borderRadius: '3px',
                              }}
                            >
                              {issue.check_type === 'deterministic' ? 'Deterministic' : 'Heuristic'}
                            </span>
                          )}
                          {issue.status === 'needs_review' && (
                            <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#FBBF24', backgroundColor: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '1px 4px', borderRadius: '3px' }}>
                              Review
                            </span>
                          )}
                          {isConfirmed && (
                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#FF7036', backgroundColor: 'rgba(255, 90, 31, 0.18)', padding: '1px 5px', borderRadius: '3px' }}>
                              ✓ Confirmed
                            </span>
                          )}
                          {isDismissed && (
                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.18)', padding: '1px 5px', borderRadius: '3px' }}>
                              ⊘ Dismissed
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#BCA3A7' }}>
                          <span>Pg {issue.primary_anchor.page}{issue.secondary_anchor ? ` ⇄ ${issue.secondary_anchor.page}` : ''}</span>
                          <ChevronRight size={12} color="#806B70" />
                        </div>
                      </div>

                      {/* Title: Concise, Bold */}
                      <h4
                        className="font-heading"
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: isDismissed ? '#806B70' : '#FFF1EE',
                          textDecoration: isDismissed ? 'line-through' : 'none',
                          marginBottom: '3px',
                          lineHeight: 1.35,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {issue.title}
                      </h4>

                      {/* Summary Excerpt or Metric Delta */}
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#806B70',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {issue.delta ? (
                          <span style={{ color: '#FFA87D' }}>
                            Stated: {issue.actual_value} vs Expected: {issue.expected_value} (Δ {issue.delta})
                          </span>
                        ) : (
                          <span>"{issue.primary_anchor.text.slice(0, 60)}..."</span>
                        )}
                      </div>
                    </div>
                  );
                }

                /* ────────────────────────────────────────────────────────
                   CASE B: SELECTED EXPANDED EVIDENCE DOSSIER
                   Reveals full evidence, comparisons, and auditor actions
                   ──────────────────────────────────────────────────────── */
                return (
                  <div
                    key={issue.id}
                    onMouseEnter={() => onHoverIssue(issue.id)}
                    onMouseLeave={() => onHoverIssue(null)}
                    style={{
                      backgroundColor: '#1E141B',
                      border: '1.5px solid #FF5A1F',
                      borderLeft: `4px solid ${meta.color}`,
                      borderRadius: '8px',
                      padding: '14px',
                      boxShadow: '0 4px 20px rgba(255, 90, 31, 0.22)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Header: Global Pin Badge, Category, Page & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            backgroundColor: meta.color,
                            color: '#FFFFFF',
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '3px',
                          }}
                        >
                          #{globalIndex}
                        </span>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: meta.bg,
                            border: `1px solid ${meta.border}`,
                            color: meta.color,
                            fontSize: '10px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Icon size={10} />
                          <span>{meta.label}</span>
                        </span>

                        {issue.check_type && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              color: issue.check_type === 'deterministic' ? '#38BDF8' : '#C084FC',
                              backgroundColor: issue.check_type === 'deterministic' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(192, 132, 252, 0.14)',
                              border: `1px solid ${issue.check_type === 'deterministic' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(192, 132, 252, 0.3)'}`,
                              padding: '1px 5px',
                              borderRadius: '3px',
                            }}
                          >
                            {issue.check_type === 'deterministic' ? 'Deterministic Rule' : 'Heuristic NLI'}
                          </span>
                        )}
                        {issue.status === 'needs_review' && (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#FBBF24', backgroundColor: 'rgba(251, 191, 36, 0.18)', border: '1px solid rgba(251, 191, 36, 0.35)', padding: '1px 5px', borderRadius: '3px' }}>
                            Needs Review
                          </span>
                        )}
                        {isConfirmed && (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#FF7036', backgroundColor: 'rgba(255, 90, 31, 0.2)', padding: '1px 5px', borderRadius: '3px' }}>
                            ✓ Confirmed
                          </span>
                        )}
                        {isDismissed && (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '1px 5px', borderRadius: '3px' }}>
                            ⊘ Dismissed
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: '11px', color: '#BCA3A7', fontWeight: 600 }}>
                        Page {issue.primary_anchor.page}
                        {issue.secondary_anchor ? ` vs Pg ${issue.secondary_anchor.page}` : ''}
                      </span>
                    </div>

                    {/* Title */}
                    <h4
                      className="font-heading"
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: isDismissed ? '#806B70' : '#FFF1EE',
                        textDecoration: isDismissed ? 'line-through' : 'none',
                        marginBottom: '6px',
                        lineHeight: 1.35,
                      }}
                    >
                      {issue.title}
                    </h4>

                    {/* Full Description */}
                    <p
                      style={{
                        fontSize: '11.5px',
                        color: '#BCA3A7',
                        lineHeight: 1.45,
                        marginBottom: '10px',
                      }}
                    >
                      {issue.description}
                    </p>

                    {/* Derivation Explanation */}
                    {issue.explanation && (
                      <div
                        style={{
                          backgroundColor: 'rgba(255, 90, 31, 0.06)',
                          border: '1px solid rgba(255, 120, 80, 0.18)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          marginBottom: '10px',
                        }}
                      >
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#FFA87D', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Derivation Explanation
                        </div>
                        <div style={{ fontSize: '11px', color: '#E2D3D0', lineHeight: 1.45 }}>
                          {issue.explanation}
                        </div>
                      </div>
                    )}

                    {/* ═══ 2-SIDED AUDIT EVIDENCE CITATIONS ═══ */}
                    <div
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(255, 120, 80, 0.14)',
                        borderRadius: '6px',
                        padding: '10px',
                        marginBottom: '10px',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {/* Primary Source */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <span style={{ color: '#FFA87D', fontWeight: 700 }}>Source Claim (Pg {issue.primary_anchor.page}):</span>{' '}
                          <span style={{ color: '#FFF1EE' }}>"{issue.primary_anchor.text}"</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIssue(issue, issue.primary_anchor.page);
                          }}
                          className="btn-secondary"
                          style={{ padding: '2px 6px', fontSize: '10px', flexShrink: 0 }}
                          title={`Jump to Page ${issue.primary_anchor.page}`}
                        >
                          Jump
                        </button>
                      </div>

                      {/* Conflicting Source (if secondary anchor exists) */}
                      {issue.secondary_anchor && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid rgba(255, 120, 80, 0.10)', paddingTop: '8px' }}>
                          <div>
                            <span style={{ color: '#FF3838', fontWeight: 700 }}>Contradicting Evidence (Pg {issue.secondary_anchor.page}):</span>{' '}
                            <span style={{ color: '#FFF1EE' }}>"{issue.secondary_anchor.text}"</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectIssue(issue, issue.secondary_anchor?.page);
                            }}
                            className="btn-secondary"
                            style={{ padding: '2px 6px', fontSize: '10px', flexShrink: 0, color: '#FF3838', borderColor: 'rgba(255, 56, 56, 0.35)' }}
                            title={`Jump to Page ${issue.secondary_anchor.page}`}
                          >
                            Jump
                          </button>
                        </div>
                      )}

                      {/* Numerical Reconciliation Grid (if values present) */}
                      {(issue.actual_value || issue.expected_value) && (
                        <div
                          style={{
                            borderTop: '1px solid rgba(255, 120, 80, 0.10)',
                            paddingTop: '8px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '6px',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '4px' }}>
                            <div style={{ color: '#806B70', fontSize: '9px', textTransform: 'uppercase' }}>Stated</div>
                            <div style={{ color: '#FF3838', fontWeight: 700, fontSize: '11px' }}>{issue.actual_value || 'N/A'}</div>
                          </div>
                          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '4px' }}>
                            <div style={{ color: '#806B70', fontSize: '9px', textTransform: 'uppercase' }}>Reconciled</div>
                            <div style={{ color: '#10B981', fontWeight: 700, fontSize: '11px' }}>{issue.expected_value || 'N/A'}</div>
                          </div>
                          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '4px' }}>
                            <div style={{ color: '#806B70', fontSize: '9px', textTransform: 'uppercase' }}>Variance</div>
                            <div style={{ color: '#FFA133', fontWeight: 700, fontSize: '11px' }}>{issue.delta || 'Mismatch'}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Auditor Guidance */}
                    {issue.suggested_fix && (
                      <div
                        style={{
                          backgroundColor: 'rgba(255, 90, 31, 0.07)',
                          borderLeft: '3px solid #FF5A1F',
                          padding: '6px 10px',
                          borderRadius: '0 4px 4px 0',
                          fontSize: '11px',
                          color: '#FFA87D',
                          marginBottom: '10px',
                        }}
                      >
                        <strong style={{ color: '#FFF1EE' }}>Auditor Action: </strong>
                        {issue.suggested_fix}
                      </div>
                    )}

                    {/* ═══ AUDITOR ACTION BAR & AI RESOLVER ═══ */}
                    <div style={{ borderTop: '1px solid rgba(255, 120, 80, 0.12)', paddingTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAuditorStatuses((prev) => ({
                                ...prev,
                                [issue.id]: prev[issue.id] === 'confirmed' ? undefined! : 'confirmed',
                              }));
                            }}
                            className="btn-secondary"
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: isConfirmed ? 'rgba(255, 90, 31, 0.22)' : 'transparent',
                              borderColor: isConfirmed ? '#FF5A1F' : 'rgba(255, 120, 80, 0.16)',
                              color: isConfirmed ? '#FF7036' : '#BCA3A7',
                            }}
                            title="Confirm this finding as an auditor"
                          >
                            ✓ Confirm Finding
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAuditorStatuses((prev) => ({
                                ...prev,
                                [issue.id]: prev[issue.id] === 'dismissed' ? undefined! : 'dismissed',
                              }));
                            }}
                            className="btn-secondary"
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: isDismissed ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                              borderColor: isDismissed ? '#10B981' : 'rgba(255, 120, 80, 0.16)',
                              color: isDismissed ? '#10B981' : '#BCA3A7',
                            }}
                            title="Dismiss finding"
                          >
                            ⊘ Dismiss
                          </button>
                        </div>

                        {!chatState.open && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setChatStates((prev) => ({
                                  ...prev,
                                  [issue.id]: { ...prev[issue.id], open: true },
                                }));
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#FFA87D',
                                fontSize: '11px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              <MessageSquare size={12} />
                              <span>Quick Explain</span>
                            </button>

                            {onOpenAiChat && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenAiChat(issue);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#FF7036',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  cursor: 'pointer',
                                }}
                                title="Open Review Assistant Investigation Drawer"
                              >
                                <Sparkles size={11} />
                                <span>Deep Review</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Inline AI Micro-Chat */}
                      {chatState.open && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            backgroundColor: 'rgba(255, 90, 31, 0.05)',
                            border: '1px solid rgba(255, 120, 80, 0.18)',
                            borderRadius: '6px',
                            padding: '8px',
                            marginTop: '8px',
                          }}
                        >
                          {chatState.answer ? (
                            <div style={{ fontSize: '11px', color: '#FFF1EE', lineHeight: 1.4, marginBottom: '6px' }}>
                              <div style={{ fontWeight: 600, color: '#FF7036', marginBottom: '2px' }}>Voltora Review Assistant:</div>
                              <div>{chatState.answer}</div>
                            </div>
                          ) : chatState.loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#FF7036', padding: '4px 0' }}>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Reconciling disclosures...</span>
                            </div>
                          ) : null}

                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input
                              type="text"
                              placeholder="Ask how to resolve or draft footnote..."
                              value={chatState.query}
                              onChange={(e) => {
                                const val = e.target.value;
                                setChatStates((prev) => ({
                                  ...prev,
                                  [issue.id]: { ...prev[issue.id], query: val },
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAsk(issue.id);
                              }}
                              style={{
                                flex: 1,
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 120, 80, 0.2)',
                                borderRadius: '4px',
                                color: '#FFF1EE',
                                fontSize: '11px',
                                padding: '4px 8px',
                                outline: 'none',
                              }}
                            />
                            <button
                              onClick={() => handleAsk(issue.id)}
                              className="btn-primary"
                              style={{ padding: '4px 8px', fontSize: '10px' }}
                            >
                              <Send size={11} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          </div>
        </div>
      )}
    </div>
  );
};
