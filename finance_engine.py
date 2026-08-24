import pandas as pd

def calculate_financial_health(invoice_amount: float, vendor: str):
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
    
    # Simple anomaly check (flags if over 200% of average)
    is_anomaly = invoice_amount > (historical_avg * 2)
    
    return new_runway, burn, is_anomaly