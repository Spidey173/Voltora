import io
import logging
from typing import Dict, Optional, Tuple
import pymupdf as fitz
from backend.parsers.pdf_parser import PDFParser, ParsedDocument
from backend.models.schemas import AuditReport
from backend.auditors.orchestrator import AuditOrchestrator

logger = logging.getLogger("voltora.storage")

class DocumentStore:
    """In-memory session document store.
    
    SECURITY & ARCHITECTURE NOTE:
    This document store operates as an in-memory session cache designed for single-user
    local execution. Documents are keyed by unique document identifiers. In multi-user
    or multi-tenant deployments, an authenticated database and object storage layer with
    role-based access control (RBAC) and tenant isolation must be integrated to prevent
    unauthorized cross-tenant data access.
    """
    def __init__(self):
        # Maps doc_id -> (ParsedDocument, fitz.Document, AuditReport)
        self._docs: Dict[str, Tuple[ParsedDocument, fitz.Document, AuditReport]] = {}
        self._orchestrator = AuditOrchestrator()

    def add_document(self, file_bytes: bytes, doc_id: str, title: str) -> AuditReport:
        parsed, fitz_doc = PDFParser.parse_pdf(file_bytes, doc_id=doc_id, title=title)
        if parsed.total_pages == 0:
            raise ValueError("The uploaded PDF file contains 0 pages.")
        if parsed.total_pages > 100:
            raise ValueError(f"The PDF contains {parsed.total_pages} pages, which exceeds the supported limit of 100 pages.")
        
        report = self._orchestrator.audit_document(parsed)
        self._docs[doc_id] = (parsed, fitz_doc, report)
        logger.info("Successfully audited document %s ('%s', %d pages, %d issues)", doc_id, title, parsed.total_pages, len(report.issues))
        return report

    def get_report(self, doc_id: str) -> Optional[AuditReport]:
        if doc_id in self._docs:
            return self._docs[doc_id][2]
        return None

    def get_page_image(self, doc_id: str, page_num: int, dpi: int = 150) -> Optional[bytes]:
        if doc_id in self._docs:
            _, fitz_doc, _ = self._docs[doc_id]
            if 1 <= page_num <= len(fitz_doc):
                return PDFParser.render_page_to_png(fitz_doc, page_num, dpi=dpi)
        return None

    def get_parsed_doc(self, doc_id: str) -> Optional[ParsedDocument]:
        if doc_id in self._docs:
            return self._docs[doc_id][0]
        return None

    def get_issue(self, doc_id: str, issue_id: str):
        report = self.get_report(doc_id)
        if report:
            for issue in report.issues:
                if issue.id == issue_id:
                    return issue
        return None

# Singleton document store
doc_store = DocumentStore()
