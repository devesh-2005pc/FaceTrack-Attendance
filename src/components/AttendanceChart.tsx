import { useMemo } from 'react'

type AttendancePoint = {
  timestamp: string
}

type AttendanceChartProps = {
  records: AttendancePoint[]
}

const buildBuckets = (records: AttendancePoint[]) => {
  const now = Date.now()
  const bucketCount = 8
  const bucketSizeMs = 60_000
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    start: now - (bucketCount - index) * bucketSizeMs,
    count: 0,
  }))

  records.forEach(record => {
    const time = new Date(record.timestamp).getTime()
    const bucketIndex = buckets.findIndex(bucket => time >= bucket.start && time < bucket.start + bucketSizeMs)
    if (bucketIndex >= 0) {
      buckets[bucketIndex].count += 1
    }
  })

  return buckets
}

export default function AttendanceChart({ records }: AttendanceChartProps) {
  const buckets = useMemo(() => buildBuckets(records), [records])
  const maxCount = Math.max(1, ...buckets.map(bucket => bucket.count))

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Live Attendance Trend</h3>
          <p className="text-xs text-gray-500">Last 8 minutes</p>
        </div>
        <div className="text-xs text-gray-500">Max {maxCount}</div>
      </div>
      <div className="mt-4">
        <svg viewBox="0 0 320 120" className="w-full h-28" role="img" aria-label="Attendance trend chart">
          {buckets.map((bucket, index) => {
            const height = (bucket.count / maxCount) * 80
            const x = index * 36 + 12
            const y = 100 - height
            return (
              <g key={bucket.start}>
                <rect x={x} y={y} width={20} height={height} rx={4} className="fill-blue-500" />
                <text x={x + 10} y={108} textAnchor="middle" className="fill-gray-500 text-[10px]">
                  {new Date(bucket.start).toLocaleTimeString([], { minute: '2-digit' })}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
