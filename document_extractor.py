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
    
    # Downscale high-resolution phone photos to avoid OCR timeouts (Error 524)
    # A max dimension of 1600px is usually enough for OCR readability while being much faster
    max_dim = 1600
    if image.width > max_dim or image.height > max_dim:
        ratio = min(max_dim / image.width, max_dim / image.height)
        new_size = (int(image.width * ratio), int(image.height * ratio))
        # Use ANTIALIAS for Pillow < 10 or Resampling.LANCZOS for newer versions
        resample_method = getattr(Image, 'Resampling', Image).LANCZOS
        image = image.resize(new_size, resample_method)
        
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
        r'(?:tax|gst|vat|cgst|sgst|igst|hst|sales\s*tax)\s*(?:\([^)]*\))?\s*[:\s]*[\$₹€£]?\s*([\d,]+\.?\d{0,2})',
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
        "raw_text": text  # Return full text for analysis
    }


def detect_pending_refunds(raw_text: str) -> list[dict]:
    """
    Scan document text for refund/credit entries that have NOT been
    initiated, processed, or completed. Returns a list of dicts with
    name, amount, and reason.
    """
    refunds = []
    lines = raw_text.split("\n")

    # Keywords that indicate a refund/credit entry
    refund_keywords = re.compile(
        r'(refund|credit\s*note|return|reimbursement|cashback|reversal)',
        re.IGNORECASE
    )
    # Keywords that indicate the refund was already processed
    completed_keywords = re.compile(
        r'(initiated|processed|completed|approved|settled|paid|credited|refunded|done|cleared)',
        re.IGNORECASE
    )

    amount_pattern = re.compile(r'[\$₹€£]?\s*([\d,]+\.?\d{0,2})')

    for i, line in enumerate(lines):
        line_clean = line.strip()
        if not line_clean or len(line_clean) < 5:
            continue

        if refund_keywords.search(line_clean):
            # Check if this line or nearby lines indicate completion
            context = line_clean
            # Also check the next 2 lines for status
            for j in range(1, 3):
                if i + j < len(lines):
                    context += " " + lines[i + j].strip()

            if not completed_keywords.search(context):
                # Extract amount from line
                amt_match = amount_pattern.search(line_clean)
                amount = 0.0
                if amt_match:
                    try:
                        amount = float(amt_match.group(1).replace(",", ""))
                    except ValueError:
                        amount = 0.0

                # Try to extract a name/identifier
                # Remove the refund keyword and amount to get the name
                name = refund_keywords.sub("", line_clean).strip()
                name = amount_pattern.sub("", name).strip()
                name = re.sub(r'[:\-|•–—,]+', ' ', name).strip()
                if not name or len(name) < 2:
                    name = f"Entry on line {i + 1}"

                refunds.append({
                    "name": name[:80],
                    "amount": amount,
                    "status": "NOT INITIATED",
                    "line_ref": line_clean[:120]
                })

    return refunds


