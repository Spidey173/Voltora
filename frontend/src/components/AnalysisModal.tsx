import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Loader2 } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  docName?: string;
}

const auditSteps = [
  { id: 'ocr', label: 'Extracting text, tables, and layout', sub: 'Parsing vector geometry and high-resolution elements' },
  { id: 'entities', label: 'Parsing numerical figures, units, and currencies', sub: 'Standardizing millions, billions, and currencies' },
  { id: 'matrices', label: 'Reconstructing balance sheets and income tables', sub: 'Building structured financial statement matrices' },
  { id: 'math', label: 'Auditing arithmetic row sums and column totals', sub: 'Cross-footing subtotals and checking percentage splits' },
  { id: 'nli', label: 'Cross-referencing claims across all pages', sub: 'Detecting contradictions between narratives and tables' },
  { id: 'highlights', label: 'Compiling audit report and visual evidence', sub: 'Pinpointing exact bounding box coordinates for each issue' },
];

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, docName }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setProgressPercent(15);
      return;
    }

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < auditSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 800);

    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev < 98) {
          const delta = Math.floor(Math.random() * 5) + 3;
          return Math.min(98, prev + delta);
        }
        return prev;
      });
    }, 200);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isOpen]);

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
            maxWidth: '560px',
            backgroundColor: '#140E11',
            border: '1px solid rgba(255, 120, 80, 0.22)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 25px rgba(255, 90, 31, 0.12)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
              <div>
                <h3
                  className="font-heading"
                  style={{ fontSize: '17px', fontWeight: 700, color: '#FFF1EE', marginBottom: '4px' }}
                >
                  Auditing Document...
                </h3>
                <p style={{ fontSize: '13px', color: '#BCA3A7' }}>
                  {docName ? `Analyzing ${docName}` : 'Checking arithmetic and cross-page consistency'}
                </p>
              </div>
            </div>

            <div
              className="font-heading"
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#FFA87D',
                backgroundColor: 'rgba(255, 90, 31, 0.12)',
                border: '1px solid rgba(255, 90, 31, 0.25)',
                padding: '4px 12px',
                borderRadius: '8px',
              }}
            >
              {progressPercent}%
            </div>
          </div>

          {/* Clean Progress Bar with Magma Lava Sunset Gradient */}
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '9999px',
              overflow: 'hidden',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #FF3838 0%, #FF5A1F 60%, #FFA133 100%)',
                width: `${progressPercent}%`,
                borderRadius: '9999px',
                boxShadow: '0 0 12px rgba(255, 90, 31, 0.6)',
                transition: 'width 0.2s ease-out',
              }}
            />
          </div>

          {/* Steps List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {auditSteps.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: isCurrent ? 'rgba(255, 90, 31, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isCurrent ? '1px solid rgba(255, 90, 31, 0.3)' : '1px solid rgba(255, 120, 80, 0.08)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDone
                          ? 'rgba(16, 185, 129, 0.15)'
                          : isCurrent
                          ? 'rgba(255, 90, 31, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      {isDone ? (
                        <Check size={12} color="#10B981" />
                      ) : isCurrent ? (
                        <Loader2 size={12} color="#FF7036" className="animate-spin" />
                      ) : (
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#806B70' }} />
                      )}
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: isDone ? '#FFF1EE' : isCurrent ? '#FFFFFF' : '#BCA3A7',
                          fontWeight: isCurrent || isDone ? 600 : 400,
                        }}
                      >
                        {step.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#806B70', marginTop: '1px' }}>
                        {step.sub}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      color: isDone ? '#10B981' : isCurrent ? '#FF7036' : '#806B70',
                      fontWeight: 600,
                    }}
                  >
                    {isDone ? 'Complete' : isCurrent ? 'Running...' : 'Queued'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 120, 80, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#BCA3A7',
            }}
          >
            <span>Deterministic mathematical & semantic cross-checks</span>
            <span style={{ color: '#FFA87D', fontWeight: 500 }}>High-precision audit</span>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
