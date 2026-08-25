from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from schemas import AuditRequest, FinalResponse, AuditResults, CFOAssistant
from finance_engine import calculate_financial_health
from cfo_agent import get_ai_cfo_advice

app = FastAPI(title="Edge-Cloud AI Auditor API")

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