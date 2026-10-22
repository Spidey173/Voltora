from typing import List, Dict, Any

# Ground truth annotations for evaluation test corpus
GROUND_TRUTH_DATASET = [
    {
        "doc_id": "acme_fy24",
        "file_path": "sample_docs/acme_fy24_annual_report.pdf",
        "is_clean": False,
        "expected_issues": [
            {
                "id": "acme_math_tbl_fy24",
                "category": "math_discrepancy",
                "page": 3,
                "description": "Table summation mismatch in FY2024 column (stated 165 vs sum 145)",
                "evidence_keywords": ["165", "145", "product sales", "revenue"],
                "required_any": ["165", "145", "product sales"],
                "min_matches": 2
            },
            {
                "id": "acme_math_pct_dist",
                "category": "math_discrepancy",
                "page": 2,
                "description": "Percentage distribution sum (40+30+20=90% != 100%)",
                "evidence_keywords": ["40", "30", "20", "90", "distribution", "allocation"],
                "required_any": ["40", "30", "20", "90"],
                "min_matches": 2
            },
            {
                "id": "acme_sem_revenue_growth",
                "category": "semantic_contradiction",
                "page": 1,
                "secondary_page": 3,
                "description": "Revenue growth mismatch (12% vs 14%)",
                "evidence_keywords": ["12", "14", "revenue", "growth"],
                "required_any": ["12", "14"],
                "min_matches": 2
            },
            {
                "id": "acme_sem_debt_status",
                "category": "semantic_contradiction",
                "page": 1,
                "secondary_page": 3,
                "description": "Zero debt vs $120M debt notes issued",
                "evidence_keywords": ["debt", "credit"],
                "required_any": ["debt", "credit"],
                "min_matches": 2
            },
            {
                "id": "acme_sem_foreign_subsidiaries",
                "category": "semantic_contradiction",
                "page": 1,
                "secondary_page": 2,
                "description": "No international operations vs subsidiaries in Europe and Asia",
                "evidence_keywords": ["subsidiari", "international", "foreign", "domestic"],
                "required_any": ["subsidiari", "international", "foreign"],
                "min_matches": 2
            },
            {
                "id": "acme_temp_period_inversion",
                "category": "temporal_inversion",
                "page": 1,
                "description": "Prior year 2024 compared to 2023 inversion",
                "evidence_keywords": ["2024", "2023", "prior"],
                "required_any": ["2024", "2023"],
                "min_matches": 2
            },
            {
                "id": "acme_temp_project_genesis",
                "category": "temporal_inversion",
                "page": 2,
                "secondary_page": 2,
                "description": "Project Genesis completion (March 2023) precedes kickoff date (November 2023)",
                "evidence_keywords": ["genesis"],
                "required_any": ["genesis"],
                "min_matches": 1
            },
            {
                "id": "acme_unit_opex_scale",
                "category": "unit_mismatch",
                "page": 2,
                "secondary_page": 4,
                "description": "Operating expenses $42.5B (Page 2) vs $42.5M (Page 4) scale mismatch",
                "evidence_keywords": ["42.5", "expense", "expenditure", "scale"],
                "required_any": ["42.5"],
                "min_matches": 2
            }
        ]
    },
    {
        "doc_id": "apex_clean",
        "file_path": "sample_docs/clean_financial_statement.pdf",
        "is_clean": True,
        "expected_issues": []  # Clean baseline control document: 0 issues expected
    },
    {
        "doc_id": "vertex_energy",
        "file_path": "sample_docs/vertex_energy_audit.pdf",
        "is_clean": False,
        "expected_issues": [
            {
                "id": "vertex_math_margin_growth",
                "category": "math_discrepancy",
                "page": 1,
                "description": "Stated 25% growth from 80 to 120 (actual is 50%)",
                "evidence_keywords": ["25", "80", "120", "growth", "margin"],
                "required_any": ["25", "80", "120"],
                "min_matches": 2
            },
            {
                "id": "vertex_temp_project_titan",
                "category": "temporal_inversion",
                "page": 1,
                "secondary_page": 1,
                "description": "Project Titan completion (Feb 2024) precedes kickoff (Aug 2024)",
                "evidence_keywords": ["titan"],
                "required_any": ["titan"],
                "min_matches": 1
            }
        ]
    },
    {
        "doc_id": "nova_clean",
        "file_path": "sample_docs/nova_clean_quarterly.pdf",
        "is_clean": True,
        "expected_issues": []  # Clean baseline control document: 0 issues expected
    },
    {
        "doc_id": "solaris_edge_cases",
        "file_path": "sample_docs/solaris_edge_cases.pdf",
        "is_clean": False,
        "expected_issues": [
            {
                "id": "solaris_math_growth_rate",
                "category": "math_discrepancy",
                "page": 1,
                "description": "Stated 40% growth from 100 to 120 (actual is 20%)",
                "evidence_keywords": ["40", "100", "120", "growth", "revenue"],
                "required_any": ["40", "100", "120"],
                "min_matches": 2
            },
            {
                "id": "solaris_temp_project_helios",
                "category": "temporal_inversion",
                "page": 2,
                "secondary_page": 2,
                "description": "Project Helios commissioning (January 2024) precedes kickoff (August 2024)",
                "evidence_keywords": ["helios"],
                "required_any": ["helios"],
                "min_matches": 1
            }
        ]
    }
]
