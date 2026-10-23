import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Info } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  docName?: string;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, docName }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(12, 8, 10, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          className="clean-panel"
          style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#140E11',
            border: '1px solid rgba(255, 120, 80, 0.22)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 25px rgba(255, 90, 31, 0.12)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(255, 56, 56, 0.18) 0%, rgba(255, 161, 51, 0.18) 100%)',
                border: '1px solid rgba(255, 120, 80, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FF7036',
                boxShadow: '0 2px 10px rgba(255, 90, 31, 0.2)',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                className="font-heading"
                style={{ fontSize: '17px', fontWeight: 700, color: '#FFF1EE', marginBottom: '4px' }}
              >
                Auditing Document
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: '#BCA3A7',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {docName ? `Analyzing ${docName}` : 'Evaluating document evidence'}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 90, 31, 0.12)',
                border: '1px solid rgba(255, 90, 31, 0.25)',
                padding: '4px 10px',
                borderRadius: '6px',
                color: '#FFA87D',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <Loader2 size={13} className="animate-spin" color="#FF7036" />
              <span>Processing</span>
            </div>
          </div>

          {/* Indeterminate Activity Bar */}
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '9999px',
              overflow: 'hidden',
              marginBottom: '20px',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '40%',
                background: 'linear-gradient(90deg, #FF3838 0%, #FF5A1F 60%, #FFA133 100%)',
                borderRadius: '9999px',
                boxShadow: '0 0 12px rgba(255, 90, 31, 0.6)',
                animation: 'pulse 1.4s ease-in-out infinite',
              }}
            />
          </div>

          {/* Truthful Status Card */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 120, 80, 0.10)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '13px', color: '#FFF1EE', fontWeight: 600, marginBottom: '6px' }}>
              Synchronous Audit in Progress
            </div>
            <p style={{ fontSize: '12px', color: '#BCA3A7', lineHeight: 1.55, margin: 0 }}>
              Parsing layout vectors, extracting financial tables, and evaluating deterministic arithmetic, semantic claim consistency, milestone chronology, and unit scale rules.
            </p>
          </div>

          {/* Footer Note */}
          <div
            style={{
              paddingTop: '14px',
              borderTop: '1px solid rgba(255, 120, 80, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: '#806B70',
            }}
          >
            <Info size={13} color="#806B70" style={{ flexShrink: 0 }} />
            <span>
              Audits execute in a single high-efficiency pass with zero artificial delay.
            </span>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
