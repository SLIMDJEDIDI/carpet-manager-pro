import csv
import json
import re

def extract_orders(file_path, sheet_name):
    orders = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            try:
                header = next(reader)
            except StopIteration:
                return []
            
            for row in reader:
                if not row: continue
                
                date_val = ""
                if len(row) > 1 and "/2026" in row[1]:
                    date_val = row[1]
                elif len(row) > 0 and "/2026" in row[0]:
                    date_val = row[0]
                
                if date_val:
                    order = {
                        "Order Date": date_val.strip(),
                        "Brand": "",
                        "Design Code/Name": "",
                        "Size": "",
                        "Customer Full Name": "",
                        "Phone Number": "",
                        "Address": "",
                        "Status": "",
                        "Parcel Number": ""
                    }
                    
                    if sheet_name == 'order taking':
                        order["Brand"] = row[0].strip() if len(row) > 0 else ""
                        order["Design Code/Name"] = row[5].strip() if len(row) > 5 else ""
                        order["Size"] = row[2].strip() if len(row) > 2 else ""
                        order["Customer Full Name"] = row[6].strip() if len(row) > 6 else ""
                        order["Phone Number"] = row[7].strip() if len(row) > 7 else ""
                        order["Address"] = row[8].strip() if len(row) > 8 else ""
                        order["Status"] = row[11].strip() if len(row) > 11 else ""
                        
                        if not order["Phone Number"] and order["Customer Full Name"]:
                            phones = re.findall(r'\d{8,}', order["Customer Full Name"])
                            if phones:
                                order["Phone Number"] = phones[0]
                        
                        remarque = row[12].strip() if len(row) > 12 else ""
                        if "parcel" in remarque.lower() or "numéro" in remarque.lower():
                            order["Parcel Number"] = remarque
                            
                    elif sheet_name == 'shipping orders':
                        order["Design Code/Name"] = row[4].strip() if len(row) > 4 else ""
                        order["Size"] = row[2].strip() if len(row) > 2 else ""
                        order["Customer Full Name"] = row[5].strip() if len(row) > 5 else ""
                        order["Phone Number"] = row[6].strip() if len(row) > 6 else ""
                        order["Address"] = row[7].strip() if len(row) > 7 else ""
                        order["Status"] = row[10].strip() if len(row) > 10 else ""
                        
                        if not order["Phone Number"] and order["Customer Full Name"]:
                            phones = re.findall(r'\d{8,}', order["Customer Full Name"])
                            if phones:
                                order["Phone Number"] = phones[0]
                        
                        remarque = row[11].strip() if len(row) > 11 else ""
                        order["Parcel Number"] = remarque if "parcel" in remarque.lower() or re.search(r'\d{10,}', remarque) else ""

                    orders.append(order)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    return orders

all_orders = []
all_orders.extend(extract_orders('order_taking.csv', 'order taking'))
all_orders.extend(extract_orders('shipping_orders.csv', 'shipping orders'))

with open('orders_2026.json', 'w', encoding='utf-8') as f:
    json.dump(all_orders, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(all_orders)} orders.")
