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

function generateDynamicFollowups(issues: AuditIssue[]): string[] {
  const followups: string[] = [];
  if (issues.some((i) => String(i.category).includes('math'))) {
    followups.push('Explain arithmetic variances');
  }
  if (issues.some((i) => String(i.category).includes('contradiction'))) {
    followups.push('Review cross-page contradictions');
  }
  if (issues.some((i) => String(i.category).includes('temporal'))) {
    followups.push('Inspect chronological sequence');
  }
  if (issues.some((i) => String(i.category).includes('unit'))) {
    followups.push('Review unit and scale consistency');
  }
  if (followups.length === 0) {
    return ['Overview of evaluated checks', 'Scope of automated audit', 'Document health breakdown'];
  }
  followups.push('Draft audit review memo');
  return followups.slice(0, 3);
}

export class DemoService {
  /**
   * Returns a sample report by document id.
   */
  public static async getSampleReport(sampleId: string): Promise<AuditReport> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const report = sampleReports[sampleId];
    if (!report) {
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
   * Answers questions about a specific issue with exact evidence and derivations.
   * Matches backend ChatService.answer_issue_query 1-to-1.
   */
  public static async answerIssueQuery(
    issue: AuditIssue,
    userQuery: string
  ): Promise<AskIssueResponse> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const quoteA = issue.primary_anchor.text;
    const quoteB = issue.secondary_anchor ? issue.secondary_anchor.text : 'N/A';
    const qLower = userQuery.toLowerCase();

    let answer = '';

    if (['why', 'explain', 'cause', 'reason', 'how'].some((w) => qLower.includes(w))) {
      if (issue.secondary_anchor) {
        answer =
          `### Discrepancy Evidence Analysis: ${issue.title}\n\n` +
          `• **Primary Statement (Page ${issue.primary_anchor.page}):** "${quoteA}"\n` +
          `• **Contrasting Statement (Page ${issue.secondary_anchor.page}):** "${quoteB}"\n\n` +
          `**Derivation:** ${issue.explanation || 'The automated audit rule flagged mutually incompatible representations across distinct sections of the document.'}\n\n` +
          `*Note:* This is an automated analytical check identifying potential disclosure divergence for human review.`;
      } else {
        answer =
          `### Arithmetic / Finding Breakdown: ${issue.title}\n\n` +
          `• **Stated Figure (Page ${issue.primary_anchor.page}):** "${quoteA}" [Stated: ${issue.actual_value || 'N/A'}]\n` +
          `• **Calculated Value:** Expected \`${issue.expected_value || 'N/A'}\` (Variance: \`${issue.delta || 'N/A'}\`)\n\n` +
          `**Derivation:** ${issue.explanation || 'Independent cross-verification detected a difference between the stated figure and computed value.'}\n\n` +
          `*Note:* Verify underlying line items to confirm whether unlisted components or rounding adjustments apply.`;
      }
    } else if (['fix', 'resolve', 'correct', 'reconcile', 'recommend'].some((w) => qLower.includes(w))) {
      answer =
        `### Practical Reconciliation Protocol for [${issue.title}]\n\n` +
        `1. **Primary Adjustment:** ${issue.suggested_fix || 'Review source general ledger or working papers to verify the correct figure.'}\n` +
        `2. **Harmonization:** Ensure subsequent disclosures consistently reference \`${issue.expected_value || issue.actual_value || 'the verified figure'}\`.\n` +
        `3. **Contextual Disclosure:** If the divergence is intentional (e.g. non-GAAP vs GAAP or scope differences), add clarifying narrative or footnote disclosures to avoid reader ambiguity.`;
    } else if (['risk', 'sec', 'legal', 'regulat', 'severity', 'material'].some((w) => qLower.includes(w))) {
      answer =
        `### Disclosure Risk Assessment (${String(issue.severity).toUpperCase()})\n\n` +
        `Conflicting representations or arithmetic variances regarding **${issue.title}** can reduce document transparency and create confusion during review.\n\n` +
        `• **Nature of Finding:** ${issue.description}\n` +
        `• **Reported Discrepancy:** ${issue.delta || 'Cross-section divergence'}\n\n` +
        `*Disclaimer:* Voltora is an analytical document checking tool and does not provide legal opinions, regulatory determinations, or formal audit opinions. Discrepancies should be reviewed by qualified accounting or legal personnel.`;
    } else {
      answer =
        `### Audit Evidence Note: [${issue.title}]\n\n` +
        `• **Location:** Page ${issue.primary_anchor.page}` + (issue.secondary_anchor ? ` vs Page ${issue.secondary_anchor.page}` : '') + '\n' +
        `• **Reported:** ${issue.actual_value || quoteA.slice(0, 60)}\n` +
        `• **Expected / Benchmark:** ${issue.expected_value || 'Consistent figure'}\n` +
        `• **Variance:** ${issue.delta || 'Documented inconsistency'}\n` +
        `• **Derivation:** ${issue.explanation || issue.description}\n\n` +
        `**Suggested Action:** ${issue.suggested_fix || 'Confirm figures against primary documentation prior to publication.'}`;
    }

    return {
      issue_id: issue.id,
      answer,
      evidence_quote_a: quoteA,
      evidence_quote_b: issue.secondary_anchor ? quoteB : null,
      resolution_recommendation: issue.suggested_fix || 'Verify against primary accounting working papers.',
    };
  }

