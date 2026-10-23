import React, { useState } from 'react';
import { CheckCircle2, X, ExternalLink, Zap } from 'lucide-react';

interface DemoBannerProps {
  onOpenBenchmark: () => void;
}

const GithubIcon: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const DemoBanner: React.FC<DemoBannerProps> = ({ onOpenBenchmark }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Portfolio Demo Announcement"
      style={{
        position: 'relative',
        zIndex: 60,
        background: 'linear-gradient(90deg, #1A0D10 0%, #241117 35%, #2A141A 70%, #1A0D10 100%)',
        borderBottom: '1px solid rgba(255, 90, 31, 0.28)',
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#FFF1EE',
      }}
    >
      {/* Left: Indicator & Pitch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: 'rgba(255, 90, 31, 0.16)',
            border: '1px solid rgba(255, 90, 31, 0.4)',
            color: '#FF7036',
            borderRadius: '9999px',
            padding: '2px 8px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontSize: '9.5px',
          }}
        >
          <Zap size={11} className="text-[#FF5A1F]" />
          <span>Live Portfolio Demo</span>
        </div>

        <span style={{ color: '#E5D6DA', fontWeight: 500 }}>
          Interactive preview deployed on Vercel • Deterministic cross-statement reconciliation & arithmetic proofs with zero backend latency.
        </span>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onOpenBenchmark}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: 'rgba(16, 185, 129, 0.14)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#10B981',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Inspect empirical 12/12 synthetic test suite"
        >
          <CheckCircle2 size={12} />
          <span>Regression Suite (12/12 Passed)</span>
        </button>

        <a
          href="https://github.com/Spidey173/Voltora"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 120, 80, 0.2)',
            color: '#FFF1EE',
            borderRadius: '6px',
            padding: '3px 9px',
            fontSize: '11px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
          className="hover:border-[#FF5A1F] hover:text-[#FFA87D]"
        >
          <GithubIcon size={12} />
          <span>GitHub Repo</span>
          <ExternalLink size={10} style={{ opacity: 0.6 }} />
        </a>

        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#806B70',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
          className="hover:text-[#FFF1EE]"
          title="Dismiss banner"
        >
          <X size={13} />
        </button>
      </div>
    </aside>
  );
};
