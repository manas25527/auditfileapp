import pandas as pd

def calculate_financial_health(invoice_amount: float, vendor: str, date_str: str = None):
    # Load your mock database
    df = pd.read_csv("historical_ledger.csv")
    
    # Extract current state
    cash = df.loc[df['account_type'] == 'cash_reserves', 'amount'].values[0]
    burn = df.loc[df['account_type'] == 'monthly_burn', 'amount'].values[0]
    
    # Extract historical average for this specific vendor (e.g., matching "Acme")
    vendor_prefix = vendor.split()[0]
    historical_avg_row = df.loc[df['account_type'] == f'historical_vendor_avg_{vendor_prefix}']
    
    if not historical_avg_row.empty:
        historical_avg = historical_avg_row['amount'].values[0]
    else:
        historical_avg = invoice_amount # Default if new vendor
    
    # Calculate the impact of the new invoice
    new_cash = cash - invoice_amount
    new_runway = round(new_cash / burn, 1) # Runway in months

    # Robust Multi-Factor Anomaly Scoring
    risk_score = 10
    reasons = []
    
    # Factor 1: Amount vs Historical Average
    ratio = invoice_amount / historical_avg if historical_avg > 0 else 1.0
    if ratio > 2.5:
        risk_score += 45
        reasons.append(f"Amount (${invoice_amount:,.2f}) is {ratio:.1f}x higher than historical average.")
    elif ratio > 1.5:
        risk_score += 25
        reasons.append(f"Amount (${invoice_amount:,.2f}) is significantly higher than usual ({ratio:.1f}x).")
        
    # Factor 2: Round Numbers
    if invoice_amount > 0 and invoice_amount % 1000 == 0:
        risk_score += 15
        reasons.append("Highly rounded number ($1000s) detected.")
        
    # Factor 3: Date Analysis (Weekend)
    if date_str:
        import datetime
        try:
            dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")  # noqa: DTZ007
            if dt.weekday() >= 5: # Saturday or Sunday
                risk_score += 30
                day_name = "Saturday" if dt.weekday() == 5 else "Sunday"
                reasons.append(f"Weekend posting on {date_str} ({day_name}).")
        except ValueError:
            pass
            
    risk_score = min(risk_score, 100)
    
    if risk_score > 70:
        risk_level = "HIGH"
    elif risk_score > 30:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
        
    xai_reason = " | ".join(reasons) if reasons else "Invoice matches historical parameters and shows no anomalies."
    
    return new_runway, burn, risk_score, risk_level, xai_reason

def record_transaction_in_ledger(invoice_amount: float, vendor: str, date_str: str):
    """
    Appends the uploaded invoice to the ledger as a pending liability
    and updates the cash reserves.
    """
    df = pd.read_csv("historical_ledger.csv")
    
    # Add new pending liability entry
    new_entry = {
        'account_type': 'pending_liabilities',
        'amount': invoice_amount,
        'date': date_str,
        'description': f"Scanned Invoice - {vendor}"
    }
    df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)
    
    # Save the updated CSV
    df.to_csv("historical_ledger.csv", index=False)

def create_file_ledger(filename: str, extracted: dict) -> str:
    """
    Creates a specific ledger CSV for the uploaded file containing all extracted entries.
    """
    import os
    import pandas as pd
    
    entries = extracted.get("all_entries", [])
    
    # Base ledger filename
    base_name = os.path.splitext(filename)[0]
    ledger_filename = f"ledger_{base_name}.csv"
    
    if entries:
        df = pd.DataFrame(entries)
    else:
        # If no entries, create a single entry ledger with the gross total
        single_entry = {
            "name": extracted.get("vendor_name", "Unknown"),
            "amount": extracted.get("gross_total", 0.0),
            "status": "PENDING",
            "line_num": 1
        }
        df = pd.DataFrame([single_entry])
        
    df.to_csv(ledger_filename, index=False)
    return ledger_filename
    
def get_global_stats():
    """
    Reads the current ledger and returns global financial stats and transactions.
    """
    df = pd.read_csv("historical_ledger.csv")
    
    # Calculate stats
    cash = df.loc[df['account_type'] == 'cash_reserves', 'amount'].sum()
    burn = df.loc[df['account_type'] == 'monthly_burn', 'amount'].sum()
    liabilities = df.loc[df['account_type'] == 'pending_liabilities', 'amount'].sum()
    
    # Effective runway based on cash minus known pending liabilities
    effective_cash = cash - liabilities
    runway = round(effective_cash / burn, 1) if burn > 0 else 0
    
    # Extract recent transactions for display
    # (Filter out the fixed 'monthly_burn' and 'historical_vendor_avg' rows for clean UI)
    tx_df = df[~df['account_type'].str.contains('monthly_burn|historical_vendor_avg')]
    # Sort by date descending (assuming dates are in YYYY-MM-DD format)
    tx_df = tx_df.sort_values(by='date', ascending=False)
    
    transactions = tx_df.to_dict('records')
    
    return {
        "cash_reserves": cash,
        "monthly_burn": burn,
        "pending_liabilities": liabilities,
        "runway_months": runway,
        "transactions": transactions
    }