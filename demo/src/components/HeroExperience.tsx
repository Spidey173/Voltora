import React from 'react';
import {
  UploadCloud,
  ArrowRight,
  Calculator,
  ArrowRightLeft,
  FileCheck2,
  Flame,
  FileText,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { sampleDocMetadata } from '../data/sampleReports';

interface HeroExperienceProps {
  onFileSelect: (file: File) => void;
  onSelectSample: (sampleName: string) => void;
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
        padding: '36px 20px',
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
          marginBottom: '20px',
          boxShadow: '0 2px 12px rgba(255, 90, 31, 0.15)',
        }}
      >
        <Flame size={14} color="#FF7036" />
        <span>Automated Multi-Dimensional Document Auditor • Portfolio Demo</span>
      </div>

      {/* ═══ HEADLINE ═══ */}
      <div style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '28px' }}>
        <h1
          className="font-heading"
          style={{
            fontSize: 'clamp(32px, 4.5vw, 54px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            color: '#FFF1EE',
            marginBottom: '14px',
          }}
        >
          Review financial documents{' '}
          <span className="sunset-gradient-text">in seconds.</span>
        </h1>
        <p
          className="font-body"
          style={{
            fontSize: 'clamp(15px, 1.8vw, 17px)',
            color: '#BCA3A7',
            lineHeight: 1.6,
            maxWidth: '650px',
            margin: '0 auto',
          }}
        >
          Voltora automatically cross-checks table sums, highlights cross-page narrative contradictions, and anchors findings with coordinate jumper pins.
        </p>
      </div>

      {/* ═══ PRE-LOADED SAMPLE SELECTOR (HERO FIRST) ═══ */}
      <div style={{ width: '100%', maxWidth: '820px', marginBottom: '32px' }}>
        <div
          style={{
            fontSize: '11px',
            color: '#806B70',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: '14px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={13} color="#FF7036" />
          <span>Select Any Sample Document To Launch Interactive Audit</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {sampleDocMetadata.map((doc) => {
            const isClean = doc.isClean;
            return (
              <button
                key={doc.id}
                onClick={() => onSelectSample(doc.id)}
                className="clean-card"
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: isClean ? '1px solid rgba(16, 185, 129, 0.28)' : '1px solid rgba(255, 120, 80, 0.22)',
                  backgroundColor: isClean ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 90, 31, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={15} color={isClean ? '#10B981' : '#FF7036'} />
                    <span style={{ fontWeight: 700, color: '#FFF1EE', fontSize: '13px' }}>
                      {doc.title}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      backgroundColor: isClean ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 56, 56, 0.2)',
                      color: isClean ? '#10B981' : '#FF5A1F',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    Grade {doc.grade}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: '#BCA3A7', lineHeight: 1.4, marginBottom: '8px' }}>
                  {doc.subtitle}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 'auto' }}>
                  <span style={{ fontSize: '10px', color: '#806B70' }}>
                    {doc.pages} pages • {doc.issuesCount} issues
                  </span>
                  <span style={{ fontSize: '11px', color: '#FFA87D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                    Inspect <ArrowRight size={12} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ UPLOAD ZONE (OR DRAG & DROP CUSTOM PDF) ═══ */}
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
          padding: '28px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.2s ease',
          marginBottom: '32px',
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
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(255, 56, 56, 0.16) 0%, rgba(255, 161, 51, 0.16) 100%)',
            border: '1px solid rgba(255, 120, 80, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            color: '#FF7036',
          }}
        >
          <UploadCloud size={24} />
        </div>

        <div className="font-heading" style={{ fontSize: '15px', fontWeight: 700, color: '#FFF1EE', marginBottom: '4px' }}>
          Drop custom PDF here, or <span style={{ color: '#FF7036', textDecoration: 'underline' }}>browse</span>
        </div>
        <div style={{ fontSize: '12px', color: '#806B70' }}>
          Supports corporate reports, 10-K filings, and financial statements up to 25MB
        </div>
      </div>

      {/* ═══ 3 FEATURE CARDS ═══ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          width: '100%',
          maxWidth: '820px',
        }}
      >
        <div className="clean-card">
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 90, 31, 0.12)',
              border: '1px solid rgba(255, 90, 31, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF7036',
              marginBottom: '12px',
            }}
          >
            <ArrowRightLeft size={16} />
          </div>
          <h4 className="font-heading" style={{ fontSize: '14px', fontWeight: 700, color: '#FFF1EE', marginBottom: '4px' }}>
            Cross-Page Contradictions
          </h4>
          <p style={{ fontSize: '12px', color: '#BCA3A7', lineHeight: 1.5 }}>
            Surfaces conflicting disclosures across disparate pages. Page 1 narrative claims 12% revenue growth, while Page 3 table indicates 14%.
          </p>
        </div>

        <div className="clean-card">
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 161, 51, 0.12)',
              border: '1px solid rgba(255, 161, 51, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFA133',
              marginBottom: '12px',
            }}
          >
            <Calculator size={16} />
          </div>
          <h4 className="font-heading" style={{ fontSize: '14px', fontWeight: 700, color: '#FFF1EE', marginBottom: '4px' }}>
            Automated Math Reconciliation
          </h4>
          <p style={{ fontSize: '12px', color: '#BCA3A7', lineHeight: 1.5 }}>
            Deterministic Python verification of table row and column sums, percentage distributions, and financial formulas.
          </p>
        </div>

        <div className="clean-card">
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              marginBottom: '12px',
            }}
          >
            <FileCheck2 size={16} />
          </div>
          <h4 className="font-heading" style={{ fontSize: '14px', fontWeight: 700, color: '#FFF1EE', marginBottom: '4px' }}>
            Coordinate Bounding Pins
          </h4>
          <p style={{ fontSize: '12px', color: '#BCA3A7', lineHeight: 1.5 }}>
            Each finding links directly to normalized [x0, y0, x1, y1] coordinates on rendered PDF canvases with visual jumper pins.
          </p>
        </div>
      </div>
    </div>
  );
};
