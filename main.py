from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from schemas import AuditRequest, FinalResponse, AuditResults, CFOAssistant
from finance_engine import calculate_financial_health
from cfo_agent import get_ai_cfo_advice
import os

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
    
    # 1. Run the Math
    runway, burn, is_anomaly = calculate_financial_health(
        invoice_amount=data.gross_total, 
        vendor=data.vendor_name
    )
    
    # 2. Determine Risk Logic
    risk_score = 90 if is_anomaly else 15
    risk_level = "HIGH" if is_anomaly else "LOW"
    xai_reason = (
        f"Invoice total (${data.gross_total}) is more than 200% of historical average for {data.vendor_name}."
        if is_anomaly else "Invoice matches historical parameters."
    )
    
    # 3. Get AI CFO Advice
    action_steps = get_ai_cfo_advice(runway, is_anomaly, data.vendor_name)
    
    # 4. Return formatted response to the Android app
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
            action_steps=action_steps
        )
    )

# Mount static files last so it doesn't shadow API routes
app.mount("/", StaticFiles(directory=os.path.dirname(__file__) or "."), name="static")