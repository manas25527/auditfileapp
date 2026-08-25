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