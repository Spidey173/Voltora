import re
import uuid
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from backend.auditors.base import BaseAuditor
from backend.parsers.pdf_parser import ParsedDocument
from backend.models.schemas import AuditIssue, Severity, IssueCategory, SourceAnchor, BoundingBox

MONTH_MAP = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
    "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
    "aug": 8, "august": 8, "sep": 9, "september": 9, "oct": 10, "october": 10,
    "nov": 11, "november": 11, "dec": 12, "december": 12
}

class ExtractedEvent:
    def __init__(self, raw_date: str, year: int, month: int, text: str, page: int, bbox: Tuple[float, float, float, float], event_type: str):
        self.raw_date = raw_date
        self.year = year
        self.month = month
        self.timestamp = year * 100 + month
        self.text = text
        self.page = page
        self.bbox = bbox
        self.event_type = event_type

class TemporalAuditor(BaseAuditor):
    @property
    def name(self) -> str:
        return "Temporal & Chronological Sequence Auditor"

    def audit(self, parsed: ParsedDocument) -> List[AuditIssue]:
        issues: List[AuditIssue] = []
        events: List[ExtractedEvent] = []

        # Patterns for events like: "Phase 1 began in [Month Year]", "Completed on [Date]", "Launched in Q3 2024"
        date_pattern = re.compile(
            r'\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+([12][0-9]{3})\b',
            re.IGNORECASE
        )
        
        quarter_pattern = re.compile(r'\bQ([1-4])\s*([12][0-9]{3})\b', re.IGNORECASE)

        # 1. Look for explicit sequence contradictions (e.g. "Launched in October 2023" then "Kick-off meeting held in December 2023")
        for span in parsed.spans:
            text = span.text
            
            # Check month year
            for m in date_pattern.finditer(text):
                month_str = m.group(1).lower()
                year = int(m.group(2))
                month = MONTH_MAP.get(month_str, 1)
                
                # Context clues from local window around the date
                start_win = max(0, m.start() - 60)
                end_win = min(len(text), m.end() + 60)
                clause = text[start_win:end_win].lower()
                
                event_type = "neutral"
                if any(k in clause for k in ["started", "began", "initiated", "kick-off", "kickoff", "commenced", "commencement", "phase 1", "launch"]):
                    event_type = "start"
                elif any(k in clause for k in ["finished", "completed", "completion", "finalized", "concluded", "delivered", "achieved", "phase 2", "phase 3"]):
                    event_type = "end"

                events.append(ExtractedEvent(
                    raw_date=m.group(0),
                    year=year,
                    month=month,
                    text=text,
                    page=span.page,
                    bbox=span.bbox,
                    event_type=event_type
                ))

            # Check chronological inversion phrases inside the same sentence
            # e.g., "prior year comparisons reflect operations from fiscal 2024 compared to 2023"
            inversion_match = re.search(
                r'\b(?:prior|previous|preceding)\s+(?:year|period|quarter)[^.,;]*?\b([12][0-9]{3})\b.*?\b(?:compared\s+to|versus|vs\.?|against|relative\s+to|current\s+year\s+of)\s+([12][0-9]{3})\b',
                text,
                re.IGNORECASE
            )
            if inversion_match:
                y1 = int(inversion_match.group(1))
                y2 = int(inversion_match.group(2))
                if y1 >= y2:
                    issues.append(AuditIssue(
                        id=f"temp-invert-{span.page}-{uuid.uuid4().hex[:6]}",
                        title=f"Chronological Period Inversion: '{y1}' labeled as prior to '{y2}'",
                        description=f"Text incorrectly designates year {y1} as preceding or prior to year {y2}.",
                        category=IssueCategory.TEMPORAL,
                        severity=Severity.CRITICAL,
                        confidence=0.97,
                        primary_anchor=SourceAnchor(
                            page=span.page,
                            bbox=BoundingBox(x0=span.bbox[0], y0=span.bbox[1], x1=span.bbox[2], y1=span.bbox[3]),
                            text=span.text,
                            label="Chronological Claim"
                        ),
                        expected_value=f"Prior year: {y2-1 if y2 > y1 else y2}, Current year: {y2}",
                        actual_value=f"Prior: {y1}, Current: {y2}",
                        delta="Inverted timeline",
                        suggested_fix=f"Reverse the references: year {min(y1,y2)} should be the prior year and {max(y1,y2)} the subsequent year."
                    ))

        # Check start vs end sequence contradictions (both intra-page/sentence and cross-page)
        starts = [e for e in events if e.event_type == "start"]
        ends = [e for e in events if e.event_type == "end"]

        for start_ev in starts:
            for end_ev in ends:
                # If an end event happened BEFORE the start event
                if end_ev.timestamp < start_ev.timestamp:
                    st_words = set(re.findall(r'\b\w{4,}\b', start_ev.text.lower()))
                    end_words = set(re.findall(r'\b\w{4,}\b', end_ev.text.lower()))
                    shared = st_words & end_words - {"company", "system", "management"}
                    
                    if len(shared) >= 1 or abs(start_ev.page - end_ev.page) <= 2:
                        issues.append(AuditIssue(
                            id=f"temp-seq-{start_ev.page}-{end_ev.page}-{uuid.uuid4().hex[:6]}",
                            title=f"Temporal Anomaly: Project Completion Precedes Inception Date",
                            description=f"Completion is reported in {end_ev.raw_date}, yet project kickoff/initiation is stated as occurring later in {start_ev.raw_date}.",
                            category=IssueCategory.TEMPORAL,
                            severity=Severity.CRITICAL,
                            confidence=0.95,
                            primary_anchor=SourceAnchor(
                                page=start_ev.page,
                                bbox=BoundingBox(x0=start_ev.bbox[0], y0=start_ev.bbox[1], x1=start_ev.bbox[2], y1=start_ev.bbox[3]),
                                text=start_ev.text,
                                label=f"Kickoff Anchor ({start_ev.raw_date})"
                            ),
                            secondary_anchor=SourceAnchor(
                                page=end_ev.page,
                                bbox=BoundingBox(x0=end_ev.bbox[0], y0=end_ev.bbox[1], x1=end_ev.bbox[2], y1=end_ev.bbox[3]),
                                text=end_ev.text,
                                label=f"Completion Anchor ({end_ev.raw_date})"
                            ),
                            expected_value=f"Initiation date must precede {end_ev.raw_date}",
                            actual_value=f"Kickoff: {start_ev.raw_date} vs Completion: {end_ev.raw_date}",
                            delta=f"{start_ev.raw_date} > {end_ev.raw_date}",
                            suggested_fix="Align chronological dates so kickoff precedes completion."
                        ))
                        break

        return issues
