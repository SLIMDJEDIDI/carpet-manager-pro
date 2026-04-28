
import csv
import json
import os

input_file = r'C:\Users\ThinkPad\.accio\accounts\1740634437\agents\DID-DB9653-02DB9653U1776425-7175-78CF1B\project\carpet-manager\data.csv'
output_file = r'C:\Users\ThinkPad\.accio\accounts\1740634437\agents\DID-DB9653-02DB9653U1776425-7175-78CF1B\project\carpet-manager\shipping_orders_2026.json'

results = []
current_brand = ""

try:
    with open(input_file, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        try:
            header = next(reader)
        except StopIteration:
            print(0)
            exit()
            
        for row in reader:
            if len(row) < 7:
                continue
            
            date = row[0].strip()
            brand_in_row = row[3].strip()
            
            # If the brand is present, update current_brand
            if brand_in_row:
                current_brand = brand_in_row
                
            # Filter for year 2026
            if "/2026" in date:
                order = {
                    "brand": current_brand,
                    "orderDate": date,
                    "size": row[1].strip(),
                    "customerName": row[4].strip(),
                    "customerPhone": row[5].strip(),
                    "customerAddress": row[6].strip(),
                    "parcelNumber": row[10].strip() if len(row) > 10 else None,
                    "status": "SHIPPED"
                }
                results.append(order)
except Exception as e:
    # Fallback to latin-1 if utf-8 fails
    with open(input_file, mode='r', encoding='latin-1') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if len(row) < 7: continue
            date = row[0].strip()
            brand_in_row = row[3].strip()
            if brand_in_row: current_brand = brand_in_row
            if "/2026" in date:
                results.append({
                    "brand": current_brand,
                    "orderDate": date,
                    "size": row[1].strip(),
                    "customerName": row[4].strip(),
                    "customerPhone": row[5].strip(),
                    "customerAddress": row[6].strip(),
                    "parcelNumber": row[10].strip() if len(row) > 10 else None,
                    "status": "SHIPPED"
                })

with open(output_file, mode='w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(len(results))
