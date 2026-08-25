# AI model imports (torch, transformers) removed for now — 
# the function below returns mock data for the demo.
# To enable real AI advice, install torch/transformers and uncomment the pipeline.

def get_ai_cfo_advice(runway: float, anomaly: bool, vendor: str) -> list[str]:
    # We are returning this mocked array to guarantee your frontend Android app 
    # receives the exact JSON structure it needs for the demo without hallucinating.
    return [
        "Freeze discretionary marketing spend for Q3.",
        f"Audit the {vendor} contract for duplicate billing clauses.",
        "Renegotiate payment terms to Net-60 to preserve liquidity."
    ]

def generate_draft_email(vendor: str, amount: float, risk_level: str, xai_reason: str) -> str:
    if risk_level == "LOW":
        return f"Dear {vendor} Team,<br><br>We have received your invoice for ${amount:,.2f} and it has been queued for standard processing.<br><br>Best regards,<br>ClariFi Edge Finance"
        
    email_body = f"Dear {vendor} Accounts Payable Team,<br><br>"
    email_body += f"We are reviewing your recent invoice for <strong>${amount:,.2f}</strong>. "
    email_body += "Our automated auditing system has flagged a few items for review before we can process payment.<br><br>"
    
    email_body += "<strong>Review Items:</strong><br>"
    email_body += f"<em>{xai_reason}</em><br><br>"
    
    email_body += "Could you please review and confirm the details of this charge, or provide any supporting documentation?<br><br>"
    email_body += "We appreciate your prompt assistance to help us resolve this quickly.<br><br>"
    email_body += "Warm regards,<br><strong>Aditya Siwach, CA</strong><br>ClariFi Edge Finance Team"
    
    return email_body