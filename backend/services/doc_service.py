import io
from typing import Dict, Optional, Tuple
import fitz
from backend.parsers.pdf_parser import PDFParser, ParsedDocument
from backend.models.schemas import AuditReport
from backend.auditors.orchestrator import AuditOrchestrator

class DocumentStore:
    def __init__(self):
        # Maps doc_id -> (ParsedDocument, fitz.Document, AuditReport)
        self._docs: Dict[str, Tuple[ParsedDocument, fitz.Document, AuditReport]] = {}
        self._orchestrator = AuditOrchestrator()

    def add_document(self, file_bytes: bytes, doc_id: str, title: str) -> AuditReport:
        parsed, fitz_doc = PDFParser.parse_pdf(file_bytes, doc_id=doc_id, title=title)
        report = self._orchestrator.audit_document(parsed)
        self._docs[doc_id] = (parsed, fitz_doc, report)
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
