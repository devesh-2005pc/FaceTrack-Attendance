import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Webcam from 'react-webcam';
import { CameraOff } from 'lucide-react';
import { useNotifications } from '@/lib/notifications';

const WEBSOCKET_URL = (hostname: string) => `ws://${hostname}:8000/ws/attendance`;

export default function StudentAttendance() {
  const { sessionId } = useParams();
  const { showNotification } = useNotifications();
  const webcamRef = useRef<Webcam>(null);
  const ws = useRef<WebSocket | null>(null);
  
  const [lastMarked, setLastMarked] = useState<string | null>(null);
  const [detectedStudent, setDetectedStudent] = useState<{name: string, roll_no: string} | null>(null);
  const [studentPhoto, setStudentPhoto] = useState<string | null>(null);
  const [facialArea, setFacialArea] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const facialAreaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCameraError = (error: string | DOMException) => {
    console.error('Camera error:', error);
    const msg = typeof error === 'string' ? error : error.message;
    setCameraError(msg);
    showNotification('error', 'Camera Error', 'Please allow camera access to mark attendance');
  };

  useEffect(() => {
    if (!sessionId) return;

    const socket = new WebSocket(`${WEBSOCKET_URL(window.location.hostname)}/${sessionId}`);
    
    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.status === 'success' || data.status === 'already_marked') {
        const student = data.student || data.data;
        if (!student) return;

        // Fetch photo from Supabase Storage
        // Path format: COMPUTER/TE 2025-26/A/{roll_no}/{roll_no}.jpg
        // Note: Roll no in DB might be '030', while folder might be '30' or '030'
        // Based on my migration script, it's 'COMPUTER/TE 2025-26/A/{roll_no}/{roll_no}.jpg'
        const photoPath = `COMPUTER/TE 2025-26/A/${student.roll_no}/${student.roll_no}.jpg`;
        const photoUrl = `https://eizhumokwxcmtjczpkuu.supabase.co/storage/v1/object/public/student_faces/${photoPath}`;
        
        setStudentPhoto(photoUrl);
        setDetectedStudent(student);
        setFacialArea(data.facial_area);
        setLastMarked(student.roll_no);
        
        if (facialAreaTimeout.current) clearTimeout(facialAreaTimeout.current);
        
        // Keep detection UI visible for a bit longer
        facialAreaTimeout.current = setTimeout(() => {
          setDetectedStudent(null);
          setStudentPhoto(null);
          setFacialArea(null);
        }, 2500);

        // Keep lastMarked visible for feedback
        setTimeout(() => {
          setLastMarked(null);
        }, 3000);
      } else if (data.status === 'detected') {
        setFacialArea(data.facial_area);
        
        if (facialAreaTimeout.current) clearTimeout(facialAreaTimeout.current);
        
        // Slightly longer delay than streaming interval to prevent flickering
        facialAreaTimeout.current = setTimeout(() => setFacialArea(null), 250); 
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    ws.current = socket;

    // Fast streaming at 10fps for production performance
    const interval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN && webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          ws.current.send(imageSrc);
        }
      }
    }, 100); 

    return () => {
      clearInterval(interval);
      if (facialAreaTimeout.current) clearTimeout(facialAreaTimeout.current);
      socket.close();
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-between p-6 sm:p-10 overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Attendance</h1>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Session Verification</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors duration-500 ${isConnected ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className={`text-[9px] font-black uppercase tracking-wider ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Main Camera Card */}
      <div 
        className="w-full max-w-[320px] aspect-[3/4] relative rounded-[2rem] overflow-hidden border-[4px] border-zinc-900 shadow-2xl bg-zinc-900 group"
      >
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6 z-40 bg-zinc-900">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <CameraOff size={28} className="text-red-500" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black text-white uppercase tracking-widest">Camera Access Required</p>
              <p className="text-[10px] text-zinc-500 uppercase leading-relaxed font-bold">Please enable your camera to continue</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="text-[10px] font-black text-white bg-white/5 border border-white/10 px-10 py-4 rounded-full active:scale-95 transition-all hover:bg-white/10"
            >
              RETRY CONNECTION
            </button>
          </div>
        ) : (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              onUserMediaError={handleCameraError}
              videoConstraints={{ 
                facingMode: 'user', 
                width: { ideal: 720 },
                height: { ideal: 960 }
              }}
              className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] brightness-110 contrast-110"
            />
            
            {/* Overlay Grid/Markers */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute inset-12 border border-white/5 rounded-[2.5rem]" />
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5" />
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/5" />
              
              {/* Corner Accents */}
              <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-2xl" />
              <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-2xl" />
              <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-2xl" />
              <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-2xl" />
            </div>

            {/* Bounding Box */}
            <div className="absolute inset-0 z-30 pointer-events-none">
              {facialArea && (
                <div 
                  className={`absolute border-[1px] transition-all duration-150 ease-out rounded-lg ${detectedStudent ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'border-blue-500/50'}`}
                  style={{
                    left: `${facialArea.x * 100}%`,
                    top: `${facialArea.y * 100}%`,
                    width: `${facialArea.w * 100}%`,
                    height: `${facialArea.h * 100}%`,
                  }}
                >
                  {detectedStudent && (
                    <div className="absolute -bottom-8 left-0 right-0 flex justify-center">
                      <div className="bg-green-500 text-black px-2 py-0.5 rounded-md text-[8px] font-black uppercase shadow-lg whitespace-nowrap">
                        {detectedStudent.roll_no} • {detectedStudent.name.split(' ')[0]}
                      </div>
                      {studentPhoto && (
                        <img src={studentPhoto} alt="" className="hidden" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-4">
        Position your face within the frame
      </p>

      {/* Footer Status */}
      <div className="w-full max-w-md h-32 flex flex-col items-center justify-center">
        {lastMarked ? (
          <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500">
            <div className="bg-green-500 text-black px-10 py-5 rounded-[2rem] text-sm font-black shadow-[0_20px_50px_rgba(34,197,94,0.3)] uppercase tracking-tight">
              {lastMarked} MARKED PRESENT
            </div>
            <p className="text-[9px] font-black text-green-500 uppercase tracking-widest animate-pulse">Verification Successful</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-full h-full bg-blue-500/50 animate-[shimmer_2s_infinite]" />
            </div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
              Scanning for face...
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
