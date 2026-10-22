import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { AuditReport, AuditIssue } from '../types';

interface DocumentViewerProps {
  report: AuditReport;
  activePage: number;
  onPageChange: (page: number) => void;
  activeIssue: AuditIssue | null;
  hoveredIssueId: string | null;
  onSelectIssue: (issue: AuditIssue) => void;
  xrayMode: boolean;
  onToggleXray: () => void;
  isInspectorOpen?: boolean;
  onToggleInspector?: () => void;
}

interface HistoryEntry {
  page: number;
  title: string;
  time: string;
  issuesCount: number;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  report,
  activePage,
  onPageChange,
  activeIssue,
  hoveredIssueId,
  onSelectIssue,
  xrayMode,
  onToggleXray,
  isInspectorOpen = true,
  onToggleInspector,
}) => {
  const [zoom, setZoom] = useState<number>(1.1);
  const [imgError, setImgError] = useState<boolean>(false);
  const [glideClass, setGlideClass] = useState<string>('');
  const prevPageRef = useRef<number>(activePage);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to extract clean human-readable section titles per page
  const getPageTitle = (pNum: number): string => {
    const pEvidence = report.pages.find((p) => p.page === pNum);
    if (pEvidence && pEvidence.text_spans.length > 0) {
      const heading = pEvidence.text_spans
        .map((s) => s.text.trim())
        .find(
          (t) =>
            t.length > 4 &&
            t.length < 80 &&
            !t.toLowerCase().startsWith('page ') &&
            !/^\d+$/.test(t)
        );
      if (heading) return heading.slice(0, 45);
    }

    if (report.doc_name.toLowerCase().includes('acme')) {
      const titlesByPage: Record<number, string> = {
        1: 'Executive Overview & Strategic Direction',
        2: 'Operational Highlights & Segment Review',
        3: 'Consolidated Statement of Operations',
        4: 'Supplementary Schedules & Disclosures',
      };
      if (titlesByPage[pNum]) return titlesByPage[pNum];
    }

    return `Page ${pNum}`;
  };

  // ═══ NAVIGATION HISTORY STACK (Browser-style Back/Forward) ═══
  const [historyStack, setHistoryStack] = useState<HistoryEntry[]>([
    {
      page: 1,
      title: getPageTitle(1),
      time: 'Initial',
      issuesCount: report.issues.filter(
        (i) => i.primary_anchor.page === 1 || i.secondary_anchor?.page === 1
      ).length,
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isNavigatingHistoryRef = useRef<boolean>(false);

  // Update history stack on page changes
  useEffect(() => {
    if (isNavigatingHistoryRef.current) {
      isNavigatingHistoryRef.current = false;
      return;
    }
    setHistoryStack((prev) => {
      if (prev[historyIndex]?.page === activePage) return prev;
      const newEntry: HistoryEntry = {
        page: activePage,
        title: getPageTitle(activePage),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        issuesCount: report.issues.filter(
          (i) => i.primary_anchor.page === activePage || i.secondary_anchor?.page === activePage
        ).length,
      };
      const trimmed = prev.slice(0, historyIndex + 1);
      const updated = [...trimmed, newEntry];
      setHistoryIndex(updated.length - 1);
      return updated;
    });
  }, [activePage, report.issues]);

  // ═══ CLICK TO GO, HOLD TO SEE HISTORY ═══
  const [historyMenu, setHistoryMenu] = useState<{
    type: 'back' | 'forward';
    x?: number;
    y?: number;
  } | null>(null);

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldRef = useRef<boolean>(false);

  // Start hold timer on mouse down (320ms threshold)
  const handleHoldStart = (type: 'back' | 'forward', e: React.MouseEvent<HTMLElement>) => {
    isHoldRef.current = false;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPos = type === 'back' ? rect.left : rect.right - 280;

    holdTimerRef.current = setTimeout(() => {
      isHoldRef.current = true;
      setHistoryMenu({
        type,
        x: xPos,
        y: rect.bottom + 6,
      });
    }, 300);
  };

  // Clear hold timer on mouse up / mouse leave
  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  // Click handler (fires only if not held)
  const handleNavClick = (type: 'back' | 'forward') => {
    if (isHoldRef.current) {
      isHoldRef.current = false;
      return;
    }
    if (type === 'back') {
      executeGoBack();
    } else {
      executeGoForward();
    }
  };

  // Right-click immediately opens history menu
  const handleContextMenu = (type: 'back' | 'forward', e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const xPos = type === 'back' ? rect.left : rect.right - 280;
    setHistoryMenu({
      type,
      x: xPos,
      y: rect.bottom + 6,
    });
  };

  const executeGoBack = () => {
    if (historyIndex > 0) {
      isNavigatingHistoryRef.current = true;
      const targetEntry = historyStack[historyIndex - 1];
      setHistoryIndex((prev) => prev - 1);
      onPageChange(targetEntry.page);
    } else if (activePage > 1) {
      onPageChange(activePage - 1);
    }
  };

  const executeGoForward = () => {
    if (historyIndex < historyStack.length - 1) {
      isNavigatingHistoryRef.current = true;
      const targetEntry = historyStack[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      onPageChange(targetEntry.page);
    } else if (activePage < report.total_pages) {
      onPageChange(activePage + 1);
    }
  };

  const jumpToHistoryIndex = (targetIdx: number) => {
    isNavigatingHistoryRef.current = true;
    const targetEntry = historyStack[targetIdx];
    setHistoryIndex(targetIdx);
    onPageChange(targetEntry.page);
    setHistoryMenu(null);
  };

  // Calculate past history entries (from most recent to oldest)
  const backwardHistory = historyStack
    .slice(0, historyIndex)
    .map((item, originalIdx) => ({ ...item, originalIdx }))
    .reverse();

  // If no prior history jumps exist yet, provide preceding pages
  const fallbackBackwardHistory =
    backwardHistory.length > 0
      ? backwardHistory
      : Array.from({ length: Math.max(0, activePage - 1) }, (_, i) => {
          const p = activePage - 1 - i;
          return {
            page: p,
            title: getPageTitle(p),
            time: 'Earlier',
            issuesCount: report.issues.filter((iss) => iss.primary_anchor.page === p).length,
            originalIdx: -p,
          };
        });

  // Calculate forward history entries
  const forwardHistory = historyStack
    .slice(historyIndex + 1)
    .map((item, originalIdx) => ({ ...item, originalIdx: historyIndex + 1 + originalIdx }));

  // If no forward history stack exists, provide upcoming pages
  const fallbackForwardHistory =
    forwardHistory.length > 0
      ? forwardHistory
      : Array.from({ length: Math.max(0, report.total_pages - activePage) }, (_, i) => {
          const p = activePage + 1 + i;
          return {
            page: p,
            title: getPageTitle(p),
            time: 'Upcoming',
            issuesCount: report.issues.filter((iss) => iss.primary_anchor.page === p).length,
            originalIdx: -p,
          };
        });

  // Issues on this active page
  const pageIssues = report.issues.filter(
    (i) =>
      i.primary_anchor.page === activePage ||
      (i.secondary_anchor && i.secondary_anchor.page === activePage)
  );

  const pageEvidence = report.pages.find((p) => p.page === activePage);

  // Preload all document pages into memory cache for 0ms instantaneous page transitions
  useEffect(() => {
    for (let p = 1; p <= report.total_pages; p++) {
      const img = new Image();
      img.src = `/api/docs/${report.doc_id}/pages/${p}`;
    }
  }, [report.doc_id, report.total_pages]);

  // Page Transition Direction Glide
  useEffect(() => {
    setImgError(false);
    if (activePage > prevPageRef.current) {
      setGlideClass('page-glide-next');
    } else if (activePage < prevPageRef.current) {
      setGlideClass('page-glide-prev');
    }
    prevPageRef.current = activePage;

    const timer = setTimeout(() => {
      setGlideClass('');
    }, 220);
    return () => clearTimeout(timer);
  }, [activePage, report.doc_id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        executeGoBack();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        executeGoForward();
      } else if (e.key === 'Escape') {
        setHistoryMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePage, report.total_pages, historyIndex, historyStack]);

  const handleZoomIn = () => setZoom((prev) => Math.min(2.2, Number((prev + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.7, Number((prev - 0.15).toFixed(2))));
  const handleResetZoom = () => setZoom(1.0);
  const handleFitWidth = () => setZoom(1.25);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0C080A',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ═══ COMPACT HIGH-EFFICIENCY VIEWER TOOLBAR (44px) ═══ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: '44px',
          backgroundColor: '#140E11',
          borderBottom: '1px solid rgba(255, 120, 80, 0.12)',
          zIndex: 20,
          flexShrink: 0,
        }}
      >
        {/* Browser-style Back & Forward with Click-to-Go, Hold-for-History */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Back Button */}
          <button
            onMouseDown={(e) => handleHoldStart('back', e)}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onClick={() => handleNavClick('back')}
            onContextMenu={(e) => handleContextMenu('back', e)}
            disabled={activePage <= 1 && historyIndex <= 0}
            className="btn-secondary"
            style={{
              padding: '4px 8px',
              opacity: activePage <= 1 && historyIndex <= 0 ? 0.35 : 1,
              position: 'relative',
            }}
            title="Back (Click to go back • Hold or right-click to view History)"
          >
            <ChevronLeft size={15} />
          </button>

          {/* Page Display & Direct Jump */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#FFF1EE',
              fontWeight: 500,
            }}
          >
            <span style={{ color: '#BCA3A7' }}>Page</span>
            <input
              type="number"
              min={1}
              max={report.total_pages}
              value={activePage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= report.total_pages) {
                  onPageChange(val);
                }
              }}
              style={{
                width: '38px',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 120, 80, 0.2)',
                borderRadius: '4px',
                color: '#FFF1EE',
                padding: '2px 4px',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <span style={{ color: '#806B70' }}>/ {report.total_pages}</span>
          </div>

          {/* Forward Button */}
          <button
            onMouseDown={(e) => handleHoldStart('forward', e)}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onClick={() => handleNavClick('forward')}
            onContextMenu={(e) => handleContextMenu('forward', e)}
            disabled={activePage >= report.total_pages && historyIndex >= historyStack.length - 1}
            className="btn-secondary"
            style={{
              padding: '4px 8px',
              opacity: activePage >= report.total_pages && historyIndex >= historyStack.length - 1 ? 0.35 : 1,
              position: 'relative',
            }}
            title="Forward (Click to go forward • Hold or right-click to view History)"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Center: Issue indicator & Dual-Anchor Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {pageIssues.length > 0 ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#FF7036',
                fontWeight: 600,
                backgroundColor: 'rgba(255, 90, 31, 0.10)',
                padding: '2px 10px',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 90, 31, 0.25)',
                fontSize: '11px',
              }}
            >
              ⚠ {pageIssues.length} {pageIssues.length === 1 ? 'discrepancy' : 'discrepancies'} flagged on this page
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#10B981',
                fontWeight: 500,
                fontSize: '11px',
              }}
            >
              ✓ Page {activePage} verified with zero discrepancies
            </span>
          )}

          {/* Interactive Dual-Anchor Switcher */}
          {activeIssue && activeIssue.secondary_anchor && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                border: '1px solid rgba(255, 120, 80, 0.25)',
                borderRadius: '20px',
                padding: '2px 4px',
              }}
            >
              <button
                onClick={() => onPageChange(activeIssue.primary_anchor.page)}
                style={{
                  padding: '2px 8px',
                  borderRadius: '14px',
                  fontSize: '10px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activePage === activeIssue.primary_anchor.page ? '#FF5A1F' : 'transparent',
                  color: activePage === activeIssue.primary_anchor.page ? '#FFFFFF' : '#BCA3A7',
                  transition: 'all 0.15s ease',
                }}
              >
                Claim (Pg {activeIssue.primary_anchor.page})
              </button>
              <span style={{ fontSize: '10px', color: '#806B70' }}>⇄</span>
              <button
                onClick={() => onPageChange(activeIssue.secondary_anchor!.page)}
                style={{
                  padding: '2px 8px',
                  borderRadius: '14px',
                  fontSize: '10px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activePage === activeIssue.secondary_anchor!.page ? '#FF3838' : 'transparent',
                  color: activePage === activeIssue.secondary_anchor!.page ? '#FFFFFF' : '#BCA3A7',
                  transition: 'all 0.15s ease',
                }}
              >
                Conflict (Pg {activeIssue.secondary_anchor!.page})
              </button>
            </div>
          )}
        </div>

        {/* Right: Controls & Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Zoom controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 120, 80, 0.14)',
              borderRadius: '6px',
              padding: '1px',
            }}
          >
            <button
              onClick={handleZoomOut}
              style={{
                padding: '3px 6px',
                background: 'transparent',
                border: 'none',
                color: '#BCA3A7',
                cursor: 'pointer',
              }}
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span
              onClick={handleResetZoom}
              style={{
                fontSize: '11px',
                color: '#FFF1EE',
                padding: '0 6px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              title="Reset to 100%"
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              style={{
                padding: '3px 6px',
                background: 'transparent',
                border: 'none',
                color: '#BCA3A7',
                cursor: 'pointer',
              }}
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          <button
            onClick={handleFitWidth}
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '11px' }}
            title="Fit Width"
          >
            Fit
          </button>

          {/* X-Ray Heatmap toggle */}
          <button
            onClick={onToggleXray}
            className="btn-secondary"
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              backgroundColor: xrayMode ? 'rgba(255, 90, 31, 0.16)' : 'rgba(255, 255, 255, 0.03)',
              borderColor: xrayMode ? '#FF5A1F' : 'rgba(255, 120, 80, 0.14)',
              color: xrayMode ? '#FFA87D' : '#FFF1EE',
            }}
            title="Toggle X-Ray Heatmap"
          >
            <Eye size={12} />
            <span>X-Ray</span>
          </button>

          {/* Toggle Inspector Panel */}
          {onToggleInspector && (
            <button
              onClick={onToggleInspector}
              className="btn-secondary"
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                borderColor: !isInspectorOpen ? '#FF5A1F' : 'rgba(255, 120, 80, 0.14)',
                color: !isInspectorOpen ? '#FFA87D' : '#FFF1EE',
              }}
              title={isInspectorOpen ? 'Collapse side panel (Full Width)' : 'Expand side panel'}
            >
              {isInspectorOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
              <span>{isInspectorOpen ? 'Full Page' : 'Show Intel'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══ EXPANSIVE DOCUMENT VIEWPORT ═══ */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '16px 20px 80px 20px',
          backgroundColor: '#0C080A',
          position: 'relative',
        }}
      >
        {/* ═══ DOCUMENT PAGE SHEET WITH GLIDE ANIMATION ═══ */}
        <div
          className={glideClass}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.12s ease-out',
            position: 'relative',
            width: '100%',
            maxWidth: '820px',
            minHeight: '920px',
            backgroundColor: '#FFFFFF',
            borderRadius: '4px',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Real PDF Page Image */}
          <img
            src={`/api/docs/${report.doc_id}/pages/${activePage}`}
            alt={`Page ${activePage}`}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              filter: xrayMode ? 'contrast(1.05) brightness(0.95)' : 'none',
            }}
          />

          {/* Fallback Vector View if image error */}
          {imgError && (
            <div
              style={{
                padding: '40px',
                color: '#1E293B',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                lineHeight: 1.7,
              }}
            >
              <div style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '10px', marginBottom: '20px', fontWeight: 700, fontSize: '16px' }}>
                {report.doc_name} — Page {activePage} of {report.total_pages}
              </div>
              <p style={{ color: '#64748B', marginBottom: '16px' }}>
                Extracted entities & financial statements from this page:
              </p>
              {pageIssues.map((issue, idx) => (
                <div
                  key={issue.id}
                  style={{
                    margin: '12px 0',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    borderLeft: `4px solid ${issue.severity === 'critical' ? '#FF3838' : '#FFA133'}`,
                    backgroundColor: issue.severity === 'critical' ? '#FEF2F2' : '#FFFBEB',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#1E293B' }}>
                    Issue #{idx + 1}: {issue.title}
                  </div>
                  <div style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>
                    "{issue.primary_anchor.text}"
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══ X-RAY EVIDENCE HEATMAP WASH ═══ */}
          {xrayMode && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  pageEvidence && pageEvidence.evidence_score < 0.6
                    ? 'radial-gradient(ellipse at 50% 40%, rgba(255, 56, 56, 0.22) 0%, transparent 80%)'
                    : 'radial-gradient(ellipse at 50% 40%, rgba(16, 185, 129, 0.14) 0%, transparent 80%)',
              }}
            />
          )}

          {/* ═══ EVIDENCE MARGIN CALLOUT PINS & COORDINATE HIGHLIGHTS ═══ */}
          {pageIssues.map((issue) => {
            const isPrimary = issue.primary_anchor.page === activePage;
            const anchor = isPrimary ? issue.primary_anchor : issue.secondary_anchor;
            if (!anchor) return null;

            const { bbox } = anchor;
            const isHovered = hoveredIssueId === issue.id;
            const isSelected = activeIssue?.id === issue.id;
            const globalIndex = report.issues.findIndex((i) => i.id === issue.id) + 1;

            // Accurate Category Color Coding
            const getCategoryTheme = (cat: string) => {
              if (cat.includes('math')) return { color: '#FFA133', bg: '#FFA133', label: 'Math' };
              if (cat.includes('temporal')) return { color: '#A855F7', bg: '#A855F7', label: 'Timeline' };
              if (cat.includes('unit')) return { color: '#06B6D4', bg: '#06B6D4', label: 'Scale' };
              return { color: '#FF3838', bg: '#FF3838', label: 'Contradiction' };
            };
            const theme = getCategoryTheme(issue.category);

            const left = `${bbox.x0 * 100}%`;
            const top = `${bbox.y0 * 100}%`;
            const width = `${Math.max(4, (bbox.x1 - bbox.x0) * 100)}%`;
            const height = `${Math.max(2.4, (bbox.y1 - bbox.y0) * 100)}%`;

            return (
              <div
                key={`${issue.id}-${anchor.page}`}
                onClick={() => onSelectIssue(issue)}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width,
                  height,
                  border: isSelected
                    ? `2px solid ${theme.color}`
                    : isHovered
                    ? `1.5px solid ${theme.color}`
                    : `1.5px solid ${theme.color}A6`,
                  borderLeft: isSelected ? `4px solid ${theme.color}` : `3px solid ${theme.color}`,
                  borderRadius: '3px',
                  backgroundColor: isSelected
                    ? `${theme.color}20`
                    : isHovered
                    ? `${theme.color}16`
                    : `${theme.color}0D`,
                  boxShadow: isSelected
                    ? `0 0 0 2px ${theme.color}33, 0 4px 16px ${theme.color}2A`
                    : isHovered
                    ? `0 2px 10px ${theme.color}22`
                    : 'none',
                  cursor: 'pointer',
                  zIndex: isSelected ? 20 : isHovered ? 18 : 10,
                  transition: 'all 0.15s ease',
                }}
              >
                {/* ═══ LEFT MARGIN GUTTER PIN (Positioned in white margin, zero text collision) ═══ */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-30px',
                    top: '0px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: theme.bg,
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected
                      ? `0 0 10px ${theme.color}, 0 2px 6px rgba(0,0,0,0.35)`
                      : '0 2px 5px rgba(0,0,0,0.25)',
                    transform: isSelected || isHovered ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    zIndex: 25,
                  }}
                  title={`#${globalIndex} (${theme.label}): ${issue.title}`}
                >
                  {globalIndex}
                </div>

                {/* Subtle Hover Tooltip */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 5px)',
                      left: '0px',
                      backgroundColor: '#140E11',
                      border: `1px solid ${theme.color}`,
                      borderRadius: '5px',
                      padding: '3px 8px',
                      color: '#FFF1EE',
                      fontSize: '11px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
                      pointerEvents: 'none',
                      zIndex: 35,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: theme.bg,
                        color: '#FFFFFF',
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '3px',
                      }}
                    >
                      #{globalIndex}
                    </span>
                    <span>{issue.title}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ FLOATING LARGE FORWARD / BACKWARD EDGE BUTTONS WITH HOLD-FOR-HISTORY ═══ */}
      {(activePage > 1 || historyIndex > 0) && (
        <button
          onMouseDown={(e) => handleHoldStart('back', e)}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          onClick={() => handleNavClick('back')}
          onContextMenu={(e) => handleContextMenu('back', e)}
          style={{
            position: 'absolute',
            left: '20px',
            top: 'calc(50% + 22px)',
            transform: 'translateY(-50%)',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(20, 14, 17, 0.90)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255, 120, 80, 0.28)',
            color: '#FFF1EE',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.75)',
            zIndex: 35,
            transition: 'all 0.15s ease',
          }}
          className="hover:scale-110 hover:border-[#FF5A1F]"
          title="Back (Click to go back • Hold to view History)"
        >
          <ChevronLeft size={22} color="#FFA87D" />
        </button>
      )}

      {(activePage < report.total_pages || historyIndex < historyStack.length - 1) && (
        <button
          onMouseDown={(e) => handleHoldStart('forward', e)}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          onClick={() => handleNavClick('forward')}
          onContextMenu={(e) => handleContextMenu('forward', e)}
          style={{
            position: 'absolute',
            right: '20px',
            top: 'calc(50% + 22px)',
            transform: 'translateY(-50%)',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(20, 14, 17, 0.90)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255, 120, 80, 0.28)',
            color: '#FFF1EE',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.75)',
            zIndex: 35,
            transition: 'all 0.15s ease',
          }}
          className="hover:scale-110 hover:border-[#FF5A1F]"
          title="Forward (Click to go forward • Hold to view History)"
        >
          <ChevronRight size={22} color="#FFA87D" />
        </button>
      )}

      {/* ═══ FLOATING BOTTOM PAGINATION BAR ═══ */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(20, 14, 17, 0.94)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 120, 80, 0.24)',
          borderRadius: '30px',
          padding: '5px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
          zIndex: 40,
        }}
      >
        <button
          onMouseDown={(e) => handleHoldStart('back', e)}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          onClick={() => handleNavClick('back')}
          onContextMenu={(e) => handleContextMenu('back', e)}
          disabled={activePage <= 1 && historyIndex <= 0}
          style={{
            background: 'transparent',
            border: 'none',
            color: activePage <= 1 && historyIndex <= 0 ? '#554448' : '#BCA3A7',
            cursor: activePage <= 1 && historyIndex <= 0 ? 'not-allowed' : 'pointer',
            padding: '3px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11px',
            fontWeight: 600,
          }}
          className="hover:text-[#FFF1EE]"
          title="Back (Click to go back • Hold for History)"
        >
          <ChevronLeft size={14} />
          <span>Prev</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {Array.from({ length: report.total_pages }, (_, idx) => {
            const pNum = idx + 1;
            const isCurrent = pNum === activePage;
            const issuesCount = report.issues.filter(
              (i) => i.primary_anchor.page === pNum || i.secondary_anchor?.page === pNum
            ).length;

            return (
              <button
                key={pNum}
                onClick={() => onPageChange(pNum)}
                style={{
                  padding: '3px 9px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: isCurrent ? 'linear-gradient(135deg, #FF3838 0%, #FF5A1F 100%)' : 'rgba(255, 255, 255, 0.05)',
                  color: isCurrent ? '#FFFFFF' : '#BCA3A7',
                  boxShadow: isCurrent ? '0 2px 8px rgba(255, 90, 31, 0.4)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
                title={`Page ${pNum}: ${getPageTitle(pNum)} (${issuesCount} issues)`}
              >
                <span>{pNum}</span>
                {issuesCount > 0 && (
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? '#FFFFFF' : '#FF3838',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          onMouseDown={(e) => handleHoldStart('forward', e)}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          onClick={() => handleNavClick('forward')}
          onContextMenu={(e) => handleContextMenu('forward', e)}
          disabled={activePage >= report.total_pages && historyIndex >= historyStack.length - 1}
          style={{
            background: 'transparent',
            border: 'none',
            color: activePage >= report.total_pages && historyIndex >= historyStack.length - 1 ? '#554448' : '#BCA3A7',
            cursor: activePage >= report.total_pages && historyIndex >= historyStack.length - 1 ? 'not-allowed' : 'pointer',
            padding: '3px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11px',
            fontWeight: 600,
          }}
          className="hover:text-[#FFF1EE]"
          title="Forward (Click to go forward • Hold for History)"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* ═══ BROWSER-STYLE NAVIGATION HISTORY DROPDOWN POPOVER ═══ */}
      {historyMenu && (
        <>
          {/* Invisible Backdrop to close on outside click */}
          <div
            onClick={() => setHistoryMenu(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 90,
              background: 'transparent',
            }}
          />

          <div
            style={{
              position: 'fixed',
              left: Math.max(12, Math.min(window.innerWidth - 320, historyMenu.x || 20)),
              top: Math.min(window.innerHeight - 280, historyMenu.y || 60),
              width: '300px',
              backgroundColor: '#160F13',
              border: '1.5px solid rgba(255, 120, 80, 0.35)',
              borderRadius: '10px',
              padding: '8px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 20px rgba(255, 90, 31, 0.25)',
              zIndex: 100,
            }}
          >
            {/* Popover Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px 8px 8px',
                borderBottom: '1px solid rgba(255, 120, 80, 0.14)',
                marginBottom: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="#FF7036" />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFF1EE' }}>
                  {historyMenu.type === 'back' ? 'Backward History' : 'Forward History'}
                </span>
              </div>
              <span style={{ fontSize: '10px', color: '#806B70' }}>Click to jump</span>
            </div>

            {/* History List */}
            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {(historyMenu.type === 'back' ? fallbackBackwardHistory : fallbackForwardHistory).length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#806B70', fontSize: '11px' }}>
                  No {historyMenu.type === 'back' ? 'prior' : 'forward'} history entries.
                </div>
              ) : (
                (historyMenu.type === 'back' ? fallbackBackwardHistory : fallbackForwardHistory).map((entry, idx) => {
                  const isCurrent = entry.page === activePage;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (entry.originalIdx >= 0) {
                          jumpToHistoryIndex(entry.originalIdx);
                        } else {
                          onPageChange(entry.page);
                          setHistoryMenu(null);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isCurrent ? 'rgba(255, 90, 31, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        borderLeft: isCurrent ? '3px solid #FF5A1F' : '3px solid transparent',
                        color: '#FFF1EE',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.12s ease',
                        width: '100%',
                      }}
                      className="hover:bg-[rgba(255,90,31,0.22)]"
                    >
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: entry.issuesCount > 0 ? 'rgba(255, 56, 56, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: entry.issuesCount > 0 ? '#FF7036' : '#10B981',
                          fontSize: '10px',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        Pg {entry.page}
                      </span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: '#FFF1EE',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {entry.title}
                        </div>
                        <div style={{ fontSize: '9px', color: '#806B70' }}>
                          {entry.time} • {entry.issuesCount > 0 ? `${entry.issuesCount} issues flagged` : 'Verified Clean'}
                        </div>
                      </div>

                      <ArrowRight size={11} color="#FF7036" style={{ opacity: 0.6 }} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
