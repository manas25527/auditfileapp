#!/bin/bash
curl -X POST http://0.0.0.0:8000/api/v1/audit-and-cfo \
-H "Content-Type: application/json" \
-d '{
  "device_id": "iQOO_15_test",
  "auth_token": "bearer_123",
  "request_type": "audit_and_cfo_analysis",
  "extracted_data": {
    "document_type": "tax_invoice",
    "vendor_name": "Acme Software Corp",
    "invoice_date": "2026-08-22",
    "line_items_total": 45000.00,
    "tax_amount": 5000.00,
    "gross_total": 50000.00
  }
}'