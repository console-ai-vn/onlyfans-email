import { useCallback, useEffect, useRef, useState } from "react"

interface DMMessage {
  id: string
  conversationId: string
  senderEmail: string
  recipientEmail: string
  text: string
  attachmentUrl?: string
  timestamp: string
  status: "sent" | "delivered" | "read"
}

interface TypingEvent {
  type: "typing.start" | "typing.stop"
  user: string
  conversationId: string
}

interface MessageEvent {
  type: "message.new"
  message: DMMessage
}

type DMEvent = TypingEvent | MessageEvent

interface UseDMReturn {
  sendMessage: (recipient: string, text: string, attachmentUrl?: string) => void
  messages: DMMessage[]
  isConnected: boolean
  isTyping: boolean
  sendTyping: (conversationId: string) => void
}

const RECONNECT_BACKOFF = [1000, 2000, 4000, 8000, 16000, 30000]
const POLL_INTERVAL = 30_000 // 30s fallback polling

/**
 * WebSocket hook for real-time DM messaging.
 * Reuses LiveDO WebSocket infrastructure (wss://box.onyx.com.vn/api/v1/dm/ws).
 * Falls back to polling GET /api/v1/dm/messages every 30s.
 */
export function useDM(userEmail: string): UseDMReturn {
  const [messages, setMessages] = useState<DMMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const backoffIdx = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pollTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const activeConversation = useRef<string | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = location.protocol === "https:" ? "wss:" : "ws:"
    const host = location.host
    const wsUrl = `${protocol}//${host}/api/v1/dm/ws?user=${encodeURIComponent(userEmail)}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        backoffIdx.current = 0
        // Stop polling once WS is connected
        if (pollTimer.current) {
          clearInterval(pollTimer.current)
          pollTimer.current = undefined
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        wsRef.current = null
        scheduleReconnect()
      }

      ws.onerror = () => {
        wsRef.current?.close()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as DMEvent
          if (data.type === "message.new") {
            setMessages((prev) => {
              // Deduplicate by id
              if (prev.some((m) => m.id === data.message.id)) return prev
              return [...prev, data.message]
            })
          } else if (data.type === "typing.start") {
            setIsTyping(true)
          } else if (data.type === "typing.stop") {
            setIsTyping(false)
          }
        } catch {
          // Ignore malformed messages
        }
      }
    } catch {
      scheduleReconnect()
    }
  }, [userEmail])

  const scheduleReconnect = useCallback(() => {
    const delay = RECONNECT_BACKOFF[Math.min(backoffIdx.current, RECONNECT_BACKOFF.length - 1)]
    backoffIdx.current++
    reconnectTimer.current = setTimeout(connect, delay)
  }, [connect])

  // Connect on mount, cleanup on unmount
  useEffect(() => {
    connect()

    // Fallback polling (only if WS is disconnected)
    pollTimer.current = setInterval(async () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return
      try {
        const res = await fetch("/api/v1/dm/messages")
        if (res.ok) {
          const data = await res.json() as { messages: DMMessage[] }
          if (data.messages?.length) {
            setMessages((prev) => {
              const existing = new Set(prev.map((m) => m.id))
              const latest = data.messages.filter((m) => !existing.has(m.id))
              if (!latest.length) return prev
              // Sort by timestamp descending
              return [...prev, ...latest].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
              )
            })
          }
        }
      } catch {
        // Poll failure is expected — ignore
      }
    }, POLL_INTERVAL)

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (pollTimer.current) clearInterval(pollTimer.current)
      wsRef.current?.close(1000, "component unmount")
      wsRef.current = null
    }
  }, [connect])

  const sendMessage = useCallback(
    (recipient: string, text: string, attachmentUrl?: string) => {
      const optimisticId = crypto.randomUUID()
      const optimistic: DMMessage = {
        id: optimisticId,
        conversationId: activeConversation.current ?? "",
        senderEmail: userEmail,
        recipientEmail: recipient,
        text,
        attachmentUrl,
        timestamp: new Date().toISOString(),
        status: "sent",
      }

      // Optimistic add
      setMessages((prev) => [...prev, optimistic])

      // Try WS first
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "message.send",
            recipient,
            text,
            attachmentUrl,
          }),
        )
      } else {
        // Fallback to REST POST
        fetch("/api/v1/dm/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: activeConversation.current,
            recipient,
            text,
            attachmentUrl,
          }),
        })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json() as { id: string }
              // Replace optimistic with confirmed
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === optimisticId ? { ...m, id: data.id, status: "delivered" as const } : m,
                ),
              )
            } else {
              // Mark optimistic as failed (grey out)
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === optimisticId
                    ? { ...m, status: "sent" as const, text: `[Failed to send] ${m.text}` }
                    : m,
                ),
              )
            }
          })
          .catch(() => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === optimisticId
                  ? { ...m, status: "sent" as const, text: `[Failed to send] ${m.text}` }
                  : m,
              ),
            )
          })
      }
    },
    [userEmail],
  )

  const sendTyping = useCallback(
    (conversationId: string) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return
      wsRef.current.send(
        JSON.stringify({
          type: "typing.heartbeat",
          conversationId,
          user: userEmail,
        }),
      )
    },
    [userEmail],
  )

  return {
    sendMessage,
    messages,
    isConnected,
    isTyping,
    sendTyping,
  }
}

// Convenience function for setting active conversation
export function setActiveConversation(ref: React.MutableRefObject<string | null>, id: string | null) {
  ref.current = id
}
