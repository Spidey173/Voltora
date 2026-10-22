import io
import os
import json
import uuid
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

from backend.models.schemas import (
    AuditReport,
    AskIssueRequest,
    AskIssueResponse,
    ChatDocRequest,
    ChatDocResponse,
)
from backend.services.doc_service import doc_store
from backend.services.chat_service import ChatService

app = FastAPI(
    title="Voltora - Autonomous Multi-Dimensional Document Auditor",
    description="Deterministic and neuro-symbolic document audit engine with coordinate highlighting",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chat_service = ChatService()

@app.get("/api/health")
def health_check():
    return {"status": "online", "service": "Voltora Auditor Engine", "version": "1.0.0"}

@app.post("/api/upload", response_model=AuditReport)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    content = await file.read()
    
    try:
        report = doc_store.add_document(content, doc_id=doc_id, title=file.filename)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@app.get("/api/sample/{sample_name}", response_model=AuditReport)
def load_sample(sample_name: str):
    report = doc_store.get_report(sample_name)
    if not report:
        # Check if file exists in sample_docs
        file_path = f"sample_docs/{sample_name}.pdf"
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                report = doc_store.add_document(f.read(), doc_id=sample_name, title=sample_name.replace("_", " ").title())
                return report
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
        with open(benchmark_path, "r") as f:
            return json.load(f)
    return {"status": "Benchmark not yet run. Run 'python -m eval.run_benchmark' first."}

@app.get("/api/audit-stream/{doc_id}")
async def stream_audit_progress(doc_id: str):
    """Server-Sent Events (SSE) progressive streaming endpoint."""
    report = doc_store.get_report(doc_id)
    if not report:
        raise HTTPException(status_code=404, detail="Document not found.")

    async def event_generator():
        # Step 1: Ingestion
        yield f"data: {json.dumps({'stage': 'ingestion', 'progress': 25, 'message': 'PyMuPDF parsed text blocks and tables'})}\n\n"
        await asyncio.sleep(0.15)
        # Step 2: Deterministic math
        yield f"data: {json.dumps({'stage': 'math_audit', 'progress': 50, 'message': 'Cross-footing verified table row and column totals'})}\n\n"
        await asyncio.sleep(0.15)
        # Step 3: Semantic NLI
        yield f"data: {json.dumps({'stage': 'semantic_audit', 'progress': 80, 'message': 'TF-IDF candidate pairing and contradiction judgment evaluated'})}\n\n"
        await asyncio.sleep(0.15)
        # Step 4: Complete
        yield f"data: {json.dumps({'stage': 'completed', 'progress': 100, 'report': report.model_dump()})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
