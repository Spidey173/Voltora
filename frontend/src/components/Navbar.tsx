import React from 'react';
import {
  ShieldAlert,
  Sparkles,
  FileText,
  Layers,
  Activity,
  Download,
  X,
  Lock,
} from 'lucide-react';
import type { AuditReport } from '../types';

interface NavbarProps {
  report: AuditReport | null;
  activeTab: 'workspace' | 'analytics';
  onTabChange: (tab: 'workspace' | 'analytics') => void;
  xrayMode: boolean;
  onToggleXray: () => void;
  onUploadClick: () => void;
  onBenchmarkClick: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onExportMemo?: () => void;
  onSelectSample?: (sampleName: string) => void;
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
  onResetReport,
}) => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '52px',
        backgroundColor: 'rgba(12, 8, 10, 0.90)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 120, 80, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
      }}
    >
      {/* ═══ LEFT: BRAND & ACTIVE DOCUMENT ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          onClick={onResetReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            cursor: onResetReport ? 'pointer' : 'default',
          }}
          title={onResetReport ? 'Back to Document Upload & Home' : 'Voltora Auditor'}
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
              Auditor
            </span>
            <span
              style={{
                fontSize: '10px',
                color: '#BCA3A7',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 120, 80, 0.16)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Local Single-User Architecture: No authentication or multi-tenant isolation. Intended for local desktop use."
            >
              <Lock size={9} color="#FF7036" />
              <span>Single-User</span>
            </span>
          </div>
        </div>

        {/* Current Document Pill with Close / New Audit button */}
        {report && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 120, 80, 0.14)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#FFF1EE',
            }}
          >
            <FileText size={13} color="#FF5A1F" />
            <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {report.doc_name}
            </span>
            <span style={{ color: '#806B70' }}>•</span>
            <span style={{ color: '#BCA3A7' }}>{report.total_pages} {report.total_pages === 1 ? 'page' : 'pages'}</span>
            
            {onResetReport && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResetReport();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#806B70',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '4px',
                }}
                className="hover:text-[#FF3838]"
                title="Close document and return to upload"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══ CENTER: CLEAN VIEW SWITCHER ═══ */}
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
            <span>Document Audit</span>
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

      {/* ═══ RIGHT: STREAMLINED FORENSIC STATUS & ACTIONS ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {report && (
          <>
            {/* Unified Audit Health Pill */}
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
              title="Click to view full Institutional Benchmark metrics"
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
                title="Export Forensic Audit Memorandum"
              >
                <Download size={13} color="#FFA133" />
                <span>Export Memo</span>
              </button>
            )}

            {/* AI Copilot Drawer */}
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
            >
              <Sparkles size={13} color="#FF7036" />
              <span>Ask AI</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
