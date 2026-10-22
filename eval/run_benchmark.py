import time
import json
import os
from typing import Dict, Any, List
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from backend.parsers.pdf_parser import PDFParser
from backend.auditors.orchestrator import AuditOrchestrator
from eval.ground_truth import GROUND_TRUTH_DATASET

console = Console()

def matches_ground_truth(det, exp: Dict[str, Any]) -> bool:
    """Strict ground-truth matching requiring category, page/cross-page alignment,
    and specific evidence token verification."""
    cat = det.category.value if hasattr(det.category, 'value') else str(det.category)
    if cat != exp["category"]:
        return False

    det_p1 = det.primary_anchor.page
    det_p2 = det.secondary_anchor.page if det.secondary_anchor else None

    exp_p1 = exp.get("page")
    exp_p2 = exp.get("secondary_page")

    # Page matching
    if exp_p2 is None or exp_p2 == exp_p1:
        # Intra-page issue (e.g. single page or both anchors on same page)
        if det_p1 != exp_p1:
            return False
        if det_p2 is not None and det_p2 != exp_p1:
            return False
    else:
        # Cross page issue: both pages must match
        if not det_p2:
            return False
        pages_match = (det_p1 == exp_p1 and det_p2 == exp_p2) or (det_p1 == exp_p2 and det_p2 == exp_p1)
        if not pages_match:
            return False

    # Evidence keyword matching
    keywords = exp.get("evidence_keywords", [])
    if keywords:
        finding_blob = " ".join([
            det.title,
            det.description,
            det.primary_anchor.text,
            det.secondary_anchor.text if det.secondary_anchor else "",
            det.actual_value or "",
            det.expected_value or "",
            det.explanation or ""
        ]).lower()

        matched_keywords = [kw for kw in keywords if kw.lower() in finding_blob]

        # Require a threshold of matched keywords (default 2 when multiple keywords provided, else 1)
        min_matches = exp.get("min_matches", 2 if len(keywords) >= 2 else 1)
        if len(matched_keywords) < min_matches:
            return False

        # If specific identifying anchors are designated (e.g. specific numbers or unique entity names),
        # at least one specific anchor must be present to prevent generic topic overlap.
        required_any = exp.get("required_any", [])
        if required_any:
            if not any(req.lower() in finding_blob for req in required_any):
                return False

    return True

