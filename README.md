# Voltora: Multi-Dimensional Document Auditor

> **An automated document review tool designed to assist human analysts in detecting arithmetic inconsistencies, conflicting cross-page narrative disclosures, milestone timeline inversions, and unit denomination scale errors.**  
> Built as a portfolio project showcasing coordinate-anchored PDF parsing, deterministic and heuristic rule pipelines, and evidence-grounded document inspection.

---

## 📋 What This Project Does / Does Not Do

### What Voltora Does
- **Automates mechanical reconciliation**: Verifies table row/column sums, percentage distribution totals, milestone date sequences, and unit multipliers across multi-page PDFs.
- **Coordinates-anchors every finding**: Computes normalized bounding boxes (`[x0, y0, x1, y1]`) on rendered PDF canvases so reviewers can immediately see the exact source text and any conflicting passage.
- **Strictly isolates deterministic from heuristic rules**: Arithmetic and unit checks produce exact mathematical derivations, whereas semantic contradictions are labeled as heuristic checks and flag ambiguous contexts as `needs_review`.
- **Runs entirely locally**: Ingests, parses, and audits PDFs in-memory without sending proprietary documents to third-party databases.

### What Voltora Does NOT Do
- **Does not replace certified accounting or audit judgment**: Voltora does not perform statutory audits, provide legal opinions, or guarantee compliance with GAAP/IFRS.
- **Does not claim full document verification**: A document with zero flagged issues only means that none of the evaluated rules were triggered; it is not a certification of overall accuracy.
- **Does not support multi-tenant public deployment**: There is no authentication, role-based access control (RBAC), or database tenant isolation. It is engineered strictly for single-user local analyst workflows.
- **Does not generalize benchmark scores to arbitrary real-world filings**: The benchmark suite is a software regression test evaluating 10 programmed findings across 4 synthetic test PDFs.

---

## 🔍 Core Architecture & Key Engineering Decisions

```
[ Uploaded PDF ] ──> [ PyMuPDF Parser ] ──> Normalized Text Blocks, Tables, & Coordinates
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
         [ Deterministic Subsystems ]                                  [ Heuristic Subsystems ]
       - Table cross-footing (MathAuditor)                           - Cross-page claims (SemanticAuditor)
       - Percentage rate & breakdown checks                          - Polarity & metric compatibility checks
       - Timeline & milestone sequences (TemporalAuditor)            - TF-IDF candidate clustering
       - Denomination & scale consistency (UnitAuditor)              - Unverified/ambiguous -> "needs_review"
                       │                                                             │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      ▼
                                       [ Audit Orchestrator ]
                                       - Severity assignment
                                       - Bounding-box coordinate anchoring
                                       - Health score calculation
                                                      ▼
                                 [ Interactive React + Vite Review UI ]
                                 - Dual-anchor visual jumpers
                                 - Evidence heatmap
                                 - Optional LLM review assistant
```

### Key Engineering Decisions

1. **Strict Separation of Deterministic Rules vs. Heuristic Inference:**
   - *Problem:* LLMs frequently hallucinate arithmetic errors or assert contradictions when wording differs slightly.
   - *Decision:* All mathematical checks (table cross-footing, distribution totals, growth rates) and scale factors are computed via deterministic Python logic with step-by-step mathematical proofs. LLM/NLP techniques are reserved exclusively for candidate sentence clustering and heuristic polarity comparisons, where ambiguous cases are surfaced for human confirmation rather than asserted as facts.

2. **Dual-Coordinate Visual Anchoring (`[x0, y0, x1, y1]`):**
   - *Problem:* Text-only audit logs force reviewers to manually scan multi-page filings to locate the numbers in question.
   - *Decision:* Bounding boxes are extracted during PDF parsing and normalized to `[0.0, 1.0]`. When an issue spans two pages (e.g., Page 1 narrative contradicts Page 4 table), the UI renders visual jumper pins linking both exact coordinates on the rendered PDF canvases.

3. **Synchronous Execution Model Over Simulated Progress:**
   - *Problem:* Many prototypes use `setInterval` or randomized progress bars to create the illusion of complex asynchronous background jobs.
   - *Decision:* Document ingestion and multi-pass rule evaluation execute synchronously on the server in ~50-150ms. The application truthfully displays an active loading state while the single HTTP request is in-flight and immediately renders the results upon response.

---

## 📊 Benchmark Suite & Empirical Results

Voltora includes an automated evaluation suite (`eval/run_benchmark.py`) that evaluates findings against an annotated ground-truth dataset (`eval/ground_truth.py`).

### Scoring Methodology
- **Strict 1-to-1 Matching**: A detected issue matches ground truth only if:
  1. Category matches exactly (`math_discrepancy`, `semantic_contradiction`, `temporal_inversion`, `unit_mismatch`).
  2. Page matches primary page (and secondary page for cross-page contradictions).
  3. Evidence is sufficiently specific: requires meeting a minimum keyword threshold (`min_matches`) and matching at least one specific identifying anchor (`required_any`, e.g. exact numerical figures or unique initiative name). Generic terms (e.g. matching only "revenue" or "prior") are rejected, while natural phrasing differences across finding descriptions, quotes, and derivations are supported.
- **Micro & Macro Metrics**: Reports precision, recall, and F1 per category, along with micro-averages (pooled counts) and macro-averages (unweighted category mean).
- **Clean Document Testing**: Tracks false-positive detections on clean baseline controls (0 expected issues).
- **Skipped Tracking**: Explicitly reports any missing or unreadable test files.

