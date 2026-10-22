# Voltora: Multi-Dimensional Document Auditor

> **An automated document audit application designed to assist reviewers in identifying numerical discrepancies, cross-statement contradictions, timeline inversions, and scale mismatches.**  
> Voltora automatically ingests PDF documents, evaluates arithmetic integrity, cross-page narrative consistency, chronological milestone sequences, and unit scale consistency, outputting a coordinate-grounded diagnostics dashboard.

---

## 🔍 Core Architecture

1. **Deterministic & Heuristic Hybrid Pipeline**:
   - **Deterministic Checks**: Table column cross-footing, in-text percentage rates, distribution totals, and unit scale conversions are verified mathematically with explicit step-by-step derivation explanations.
   - **Heuristic Checks**: Cross-page narrative claims are clustered via TF-IDF candidate pairing and evaluated for mutual exclusivity, metric divergence, and polarity mismatches within comparable entities and time periods.
   - **Review Flags**: Ambiguous pairs or unverified contexts are classified as `needs_review` or omitted, rather than presented as confirmed errors.
2. **Dual-Anchor Coordinate Grounding**:
   - Normalized coordinate vectors (`[x0, y0, x1, y1] \in [0.0, 1.0]`) mapped to SVG overlays on rendered PDF pages.
   - For contradictions spanning different pages, linked dual-anchor jumpers allow 1-click comparison between source and conflicting sections.
3. **Evidence Heatmap Overlay**:
   - Page-level evidence indicator highlighting pages with detected discrepancies (Crimson = critical issues, Amber = warnings, Green = no issues detected within evaluated rules).
   - *Note:* A green page indicates that no issues were detected by the evaluated automated rules; it does not constitute a certification of complete document accuracy.
4. **Context-Grounded Issue Review & Assistant**:
   - Provides focused evidence summaries and derivation breakdowns for each finding.
   - Qualified recommendations for reconciliation without claiming legal, regulatory, or certified audit authority.
   - Clean fallback handling when external LLM credentials are not configured or encounter provider errors.

---

## 📊 Benchmark Suite & Empirical Results

Voltora includes an automated evaluation suite (`eval/run_benchmark.py`) that evaluates findings against an annotated ground-truth dataset (`eval/ground_truth.py`).

### Scoring Methodology
- **Strict 1-to-1 Matching**: A detected issue only matches an expected issue if its category matches, primary (and secondary, if cross-page) page matches, and key evidence tokens are present in the finding.
- **Micro & Macro Metrics**: Reports precision, recall, and F1 per category, along with micro-averages (pooled counts) and macro-averages (unweighted category mean).
- **Clean Document Testing**: Tracks false-positive detections on clean baseline controls (0 expected issues).
- **Skipped Tracking**: Explicitly reports any missing or unreadable test files.

### Current Evaluation Results (Synthetic Test Corpus)

Evaluated across **4 test documents (10 pages total)**:
- `acme_fy24_annual_report.pdf` (4 pages, 8 injected multi-dimensional issues)
- `clean_financial_statement.pdf` (3 pages, clean baseline control)
- `vertex_energy_audit.pdf` (2 pages, 2 injected issues + clean tables)
- `nova_clean_quarterly.pdf` (1 page, clean baseline control)

| Audit Category | Ground Truth | True Positives (TP) | False Positives (FP) | False Negatives (FN) | Precision | Recall | F1-Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Math Discrepancy** | 3 | 3 | 0 | 0 | 100.0% | 100.0% | 100.0% |
| **Semantic Contradiction** | 3 | 3 | 0 | 0 | 100.0% | 100.0% | 100.0% |
| **Temporal Inversion** | 3 | 3 | 0 | 0 | 100.0% | 100.0% | 100.0% |
| **Unit Mismatch** | 1 | 1 | 0 | 0 | 100.0% | 100.0% | 100.0% |
| **MICRO AVERAGE** | **10** | **10** | **0** | **0** | **100.0%** | **100.0%** | **100.0%** |
| **MACRO AVERAGE** | **10** | **-** | **-** | **-** | **100.0%** | **100.0%** | **100.0%** |

- **Clean Document False-Alarm Count**: `0` across 2 clean control documents.
- **Skipped Documents**: `0`
- **Average Processing Throughput**: `~67 ms` per page.

> **Evaluation Limitations**:  
> Benchmark metrics are measured on a programmatically generated synthetic corpus designed for unit and integration testing. These results demonstrate rule verification correctness on modeled patterns, but do not represent measured accuracy on heterogeneous, uncurated real-world filings or complex accounting edge cases.

---

## 🔒 Security & Deployment Architecture

- **Single-User / Local Session Architecture**:
  Voltora's backend utilizes an in-memory document store (`DocumentStore`) scoped to the active application runtime. Document IDs are generated via random UUIDs, but the application does not implement authentication, role-based access control, or multi-tenant workspace isolation.
- **Upload Hardening**:
  Uploads are validated for `.pdf` file extension, standard `%PDF-` file magic bytes, an upload size limit of 25MB, and a maximum page limit of 100 pages. Malformed or corrupted PDFs return structured 400 Bad Request responses.

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

## 🚀 Getting Started

### 1. Launch Backend & Frontend
Using the automated launcher:
```bash
./run.sh
```

Or manually:
```bash
# Terminal 1: Backend
source .venv/bin/activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 2. Run Benchmark Suite
```bash
python -m eval.run_benchmark
```
Runs the strict 1-to-1 evaluation suite and updates `eval/benchmark_results.json`.

### 3. Run Test Suite
```bash
python -m unittest discover tests
```
