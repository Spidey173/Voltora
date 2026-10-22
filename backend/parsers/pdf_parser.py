import fitz  # PyMuPDF
import re
from typing import List, Dict, Any, Tuple, Optional
import io

class ExtractedSpan:
    def __init__(self, text: str, page: int, bbox: Tuple[float, float, float, float], raw_bbox: Tuple[float, float, float, float]):
        self.text = text.strip()
        self.page = page
        self.bbox = bbox          # (x0, y0, x1, y1) normalized 0.0 to 1.0
        self.raw_bbox = raw_bbox  # points in PDF space

class ExtractedTable:
    def __init__(self, page: int, bbox: Tuple[float, float, float, float], headers: List[str], rows: List[List[str]], raw_cells: List[Dict[str, Any]]):
        self.page = page
        self.bbox = bbox  # normalized
        self.headers = headers
        self.rows = rows
        self.raw_cells = raw_cells

class ParsedDocument:
    def __init__(self, doc_id: str, title: str, total_pages: int):
        self.doc_id = doc_id
        self.title = title
        self.total_pages = total_pages
        self.pages_text: Dict[int, str] = {}
        self.spans: List[ExtractedSpan] = []
        self.tables: List[ExtractedTable] = []
        self.page_dimensions: Dict[int, Tuple[float, float]] = {}

