from pydantic import BaseModel
from typing import List

# --- Incoming Requests (Android to Server) ---
class ExtractedData(BaseModel):
    document_type: str
    vendor_name: str
    invoice_date: str
    line_items_total: float
    tax_amount: float
    gross_total: float

class AuditRequest(BaseModel):
    device_id: str
    auth_token: str
    extracted_data: ExtractedData
    request_type: str

# --- Outgoing Responses (Server to Android) ---
class AuditResults(BaseModel):
    risk_score: int
    risk_level: str
    explainable_ai_reason: str

class CFOAssistant(BaseModel):
    updated_runway_months: float
    updated_cash_burn: float
    action_steps: List[str]
    draft_email: str

class FinalResponse(BaseModel):
    status: str
    audit_results: AuditResults
    cfo_assistant: CFOAssistant