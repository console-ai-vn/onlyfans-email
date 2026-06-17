import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

// ── Types ─────────────────────────────────────────────────────────

export interface DMConversation {
  id: string
  partnerEmail: string
  partnerName: string
  partnerAvatar?: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  online: boolean
  lastSeen?: string
}

export interface DMMessage {
  id: string
  conversationId: string
  senderEmail: string
  recipientEmail: string
  text: string
  attachmentUrl?: string
  timestamp: string
  status: "sent" | "delivered" | "read"
}

// ── Query Keys ────────────────────────────────────────────────────

export const dmKeys = {
  all: ["dm"] as const,
  conversations: () => ["dm", "conversations"] as const,
  messages: (conversationId: string) => ["dm", "messages", conversationId] as const,
  online: (userEmail: string) => ["dm", "online", userEmail] as const,
}

// ── Queries ───────────────────────────────────────────────────────

/**
 * Fetch list of DM conversations for the current user.
 */
export function useConversations() {
  return useQuery({
    queryKey: dmKeys.conversations(),
    queryFn: async () => {
      const res = await fetch("/api/v1/dm/conversations")
      if (!res.ok) throw new Error("Failed to fetch conversations")
      return res.json() as Promise<DMConversation[]>
    },
    refetchInterval: 15_000, // refresh every 15s
  })
}

/**
 * Fetch messages for a specific conversation.
 */
export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: conversationId ? dmKeys.messages(conversationId) : ["dm", "messages", "_disabled"],
    queryFn: async () => {
      const res = await fetch(`/api/v1/dm/messages/${encodeURIComponent(conversationId!)}`)
      if (!res.ok) throw new Error("Failed to fetch messages")
      return res.json() as Promise<DMMessage[]>
    },
    enabled: !!conversationId,
    refetchInterval: 10_000,
  })
}

/**
 * Mutation to send a DM message (REST fallback when WS fails).
 */
export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      conversationId: string
      recipient: string
      text: string
      attachmentUrl?: string
    }) => {
      const res = await fetch("/api/v1/dm/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to send message")
      return res.json() as Promise<{ id: string }>
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: dmKeys.messages(variables.conversationId) })
      qc.invalidateQueries({ queryKey: dmKeys.conversations() })
    },
  })
}

/**
 * Poll online status for a user (30s interval).
 */
export function useOnlineStatus(userEmail: string | undefined) {
  return useQuery({
    queryKey: userEmail ? dmKeys.online(userEmail) : ["dm", "online", "_disabled"],
    queryFn: async () => {
      const res = await fetch(`/api/v1/dm/online/${encodeURIComponent(userEmail!)}`)
      if (!res.ok) return { online: false, lastSeen: "" }
      return res.json() as Promise<{ online: boolean; lastSeen: string }>
    },
    enabled: !!userEmail,
    refetchInterval: 30_000,
  })
}
