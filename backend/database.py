import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

def get_student_embeddings(branch: str, division: str):
    response = supabase.table('students')\
        .select('id, roll_no, name, face_descriptor')\
        .eq('branch', branch)\
        .eq('division', division)\
        .execute()
    return response.data

def mark_attendance_db(session_id: str, student_id: str):
    try:
        supabase.table('attendance_records').insert({
            "session_id": session_id,
            "student_id": student_id,
            "status": "present"
        }).execute()
        return True
    except Exception:
        return False

def authenticate_teacher(username, password):
    # Hardcoded fallback for immediate access
    if username == "teacher" and password == "password123":
        # Use a valid UUID to satisfy database type constraints
        return {"id": "56faae9c-c2a4-491d-9b81-659449a0398a", "username": "teacher", "role": "teacher"}

    # Temporary auth against a users table
    try:
        res = supabase.table('users').select('*').eq('username', username).eq('password', password).execute()
        if res.data:
            return res.data[0]
        return None
    except Exception:
        return None

def create_session_db(session_data):
    try:
        # Print data for debugging
        print(f"Attempting to create session with: {session_data}")
        res = supabase.table('sessions').insert(session_data).execute()
        print(f"Supabase response: {res}")
        if res.data:
            return res.data[0]
        return None
    except Exception as e:
        print(f"Error creating session: {e}")
        # Return the error message to the caller for better debugging
        return {"error": str(e)}

def update_student_face(roll_no, embedding):
    try:
        supabase.table('students').update({'face_descriptor': embedding}).eq('roll_no', roll_no).execute()
        return True
    except Exception as e:
        print(f"Error updating student face: {e}")
        return False

def get_attendance_history_db(teacher_id: str = None):
    try:
        # 1. Get Sessions (optionally filtered by teacher)
        query = supabase.table('sessions').select('*')
        if teacher_id:
            query = query.eq('teacher_id', teacher_id)
        
        sessions_res = query.execute()
        sessions = {s['id']: s for s in sessions_res.data}
        session_ids = list(sessions.keys())

        if not session_ids:
            return []

        # 2. Get Attendance Records for these sessions
        attendance_res = supabase.table('attendance_records')\
            .select('*')\
            .in_('session_id', session_ids)\
            .order('timestamp', desc=True)\
            .execute()
        
        records = attendance_res.data
        if not records:
            return []

        # 3. Get Students details
        student_ids = list(set(r['student_id'] for r in records))
        students_res = supabase.table('students')\
            .select('id, name, roll_no, branch, division')\
            .in_('id', student_ids)\
            .execute()
        
        students = {s['id']: s for s in students_res.data}

        # 4. Merge Data
        history = []
        for r in records:
            session = sessions.get(r['session_id'])
            student = students.get(r['student_id'])
            
            if session and student:
                history.append({
                    "id": r.get('id'), # Assuming record has an ID
                    "date": r['timestamp'],
                    "student_name": student['name'],
                    "roll_no": student['roll_no'],
                    "branch": session['branch'],
                    "division": session['division'],
                    "subject": session['subject'],
                    "class_name": session['class_name'],
                    "status": r.get('status', 'Present'),
                    "session_id": session['id']
                })
        
        return history

    except Exception as e:
        print(f"Error fetching history: {e}")
        return []
