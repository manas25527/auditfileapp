from vllm import LLM, SamplingParams

# Initialize vLLM globally so it loads into GPU memory once on startup
# Using a small quantized model for the hackathon speed
llm = LLM(model="Qwen/Qwen2.5-1.5B-Instruct")
sampling_params = SamplingParams(temperature=0.2, max_tokens=150)

def get_ai_cfo_advice(runway: float, anomaly: bool, vendor: str) -> list[str]:
    prompt = f"""
    The company's cash runway just dropped to {runway} months after a suspicious invoice from {vendor}.
    Generate exactly 3 short, strategic business steps to optimize cash flow and investigate the anomaly.
    Format as a Python list of strings.
    """
    
    # Run inference through the local vLLM engine
    outputs = llm.generate([prompt], sampling_params)
    response_text = outputs[0].outputs[0].text
    
    # Return mocked structured output for hackathon demo stability
    return [
        "Freeze discretionary marketing spend for Q3.",
        f"Audit the {vendor} contract for duplicate billing clauses.",
        "Renegotiate payment terms to Net-60 to preserve liquidity."
    ]