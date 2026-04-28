
import csv
import json
import re

input_file = r'C:\Users\ThinkPad\.accio\accounts\1740634437\agents\DID-DB9653-02DB9653U1776425-7175-78CF1B\project\carpet-manager\data.csv'
output_file = r'C:\Users\ThinkPad\.accio\accounts\1740634437\agents\DID-DB9653-02DB9653U1776425-7175-78CF1B\project\carpet-manager\shipping_orders_2026.json'

results = []
current_brand = ""
current_date = ""

def is_phone(s):
    # Simple check for phone number (mostly digits, 8 or more)
    digits = re.sub(r'\D', '', s)
    return len(digits) >= 8

with open(input_file, mode='r', encoding='utf-8', errors='replace') as f:
    reader = csv.reader(f)
    try:
        header = next(reader)
    except StopIteration:
        print(0)
        exit()
        
    for row in reader:
        if not row or len(row) < 5:
            continue
        
        # Update current date
        date_val = row[1].strip()
        if date_val and "/" in date_val:
            current_date = date_val
            
        # Update current brand
        brand_val = row[4].strip()
        if brand_val:
            current_brand = brand_val
        else:
            # Check Column A for brand labels or other clues
            col0 = row[0].strip().upper()
            if "BRAND" in col0:
                current_brand = row[0].split(":")[-1].strip()
        
        # Filter for year 2026
        if current_date and "/2026" in current_date:
            # A row is valid if it has at least a name or a size
            size = row[2].strip()
            qty = row[3].strip()
            
            # Use user's mapping F(5), G(6), H(7) with fallback for shifts
            name = row[5].strip()
            phone = row[6].strip()
            address = row[7].strip()
            
            # Shift detection: if Col 5 is empty and Col 6 has text, it's likely the name
            if not name and phone:
                name = phone
                phone = address
                address = row[8].strip() if len(row) > 8 else ""
            
            # If it's a valid order row (has name or size and some content)
            if (name or size) and not (name == "Nom et Prénom"):
                results.append({
                    "brand": current_brand,
                    "orderDate": current_date,
                    "size": size,
                    "customerName": name,
                    "customerPhone": phone,
                    "customerAddress": address,
                    "parcelNumber": row[11].strip() if len(row) > 11 else None,
                    "status": "SHIPPED"
                })

# Final cleanup: remove rows that are just headers or empty
final_results = [r for r in results if r['customerName'] and r['customerName'].lower() not in ['nom et prénom', '']]

with open(output_file, mode='w', encoding='utf-8') as f:
    json.dump(final_results, f, indent=2, ensure_ascii=False)

print(len(final_results))