class PDFParser:
    @staticmethod
    def parse_pdf(file_bytes: bytes, doc_id: str = "doc_01", title: str = "Uploaded Document") -> Tuple[ParsedDocument, fitz.Document]:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        parsed = ParsedDocument(doc_id=doc_id, title=title, total_pages=len(doc))

        for page_idx in range(len(doc)):
            page_num = page_idx + 1
            page = doc[page_idx]
            pw = page.rect.width
            ph = page.rect.height
            parsed.page_dimensions[page_num] = (pw, ph)

            # 1. Full text extraction
            parsed.pages_text[page_num] = page.get_text()

            # 2. Extract detailed text spans (lines + blocks/sentences) with normalized bboxes
            page_dict = page.get_text("dict")
            for block in page_dict.get("blocks", []):
                if block.get("type") == 0:  # text block
                    block_lines_text = []
                    bx0, by0, bx1, by1 = block.get("bbox", (0, 0, 0, 0))
                    
                    for line in block.get("lines", []):
                        line_text = ""
                        line_bbox = line.get("bbox", (0, 0, 0, 0))
                        for span in line.get("spans", []):
                            line_text += span.get("text", "") + " "
                        
                        clean_line = line_text.strip()
                        if clean_line:
                            block_lines_text.append(clean_line)
                            # Add individual line span
                            rx0, ry0, rx1, ry1 = line_bbox
                            nx0 = max(0.0, min(1.0, rx0 / pw))
                            ny0 = max(0.0, min(1.0, ry0 / ph))
                            nx1 = max(0.0, min(1.0, rx1 / pw))
                            ny1 = max(0.0, min(1.0, ry1 / ph))
                            
                            parsed.spans.append(ExtractedSpan(
                                text=clean_line,
                                page=page_num,
                                bbox=(nx0, ny0, nx1, ny1),
                                raw_bbox=line_bbox
                            ))
                    
                    # Also add complete cohesive block and sentence spans
                    if block_lines_text:
                        full_block_text = " ".join(block_lines_text)
                        norm_block_bbox = (
                            max(0.0, min(1.0, bx0 / pw)),
                            max(0.0, min(1.0, by0 / ph)),
                            max(0.0, min(1.0, bx1 / pw)),
                            max(0.0, min(1.0, by1 / ph))
                        )
                        # Add full block
                        if len(block_lines_text) > 1:
                            parsed.spans.append(ExtractedSpan(
                                text=full_block_text,
                                page=page_num,
                                bbox=norm_block_bbox,
                                raw_bbox=(bx0, by0, bx1, by1)
                            ))
                        
                        # Add individual sentence spans within the block
                        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9])', full_block_text)
                        for sent in sentences:
                            clean_sent = sent.strip()
                            if len(clean_sent) > 15 and clean_sent not in block_lines_text and clean_sent != full_block_text:
                                parsed.spans.append(ExtractedSpan(
                                    text=clean_sent,
                                    page=page_num,
                                    bbox=norm_block_bbox,
                                    raw_bbox=(bx0, by0, bx1, by1)
                                ))

            # 3. Detect tables using PyMuPDF find_tables()
            detected_table_bboxes = []
            try:
                table_finder = page.find_tables()
                if table_finder and table_finder.tables:
                    for tbl in table_finder.tables:
                        extracted = tbl.extract()
                        if not extracted or len(extracted) < 2:
                            continue
                        
                        headers = [str(c or "").strip() for c in extracted[0]]
                        rows = [[str(c or "").strip() for c in r] for r in extracted[1:]]
                        
                        tx0, ty0, tx1, ty1 = tbl.bbox
                        norm_tbl_bbox = (
                            max(0.0, min(1.0, tx0 / pw)),
                            max(0.0, min(1.0, ty0 / ph)),
                            max(0.0, min(1.0, tx1 / pw)),
                            max(0.0, min(1.0, ty1 / ph))
                        )
                        detected_table_bboxes.append(norm_tbl_bbox)

                        parsed.tables.append(ExtractedTable(
                            page=page_num,
                            bbox=norm_tbl_bbox,
                            headers=headers,
                            rows=rows,
                            raw_cells=[]
                        ))
            except Exception:
                pass

            # 4. Fallback: Detect text-based tabular schedules / financial breakdowns
            for block in page_dict.get("blocks", []):
                if block.get("type") == 0:
                    bx0, by0, bx1, by1 = block.get("bbox", (0, 0, 0, 0))
                    norm_bbox = (
                        max(0.0, min(1.0, bx0 / pw)),
                        max(0.0, min(1.0, by0 / ph)),
                        max(0.0, min(1.0, bx1 / pw)),
                        max(0.0, min(1.0, by1 / ph))
                    )
                    
                    # Avoid overlapping with already detected tables
                    if any(abs(norm_bbox[1] - tb[1]) < 0.05 for tb in detected_table_bboxes):
                        continue

                    block_lines = [
                        "".join(s.get("text", "") for s in l.get("spans", [])).strip() 
                        for l in block.get("lines", [])
                    ]
                    block_lines = [l for l in block_lines if l]
                    
                    table_items = []
                    for line in block_lines:
                        m = re.match(r"^(.+?)[:\t\-—]+\s*([$€£¥]?\s*[-+]?[0-9]+(?:\.[0-9]+)?\s*[mkbMK%]?)$", line)
                        if m:
                            table_items.append([m.group(1).strip(), m.group(2).strip()])
                    
                    if len(table_items) >= 3 and any("total" in item[0].lower() for item in table_items):
                        parsed.tables.append(ExtractedTable(
                            page=page_num,
                            bbox=norm_bbox,
                            headers=["Line Item", "Stated Amount"],
                            rows=table_items,
                            raw_cells=[]
                        ))
                        detected_table_bboxes.append(norm_bbox)

        return parsed, doc

    @staticmethod
    def find_best_span_for_text(parsed: ParsedDocument, target_text: str, page: Optional[int] = None) -> Optional[ExtractedSpan]:
        """Finds the span that best contains or matches target_text."""
        target_clean = target_text.lower().strip()
        candidates = [s for s in parsed.spans if (page is None or s.page == page)]
        
        # 1. Exact or substring match
        for span in candidates:
            if target_clean in span.text.lower() or span.text.lower() in target_clean:
                return span
        
        # 2. Token overlap match
        target_tokens = set(re.findall(r'\b\w+\b', target_clean))
        if not target_tokens:
            return candidates[0] if candidates else None

        best_score = 0.0
        best_span = None
        for span in candidates:
            span_tokens = set(re.findall(r'\b\w+\b', span.text.lower()))
            overlap = len(target_tokens & span_tokens) / max(1, len(target_tokens))
            if overlap > best_score:
                best_score = overlap
                best_span = span

        if best_score > 0.4:
            return best_span
        return candidates[0] if candidates else None

    @staticmethod
    def render_page_to_png(doc: fitz.Document, page_num: int, dpi: int = 144) -> bytes:
        """Renders a PDF page to high-quality PNG bytes."""
        page = doc[page_num - 1]
        pix = page.get_pixmap(dpi=dpi)
        return pix.tobytes("png")
