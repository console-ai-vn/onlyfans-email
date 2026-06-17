import { useCallback, useState } from "react"
import { useGateCheck, useGateStatus, useGateUnlock } from "~/queries/gate"

export interface PaywallState {
  isGated: boolean
  tier: string
  keyPrice?: number
  requiresSubscription: boolean
  alreadyUnlocked: boolean
  isChecking: boolean
  isUnlocking: boolean
  error: string | null
}

export function usePaywall(mailboxId: string, emailId: string) {
  const [error, setError] = useState<string | null>(null)

  const gateCheck = useGateCheck(mailboxId, emailId)
  const gateStatus = useGateStatus(mailboxId, emailId)
  const gateUnlock = useGateUnlock(mailboxId, emailId)

  const checkData = gateCheck.data
  const isGated = checkData ? !checkData.allowed : false
  const tier =
    checkData?.tier || gateStatus.data?.tier || "public"
  const keyPrice = checkData?.keyPrice ?? gateStatus.data?.keyPrice

  const checkGate = useCallback(async () => {
    setError(null)
    try {
      await gateCheck.refetch()
      await gateStatus.refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check gate")
    }
  }, [gateCheck, gateStatus])

  const unlock = useCallback(
    async (itemId: string) => {
      setError(null)
      try {
        const result = await gateUnlock.mutateAsync(itemId)
        if (!result.success) {
          setError(result.error || "Failed to unlock")
          return false
        }
        await checkGate()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to unlock")
        return false
      }
    },
    [gateUnlock, checkGate],
  )

  return {
    isGated,
    tier,
    keyPrice,
    requiresSubscription: checkData?.requiresSubscription ?? tier === "subscribers",
    alreadyUnlocked: checkData?.alreadyUnlocked ?? gateStatus.data?.alreadyUnlocked ?? false,
    isChecking: gateCheck.isLoading || gateStatus.isLoading,
    isUnlocking: gateUnlock.isPending,
    error,
    checkGate,
    unlock,
  } satisfies PaywallState & {
    checkGate: () => Promise<void>
    unlock: (itemId: string) => Promise<boolean>
  }
}
