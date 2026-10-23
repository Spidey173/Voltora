import React, { useState, useEffect, useRef } from 'react';
import type { AuditReport, AuditIssue, BenchmarkMetrics } from './types';
import { sampleReports } from './data/sampleReports';
import { benchmarkData } from './data/benchmarkData';
import { DemoService } from './services/demoService';
import { DemoBanner } from './components/DemoBanner';
import { Navbar } from './components/Navbar';
import { HeroExperience } from './components/HeroExperience';
import { AnalysisModal } from './components/AnalysisModal';
import { DocumentViewer } from './components/DocumentViewer';
import { IssueInspector } from './components/IssueInspector';
import { FinancialCharts } from './components/FinancialCharts';
import { NotionAiChatDrawer } from './components/NotionAiChatDrawer';
import { BenchmarkModal } from './components/BenchmarkModal';

export default function App() {
  // Default to Acme FY24 Annual Report so recruiters immediately see rich live data
  const [report, setReport] = useState<AuditReport | null>(sampleReports['acme_fy24_annual_report']);
  const [activeTab, setActiveTab] = useState<'workspace' | 'analytics'>('workspace');
  const [activePage, setActivePage] = useState<number>(1);
  const [activeIssue, setActiveIssue] = useState<AuditIssue | null>(
    sampleReports['acme_fy24_annual_report'].issues[0] || null
  );
  const [hoveredIssueId, setHoveredIssueId] = useState<string | null>(null);
  const [xrayMode, setXrayMode] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzingDocName, setAnalyzingDocName] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState<boolean>(false);
  const [benchmarkMetrics, setBenchmarkMetrics] = useState<BenchmarkMetrics>(benchmarkData);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);

  // Resizable Document Findings Panel (Left / Right drag)
  const [inspectorWidth, setInspectorWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('voltora_demo_inspector_width');
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
          localStorage.setItem('voltora_demo_inspector_width', String(inspectorWidth));
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

  // Switch between sample audit reports
  const handleSelectSample = async (sampleId: string) => {
    const sample = sampleReports[sampleId];
    if (!sample) return;

    setAnalyzingDocName(sample.doc_name);
    setIsAnalyzing(true);

    // Brief realistic transition
    await new Promise((resolve) => setTimeout(resolve, 400));

    setReport(sample);
    setActivePage(1);
    setActiveIssue(sample.issues.length > 0 ? sample.issues[0] : null);
    setIsInspectorOpen(true);
    setIsAnalyzing(false);
  };

  // Upload handler for user-dragged files
  const processUploadedFile = (file: File) => {
    setAnalyzingDocName(file.name);
    setIsAnalyzing(true);

    setTimeout(() => {
      setIsAnalyzing(false);
      // Check if file name matches one of our samples
      const lower = file.name.toLowerCase();
      if (lower.includes('apex') || lower.includes('clean')) {
        handleSelectSample('apex_clean_baseline');
      } else if (lower.includes('vertex')) {
        handleSelectSample('vertex_energy_q3');
      } else if (lower.includes('nova')) {
        handleSelectSample('nova_quarterly_update');
      } else if (lower.includes('solaris')) {
        handleSelectSample('solaris_edge_cases');
      } else {
        // Load Acme and inform user
        handleSelectSample('acme_fy24_annual_report');
      }
    }, 700);
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
*Generated by Voltora Document Review Assistant • Deployed on Vercel Edge*
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
      processUploadedFile(file);
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
      processUploadedFile(file);
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

      {/* ═══ TOP PORTFOLIO DEMO BANNER ═══ */}
      <DemoBanner onOpenBenchmark={() => setShowBenchmarkModal(true)} />

      {/* ═══ NAVIGATION (52px) ═══ */}
      <Navbar
        report={report}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        xrayMode={xrayMode}
        onToggleXray={() => setXrayMode(!xrayMode)}
        onBenchmarkClick={() => setShowBenchmarkModal(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        onExportMemo={handleExportMemo}
        onSelectSample={handleSelectSample}
        onResetReport={() => setReport(null)}
      />

      {/* ═══ MAIN WORKSPACE OR HERO VIEW ═══ */}
      {!report ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <HeroExperience
            onSelectSample={handleSelectSample}
            onFileSelect={processUploadedFile}
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Main Content Area */}
          <main
            id="main-content"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              overflow: 'hidden',
              backgroundColor: '#0F0A0D',
            }}
          >
            {activeTab === 'workspace' ? (
              <DocumentViewer
                report={report}
                activePage={activePage}
                onPageChange={setActivePage}
                activeIssue={activeIssue}
                hoveredIssueId={hoveredIssueId}
                onSelectIssue={handleSelectIssue}
                xrayMode={xrayMode}
                onToggleXray={() => setXrayMode(!xrayMode)}
                onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
                isInspectorOpen={isInspectorOpen}
              />
            ) : (
              <FinancialCharts
                report={report}
                onSelectIssue={handleSelectIssue}
              />
            )}
          </main>

          {/* Resizable Divider Handle */}
          {activeTab === 'workspace' && isInspectorOpen && (
            <div
              onMouseDown={handleStartResize}
              style={{
                width: '6px',
                backgroundColor: isResizing ? '#FF5A1F' : 'rgba(255, 120, 80, 0.12)',
                cursor: 'col-resize',
                userSelect: 'none',
                transition: 'background-color 0.15s ease',
                zIndex: 20,
              }}
              className="hover:bg-[#FF5A1F]"
              title="Drag to resize Document Findings panel"
            />
          )}

          {/* Right Document Findings Panel */}
          {activeTab === 'workspace' && isInspectorOpen && (
            <aside
              aria-label="Document Findings"
              style={{
                width: `${inspectorWidth}px`,
                flexShrink: 0,
                borderLeft: '1px solid rgba(255, 120, 80, 0.14)',
                backgroundColor: '#140E11',
                zIndex: 10,
              }}
            >
              <IssueInspector
                report={report}
                activeIssue={activeIssue}
                onSelectIssue={handleSelectIssue}
                onHoverIssue={setHoveredIssueId}
                onClose={() => setIsInspectorOpen(false)}
                onOpenAiChat={() => setIsChatOpen(true)}
              />
            </aside>
          )}
        </div>
      )}

      {/* ═══ NOTION AI CHAT DRAWER ═══ */}
      {report && (
        <NotionAiChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          report={report}
          activeIssue={activeIssue}
          onJumpToPage={(p) => {
            setActiveTab('workspace');
            setActivePage(p);
          }}
          onSelectIssue={handleSelectIssue}
        />
      )}

      {/* ═══ BENCHMARK METRICS MODAL ═══ */}
      <BenchmarkModal
        isOpen={showBenchmarkModal}
        onClose={() => setShowBenchmarkModal(false)}
        data={benchmarkMetrics}
      />

      {/* ═══ ANALYSIS SPINNER MODAL ═══ */}
      <AnalysisModal
        isOpen={isAnalyzing}
        docName={analyzingDocName}
      />
    </div>
  );
}