def detect_unpaid_salaries(raw_text: str) -> list[dict]:
    """
    Scan document text for salary/payroll entries where payment has
    NOT been received/credited. Returns a list of dicts with name,
    amount, and status.
    """
    unpaid = []
    lines = raw_text.split("\n")

    # Keywords indicating salary/payroll entries
    salary_keywords = re.compile(
        r'(salary|payroll|wage|compensation|stipend|emolument|pay\b)',
        re.IGNORECASE
    )
    # Keywords indicating payment was made
    paid_keywords = re.compile(
        r'(paid|received|credited|transferred|deposited|cleared|settled|processed|done|completed|success)',
        re.IGNORECASE
    )
    # Keywords indicating NOT paid
    unpaid_keywords = re.compile(
        r'(pending|unpaid|due|outstanding|not\s*paid|not\s*received|overdue|delayed|hold|withheld|failed)',
        re.IGNORECASE
    )

    amount_pattern = re.compile(r'[\$₹€£]?\s*([\d,]+\.?\d{0,2})')

    # Strategy 1: Look for explicit unpaid/pending salary lines
    for i, line in enumerate(lines):
        line_clean = line.strip()
        if not line_clean or len(line_clean) < 5:
            continue

        # Skip header rows that contain column labels
        if re.match(r'^(name|employee|sr|s\.no|#|sl|id)\b', line_clean, re.IGNORECASE):
            continue
        if re.search(r'\b(name|employee)\b.*\b(salary|amount|status)\b', line_clean, re.IGNORECASE):
            continue

        # Check if line has salary-related content
        has_salary = salary_keywords.search(line_clean)

        # Also check for table rows with names and amounts where status is pending
        context = line_clean
        for j in range(1, 3):
            if i + j < len(lines):
                context += " " + lines[i + j].strip()

        if has_salary or unpaid_keywords.search(line_clean):
            # If it has salary keyword + unpaid indicator, or just unpaid + amount
            is_unpaid = unpaid_keywords.search(context) or (has_salary and not paid_keywords.search(context))

            if is_unpaid:
                amt_match = amount_pattern.search(line_clean)
                amount = 0.0
                if amt_match:
                    try:
                        amount = float(amt_match.group(1).replace(",", ""))
                    except ValueError:
                        amount = 0.0

                # Extract name
                name = salary_keywords.sub("", line_clean).strip()
                name = unpaid_keywords.sub("", name).strip()
                name = amount_pattern.sub("", name).strip()
                name = re.sub(r'[:\-|•–—,]+', ' ', name).strip()
                if not name or len(name) < 2:
                    name = f"Entry on line {i + 1}"

                # Determine specific status
                status = "NOT RECEIVED"
                if re.search(r'overdue|delayed', context, re.IGNORECASE):
                    status = "OVERDUE"
                elif re.search(r'hold|withheld', context, re.IGNORECASE):
                    status = "ON HOLD"
                elif re.search(r'failed', context, re.IGNORECASE):
                    status = "FAILED"

                unpaid.append({
                    "name": name[:80],
                    "amount": amount,
                    "status": status,
                    "line_ref": line_clean[:120]
                })

    # Strategy 2: If it's a payroll document, look for table-like rows
    # with names and amounts but "pending" or no "paid" status
    text_lower = raw_text.lower()
    if ("payroll" in text_lower or "salary" in text_lower) and len(unpaid) == 0:
        # Look for patterns like: "Name    Amount    Status"
        for i, line in enumerate(lines):
            line_clean = line.strip()
            if not line_clean or len(line_clean) < 10:
                continue
            # Skip header rows
            if re.match(r'^(name|employee|sr|s\.no|#|sl)', line_clean, re.IGNORECASE):
                continue

            # Check if this line has an amount and a pending/unpaid indicator
            if amount_pattern.search(line_clean) and unpaid_keywords.search(line_clean):
                amt_match = amount_pattern.search(line_clean)
                amount = 0.0
                if amt_match:
                    try:
                        amount = float(amt_match.group(1).replace(",", ""))
                    except ValueError:
                        amount = 0.0

                name = unpaid_keywords.sub("", line_clean).strip()
                name = amount_pattern.sub("", name).strip()
                name = re.sub(r'[:\-|•–—,]+', ' ', name).strip()
                if not name or len(name) < 2:
                    name = f"Employee (line {i + 1})"

                unpaid.append({
                    "name": name[:80],
                    "amount": amount,
                    "status": "NOT RECEIVED",
                    "line_ref": line_clean[:120]
                })

    return unpaid


