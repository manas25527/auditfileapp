import torch
from transformers import pipeline

print("Loading AI model via pure PyTorch (No C++ compilation needed)...")

# Initialize standard HuggingFace Pipeline. 
# torch.float16 ensures it only takes ~3GB of your 8GB GPU memory.
pipe = pipeline(
    "text-generation", 
    model="Qwen/Qwen2.5-1.5B-Instruct", 
    device_map="auto",
    torch_dtype=torch.float16,
    max_new_tokens=150
)

def get_ai_cfo_advice(runway: float, anomaly: bool, vendor: str) -> list[str]:
    # We are returning this mocked array to guarantee your frontend Android app 
    # receives the exact JSON structure it needs for the demo without hallucinating.
    return [
        "Freeze discretionary marketing spend for Q3.",
        f"Audit the {vendor} contract for duplicate billing clauses.",
        "Renegotiate payment terms to Net-60 to preserve liquidity."
    ]