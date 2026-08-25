from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from schemas import AuditRequest, FinalResponse, AuditResults, CFOAssistant
from finance_engine import calculate_financial_health, record_transaction_in_ledger, get_global_stats
from cfo_agent import get_ai_cfo_advice, generate_draft_email
from document_extractor import extract_document_data
import os
import logging
import traceback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Edge-Cloud AI Auditor API")

# Serve the root HTML pages
@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(os.path.dirname(__file__), "index.html"))

@app.get("/user")
async def serve_user():
    return FileResponse(os.path.join(os.path.dirname(__file__), "user.html"))

@app.get("/admin")
async def serve_admin():
    return FileResponse(os.path.join(os.path.dirname(__file__), "admin.html"))

@app.get("/why-us")
async def serve_why_us():
    return FileResponse(os.path.join(os.path.dirname(__file__), "why-us.html"))


# Allow all origins so the phone browser doesn't block requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/audit-and-cfo", response_model=FinalResponse)
async def process_audit(request: AuditRequest):
    data = request.extracted_data
    
    # 1. Run the Math & Robust Scoring
    runway, burn, risk_score, risk_level, xai_reason = calculate_financial_health(
        invoice_amount=data.gross_total, 
        vendor=data.vendor_name,
        date_str=data.invoice_date
    )
    
    # 3. Record transaction in ledger
    import datetime
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    record_transaction_in_ledger(
        invoice_amount=data.gross_total,
        vendor=data.vendor_name,
        date_str=data.invoice_date or today_str
    )
    
    # 4. Get AI CFO Advice & Draft Email
    action_steps = get_ai_cfo_advice(runway, risk_score > 30, data.vendor_name)
    draft_email = generate_draft_email(data.vendor_name, data.gross_total, risk_level, xai_reason)
    
    # 5. Return formatted response to the Android app
    return FinalResponse(
        status="success",
        audit_results=AuditResults(
            risk_score=risk_score,
            risk_level=risk_level,
            explainable_ai_reason=xai_reason
        ),
        cfo_assistant=CFOAssistant(
            updated_runway_months=runway,
            updated_cash_burn=burn,
            action_steps=action_steps,
            draft_email=draft_email
        )
    )

@app.post("/api/v1/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """Accept a PDF or image, extract invoice data, run audit + CFO analysis."""
    try:
        file_bytes = await file.read()
        filename = file.filename or "upload.jpg"
        logger.info(f"Upload received: {filename} ({len(file_bytes)} bytes)")

        # 1. Extract structured data from the document
        extracted = extract_document_data(file_bytes, filename)
        raw_text = extracted.pop("raw_text", "")

        # 2. Run financial health check & scoring
        runway, burn, risk_score, risk_level, xai_reason = calculate_financial_health(
            invoice_amount=extracted.get("gross_total", 0),
            vendor=extracted.get("vendor_name", "Unknown"),
            date_str=extracted.get("invoice_date")
        )

        # 3. Record transaction in ledger
        import datetime
        today_str = datetime.date.today().strftime("%Y-%m-%d")
        record_transaction_in_ledger(
            invoice_amount=extracted.get("gross_total", 0),
            vendor=extracted.get("vendor_name", "Unknown"),
            date_str=extracted.get("invoice_date") or today_str
        )

        # 4. Get CFO advice & draft email
        action_steps = get_ai_cfo_advice(runway, risk_score > 30, extracted.get("vendor_name", "Unknown"))
        draft_email = generate_draft_email(extracted.get("vendor_name", "Unknown"), extracted.get("gross_total", 0), risk_level, xai_reason)

        logger.info(f"Upload processed: vendor={extracted.get('vendor_name')}, total={extracted.get('gross_total')}, refunds={len(extracted.get('pending_refunds', []))}, unpaid={len(extracted.get('unpaid_salaries', []))}")

        return {
            "status": "success",
            "extracted_data": {
                "document_type": extracted.get("document_type", "Unknown"),
                "vendor_name": extracted.get("vendor_name", "Unknown"),
                "invoice_date": extracted.get("invoice_date", ""),
                "line_items_total": extracted.get("line_items_total", 0),
                "tax_amount": extracted.get("tax_amount", 0),
                "gross_total": extracted.get("gross_total", 0),
            },
            "raw_text_preview": raw_text[:500] if raw_text else "",
            "content_summary": extracted.get("content_summary", ""),
            "pending_refunds": extracted.get("pending_refunds", []),
            "unpaid_salaries": extracted.get("unpaid_salaries", []),
            "all_entries": extracted.get("all_entries", []),
            "audit_results": {
                "risk_score": risk_score,
                "risk_level": risk_level,
                "explainable_ai_reason": xai_reason
            },
            "cfo_assistant": {
                "updated_runway_months": runway,
                "updated_cash_burn": burn,
                "action_steps": action_steps,
                "draft_email": draft_email
            }
        }
        }
    except Exception as e:
        logger.error(f"Upload processing failed: {e}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=200,
            content={
                "status": "error",
                "detail": f"Document processing failed: {str(e)}",
                "extracted_data": {
                    "document_type": "Unknown",
                    "vendor_name": "Error",
                    "invoice_date": "",
                    "line_items_total": 0,
                    "tax_amount": 0,
                    "gross_total": 0,
                },
                "raw_text_preview": "",
                "content_summary": f"Error: {str(e)}",
                "pending_refunds": [],
                "unpaid_salaries": [],
                "all_entries": [],
                "audit_results": {"risk_score": 0, "risk_level": "LOW", "explainable_ai_reason": "Processing error."},
                "cfo_assistant": {"updated_runway_months": 0, "updated_cash_burn": 0, "action_steps": []}
            }
        )

@app.get("/api/v1/ledger-stats")
async def get_ledger_stats():
    """Returns real-time aggregated stats from the CSV ledger."""
    return get_global_stats()

# Mount static files last so it doesn't shadow API routes
app.mount("/", StaticFiles(directory=os.path.dirname(__file__) or "."), name="static")