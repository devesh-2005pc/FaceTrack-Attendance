import os
import openpyxl
import requests
import json

# Load env manually to avoid dependency issues if dotenv is missing
def load_env(filepath):
    env = {}
    try:
        with open(filepath, 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    env[key] = value
    except Exception:
        pass
    return env

backend_env = load_env(r'C:\Users\SAHIL\Desktop\Re\FBA\backend\.env')
SUPABASE_URL = backend_env.get('SUPABASE_URL')
SUPABASE_KEY = backend_env.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase credentials in backend/.env")
    exit(1)

EXCEL_PATH = r"C:\Users\SAHIL\Desktop\Re\FBA\TE Computer A 25-26.xlsx"

def seed_students():
    print(f"Reading {EXCEL_PATH}...")
    try:
        wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
        sheet = wb.active
        
        students = []
        for i, row in enumerate(sheet.iter_rows(values_only=True)):
            if i == 0: continue # Skip header
            
            roll_no = row[0]
            name = row[2]
            
            if not roll_no or not name:
                continue
                
            students.append({
                "roll_no": str(roll_no),
                "name": str(name).strip(),
                "branch": "COMPUTER",
                "year": "TE",
                "division": "A"
            })
            
        print(f"Found {len(students)} students.")
        
        # Batch insert
        url = f"{SUPABASE_URL}/rest/v1/students"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        
        # Insert in batches of 50
        batch_size = 50
        for i in range(0, len(students), batch_size):
            batch = students[i:i+batch_size]
            response = requests.post(url, json=batch, headers=headers)
            
            if response.status_code in [200, 201]:
                print(f"Inserted batch {i//batch_size + 1}")
            else:
                print(f"Error inserting batch {i//batch_size + 1}: {response.text}")
                
        print("Done.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    seed_students()
