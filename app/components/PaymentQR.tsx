import { useCallback, useEffect, useRef, useState } from "react"

interface PaymentQRProps {
  qrCode: string
  amount: number
  description: string
  onExpired: () => void
  onManualConfirm?: () => void
}

const DEFAULT_TIMEOUT_SECONDS = 300 // 5 minutes

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function PaymentQR({
  qrCode,
  amount,
  description,
  onExpired,
  onManualConfirm,
}: PaymentQRProps) {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMEOUT_SECONDS)
  const expiredCalled = useRef(false)

  const handleExpired = useCallback(() => {
    if (!expiredCalled.current) {
      expiredCalled.current = true
      onExpired()
    }
  }, [onExpired])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleExpired()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [handleExpired])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`

  if (timeLeft <= 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-kumo-line bg-kumo-recessed p-8 text-center">
        <p className="text-kumo-subtle">QR code has expired</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-kumo-line bg-kumo-base p-6">
      <div className="rounded-lg border border-kumo-line bg-white p-4">
        <img
          src={qrCode}
          alt="VietQR payment code"
          className="h-48 w-48"
        />
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-kumo-default">{formatVnd(amount)}</p>
        <p className="text-sm text-kumo-subtle">{description}</p>
      </div>

      {/* Countdown timer */}
      <div className="text-center">
        <p className="text-xs text-kumo-subtle">QR code expires in</p>
        <p
          className={`text-lg font-mono font-bold tabular-nums ${
            timeLeft < 60 ? "text-red-500" : "text-kumo-default"
          }`}
        >
          {timeDisplay}
        </p>
      </div>

      {/* Manual confirm button */}
      {onManualConfirm && (
        <button
          type="button"
          onClick={onManualConfirm}
          className="mt-1 text-sm font-medium text-kumo-brand hover:text-kumo-brand/80 transition-colors"
        >
          I've paid — check status
        </button>
      )}
    </div>
  )
}
