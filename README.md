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
- **Does not generalize test results to arbitrary real-world filings**: The automated regression suite is an internal developer test harness evaluating 12 programmed findings across 5 synthetic test PDFs.

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
   - *Decision:* Document ingestion and multi-pass rule evaluation execute synchronously on the server in ~50-150ms. The application truthfully displays an active loading state while the single HTTP request is in-flight and immediately renders the results upon response without artificial delays.

---

## 🧪 Automated Regression & Verification Suite

Voltora includes an automated evaluation harness (`eval/run_benchmark.py`) that tests the audit engine against an annotated ground-truth dataset of synthetic test documents (`eval/ground_truth.py`).

> [!NOTE]
> **Developer Regression Suite, Not a Field Benchmark:**  
> This harness is an automated integration test suite evaluated on programmatically generated examples to verify rule logic. It confirms that the 12 injected test patterns trigger the intended rules under strict matching criteria and that clean controls pass without false alarms—**it does not represent measured accuracy on uncurated, heterogeneous real-world filings.**

### Running the Verification Harness
Run the regression harness from the repository root:
```bash
python -m eval.run_benchmark
```

### Test Dataset & Evaluation Criteria
Evaluated across **5 synthetic test documents (12 pages total)**:
- `acme_fy24_annual_report.pdf` (4 pages, 8 injected multi-dimensional issues)
- `clean_financial_statement.pdf` (3 pages, clean baseline control — 0 expected issues)
- `vertex_energy_audit.pdf` (2 pages, 2 injected issues + clean tables)
- `nova_clean_quarterly.pdf` (1 page, clean baseline control — 0 expected issues)
- `solaris_edge_cases.pdf` (2 pages, 2 injected issues + negative values schedule)

**Strict 1-to-1 Matching Rules**:
1. Category must match exactly (`math_discrepancy`, `semantic_contradiction`, `temporal_inversion`, `unit_mismatch`).
2. Primary page (and secondary page for cross-page contradictions) must match.
3. Must match multiple keywords (`min_matches >= 2`) and at least one specific identifying anchor (`required_any`, e.g. exact numeric figures or unique initiative name). Single generic words (e.g. matching only "revenue") are rejected.
4. Clean baseline documents are monitored: any detection on clean documents is penalized as a false positive.

### Suite Coverage & Sample Output

The harness checks 12 programmed rule assertions across the 5 synthetic test documents and 2 clean controls.

<details>
<summary>Click to view rule verification breakdown</summary>

| Audit Subsystem | Injected Test Cases | Detections Matched | Clean Controls | Rule Status |
| :--- | :---: | :---: | :---: | :---: |
| **Math Discrepancy** (cross-footing & percentages) | 4 | 4 | Passed | Covered |
| **Semantic Contradiction** (cross-page claims) | 3 | 3 | Passed | Covered |
| **Temporal Inversion** (milestone sequences) | 4 | 4 | Passed | Covered |
| **Unit Mismatch** (scale factors & denominations) | 1 | 1 | Passed | Covered |
| **Total Test Assertions** | **12** | **12** | **0 false alarms on clean docs** | **All 12 programmed rules verified** |

- **Clean Baseline Documents**: 2 documents evaluated with 0 false alarms.
- **Average Processing Latency**: ~60–70 ms per page on local CPU.
</details>

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
├── eval/                          # Ground-truth dataset & strict 1-to-1 regression evaluation harness
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

### 3. Run Automated Regression Suite
```bash
source .venv/bin/activate
python -m eval.run_benchmark
```
Runs the strict 1-to-1 regression evaluation across all 5 synthetic test PDFs and updates `eval/benchmark_results.json`.

### 4. Run Test Suite
```bash
source .venv/bin/activate
python -m unittest discover tests
```
Runs the full Python unit and integration test suite (31 tests).
