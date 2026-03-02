import { useMemo } from 'react'

type AttendancePoint = { timestamp: string }
type AttendanceChartProps = { records: AttendancePoint[] }

const buildBuckets = (records: AttendancePoint[]) => {
  const now = Date.now()
  const bucketCount = 8
  const bucketSizeMs = 60_000
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    start: now - (bucketCount - i) * bucketSizeMs,
    count: 0,
  }))
  records.forEach(r => {
    const time = new Date(r.timestamp).getTime()
    const bucket = buckets.find(b => time >= b.start && time < b.start + bucketSizeMs)
    if (bucket) bucket.count += 1
  })
  return buckets
}

export default function AttendanceChart({ records }: AttendanceChartProps) {
  const buckets = useMemo(() => buildBuckets(records), [records])
  const maxCount = Math.max(1, ...buckets.map(b => b.count))

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900">Live Attendance</h3>
      <svg viewBox="0 0 320 120" className="w-full h-28 mt-2">
        {buckets.map((b, i) => {
          const height = (b.count / maxCount) * 80
          const x = i * 36 + 12
          const y = 100 - height
          return (
            <g key={b.start}>
              <rect x={x} y={y} width={20} height={height} rx={4} className="fill-blue-500" />
              <text x={x + 10} y={108} textAnchor="middle" className="fill-gray-500 text-[10px]">
                {new Date(b.start).toLocaleTimeString('mr-IN', { minute: '2-digit' })}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}