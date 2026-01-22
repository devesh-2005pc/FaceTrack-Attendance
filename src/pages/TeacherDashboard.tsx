import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import SignatureCanvas from 'react-signature-canvas';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Link as LinkIcon, Lock, Plus, History, Share2, ArrowLeft, Download } from 'lucide-react';
import { useNotifications } from '@/lib/notifications';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

type Session = {
  id: string;
  branch: string;
  year: string;
  class_name: string;
  division: string;
  subject: string;
  timing: string;
  status: 'active' | 'closed';
};

type AttendanceRecord = {
  student_id: string;
  name: string;
  roll_no: string;
  timestamp: string;
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { showNotification } = useNotifications();
  const [view, setView] = useState<'menu' | 'new' | 'tracking'>('menu');
  const [sessionData, setSessionData] = useState({
    branch: 'COMPUTER', year: '', class_name: '', division: '', subject: '', timing: new Date().toISOString()
  });
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof AttendanceRecord; direction: 'asc' | 'desc' } | null>(null);

  const sigPad = useRef<SignatureCanvas>(null);
  const sigContainerRef = useRef<HTMLDivElement>(null);
  const [sigWidth, setSigWidth] = useState(500);

  // 1. Session Lifecycle
  useEffect(() => {
    const saved = localStorage.getItem('current_session');
    if (saved) {
      setCurrentSession(JSON.parse(saved));
      setView('tracking');
    }
  }, []);

  useEffect(() => {
    if (sigContainerRef.current) {
      setSigWidth(sigContainerRef.current.offsetWidth);
    }
    
    const handleResize = () => {
      if (sigContainerRef.current) {
        setSigWidth(sigContainerRef.current.offsetWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view]);

  // Dropdown Options
  const [branches, setBranches] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [classrooms, setClassrooms] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [detectedSemester, setDetectedSemester] = useState<string>('');

  useEffect(() => {
    const fetchOptions = async () => {
      const { data: b } = await supabase.from('branches').select('name');
      if (b) setBranches(b.map(i => i.name));
      
      const { data: y } = await supabase.from('academic_years').select('name');
      if (y) setYears(y.map(i => i.name));
      
      const { data: d } = await supabase.from('divisions').select('name');
      if (d) setDivisions(d.map(i => i.name));

      const { data: c } = await supabase.from('classrooms').select('room_no');
      if (c) setClassrooms(c.map(i => i.room_no));
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!sessionData.branch || !sessionData.year) {
        setSubjects([]);
        return;
      }
      
      // Calculate semester
      const month = new Date().getMonth(); // 0-11 (Jan=0, Dec=11)
      const isJanJune = month <= 5;
      
      let semester = '';
      if (sessionData.year === 'TE') {
        semester = isJanJune ? 'VI' : 'V';
      } else if (sessionData.year === 'BE') {
        semester = isJanJune ? 'VIII' : 'VII';
      } else if (sessionData.year === 'SE') {
        semester = isJanJune ? 'IV' : 'III';
      } else if (sessionData.year === 'FE') {
        semester = isJanJune ? 'II' : 'I';
      }
      
      setDetectedSemester(semester);

      if (semester) {
        const { data: s } = await supabase
          .from('subjects')
          .select('code, name')
          .eq('branch', sessionData.branch)
          .eq('year', sessionData.year)
          .eq('semester', semester);
          
        if (s) setSubjects(s.map(i => `${i.code}: ${i.name}`));
        else setSubjects([]);
      } else {
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, [sessionData.branch, sessionData.year]);

  // 1. Create Session
  const createSession = async () => {
    // Validate inputs
    if (!sessionData.branch || !sessionData.year || !sessionData.class_name || !sessionData.division || !sessionData.subject) {
      showNotification('error', 'Missing session details', 'Fill in all fields before starting a session');
      return;
    }

    // const { data: { user } } = await supabase.auth.getUser();
    const userStr = localStorage.getItem('teacher');
    if (!userStr) {
      showNotification('error', 'Not signed in', 'Please login before starting a session');
      return;
    }
    let user = JSON.parse(userStr);

    console.log('Creating session with data:', { ...sessionData, teacher_id: user.id });

    try {
      const response = await fetch(`http://${window.location.hostname}:8000/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sessionData, teacher_id: user.id, status: 'active' })
      });

      const resData = await response.json();

      if (response.ok && resData.status === 'success') {
        setCurrentSession(resData.session);
        setView('tracking');
        showNotification('success', 'Session started', 'Live attendance tracking is active');
      } else {
        throw new Error(resData.detail || 'Failed to create session');
      }
    } catch (err: any) {
      console.error('Session Creation Error:', err);
      showNotification('error', 'Session creation failed', err.message);
    }
  };

  const fetchAttendanceList = async (sessionId: string) => {
    try {
      const response = await fetch(`http://${window.location.hostname}:8000/api/history?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        const records = Array.isArray(data) ? data : (data.records || []);
        setAttendanceList(records.map((r: any) => ({
          student_id: r.student_id || r.id,
          name: r.student_name || r.name,
          roll_no: r.roll_no,
          timestamp: r.timestamp || r.date || new Date().toISOString()
        })));
      }
    } catch (err) {
      console.error('Failed to fetch attendance list:', err);
    }
  };

  // 2. Realtime WebSocket Updates
  useEffect(() => {
    if (!currentSession?.id || view !== 'tracking') return;

    fetchAttendanceList(currentSession.id);

    // WebSocket (Instant Updates)
    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/attendance/${currentSession.id}`);
    
    ws.onmessage = (event) => {
      console.log('WS Message Received:', event.data);
      const data = JSON.parse(event.data);
      if (data.status === 'success' || data.status === 'already_marked') {
        const student = data.student || data.data; // Handle both formats
        if (!student) return;

        setAttendanceList(prev => {
           // Prevent duplicates
           if (prev.some(r => r.roll_no === student.roll_no)) return prev;
           
           return [{
             student_id: student.id || student.student_id, 
             name: student.name || student.student_name,
             roll_no: student.roll_no,
             timestamp: new Date().toISOString()
           }, ...prev];
        });
      }
    };

    return () => {
      ws.close();
    };
  }, [currentSession?.id, view]);

  // 3. Finalize
  const handleSort = (key: keyof typeof attendanceList[0]) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedAttendance = useMemo(() => {
    if (!sortConfig) return attendanceList;
    return [...attendanceList].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [attendanceList, sortConfig]);

  const closeSession = async () => {
    if (!currentSession || sigPad.current?.isEmpty()) {
      showNotification('error', 'Signature required', 'Please sign before closing the session');
      return;
    }
    
    const sigData = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
    
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'closed', teacher_signature: sigData })
      .eq('id', currentSession.id);
      
    if (error) showNotification('error', 'Close session failed', error.message);
    else {
      showNotification('success', 'Session closed', 'Attendance has been saved');
      setView('menu');
      setAttendanceList([]);
      setCurrentSession(null);
    }
  };

  const exportData = (format: 'csv' | 'xlsx' | 'pdf') => {
    if (attendanceList.length === 0) {
      showNotification('error', 'No data to export', 'Awaiting student check-ins');
      return;
    }

    const fileName = `Attendance_${currentSession?.subject.split(':')[0]}_${currentSession?.division}_${new Date().toLocaleDateString()}`;
    const data = attendanceList.map(r => ({
      'Roll No': r.roll_no,
      'Name': r.name,
      'Time': new Date(r.timestamp).toLocaleTimeString(),
      'Status': 'Present'
    }));

    if (format === 'csv' || format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      XLSX.writeFile(wb, `${fileName}.${format}`);
    } else if (format === 'pdf') {
      const doc = new jsPDF() as any;
      doc.setFontSize(18);
      doc.text('Attendance Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`Subject: ${currentSession?.subject}`, 14, 30);
      doc.text(`Branch/Div: ${currentSession?.branch} - ${currentSession?.division}`, 14, 35);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 40);
      
      doc.autoTable({
        startY: 50,
        head: [['Roll No', 'Name', 'Time', 'Status']],
        body: data.map(r => [r['Roll No'], r['Name'], r['Time'], r['Status']]),
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }
      });
      
      doc.save(`${fileName}.pdf`);
    }
    showNotification('success', 'Export successful', `Downloaded ${format.toUpperCase()} file`);
  };

  if (view === 'menu') {
    return (
      <div className="p-6 max-w-md mx-auto space-y-10 min-h-screen flex flex-col justify-center bg-white">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">
            Faculty<br/>Dashboard
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Select an action to continue
          </p>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={() => setView('new')}
            className="w-full flex items-center justify-between p-8 bg-blue-600 text-white rounded-[2rem] shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 group"
          >
            <div className="text-left">
              <div className="font-black text-xs uppercase tracking-widest opacity-60 mb-1">Attendance</div>
              <div className="font-black text-2xl tracking-tighter">New Session</div>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl group-active:scale-90 transition-transform">
              <Plus size={28} />
            </div>
          </button>

          <button 
            onClick={() => navigate('/history')}
            className="w-full flex items-center justify-between p-8 bg-gray-50 text-gray-900 rounded-[2rem] hover:bg-gray-100 transition-all active:scale-95 group"
          >
            <div className="text-left">
              <div className="font-black text-xs uppercase tracking-widest text-gray-400 mb-1">Records</div>
              <div className="font-black text-2xl tracking-tighter text-gray-800">History</div>
            </div>
            <div className="bg-gray-200 p-4 rounded-2xl group-active:scale-90 transition-transform">
              <History size={28} />
            </div>
          </button>

          <button 
            onClick={() => navigate('/settings')}
            className="w-full flex items-center justify-between p-8 bg-gray-50 text-gray-900 rounded-[2rem] hover:bg-gray-100 transition-all active:scale-95 group"
          >
            <div className="text-left">
              <div className="font-black text-xs uppercase tracking-widest text-gray-400 mb-1">Config</div>
              <div className="font-black text-2xl tracking-tighter text-gray-800">Settings</div>
            </div>
            <div className="bg-gray-200 p-4 rounded-2xl group-active:scale-90 transition-transform">
              <Lock size={28} />
            </div>
          </button>
        </div>

        {/* <div className="pt-10 text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            Production Environment • Secure Access
          </p>
        </div> */}
      </div>
    );
  }

  if (view === 'new') {
    return (
      <div className="min-h-screen bg-white p-6 pb-20">
        <div className="max-w-md mx-auto space-y-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('menu')}
              className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">
                Session<br/>Setup
              </h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Configure Attendance Details
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label htmlFor="branch-select" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Branch</label>
                <select
                  id="branch-select"
                  value={sessionData.branch}
                  onChange={e => setSessionData({...sessionData, branch: e.target.value})}
                  className="w-full bg-gray-50 border-0 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="year-select" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Academic Year</label>
                <select
                  id="year-select"
                  value={sessionData.year}
                  onChange={e => setSessionData({...sessionData, year: e.target.value})}
                  className="w-full bg-gray-50 border-0 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Select Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {detectedSemester && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    Live Semester Detection
                  </p>
                  <p className="text-xs font-black text-blue-800 uppercase tracking-tighter mt-1">
                    Semester {detectedSemester} ({new Date().getMonth() <= 5 ? 'JAN-JUN' : 'JUL-DEC'})
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="classroom-select" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Classroom</label>
                  <select
                    id="classroom-select"
                    value={sessionData.class_name}
                    onChange={e => setSessionData({...sessionData, class_name: e.target.value})}
                    className="w-full bg-gray-50 border-0 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">Select</option>
                    {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="division-select" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Division</label>
                  <select
                    id="division-select"
                    value={sessionData.division}
                    onChange={e => setSessionData({...sessionData, division: e.target.value})}
                    className="w-full bg-gray-50 border-0 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">Select</option>
                    {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="subject-select" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Subject</label>
                <select
                  id="subject-select"
                  value={sessionData.subject}
                  onChange={e => setSessionData({...sessionData, subject: e.target.value})}
                  disabled={subjects.length === 0}
                  className="w-full bg-gray-50 border-0 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={createSession} 
              className="w-full bg-blue-600 text-white p-6 rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all mt-6"
            >
              Launch Live Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/attendance/${currentSession?.id}`;

  return (
    <div className="min-h-screen bg-white p-6 pb-32">
      <div className="max-w-2xl mx-auto space-y-10">
        {/* Active Session Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              {sessionData.subject.split(':')[0]}
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {sessionData.class_name} • DIVISION {sessionData.division}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-full border border-green-100 animate-pulse">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10">
          {/* QR & Link Section */}
          <div className="bg-blue-50 p-10 rounded-[3rem] border border-blue-100 flex flex-col items-center text-center space-y-8 shadow-2xl shadow-blue-50">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-blue-100/50">
              <QRCodeSVG value={shareUrl} size={180} />
            </div>
            
            <div className="space-y-3 w-full">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Access Protocol</p>
              <div className="bg-white/50 py-3 px-4 rounded-2xl">
                <p className="text-[10px] font-bold text-blue-400 break-all font-mono uppercase">{shareUrl}</p>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  if (navigator.vibrate) navigator.vibrate(200);
                  showNotification('success', 'Link Copied!');
                }}
                className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-white py-4 rounded-2xl shadow-sm active:scale-95 transition-all"
              >
                <LinkIcon size={14}/> Copy
              </button>
              
              {typeof navigator.share === 'function' && (
                <button 
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(200);
                    navigator.share({
                      title: 'Join Attendance',
                      text: 'Please mark your attendance',
                      url: shareUrl
                    }).catch(console.error);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 py-4 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all"
                >
                  <Share2 size={14}/> Share
                </button>
              )}
            </div>
          </div>

          {/* Attendance Tracking */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14}/> Scanned Students ({sortedAttendance.length})
              </h3>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                  <button 
                    onClick={() => exportData('csv')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black text-gray-600 hover:text-blue-600 hover:bg-white rounded-xl transition-all uppercase tracking-widest"
                  >
                    <Download size={12}/> CSV
                  </button>
                  <button 
                    onClick={() => exportData('xlsx')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black text-gray-600 hover:text-blue-600 hover:bg-white rounded-xl transition-all uppercase tracking-widest"
                  >
                    <Download size={12}/> Excel
                  </button>
                  <button 
                    onClick={() => exportData('pdf')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black text-gray-600 hover:text-blue-600 hover:bg-white rounded-xl transition-all uppercase tracking-widest"
                  >
                    <Download size={12}/> PDF
                  </button>
                </div>

                {sortConfig && (
                  <button 
                    onClick={() => setSortConfig(null)}
                    className="whitespace-nowrap px-3 py-1.5 text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 rounded-xl"
                  >
                    Clear Sort
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {sortedAttendance.map((record) => (
                <div 
                  key={record.student_id} 
                  className="flex items-center justify-between bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99] animate-in fade-in slide-in-from-bottom-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
                      <img 
                        src={`https://eizhumokwxcmtjczpkuu.supabase.co/storage/v1/object/public/student_faces/COMPUTER/TE 2025-26/A/${record.roll_no}/${record.roll_no}.jpg`}
                        alt={record.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="text-blue-600 font-black text-xs uppercase">ID</div>';
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-lg font-black text-gray-900 tracking-tighter uppercase">{record.roll_no}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{record.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                      {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Verified</p>
                  </div>
                </div>
              ))}
              {attendanceList.length === 0 && (
                <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Awaiting First Identification...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Finalization Section */}
        <div className="bg-gray-900 p-8 rounded-[3rem] shadow-2xl shadow-gray-200 space-y-8">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
              <Lock size={14}/> Security Checkpoint
            </h3>
            <p className="text-2xl font-black text-white tracking-tighter uppercase">End Session</p>
          </div>

          <div className="space-y-4">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Teacher Digital Signature</p>
            <div ref={sigContainerRef} className="bg-white rounded-[2rem] overflow-hidden border-4 border-gray-800">
              <SignatureCanvas 
                ref={sigPad}
                canvasProps={{
                  width: sigWidth, 
                  height: 200, 
                  className: 'sigCanvas cursor-crosshair'
                }} 
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => sigPad.current?.clear()} 
              className="flex-1 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest active:scale-95 transition-transform"
            >
              Clear
            </button>
            <button 
              onClick={closeSession}
              className="flex-[2] bg-blue-600 text-white py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
            >
              Commit to Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );

}
