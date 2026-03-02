# FaceTrack – Smart Attendance System

FaceTrack is a face recognition based attendance system designed to make classroom attendance fast, simple, and reliable.  
Teachers can start a session, scan students using a camera, and save attendance instantly.

---

## 🚀 Features

- Face recognition based student detection
- Real-time camera scanning
- Teacher dashboard for attendance control
- Capture multiple students at once
- View attendance before saving
- Save attendance records for the day

---

## 🛠 Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- TypeScript

### Backend
- FastAPI
- Python

### AI / Computer Vision
- DeepFace
- ArcFace
- OpenCV
- TensorFlow

### Database / Storage
- Supabase (PostgreSQL)

---

## ⚙️ How It Works

1. Teacher enters **Name** and **Division**
2. Camera starts automatically
3. System detects student faces
4. Teacher captures detected students
5. Attendance list is generated
6. Attendance is saved

---

## 📦 Installation

### 1. Clone Repository

```bash
git clone https://github.com/devesh-2005pc/FaceTrack-Attendance.git
cd FaceTrack-Attendance
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup

```bash
npm install
npm run dev
```