### Current Evaluation Results (Synthetic Test Corpus)

Evaluated across **5 test documents (12 pages total)**:
- `acme_fy24_annual_report.pdf` (4 pages, 8 injected multi-dimensional issues)
- `clean_financial_statement.pdf` (3 pages, clean baseline control)
- `vertex_energy_audit.pdf` (2 pages, 2 injected issues + clean tables)
- `nova_clean_quarterly.pdf` (1 page, clean baseline control)
- `solaris_edge_cases.pdf` (2 pages, 2 injected issues + negative values schedule)

| Audit Category | Ground Truth | True Positives (TP) | False Positives (FP) | False Negatives (FN) | Precision | Recall | F1-Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Math Discrepancy** | 4 | 4 | 0 | 0 | 100.0% | 100.0% | 100.0% |
| **Semantic Contradiction** | 3 | 3 | 0 | 0 | 100.0% | 100.0% | 100.0% |
| **Temporal Inversion** | 4 | 4 | 0 | 0 | 100.0% | 100.0% | 100.0% |
| **Unit Mismatch** | 1 | 1 | 0 | 0 | 100.0% | 100.0% | 100.0% |
| **MICRO AVERAGE** | **12** | **12** | **0** | **0** | **100.0%** | **100.0%** | **100.0%** |
| **MACRO AVERAGE** | **12** | **-** | **-** | **-** | **100.0%** | **100.0%** | **100.0%** |

- **Clean Document False-Alarm Count**: `0` across 2 clean control documents.
- **Skipped Documents**: `0`
- **Average Processing Throughput**: `~62 ms` per page.

> **Evaluation Limitations**:  
> Benchmark metrics are measured on a programmatically generated synthetic corpus designed for unit and integration testing. These results demonstrate rule verification correctness on modeled patterns, but do not represent measured accuracy on heterogeneous, uncurated real-world filings or complex accounting edge cases.

---

## 🔒 Security & Deployment Architecture

> [!CAUTION]
> **Local Single-User Architecture**:  
> The backend operates an in-memory document session store and does not implement user authentication, role-based access control, or multi-tenant workspace isolation. Voltora is intended solely for local desktop review by an individual analyst. **It must not be exposed to public networks or untrusted multi-user environments with confidential documents.**

- **Strict CORS Restriction**:  
  Wildcard origins (`*`) are strictly rejected at startup (raising a configuration `ValueError`). Allowed frontend origins are configured via the `FRONTEND_ORIGINS` environment variable (comma-separated list) or default to local development origins (`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`, `http://127.0.0.1:3000`). Browser credential headers are disabled (`allow_credentials=False`) because the local desktop API does not use cookies or browser-authenticated sessions.
- **Synchronous Execution Model**:  
  Document ingestion and multi-pass rule evaluation execute synchronously on the server in a single HTTP request pass (~50-150ms). The UI displays a truthful processing indicator while the request is in flight rather than simulating multi-stage progress bars.
- **Upload Hardening & Streaming Limit**:  
  Uploads are validated for `.pdf` extension and `%PDF-` magic bytes. File sizes are checked in chunks during streaming to abort with a 413 response immediately upon exceeding the 25MB limit without buffering arbitrarily large payloads into memory. Documents exceeding 100 pages are rejected with 400 Bad Request. Internal server errors are logged with full stack traces on the server while returning sanitized messages to clients.

---

## 🛠️ Repository Layout

```
├── backend/
│   ├── main.py                    # FastAPI server & validated upload endpoints
│   ├── models/                    # Pydantic schemas (AuditIssue, SourceAnchor, AuditReport)
│   ├── parsers/                   # PyMuPDF coordinate parser & table extractor
│   ├── auditors/
│   │   ├── base.py                # Base auditor interface
│   │   ├── math_auditor.py        # Table cross-footing & percentage distribution checks
│   │   ├── temporal_auditor.py    # Chronological sequence & milestone validation
│   │   ├── unit_auditor.py        # Scale factor & currency consistency auditor
│   │   ├── semantic_auditor.py    # Evidence-grounded claim extraction & conflict judgment
│   │   └── orchestrator.py        # Audit orchestrator, health score, and page evidence grading
│   └── services/                  # Document session store & grounded chat service
├── sample_docs/                   # Programmatic test PDF generators
├── eval/                          # Ground-truth dataset & strict 1-to-1 benchmark runner
├── tests/                         # Unit & integration test suite
└── frontend/                      # React + TypeScript + Vite modern web UI
```

---

## 🚀 Getting Started (Clean Checkout Setup)

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.12)
- **Node.js**: 18+ (tested with npm)

### 1. Installation from Scratch
```bash
# Clone and enter directory
git clone https://github.com/Spidey173/Voltora.git
cd Voltora

# Setup Python virtual environment & backend dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Setup Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Launch Backend & Frontend
Using the automated launcher:
```bash
./run.sh
```

Or manually in separate terminals:
```bash
# Terminal 1: Backend
source .venv/bin/activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. Run Synthetic Benchmark Suite
```bash
source .venv/bin/activate
python -m eval.run_benchmark
```
Runs the strict 1-to-1 regression evaluation across all 4 synthetic test PDFs and updates `eval/benchmark_results.json`.

### 4. Run Test Suite
```bash
source .venv/bin/activate
python -m unittest discover tests
```
Runs the full Python unit and integration test suite (26 tests).
