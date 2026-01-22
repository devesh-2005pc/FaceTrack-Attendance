# Setup & Testing Guide

## 1. Teacher Login Fix
I have updated the backend to allow a default teacher login since the database table creation failed due to permissions.
- **Username:** `teacher`
- **Password:** `password123`

## 2. Face Recognition Setup (Student Roll No. 30)
To enable face recognition for the student (Roll 30):
1.  **Save the student photo** you provided as:
    `backend/student_faces/30.jpg`
    *(Create the `student_faces` folder if it doesn't exist)*
2.  **Run the enrollment script**:
    ```powershell
    cd backend
    python enroll_student.py
    ```
    This will generate the face embedding and store it in Supabase.

## 3. Running the System
1.  **Start the Backend**:
    ```powershell
    cd backend
    # Make sure your virtual environment is activated
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    *Note: If the server is already running, please restart it to apply the login fixes.*

2.  **Start the Frontend**:
    ```powershell
    npm run dev
    ```

3.  **Testing**:
    - Open the Teacher Dashboard at `http://localhost:5173/login`.
    - Login with `teacher` / `password123`.
    - Create a session.
    - Scan the QR code with a mobile device (ensure both devices are on the same network).
    - The student (Roll 30) should be detected with a green bounding box and name overlay.
