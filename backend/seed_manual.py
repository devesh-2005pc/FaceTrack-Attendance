import requests
import json
import re

# Load env manually
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

# Raw data string from user
raw_data = """
1 	 	 ACHARYA ADITYA SHRIPATHI (JYOTHI) 
 2 	 	 ANDHALE NUTAN BHAUSAHEB (JYOTI) 
 3 	 	 AUTI SIDDHESH YOGESH (HARSHADA) 
 4 	 	 BADGUJAR SIDDHI UDAY (SANGITA) 
 5 	 	 BALADE GAURAV BHIMRAO (DIPALI) 
 6 	 	 BAVISKAR MANISH ANIL (YOGITA) 
 7 	 	 BAWARI YASH SUNDERI (LEELA) 
 8 	 	 BHOJANE PIYUSH GOPAL (ANURADHA) 
 9 	 	 BOBADE SOHAM MAHADEV (SEEMA) 
 10 	 	 BOTE CHAITANYA RAMESH (SMITA) 
 11 	 	 CHANDANE ANSH SHANKAR (VARSHA) 
 12 	 	 CHAUDHARI ADIT SUNIL (SANJANA) 
 13 	 	 CHAUDHARI DEVESH PRAKASH (SUNITA) 
 14 	 	 CHAUDHARI DNYANESH SATISH (VIDYA) 
 15 	 	 CHAUDHARI LALITA BALU (VENUBAI) 
 16 	 	 CHIKANE MINAL VIJAYKUMAR (CHHAYA) 
 17 	 	 CHOTHE MEERA RAHUL (ARCHANA) 
 18 	 	 DALVI NAMRATA TANAJI (KAMAL) 
 19 	 	 DALVI SAHIL MANOHAR (MAYURI) 
 20 	 	 DAS KUNAL SANTA (JAYASHREE DAS) 
 21 	 	 SANGRAMSINHA SANJAY DESHMUKH (SUNITA) 
 22 	 	 DEVKAR MAYUR ASHUBA (URMILA) 
 23 	 	 DEY SHAMIKSHA HARANCHANDRA (SHIBANI) 
 24 	 	 DHOKE VARAD PANKAJ (BHAVANA) 
 25 	 	 DHURI RIDDHI SAHADEV (SUCHITA) 
 26 	 	 DUBEY SHUBHAM SURENDRA PRASAD (REKHA DEVI) 
 27 	 	 DUDHE SARTHAK RAJU (ARUNA) 
 28 	 	 GADE VISHWAVED KARBHARI (NANDA) 
 29 	 	 GADHAVE SOHAM SUNIL (HEMLATA) 
 30 	 2023FHCO093 	 GANGE SAHIL SANTOSH (LAXMI) 
 31 	 	 GAONKAR SHRUTI SURENDRA (SHREYA) 
 32 	 	 GARJE AMIT RAVINDRA (MANISHA) 
 33 	 	 GIRKAR GAURAV GHANASHYAM (NANDINI) 
 34 	 	 GUDI ANANNYA BALRAM (ASCHARYA) 
 35 	 	 JADHAV ISHA DEVENDRA (ARCHANA) 
 36 	 	 JADHAV SHREYASH HANUMAN (HARSHDA) 
 37 	 	 BHOSALE JATIN VIJAY (KANCHAN) 
 38 	 	 JAWALE HEMANT ANIL (KAVITA) 
 39 	 	 KADAM ANISH PRASHANT (AARTI) 
 40 	 	 KADAM RAHUL RAJESH (REENA) 
 41 	 	 KALASKAR AISHWARYA BABAN (KALPANA) 
 42 	 	 KAMBLE PRATIK SANJAY (PUSHPALATA) 
 43 	 	 KAMBLE SHRAVANI RAKESH (SHEETAL) 
 44 	 	 KARANGUTKAR SIDDHI PRAVIN (NAMRATA) 
 45 	 	 KARDAK AKSHAT AJIT (JYOTSNA) 
 46 	 	 KARKARE SARTHAK SHREENATH (SANDHYA) 
 47 	 	 KHARGE SHARDULA JAGANNATH (PRABHA) 
 48 	 	 ATHARV KOTWAL (SARIKA) 
 49 	 	 KULKARNI YASH YOGESH (AARTI) 
 50 	 	 KUSHWAHA AANYA RAMSINGH (ARCHANA) 
 51 	 	 LODHI SUDHIR DINESH (KRANTIDEVI) 
 52 	 	 MANJARE SOHAM GHANASHYAM (SUJATA) 
 54 	 	 MHATRE SAMIKSHA RAJENDRA (PRATIKSHA) 
 55 	 	 MISHRA HARSH NAGENDRA (MANJU) 
 56 	 	 MISTRI SAYALI JITENDRA (BHAVANA) 
 57 	 	 RUTUJA KISAN BHANGARE (SAKHUBAI) 
 58 	 	 BHATTAD DEVANG JITENDRA (VANDANA) 
 59 	 	 BHOI AKSHATA BHARAT (SWATI) 
 60 	 	 BHOSLE MANSI SACHIN (SADHANA) 
 61 	 	 BOROLE SIDDHI PRADIP (SAPANA) 
 62 	 	 DALAL PRACHITI SANJAY (SMEETA) 
 63 	 	 DESAI SAHIL SUBHASH (SANGITA) 
 64 	 	 DUDHAL SHREYA RANGRAO ( NEELAM) 
 65 	 	 GHADI VASUDHA SUHAS (SAMRUDDHI) 
 66 	 	 GHUGE DAKSH SANDIP (SAVITA) 
 67 	 	 JADHAV ABHISHEK ANKUSH (MANGALBAI) 
 68 	 	 JADHAV NANDINI SURESH ( INDIRA) 
 69 	 	 JADHAV SAHIL SANJAY ( REENA) 
 70 	 	 ROHAN MAHENDRA KAPOOR ( MEENAKSHI ) 
 71 	 	 KENE RENUKA KAILAS (SANGITA) 
 72 	 	 KOLI AACHAL DILIP (JYOTSNA) 
 73 	 	 LAKAMBLE PRAJAKTA SHRIRAM (NIVEDITA) 
"""

