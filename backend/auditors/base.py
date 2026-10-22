from abc import ABC, abstractmethod
from typing import List
from backend.parsers.pdf_parser import ParsedDocument
from backend.models.schemas import AuditIssue

class BaseAuditor(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def audit(self, parsed: ParsedDocument) -> List[AuditIssue]:
        pass
