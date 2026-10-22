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

    for test_case in GROUND_TRUTH_DATASET:
        file_path = test_case["file_path"]
        if not os.path.exists(file_path):
            console.print(f"[red]Warning: Test file {file_path} not found. Skipping.[/red]")
            continue

        with open(file_path, "rb") as f:
            pdf_bytes = f.read()

        start = time.time()
        parsed, _ = PDFParser.parse_pdf(pdf_bytes, doc_id=test_case["doc_id"], title=os.path.basename(file_path))
        report = orchestrator.audit_document(parsed)
        duration_ms = (time.time() - start) * 1000.0

        total_pages += parsed.total_pages
        total_time_ms += duration_ms

        expected = list(test_case["expected_issues"])
        detected = list(report.issues)

        # Match detected to expected
        matched_expected = set()
        matched_detected = set()

        for d_idx, det in enumerate(detected):
            cat = det.category.value
            det_p1 = det.primary_anchor.page
            det_p2 = det.secondary_anchor.page if det.secondary_anchor else None

            match_found = False
            for e_idx, exp in enumerate(expected):
                if e_idx in matched_expected:
                    continue
                if exp["category"] == cat:
                    exp_p1 = exp.get("page")
                    exp_p2 = exp.get("secondary_page")
                    # Match if primary page matches (or cross-pages match)
                    if exp_p1 == det_p1 or (exp_p2 and exp_p2 == det_p1) or (exp_p2 and det_p2 and exp_p2 == det_p2):
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
            "pages": parsed.total_pages,
            "duration_ms": round(duration_ms, 2),
            "health_score": report.summary.health_score,
            "grade": report.summary.grade,
            "detected_issues_count": len(report.issues),
            "ground_truth_count": len(test_case["expected_issues"])
        })

    # Calculate metrics
    table = Table(title="Document Auditor - Rigorous Verification Benchmark", header_style="bold cyan")
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

        cat_metrics[cat] = {
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

    overall_prec = (total_tp / (total_tp + total_fp)) * 100 if (total_tp + total_fp) > 0 else 100.0
    overall_rec = (total_tp / (total_tp + total_fn)) * 100 if (total_tp + total_fn) > 0 else 100.0
    overall_f1 = (2 * overall_prec * overall_rec) / (overall_prec + overall_rec) if (overall_prec + overall_rec) > 0 else 0.0

    table.add_section()
    table.add_row(
        "OVERALL MACRO",
        str(total_tp + total_fn),
        str(total_tp),
        str(total_fp),
        str(total_fn),
        f"{overall_prec:.1f}%",
        f"{overall_rec:.1f}%",
        f"{overall_f1:.1f}%"
    )

    console.print(table)

    avg_latency_per_page = total_time_ms / max(1, total_pages)
    summary_panel = Panel(
        f"[bold green]Audit Precision:[/bold green] {overall_prec:.1f}%\n"
        f"[bold green]Audit Recall:[/bold green] {overall_rec:.1f}%\n"
        f"[bold magenta]Overall F1-Score:[/bold magenta] {overall_f1:.1f}%\n"
        f"[bold cyan]Avg Latency / Page:[/bold cyan] {avg_latency_per_page:.1f} ms\n"
        f"[bold yellow]Total Pages Processed:[/bold yellow] {total_pages}",
        title="[bold white]Benchmark Performance Summary[/bold white]",
        border_style="cyan"
    )
    console.print(summary_panel)

    result_data = {
        "timestamp": time.time(),
        "total_pages": total_pages,
        "avg_latency_per_page_ms": round(avg_latency_per_page, 2),
        "overall_precision": round(overall_prec, 2),
        "overall_recall": round(overall_rec, 2),
        "overall_f1": round(overall_f1, 2),
        "categories": cat_metrics,
        "documents": doc_results
    }

    os.makedirs("eval", exist_ok=True)
    with open("eval/benchmark_results.json", "w") as f:
        json.dump(result_data, f, indent=2)

    return result_data

if __name__ == "__main__":
    run_evaluation()
