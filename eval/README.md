# Voltora Empirical Evaluation Suite

This directory contains the automated evaluation framework and ground-truth dataset used to evaluate Voltora's multi-dimensional document auditor.

---

## 1. Evaluation Corpus & Dataset Characteristics

The benchmark evaluates **5 synthetic financial disclosure documents** (totaling 12 pages) generated via PyMuPDF in `sample_docs/`:

1. **`acme_fy24_annual_report.pdf` (4 pages, Injected Error Corpus)**:
   - Contains 8 annotated discrepancies across all 4 auditing dimensions:
     - Table column addition mismatch on Page 3 ($145M sum vs $165M stated).
     - Narrative percentage distribution failure on Page 2 (40% + 30% + 20% = 90% vs 100%).
     - Revenue growth claim contradiction across Pages 1 and 3 (12% vs 14%).
     - Capital structure contradiction across Pages 1 and 3 (zero debt claim vs $120M senior credit facility & $120M notes).
     - Geographic footprint contradiction across Pages 1 and 2 (no international operations vs EU and APAC subsidiaries).
     - Chronological year inversion on Page 1 (prior year 2024 compared to 2023).
     - Milestone date sequence inversion on Page 2 (Project Genesis completion in March 2023 vs kickoff in November 2023).
     - Scale order-of-magnitude mismatch across Pages 2 and 4 (operating expenses stated as $42.5B vs $42.5M).
2. **`clean_financial_statement.pdf` (3 pages, Clean Control Baseline)**:
   - Reconciled tables, consistent capital structure, and matching percentage breakdowns. Expected issues: `0`.
3. **`vertex_energy_audit.pdf` (2 pages, Multi-Dimension Evaluation)**:
   - In-text percentage rate error (25% stated vs 50% actual growth) on Page 1.
   - Milestone sequence anomaly on Page 1 (Project Titan completion Feb 2024 vs kickoff Aug 2024).
   - Reconciled cost schedule and consistent debt disclosures.
4. **`nova_clean_quarterly.pdf` (1 page, Clean Control Baseline)**:
   - Clean quarterly disclosure with verified arithmetic and consistent liquidity disclosures. Expected issues: `0`.
5. **`solaris_edge_cases.pdf` (2 pages, Edge Cases & Negative Values)**:
   - Negative operating outlays in regional table ($40 + (-$25) + $15 = $30M, clean cross-footing).
   - In-text percentage rate error (stated 40% growth from 100 to 120, actual is 20%).
   - Milestone sequence anomaly on Page 2 (Project Helios commissioning in Jan 2024 precedes kickoff in Aug 2024).

> **Note on Synthetic vs. Real-World Filings**:  
> The documents in this benchmark are programmatically generated synthetic test cases modeled after corporate annual reports and 10-K disclosures. While designed to simulate realistic financial schedules and disclosure drafting mistakes, benchmark metrics reflect performance on this synthetic suite and should not be misconstrued as measured accuracy across uncurated, heterogeneous real-world filings.

---

## 2. Scoring & Matching Methodology

Scoring uses strict **1-to-1 matching** between ground-truth annotations and detected findings:

1. **Category Alignment**: The detected issue category (`math_discrepancy`, `semantic_contradiction`, `temporal_inversion`, `unit_mismatch`) must match ground truth.
2. **Page & Coordinate Grounding**:
   - Single-page findings must match the expected primary page.
   - Cross-page findings must match both the primary and secondary pages.
3. **Specific Evidence Verification**:
   - Does not accept a match on a single generic word (e.g. matching only "revenue" or "prior" without identifying figures).
   - Requires matching a minimum number of evidence keywords (`min_matches`, defaulting to at least 2 when multiple keywords are defined).
   - Requires matching at least one specific identifying anchor (`required_any`), such as the exact numerical figures or unique initiative name.
   - Allows natural phrasing variations by inspecting the aggregated finding context (title, description, anchor quotes, values, and derivation explanation).
4. **No Double-Counting**: Each detected finding can match at most one ground-truth item, and each ground-truth item can be satisfied at most once.
5. **False Positives on Clean Controls**: Any finding emitted on designated clean documents is strictly tracked and penalized as a false positive.
6. **Averaging**:
   - **Micro Averages**: Global pooled TP, FP, and FN across all categories.
   - **Macro Averages**: Unweighted arithmetic mean of Precision, Recall, and F1 across evaluated categories.

---

## 3. Repeatable Process for Adding New Cases

To expand the evaluation suite with new documents:

1. **Add the Document**:
   - Place the PDF in `sample_docs/<document_name>.pdf` (or add a generator function to `sample_docs/generate_samples.py`).
2. **Annotate Ground Truth in `eval/ground_truth.py`**:
   - Append an entry to `GROUND_TRUTH_DATASET`:
     ```python
     {
         "doc_id": "unique_doc_identifier",
         "file_path": "sample_docs/<document_name>.pdf",
         "is_clean": False,  # True if 0 issues expected
         "expected_issues": [
             {
                 "id": "doc_category_short_descriptor",
                 "category": "math_discrepancy", # or semantic_contradiction, temporal_inversion, unit_mismatch
                 "page": 1,                      # 1-indexed primary page
                 "secondary_page": 3,            # Optional 1-indexed secondary page
                 "description": "Concise human explanation of the expected discrepancy",
                 "evidence_keywords": ["145", "165", "product sales", "revenue"], # Multi-token context
                 "required_any": ["145", "165", "product sales"],                # Specific identifying anchors
                 "min_matches": 2                                                # Minimum keyword threshold
             }
         ]
     }
     ```
3. **Execute Benchmark**:
   ```bash
   python -m eval.run_benchmark
   ```
4. **Inspect Metrics**:
   - Review precision, recall, micro/macro averages, and clean document false-alarm counts in the generated terminal table and `eval/benchmark_results.json`.

---

## 4. Known Evaluation Limitations

- **Corpus Size**: 4 synthetic documents (10 pages total). A larger corpus spanning diverse industry disclosures, multi-column layouts, and scanned OCR documents is necessary to evaluate generalization.
- **Rule Boundary**: The evaluation covers deterministic table math, in-text percentage rates and distributions, direct metric conflicts, polar status contradictions, milestone inversions, and scale mismatches. It does not measure complex qualitative footnote disclosures or non-standard accounting treatments.
- **Language**: English-language corporate disclosures only.
