import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Search, FileJson, FileSpreadsheet, Copy, File as FilePdf } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '@/lib/preferences.tsx'
import { useNotifications } from '@/lib/notifications'
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

type HistoryRecord = {
  id: string
  date: string
  student_name: string
  roll_no: string
  branch: string
  division: string
  subject: string
  class_name: string
  status: string
  session_id: string
}

type HistoryFilters = {
  branch: string
  division: string
  subject: string
  status: string
  dateFrom: string
  dateTo: string
}

const filterStorageKey = 'historyFilters'

export default function History() {
  const navigate = useNavigate()
  const { preferences } = usePreferences()
  const { showNotification } = useNotifications()
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: keyof HistoryRecord; direction: 'asc' | 'desc' } | null>(null)
  const [filters, setFilters] = useState<HistoryFilters>({
    branch: 'all',
    division: 'all',
    subject: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  })
  const deferredSearch = useDeferredValue(searchTerm)

  useEffect(() => {
    if (preferences.persistFilters) {
      const raw = localStorage.getItem(filterStorageKey)
      if (raw) {
        try {
          setFilters(current => ({ ...current, ...(JSON.parse(raw) as Partial<HistoryFilters>) }))
        } catch {
          setFilters(current => current)
        }
      }
    }
  }, [preferences.persistFilters])

  useEffect(() => {
    if (preferences.persistFilters) {
      localStorage.setItem(filterStorageKey, JSON.stringify(filters))
    }
  }, [filters, preferences.persistFilters])

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const userStr = localStorage.getItem('teacher')
      let teacherId = null
      if (userStr) {
        const user = JSON.parse(userStr)
        teacherId = user.id
      }

      const url = teacherId
        ? `http://${window.location.hostname}:8000/api/history?teacher_id=${teacherId}`
        : `http://${window.location.hostname}:8000/api/history`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch attendance history')
      }
      const data = await response.json()
      setHistory(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error occurred'
      showNotification('error', 'History Error', msg)
    } finally {
      setLoading(false)
    }
  }

  const branchOptions = useMemo(() => {
    const options = new Set(history.map(record => record.branch))
    return Array.from(options).sort()
  }, [history])

  const divisionOptions = useMemo(() => {
    const options = new Set(history.map(record => record.division))
    return Array.from(options).sort()
  }, [history])

  const statusOptions = useMemo(() => {
    const options = new Set(history.map(record => record.status))
    return Array.from(options).sort()
  }, [history])
  
  const filteredHistory = useMemo(() => {
    return history.filter(record => {
      const matchesSearch = 
        record.student_name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        record.roll_no.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        record.subject.toLowerCase().includes(deferredSearch.toLowerCase())

      const matchesBranch = filters.branch === 'all' || record.branch === filters.branch
      const matchesDivision = filters.division === 'all' || record.division === filters.division
      const matchesStatus = filters.status === 'all' || record.status === filters.status

      return matchesSearch && matchesBranch && matchesDivision && matchesStatus
    })
  }, [history, deferredSearch, filters])

  const sortedHistory = useMemo(() => {
    if (!sortConfig) {
      return filteredHistory
    }

    return [...filteredHistory].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue === bValue) {
        return 0
      }

      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : 1
      } else {
        return aValue > bValue ? -1 : 1
      }
    })
  }, [filteredHistory, sortConfig])



  const copyToClipboard = () => {
    if (sortedHistory.length === 0) {
      showNotification('info', 'No data', 'There is no data to copy.')
      return
    }

    try {
      const csvContent = sortedHistory
        .map(row => `${row.date},${row.student_name},${row.roll_no},${row.subject},${row.status}`)
        .join('\n')
      navigator.clipboard.writeText(csvContent)
      showNotification('success', 'Copied', 'Data copied to clipboard.')
    } catch (err) {
      showNotification('error', 'Copy Failed', 'Unable to copy data to clipboard.')
    }
  }

  const exportCSV = () => {
    if (sortedHistory.length === 0) {
      showNotification('info', 'No data', 'There is no data to export.')
      return
    }

    try {
      const headers = ['Date', 'Time', 'Subject', 'Class', 'Student Name', 'Roll No', 'Status']
      const csvContent = [
        headers.join(','),
        ...sortedHistory.map(row => {
          const dateObj = new Date(row.date)
          return [
            dateObj.toLocaleDateString(),
            dateObj.toLocaleTimeString(),
            `"${row.subject}"`,
            `"${row.class_name} - ${row.division}"`,
            `"${row.student_name}"`,
            row.roll_no,
            row.status,
          ].join(',')
        }),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `attendance_history_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      showNotification('success', 'Export Successful', 'History exported as CSV')
    } catch (err) {
      showNotification('error', 'Export Failed', 'An error occurred while exporting CSV.')
    }
  }

  const exportJSON = () => {
    if (sortedHistory.length === 0) {
      showNotification('info', 'No data', 'There is no data to export.')
      return
    }

    try {
      const jsonContent = JSON.stringify(sortedHistory, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `attendance_history_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      showNotification('success', 'Export Successful', 'History exported as JSON')
    } catch (err) {
      showNotification('error', 'Export Failed', 'An error occurred while exporting JSON.')
    }
  }

  const exportExcel = () => {
    if (sortedHistory.length === 0) {
      showNotification('info', 'No data', 'There is no data to export.')
      return
    }
    try {
      const data = sortedHistory.map(row => ({
        Date: new Date(row.date).toLocaleDateString(),
        Time: new Date(row.date).toLocaleTimeString(),
        Subject: row.subject,
        Class: `${row.class_name} - ${row.division}`,
        Name: row.student_name,
        'Roll No': row.roll_no,
        Status: row.status
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance History');
      XLSX.writeFile(wb, `attendance_history_${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification('success', 'Export Successful', 'History exported as Excel')
    } catch (err) {
      showNotification('error', 'Export Failed', 'An error occurred while exporting Excel.')
    }
  }

  const exportPDF = () => {
    if (sortedHistory.length === 0) {
      showNotification('info', 'No data', 'There is no data to export.')
      return
    }
    try {
      const doc = new jsPDF() as any;
      doc.setFontSize(18);
      doc.text('Attendance History Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      const tableData = sortedHistory.map(row => [
        new Date(row.date).toLocaleDateString(),
        new Date(row.date).toLocaleTimeString(),
        row.subject,
        `${row.class_name} - ${row.division}`,
        row.student_name,
        row.roll_no,
        row.status
      ]);
      
      doc.autoTable({
        startY: 40,
        head: [['Date', 'Time', 'Subject', 'Class', 'Name', 'Roll No', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 8 }
      });
      
      doc.save(`attendance_history_${new Date().toISOString().split('T')[0]}.pdf`);
      showNotification('success', 'Export Successful', 'History exported as PDF')
    } catch (err) {
      showNotification('error', 'Export Failed', 'An error occurred while exporting PDF.')
    }
  }



  return (
    <div className="min-h-screen bg-white p-6 pb-20">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">
                Attendance<br/>Records
              </h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Historical Session Data
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={exportCSV}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-3xl hover:bg-blue-100 transition-all active:scale-95 group"
            >
              <div className="bg-white p-2 rounded-xl group-active:scale-90 transition-transform">
                <FileSpreadsheet size={18} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">CSV</span>
            </button>
            <button
              onClick={exportExcel}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-green-50 text-green-600 rounded-3xl hover:bg-green-100 transition-all active:scale-95 group"
            >
              <div className="bg-white p-2 rounded-xl group-active:scale-90 transition-transform">
                <FileSpreadsheet size={18} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">Excel</span>
            </button>
            <button
              onClick={exportPDF}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-3xl hover:bg-red-100 transition-all active:scale-95 group"
            >
              <div className="bg-white p-2 rounded-xl group-active:scale-90 transition-transform">
                <FilePdf size={18} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">PDF</span>
            </button>
            <button
              onClick={exportJSON}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 text-gray-900 rounded-3xl hover:bg-gray-100 transition-all active:scale-95 group"
            >
              <div className="bg-white p-2 rounded-xl group-active:scale-90 transition-transform">
                <FileJson size={18} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">JSON</span>
            </button>
            <button
              onClick={copyToClipboard}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 text-gray-900 rounded-3xl hover:bg-gray-100 transition-all active:scale-95 group"
            >
              <div className="bg-white p-2 rounded-xl group-active:scale-90 transition-transform">
                <Copy size={18} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">Copy</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="SEARCH BY NAME OR ROLL NO..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-5 bg-gray-50 border-0 rounded-3xl text-xs font-black text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-blue-500 transition-all uppercase tracking-widest"
              aria-label="Search attendance history"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Branch</label>
              <select
                value={filters.branch}
                onChange={e => setFilters(prev => ({ ...prev, branch: e.target.value }))}
                className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="all">All branches</option>
                {branchOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Division</label>
              <select
                value={filters.division}
                onChange={e => setFilters(prev => ({ ...prev, division: e.target.value }))}
                className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="all">All divisions</option>
                {divisionOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Status</label>
              <select
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="all">All statuses</option>
                {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Records ({sortedHistory.length})
            </h3>
            <div className="flex gap-4">
              {searchTerm || filters.branch !== 'all' || filters.division !== 'all' || filters.status !== 'all' ? (
                <button 
                  onClick={() => {
                    setFilters({
                      branch: 'all',
                      division: 'all',
                      subject: 'all',
                      status: 'all',
                      dateFrom: '',
                      dateTo: '',
                    })
                    setSearchTerm('')
                  }}
                  className="text-[9px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
                >
                  Clear Filters
                </button>
              ) : null}
              {sortConfig && (
                <button 
                  onClick={() => setSortConfig(null)}
                  className="text-[9px] font-black text-blue-600 uppercase tracking-widest"
                >
                  Clear Sort
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronizing Records...</p>
            </div>
          ) : sortedHistory.length === 0 ? (
            <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No matching records found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sortedHistory.map(record => (
                <div 
                  key={record.id} 
                  className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm font-black text-gray-900 tracking-tight uppercase">{record.student_name}</div>
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{record.roll_no}</div>
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-green-100">
                      {record.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end pt-4 border-t border-gray-50">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{record.subject}</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {record.class_name} ({record.division})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-black text-gray-900 uppercase tracking-widest">
                        {new Date(record.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                      </div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

}
