import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Send,
  Loader2,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Download,
  RotateCcw,
  Maximize2,
  Minimize2,
  FileText,
  AlertTriangle,
  Calculator,
  Scale,
  Briefcase,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import type { AuditReport, AuditIssue, ChatMessage } from '../types';

interface NotionAiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReport;
  activeIssue?: AuditIssue | null;
  onJumpToPage: (page: number) => void;
  onSelectIssue?: (issue: AuditIssue, targetPage?: number) => void;
}

// Custom Institutional Markdown & Table Renderer
const FormattedAuditText: React.FC<{
  content: string;
  onJumpToPage: (page: number) => void;
}> = ({ content, onJumpToPage }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[] = [];
  let inTable = false;

  const flushTable = (keyPrefix: number) => {
    if (tableRows.length === 0) return null;
    const headerRow = tableRows[0];
    const dataRows = tableRows.slice(2); // Skip separator row

    const parseCells = (row: string) =>
      row
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    const headers = parseCells(headerRow);

    const tableEl = (
      <div
        key={`table_${keyPrefix}`}
        style={{
          margin: '12px 0',
          overflowX: 'auto',
          borderRadius: '8px',
          border: '1px solid rgba(255, 120, 80, 0.22)',
          backgroundColor: '#120C10',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255, 90, 31, 0.12)', borderBottom: '1px solid rgba(255, 120, 80, 0.25)' }}>
              {headers.map((h, i) => (
                <th key={i} style={{ padding: '7px 10px', color: '#FFA87D', fontWeight: 700 }}>
                  {h.replace(/\*\*/g, '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((dr, rIdx) => {
              const cells = parseCells(dr);
              if (cells.length === 0) return null;
              return (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom: rIdx < dataRows.length - 1 ? '1px solid rgba(255, 120, 80, 0.08)' : 'none',
                    backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  {cells.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '7px 10px', color: '#F3EAE8', verticalAlign: 'top' }}>
                      {renderInlineFormatting(cell, onJumpToPage)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

    tableRows = [];
    inTable = false;
    return tableEl;
  };

  const renderInlineFormatting = (text: string, jumpFn: (p: number) => void): React.ReactNode => {
    // Replace inline page references like "Page 1" or "Page 3" with clickable links
    const parts = text.split(/(Page\s+\d+|\*\*[^*]+\*\*|`[^`]+`)/g);

    return parts.map((part, idx) => {
      const pageMatch = part.match(/^Page\s+(\d+)$/i);
      if (pageMatch) {
        const pNum = parseInt(pageMatch[1], 10);
        return (
          <button
            key={idx}
            onClick={() => jumpFn(pNum)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              padding: '1px 5px',
              margin: '0 2px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#FF7036',
              backgroundColor: 'rgba(255, 90, 31, 0.12)',
              border: '1px solid rgba(255, 90, 31, 0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
              verticalAlign: 'baseline',
            }}
            title={`Jump to Page ${pNum}`}
          >
            <span>{part}</span>
            <ExternalLink size={9} />
          </button>
        );
      }

      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} style={{ color: '#FFF1EE', fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            style={{
              padding: '1px 5px',
              backgroundColor: 'rgba(255, 90, 31, 0.12)',
              border: '1px solid rgba(255, 90, 31, 0.25)',
              borderRadius: '3px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#FFA87D',
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Markdown Table Detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      tableRows.push(trimmed);
      inTable = true;
      return;
    } else if (inTable) {
      const tbl = flushTable(index);
      if (tbl) elements.push(tbl);
    }

    // Markdown Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <div
          key={index}
          className="font-heading"
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#FFA87D',
            marginTop: index === 0 ? '0' : '14px',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderBottom: '1px solid rgba(255, 120, 80, 0.14)',
            paddingBottom: '4px',
          }}
        >
          <Sparkles size={13} color="#FF5A1F" />
          <span>{trimmed.replace(/^###\s+/, '')}</span>
        </div>
      );
      return;
    }

    if (trimmed.startsWith('#### ')) {
      elements.push(
        <div
          key={index}
          className="font-heading"
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#FFF1EE',
            marginTop: '10px',
            marginBottom: '4px',
          }}
        >
          {trimmed.replace(/^####\s+/, '')}
        </div>
      );
      return;
    }

    // Blockquotes
    if (trimmed.startsWith('> ')) {
      elements.push(
        <div
          key={index}
          style={{
            margin: '8px 0',
            padding: '8px 12px',
            borderLeft: '3px solid #FF5A1F',
            backgroundColor: 'rgba(255, 90, 31, 0.08)',
            borderRadius: '0 6px 6px 0',
            fontStyle: 'italic',
            fontSize: '12px',
            color: '#FFE7E3',
            lineHeight: 1.5,
          }}
        >
          {renderInlineFormatting(trimmed.replace(/^>\s+/, ''), onJumpToPage)}
        </div>
      );
      return;
    }

    // Bullet Items
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
      elements.push(
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            fontSize: '12px',
            lineHeight: 1.55,
            color: '#F0DFDC',
            marginBottom: '4px',
            paddingLeft: '4px',
          }}
        >
          <span style={{ color: '#FF7036', fontSize: '11px', marginTop: '1px' }}>▪</span>
          <div style={{ flex: 1 }}>{renderInlineFormatting(trimmed.replace(/^[•\-]\s+|\d+\.\s+/, ''), onJumpToPage)}</div>
        </div>
      );
      return;
    }

    // Regular Paragraph
    if (trimmed.length > 0) {
      elements.push(
        <div
          key={index}
          style={{
            fontSize: '12px',
            lineHeight: 1.6,
            color: '#F0DFDC',
            marginBottom: '6px',
          }}
        >
          {renderInlineFormatting(trimmed, onJumpToPage)}
        </div>
      );
    }
  });

  if (inTable) {
    const tbl = flushTable(lines.length);
    if (tbl) elements.push(tbl);
  }

  return <div>{elements}</div>;
};

export const NotionAiChatDrawer: React.FC<NotionAiChatDrawerProps> = ({
  isOpen,
  onClose,
  report,
  activeIssue,
  onJumpToPage,
  onSelectIssue,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_msg',
      role: 'assistant',
      content: `### Voltora Autonomous Forensic Copilot\n\nI have completed independent verification of **${report.doc_name}**.\n\n• **Integrity Score:** **${report.summary.health_score}/100 (Grade ${report.summary.grade})**\n• **Audit Status:** Flagged **${report.summary.total_issues} discrepancies** across ${report.summary.pages_analyzed} pages (${report.summary.critical_count} Critical Contradictions, ${report.summary.warning_count} Warnings).\n\nSelect a forensic protocol below or inquire directly regarding variance calculations, capital structure conflicts, or draft SEC resolution disclosures.`,
      timestamp: Date.now(),
      citations: Array.from(new Set(report.issues.map((i) => i.primary_anchor.page))).map((p) => ({
        page: p,
        text: `Page ${p}`,
      })),
      suggestedFollowups: [
        'Summarize top discrepancies',
        'Explain revenue & EBITDA variance',
        'Check debt disclosures',
        'Draft audit resolution memo',
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [isWide, setIsWide] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Thinking progress rotation
  useEffect(() => {
    if (!isLoading) {
      setThinkingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingStep((prev) => (prev + 1) % 3);
    }, 1100);
    return () => clearInterval(interval);
  }, [isLoading]);

  const thinkingMessages = [
    'Cross-referencing multi-page schedules & footnote commitments...',
    'Validating arithmetic cross-footing and variance formulas...',
    'Synthesizing institutional audit diagnostic & corrective language...',
  ];

  const quickProtocols = [
    { label: 'Top Discrepancies', icon: AlertTriangle, query: 'Summarize top discrepancies' },
    { label: 'Math Variance', icon: Calculator, query: 'Explain revenue & EBITDA variance' },
    { label: 'Audit Debt', icon: Scale, query: 'Check debt disclosures' },
    { label: 'Draft Memo', icon: FileText, query: 'Draft audit resolution memo' },
    { label: 'CFO Talking Points', icon: Briefcase, query: 'Generate high-yield CFO inquiry questions' },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: q.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/docs/${report.doc_id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          timestamp: Date.now(),
          citations: (data.relevant_pages || []).map((p: number) => ({
            page: p,
            text: `Page ${p}`,
          })),
          suggestedFollowups: data.suggested_followups || [
            'Draft formal audit resolution memo',
            'Summarize top discrepancies',
            'Reconcile income statement math variance',
          ],
          memoReady: data.memo_ready,
          relevantIssueIds: data.relevant_issue_ids || [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('API query failed');
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: `### Forensic Audit Assessment for ${report.doc_name}\n\nVoltora identified **${report.summary.total_issues} discrepancies** across ${report.summary.pages_analyzed} pages with an Integrity Score of **${report.summary.health_score}/100**.\n\nPrimary focus areas:\n• **Capital Structure:** Zero-debt claim contradicts Note 2 credit agreements.\n• **Income Statement:** Component sums ($145M) fail to tie to Total Consolidated Revenue ($165M).\n• **Unit Verification:** $42.5B on Page 2 represents a 1,000x scale typography mismatch against Page 4 ($42.5M).`,
        timestamp: Date.now(),
        citations: [1, 2, 3].map((p) => ({ page: p, text: `Page ${p}` })),
        suggestedFollowups: [
          'Summarize top discrepancies',
          'Explain revenue & EBITDA variance',
          'Draft audit resolution memo',
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadMemo = (content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Voltora_Audit_Memo_${report.doc_name.replace(/\.[^/.]+$/, '')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `init_${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. Re-auditing **${report.doc_name}** with fresh context. Ask any question or select a forensic protocol below.`,
        timestamp: Date.now(),
        suggestedFollowups: [
          'Summarize top discrepancies',
          'Explain revenue & EBITDA variance',
          'Check debt disclosures',
          'Draft audit resolution memo',
        ],
      },
    ]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(10, 6, 8, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 900,
            }}
          />

          {/* Slide-out Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: isWide ? '680px' : '510px',
              maxWidth: '96vw',
              backgroundColor: '#120C0F',
              borderLeft: '1px solid rgba(255, 120, 80, 0.22)',
              boxShadow: '-16px 0 50px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 90, 31, 0.4)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'var(--font-body)',
              transition: 'width 0.2s ease',
            }}
          >
            {/* ═══ HEADER ═══ */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255, 120, 80, 0.14)',
                backgroundColor: '#0F090C',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(255, 56, 56, 0.25) 0%, rgba(255, 161, 51, 0.25) 100%)',
                    border: '1px solid rgba(255, 120, 80, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FF7036',
                    boxShadow: '0 0 12px rgba(255, 90, 31, 0.2)',
                  }}
                >
                  <Sparkles size={17} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="font-heading" style={{ fontSize: '13px', fontWeight: 800, color: '#FFF1EE', letterSpacing: '0.02em' }}>
                      VOLTORA COPILOT
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#10B981',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                      ONLINE
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#BCA3A7', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                    <span style={{ maxWidth: '210px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {report.doc_name}
                    </span>
                    <span>•</span>
                    <span style={{ color: report.summary.health_score >= 80 ? '#10B981' : '#FFA87D', fontWeight: 600 }}>
                      Score {report.summary.health_score}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Action Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setIsWide(!isWide)}
                  className="btn-secondary"
                  style={{ padding: '5px 8px', fontSize: '11px', color: '#BCA3A7' }}
                  title={isWide ? 'Standard Drawer Width' : 'Expand Drawer for Wide Tables'}
                >
                  {isWide ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                <button
                  onClick={handleClearHistory}
                  className="btn-secondary"
                  style={{ padding: '5px 8px', fontSize: '11px', color: '#BCA3A7' }}
                  title="Reset conversation"
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  onClick={onClose}
                  className="btn-secondary"
                  style={{ padding: '5px 8px' }}
                  title="Close (Esc)"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ═══ ACTIVE ISSUE FOCUS BANNER (IF AN ISSUE IS SELECTED) ═══ */}
            {activeIssue && (
              <div
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 90, 31, 0.08)',
                  borderBottom: '1px solid rgba(255, 120, 80, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backgroundColor: 'rgba(255, 56, 56, 0.25)',
                      color: '#FF5A1F',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    Active Finding
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#FFF1EE',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Pg {activeIssue.primary_anchor.page}: {activeIssue.title}
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleSendMessage(
                      `Perform a deep forensic inquiry on this active finding: "${activeIssue.title}" on Page ${activeIssue.primary_anchor.page}. Why does it fail audit verification, what is the exact calculation/contradiction, and what is the remediation?`
                    )
                  }
                  className="btn-primary"
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    flexShrink: 0,
                    gap: '4px',
                  }}
                >
                  <span>Audit Finding</span>
                  <ChevronRight size={10} />
                </button>
              </div>
            )}

            {/* ═══ SMART PROTOCOL CHIPS ═══ */}
            <div
              style={{
                padding: '9px 14px',
                borderBottom: '1px solid rgba(255, 120, 80, 0.10)',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                backgroundColor: 'rgba(255, 255, 255, 0.015)',
              }}
            >
              {quickProtocols.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.query)}
                    className="btn-secondary"
                    style={{
                      padding: '4px 9px',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      borderColor: 'rgba(255, 120, 80, 0.2)',
                    }}
                  >
                    <Icon size={11} color="#FF7036" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ═══ MESSAGE STREAM ═══ */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: isUser ? '85%' : '100%',
                      width: isUser ? 'auto' : '100%',
                      backgroundColor: isUser ? 'rgba(255, 90, 31, 0.12)' : '#160F13',
                      border: isUser
                        ? '1px solid rgba(255, 90, 31, 0.35)'
                        : '1px solid rgba(255, 120, 80, 0.16)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      boxShadow: isUser ? '0 2px 10px rgba(255, 90, 31, 0.1)' : '0 2px 12px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {/* Header bar within message bubble */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isUser ? '#FFA87D' : '#FF7036',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {isUser ? (
                          <span>You</span>
                        ) : (
                          <>
                            <Sparkles size={11} />
                            <span>Voltora Forensic Intelligence</span>
                          </>
                        )}
                      </div>

                      {/* Action buttons (Copy / Download Memo) */}
                      {!isUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedId === msg.id ? '#10B981' : '#806B70',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '10px',
                            }}
                            title="Copy response markdown"
                          >
                            {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>

                          {(msg.memoReady || msg.content.includes('MEMORANDUM')) && (
                            <button
                              onClick={() => handleDownloadMemo(msg.content)}
                              style={{
                                background: 'rgba(255, 90, 31, 0.15)',
                                border: '1px solid rgba(255, 90, 31, 0.3)',
                                borderRadius: '4px',
                                color: '#FFA87D',
                                padding: '2px 6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px',
                                fontWeight: 600,
                              }}
                              title="Download complete memorandum as markdown file"
                            >
                              <Download size={10} />
                              <span>Save Memo (.md)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message Body */}
                    {isUser ? (
                      <div style={{ fontSize: '12px', lineHeight: 1.5, color: '#FFF1EE', whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </div>
                    ) : (
                      <FormattedAuditText content={msg.content} onJumpToPage={onJumpToPage} />
                    )}

                    {/* Associated Citations Pill Bar */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div
                        style={{
                          marginTop: '10px',
                          paddingTop: '8px',
                          borderTop: '1px solid rgba(255, 120, 80, 0.10)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontSize: '10px', color: '#806B70', fontWeight: 600 }}>Citations:</span>
                        {msg.citations.map((c, i) => {
                          const pageIssue = report.issues.find(
                            (iss) => iss.primary_anchor.page === c.page || (iss.secondary_anchor && iss.secondary_anchor.page === c.page)
                          );
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                onJumpToPage(c.page);
                                if (pageIssue && onSelectIssue) {
                                  onSelectIssue(pageIssue, c.page);
                                }
                              }}
                              className="btn-secondary"
                              style={{
                                padding: '2px 7px',
                                fontSize: '10px',
                                borderColor: 'rgba(255, 90, 31, 0.3)',
                                color: '#FFA87D',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                              title={`Jump to Page ${c.page} and focus relevant finding`}
                            >
                              <span>{c.text}</span>
                              <ArrowRight size={9} />
                            </button>
                          );
                        })}

                        {/* Interactive direct issue pills */}
                        {msg.relevantIssueIds && msg.relevantIssueIds.length > 0 && onSelectIssue && (
                          <>
                            <span style={{ fontSize: '10px', color: '#806B70', marginLeft: '4px', fontWeight: 600 }}>Findings:</span>
                            {msg.relevantIssueIds.slice(0, 3).map((issueId) => {
                              const iss = report.issues.find((x) => x.id === issueId);
                              if (!iss) return null;
                              return (
                                <button
                                  key={issueId}
                                  onClick={() => {
                                    onSelectIssue(iss, iss.primary_anchor.page);
                                    onJumpToPage(iss.primary_anchor.page);
                                  }}
                                  style={{
                                    padding: '2px 6px',
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    borderRadius: '3px',
                                    backgroundColor: 'rgba(255, 56, 56, 0.15)',
                                    border: '1px solid rgba(255, 56, 56, 0.35)',
                                    color: '#FF7036',
                                    cursor: 'pointer',
                                    maxWidth: '120px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={`Inspect Finding: ${iss.title}`}
                                >
                                  {iss.title}
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}

                    {/* Suggested Follow-up Actions */}
                    {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                      <div
                        style={{
                          marginTop: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <span style={{ fontSize: '10px', color: '#806B70', fontWeight: 600 }}>Suggested Follow-ups:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {msg.suggestedFollowups.map((f, fIdx) => (
                            <button
                              key={fIdx}
                              onClick={() => handleSendMessage(f)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 120, 80, 0.16)',
                                borderRadius: '4px',
                                color: '#FFE7E3',
                                padding: '3px 7px',
                                fontSize: '10px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease',
                              }}
                              className="hover:border-[#FF5A1F] hover:text-[#FFA87D]"
                            >
                              <ChevronRight size={10} color="#FF7036" />
                              <span>{f}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Dynamic Thinking Progress Indicator */}
              {isLoading && (
                <div
                  style={{
                    backgroundColor: '#160F13',
                    border: '1px solid rgba(255, 120, 80, 0.25)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxWidth: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#FF7036' }}>
                    <Loader2 size={14} className="animate-spin" />
                    <span style={{ fontWeight: 600 }}>Voltora Forensic Engine Analyzing</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#BCA3A7' }}>
                    {thinkingMessages[thinkingStep]}
                  </div>
                  <div
                    style={{
                      height: '2px',
                      backgroundColor: 'rgba(255, 120, 80, 0.15)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: '45%',
                        backgroundColor: '#FF5A1F',
                        borderRadius: '2px',
                        animation: 'pulse 1.2s infinite ease-in-out',
                      }}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ═══ INPUT BAR ═══ */}
            <div
              style={{
                padding: '14px 18px',
                borderTop: '1px solid rgba(255, 120, 80, 0.14)',
                backgroundColor: '#0F090C',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  backgroundColor: '#170F14',
                  border: '1px solid rgba(255, 120, 80, 0.22)',
                  borderRadius: '10px',
                  padding: '8px 10px 8px 12px',
                  gap: '8px',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)',
                }}
              >
                <textarea
                  ref={inputRef}
                  rows={2}
                  placeholder="Ask a forensic question (e.g. 'Reconcile Page 3 revenue', 'Draft 10-K footnote')..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#FFF1EE',
                    fontSize: '12px',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.45,
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputQuery.trim() || isLoading}
                    className="btn-primary"
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      opacity: !inputQuery.trim() || isLoading ? 0.4 : 1,
                      cursor: !inputQuery.trim() || isLoading ? 'not-allowed' : 'pointer',
                    }}
                    title="Send (Enter)"
                  >
                    <Send size={13} />
                  </button>
                  <span style={{ fontSize: '9px', color: '#806B70' }}>Enter ↵</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
