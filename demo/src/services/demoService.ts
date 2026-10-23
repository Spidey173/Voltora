import type { AuditReport, AuditIssue, BenchmarkMetrics } from '../types';
import { sampleReports } from '../data/sampleReports';
import { benchmarkData } from '../data/benchmarkData';

export interface AskIssueResponse {
  issue_id: string;
  answer: string;
  evidence_quote_a: string;
  evidence_quote_b: string | null;
  resolution_recommendation: string;
}

export interface ChatDocResponse {
  answer: string;
  relevant_pages: number[];
  relevant_issue_ids: string[];
  suggested_followups: string[];
  memo_ready: boolean;
}

export class DemoService {
  /**
   * Returns a sample report by document id.
   */
  public static async getSampleReport(sampleId: string): Promise<AuditReport> {
    // Simulate brief realistic processing delay (150ms)
    await new Promise((resolve) => setTimeout(resolve, 150));
    const report = sampleReports[sampleId];
    if (!report) {
      // Fallback to acme report if not found
      return sampleReports['acme_fy24_annual_report'];
    }
    return report;
  }

  /**
   * Returns benchmark evaluation metrics.
   */
  public static async getBenchmarkMetrics(): Promise<BenchmarkMetrics> {
    return benchmarkData;
  }

  /**
   * Answers questions about a specific issue with exact mathematical proofs.
   */
  public static async answerIssueQuery(
    issue: AuditIssue,
    question: string
  ): Promise<AskIssueResponse> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const q = question.toLowerCase();
    const quoteA = issue.primary_anchor?.text || 'Primary finding disclosure';
    const quoteB = issue.secondary_anchor?.text || null;

    let answer = '';

    if (q.includes('calculate') || q.includes('math') || q.includes('derive') || q.includes('proof') || q.includes('how')) {
      if (issue.explanation) {
        answer = `### Deterministic Derivation Proof: ${issue.title}\n\n` +
          `• **Stated Location:** Page ${issue.primary_anchor.page}\n` +
          `• **Reported Value:** \`${issue.actual_value || 'Stated Figure'}\`\n` +
          `• **Calculated Value:** \`${issue.expected_value || 'N/A'}\` (Variance: \`${issue.delta || 'N/A'}\`)\n\n` +
          `**Calculation Proof:**\n${issue.explanation}\n\n` +
          `*Recommendation:* Cross-reference source general ledger or working papers to reconcile the stated figure with supporting schedule rows.`;
      } else {
        answer = `### Finding Breakdown: ${issue.title}\n\n` +
          `• **Primary Source (Page ${issue.primary_anchor.page}):** "${quoteA.slice(0, 100)}..."\n` +
          `• **Discrepancy:** Stated \`${issue.actual_value || 'N/A'}\` vs Expected \`${issue.expected_value || 'N/A'}\` (Variance: \`${issue.delta || 'N/A'}\`)\n\n` +
          `**Analysis:** ${issue.description}`;
      }
    } else if (q.includes('fix') || q.includes('resolve') || q.includes('correct') || q.includes('reconcile') || q.includes('recommend')) {
      answer = `### Practical Reconciliation Protocol for [${issue.title}]\n\n` +
        `1. **Primary Adjustment:** ${issue.suggested_fix || 'Review source general ledger or working papers to verify the correct figure.'}\n` +
        `2. **Harmonization:** Ensure subsequent disclosures consistently reference \`${issue.expected_value || issue.actual_value || 'the verified figure'}\`.\n` +
        `3. **Clarifying Disclosure:** If divergence is intentional (e.g. non-GAAP vs GAAP differences), include an explicit narrative reconciliation note to prevent reader confusion.`;
    } else if (q.includes('risk') || q.includes('legal') || q.includes('severity') || q.includes('material')) {
      answer = `### Disclosure Risk Assessment (${issue.severity.toUpperCase()})\n\n` +
        `Conflicting representations or arithmetic variances regarding **${issue.title}** can reduce document transparency and create confusion during review.\n\n` +
        `• **Nature of Finding:** ${issue.description}\n` +
        `• **Reported Discrepancy:** ${issue.delta || 'Cross-section divergence'}\n\n` +
        `*Notice:* Voltora is an analytical document checking tool and does not provide formal legal opinions or certified audit opinions. Discrepancies should be confirmed with the disclosure authors.`;
    } else {
      answer = `### Audit Evidence Note: [${issue.title}]\n\n` +
        `• **Location:** Page ${issue.primary_anchor.page}` + (issue.secondary_anchor ? ` vs Page ${issue.secondary_anchor.page}` : '') + `\n` +
        `• **Reported:** ${issue.actual_value || quoteA.slice(0, 60)}\n` +
        `• **Expected:** ${issue.expected_value || 'Consistent figure'}\n` +
        `• **Variance:** ${issue.delta || 'Documented inconsistency'}\n` +
        `• **Derivation:** ${issue.explanation || issue.description}\n\n` +
        `**Suggested Action:** ${issue.suggested_fix || 'Confirm figures against primary documentation prior to publication.'}`;
    }

