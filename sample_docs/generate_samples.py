import os
import pymupdf as fitz

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

def generate_vertex_audit():
    """Generates an additional test document with 2 injected errors (1 math growth, 1 temporal milestone)
    and clean controls for debt and tables to expand the evaluation corpus."""
    os.makedirs("sample_docs", exist_ok=True)
    doc = fitz.open()
    rect = fitz.Rect(54, 54, 612 - 54, 792 - 54)

    # --- Page 1: Vertex Energy Overview ---
    page1 = doc.new_page(width=612, height=792)
    p1_text = """VERTEX ENERGY CORP
OPERATIONAL AUDIT & FINANCIAL UPDATE - FY2024

1. Performance Highlights
During fiscal 2024, Vertex Energy expanded power distribution operations. Operating margin increased by 25% from 80 to 120 in our primary grid segment, reflecting efficiency improvements.

2. Infrastructure Milestones
Under our modern grid plan, Project Titan completion was achieved in February 2024, while Project Titan kickoff was initiated in August 2024 across regional facilities.

3. Capital Position
Vertex Energy holds $35M in term debt and $15M in cash, in compliance with all banking covenants throughout fiscal 2024.
"""
    page1.insert_textbox(rect, p1_text, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    # --- Page 2: Financial Breakdown (Clean Cross-Footing) ---
    page2 = doc.new_page(width=612, height=792)
    p2_text = """VERTEX ENERGY CORP
COST SCHEDULE & OPERATIONAL OUTLAYS
(in millions of USD)

Operating Costs Breakdown:
Fuel and Energy Transmission: $50
Plant Labor and Engineering: $30
Maintenance and Operations: $20
Total Operating Costs: $100

Notes:
All reported cost lines reconcile mathematically with the total operating expenditure.
"""
    page2.insert_textbox(rect, p2_text, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    output_path = "sample_docs/vertex_energy_audit.pdf"
    doc.save(output_path)
    doc.close()
    print(f"Generated {output_path}")

def generate_nova_clean():
    """Generates an additional clean document control to test false-positive performance."""
    os.makedirs("sample_docs", exist_ok=True)
    doc = fitz.open()
    rect = fitz.Rect(54, 54, 612 - 54, 792 - 54)

    page1 = doc.new_page(width=612, height=792)
    p1_text = """NOVA HEALTH SYSTEMS
QUARTERLY FINANCIAL DISCLOSURE - Q4 2024

Executive Commentary:
Nova Health Systems maintained steady clinical and operational momentum throughout the quarter.
Operating revenue increased by 20% from 50 to 60 during the period ended December 31, 2024.

Departmental Revenue Breakdown:
- Inpatient Services: 60% of total revenue
- Outpatient Clinics: 40% of total revenue
Total Allocation: 100% of revenue accounted for.

Capital Structure:
The organization maintained $25M in operational liquidity and zero debt obligations as of December 31, 2024.
"""
    page1.insert_textbox(rect, p1_text, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    output_path = "sample_docs/nova_clean_quarterly.pdf"
    doc.save(output_path)
    doc.close()
    print(f"Generated {output_path}")

def generate_edge_cases():
    """Generates a test document covering negative margins, rounding disclosures, and multi-column tables."""
    os.makedirs("sample_docs", exist_ok=True)
    doc = fitz.open()
    rect = fitz.Rect(54, 54, 612 - 54, 792 - 54)

    # Page 1: Negative operating values & Table cross-footing
    page1 = doc.new_page(width=612, height=792)
    p1_text = """SOLARIS DYNAMICS INC
FINANCIAL SUMMARY & VARIANCE DISCLOSURES - FY2024

1. Operational Outlays & Negative Operating Income
During fiscal year 2024, Solaris Dynamics navigated severe supply chain inflation.
Operating revenue reached $150M against operating expenses of $180M, yielding an operating deficit of -$30M.

Table 1: Regional Operational Income (in millions)
- Americas Region: $40
- EMEA Region: -$25
- APAC Region: $15
Total Regional Operational Income: $30

Note: The stated total of $30M reconciles with 40 + (-25) + 15 = 30.

2. Injected Rate Discrepancy
Stated operating revenue expanded by 40% from 100 to 120 during the annual period.
"""
    page1.insert_textbox(rect, p1_text, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    # Page 2: Ambiguous claim & milestone chronology
    page2 = doc.new_page(width=612, height=792)
    p2_text = """SOLARIS DYNAMICS INC
PROJECT CHRONOLOGY & FOOTNOTES

3. R&D Initiative Timeline
Under corporate restructuring, Project Helios commissioning was finalized in January 2024, while Project Helios charter kickoff began in August 2024.

4. Supplementary Footnote Disclosures
Cash and cash equivalents totaled $85M at year-end.
Management anticipates moderate seasonal revenue fluctuations in future quarters.
"""
    page2.insert_textbox(rect, p2_text, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))

    output_path = "sample_docs/solaris_edge_cases.pdf"
    doc.save(output_path)
    doc.close()
    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_acme_fy24()
    generate_clean_statement()
    generate_vertex_audit()
    generate_nova_clean()
    generate_edge_cases()
