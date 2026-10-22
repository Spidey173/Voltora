import io
import os
import re
import json
import uuid
import asyncio
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import pymupdf as fitz

from backend.models.schemas import (
    AuditReport,
    AskIssueRequest,
    AskIssueResponse,
    ChatDocRequest,
    ChatDocResponse,
)
from backend.services.doc_service import doc_store
from backend.services.chat_service import ChatService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("voltora.api")

app = FastAPI(
    title="Voltora - Automated Multi-Dimensional Document Auditor",
    description="Deterministic and heuristic document review engine with coordinate highlighting",
    version="1.0.0"
)

# Restrict CORS to allowed frontend origins read from FRONTEND_ORIGINS (or fallback to safe local development origins).
# Wildcard origins are strictly rejected at startup to prevent accidental misconfiguration.
DEFAULT_FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

def get_allowed_origins(env_origins_str: str | None = None) -> list[str]:
    raw = env_origins_str if env_origins_str is not None else os.getenv("FRONTEND_ORIGINS", "")
    if not raw.strip():
        return list(DEFAULT_FRONTEND_ORIGINS)
    
    origins = [orig.strip() for orig in raw.split(",") if orig.strip()]
    for orig in origins:
        if orig == "*":
            raise ValueError(
                "Invalid FRONTEND_ORIGINS: Wildcard '*' is strictly prohibited for security in Voltora. "
                "Specify explicit origin URLs (e.g., 'http://localhost:5173')."
            )
    return origins

allowed_origins = get_allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,  # Local API does not require session cookies or browser credentials
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

chat_service = ChatService()
MAX_UPLOAD_SIZE = 25 * 1024 * 1024  # 25 MB

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Voltora Auditor Engine",
        "version": "1.0.0",
        "storage_mode": "in_memory_local_session"
    }

@app.post("/api/upload", response_model=AuditReport)
async def upload_document(file: UploadFile = File(...)):
    # 1. Filename validation
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents (.pdf) are supported."
        )

    # 2. Chunk-based streaming read with early size cutoff (avoids buffering arbitrarily huge files)
    chunks = []
    total_bytes = 0
    chunk_size = 64 * 1024  # 64 KB

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum permitted limit of {MAX_UPLOAD_SIZE // (1024 * 1024)}MB."
            )
        chunks.append(chunk)

    if total_bytes == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )

    content = b"".join(chunks)

    # 3. PDF Header / Magic Bytes Validation
    if b"%PDF-" not in content[:1024]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The file header is invalid. The uploaded file does not appear to be a standard PDF document."
        )

    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    clean_title = os.path.basename(file.filename)

    # 4. Parsing & Auditing with Granular Error Recovery
    try:
        report = doc_store.add_document(content, doc_id=doc_id, title=clean_title)
        return report
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except (fitz.FileDataError, fitz.EmptyFileError) as pfe:
        logger.warning("Corrupt PDF upload rejected for %s: %s", clean_title, pfe)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded PDF file is malformed, corrupted, or password-protected and could not be read."
        )
    except Exception as e:
        logger.error("Unexpected error processing document %s: %s", clean_title, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while parsing and evaluating the document."
        )

@app.get("/api/sample/{sample_name}", response_model=AuditReport)
def load_sample(sample_name: str):
    # Sanitize sample name against path traversal
    if not re.match(r'^[a-zA-Z0-9_\-]+$', sample_name):
        raise HTTPException(status_code=400, detail="Invalid sample name parameter.")

    report = doc_store.get_report(sample_name)
    if not report:
        file_path = f"sample_docs/{sample_name}.pdf"
        if os.path.exists(file_path):
            try:
                with open(file_path, "rb") as f:
                    content = f.read()
                report = doc_store.add_document(content, doc_id=sample_name, title=sample_name.replace("_", " ").title())
                return report
            except Exception as e:
                logger.error("Failed to load sample document %s: %s", sample_name, e, exc_info=True)
                raise HTTPException(status_code=500, detail="Failed to load and process the sample document.")
        raise HTTPException(status_code=404, detail=f"Sample document '{sample_name}' not found.")
    return report

@app.get("/api/docs/{doc_id}/report", response_model=AuditReport)
def get_audit_report(doc_id: str):
    report = doc_store.get_report(doc_id)
    if not report:
        raise HTTPException(status_code=404, detail="Document not found.")
    return report

@app.get("/api/docs/{doc_id}/pages/{page_num}")
def get_page_image(doc_id: str, page_num: int, dpi: int = Query(150, ge=72, le=300)):
    png_bytes = doc_store.get_page_image(doc_id, page_num=page_num, dpi=dpi)
    if not png_bytes:
        raise HTTPException(status_code=404, detail=f"Page {page_num} not found for document {doc_id}.")
    return StreamingResponse(io.BytesIO(png_bytes), media_type="image/png")

@app.post("/api/docs/{doc_id}/ask", response_model=AskIssueResponse)
def ask_about_issue(doc_id: str, req: AskIssueRequest):
    issue = doc_store.get_issue(doc_id, req.issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")
    return chat_service.answer_issue_query(issue, req.question)

@app.post("/api/docs/{doc_id}/chat", response_model=ChatDocResponse)
def chat_document(doc_id: str, req: ChatDocRequest):
    report = doc_store.get_report(doc_id)
    if not report:
        raise HTTPException(status_code=404, detail="Document not found.")
    return chat_service.answer_document_query(report, req.query)

@app.get("/api/benchmark")
def get_benchmark_results():
    benchmark_path = "eval/benchmark_results.json"
    if os.path.exists(benchmark_path):
        try:
            with open(benchmark_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error("Failed to read benchmark_results.json: %s", e)
            return {"status": "Error loading benchmark results."}
    return {"status": "Benchmark not yet run. Run 'python -m eval.run_benchmark' first."}

if __name__ == "__main__":
    import uvicorn
    # Default local binding to 127.0.0.1 for secure local execution
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