def seed_students():
    print("Parsing student data...")
    students = []
    
    lines = raw_data.strip().split('\n')
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Split by tabs or multiple spaces
        parts = re.split(r'\t+', line)
        if len(parts) < 2:
             # Try splitting by multiple spaces if tabs failed
             parts = re.split(r'\s{2,}', line)
        
        raw_roll = parts[0].strip()
        try:
            # Normalize to 3-digit string (e.g. 001, 010, 100)
            roll_no = f"{int(raw_roll):03}"
        except ValueError:
            roll_no = raw_roll
        
        # Handle cases with or without Std ID
        name = ""
        if len(parts) >= 3:
            name = parts[2].strip()
        elif len(parts) == 2:
            name = parts[1].strip()
            
        if not name:
             continue
             
        students.append({
            "roll_no": roll_no,
            "name": name,
            "branch": "COMPUTER",
            "year": "TE",
            "division": "A"
        })
            
    # Sort and Deduplicate
    # Deduplicate based on roll_no, keeping the first occurrence (or last, but typically roll is unique)
    unique_students = {}
    for s in students:
        roll = s['roll_no']
        if roll not in unique_students:
            unique_students[roll] = s
            
    # Convert back to list and sort by roll_no (as integer)
    final_list = list(unique_students.values())
    try:
        final_list.sort(key=lambda x: int(x['roll_no']))
    except ValueError:
        # Fallback to string sort if non-integer roll numbers exist
        final_list.sort(key=lambda x: x['roll_no'])
        
    print(f"Found {len(final_list)} unique students after cleaning.")
    
    # 1. DELETE existing students for this class to prevent duplicates
    print("Clearing existing records for TE Computer A...")
    delete_url = f"{SUPABASE_URL}/rest/v1/students?branch=eq.COMPUTER&year=eq.TE&division=eq.A"
    delete_headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    del_response = requests.delete(delete_url, headers=delete_headers)
    if del_response.status_code in [200, 204]:
        print("Existing records cleared.")
    else:
        print(f"Error clearing records: {del_response.text}")
    
    # 2. INSERT fresh data
    print("Inserting fresh data...")
    url = f"{SUPABASE_URL}/rest/v1/students"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal" 
    }
    
    # Insert in batches of 50
    batch_size = 50
    for i in range(0, len(final_list), batch_size):
        batch = final_list[i:i+batch_size]
        response = requests.post(url, json=batch, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"Inserted batch {i//batch_size + 1}")
        else:
            print(f"Error inserting batch {i//batch_size + 1}: {response.text}")
            
    print("Done.")

if __name__ == "__main__":
    seed_students()
