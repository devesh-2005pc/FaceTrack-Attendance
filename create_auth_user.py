import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(dotenv_path='backend/.env') # Adjust path if needed, usually .env is in root or backend

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Missing env vars")
    exit(1)

supabase: Client = create_client(url, key)

email = "teacher@example.com"
password = "password123"

try:
    # Try to create a new user
    user = supabase.auth.admin.create_user({
        "email": email,
        "password": password,
        "email_confirm": True
    })
    print(f"User created: ID={user.user.id}")
except Exception as e:
    print(f"Error creating user: {e}")
    # If user already exists, try to find them
    try:
        # List users (limit 1) to find the ID of the teacher if exists
        users = supabase.auth.admin.list_users()
        for u in users:
            if u.email == email:
                print(f"User found: ID={u.id}")
                break
    except Exception as e2:
        print(f"Error listing users: {e2}")
