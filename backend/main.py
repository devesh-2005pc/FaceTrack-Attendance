from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import asyncio

from database import (
    supabase,
    create_session_db,
    mark_attendance_db,
    get_student_embeddings
)

from face_service import face_service

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Websocket manager
class ConnectionManager:
    def __init__(self):
        self.connections = {}

    async def connect(self, websocket, session_id):
        await websocket.accept()
        if session_id not in self.connections:
            self.connections[session_id] = []
        self.connections[session_id].append(websocket)

    def disconnect(self, websocket, session_id):
        if session_id in self.connections and websocket in self.connections[session_id]:
            self.connections[session_id].remove(websocket)

    async def broadcast(self, session_id, message):
        if session_id in self.connections:
            for ws in self.connections[session_id]:
                await ws.send_text(message)

manager = ConnectionManager()

# Request models
class SessionCreateRequest(BaseModel):
    teacher_name: str
    date: str
    division: str

class ManualAttendance(BaseModel):
    session_id: str
    roll_no: str

# Routes
@app.get("/")
def root():
    return {"status": "Attendance AI Server Running"}

@app.post("/api/start-session")
def start_session(request: SessionCreateRequest):
    session = create_session_db(request.dict())
    if not session:
        raise HTTPException(500, "Session creation failed")
    return {"status": "success", "session": session}

@app.post("/api/attendance/manual")
async def manual_attendance(req: ManualAttendance):
    res = supabase.table("students").select("id,name,roll_no") \
        .eq("roll_no", req.roll_no).execute()
    if not res.data:
        raise HTTPException(404, "Student not found")
    student = res.data[0]
    mark_attendance_db(req.session_id, student["id"])
    await manager.broadcast(req.session_id, json.dumps({"student": student, "manual": True}))
    return {"success": True}

# Websocket for real-time attendance
@app.websocket("/ws/attendance/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        session_res = supabase.table("sessions").select("*").eq("id", session_id).single().execute()
        if not session_res.data:
            await websocket.close()
            return
        division = session_res.data["division"]
        face_service.load_class_data(session_id, division)
    except:
        await websocket.close()
        return

    try:
        while True:
            frame = await websocket.receive_text()
            result = await asyncio.to_thread(face_service.process_frame, session_id, frame)
            if result and result.get("match"):
                student = result["match"]
                mark_attendance_db(session_id, student["id"])
                await manager.broadcast(session_id, json.dumps({"student": student, "new": True}))
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)