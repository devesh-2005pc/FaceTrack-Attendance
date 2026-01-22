from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from face_service import face_service
from database import mark_attendance_db, supabase, authenticate_teacher, create_session_db, get_attendance_history_db
import json
import asyncio
from typing import List, Dict
from pydantic import BaseModel

app = FastAPI()

# Connection Manager for WebSockets
class ConnectionManager:
    def __init__(self):
        # Store connections as {session_id: [WebSocket]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast(self, message: str, session_id: str):
        if session_id in self.active_connections:
            # Iterate over a copy to avoid modification issues
            for connection in self.active_connections[session_id][:]:
                try:
                    await connection.send_text(message)
                except Exception:
                    # Handle broken connections
                    pass

manager = ConnectionManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/login")
async def login(request: LoginRequest):
    user = authenticate_teacher(request.username, request.password)
    if user:
        return {"status": "success", "user": user}
    raise HTTPException(status_code=401, detail="Invalid credentials")

class SessionCreateRequest(BaseModel):
    branch: str
    year: str
    class_name: str
    division: str
    subject: str
    timing: str
    teacher_id: str
    status: str = "active"

@app.post("/api/sessions")
async def create_session(request: SessionCreateRequest):
    session_data = request.dict()
    result = create_session_db(session_data)
    
    # Check if result contains an error
    if result and "error" in result:
        print(f"Detailed Supabase Error: {result['error']}")
        raise HTTPException(status_code=500, detail=f"Database error: {result['error']}")
        
    if result:
        return {"status": "success", "session": result}
    raise HTTPException(status_code=500, detail="Failed to create session (Unknown error)")

class ManualAttendanceRequest(BaseModel):
    session_id: str
    roll_no: str

@app.post("/api/attendance/manual")
async def mark_manual_attendance(request: ManualAttendanceRequest):
    # Find student by roll_no
    try:
        # Normalize roll no to 3 digits just in case
        formatted_roll = f"{int(request.roll_no):03}"
        
        # 1. Get Student ID
        res = supabase.table('students').select('id, name, roll_no').eq('roll_no', formatted_roll).execute()
        
        if not res.data:
            # Try without formatting
            res = supabase.table('students').select('id, name, roll_no').eq('roll_no', request.roll_no).execute()
            
        if not res.data:
            raise HTTPException(status_code=404, detail="Student not found")
            
        student = res.data[0]
        
        # 2. Mark Attendance
        success = mark_attendance_db(request.session_id, student['id'])
        
        if success:
             # Broadcast update to WebSocket clients (Teacher/Student views)
            await manager.broadcast(json.dumps({
                "status": "success",
                "student": {
                    "name": student['name'],
                    "roll_no": student['roll_no']
                },
                "new_record": True,
                "manual": True
            }), request.session_id)
            
            return {"status": "success", "student": student}
        else:
             # Already present or error
             return {"status": "info", "message": "Already marked or error"}
             
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid Roll No format")
    except Exception as e:
        print(f"Manual attendance error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history(teacher_id: str = None):
    history = await asyncio.to_thread(get_attendance_history_db, teacher_id)
    return history

@app.get("/")
def read_root():
    return {"status": "Face Recognition Server Running"}

@app.websocket("/ws/attendance/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    
    try:
        # Load session data once at connection
        res = supabase.table('sessions').select('*').eq('id', session_id).single().execute()
        if res.data:
            s = res.data
            face_service.load_class_data(session_id, s['branch'], s['division'])
        else:
            await websocket.close(code=1008)
            return
    except Exception as e:
        await websocket.close(code=1011)
        return

    try:
        while True:
            data = await websocket.receive_text()
            
            # Offload heavy AI processing to a thread pool
            result = await asyncio.to_thread(face_service.process_frame, session_id, data)

            if result and result.get("match"):
                student = result["match"]
                marked = await asyncio.to_thread(mark_attendance_db, session_id, student['id'])
                
                # Broadcast to ALL clients in this session
                await manager.broadcast(json.dumps({
                    "status": "success",
                    "student": {
                        "name": student['name'],
                        "roll_no": student['roll_no']
                    },
                    "facial_area": result.get("facial_area"),
                    "new_record": marked
                }), session_id)
                
            elif result and result.get("facial_area"):
                 # Face detected but not recognized - Send only to sender (camera)
                 # We don't want to spam the teacher dashboard with green boxes of unknown faces
                 # But since we don't distinguish sender type easily here without extra handshake,
                 # sending to all is okay, but dashboard ignores 'detected' status.
                 await websocket.send_text(json.dumps({
                    "status": "detected",
                    "facial_area": result.get("facial_area")
                }))

    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        # Optional: Only cleanup if no more connections? 
        # For now, let's keep face_service cache even if connection drops briefly
        # face_service.cleanup_session(session_id) 
    except Exception:
        manager.disconnect(websocket, session_id)