    return {
      issue_id: issue.id,
      answer,
      evidence_quote_a: quoteA,
      evidence_quote_b: quoteB,
      resolution_recommendation: issue.suggested_fix || 'Verify against primary accounting working papers.'
    };
  }

  /**
   * Interactive document chat query handler.
   */
  public static async answerDocumentQuery(
    report: AuditReport,
    userQuery: string
  ): Promise<ChatDocResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const q = userQuery.toLowerCase();
    const issues = report.issues;
    const health = report.summary.health_score;
    const grade = report.summary.grade;
    const total = report.summary.total_issues;
    const critical = report.summary.critical_count;
    const docName = report.doc_name;

    // Case 1: Clean document with 0 issues
    if (total === 0) {
      const answer = `### Document Review Overview: ${docName}\n\n` +
        `• **Integrity Score:** **${health}/100 (Grade ${grade})**\n` +
        `• **Findings:** No discrepancies were detected across ${report.summary.pages_analyzed} pages and ${report.summary.tables_analyzed} tables evaluated.\n` +
        `• **Scope of Checks:** Table column additions, in-text percentage distribution checks, cross-page claim compatibility, milestone chronological sequences, and unit scale consistency.\n\n` +
        `**Verification Notice:** Automated rules inspect specific mathematical and structural patterns. ` +
        `A clean result indicates consistency within the evaluated rules, but does not constitute a certified institutional audit opinion or guarantee that the document is entirely error-free.`;

      return {
        answer,
        relevant_pages: [1],
        relevant_issue_ids: [],
        suggested_followups: ['Overview of evaluated checks', 'Scope of automated review', 'Verify table totals'],
        memo_ready: false
      };
    }

    // Case 2: Summary / Top discrepancies
    if (['summar', 'top', 'overview', 'what is wrong', 'main issue', 'finding'].some((w) => q.includes(w))) {
      const critIssues = issues.filter((i) => i.severity === 'critical');
      const warnIssues = issues.filter((i) => i.severity === 'warning');

      let critList = '';
      critIssues.slice(0, 5).forEach((ci, idx) => {
        critList += `**${idx + 1}. [${ci.title}]** (Page ${ci.primary_anchor.page}` +
          (ci.secondary_anchor ? ` vs Page ${ci.secondary_anchor.page}` : '') + `)\n` +
          `   • Quote: "${ci.primary_anchor.text.slice(0, 90)}..."\n` +
          (ci.delta ? `   • Delta: Stated \`${ci.actual_value}\` vs Expected \`${ci.expected_value}\` (${ci.delta})\n` : '') +
          `   • Derivation: ${ci.explanation || ci.description}\n\n`;
      });

      let warnList = '';
      warnIssues.slice(0, 3).forEach((wi) => {
        warnList += `• **${wi.title} (Page ${wi.primary_anchor.page}):** ${wi.description}\n`;
      });

      const critText = critList || 'No critical issues detected.\n';
      const warnText = warnList ? `#### Additional Warnings:\n${warnList}\n` : '';

      const answer = `### Executive Review Summary: ${docName}\n\n` +
        `**Integrity Rating:** **${health}/100 (Grade ${grade})** | **Status:** Discrepancies Flagged for Review\n\n` +
        `Voltora analyzed ${report.summary.pages_analyzed} pages and ${report.summary.tables_analyzed} tables, ` +
        `identifying **${total} discrepancies** (${critical} Critical, ${report.summary.warning_count} Warnings).\n\n` +
        `#### Critical Findings:\n${critText}` +
        `${warnText}` +
        `**Recommended Action:** Review the highlighted discrepancies with the disclosure authors and reconcile against source records.`;

      const pages = Array.from(new Set(issues.map((i) => i.primary_anchor.page))).sort((a, b) => a - b);

      return {
        answer,
        relevant_pages: pages,
        relevant_issue_ids: critIssues.map((i) => i.id),
        suggested_followups: ['Explain arithmetic variances', 'Review cross-page contradictions', 'Draft review resolution memo'],
        memo_ready: false
      };
    }

    // Case 3: Math & Arithmetic
    if (['math', 'revenue', 'ebitda', 'variance', 'reconcil', 'sum', 'subtotal', 'add', 'growth'].some((w) => q.includes(w))) {
      const mathIssues = issues.filter((i) => i.category === 'math_discrepancy' || i.title.toLowerCase().includes('sum') || i.title.toLowerCase().includes('growth'));

      if (mathIssues.length > 0) {
        let items = '';
        mathIssues.forEach((mi) => {
          items += `• **${mi.title} (Page ${mi.primary_anchor.page}):**\n` +
            `  - Stated: \`${mi.actual_value || 'N/A'}\` | Expected: \`${mi.expected_value || 'N/A'}\` (Variance: \`${mi.delta || 'N/A'}\`)\n` +
            `  - Derivation: ${mi.explanation || mi.description}\n` +
            `  - Recommendation: ${mi.suggested_fix || 'Reconcile column components.'}\n\n`;
        });

        const answer = `### Mathematical Cross-Footing & Formula Verification\n\n` +
          `Identified **${mathIssues.length} mathematical inconsistencies** across tables and narrative disclosures:\n\n` +
          `${items}` +
          `*Resolution Protocol:* Review spreadsheet formulas and ensure unlisted items (e.g. other income or eliminations) are explicitly scheduled.`;

        return {
          answer,
          relevant_pages: mathIssues.map((i) => i.primary_anchor.page),
          relevant_issue_ids: mathIssues.map((i) => i.id),
          suggested_followups: ['Summarize top discrepancies', 'Draft review resolution memo', 'Check debt disclosures'],
          memo_ready: false
        };
      }
    }

    // Case 4: Debt & Capital Structure
    if (['debt', 'liabilit', 'credit', 'borrow', 'capital'].some((w) => q.includes(w))) {
      const debtIssues = issues.filter((i) =>
        i.title.toLowerCase().includes('debt') ||
        i.description.toLowerCase().includes('debt') ||
        i.description.toLowerCase().includes('credit')
      );

      if (debtIssues.length > 0) {
        let items = '';
        debtIssues.forEach((di) => {
          items += `• **${di.title} (Page ${di.primary_anchor.page}` +
            (di.secondary_anchor ? ` vs Page ${di.secondary_anchor.page}` : '') + `):**\n` +
            `  - Conflict: ${di.description}\n` +
            `  - Action: ${di.suggested_fix || 'Verify credit facility agreements.'}\n\n`;
        });

        const answer = `### Capital Structure & Debt Disclosure Inspection\n\n` +
          `Detected **${debtIssues.length} conflicting representation(s)** regarding capital structure:\n\n` +
          `${items}` +
          `*Suggested Action:* Confirm active credit facility agreements and balance sheet schedules before finalizing disclosures.`;

        return {
          answer,
          relevant_pages: Array.from(new Set(debtIssues.map((i) => i.primary_anchor.page))),
          relevant_issue_ids: debtIssues.map((i) => i.id),
          suggested_followups: ['Summarize top discrepancies', 'Explain arithmetic variances', 'Draft review resolution memo'],
          memo_ready: false
        };
      }
    }

    // Case 5: Formal Resolution Memorandum
    if (['memo', 'resolution', 'draft', 'export'].some((w) => q.includes(w))) {
      let tableRows = '';
      issues.slice(0, 8).forEach((i, idx) => {
        const pText = `Page ${i.primary_anchor.page}` + (i.secondary_anchor ? ` vs P.${i.secondary_anchor.page}` : '');
        tableRows += `| ${idx + 1} | ${pText} | ${i.title} | \`${i.actual_value || 'Stated'}\` vs \`${i.expected_value || 'Expected'}\` | ${i.suggested_fix || 'Reconcile'} |\n`;
      });

      const findingsTable = tableRows || '| - | All | No discrepancies flagged | - | Document consistent with rules |\n';

      const answer = `### DRAFT AUDIT REVIEW MEMORANDUM\n\n` +
        `**TO:** Document Review Team / Financial Reporting Working Group  \n` +
        `**FROM:** Voltora Document Audit Review  \n` +
        `**DOCUMENT:** ${docName}  \n` +
        `**INTEGRITY SCORE:** ${health}/100 (Grade ${grade})  \n\n` +
        `---\n\n` +
        `#### 1. Scope & Executive Overview\n` +
        `Automated multi-dimensional inspection was performed on **${docName}** (${report.summary.pages_analyzed} pages, ${report.summary.tables_analyzed} tables). ` +
        `A total of **${total} potential discrepancies** were identified (${critical} critical, ${report.summary.warning_count} warning).\n\n` +
        `#### 2. Key Findings Schedule\n\n` +
        `| # | Location | Finding | Values / Variance | Suggested Action |\n` +
        `|:---|:---|:---|:---|:---|\n` +
        `${findingsTable}\n\n` +
        `#### 3. Recommended Next Steps\n` +
        `1. Validate reported variances against original source spreadsheets or ledger entries.\n` +
        `2. Align narrative descriptions with audited financial statements prior to publication.\n` +
        `3. Note that automated analysis provides decision support and should be confirmed by authorized reviewers.`;

      return {
        answer,
        relevant_pages: Array.from(new Set(issues.map((i) => i.primary_anchor.page))),
        relevant_issue_ids: issues.slice(0, 5).map((i) => i.id),
        suggested_followups: ['Summarize top discrepancies', 'Explain revenue & EBITDA variance', 'Generate CFO talking points'],
        memo_ready: true
      };
    }

    // Default Fallback: Grounded in report
    let matchedIssue = issues[0];
    const qWords = q.split(/\W+/).filter((w) => w.length > 3);
    for (const i of issues) {
      if (qWords.some((w) => i.title.toLowerCase().includes(w) || i.description.toLowerCase().includes(w))) {
        matchedIssue = i;
        break;
      }
    }

    let answer = `### Document Finding Inquiry: ${docName}\n\n`;
    if (matchedIssue) {
      answer += `Relevant Finding: **${matchedIssue.title}** (Page ${matchedIssue.primary_anchor.page}` +
        (matchedIssue.secondary_anchor ? ` vs Page ${matchedIssue.secondary_anchor.page}` : '') + `)\n\n` +
        `• **Observation:** ${matchedIssue.description}\n` +
        (matchedIssue.delta ? `• **Calculated Variance:** Stated \`${matchedIssue.actual_value}\` vs Expected \`${matchedIssue.expected_value}\` (${matchedIssue.delta})\n` : '') +
        (matchedIssue.explanation ? `• **Mathematical Proof:** ${matchedIssue.explanation}\n` : '') +
        `• **Suggested Fix:** ${matchedIssue.suggested_fix || 'Verify against primary records.'}\n\n` +
        `*Total Document Status:* ${total} issues detected, Integrity Score: ${health}/100 (Grade ${grade}).`;
    } else {
      answer += `Evaluated **${report.summary.pages_analyzed} pages** and **${report.summary.tables_analyzed} tables** in **${docName}**.\n\n` +
        `Current Document Integrity Score is **${health}/100 (Grade ${grade})** with **${total} flagged finding(s)** across mathematical cross-footing, semantic contradictions, and chronological sequences.\n\n` +
        `Ask for "Summarize top discrepancies", "Explain arithmetic variances", or "Draft review resolution memo" to inspect specific findings.`;
    }

    return {
      answer,
      relevant_pages: matchedIssue ? [matchedIssue.primary_anchor.page] : [1],
      relevant_issue_ids: matchedIssue ? [matchedIssue.id] : [],
      suggested_followups: ['Summarize top discrepancies', 'Explain revenue & EBITDA variance', 'Draft review resolution memo'],
      memo_ready: false
    };
  }
}
