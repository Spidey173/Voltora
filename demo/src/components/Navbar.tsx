import React, { useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  FileText,
  Layers,
  Activity,
  Download,
  X,
  ChevronDown,
  Check,
  Zap,
} from 'lucide-react';
import type { AuditReport } from '../types';
import { sampleReportsList } from '../data/sampleReports';

interface NavbarProps {
  report: AuditReport | null;
  activeTab: 'workspace' | 'analytics';
  onTabChange: (tab: 'workspace' | 'analytics') => void;
  xrayMode: boolean;
  onToggleXray: () => void;
  onBenchmarkClick: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onExportMemo?: () => void;
  onSelectSample: (sampleId: string) => void;
  onResetReport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  report,
  activeTab,
  onTabChange,
  onBenchmarkClick,
  onToggleChat,
  isChatOpen,
  onExportMemo,
  onSelectSample,
  onResetReport,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '52px',
        backgroundColor: 'rgba(14, 9, 12, 0.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 120, 80, 0.14)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
      }}
    >
      {/* ═══ LEFT: BRAND & SAMPLE DOCUMENT SWITCHER ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          onClick={onResetReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            cursor: onResetReport ? 'pointer' : 'default',
          }}
          title={onResetReport ? 'Back to Overview' : 'Voltora Auditor'}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #FF3838 0%, #FF5A1F 60%, #FFA133 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(255, 90, 31, 0.35)',
            }}
          >
            <ShieldAlert size={16} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              className="font-heading"
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: '#FFF1EE',
                letterSpacing: '-0.02em',
              }}
            >
              Voltora
            </span>
            <span
              style={{
                fontSize: '10px',
                color: '#FFA87D',
                backgroundColor: 'rgba(255, 90, 31, 0.12)',
                border: '1px solid rgba(255, 90, 31, 0.25)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Demo
            </span>
          </div>
        </div>

        {/* Interactive Sample Document Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 120, 80, 0.18)',
              padding: '5px 11px',
              borderRadius: '7px',
              fontSize: '12px',
              color: '#FFF1EE',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            className="hover:border-[#FF5A1F]"
            title="Switch sample audit document"
          >
            <FileText size={13} color="#FF5A1F" />
            <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {report ? report.doc_name : 'Select Sample Document'}
            </span>
            {report && (
              <span style={{ color: '#806B70', fontSize: '11px' }}>
                ({report.total_pages} {report.total_pages === 1 ? 'pg' : 'pgs'})
              </span>
            )}
            <ChevronDown size={13} color="#BCA3A7" />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '6px',
                width: '320px',
                backgroundColor: '#1A1216',
                border: '1px solid rgba(255, 120, 80, 0.22)',
                borderRadius: '8px',
                boxShadow: '0 12px 36px rgba(0,0,0,0.65)',
                zIndex: 100,
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ padding: '6px 8px 4px 8px', fontSize: '10px', color: '#806B70', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Pre-Audited Test Documents
              </div>

              {sampleReportsList.map((sample) => {
                const isSelected = report?.doc_id === sample.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => {
                      onSelectSample(sample.id);
                      setDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: isSelected ? 'rgba(255, 90, 31, 0.15)' : 'transparent',
                      color: isSelected ? '#FFA87D' : '#FFF1EE',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'background 0.12s ease',
                    }}
                    className="hover:bg-[rgba(255,255,255,0.05)]"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '240px' }}>
                      <div style={{ fontWeight: isSelected ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sample.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#806B70' }}>
                        {sample.pages} pages • {sample.issuesCount === 0 ? 'Clean (Grade A+)' : `${sample.issuesCount} issues detected`}
                      </div>
                    </div>
                    {isSelected && <Check size={14} color="#FF7036" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ CENTER: VIEW SWITCHER ═══ */}
      {report && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 120, 80, 0.12)',
            borderRadius: '8px',
            padding: '2px',
            gap: '2px',
          }}
        >
          <button
            onClick={() => onTabChange('workspace')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'workspace' ? 'linear-gradient(135deg, #FF3838 0%, #FF5A1F 100%)' : 'transparent',
              color: activeTab === 'workspace' ? '#FFFFFF' : '#BCA3A7',
              boxShadow: activeTab === 'workspace' ? '0 2px 8px rgba(255, 90, 31, 0.3)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={13} />
            <span>Document Review</span>
          </button>

          <button
            onClick={() => onTabChange('analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'analytics' ? 'linear-gradient(135deg, #FF3838 0%, #FF5A1F 100%)' : 'transparent',
              color: activeTab === 'analytics' ? '#FFFFFF' : '#BCA3A7',
              boxShadow: activeTab === 'analytics' ? '0 2px 8px rgba(255, 90, 31, 0.3)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Activity size={13} />
            <span>Timeline & Flow</span>
          </button>
        </div>
      )}

      {/* ═══ RIGHT: REVIEW STATUS & ACTIONS ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {report && (
          <>
            {/* Health Pill (Clickable -> Opens Benchmark Suite) */}
            <div
              onClick={onBenchmarkClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                backgroundColor: report.summary.health_score >= 80 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 56, 56, 0.08)',
                border: report.summary.health_score >= 80 ? '1px solid rgba(16, 185, 129, 0.28)' : '1px solid rgba(255, 56, 56, 0.28)',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Click to view Synthetic Regression Results"
            >
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: report.summary.health_score >= 80 ? '#10B981' : '#FF3838',
                  boxShadow: `0 0 6px ${report.summary.health_score >= 80 ? '#10B981' : '#FF3838'}`,
                }}
              />
              <span style={{ color: '#BCA3A7', fontSize: '11px' }}>Health:</span>
              <span
                style={{
                  fontWeight: 700,
                  color: report.summary.health_score >= 80 ? '#10B981' : '#FF3838',
                }}
              >
                {report.summary.health_score}/100
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: report.summary.health_score >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 56, 56, 0.2)',
                  color: report.summary.health_score >= 80 ? '#10B981' : '#FF3838',
                }}
              >
                Grade {report.summary.grade}
              </span>
              <span style={{ color: '#806B70' }}>•</span>
              <span
                style={{
                  color: report.summary.total_issues === 0 ? '#10B981' : '#FFA87D',
                  fontWeight: 600,
                  fontSize: '11px',
                }}
              >
                {report.summary.total_issues === 0 ? 'Clean' : `${report.summary.total_issues} Issues`}
              </span>
            </div>

            {/* Export Memorandum */}
            {onExportMemo && (
              <button
                onClick={onExportMemo}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '12px' }}
                title="Export Document Review Memorandum"
              >
                <Download size={13} color="#FFA133" />
                <span>Export Memo</span>
              </button>
            )}

            {/* AI Review Copilot Drawer */}
            <button
              onClick={onToggleChat}
              className="btn-secondary"
              style={{
                padding: '6px 11px',
                fontSize: '12px',
                borderColor: isChatOpen ? '#FF5A1F' : 'rgba(255, 120, 80, 0.16)',
                backgroundColor: isChatOpen ? 'rgba(255, 90, 31, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                color: isChatOpen ? '#FFA87D' : '#FFF1EE',
              }}
              title="Open AI Review Assistant"
            >
              <Sparkles size={13} color="#FF7036" />
              <span>Ask AI</span>
            </button>
          </>
        )}

        <button
          onClick={onBenchmarkClick}
          className="btn-secondary"
          style={{ padding: '6px 10px', fontSize: '12px' }}
          title="Synthetic Regression Results"
        >
          <Zap size={13} color="#FF5A1F" />
          <span>Regression</span>
        </button>
      </div>
    </header>
  );
};
