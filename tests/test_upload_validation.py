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


if __name__ == "__main__":
    unittest.main()
