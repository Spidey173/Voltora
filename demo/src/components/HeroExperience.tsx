import React from 'react';
import {
  UploadCloud,
  ArrowRight,
  Calculator,
  ArrowRightLeft,
  FileCheck2,
  Flame,
  Lock,
  Layers,
} from 'lucide-react';

interface HeroExperienceProps {
  onFileSelect: (file: File) => void;
  onSelectSample?: (sampleName: string) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export const HeroExperience: React.FC<HeroExperienceProps> = ({
  onFileSelect,
  onSelectSample,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        zIndex: 10,
      }}
    >
      {/* ═══ TOP ANNOUNCEMENT PILL ═══ */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 16px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(255, 90, 31, 0.10)',
          border: '1px solid rgba(255, 120, 80, 0.25)',
          color: '#FFA87D',
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '24px',
          boxShadow: '0 2px 12px rgba(255, 90, 31, 0.15)',
        }}
      >
        <Flame size={14} color="#FF7036" />
        <span>Automated Multi-Dimensional Document Auditor</span>
      </div>

      {/* ═══ HEADLINE ═══ */}
      <div style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '36px' }}>
        <h1
          className="font-heading"
          style={{
            fontSize: 'clamp(36px, 5.2vw, 62px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            color: '#FFF1EE',
            marginBottom: '16px',
          }}
        >
          Review financial documents{' '}
          <span className="sunset-gradient-text">in seconds.</span>
        </h1>
        <p
          className="font-body"
          style={{
            fontSize: 'clamp(16px, 2vw, 19px)',
            color: '#BCA3A7',
            lineHeight: 1.6,
            maxWidth: '650px',
            margin: '0 auto',
          }}
        >
          Voltora automatically extracts numbers, cross-checks arithmetic totals, and flags cross-page contradictions—without asking questions.
        </p>
      </div>

      {/* ═══ CLEAN, BEAUTIFUL UPLOAD ZONE WITH MAGMA SUNSET ACCENTS ═══ */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: isDragOver ? 'rgba(255, 90, 31, 0.08)' : '#140E11',
          border: isDragOver
            ? '2px dashed #FF5A1F'
            : '1px solid rgba(255, 120, 80, 0.18)',
          borderRadius: '16px',
          padding: '40px 32px 32px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          boxShadow: isDragOver
            ? '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 90, 31, 0.25)'
            : '0 20px 40px rgba(0, 0, 0, 0.6)',
          transition: 'all 0.2s ease',
          marginBottom: '28px',
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept=".pdf"
          style={{ display: 'none' }}
        />

        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(255, 56, 56, 0.16) 0%, rgba(255, 161, 51, 0.16) 100%)',
            border: '1px solid rgba(255, 120, 80, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#FF7036',
            boxShadow: '0 4px 16px rgba(255, 90, 31, 0.2)',
          }}
        >
          <UploadCloud size={28} />
        </div>

        <h3
          className="font-heading"
          style={{
            fontSize: '19px',
            fontWeight: 700,
            color: '#FFF1EE',
            marginBottom: '6px',
          }}
        >
          Drop your PDF document here
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: '#BCA3A7',
            marginBottom: '18px',
          }}
        >
          Supports Annual Reports (10-K, 10-Q), financial models, and investor disclosures
        </p>

        <button className="btn-primary" style={{ padding: '9px 22px', fontSize: '13px' }}>
          <span>Choose PDF File</span>
          <ArrowRight size={15} />
        </button>

        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            fontSize: '12px',
            color: '#806B70',
          }}
        >
          <span>⚡ Fast Synchronous Audit</span>
          <span>•</span>
          <span>🔒 Local Session Storage</span>
          <span>•</span>
          <span>📍 Linked PDF Pin Highlights</span>
        </div>
      </div>

      {/* ═══ SINGLE-USER & LOCAL DEPLOYMENT ADVISORY ═══ */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          marginTop: '8px',
          marginBottom: '28px',
          padding: '10px 14px',
          backgroundColor: 'rgba(255, 120, 80, 0.06)',
          border: '1px solid rgba(255, 120, 80, 0.18)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '11px',
          color: '#BCA3A7',
          lineHeight: 1.45,
          textAlign: 'left',
        }}
      >
        <Lock size={14} color="#FF7036" style={{ flexShrink: 0 }} />
        <span>
          <strong style={{ color: '#FFE7E3' }}>Local Single-User Notice:</strong> Voltora runs in-memory without user authentication or tenant isolation. It is intended solely for local desktop review and should not be hosted on public networks with confidential documents.
        </span>
      </div>

      {/* ═══ 1-CLICK INSTANT SAMPLES FOR PRO AUDITING ═══ */}
      {onSelectSample && (
        <div style={{ width: '100%', maxWidth: '720px', marginBottom: '40px' }}>
          <div
            style={{
              fontSize: '11px',
              color: '#806B70',
              textAlign: 'center',
              marginBottom: '14px',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            — OR EVALUATE PRE-LOADED SAMPLE DISCLOSURES —
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {/* Acme Corp FY24 */}
            <button
              onClick={() => onSelectSample('acme_fy24_annual_report')}
              className="btn-secondary"
              style={{
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                borderRadius: '10px',
                backgroundColor: '#160F13',
                border: '1px solid rgba(255, 90, 31, 0.28)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF7036', fontWeight: 700, fontSize: '13px' }}>
                <Flame size={15} />
                <span>Acme Corp FY24</span>
                <span
                  style={{
                    fontSize: '10px',
                    backgroundColor: 'rgba(255, 56, 56, 0.16)',
                    color: '#FF3838',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  8 Discrepancies
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#BCA3A7', marginTop: '6px', lineHeight: 1.4 }}>
                Math summation errors, 12% vs 14% revenue conflict, debt notes, and scale mismatch.
              </div>
            </button>

            {/* Apex Technologies */}
            <button
              onClick={() => onSelectSample('clean_financial_statement')}
              className="btn-secondary"
              style={{
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                borderRadius: '10px',
                backgroundColor: '#160F13',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 700, fontSize: '13px' }}>
                <FileCheck2 size={15} />
                <span>Apex Technologies</span>
                <span
                  style={{
                    fontSize: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.16)',
                    color: '#10B981',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  Clean Baseline Control (Grade A+)
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#BCA3A7', marginTop: '6px', lineHeight: 1.4 }}>
                Clean sample document: arithmetic sums and disclosures evaluate with 0 flagged issues.
              </div>
            </button>

            {/* Vertex Energy Review */}
            <button
              onClick={() => onSelectSample('vertex_energy_audit')}
              className="btn-secondary"
              style={{
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                borderRadius: '10px',
                backgroundColor: '#160F13',
                border: '1px solid rgba(255, 120, 80, 0.22)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFA87D', fontWeight: 700, fontSize: '13px' }}>
                <Layers size={15} />
                <span>Vertex Energy Review</span>
                <span
                  style={{
                    fontSize: '10px',
                    backgroundColor: 'rgba(255, 161, 51, 0.16)',
                    color: '#FFA133',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  2 Discrepancies
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#BCA3A7', marginTop: '6px', lineHeight: 1.4 }}>
                In-text percentage growth rate discrepancy and project kickoff milestone reversal.
              </div>
            </button>

            {/* Solaris AI Edge Cases */}
            <button
              onClick={() => onSelectSample('solaris_edge_cases')}
              className="btn-secondary"
              style={{
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                borderRadius: '10px',
                backgroundColor: '#160F13',
                border: '1px solid rgba(255, 120, 80, 0.22)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFA87D', fontWeight: 700, fontSize: '13px' }}>
                <Layers size={15} />
                <span>Solaris AI Edge Cases</span>
                <span
                  style={{
                    fontSize: '10px',
                    backgroundColor: 'rgba(255, 161, 51, 0.16)',
                    color: '#FFA133',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  2 Discrepancies
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#BCA3A7', marginTop: '6px', lineHeight: 1.4 }}>
                Negative regional outlays schedule and revenue growth percentage conflict.
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ═══ 3 FEATURE CARDS IN WARM VOLCANIC OBSIDIAN ═══ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          width: '100%',
          maxWidth: '980px',
        }}
      >
        <div className="clean-card">
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 90, 31, 0.12)',
              border: '1px solid rgba(255, 90, 31, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF7036',
              marginBottom: '14px',
            }}
          >
            <Calculator size={18} />
          </div>
          <h4
            className="font-heading"
            style={{ fontSize: '15px', fontWeight: 700, color: '#FFF1EE', marginBottom: '8px' }}
          >
            Mathematical Cross-Footing
          </h4>
          <p style={{ fontSize: '12px', color: '#BCA3A7', lineHeight: 1.5 }}>
            Validates row and column subtotals across balance sheets and income schedules with exact arithmetic derivations.
          </p>
        </div>

        <div className="clean-card">
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 90, 31, 0.12)',
              border: '1px solid rgba(255, 90, 31, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF7036',
              marginBottom: '14px',
            }}
          >
            <ArrowRightLeft size={18} />
          </div>
          <h4
            className="font-heading"
            style={{ fontSize: '15px', fontWeight: 700, color: '#FFF1EE', marginBottom: '8px' }}
          >
            Cross-Page Consistency
          </h4>
          <p style={{ fontSize: '12px', color: '#BCA3A7', lineHeight: 1.5 }}>
            Flags contradictory statements where narrative claims in the MD&A diverge from footnote disclosures or tables.
          </p>
        </div>

        <div className="clean-card">
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 90, 31, 0.12)',
              border: '1px solid rgba(255, 90, 31, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF7036',
              marginBottom: '14px',
            }}
          >
            <FileCheck2 size={18} />
          </div>
          <h4
            className="font-heading"
            style={{ fontSize: '15px', fontWeight: 700, color: '#FFF1EE', marginBottom: '8px' }}
          >
            Physical Coordinate Jumper Pins
          </h4>
          <p style={{ fontSize: '12px', color: '#BCA3A7', lineHeight: 1.5 }}>
            Every finding links directly to bounding-box coordinates on the rendered PDF canvas, enabling instant review verification.
          </p>
        </div>
      </div>
    </div>
  );
};
