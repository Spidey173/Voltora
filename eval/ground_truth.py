from typing import List, Dict, Any

# Ground truth annotations for test corpus
GROUND_TRUTH_DATASET = [
    {
        "doc_id": "acme_fy24",
        "file_path": "sample_docs/acme_fy24_annual_report.pdf",
        "expected_issues": [
            {
                "category": "math_discrepancy",
                "page": 3,
                "description": "Table summation mismatch in FY2024 column (stated 165 vs sum 145)"
            },
            {
                "category": "math_discrepancy",
                "page": 2,
                "description": "Percentage distribution sum (40+30+20=90% != 100%)"
            },
            {
                "category": "semantic_contradiction",
                "page": 1,
                "secondary_page": 3,
                "description": "Revenue growth mismatch (12% vs 14%)"
            },
            {
                "category": "semantic_contradiction",
                "page": 1,
                "secondary_page": 3,
                "description": "Zero debt vs $120M debt notes issued"
            },
            {
                "category": "semantic_contradiction",
                "page": 1,
                "secondary_page": 2,
                "description": "No international operations vs subsidiaries in Europe and Asia"
            },
            {
                "category": "temporal_inversion",
                "page": 1,
                "description": "Prior year 2024 compared to 2023 inversion"
            },
            {
                "category": "temporal_inversion",
                "page": 2,
                "secondary_page": 4,
                "description": "Project Genesis completion precedes kickoff date"
            },
            {
                "category": "unit_mismatch",
                "page": 2,
                "secondary_page": 3,
                "description": "Operating expenses $42.5M vs $42.5B scale mismatch"
            }
        ]
    },
    {
        "doc_id": "apex_clean",
        "file_path": "sample_docs/clean_financial_statement.pdf",
        "expected_issues": []  # Clean document: 0 issues expected
    }
]
