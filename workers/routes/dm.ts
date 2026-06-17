import { Hono } from "hono"
import { getLiveStub } from "../lib/live-stub"
import type { Env, AccessVariables } from "../types"

type DMContext = {
  Bindings: Env
  Variables: AccessVariables
}

const app = new Hono<DMContext>()

// ── Mock data helpers ─────────────────────────────────────────────

function mockConversations() {
  return [
    {
      id: "conv-1",
      partnerEmail: "sarah@onyx.com.vn",
      partnerName: "Sarah Chen",
      lastMessage: "Hey! Thanks for subscribing 💕",
      lastMessageAt: new Date(Date.now() - 120_000).toISOString(),
      unreadCount: 2,
      online: true,
    },
    {
      id: "conv-2",
      partnerEmail: "alex@onyx.com.vn",
      partnerName: "Alex Rivera",
      lastMessage: "Check your DM for exclusive content 🔥",
      lastMessageAt: new Date(Date.now() - 3_600_000).toISOString(),
      unreadCount: 5,
      online: true,
    },
    {
      id: "conv-3",
      partnerEmail: "jordan@onyx.com.vn",
      partnerName: "Jordan Taylor",
      lastMessage: "Thanks for the tip! 😘",
      lastMessageAt: new Date(Date.now() - 86_400_000).toISOString(),
      unreadCount: 0,
      online: false,
      lastSeen: "2h",
    },
    {
      id: "conv-4",
      partnerEmail: "morgan@onyx.com.vn",
      partnerName: "Morgan Lee",
      lastMessage: "New post going up tonight 👀",
      lastMessageAt: new Date(Date.now() - 172_800_000).toISOString(),
      unreadCount: 3,
      online: false,
      lastSeen: "1d",
    },
  ]
}

function mockMessages(conversationId: string) {
  const now = Date.now()
  return [
    {
      id: `${conversationId}-msg-1`,
      conversationId,
      senderEmail: `sarah@onyx.com.vn`,
      recipientEmail: "user@onyx.com.vn",
      text: "Hey! Thanks for subscribing 💕",
      timestamp: new Date(now - 10_800_000).toISOString(),
      status: "read" as const,
    },
    {
      id: `${conversationId}-msg-2`,
      conversationId,
      senderEmail: "user@onyx.com.vn",
      recipientEmail: "sarah@onyx.com.vn",
      text: "Of course! Love your content 😍",
      timestamp: new Date(now - 10_200_000).toISOString(),
      status: "read" as const,
    },
    {
      id: `${conversationId}-msg-3`,
      conversationId,
      senderEmail: "sarah@onyx.com.vn",
      recipientEmail: "user@onyx.com.vn",
      text: "Check your DM for exclusive content 🔥",
      timestamp: new Date(now - 3_600_000).toISOString(),
      status: "delivered" as const,
    },
  ]
}

// ── WebSocket upgrade route ────────────────────────────────────────

/**
 * DM WebSocket endpoint — reuses LiveDO infrastructure.
 * Client connects to: wss://box.onyx.com.vn/api/v1/dm/ws?user=<email>
 */
app.get("/api/v1/dm/ws", async (c) => {
  const user = c.req.query("user")
  if (!user) return c.text("Missing user", 400)

  // Use LiveDO for DM WebSocket
  const id = c.env.LIVE.idFromName(`dm:${user}`)
  const stub = c.env.LIVE.get(id)

  const url = new URL(c.req.url)
  const doUrl = new URL(`https://live-do/dm/ws${url.search}`)

  const doRequest = new Request(doUrl, {
    method: "GET",
    headers: {
      Upgrade: "websocket",
      Connection: "Upgrade",
    },
  })

  return stub.fetch(doRequest) as unknown as Response
})

// ── REST: List conversations ──────────────────────────────────────

app.get("/api/v1/dm/conversations", async (c) => {
  // Return mock conversations until full DO SQLite implementation
  const conversations = mockConversations()
  return c.json(conversations)
})

// ── REST: Get messages for a conversation ─────────────────────────

app.get("/api/v1/dm/messages/:id", async (c) => {
  const conversationId = c.req.param("id")!
  const messages = mockMessages(conversationId)
  return c.json(messages)
})

// ── REST: Send a message ──────────────────────────────────────────

app.post("/api/v1/dm/messages", async (c) => {
  let body: {
    conversationId: string
    recipient: string
    text: string
    attachmentUrl?: string
  }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400)
  }

  if (!body.text && !body.attachmentUrl) {
    return c.json({ error: "Message text or attachment required" }, 400)
  }

  // Return mock success — real implementation stores in DO SQLite
  const id = crypto.randomUUID()
  return c.json({ id, status: "sent" }, 201)
})

// ── REST: Get messages for polling fallback ───────────────────────

app.get("/api/v1/dm/messages", async (c) => {
  // Return all recent messages across conversations (polling fallback)
  const allMessages = [
    {
      id: "poll-msg-1",
      conversationId: "conv-1",
      senderEmail: "sarah@onyx.com.vn",
      recipientEmail: "user@onyx.com.vn",
      text: "Just uploaded new content! 🔥",
      timestamp: new Date(Date.now() - 300_000).toISOString(),
      status: "delivered" as const,
    },
  ]
  return c.json({ messages: allMessages })
})

// ── REST: Online status ───────────────────────────────────────────

app.get("/api/v1/dm/online/:user", async (c) => {
  const userEmail = c.req.param("user")!
  // Mock: return online status with 50% chance
  const isOnline = userEmail.includes("sarah") || userEmail.includes("alex")
  return c.json({
    online: isOnline,
    lastSeen: isOnline ? "" : "2h",
  })
})

// ── REST: Typing indicator heartbeat ──────────────────────────────

app.post("/api/v1/dm/typing", async (c) => {
  let body: {
    user: string
    recipient: string
    isTyping: boolean
  }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400)
  }

  // In production, broadcast via WebSocket to recipient
  return c.json({ acknowledged: true })
})

export { app, mockConversations, mockMessages }
