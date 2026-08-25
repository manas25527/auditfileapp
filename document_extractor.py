"""
Document Extractor — Extracts structured invoice data from PDFs and images.
Uses pdfplumber for PDFs and pytesseract (Tesseract OCR) for images.
"""
import re
import io
import pdfplumber
import pytesseract
from PIL import Image
from datetime import datetime


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file."""
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def extract_text_from_image(file_bytes: bytes) -> str:
    """Extract text from an image using Tesseract OCR."""
    image = Image.open(io.BytesIO(file_bytes))
    # Convert to RGB if needed (e.g. RGBA PNGs)
    if image.mode != "RGB":
        image = image.convert("RGB")
    text = pytesseract.image_to_string(image)
    return text


def parse_invoice_fields(raw_text: str) -> dict:
    """
    Parse raw OCR/PDF text to extract structured invoice fields.
    Uses multiple regex patterns to handle various invoice formats.
    """
    text = raw_text.strip()
    lines = text.split("\n")

    # --- Vendor Name ---
    # Usually the first non-empty, non-date, non-numeric line
    vendor_name = "Unknown Vendor"
    for line in lines[:10]:  # Check first 10 lines
        line_clean = line.strip()
        if len(line_clean) > 2 and not re.match(r'^[\d\s\-/.$,%]+$', line_clean):
            # Skip lines that look like headers/labels
            if not re.match(r'^(invoice|bill|receipt|tax|date|to|from|ship|sold|page|no\.|#)', line_clean, re.IGNORECASE):
                vendor_name = line_clean
                break

    # --- Invoice Date ---
    invoice_date = datetime.now().strftime("%Y-%m-%d")
    date_patterns = [
        r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',           # 2026-08-22
        r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})',             # 08/22/2026
        r'(\d{1,2}[-/]\d{1,2}[-/]\d{2})\b',           # 08/22/26
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s*\d{4})',  # Aug 22, 2026
        r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4})',     # 22 Aug 2026
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw_date = match.group(1)
            # Try to normalize to YYYY-MM-DD
            for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%m/%d/%Y", "%m-%d-%Y", 
                        "%d/%m/%Y", "%d-%m-%Y", "%B %d, %Y", "%B %d %Y",
                        "%b %d, %Y", "%b %d %Y", "%d %B %Y", "%d %b %Y"):
                try:
                    parsed = datetime.strptime(raw_date.replace(",", "").strip(), fmt)
                    invoice_date = parsed.strftime("%Y-%m-%d")
                    break
                except ValueError:
                    continue
            break

    # --- Document Type ---
    doc_type = "Tax Invoice"
    text_lower = text.lower()
    if "receipt" in text_lower:
        doc_type = "Expense Receipt"
    elif "credit note" in text_lower or "credit memo" in text_lower:
        doc_type = "Credit Note"
    elif "purchase order" in text_lower or "p.o." in text_lower:
        doc_type = "Purchase Order"
    elif "proforma" in text_lower:
        doc_type = "Proforma Invoice"

    # --- Amounts ---
    # Find all currency amounts in the text
    amount_pattern = r'[\$₹€£]?\s*([\d,]+\.?\d{0,2})\s*(?:USD|INR|EUR|GBP)?'
    all_amounts = []
    for match in re.finditer(amount_pattern, text):
        try:
            val = float(match.group(1).replace(",", ""))
            if val > 0:
                all_amounts.append(val)
        except ValueError:
            continue

    # Try to find labeled amounts
    gross_total = 0.0
    tax_amount = 0.0
    subtotal = 0.0

    # Look for total
    total_patterns = [
        r'(?:grand\s*total|total\s*amount|total\s*due|amount\s*due|balance\s*due|net\s*payable|total)[:\s]*[\$₹€£]?\s*([\d,]+\.?\d{0,2})',
    ]
    for pattern in total_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                gross_total = float(match.group(1).replace(",", ""))
                break
            except ValueError:
                continue

    # Look for tax
    tax_patterns = [
        r'(?:tax|gst|vat|cgst|sgst|igst|hst|sales\s*tax)[:\s]*[\$₹€£]?\s*([\d,]+\.?\d{0,2})',
    ]
    for pattern in tax_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                tax_amount = float(match.group(1).replace(",", ""))
                break
            except ValueError:
                continue

    # Look for subtotal
    subtotal_patterns = [
        r'(?:sub\s*total|subtotal|net\s*amount|taxable\s*amount)[:\s]*[\$₹€£]?\s*([\d,]+\.?\d{0,2})',
    ]
    for pattern in subtotal_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                subtotal = float(match.group(1).replace(",", ""))
                break
            except ValueError:
                continue

    # Fallbacks: if we found no labeled total, use the largest amount
    if gross_total == 0 and all_amounts:
        gross_total = max(all_amounts)

    # If no subtotal, compute from total - tax
    if subtotal == 0:
        subtotal = gross_total - tax_amount if gross_total > tax_amount else gross_total

    return {
        "document_type": doc_type,
        "vendor_name": vendor_name,
        "invoice_date": invoice_date,
        "line_items_total": round(subtotal, 2),
        "tax_amount": round(tax_amount, 2),
        "gross_total": round(gross_total, 2),
        "raw_text": text[:500]  # Send first 500 chars for debugging
    }


def extract_document_data(file_bytes: bytes, filename: str) -> dict:
    """
    Main entry point: detect file type, extract text, parse fields.
    Returns a dict matching the ExtractedData schema.
    """
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext == "pdf":
        raw_text = extract_text_from_pdf(file_bytes)
    elif ext in ("jpg", "jpeg", "png", "webp", "bmp", "tiff", "tif", "heic"):
        raw_text = extract_text_from_image(file_bytes)
    else:
        # Try image first, fallback to treating as text
        try:
            raw_text = extract_text_from_image(file_bytes)
        except Exception:
            raw_text = file_bytes.decode("utf-8", errors="ignore")

    if not raw_text.strip():
        return {
            "document_type": "Unknown",
            "vendor_name": "Unreadable Document",
            "invoice_date": datetime.now().strftime("%Y-%m-%d"),
            "line_items_total": 0.0,
            "tax_amount": 0.0,
            "gross_total": 0.0,
            "raw_text": "(No text could be extracted)"
        }

    return parse_invoice_fields(raw_text)
