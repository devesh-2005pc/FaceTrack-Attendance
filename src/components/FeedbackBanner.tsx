type FeedbackBannerProps = {
  title: string
  description?: string
  variant?: 'error' | 'success' | 'info'
}

const variantStyles: Record<NonNullable<FeedbackBannerProps['variant']>, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-green-200 bg-green-50 text-green-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
}

export default function FeedbackBanner({ title, description, variant = 'info' }: FeedbackBannerProps) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${variantStyles[variant]}`} role="status" aria-live="polite">
      <div className="font-semibold">{title}</div>
      {description ? <div className="text-xs opacity-80">{description}</div> : null}
    </div>
  )
}
