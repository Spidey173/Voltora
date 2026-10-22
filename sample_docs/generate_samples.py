import os
import fitz  # PyMuPDF

def generate_acme_fy24():
    os.makedirs("sample_docs", exist_ok=True)
    doc = fitz.open()

    # --- Page 1: Executive Overview ---
    page1 = doc.new_page(width=612, height=792)  # Standard Letter
    p1_text = """ACME CORPORATION
ANNUAL REPORT FOR FISCAL YEAR 2024
MANAGEMENT DISCUSSION & EXECUTIVE SUMMARY

1. Executive Overview & Strategic Direction
During fiscal year 2024, Acme Corporation demonstrated unprecedented operational acceleration across all product lines. Total consolidated revenue growth accelerated to 12% in FY2024, representing sustainable momentum despite macroeconomic headwinds.

Our disciplined capital allocation strategy enabled us to fund all expansion from operational cash flow. We maintained a strict zero-debt capital structure, carrying zero long-term debt and no external credit facilities on our balance sheet throughout the fiscal period.

Furthermore, management has maintained a focused domestic footprint, with no foreign subsidiaries or international operations during the year ending December 31, 2024.

Prior year comparisons reflect operations from fiscal 2024 compared to 2023, establishing the baseline for operational margins.
"""
    rect = fitz.Rect(54, 54, 612 - 54, 792 - 54)
    page1.insert_textbox(rect, p1_text, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    # --- Page 2: Segment Highlights & Operations ---
    page2 = doc.new_page(width=612, height=792)
    p2_text = """ACME CORPORATION
OPERATIONAL HIGHLIGHTS & SEGMENT REVIEW

2. Segment Revenue Contribution
Revenue contributions across our primary divisions in fiscal 2024 were distributed as follows:
- North America Enterprise: 40% of consolidated bookings
- Cloud & Infrastructure Services: 30% of consolidated bookings
- Digital Transformation Solutions: 20% of consolidated bookings

3. Global Expansion & Infrastructure
To support expanding multinational enterprise accounts, subsidiary operations were formally established in the European Union and Asia-Pacific regions during the second half of fiscal 2024.

4. Technology Roadmap Milestones
Under our corporate R&D initiative, Project Genesis milestone completion was achieved in March 2023, while Project Genesis kickoff commenced in November 2023.

5. Operating Expenditure Notes
Operating expenses for the segment totaled $42.5B for the fiscal year, representing engineering and field services investments.
"""
    page2.insert_textbox(rect, p2_text, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    # --- Page 3: Consolidated Income Statement ---
    page3 = doc.new_page(width=612, height=792)
    p3_text = """ACME CORPORATION
CONSOLIDATED STATEMENT OF OPERATIONS (INCOME STATEMENT)
(Amounts in millions of USD)

Revenue Streams Breakdown:
Product Sales: $85
Subscription & Support Services: $35
Maintenance & Licensing: $25
Total Consolidated Revenue: $165

Operating Expenses Breakdown:
Research & Development: $42.5
Sales & Marketing: $30.0
General & Administrative: $18.0
Total Operating Expenses: $90.5

Notes to Financial Statements:
Note 1: Total consolidated revenue implies 14% year-over-year revenue expansion when compared to FY2023 baseline revenue of $127M.
Note 2: To support ongoing capacity buildout, the company secured a $120M senior credit facility and issued $120M convertible debt notes due 2029.
"""
    page3.insert_textbox(rect, p3_text, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    # --- Page 4: Supplementary Notes & Schedules ---
    page4 = doc.new_page(width=612, height=792)
    p4_text = """ACME CORPORATION
SUPPLEMENTARY SCHEDULES & FOOTNOTE DISCLOSURES

Schedule A: Operating Expense Detail
Consolidated operating expenditures aggregated to $42.5M across domestic operations.

Schedule B: Milestone Audits
Project Genesis completion documentation was finalized following the pilot phase rollout.

Auditor Confirmation:
These schedules represent the unadjusted disclosures subject to independent evaluation.
"""
    page4.insert_textbox(rect, p4_text, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    output_path = "sample_docs/acme_fy24_annual_report.pdf"
    doc.save(output_path)
    doc.close()
    print(f"Generated {output_path}")

def generate_clean_statement():
    os.makedirs("sample_docs", exist_ok=True)
    doc = fitz.open()
    rect = fitz.Rect(54, 54, 612 - 54, 792 - 54)

    # --- Page 1: Clean Executive Summary ---
    page1 = doc.new_page(width=612, height=792)
    p1_text = """APEX TECHNOLOGIES INC.
ANNUAL FINANCIAL DISCLOSURE - FISCAL YEAR 2024

Executive Summary:
Apex Technologies delivered consistent financial performance in fiscal year 2024. Total revenue grew by 15.0% year-over-year, reaching $230M compared to $200M in fiscal 2023.

Capital Structure:
The company closed the fiscal year with $45M in cash reserves and $10M in revolving credit facility debt, maintaining a conservative leverage ratio of 0.2x net debt to EBITDA.

All figures in this report are stated in millions of USD unless otherwise noted.
"""
    page1.insert_textbox(rect, p1_text, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    # --- Page 2: Segment Breakdown (100% Math Verification) ---
    page2 = doc.new_page(width=612, height=792)
    p2_text = """APEX TECHNOLOGIES INC.
REVENUE BY SEGMENT & PERCENTAGE DISTRIBUTION

Fiscal 2024 Segment Breakdown:
- Enterprise Software: $115M (50.0% of total revenue)
- Professional Services: $69M (30.0% of total revenue)
- Consumer Subscriptions: $46M (20.0% of total revenue)
Total Consolidated Revenue: $230M (100.0% of total revenue)

Arithmetic Verification:
50.0% + 30.0% + 20.0% = 100.0%
$115M + $69M + $46M = $230M
All segment allocations reconcile fully with consolidated statements.
"""
    page2.insert_textbox(rect, p2_text, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    # --- Page 3: Statement of Operations ---
    page3 = doc.new_page(width=612, height=792)
    p3_text = """APEX TECHNOLOGIES INC.
STATEMENT OF OPERATIONS
(in millions of USD)

Revenue:
Software Licenses: $115
Support & Maintenance: $69
Consulting Engagements: $46
Total Revenue: $230

Costs and Expenses:
Cost of Revenue: $70
Research & Development: $50
Sales & Marketing: $60
General & Administrative: $20
Total Costs and Expenses: $200

Operating Income: $30
Net Income: $24
"""
    page3.insert_textbox(rect, p3_text, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    output_path = "sample_docs/clean_financial_statement.pdf"
    doc.save(output_path)
    doc.close()
    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_acme_fy24()
    generate_clean_statement()
