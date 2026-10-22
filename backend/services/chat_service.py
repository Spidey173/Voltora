import os
import re
import logging
from typing import Optional, List
from backend.models.schemas import AuditIssue, AskIssueResponse, ChatDocResponse, AuditReport

logger = logging.getLogger("voltora.chat")

class ChatService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
        self.groq_client = None
        if self.api_key:
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.warning("Failed to initialize Groq client: %s", e)

    def answer_issue_query(self, issue: AuditIssue, user_query: str) -> AskIssueResponse:
        quote_a = issue.primary_anchor.text
        quote_b = issue.secondary_anchor.text if issue.secondary_anchor else "N/A"

        # If Groq client is configured, generate dynamic LLM response
        if self.groq_client:
            try:
                prompt = (
                    f"You are Voltora, a factual document audit assistant assisting an audit team with document review.\n"
                    f"Ground your answer strictly in the provided report finding. Do not assert that the finding is a confirmed regulatory violation or that it triggers filing rejection. Provide qualified, practical observations.\n\n"
                    f"Issue Title: {issue.title}\n"
                    f"Category: {issue.category.value if hasattr(issue.category, 'value') else issue.category}\n"
                    f"Severity: {issue.severity.value.upper() if hasattr(issue.severity, 'value') else str(issue.severity).upper()}\n"
                    f"Primary Quote (Page {issue.primary_anchor.page}): \"{quote_a}\"\n"
                    f"Secondary Quote (Page {issue.secondary_anchor.page if issue.secondary_anchor else 'N/A'}): \"{quote_b}\"\n"
                    f"Stated Value: {issue.actual_value or 'N/A'}\n"
                    f"Expected/Recalculated Value: {issue.expected_value or 'N/A'}\n"
                    f"Variance/Delta: {issue.delta or 'N/A'}\n"
                    f"Derivation: {issue.explanation or 'Identified by automated rule'}\n"
                    f"User Query: {user_query}\n\n"
                    f"Respond concisely with factual grounding. Cite page numbers and explain how the discrepancy was derived. Avoid presenting the assistant as a regulator or legal authority."
                )

                completion = self.groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are Voltora, a document audit assistant providing evidence-grounded review notes."},
                        {"role": "user", "content": prompt}
                    ],
                    model=self.model,
                    max_tokens=250,
                    temperature=0.1
                )
                answer = completion.choices[0].message.content.strip()
                if answer:
                    return AskIssueResponse(
                        issue_id=issue.id,
                        answer=answer,
                        evidence_quote_a=quote_a,
                        evidence_quote_b=quote_b if issue.secondary_anchor else None,
                        resolution_recommendation=issue.suggested_fix or "Reconcile the statement with underlying records."
                    )
            except Exception as e:
                logger.warning("Groq API error during issue query: %s. Falling back to rule-based engine.", e)

        # Deterministic evidence-grounded response
        q_lower = user_query.lower()
        cat_str = (issue.category.value if hasattr(issue.category, 'value') else str(issue.category)).replace('_', ' ').title()

        if any(w in q_lower for w in ["why", "explain", "cause", "reason", "how"]):
            if issue.secondary_anchor:
                answer = (
                    f"### Discrepancy Evidence Analysis: {issue.title}\n\n"
                    f"• **Primary Statement (Page {issue.primary_anchor.page}):** \"{quote_a}\"\n"
                    f"• **Contrasting Statement (Page {issue.secondary_anchor.page}):** \"{quote_b}\"\n\n"
                    f"**Derivation:** {issue.explanation or 'The automated audit rule flagged mutually incompatible representations across distinct sections of the document.'}\n\n"
                    f"*Note:* This is an automated analytical check identifying potential disclosure divergence for human review."
                )
            else:
                answer = (
                    f"### Arithmetic / Finding Breakdown: {issue.title}\n\n"
                    f"• **Stated Figure (Page {issue.primary_anchor.page}):** \"{quote_a}\" [Stated: {issue.actual_value or 'N/A'}]\n"
                    f"• **Calculated Value:** Expected `{issue.expected_value or 'N/A'}` (Variance: `{issue.delta or 'N/A'}`)\n\n"
                    f"**Derivation:** {issue.explanation or 'Independent cross-verification detected a difference between the stated figure and computed value.'}\n\n"
                    f"*Note:* Verify underlying line items to confirm whether unlisted components or rounding adjustments apply."
                )
        elif any(w in q_lower for w in ["fix", "resolve", "correct", "reconcile", "recommend"]):
            answer = (
                f"### Practical Reconciliation Protocol for [{issue.title}]\n\n"
                f"1. **Primary Adjustment:** {issue.suggested_fix or 'Review source general ledger or working papers to verify the correct figure.'}\n"
                f"2. **Harmonization:** Ensure subsequent disclosures consistently reference `{issue.expected_value or issue.actual_value or 'the verified figure'}`.\n"
                f"3. **Contextual Disclosure:** If the divergence is intentional (e.g. non-GAAP vs GAAP or scope differences), add clarifying narrative or footnote disclosures to avoid reader ambiguity."
            )
        elif any(w in q_lower for w in ["risk", "sec", "legal", "regulat", "severity", "material"]):
            answer = (
                f"### Disclosure Risk Assessment ({issue.severity.value.upper() if hasattr(issue.severity, 'value') else str(issue.severity).upper()})\n\n"
                f"Conflicting representations or arithmetic variances regarding **{issue.title}** can reduce document transparency and create confusion during review.\n\n"
                f"• **Nature of Finding:** {issue.description}\n"
                f"• **Reported Discrepancy:** {issue.delta or 'Cross-section divergence'}\n\n"
                f"*Disclaimer:* Voltora is an analytical document checking tool and does not provide legal opinions, regulatory determinations, or formal audit opinions. Discrepancies should be reviewed by qualified accounting or legal personnel."
            )
        else:
            answer = (
                f"### Audit Evidence Note: [{issue.title}]\n\n"
                f"• **Location:** Page {issue.primary_anchor.page}" + (f" vs Page {issue.secondary_anchor.page}" if issue.secondary_anchor else "") + "\n"
                f"• **Reported:** {issue.actual_value or quote_a[:60]}\n"
                f"• **Expected / Benchmark:** {issue.expected_value or 'Consistent figure'}\n"
                f"• **Variance:** {issue.delta or 'Documented inconsistency'}\n"
                f"• **Derivation:** {issue.explanation or issue.description}\n\n"
                f"**Suggested Action:** {issue.suggested_fix or 'Confirm figures against primary documentation prior to publication.'}"
            )

        return AskIssueResponse(
            issue_id=issue.id,
            answer=answer,
            evidence_quote_a=quote_a,
            evidence_quote_b=quote_b if issue.secondary_anchor else None,
            resolution_recommendation=issue.suggested_fix or "Verify against primary accounting working papers."
        )

    def answer_document_query(self, report: AuditReport, user_query: str) -> ChatDocResponse:
        issues = report.issues
        issues_summary = "\n".join([
            f"- [{i.severity.value.upper() if hasattr(i.severity, 'value') else str(i.severity).upper()}] Page {i.primary_anchor.page}: {i.title} - {i.description}"
            + (f" (Conflicting with Page {i.secondary_anchor.page})" if i.secondary_anchor else "")
            + (f" [Actual: {i.actual_value}, Expected: {i.expected_value}, Delta: {i.delta}]" if i.delta else "")
            for i in issues
        ])

        # If Groq client is configured, generate dynamic LLM response
        if self.groq_client:
            try:
                system_prompt = (
                    "You are Voltora, an automated document audit assistant.\n"
                    "You inspect financial disclosures and corporate reports using rule-based and semantic heuristics.\n"
                    "Ground all answers strictly on the document findings provided below. If the provided findings do not contain information to answer the query, clearly state that available document evidence is insufficient.\n"
                    "Do not make definitive legal determinations, guarantee SEC regulatory outcomes, or claim filing rejection.\n"
                    "Format responses with clear markdown headings and bullet points."
                )
                user_msg = (
                    f"Document Name: {report.doc_name}\n"
                    f"Overall Document Health Score: {report.summary.health_score}/100 (Grade {report.summary.grade})\n"
                    f"Total Issues Detected: {report.summary.total_issues} "
                    f"({report.summary.critical_count} Critical, {report.summary.warning_count} Warnings, {report.summary.info_count} Info)\n"
                    f"Deterministic Checks: {getattr(report.summary, 'deterministic_count', 0)} | Heuristic Checks: {getattr(report.summary, 'heuristic_count', 0)}\n"
                    f"Pages Analyzed: {report.summary.pages_analyzed} | Tables Analyzed: {report.summary.tables_analyzed}\n\n"
                    f"Detected Audit Discrepancies:\n{issues_summary if issues_summary else 'No discrepancies detected within evaluated rules.'}\n\n"
                    f"User Query: {user_query}\n\n"
                    f"Provide an evidence-grounded response citing specific pages and findings."
                )

                completion = self.groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg}
                    ],
                    model=self.model,
                    max_tokens=500,
                    temperature=0.15
                )
                answer = completion.choices[0].message.content.strip()
                if answer:
                    pages = sorted(list(set([i.primary_anchor.page for i in issues]))) if issues else [1]
                    issue_ids = [i.id for i in issues[:5]]
                    followups = self._generate_dynamic_followups(issues)
                    return ChatDocResponse(
                        answer=answer,
                        relevant_pages=pages,
                        relevant_issue_ids=issue_ids,
                        suggested_followups=followups,
                        memo_ready="memo" in user_query.lower() or "draft" in user_query.lower()
                    )
            except Exception as e:
                logger.warning("Groq API error during doc query: %s. Falling back to rule-based engine.", e)

        # Dynamic evidence-grounded document response
        return self._build_dynamic_document_response(report, user_query)

    def _generate_dynamic_followups(self, issues: List[AuditIssue]) -> List[str]:
        followups = []
        if any("math" in (i.category.value if hasattr(i.category, 'value') else str(i.category)) for i in issues):
            followups.append("Explain arithmetic variances")
        if any("contradiction" in (i.category.value if hasattr(i.category, 'value') else str(i.category)) for i in issues):
            followups.append("Review cross-page contradictions")
        if any("temporal" in (i.category.value if hasattr(i.category, 'value') else str(i.category)) for i in issues):
            followups.append("Inspect chronological sequence")
        if any("unit" in (i.category.value if hasattr(i.category, 'value') else str(i.category)) for i in issues):
            followups.append("Review unit and scale consistency")
        if not followups:
            followups = ["Overview of evaluated checks", "Scope of automated audit", "Document health breakdown"]
        else:
            followups.append("Draft audit review memo")
        return followups[:3]

    def _build_dynamic_document_response(self, report: AuditReport, query: str) -> ChatDocResponse:
        q = query.lower()
        issues = report.issues
        health = report.summary.health_score
        grade = report.summary.grade
        total = report.summary.total_issues
        critical = report.summary.critical_count
        doc_name = report.doc_name

        # Case 1: Clean document with 0 issues
        if total == 0:
            answer = (
                f"### Document Audit Overview: {doc_name}\n\n"
                f"• **Integrity Score:** **{health}/100 (Grade {grade})**\n"
                f"• **Findings:** No discrepancies were detected across {report.summary.pages_analyzed} pages and {report.summary.tables_analyzed} tables evaluated.\n"
                f"• **Scope of Checks:** Table column additions, in-text percentage distribution checks, cross-page claim compatibility, milestone chronological sequences, and unit scale consistency.\n\n"
                f"**Important Verification Notice:** Automated rules inspect specific mathematical and structural patterns. "
                f"A clean result indicates consistency within the evaluated rules, but does not constitute an institutional audit opinion or guarantee that the document is entirely error-free."
            )
            return ChatDocResponse(
                answer=answer,
                relevant_pages=[1],
                relevant_issue_ids=[],
                suggested_followups=["Overview of evaluated checks", "Scope of automated audit", "Verify table totals"],
                memo_ready=False
            )

        # Case 2: Summary / Overview of issues
        if any(w in q for w in ["summar", "top", "overview", "what is wrong", "main issue", "vulnerabilit", "finding"]):
            crit_issues = [i for i in issues if (hasattr(i.severity, 'value') and i.severity.value == 'critical') or str(i.severity) == 'critical']
            warn_issues = [i for i in issues if (hasattr(i.severity, 'value') and i.severity.value == 'warning') or str(i.severity) == 'warning']

            crit_list = ""
            for idx, ci in enumerate(crit_issues[:5], 1):
                crit_list += (
                    f"**{idx}. [{ci.title}]** (Page {ci.primary_anchor.page}"
                    + (f" vs Page {ci.secondary_anchor.page}" if ci.secondary_anchor else "")
                    + f")\n"
                    f"   • Quote: \"{ci.primary_anchor.text[:90]}...\"\n"
                    + (f"   • Delta: Stated `{ci.actual_value}` vs Expected `{ci.expected_value}` ({ci.delta})\n" if ci.delta else "")
                    + f"   • Derivation: {ci.explanation or ci.description}\n\n"
                )

            warn_list = ""
            for idx, wi in enumerate(warn_issues[:3], 1):
                warn_list += (
                    f"• **{wi.title} (Page {wi.primary_anchor.page}):** {wi.description}\n"
                )

            answer = (
                f"### Executive Audit Summary: {doc_name}\n\n"
                f"**Integrity Rating:** **{health}/100 (Grade {grade})** | **Status:** Discrepancies Flagged for Review\n\n"
                f"Voltora analyzed {report.summary.pages_analyzed} pages and {report.summary.tables_analyzed} tables, "
                f"identifying **{total} discrepancies** ({critical} Critical, {report.summary.warning_count} Warnings).\n\n"
                f"#### Critical Findings:\n{crit_list if crit_list else 'No critical issues detected.\n'}"
                + (f"#### Additional Warnings:\n{warn_list}\n" if warn_list else "")
                + f"**Recommended Action:** Review the highlighted discrepancies with the disclosure authors and reconcile against source records."
            )
            pages = sorted(list(set([i.primary_anchor.page for i in issues])))
            return ChatDocResponse(
                answer=answer,
                relevant_pages=pages,
                relevant_issue_ids=[i.id for i in crit_issues],
                suggested_followups=self._generate_dynamic_followups(issues),
                memo_ready=False
            )

        # Case 3: Math & Arithmetic
        elif any(w in q for w in ["math", "revenue", "ebitda", "variance", "reconcil", "sum", "subtotal", "add", "growth"]):
            math_issues = [i for i in issues if "math" in (i.category.value if hasattr(i.category, 'value') else str(i.category))]
            if math_issues:
                items = ""
                for mi in math_issues:
                    items += (
                        f"• **{mi.title} (Page {mi.primary_anchor.page}):**\n"
                        f"  - Stated: `{mi.actual_value or 'N/A'}` | Expected: `{mi.expected_value or 'N/A'}` (Variance: `{mi.delta or 'N/A'}`)\n"
                        f"  - Derivation: {mi.explanation or mi.description}\n"
                        f"  - Recommendation: {mi.suggested_fix or 'Align table entries with calculated column sum.'}\n\n"
                    )
                answer = (
                    f"### Mathematical Cross-Footing & Calculation Review\n\n"
                    f"The deterministic arithmetic auditor identified **{len(math_issues)} mathematical variances** in {doc_name}:\n\n"
                    f"{items}"
                    f"Review the noted line items against source schedules before final distribution."
                )
                pages = sorted(list(set([i.primary_anchor.page for i in math_issues])))
                return ChatDocResponse(
                    answer=answer,
                    relevant_pages=pages,
                    relevant_issue_ids=[i.id for i in math_issues],
                    suggested_followups=self._generate_dynamic_followups(issues),
                    memo_ready=False
                )
            else:
                answer = (
                    f"### Mathematical Verification: {doc_name}\n\n"
                    f"No arithmetic sum or percentage distribution discrepancies were detected in the tables or narrative of {doc_name}. "
                    f"All evaluated table columns reconciled to their stated totals."
                )
                return ChatDocResponse(
                    answer=answer,
                    relevant_pages=[1],
                    relevant_issue_ids=[],
                    suggested_followups=self._generate_dynamic_followups(issues),
                    memo_ready=False
                )

        # Case 4: Specific Page Query (e.g. "page 1", "page 3")
        page_match = re.search(r'page\s*(\d+)', q)
        if page_match:
            p_num = int(page_match.group(1))
            page_issues = [i for i in issues if i.primary_anchor.page == p_num or (i.secondary_anchor and i.secondary_anchor.page == p_num)]
            if page_issues:
                pi_text = ""
                for idx, pi in enumerate(page_issues, 1):
                    role = "Primary anchor" if pi.primary_anchor.page == p_num else "Cross-page anchor"
                    pi_text += (
                        f"**{idx}. [{pi.title}]** ({role})\n"
                        f"   • Category: {pi.category.value if hasattr(pi.category, 'value') else pi.category} ({pi.severity.value.upper() if hasattr(pi.severity, 'value') else str(pi.severity).upper()})\n"
                        f"   • Quote: \"{pi.primary_anchor.text if pi.primary_anchor.page == p_num else (pi.secondary_anchor.text if pi.secondary_anchor else '')}\"\n"
                        f"   • Derivation: {pi.explanation or pi.description}\n\n"
                    )
                answer = (
                    f"### Findings Associated with Page {p_num}\n\n"
                    f"Voltora identified **{len(page_issues)} audit findings** relating to Page {p_num}:\n\n"
                    f"{pi_text}"
                )
            else:
                answer = (
                    f"### Page {p_num} Audit Status\n\n"
                    f"No discrepancies were detected on Page {p_num} of {doc_name} within evaluated rules."
                )
            return ChatDocResponse(
                answer=answer,
                relevant_pages=[p_num],
                relevant_issue_ids=[i.id for i in page_issues],
                suggested_followups=self._generate_dynamic_followups(issues),
                memo_ready=False
            )

        # Case 5: Audit Review Memo
        if any(w in q for w in ["memo", "draft", "resolution", "report"]):
            table_rows = ""
            for idx, i in enumerate(issues[:5], 1):
                p_text = f"Page {i.primary_anchor.page}" + (f" vs P.{i.secondary_anchor.page}" if i.secondary_anchor else "")
                table_rows += (
                    f"| {idx} | {p_text} | {i.title} | `{i.actual_value or 'Stated'}` vs `{i.expected_value or 'Expected'}` | {i.suggested_fix or 'Reconcile'} |\n"
                )

            answer = (
                f"### DRAFT AUDIT REVIEW MEMORANDUM\n\n"
                f"**TO:** Document Review Team / Financial Reporting Working Group  \n"
                f"**FROM:** Voltora Document Audit Review  \n"
                f"**DOCUMENT:** {doc_name}  \n"
                f"**INTEGRITY SCORE:** {health}/100 (Grade {grade})  \n\n"
                f"---\n\n"
                f"#### 1. Scope & Executive Overview\n"
                f"Automated multi-dimensional inspection was performed on **{doc_name}** ({report.summary.pages_analyzed} pages, {report.summary.tables_analyzed} tables). "
                f"A total of **{total} potential discrepancies** were identified ({critical} critical, {report.summary.warning_count} warning).\n\n"
                f"#### 2. Key Findings Schedule\n\n"
                f"| # | Location | Finding | Values / Variance | Suggested Action |\n"
                f"|:---|:---|:---|:---|:---|\n"
                f"{table_rows if table_rows else '| - | All | No discrepancies flagged | - | Document consistent with rules |\n'}\n\n"
                f"#### 3. Recommended Next Steps\n"
                f"1. Validate reported variances against original source spreadsheets or ledger entries.\n"
                f"2. Align narrative descriptions with audited financial statements prior to publication.\n"
                f"3. Note that automated analysis provides decision support and should be confirmed by authorized reviewers."
            )
            return ChatDocResponse(
                answer=answer,
                relevant_pages=sorted(list(set([i.primary_anchor.page for i in issues]))) if issues else [1],
                relevant_issue_ids=[i.id for i in issues[:5]],
                suggested_followups=self._generate_dynamic_followups(issues),
                memo_ready=True
            )

        # Case 6: Fallback general response grounded strictly in document report
        matched_issue = None
        for i in issues:
            words = set(re.findall(r'\w+', i.title.lower()))
            if any(w in q for w in words if len(w) > 4):
                matched_issue = i
                break

        if matched_issue:
            answer = (
                f"### Evidence for: {matched_issue.title}\n\n"
                f"• **Location:** Page {matched_issue.primary_anchor.page}" + (f" vs Page {matched_issue.secondary_anchor.page}" if matched_issue.secondary_anchor else "") + "\n"
                f"• **Category:** {matched_issue.category.value if hasattr(matched_issue.category, 'value') else matched_issue.category}\n"
                f"• **Primary Statement:** \"{matched_issue.primary_anchor.text}\"\n"
                + (f"• **Conflicting Statement:** \"{matched_issue.secondary_anchor.text}\"\n" if matched_issue.secondary_anchor else "")
                + (f"• **Variance:** Stated `{matched_issue.actual_value}` vs Expected `{matched_issue.expected_value}` ({matched_issue.delta})\n" if matched_issue.delta else "")
                + f"• **Derivation:** {matched_issue.explanation or matched_issue.description}\n\n"
                f"**Recommendation:** {matched_issue.suggested_fix or 'Confirm source figures before finalizing disclosure.'}"
            )
            pages = [matched_issue.primary_anchor.page]
            if matched_issue.secondary_anchor:
                pages.append(matched_issue.secondary_anchor.page)
            return ChatDocResponse(
                answer=answer,
                relevant_pages=sorted(list(set(pages))),
                relevant_issue_ids=[matched_issue.id],
                suggested_followups=self._generate_dynamic_followups(issues),
                memo_ready=False
            )

        # General report summary fallback
        answer = (
            f"### Document Audit Assessment: {doc_name}\n\n"
            f"• **Integrity Score:** **{health}/100 (Grade {grade})**\n"
            f"• **Detected Discrepancies:** **{total} findings** ({critical} critical, {report.summary.warning_count} warnings)\n"
            f"• **Coverage:** {report.summary.pages_analyzed} pages, {report.summary.tables_analyzed} tables\n\n"
            + (f"The findings include {', '.join(set(i.category.value.replace('_', ' ') for i in issues[:3]))}. " if issues else "No issues were detected within evaluated rules. ")
            + f"Select a suggested query below or click on any citation in the viewer to inspect specific evidence."
        )
        return ChatDocResponse(
            answer=answer,
            relevant_pages=sorted(list(set([i.primary_anchor.page for i in issues]))) if issues else [1],
            relevant_issue_ids=[i.id for i in issues[:3]],
            suggested_followups=self._generate_dynamic_followups(issues),
            memo_ready=False
        )
