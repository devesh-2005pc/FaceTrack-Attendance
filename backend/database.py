import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)


def get_student_embeddings(division):
    """Fetch all students in a division"""
    res = supabase.table("students") \
        .select("id,name,roll_no,face_descriptor") \
        .eq("division", division) \
        .execute()
    return res.data or []


def mark_attendance_db(session_id: str, student_id: str):
    """Mark a student as present for a session"""
    try:
        supabase.table('attendance_records').insert({
            "session_id": session_id,
            "student_id": student_id
        }).execute()
        return True
    except Exception as e:
        print(f"Error marking attendance: {e}")
        return False


def create_session_db(session_data):
    """Create a session with teacher_name, date, division"""
    try:
        res = supabase.table('sessions').insert(session_data).execute()
        if res.data:
            return res.data[0]
        return None
    except Exception as e:
        print(f"Error creating session: {e}")
        return None


def update_student_face(roll_no, embedding):
    """Update face descriptor of a student"""
    try:
        supabase.table('students').update({'face_descriptor': embedding}) \
            .eq('roll_no', roll_no).execute()
        return True
    except Exception as e:
        print(f"Error updating student face: {e}")
        return False


def get_attendance_history_db():
    """Get full attendance history (merged with student + session info)"""
    try:
        # 1. Get all sessions
        sessions_res = supabase.table('sessions').select('*').execute()
        sessions = {s['id']: s for s in sessions_res.data} if sessions_res.data else {}
        session_ids = list(sessions.keys())
        if not session_ids:
            return []

        # 2. Get attendance records for these sessions
        attendance_res = supabase.table('attendance_records') \
            .select('*') \
            .in_('session_id', session_ids) \
            .order('timestamp', desc=True) \
            .execute()
        records = attendance_res.data or []

        if not records:
            return []

        # 3. Get student details
        student_ids = list(set(r['student_id'] for r in records))
        students_res = supabase.table('students') \
            .select('id, name, roll_no, division') \
            .in_('id', student_ids) \
            .execute()
        students = {s['id']: s for s in students_res.data} if students_res.data else {}

        # 4. Merge data
        history = []
        for r in records:
            session = sessions.get(r['session_id'])
            student = students.get(r['student_id'])
            if session and student:
                history.append({
                    "id": r.get('id'),
                    "date": session['date'],
                    "teacher_name": session['teacher_name'],
                    "division": session['division'],
                    "student_name": student['name'],
                    "roll_no": student['roll_no'],
                    "status": "Present",
                    "session_id": session['id']
                })
        return history

    except Exception as e:
        print(f"Error fetching history: {e}")
        return []