#!/usr/bin/env python3
"""Parse legacy .xls inventory export (ExportFile.xls layout) to JSON rows."""

import json
import sys

import xlrd


def cell_str(value) -> str:
    if value is None or value == "":
        return ""
    if isinstance(value, float) and value == int(value):
        return str(int(value))
    return str(value).strip()


def parse_price(value):
    if value is None or value == "":
        return None

    if isinstance(value, (int, float)):
        return int(round(float(value) * 1000))

    text = str(value).strip()
    if text.lower() == "harga1":
        return None

    normalized = text.replace(".", "").replace(",", ".")
    try:
        amount = float(normalized)
    except ValueError:
        return None

    if amount <= 0:
        return None

    # Values like 9.0 are in thousands; pre-formatted IDR like 1010000 are already full rupiah.
    if amount < 10000 and "." not in text:
        return int(round(amount * 1000))

    return int(round(amount))


def parse_rows(path: str) -> list[dict]:
    workbook = xlrd.open_workbook(path)
    sheet = workbook.sheet_by_index(0)
    rows: list[dict] = []
    seen_barcodes: set[str] = set()

    for row_index in range(5, min(3878, sheet.nrows)):
        code = cell_str(sheet.cell_value(row_index, 0))
        barcode_col = cell_str(sheet.cell_value(row_index, 2))
        short_name = cell_str(sheet.cell_value(row_index, 6))
        title = cell_str(sheet.cell_value(row_index, 8)) or short_name
        sell_price = parse_price(sheet.cell_value(row_index, 10))

        barcode = barcode_col or code

        if not barcode or not title:
            continue

        if sell_price is None or sell_price <= 0:
            continue

        if barcode in seen_barcodes:
            continue

        seen_barcodes.add(barcode)
        rows.append(
            {
                "row": row_index + 1,
                "barcode": barcode,
                "title": title,
                "sell_price": sell_price,
            }
        )

    return rows


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: parse_legacy_inventory_xls.py <path-to-xls>", file=sys.stderr)
        return 1

    path = sys.argv[1]
    rows = parse_rows(path)
    json.dump(rows, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
