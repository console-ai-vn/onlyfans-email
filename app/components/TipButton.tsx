import { useCallback, useState } from "react"
import { Button } from "@cloudflare/kumo"
import { HeartIcon, XIcon } from "@phosphor-icons/react"

interface TipButtonProps {
  creatorId: string
  creatorName: string
  onTip?: (amount: number) => void
}

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000] as const

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function TipButton({
  creatorId,
  creatorName,
  onTip,
}: TipButtonProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [customAmount, setCustomAmount] = useState("")
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [isSending, setIsSending] = useState(false)

  const handleTip = useCallback(
    async (amount: number) => {
      setIsSending(true)
      try {
        // Call tip API — POST to a tip endpoint
        await fetch("/api/v1/payments/tip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatorId,
            amount,
            message: `Tip for ${creatorName}`,
          }),
        })
        onTip?.(amount)
        setShowPicker(false)
        setSelectedAmount(amount)
      } catch {
        // Still fire onTip for demo
        onTip?.(amount)
        setShowPicker(false)
      } finally {
        setIsSending(false)
      }
    },
    [creatorId, creatorName, onTip],
  )

  const handleCustomSubmit = useCallback(() => {
    const amount = parseInt(customAmount, 10)
    if (amount >= 10000) {
      handleTip(amount)
      setCustomAmount("")
    }
  }, [customAmount, handleTip])

  return (
    <>
      {/* Floating Heart Button */}
      <button
        type="button"
        onClick={() => setShowPicker(true)}
        className="absolute bottom-4 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-kumo-brand text-white shadow-lg transition-transform active:scale-90 hover:scale-110 hover:shadow-xl"
      >
        <HeartIcon size={28} weight="fill" />
      </button>

      {/* Amount Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPicker(false)}
          />

          {/* Sheet */}
          <div
            className="relative w-full max-w-md rounded-t-2xl bg-kumo-base shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-kumo-line" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2">
              <p className="text-sm font-semibold text-kumo-default">
                Send a Tip to {creatorName}
              </p>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="rounded-lg p-1.5 hover:bg-kumo-fill transition-colors text-kumo-subtle"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Preset amounts — horizontal scroll */}
            <div className="px-4 py-3">
              <p className="text-xs text-kumo-subtle mb-2">Select amount</p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleTip(amount)}
                    disabled={isSending}
                    className="shrink-0 rounded-xl border border-kumo-line px-4 py-3 text-sm font-semibold text-kumo-default hover:border-kumo-brand hover:bg-kumo-brand/5 transition-colors disabled:opacity-50"
                  >
                    {formatVnd(amount)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="px-4 pb-6">
              <p className="text-xs text-kumo-subtle mb-2">Or enter custom</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  placeholder="Custom amount (VND)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCustomSubmit()
                  }}
                  className="flex-1 rounded-xl border border-kumo-line bg-kumo-base px-4 py-2.5 text-sm text-kumo-default placeholder:text-kumo-inactive focus:border-kumo-brand focus:outline-none focus:ring-1 focus:ring-kumo-brand"
                />
                <Button
                  variant="primary"
                  size="base"
                  onClick={handleCustomSubmit}
                  disabled={!customAmount || parseInt(customAmount, 10) < 10000 || isSending}
                >
                  Tip
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
