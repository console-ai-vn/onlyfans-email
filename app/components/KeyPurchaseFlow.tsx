import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@cloudflare/kumo"
import { ArrowLeft, MinusIcon, PlusIcon, XIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

interface KeyPurchaseFlowProps {
  visible: boolean
  keyPrice: number
  onClose: () => void
  onPurchase: () => void
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function KeyPurchaseFlow({
  visible,
  keyPrice,
  onClose,
  onPurchase,
}: KeyPurchaseFlowProps) {
  const [step, setStep] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [animating, setAnimating] = useState(false)
  const [show, setShow] = useState(false)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [txnId, setTxnId] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      setStep(0)
      setQuantity(1)
      setPaid(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true))
      })
    } else {
      setAnimating(false)
      const timer = setTimeout(() => {
        setShow(false)
        setQrUrl(null)
        setTxnId(null)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [visible])

  const total = keyPrice * quantity

  const handleContinue = useCallback(async () => {
    // Generate QR via SePay API — use existing checkout endpoint for simplicity
    try {
      const res = await fetch(
        `/api/v1/payments/qr?amount=${total}&description=Key+purchase+x${quantity}`,
      )
      if (res.ok) {
        const data = await res.json() as { qrCode?: string; url?: string }
        setQrUrl(data.qrCode || data.url || `/api/v1/payments/qr?amount=${total}`)
      } else {
        setQrUrl(`/api/v1/payments/qr?amount=${total}`)
      }
    } catch {
      setQrUrl(`/api/v1/payments/qr?amount=${total}`)
    }
    setStep(1)
  }, [total, quantity])

  // Poll payment status every 3s
  const { data: paymentStatus } = useQuery({
    queryKey: ["key-payment", txnId],
    queryFn: async () => {
      if (!txnId) return null
      const res = await fetch(`/api/v1/payments/invoice/${txnId}`)
      if (!res.ok) return null
      return res.json() as Promise<{ invoice?: { status?: string } }>
    },
    enabled: !!txnId && step === 1,
    refetchInterval: 3000,
  })

  useEffect(() => {
    if (paymentStatus?.invoice?.status === "paid" && !paid) {
      setPaid(true)
      setTimeout(() => {
        onPurchase()
        onClose()
      }, 800)
    }
  }, [paymentStatus, paid, onPurchase, onClose])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          animating ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-kumo-base shadow-2xl transition-transform duration-300 ease-out ${
          animating ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle + Header */}
        <div className="sticky top-0 z-10 bg-kumo-base pt-3">
          <div className="flex justify-center">
            <div className="h-1 w-10 rounded-full bg-kumo-line" />
          </div>
          <div className="flex items-center justify-between px-4 py-2">
            <div>
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="rounded-lg p-1.5 hover:bg-kumo-fill transition-colors text-kumo-subtle"
                >
                  <ArrowLeft size={20} />
                </button>
              ) : (
                <div className="w-10" />
              )}
            </div>
            <p className="text-sm font-semibold text-kumo-default">
              Purchase Keys
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-kumo-fill transition-colors text-kumo-subtle"
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 pb-3">
            <div
              className={`h-1.5 rounded-full transition-all ${
                step === 0 ? "w-6 bg-kumo-brand" : "w-1.5 bg-kumo-line"
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all ${
                step === 1 ? "w-6 bg-kumo-brand" : "w-1.5 bg-kumo-line"
              }`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-8">
          {step === 0 && (
            <div className="flex flex-col items-center">
              <p className="text-center text-kumo-subtle text-sm mb-6">
                Select how many Keys you want to purchase.
                <br />
                <span className="text-kumo-default font-medium">
                  1 Key = {formatVnd(keyPrice)}
                </span>
              </p>

              {/* Quantity selector */}
              <div className="flex items-center gap-6 mb-8">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex size-12 items-center justify-center rounded-full border border-kumo-line bg-kumo-base text-kumo-default hover:bg-kumo-fill transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <MinusIcon size={20} weight="bold" />
                </button>

                <div className="text-center min-w-[60px]">
                  <span className="text-3xl font-bold text-kumo-default tabular-nums">
                    {quantity}
                  </span>
                  <p className="text-xs text-kumo-subtle mt-1">
                    {quantity === 1 ? "Key" : "Keys"}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={quantity >= 20}
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="flex size-12 items-center justify-center rounded-full border border-kumo-line bg-kumo-base text-kumo-default hover:bg-kumo-fill transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <PlusIcon size={20} weight="bold" />
                </button>
              </div>

              {/* Total */}
              <div className="w-full rounded-xl border border-kumo-line bg-kumo-recessed p-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-kumo-subtle">
                    {quantity} Key{quantity > 1 ? "s" : ""}
                  </span>
                  <span className="text-kumo-default font-medium">
                    {formatVnd(total)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm font-semibold border-t border-kumo-line pt-2">
                  <span className="text-kumo-default">Total</span>
                  <span className="text-kumo-brand">{formatVnd(total)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full bg-kumo-brand"
                onClick={handleContinue}
              >
                Continue to Payment
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col items-center">
              <p className="text-center text-kumo-subtle text-sm mb-4">
                Scan the QR code with your banking app to complete payment
              </p>

              {/* QR Code */}
              {qrUrl ? (
                <div className="rounded-xl border border-kumo-line bg-white p-4 mb-4">
                  <img
                    src={qrUrl}
                    alt="VietQR payment code"
                    className="h-52 w-52"
                  />
                </div>
              ) : (
                <div className="h-52 w-52 rounded-xl border border-kumo-line bg-kumo-recessed flex items-center justify-center mb-4">
                  <span className="text-kumo-subtle text-sm animate-pulse">
                    Generating QR...
                  </span>
                </div>
              )}

              <div className="w-full rounded-xl border border-kumo-line bg-kumo-recessed p-4 mb-4 text-center">
                <p className="text-sm font-medium text-kumo-default">
                  {formatVnd(total)}
                </p>
                <p className="text-xs text-kumo-subtle mt-1">
                  {quantity} Key{quantity > 1 ? "s" : ""} ×{" "}
                  {formatVnd(keyPrice)}
                </p>
              </div>

              {/* Polling status */}
              <div className="flex items-center gap-2 text-xs text-kumo-subtle mb-4">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-kumo-brand" />
                Waiting for payment confirmation...
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep(0)
                  setQrUrl(null)
                }}
                className="text-sm text-kumo-subtle hover:text-kumo-default transition-colors"
              >
                Change quantity
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
