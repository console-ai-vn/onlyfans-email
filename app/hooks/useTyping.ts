import { useCallback, useEffect, useRef } from "react"

interface UseTypingReturn {
  isPartnerTyping: boolean
  setTyping: (isTyping: boolean) => void
}

/**
 * Typing indicator hook.
 * Sends typing heartbeat every 2s while user is actively typing.
 * Auto-stops after 3s of no input.
 * Reads partner typing state from WebSocket events (via useDM).
 */
export function useTyping(
  userEmail: string,
  recipientEmail: string,
  isPartnerTyping: boolean = false,
): UseTypingReturn {
  const typingTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const stopTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const sendTypingBeat = useCallback(() => {
    // Send typing heartbeat via fetch (polling-friendly)
    fetch("/api/v1/dm/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: userEmail,
        recipient: recipientEmail,
        isTyping: true,
      }),
    }).catch(() => {
      // Non-critical
    })
  }, [userEmail, recipientEmail])

  const sendStopTyping = useCallback(() => {
    fetch("/api/v1/dm/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: userEmail,
        recipient: recipientEmail,
        isTyping: false,
      }),
    }).catch(() => {
      // Non-critical
    })
  }, [userEmail, recipientEmail])

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (isTyping) {
        // Start heartbeat: send typing indicator every 2s
        if (!typingTimer.current) {
          sendTypingBeat()
          typingTimer.current = setInterval(sendTypingBeat, 2000)
        }

        // Reset auto-stop timer (stop after 3s of no calls)
        if (stopTimer.current) clearTimeout(stopTimer.current)
        stopTimer.current = setTimeout(() => {
          sendStopTyping()
          if (typingTimer.current) {
            clearInterval(typingTimer.current)
            typingTimer.current = undefined
          }
        }, 3000)
      } else {
        // Explicit stop
        sendStopTyping()
        if (typingTimer.current) {
          clearInterval(typingTimer.current)
          typingTimer.current = undefined
        }
        if (stopTimer.current) {
          clearTimeout(stopTimer.current)
          stopTimer.current = undefined
        }
      }
    },
    [sendTypingBeat, sendStopTyping],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimer.current) clearInterval(typingTimer.current)
      if (stopTimer.current) clearTimeout(stopTimer.current)
      sendStopTyping()
    }
  }, [sendStopTyping])

  return {
    isPartnerTyping,
    setTyping,
  }
}