def run_evaluation() -> Dict[str, Any]:
    orchestrator = AuditOrchestrator()
    category_stats = {
        "math_discrepancy": {"tp": 0, "fp": 0, "fn": 0},
        "semantic_contradiction": {"tp": 0, "fp": 0, "fn": 0},
        "temporal_inversion": {"tp": 0, "fp": 0, "fn": 0},
        "unit_mismatch": {"tp": 0, "fp": 0, "fn": 0},
    }

    total_pages = 0
    total_time_ms = 0.0
    doc_results = []
    skipped_docs = []
    clean_docs_count = 0
    clean_doc_false_positives = 0

    for test_case in GROUND_TRUTH_DATASET:
        file_path = test_case["file_path"]
        if not os.path.exists(file_path):
            console.print(f"[red]Warning: Test file {file_path} not found. Skipping.[/red]")
            skipped_docs.append({
                "doc_id": test_case["doc_id"],
                "file_path": file_path,
                "reason": "File not found"
            })
            continue

        try:
            with open(file_path, "rb") as f:
                pdf_bytes = f.read()

            start = time.time()
            parsed, _ = PDFParser.parse_pdf(pdf_bytes, doc_id=test_case["doc_id"], title=os.path.basename(file_path))
            report = orchestrator.audit_document(parsed)
            duration_ms = (time.time() - start) * 1000.0

            total_pages += parsed.total_pages
            total_time_ms += duration_ms

            expected = list(test_case.get("expected_issues", []))
            detected = list(report.issues)
            is_clean_doc = test_case.get("is_clean", len(expected) == 0)

            if is_clean_doc:
                clean_docs_count += 1
                clean_doc_false_positives += len(detected)

            # Strict 1-to-1 match detected to expected
            matched_expected = set()
            matched_detected = set()

            for d_idx, det in enumerate(detected):
                cat = det.category.value if hasattr(det.category, 'value') else str(det.category)
                match_found = False

                for e_idx, exp in enumerate(expected):
                    if e_idx in matched_expected:
                        continue
                    if matches_ground_truth(det, exp):
                        match_found = True
                        matched_expected.add(e_idx)
                        matched_detected.add(d_idx)
                        if cat in category_stats:
                            category_stats[cat]["tp"] += 1
                        break

                if not match_found:
                    if cat in category_stats:
                        category_stats[cat]["fp"] += 1

            # Unmatched expected are false negatives
            for e_idx, exp in enumerate(expected):
                if e_idx not in matched_expected:
                    cat = exp["category"]
                    if cat in category_stats:
                        category_stats[cat]["fn"] += 1

            doc_results.append({
                "doc_id": test_case["doc_id"],
                "file_path": file_path,
                "is_clean": is_clean_doc,
                "pages": parsed.total_pages,
                "duration_ms": round(duration_ms, 2),
                "health_score": report.summary.health_score,
                "grade": report.summary.grade,
                "detected_issues_count": len(report.issues),
                "ground_truth_count": len(expected),
                "matched_count": len(matched_expected)
            })
        except Exception as err:
            console.print(f"[red]Error evaluating {file_path}: {err}[/red]")
            skipped_docs.append({
                "doc_id": test_case["doc_id"],
                "file_path": file_path,
                "reason": f"Execution error: {str(err)}"
            })

    # Calculate metrics
    table = Table(title="Voltora Document Auditor - Empirical Benchmark Suite", header_style="bold cyan")
    table.add_column("Audit Category", style="bold white")
    table.add_column("Ground Truth", justify="right")
    table.add_column("TP", justify="right", style="green")
    table.add_column("FP", justify="right", style="yellow")
    table.add_column("FN", justify="right", style="red")
    table.add_column("Precision", justify="right")
    table.add_column("Recall", justify="right")
    table.add_column("F1-Score", justify="right", style="bold magenta")

    total_tp = 0
    total_fp = 0
    total_fn = 0
    cat_metrics = {}

    macro_precs = []
    macro_recs = []
    macro_f1s = []

    for cat, stats in category_stats.items():
        tp = stats["tp"]
        fp = stats["fp"]
        fn = stats["fn"]
        total_tp += tp
        total_fp += fp
        total_fn += fn

        prec = (tp / (tp + fp)) * 100 if (tp + fp) > 0 else 100.0
        rec = (tp / (tp + fn)) * 100 if (tp + fn) > 0 else 100.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        if (tp + fn > 0) or (tp + fp > 0):
            macro_precs.append(prec)
            macro_recs.append(rec)
            macro_f1s.append(f1)

        cat_metrics[cat] = {
            "ground_truth": tp + fn,
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "precision": round(prec, 2),
            "recall": round(rec, 2),
            "f1": round(f1, 2)
        }

        clean_cat = cat.replace("_", " ").title()
        table.add_row(
            clean_cat,
            str(tp + fn),
            str(tp),
            str(fp),
            str(fn),
            f"{prec:.1f}%",
            f"{rec:.1f}%",
            f"{f1:.1f}%"
        )

    # Micro average
    micro_prec = (total_tp / (total_tp + total_fp)) * 100 if (total_tp + total_fp) > 0 else 100.0
    micro_rec = (total_tp / (total_tp + total_fn)) * 100 if (total_tp + total_fn) > 0 else 100.0
    micro_f1 = (2 * micro_prec * micro_rec) / (micro_prec + micro_rec) if (micro_prec + micro_rec) > 0 else 0.0

    # Macro average
    macro_prec = sum(macro_precs) / max(1, len(macro_precs))
    macro_rec = sum(macro_recs) / max(1, len(macro_recs))
    macro_f1 = sum(macro_f1s) / max(1, len(macro_f1s))

    table.add_section()
    table.add_row(
        "MICRO AVERAGE",
        str(total_tp + total_fn),
        str(total_tp),
        str(total_fp),
        str(total_fn),
        f"{micro_prec:.1f}%",
        f"{micro_rec:.1f}%",
        f"{micro_f1:.1f}%"
    )
    table.add_row(
        "MACRO AVERAGE",
        str(total_tp + total_fn),
        "-",
        "-",
        "-",
        f"{macro_prec:.1f}%",
        f"{macro_rec:.1f}%",
        f"{macro_f1:.1f}%"
    )

    console.print(table)

    avg_latency_per_page = total_time_ms / max(1, total_pages)
    summary_panel = Panel(
        f"[bold cyan]Evaluation Methodology:[/bold cyan] Strict 1-to-1 match (category + page + min_matches + required_any anchors)\n"
        f"[bold white]Documents Tested:[/bold white] {len(doc_results)} ({total_pages} total pages)\n"
        f"[bold white]Ground-Truth Issues:[/bold white] {total_tp + total_fn} | [bold green]Detected Matches (TP):[/bold green] {total_tp}\n"
        f"[bold yellow]False Positives (FP):[/bold yellow] {total_fp} | [bold red]False Negatives (FN):[/bold red] {total_fn}\n"
        f"[bold green]Micro Precision:[/bold green] {micro_prec:.1f}% | [bold green]Micro Recall:[/bold green] {micro_rec:.1f}%\n"
        f"[bold magenta]Micro F1-Score:[/bold magenta] {micro_f1:.1f}% | [bold cyan]Macro F1-Score:[/bold cyan] {macro_f1:.1f}%\n"
        f"[bold yellow]Clean Baseline Controls:[/bold yellow] {clean_docs_count} tested ({clean_doc_false_positives} false alarms)\n"
        f"[bold yellow]Skipped Documents:[/bold yellow] {len(skipped_docs)}\n"
        f"[bold cyan]Avg Latency / Page:[/bold cyan] {avg_latency_per_page:.1f} ms\n\n"
        f"[dim white]Scope: Software regression test suite evaluated on generated test filings.[/dim white]",
        title="[bold white]Synthetic Benchmark Evaluation Summary[/bold white]",
        border_style="cyan"
    )
    console.print(summary_panel)

    result_data = {
        "timestamp": time.time(),
        "total_documents": len(doc_results),
        "total_pages": total_pages,
        "clean_documents_tested": clean_docs_count,
        "clean_document_false_positives": clean_doc_false_positives,
        "skipped_documents": skipped_docs,
        "avg_latency_per_page_ms": round(avg_latency_per_page, 2),
        "overall_precision": round(micro_prec, 2),
        "overall_recall": round(micro_rec, 2),
        "overall_f1": round(micro_f1, 2),
        "micro_metrics": {
            "precision": round(micro_prec, 2),
            "recall": round(micro_rec, 2),
            "f1": round(micro_f1, 2)
        },
        "macro_metrics": {
            "precision": round(macro_prec, 2),
            "recall": round(macro_rec, 2),
            "f1": round(macro_f1, 2)
        },
        "categories": cat_metrics,
        "documents": doc_results
    }

    os.makedirs("eval", exist_ok=True)
    with open("eval/benchmark_results.json", "w") as f:
        json.dump(result_data, f, indent=2)

    return result_data

if __name__ == "__main__":
    run_evaluation()
