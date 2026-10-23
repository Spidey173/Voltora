# ⚡ Voltora — Live Portfolio Demo

A self-contained, zero-cold-start interactive web demo of **Voltora** designed for instant hosting on **Vercel**, GitHub Pages, or any Edge CDN.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-voltora17.vercel.app-FF5A1F?style=for-the-badge&logo=vercel)](https://voltora17.vercel.app)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSpidey173%2FVoltora&root-directory=demo)

> 🚀 **Live Production Site:** **[https://voltora17.vercel.app](https://voltora17.vercel.app)**

---

## 🎯 Why This Demo Folder?

Full multi-dimensional document review platforms typically require heavy Python runtimes (`PyMuPDF`, `uvicorn`, OCR engines) that suffer from 15–30 second cold starts on serverless platforms and cost money to keep alive.

This `demo/` package delivers the **exact same UI and interactive experience** with **0ms latency**:
- **Pre-Audited Test Corpus:** Includes all 5 synthetic benchmark documents (Acme Corp 8-finding report, Apex Clean Baseline, Vertex Energy, Nova Quarterly, and Solaris AI).
- **150 DPI Visual Evidence:** Pre-rendered high-resolution page assets with interactive bounding boxes and dual coordinate jumper pins.
- **In-Browser Proof Engine:** Instant deterministic answers for issue questions, mathematical cross-footing derivations, and resolution recommendations.
- **Notion-Style Review Copilot:** Interactive slide-over chat drawer with document citations and direct page navigation.
- **Automated Memo Generation:** Generates and downloads formal Markdown audit memorandums directly in the browser.
- **12/12 Synthetic Regression Suite:** Recruiter-accessible evaluation modal displaying empirical accuracy across all 4 rule subsystems.

---

## 🚀 How to Deploy to Vercel in 2 Minutes

### Option 1: Vercel Web UI (Recommended for Portfolio)

1. Go to [vercel.com](https://vercel.com/) and click **"Add New..." > "Project"**.
2. Select your repository: `Spidey173/Voltora`.
3. In the configuration settings:
   - **Root Directory:** Click `Edit` and select **`demo`**.
   - **Framework Preset:** `Vite` (automatically detected).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `dist` (default).
4. Click **Deploy**.

> **Note:** A root-level `vercel.json` is also provided in the repository, so if you deploy the repository root directly without changing settings, Vercel will automatically build from the `demo` directory!

### Option 2: Deploy via Vercel CLI

```bash
# Navigate into the demo folder
cd demo

# Deploy to preview
npx vercel

# Deploy directly to production
npx vercel --prod
```

Your live portfolio URL will be generated immediately (e.g., `https://voltora-demo.vercel.app`).

---

## 💻 Running the Demo Locally

```bash
# 1. Navigate to the demo directory
cd demo

# 2. Install dependencies
npm install

# 3. Start the local Vite development server
npm run dev
# -> Opens http://localhost:5174

# 4. Or build and preview the exact production bundle
npm run build
npm run preview
# -> Opens http://localhost:4173
```

---

## 📂 Architecture & File Structure

```
demo/
├── public/
│   ├── sample_pages/          # 150 DPI rendered pages for all 5 sample documents (1.3 MB total)
│   │   ├── acme_fy24_annual_report/
│   │   ├── clean_financial_statement/
│   │   ├── vertex_energy_audit/
│   │   ├── nova_clean_quarterly/
│   │   └── solaris_edge_cases/
│   └── sample_pdfs/           # Original downloadable sample PDFs
├── src/
│   ├── components/            # Rich UI components (Obsidian/Sunset volcanic palette)
│   │   ├── DemoBanner.tsx     # Top portfolio announcement bar
│   │   ├── Navbar.tsx         # Brand, sample document switcher, health score, and actions
│   │   ├── DocumentViewer.tsx # Interactive document canvas with visual coordinate jumper pins
│   │   ├── IssueInspector.tsx # Progressive disclosure finding cards with derivation proofs
│   │   ├── NotionAiChatDrawer.tsx # Slide-over reviewer copilot with citations
│   │   ├── FinancialCharts.tsx # Interactive timeline & cash flow reconciliation charts
│   │   ├── HealthWidgets.tsx  # Document health score radar & breakdown
│   │   ├── BenchmarkModal.tsx # 12/12 synthetic regression test telemetry
│   │   ├── AnalysisModal.tsx  # Transition spinner
│   │   └── HeroExperience.tsx # Clean landing upload state
│   ├── data/
│   │   ├── sampleReports.json # Pre-computed audit reports with exact coordinate bounding boxes
│   │   ├── sampleReports.ts   # Typed report dictionary & metadata
│   │   └── benchmarkData.ts   # Empirical regression metrics across all 4 subsystems
│   ├── services/
│   │   └── demoService.ts     # Client-side deterministic query and proof engine
│   ├── App.tsx                # Main application state & responsive layout
│   ├── main.tsx               # React 19 entry point
│   ├── types.ts               # Complete TypeScript data model
│   └── index.css              # Custom styling, glow utilities, and typography
├── package.json
├── vite.config.ts
├── vercel.json                # Immutable caching & security headers for Vercel
└── README.md
```

---

## 🛡️ Recruiter & Portfolio Presentation Tips

When showcasing Voltora on your portfolio or resume:
1. **Highlight the Honest Claims:** Mention that all rules are evaluated deterministically with mathematical derivation proofs, avoiding ungrounded LLM hallucinations.
2. **Point to the Clean Control Document:** Demonstrate that the app flags 0 false alarms on `Apex Global Clean Statement` (Grade A+, 100/100).
3. **Show Dual Coordinate Jumper Pins:** In Acme Corp FY24, click Finding #1 ("Gross Profit Arithmetic Variance") to jump to the exact bounding box on Page 1, then click Finding #4 ("Operating Income vs Operating Profit Discrepancy") to jump between Page 1 and Page 2.
4. **Trigger Synthetic Regression Suite:** Click the "Regression" pill in the navbar to show the empirical 12/12 test coverage across cross-footing, semantic consistency, temporal chronology, and scale checks.