  /**
   * Interactive document chat query handler.
   * Matches backend ChatService._build_dynamic_document_response 1-to-1.
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
      const answer =
        `### Document Audit Overview: ${docName}\n\n` +
        `• **Integrity Score:** **${health}/100 (Grade ${grade})**\n` +
        `• **Findings:** No discrepancies were detected across ${report.summary.pages_analyzed} pages and ${report.summary.tables_analyzed} tables evaluated.\n` +
        `• **Scope of Checks:** Table column additions, in-text percentage distribution checks, cross-page claim compatibility, milestone chronological sequences, and unit scale consistency.\n\n` +
        `**Important Verification Notice:** Automated rules inspect specific mathematical and structural patterns. ` +
        `A clean result indicates consistency within the evaluated rules, but does not constitute an institutional audit opinion or guarantee that the document is entirely error-free.`;

      return {
        answer,
        relevant_pages: [1],
        relevant_issue_ids: [],
        suggested_followups: ['Overview of evaluated checks', 'Scope of automated audit', 'Verify table totals'],
        memo_ready: false,
      };
    }

    // Case 2: Summary / Overview of issues
    if (['summar', 'top', 'overview', 'what is wrong', 'main issue', 'vulnerabilit', 'finding'].some((w) => q.includes(w))) {
      const critIssues = issues.filter((i) => i.severity === 'critical');
      const warnIssues = issues.filter((i) => i.severity === 'warning');

      let critList = '';
      critIssues.slice(0, 5).forEach((ci, idx) => {
        critList +=
          `**${idx + 1}. [${ci.title}]** (Page ${ci.primary_anchor.page}` +
          (ci.secondary_anchor ? ` vs Page ${ci.secondary_anchor.page}` : '') +
          `)\n` +
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

      const answer =
        `### Executive Audit Summary: ${docName}\n\n` +
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
        suggested_followups: generateDynamicFollowups(issues),
        memo_ready: false,
      };
    }

    // Case 3: Math & Arithmetic
    if (['math', 'revenue', 'ebitda', 'variance', 'reconcil', 'sum', 'subtotal', 'add', 'growth'].some((w) => q.includes(w))) {
      const mathIssues = issues.filter(
        (i) => String(i.category).includes('math') || i.title.toLowerCase().includes('sum') || i.title.toLowerCase().includes('growth')
      );

      if (mathIssues.length > 0) {
        let items = '';
        mathIssues.forEach((mi) => {
          items +=
            `• **${mi.title} (Page ${mi.primary_anchor.page}):**\n` +
            `  - Stated: \`${mi.actual_value || 'N/A'}\` | Expected: \`${mi.expected_value || 'N/A'}\` (Variance: \`${mi.delta || 'N/A'}\`)\n` +
            `  - Derivation: ${mi.explanation || mi.description}\n` +
            `  - Recommendation: ${mi.suggested_fix || 'Align table entries with calculated column sum.'}\n\n`;
        });

        const answer =
          `### Mathematical Cross-Footing & Calculation Review\n\n` +
          `The deterministic arithmetic auditor identified **${mathIssues.length} mathematical variances** in ${docName}:\n\n` +
          `${items}` +
          `Review the noted line items against source schedules before final distribution.`;

        const pages = Array.from(new Set(mathIssues.map((i) => i.primary_anchor.page))).sort((a, b) => a - b);

        return {
          answer,
          relevant_pages: pages,
          relevant_issue_ids: mathIssues.map((i) => i.id),
          suggested_followups: generateDynamicFollowups(issues),
          memo_ready: false,
        };
      } else {
        const answer =
          `### Mathematical Verification: ${docName}\n\n` +
          `No arithmetic sum or percentage distribution discrepancies were detected in the tables or narrative of ${docName}. ` +
          `All evaluated table columns reconciled to their stated totals.`;

        return {
          answer,
          relevant_pages: [1],
          relevant_issue_ids: [],
          suggested_followups: generateDynamicFollowups(issues),
          memo_ready: false,
        };
      }
    }

    // Case 4: Specific Page Query (e.g. "page 1", "page 3")
    const pageMatch = q.match(/page\s*(\d+)/);
    if (pageMatch) {
      const pNum = parseInt(pageMatch[1], 10);
      const pageIssues = issues.filter(
        (i) => i.primary_anchor.page === pNum || (i.secondary_anchor && i.secondary_anchor.page === pNum)
      );

      if (pageIssues.length > 0) {
        let piText = '';
        pageIssues.forEach((pi, idx) => {
          const role = pi.primary_anchor.page === pNum ? 'Primary anchor' : 'Cross-page anchor';
          piText +=
            `**${idx + 1}. [${pi.title}]** (${role})\n` +
            `   • Category: ${String(pi.category)} (${String(pi.severity).toUpperCase()})\n` +
            `   • Quote: "${pi.primary_anchor.page === pNum ? pi.primary_anchor.text : (pi.secondary_anchor ? pi.secondary_anchor.text : '')}"\n` +
            `   • Derivation: ${pi.explanation || pi.description}\n\n`;
        });

        const answer =
          `### Findings Associated with Page ${pNum}\n\n` +
          `Voltora identified **${pageIssues.length} audit findings** relating to Page ${pNum}:\n\n` +
          `${piText}`;

        return {
          answer,
          relevant_pages: [pNum],
          relevant_issue_ids: pageIssues.map((i) => i.id),
          suggested_followups: generateDynamicFollowups(issues),
          memo_ready: false,
        };
      } else {
        const answer =
          `### Page ${pNum} Audit Status\n\n` +
          `No discrepancies were detected on Page ${pNum} of ${docName} within evaluated rules.`;

        return {
          answer,
          relevant_pages: [pNum],
          relevant_issue_ids: [],
          suggested_followups: generateDynamicFollowups(issues),
          memo_ready: false,
        };
      }
    }

    // Case 5: Audit Review Memo
    if (['memo', 'draft', 'resolution', 'report'].some((w) => q.includes(w))) {
      let tableRows = '';
      issues.slice(0, 5).forEach((i, idx) => {
        const pText = `Page ${i.primary_anchor.page}` + (i.secondary_anchor ? ` vs P.${i.secondary_anchor.page}` : '');
        tableRows +=
          `| ${idx + 1} | ${pText} | ${i.title} | \`${i.actual_value || 'Stated'}\` vs \`${i.expected_value || 'Expected'}\` | ${i.suggested_fix || 'Reconcile'} |\n`;
      });

      const findingsTable =
        tableRows || '| - | All | No discrepancies flagged | - | Document consistent with rules |\n';

      const answer =
        `### DRAFT AUDIT REVIEW MEMORANDUM\n\n` +
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
        relevant_pages: Array.from(new Set(issues.map((i) => i.primary_anchor.page))).sort((a, b) => a - b),
        relevant_issue_ids: issues.slice(0, 5).map((i) => i.id),
        suggested_followups: generateDynamicFollowups(issues),
        memo_ready: true,
      };
    }

    // Case 6: Fallback matching specific issue title words
    let matchedIssue: AuditIssue | null = null;
    for (const i of issues) {
      const words = i.title.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
      if (words.some((w) => q.includes(w))) {
        matchedIssue = i;
        break;
      }
    }

    if (matchedIssue) {
      const answer =
        `### Evidence for: ${matchedIssue.title}\n\n` +
        `• **Location:** Page ${matchedIssue.primary_anchor.page}` + (matchedIssue.secondary_anchor ? ` vs Page ${matchedIssue.secondary_anchor.page}` : '') + '\n' +
        `• **Category:** ${String(matchedIssue.category)}\n` +
        `• **Primary Statement:** "${matchedIssue.primary_anchor.text}"\n` +
        (matchedIssue.secondary_anchor ? `• **Conflicting Statement:** "${matchedIssue.secondary_anchor.text}"\n` : '') +
        (matchedIssue.delta ? `• **Variance:** Stated \`${matchedIssue.actual_value}\` vs Expected \`${matchedIssue.expected_value}\` (${matchedIssue.delta})\n` : '') +
        `• **Derivation:** ${matchedIssue.explanation || matchedIssue.description}\n\n` +
        `**Recommendation:** ${matchedIssue.suggested_fix || 'Confirm source figures before finalizing disclosure.'}`;

      const pages = [matchedIssue.primary_anchor.page];
      if (matchedIssue.secondary_anchor) {
        pages.push(matchedIssue.secondary_anchor.page);
      }

      return {
        answer,
        relevant_pages: Array.from(new Set(pages)).sort((a, b) => a - b),
        relevant_issue_ids: [matchedIssue.id],
        suggested_followups: generateDynamicFollowups(issues),
        memo_ready: false,
      };
    }

    // General report summary fallback
    const answer =
      `### Document Audit Assessment: ${docName}\n\n` +
      `• **Integrity Score:** **${health}/100 (Grade ${grade})**\n` +
      `• **Detected Discrepancies:** **${total} findings** (${critical} critical, ${report.summary.warning_count} warnings)\n` +
      `• **Coverage:** ${report.summary.pages_analyzed} pages, ${report.summary.tables_analyzed} tables\n\n` +
      (issues.length > 0
        ? `The findings include ${Array.from(new Set(issues.slice(0, 3).map((i) => String(i.category).replace('_', ' ')))).join(', ')}. `
        : 'No issues were detected within evaluated rules. ') +
      `Select a suggested query below or click on any citation in the viewer to inspect specific evidence.`;

    return {
      answer,
      relevant_pages: Array.from(new Set(issues.map((i) => i.primary_anchor.page))).sort((a, b) => a - b),
      relevant_issue_ids: issues.slice(0, 3).map((i) => i.id),
      suggested_followups: generateDynamicFollowups(issues),
      memo_ready: false,
    };
  }
}