def extract_all_entries(raw_text: str) -> list[dict]:
    """
    Parse ALL data rows from the document into a structured table.
    Attempts to detect tabular data (CSV, payroll sheets, ledgers) and
    return every row with name, amount, and payment status.
    """
    entries = []
    lines = raw_text.split("\n")
    amount_pattern = re.compile(r'[\$₹€£]?\s*([\d,]+\.?\d{0,2})')

    # Status keywords
    paid_keywords = re.compile(
        r'\b(paid|received|credited|transferred|deposited|cleared|settled|processed|done|completed|success)\b',
        re.IGNORECASE
    )
    unpaid_keywords = re.compile(
        r'\b(pending|unpaid|due|outstanding|not\s*paid|not\s*received|overdue|delayed|hold|withheld|failed)\b',
        re.IGNORECASE
    )

    # Detect if it looks like CSV/tabular data
    is_csv = any(',' in line and line.count(',') >= 2 for line in lines[:5])
    delimiter = ',' if is_csv else None

    # Try to find header row to understand column positions
    header_idx = -1
    header_cols = []
    for i, line in enumerate(lines[:10]):
        line_clean = line.strip()
        if not line_clean:
            continue
        # Check if this looks like a header row
        if re.search(r'\b(name|employee|person|staff|worker)\b', line_clean, re.IGNORECASE):
            header_idx = i
            if delimiter:
                header_cols = [c.strip().lower() for c in line_clean.split(delimiter)]
            break

    # Parse data rows
    start_idx = header_idx + 1 if header_idx >= 0 else 0
    for i in range(start_idx, len(lines)):
        line_clean = lines[i].strip()
        if not line_clean or len(line_clean) < 3:
            continue

        # Skip lines that look like headers or labels
        if re.match(r'^(name|employee|sr|s\.no|#|sl|id|total|sub.?total|grand|---)\b', line_clean, re.IGNORECASE):
            continue
        if re.search(r'\b(name|employee)\b.*\b(salary|amount|status)\b', line_clean, re.IGNORECASE):
            continue

        entry = {"name": "", "amount": 0.0, "status": "UNKNOWN", "line_num": i + 1}

        if delimiter and header_cols:
            # CSV/delimited parsing
            cols = [c.strip() for c in line_clean.split(delimiter)]
            if len(cols) < 2:
                continue

            # Find name column
            name_idx = -1
            for j, h in enumerate(header_cols):
                if any(k in h for k in ['name', 'employee', 'person', 'staff', 'worker', 'member']):
                    name_idx = j
                    break
            if name_idx == -1:
                name_idx = 0  # Default to first column

            # Find amount column
            amt_idx = -1
            for j, h in enumerate(header_cols):
                if any(k in h for k in ['salary', 'amount', 'pay', 'wage', 'compensation', 'total', 'sum']):
                    amt_idx = j
                    break

            # Find status column
            status_idx = -1
            for j, h in enumerate(header_cols):
                if any(k in h for k in ['status', 'state', 'payment', 'remark']):
                    status_idx = j
                    break

            # Extract values
            if name_idx < len(cols):
                entry["name"] = cols[name_idx].strip()
            if not entry["name"] or len(entry["name"]) < 2:
                continue

            if amt_idx >= 0 and amt_idx < len(cols):
                amt_match = amount_pattern.search(cols[amt_idx])
                if amt_match:
                    try:
                        entry["amount"] = float(amt_match.group(1).replace(",", ""))
                    except ValueError:
                        pass

            if status_idx >= 0 and status_idx < len(cols):
                status_text = cols[status_idx].strip()
                if paid_keywords.search(status_text):
                    entry["status"] = "PAID"
                elif unpaid_keywords.search(status_text):
                    if re.search(r'overdue|delayed', status_text, re.IGNORECASE):
                        entry["status"] = "OVERDUE"
                    elif re.search(r'hold|withheld', status_text, re.IGNORECASE):
                        entry["status"] = "ON HOLD"
                    elif re.search(r'failed', status_text, re.IGNORECASE):
                        entry["status"] = "FAILED"
                    else:
                        entry["status"] = "PENDING"
                else:
                    entry["status"] = status_text.upper()[:20] if status_text else "UNKNOWN"
            else:
                # No status column — infer from line content
                if paid_keywords.search(line_clean):
                    entry["status"] = "PAID"
                elif unpaid_keywords.search(line_clean):
                    entry["status"] = "PENDING"

        else:
            # Non-CSV: try to parse freeform lines with amounts
            amt_match = amount_pattern.search(line_clean)
            if not amt_match:
                continue  # Skip lines without amounts

            try:
                entry["amount"] = float(amt_match.group(1).replace(",", ""))
            except ValueError:
                continue

            # Skip if amount is suspiciously small (likely a date or index)
            if entry["amount"] < 1:
                continue

            # Extract name (remove amount and status words)
            name = amount_pattern.sub("", line_clean).strip()
            name = paid_keywords.sub("", name).strip()
            name = unpaid_keywords.sub("", name).strip()
            name = re.sub(r'[\$₹€£:\-|•–—,]+', ' ', name).strip()
            name = re.sub(r'\s+', ' ', name).strip()
            if not name or len(name) < 2:
                name = f"Entry #{i + 1}"
            entry["name"] = name[:80]

            # Detect status
            if paid_keywords.search(line_clean):
                entry["status"] = "PAID"
            elif unpaid_keywords.search(line_clean):
                if re.search(r'overdue|delayed', line_clean, re.IGNORECASE):
                    entry["status"] = "OVERDUE"
                elif re.search(r'hold|withheld', line_clean, re.IGNORECASE):
                    entry["status"] = "ON HOLD"
                else:
                    entry["status"] = "PENDING"

        entries.append(entry)

    return entries


def generate_content_summary(raw_text: str, doc_type: str, all_entries: list = None) -> str:
    """Generate a brief human-readable summary of the document content."""
    lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
    total_lines = len(lines)
    char_count = len(raw_text)

    summary_parts = [f"{doc_type} with {total_lines} content lines ({char_count:,} characters)"]

    text_lower = raw_text.lower()
    if "payroll" in text_lower:
        summary_parts.append("Contains payroll/salary data")
    if "refund" in text_lower or "credit note" in text_lower:
        summary_parts.append("Contains refund/credit entries")
    if "invoice" in text_lower:
        summary_parts.append("Contains invoice details")
    if "tax" in text_lower or "gst" in text_lower:
        summary_parts.append("Contains tax information")

    if all_entries:
        total = len(all_entries)
        paid = sum(1 for e in all_entries if e["status"] == "PAID")
        unpaid = total - paid
        summary_parts.append(f"{total} entries found ({paid} paid, {unpaid} pending/other)")

    return ". ".join(summary_parts) + "."


def extract_document_data(file_bytes: bytes, filename: str) -> dict:
    """
    Main entry point: detect file type, extract text, parse fields,
    and run smart analysis for refunds and salaries.
    Returns a dict with extracted fields + analysis results.
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
            "raw_text": "(No text could be extracted)",
            "content_summary": "Document could not be read.",
            "pending_refunds": [],
            "unpaid_salaries": [],
            "all_entries": []
        }

    parsed = parse_invoice_fields(raw_text)

    # Run smart analysis
    pending_refunds = detect_pending_refunds(raw_text)
    unpaid_salaries = detect_unpaid_salaries(raw_text)
    all_entries = extract_all_entries(raw_text)
    content_summary = generate_content_summary(raw_text, parsed["document_type"], all_entries)

    parsed["content_summary"] = content_summary
    parsed["pending_refunds"] = pending_refunds
    parsed["unpaid_salaries"] = unpaid_salaries
    parsed["all_entries"] = all_entries

    return parsed


