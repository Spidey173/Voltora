import { useState, useEffect, useRef } from 'react';
import type { AuditReport, AuditIssue, BenchmarkMetrics } from './types';
import { Navbar } from './components/Navbar';
import { HeroExperience } from './components/HeroExperience';
import { AnalysisModal } from './components/AnalysisModal';
import { DocumentViewer } from './components/DocumentViewer';
import { IssueInspector } from './components/IssueInspector';
import { FinancialCharts } from './components/FinancialCharts';
import { NotionAiChatDrawer } from './components/NotionAiChatDrawer';
import { BenchmarkModal } from './components/BenchmarkModal';

export default function App() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [activeTab, setActiveTab] = useState<'workspace' | 'analytics'>('workspace');
  const [activePage, setActivePage] = useState<number>(1);
  const [activeIssue, setActiveIssue] = useState<AuditIssue | null>(null);
  const [hoveredIssueId, setHoveredIssueId] = useState<string | null>(null);
  const [xrayMode, setXrayMode] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzingDocName, setAnalyzingDocName] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState<boolean>(false);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkMetrics | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);

  // Resizable Document Findings Panel (Left / Right drag)
  const [inspectorWidth, setInspectorWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('voltora_inspector_width');
      return saved ? parseInt(saved, 10) : 420;
    } catch {
      return 420;
    }
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const isResizingRef = useRef<boolean>(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(300, Math.min(window.innerWidth - 380, newWidth));
      setInspectorWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        try {
          localStorage.setItem('voltora_inspector_width', String(inspectorWidth));
        } catch {}
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [inspectorWidth]);

  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load benchmark telemetry at mount
  useEffect(() => {
    fetch('/api/benchmark')
      .then((r) => r.json())
      .then((d) => setBenchmarkData(d))
      .catch(() => {});
  }, []);

  // Handle file upload
  const processFile = async (file: File) => {
    setAnalyzingDocName(file.name);
    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data: AuditReport = await res.json();
        setReport(data);
        setActivePage(1);
        if (data.issues.length > 0) {
          setActiveIssue(data.issues[0]);
        } else {
          setActiveIssue(null);
        }
        setIsInspectorOpen(true);
        setIsAnalyzing(false);
      } else {
        const err = await res.json();
        alert(err.detail || 'Upload failed');
        setIsAnalyzing(false);
      }
    } catch (err) {
      console.error('Error processing upload:', err);
      alert('Network or server error during upload.');
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (file: File) => {
    processFile(file);
  };

  const handleSelectSample = async (sampleName: string) => {
    const docTitle = sampleName === 'acme_fy24_annual_report'
      ? 'Acme Corp FY24 Annual Report'
      : 'Apex Technologies Financial Disclosure';
    setAnalyzingDocName(docTitle);
    setIsAnalyzing(true);

    try {
      const res = await fetch(`/api/sample/${sampleName}`);
      if (res.ok) {
        const data: AuditReport = await res.json();
        setReport(data);
        setActivePage(1);
        if (data.issues.length > 0) {
          setActiveIssue(data.issues[0]);
        } else {
          setActiveIssue(null);
        }
        setIsInspectorOpen(true);
        setIsAnalyzing(false);
      } else {
        alert('Failed to load sample document.');
        setIsAnalyzing(false);
      }
    } catch (err) {
      console.error('Error loading sample:', err);
      alert('Network or server error loading sample.');
      setIsAnalyzing(false);
    }
  };

  const handleExportMemo = () => {
    if (!report) return;
    const timestamp = new Date().toLocaleString();
    const memo = `# FINANCIAL & DOCUMENT REVIEW MEMORANDUM
**Document Evaluated:** ${report.doc_name}
**Review Date:** ${timestamp}
**Document Health Score:** ${report.summary.health_score} / 100
**Assigned Review Status:** Grade ${report.summary.grade} (${report.summary.grade === 'A+' ? 'NO DISCREPANCIES DETECTED WITHIN EVALUATED RULES' : 'DISCREPANCIES FLAGGED FOR REVIEW'})

## 1. Executive Summary
${report.summary.total_issues === 0 
  ? 'No discrepancies were detected by the automated rule checks across the evaluated pages. (Note: this reflects evaluated rule coverage and does not constitute a certified accounting audit).' 
  : `The automated document review detected ${report.summary.total_issues} potential discrepancies (${report.summary.critical_count} Critical, ${report.summary.warning_count} Warnings) across evaluated pages requiring human reviewer verification.`}

## 2. Evaluated Rule Subsystems
- Mathematical Cross-Footing: ${report.summary.tables_analyzed} tables analyzed for arithmetic consistency
- Semantic Consistency: ${report.total_pages} pages cross-compared for conflicting assertions
- Temporal Sequence Chronology: Evaluated milestone and reporting year sequences
- Scale & Currency Denominations: Checked stated units and currency scales

## 3. Flagged Discrepancies & Audit Evidence Citations
${report.issues.length === 0 ? 'None detected under evaluated rule checks.' : report.issues.map((issue, idx) => `
### Finding #${idx + 1}: ${issue.title}
- **Category:** ${issue.category.replace('_', ' ').toUpperCase()}
- **Severity:** ${issue.severity.toUpperCase()}
- **Primary Source (Page ${issue.primary_anchor.page}):**
  > "${issue.primary_anchor.text}"
${issue.secondary_anchor ? `- **Conflicting Source (Page ${issue.secondary_anchor.page}):**\n  > "${issue.secondary_anchor.text}"` : ''}
${issue.expected_value ? `- **Expected / Calculated Value:** ${issue.expected_value}` : ''}
${issue.actual_value ? `- **Stated Value:** ${issue.actual_value}` : ''}
${issue.delta ? `- **Discrepancy Variance:** ${issue.delta}` : ''}
- **Reviewer Guidance:** ${issue.suggested_fix || 'Review conflicting source disclosures before publication.'}
`).join('\n')}

---
*Generated by Voltora Document Review Assistant (Automated rule evaluation for human reviewer assistance)*
`;

    const blob = new Blob([memo], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Voltora_Audit_Memo_${report.doc_name.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGlobalUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.pdf')) {
      processFile(file);
    }
  };

  // Select issue and jump to anchor page
  const handleSelectIssue = (issue: AuditIssue, targetPage?: number) => {
    setActiveTab('workspace');
    setActiveIssue(issue);
    setIsInspectorOpen(true);
    const dest = targetPage || issue.primary_anchor.page;
    setActivePage(dest);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* ═══ CLEAN AMBIENT BACKGROUND ═══ */}
      <div className="ambient-subtle-bg">
        <div className="ambient-subtle-gradient" />
      </div>

      {/* Hidden Global File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".pdf"
        style={{ display: 'none' }}
      />

      {/* ═══ NAVIGATION (52px) ═══ */}
      <Navbar
        report={report}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        xrayMode={xrayMode}
        onToggleXray={() => setXrayMode(!xrayMode)}
        onUploadClick={handleGlobalUploadClick}
        onBenchmarkClick={() => setShowBenchmarkModal(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        onExportMemo={handleExportMemo}
        onSelectSample={handleSelectSample}
        onResetReport={() => {
          setReport(null);
          setActiveIssue(null);
        }}
      />

      {/* ═══ MAIN WORKSPACE (FULL VIEWPORT HEIGHT, ZERO WASTED SPACE) ═══ */}
      <main style={{ flex: 1, position: 'relative', zIndex: 10, overflow: 'hidden' }}>
        {!report ? (
          <HeroExperience
            onFileSelect={handleFileSelect}
            onSelectSample={handleSelectSample}
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        ) : activeTab === 'workspace' ? (
          <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
            {/* Left: Document Viewer (Expansive, fills all available space) */}
            <div style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative' }}>
              <DocumentViewer
                report={report}
                activePage={activePage}
                onPageChange={setActivePage}
                activeIssue={activeIssue}
                hoveredIssueId={hoveredIssueId}
                onSelectIssue={handleSelectIssue}
                xrayMode={xrayMode}
                onToggleXray={() => setXrayMode(!xrayMode)}
                isInspectorOpen={isInspectorOpen}
                onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
              />
            </div>

            {/* ═══ DRAGGABLE RESIZE DIVIDER (Drag left/right) ═══ */}
            {isInspectorOpen && (
              <div
                onMouseDown={handleStartResize}
                onDoubleClick={() => setInspectorWidth(420)}
                style={{
                  width: '8px',
                  position: 'relative',
                  cursor: 'col-resize',
                  backgroundColor: isResizing ? 'rgba(255, 90, 31, 0.25)' : 'transparent',
                  transition: 'background-color 0.15s ease',
                  zIndex: 30,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="group"
                title="Drag left/right to resize Document Findings panel (Double-click to reset)"
              >
                {/* Thin boundary line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: isResizing ? '#FF5A1F' : 'rgba(255, 120, 80, 0.16)',
                    boxShadow: isResizing ? '0 0 6px #FF5A1F' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  className="group-hover:bg-[#FF5A1F]"
                />
                {/* Central Gripper Indicator */}
                <div
                  style={{
                    width: '4px',
                    height: '32px',
                    borderRadius: '4px',
                    backgroundColor: isResizing ? '#FF5A1F' : 'rgba(255, 120, 80, 0.35)',
                    boxShadow: isResizing ? '0 0 8px rgba(255, 90, 31, 0.8)' : 'none',
                    transition: 'all 0.15s ease',
                    zIndex: 2,
                  }}
                  className="group-hover:bg-[#FF5A1F] group-hover:scale-y-125"
                />
              </div>
            )}

            {/* Right: Issue Inspector (Docked Resizable sidebar) */}
            {isInspectorOpen && (
              <div
                style={{
                  width: `${inspectorWidth}px`,
                  minWidth: '300px',
                  maxWidth: '70vw',
                  height: '100%',
                  flexShrink: 0,
                  transition: isResizing ? 'none' : 'width 0.08s ease-out',
                }}
              >
                <IssueInspector
                  report={report}
                  activeIssue={activeIssue}
                  onSelectIssue={handleSelectIssue}
                  onHoverIssue={setHoveredIssueId}
                  onClose={() => setIsInspectorOpen(false)}
                  onOpenAiChat={(issue) => {
                    if (issue) setActiveIssue(issue);
                    setIsChatOpen(true);
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <FinancialCharts report={report} onSelectIssue={handleSelectIssue} />
          </div>
        )}
      </main>

      {/* ═══ SLIDE-OUT NOTION AI AUDIT CHAT DRAWER ═══ */}
      {report && (
        <NotionAiChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          report={report}
          activeIssue={activeIssue}
          onJumpToPage={(p) => setActivePage(p)}
          onSelectIssue={handleSelectIssue}
        />
      )}

      {/* ═══ AI THINKING ANIMATION MODAL ═══ */}
      <AnalysisModal isOpen={isAnalyzing} docName={analyzingDocName} />

      {/* ═══ INSTITUTIONAL BENCHMARK MODAL ═══ */}
      <BenchmarkModal
        isOpen={showBenchmarkModal}
        onClose={() => setShowBenchmarkModal(false)}
        data={benchmarkData}
      />
    </div>
  );
}
