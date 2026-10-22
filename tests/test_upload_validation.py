"""
Tests for upload validation, security boundaries, and error handling in Voltora.
"""
import io
import unittest
from fastapi.testclient import TestClient
import pymupdf as fitz
from backend.main import app


class TestUploadValidation(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_reject_non_pdf_extension(self):
        """Reject non-pdf file extensions."""
        files = {"file": ("report.txt", b"plain text content", "text/plain")}
        res = self.client.post("/api/upload", files=files)
        self.assertEqual(res.status_code, 400)
        self.assertIn("PDF documents", res.json()["detail"])

    def test_reject_empty_file(self):
        """Reject 0-byte uploaded file."""
        files = {"file": ("empty.pdf", b"", "application/pdf")}
        res = self.client.post("/api/upload", files=files)
        self.assertEqual(res.status_code, 400)
        self.assertIn("empty", res.json()["detail"].lower())

    def test_reject_invalid_magic_bytes(self):
        """Reject file disguised as PDF but lacking %PDF- magic bytes."""
        files = {"file": ("fake.pdf", b"NOT_A_REAL_PDF_HEADER", "application/pdf")}
        res = self.client.post("/api/upload", files=files)
        self.assertEqual(res.status_code, 400)
        self.assertIn("file header is invalid", res.json()["detail"].lower())

    def test_reject_oversized_file(self):
        """Reject file exceeding 25MB with 413 Payload Too Large."""
        oversized_data = b"%PDF-1.4\n" + b"0" * (26 * 1024 * 1024)
        files = {"file": ("giant.pdf", oversized_data, "application/pdf")}
        res = self.client.post("/api/upload", files=files)
        self.assertEqual(res.status_code, 413)
        self.assertIn("exceeds maximum permitted limit", res.json()["detail"].lower())

    def test_sample_path_traversal_blocked(self):
        """Reject directory traversal in sample document endpoints."""
        res = self.client.get("/api/samples/../../etc/passwd")
        # FastAPI will either 404 or our regex check will return 400
        self.assertIn(res.status_code, [400, 404])

    def test_valid_pdf_audit_success(self):
        """Valid PDF successfully processes and returns audit report."""
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), "Apex Technologies Clean Operations Report. In FY24, operations ran smoothly.")
        pdf_bytes = doc.tobytes()
        doc.close()

        files = {"file": ("clean_report.pdf", pdf_bytes, "application/pdf")}
        res = self.client.post("/api/upload", files=files)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("summary", data)
        self.assertIn("doc_id", data)
        self.assertEqual(data["summary"]["pages_analyzed"], 1)


    def test_reject_excessive_page_count(self):
        """Reject PDF exceeding the 100-page limit with 400 Bad Request."""
        doc = fitz.open()
        for i in range(101):
            p = doc.new_page()
            p.insert_text((50, 50), f"Page {i + 1}")
        pdf_bytes = doc.tobytes()
        doc.close()

        files = {"file": ("long_document.pdf", pdf_bytes, "application/pdf")}
        res = self.client.post("/api/upload", files=files)
        self.assertEqual(res.status_code, 400)
        self.assertIn("exceeds the supported limit of 100 pages", res.json()["detail"])

    def test_sanitized_internal_error_does_not_leak_stack(self):
        """Ensure unhandled internal errors return sanitized messages, not raw exception traces."""
        # Force an internal error in sample loading by monkeypatching
        from unittest.mock import patch
        from backend.services.doc_service import doc_store

        with patch.object(doc_store, "add_document", side_effect=RuntimeError("internal_db_syntax_leak_error")):
            res = self.client.get("/api/sample/acme_fy24_annual_report")
            self.assertEqual(res.status_code, 500)
            self.assertEqual(res.json()["detail"], "Failed to load and process the sample document.")
            self.assertNotIn("internal_db_syntax_leak_error", res.json()["detail"])


if __name__ == "__main__":
    unittest.main()
