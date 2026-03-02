import { useState, useEffect, useRef } from "react";

export default function TeacherDashboard() {
  const [teacherName, setTeacherName] = useState("");
  const [division, setDivision] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");

  const [attendance, setAttendance] = useState<string[]>([]);
  const [showAttendance, setShowAttendance] = useState(false);
  const [saved, setSaved] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Date
  useEffect(() => {
    const today = new Date();
    setCurrentDate(
      today.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  // Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error(err);
      setError("Camera not available. Close other apps using camera.");
    }
  };

  const handleStart = () => {
    if (!teacherName.trim() || !division.trim()) {
      setError("Enter Teacher Name and Division");
      return;
    }

    setError("");
    setCameraOn(true);
    startCamera();
  };

  // Capture (temporary mock until face API connected)
  const captureAttendance = () => {
    const detectedStudents = [
      "Rahul",
      "Sneha",
      "Aman",
      "Riya",
      "Kunal",
      "Priya",
      "Ankit",
      "Neha",
      "Rohan",
      "Sanjay",
    ];

    const newStudents = detectedStudents.filter(
      (s) => !attendance.includes(s)
    );

    setAttendance([...attendance, ...newStudents]);
  };

  const saveAttendance = () => {
    if (saved) {
      alert("Attendance already saved for today");
      return;
    }

    const data = {
      teacherName,
      division,
      date: currentDate,
      students: attendance,
    };

    console.log("Attendance Saved:", data);

    setSaved(true);
    alert("Attendance saved successfully");
  };

  // Cleanup camera
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* MESSY CHAOTIC GALAXY Stars Background */}
      <div className="space-bg">
        <div className="stars-layer-1"></div>
        <div className="stars-layer-2"></div>
        <div className="stars-layer-3"></div>
        <div className="stars-layer-4"></div>
        <div className="stars-layer-5"></div>
        <div className="stars-layer-6"></div>
        <div className="stars-layer-7"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-2 tracking-wider drop-shadow-md animate-fade-in">
          || श्री स्वामी समर्थ ||
        </h1>

        <p className="text-gray-400 mb-12 text-sm md:text-base">{currentDate}</p>

        {!cameraOn && (
          <div className="w-full max-w-lg neo-3d-card animate-slide-up">
            <div className="neo-glow cyan-glow"></div>
            <div className="card-inner p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text mb-2">
                  Smart Attendance
                </h2>
                <div className="w-20 h-1 mx-auto bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"></div>
              </div>

              <div className="space-y-6 mb-8">
                <input
                  type="text"
                  placeholder="Teacher Name"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="neo-input w-full"
                />
                <input
                  type="text"
                  placeholder="Division (1-9)"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="neo-input w-full"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStart}
                  className="neo-3d-button cyan-gradient flex-1 group"
                >
                  Start Camera
                </button>
              </div>

              {error && (
                <div className="error-card mt-6">
                  <p className="text-red-300 text-sm font-medium text-center">
                    ⚠️ {error}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {cameraOn && (
          <div className="w-full max-w-7xl space-y-12 animate-slide-up">
            {/* Header Card */}
            <div className="neo-3d-card-header max-w-3xl mx-auto">
              <div className="neo-glow blue-glow"></div>
              <div className="card-inner p-8 text-center">
                <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text mb-6">
                  {teacherName}
                </h2>
                <div className="flex flex-wrap gap-4 justify-center max-w-md mx-auto">
                  <span className="info-tag cyan-tag">Division: {division}</span>
                  <span className="info-tag blue-tag">{currentDate}</span>
                </div>
              </div>
            </div>

            {/* BIGGER Camera Card */}
            <div className="neo-3d-camera-container max-w-5xl mx-auto">
              <div className="neo-glow camera-glow"></div>
              <div className="camera-frame p-10">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="neo-video"
                />
                <div className="live-indicator">
                  <div className="pulse-dot"></div>
                  <span>🔴LIVE</span>
                </div>
              </div>
            </div>

            {/* THREE BUTTONS IN ONE HORIZONTAL LINE */}
            <div className="control-panel max-w-5xl mx-auto">
              <div className="buttons-row">
                <button
                  onClick={captureAttendance}
                  disabled={saved}
                  className="neo-3d-button green-gradient group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📸 Capture Students
                  <span className="count-badge">({attendance.length})</span>
                </button>

                <button
                  onClick={() => setShowAttendance(!showAttendance)}
                  className="neo-3d-button yellow-gradient group"
                >
                  👁️ {showAttendance ? "Hide" : "View"} Attendance
                </button>

                <button
                  onClick={saveAttendance}
                  disabled={saved}
                  className={`neo-3d-button ${
                    saved ? "saved-gradient" : "blue-gradient"
                  } group disabled:cursor-not-allowed`}
                >
                  {saved ? "✅ Saved" : "💾 Save Attendance"}
                </button>
              </div>
            </div>

            {/* Attendance Card */}
            {showAttendance && (
              <div className="neo-3d-card-attendance max-w-4xl mx-auto">
                <div className="neo-glow green-glow"></div>
                <div className="card-inner p-8">
                  <div className="header-section mb-8">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text mb-2 text-center">
                      Present Students
                    </h3>
                    <div className="w-24 h-1 mx-auto bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"></div>
                    <p className="text-emerald-300 text-lg font-semibold text-center mt-2">
                      Total: <span className="text-2xl">{attendance.length}</span>
                    </p>
                  </div>
                  
                  {attendance.length === 0 ? (
                    <div className="empty-state text-center py-16">
                      <div className="empty-icon">👥</div>
                      <p className="text-gray-400 text-xl font-medium mt-4">
                        No students captured yet
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Click "Capture Students" to start
                      </p>
                    </div>
                  ) : (
                    <div className="attendance-list">
                      {attendance.map((student, i) => (
                        <div key={i} className="student-item">
                          <span className="student-number">{i + 1}</span>
                          <span className="student-name">{student}</span>
                          <div className="status-dot green"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Bar */}
            <div className="neo-status-bar max-w-xl mx-auto">
              <div className="status-content">
                <div className="status-light"></div>
                <span>Face Recognition System Active</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MESSY CHAOTIC ULTRA-SLOW GALAXY EFFECT */}
      <style jsx>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(40px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }

        /* GALAXY BACKGROUND */
        .space-bg {
          position: fixed;
          inset: 0;
          background: 
            radial-gradient(ellipse 30% 50% at 20% 30%, rgba(0, 255, 255, 0.08), transparent 50%),
            radial-gradient(ellipse 25% 40% at 80% 70%, rgba(140, 0, 255, 0.06), transparent 50%),
            radial-gradient(ellipse 20% 30% at 50% 90%, rgba(0, 255, 200, 0.05), transparent 50%),
            #02010a;
          overflow: hidden;
        }

        /* 7 MESSY CHAOTIC LAYERS - RANDOM DIRECTIONS */
        .stars-layer-1, .stars-layer-2, .stars-layer-3, .stars-layer-4,
        .stars-layer-5, .stars-layer-6, .stars-layer-7 {
          position: absolute;
          width: 500%;
          height: 500%;
          background-size: 120px 120px;
          pointer-events: none;
          z-index: 1;
        }

        /* LEFT → RIGHT MOVERS */
        .stars-layer-1 {
          background-image: 
            radial-gradient(2.5px 2.5px at 15px 20px, #fff, transparent),
            radial-gradient(2px 2px at 45px 35px, rgba(255,255,200,0.95), transparent),
            radial-gradient(1.8px 1.8px at 70px 50px, #fff, transparent),
            radial-gradient(2.2px 2.2px at 95px 25px, rgba(255,255,255,0.9), transparent);
          animation: drift-left-to-right 200s linear infinite;
          opacity: 0.95;
        }

        /* RIGHT → LEFT (OPPOSITE) */
        .stars-layer-2 {
          background-image: 
            radial-gradient(2.2px 2.2px at 20px 30px, rgba(255,200,255,0.9), transparent),
            radial-gradient(1.8px 1.8px at 50px 60px, #fff, transparent),
            radial-gradient(2px 2px at 80px 40px, rgba(255,255,255,0.85), transparent);
          animation: drift-right-to-left 220s ease-in-out infinite reverse;
          opacity: 0.9;
        }

        /* DOWNWARD DRIFT */
        .stars-layer-3 {
          background-image: 
            radial-gradient(1.5px 1.5px at 25px 15px, rgba(200,255,255,0.8), transparent),
            radial-gradient(1.2px 1.2px at 55px 45px, #fff, transparent),
            radial-gradient(1.8px 1.8px at 85px 65px, rgba(255,255,150,0.7), transparent);
          animation: drift-downward 250s linear infinite;
          opacity: 0.85;
        }

        /* UPWARD (CROSSING) */
        .stars-layer-4 {
          background-image: 
            radial-gradient(1.8px 1.8px at 30px 55px, rgba(255,150,255,0.75), transparent),
            radial-gradient(1.5px 1.5px at 60px 70px, #fff, transparent),
            radial-gradient(1.2px 1.2px at 90px 20px, rgba(150,255,200,0.7), transparent);
          animation: drift-upward 280s ease-in-out infinite reverse;
          opacity: 0.8;
        }

        /* DIAGONAL ↘️ */
        .stars-layer-5 {
          background-image: 
            radial-gradient(1.2px 1.2px at 35px 25px, rgba(255,255,100,0.65), transparent),
            radial-gradient(1.6px 1.6px at 65px 55px, #fff, transparent),
            radial-gradient(1.4px 1.4px at 95px 75px, rgba(100,255,255,0.6), transparent);
          animation: drift-diagonal-se 320s linear infinite;
          opacity: 0.75;
        }

        /* DIAGONAL ↖️ (CROSS) */
        .stars-layer-6 {
          background-image: 
            radial-gradient(1.6px 1.6px at 40px 65px, rgba(255,100,150,0.7), transparent),
            radial-gradient(1.3px 1.3px at 70px 85px, #fff, transparent),
            radial-gradient(1.1px 1.1px at 100px 35px, rgba(150,200,255,0.65), transparent);
          animation: drift-diagonal-nw 350s ease-in-out infinite reverse;
          opacity: 0.7;
        }

        /* CHAOTIC BOUNCE */
        .stars-layer-7 {
          background-image: 
            radial-gradient(1px 1px at 45px 40px, rgba(255,255,255,0.5), transparent),
            radial-gradient(0.9px 0.9px at 75px 60px, rgba(200,255,150,0.45), transparent),
            radial-gradient(1.3px 1.3px at 105px 80px, #fff, transparent);
          animation: chaotic-bounce 400s linear infinite;
          opacity: 0.6;
        }

        /* MESSY RANDOM DIRECTION ANIMATIONS */
        @keyframes drift-left-to-right {
          0% { transform: translateX(-100%) translateY(0px) rotate(0deg); }
          100% { transform: translateX(100%) translateY(20px) rotate(360deg); }
        }

        @keyframes drift-right-to-left {
          0% { transform: translateX(100%) translateY(-10px) rotate(0deg); }
          100% { transform: translateX(-100%) translateY(30px) rotate(-360deg); }
        }

        @keyframes drift-downward {
          0% { transform: translateY(-100%) translateX(10px) rotate(0deg); }
          100% { transform: translateY(100%) translateX(-15px) rotate(180deg); }
        }

        @keyframes drift-upward {
          0% { transform: translateY(100%) translateX(-20px) rotate(180deg); }
          100% { transform: translateY(-100%) translateX(25px) rotate(360deg); }
        }

        @keyframes drift-diagonal-se {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          25% { transform: translate(20%, 10%) rotate(90deg); }
          50% { transform: translate(50%, 40%) rotate(180deg); }
          75% { transform: translate(10%, 60%) rotate(270deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes drift-diagonal-nw {
          0% { transform: translate(60%, 50%) rotate(0deg); }
          25% { transform: translate(-20%, 40%) rotate(-90deg); }
          50% { transform: translate(-40%, 10%) rotate(-180deg); }
          75% { transform: translate(30%, -20%) rotate(-270deg); }
          100% { transform: translate(60%, 50%) rotate(-360deg); }
        }

        @keyframes chaotic-bounce {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          20% { transform: translate(40px, -30px) rotate(120deg) scale(1.1); }
          40% { transform: translate(-25px, 50px) rotate(240deg) scale(0.9); }
          60% { transform: translate(35px, 20px) rotate(360deg) scale(1.05); }
          80% { transform: translate(-15px, -40px) rotate(480deg) scale(0.95); }
          100% { transform: translate(0, 0) rotate(720deg) scale(1); }
        }

        /* ALL OTHER STYLES REMAIN IDENTICAL */
        .neo-3d-card,
        .neo-3d-card-header,
        .neo-3d-card-attendance,
        .neo-3d-camera-container,
        .neo-status-bar {
          position: relative;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(24px) saturate(180%);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05);
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 10;
        }

        .neo-3d-card:hover,
        .neo-3d-card-header:hover,
        .neo-3d-card-attendance:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 35px 70px -12px rgba(0, 255, 255, 0.25),
            0 0 0 1px rgba(0, 255, 255, 0.15);
        }

        .neo-glow {
          position: absolute;
          inset: -2px;
          z-index: -1;
          border-radius: 26px;
          opacity: 0;
          transition: all 0.4s ease;
          filter: blur(8px);
        }

        .neo-3d-card:hover .neo-glow,
        .neo-3d-card-header:hover .neo-glow,
        .neo-3d-card-attendance:hover .neo-glow {
          opacity: 1;
        }

        .cyan-glow { box-shadow: 0 0 32px rgba(0, 212, 255, 0.4); }
        .blue-glow { box-shadow: 0 0 32px rgba(59, 130, 246, 0.4); }
        .green-glow { box-shadow: 0 0 32px rgba(16, 185, 129, 0.4); }
        .camera-glow { box-shadow: 0 0 48px rgba(0, 212, 255, 0.6); }

        .card-inner { position: relative; z-index: 2; }

        .neo-input {
          width: 100%;
          padding: 1.25rem 1.75rem;
          background: rgba(30, 41, 59, 0.8);
          border: 2px solid rgba(100, 116, 139, 0.4);
          border-radius: 16px;
          color: white;
          font-size: 1rem;
          font-weight: 500;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .neo-input:focus {
          border-color: rgba(0, 212, 255, 0.6);
          box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.15);
          background: rgba(30, 41, 59, 0.95);
        }

        .neo-3d-button {
          position: relative;
          padding: 1.25rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          min-height: 60px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-transform: uppercase;
          letter-spacing: 0.025em;
          overflow: hidden;
          flex: 1;
        }

        .neo-3d-button:hover:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.15);
        }

        .cyan-gradient {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          box-shadow: 0 10px 25px rgba(6, 182, 212, 0.3);
        }
        .green-gradient {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
        }
        .yellow-gradient {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);
        }
        .blue-gradient {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }
        .saved-gradient {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
        }

        .count-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          backdrop-filter: blur(10px);
        }

        .neo-3d-camera-container { max-width: 1200px; }
        .camera-frame { position: relative; padding: 3rem; border-radius: 24px; }
        .neo-video {
          width: 100%; height: 650px; max-height: 70vh;
          object-fit: cover; border-radius: 24px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .live-indicator {
          position: absolute; top: 2.5rem; right: 2.5rem;
          background: rgba(16, 185, 129, 0.95); backdrop-filter: blur(12px);
          padding: 0.75rem 1.5rem; border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex; align-items: center; gap: 0.75rem;
          font-weight: 700; font-size: 0.95rem;
          text-transform: uppercase; letter-spacing: 0.05em;
        }

        .pulse-dot {
          width: 14px; height: 14px; background: #10b981;
          border-radius: 50%; animation: pulse 1.5s infinite;
        }

        .control-panel { padding: 0 2rem; }
        .buttons-row {
          display: flex; gap: 1.5rem; justify-content: center;
          max-width: 1200px; margin: 0 auto; flex-wrap: nowrap;
        }

        .info-tag {
          padding: 0.75rem 1.75rem; border-radius: 50px;
          font-size: 0.95rem; font-weight: 600;
          backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .cyan-tag { background: rgba(6, 182, 212, 0.15); border-color: rgba(6, 182, 212, 0.4); }
        .blue-tag { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.4); }

        .attendance-list { max-height: 450px; overflow-y: auto; padding-right: 1rem; }
        .attendance-list::-webkit-scrollbar { width: 6px; }
        .attendance-list::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 3px; }
        .attendance-list::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(16, 185, 129, 0.6), rgba(5, 150, 105, 0.6));
          border-radius: 3px;
        }

        .student-item {
          display: flex; align-items: center; gap: 1.25rem;
          padding: 1.25rem 1.75rem; margin-bottom: 1rem;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 16px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(12px);
        }
        .student-item:hover {
          background: rgba(16, 185, 129, 0.2);
          transform: translateX(8px);
          box-shadow: 0 12px 30px rgba(16, 185, 129, 0.25);
        }

        .student-number {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 1rem; flex-shrink: 0;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }
        .student-name { flex: 1; font-weight: 500; font-size: 1.1rem; }
        .status-dot.green {
          width: 12px; height: 12px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.6); flex-shrink: 0;
        }

        .neo-status-bar { max-width: 500px; padding: 1.5rem 2rem; }
        .status-content {
          display: flex; align-items: center; justify-content: center;
          gap: 1rem; font-size: 0.95rem; font-weight: 500;
        }
        .status-light {
          width: 12px; height: 12px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%; animation: statusPulse 2s infinite;
        }

        .error-card {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px; padding: 1.25rem;
          backdrop-filter: blur(12px);
        }
        .empty-state .empty-icon {
          font-size: 5rem; margin-bottom: 1.5rem; opacity: 0.4;
        }

        @media (max-width: 1200px) { .buttons-row { flex-direction: column; gap: 1rem; } }
        @media (max-width: 768px) {
          .neo-video { height: 400px; }
          .camera-frame { padding: 2rem 1.5rem; }
          .control-panel { padding: 0 1rem; }
          .buttons-row { flex-direction: column; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }
        @keyframes statusPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.8); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
