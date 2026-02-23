"""Convert the Properties CSV to a clean SQL INSERT script."""

import csv
import sys
from datetime import datetime
from typing import Optional

CSV_PATH = "/Users/andre/Downloads/Real Estate Dashboard - Properties.csv"
OUT_PATH = "/Users/andre/rei-dashboard/supabase/migrations/003_import_properties.sql"

# Columns that are numeric (should be NULL instead of empty string)
NUMERIC_COLS = {
    "units", "buildings", "lat", "lon",
    "vo2_raise", "total_equity", "total_debt", "purchase_price",
    "projected_lp_irr", "projected_irr", "projected_multiple", "senior_loan_rate",
}

DATE_COLS = {"investment_date", "exit_date"}

# Columns where "-" means no value
NULLABLE_TEXT_COLS = {"beds", "website"}


def parse_date(val: str) -> Optional[str]:
    """Convert '19-Dec-19' or '5-Dec-20' to '2019-12-19'."""
    if not val or val.strip() == "" or val.strip() == "-":
        return None
    try:
        dt = datetime.strptime(val.strip(), "%d-%b-%y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        # Try ISO format already
        return val.strip()


def sql_val(val: str, col: str) -> str:
    """Convert a CSV value to a SQL literal."""
    val = val.strip()

    if col in DATE_COLS:
        parsed = parse_date(val)
        return f"'{parsed}'" if parsed else "NULL"

    if col in NUMERIC_COLS:
        if not val or val == "-" or val == "":
            return "NULL"
        # Remove commas if present
        return val.replace(",", "")

    if col in NULLABLE_TEXT_COLS:
        if not val or val == "-":
            return "NULL"

    if not val:
        return "NULL"

    # Escape single quotes in text
    escaped = val.replace("'", "''")
    return f"'{escaped}'"


def main():
    with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    cols = list(rows[0].keys())

    lines = [
        "-- Auto-generated from Properties CSV",
        "-- Run after clearing seed data\n",
        f"INSERT INTO properties ({', '.join(cols)}) VALUES",
    ]

    value_lines = []
    for row in rows:
        vals = [sql_val(row[c], c) for c in cols]
        value_lines.append(f"  ({', '.join(vals)})")

    lines.append(",\n".join(value_lines) + ";")

    sql = "\n".join(lines)

    with open(OUT_PATH, "w") as f:
        f.write(sql + "\n")

    print(f"Written {len(rows)} rows to {OUT_PATH}")
    print("\nPreview:\n")
    print(sql[:2000])


if __name__ == "__main__":
    main()
