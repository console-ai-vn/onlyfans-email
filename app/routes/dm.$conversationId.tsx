import { useParams, useNavigate } from "react-router"
import { ArrowLeft } from "@phosphor-icons/react"
import DMChat from "~/components/DMChat"
import { useViewerEmail } from "~/hooks/useViewerEmail"
import { useConversations } from "~/queries/dm"

export function meta() {
  return [{ title: "Chat — ONYX" }]
}

/**
 * Individual DM conversation route.
 * URL: /app/dm/:conversationId
 * Renders full chat experience with header, messages, and input bar.
 */
export default function DMChatRoute() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const userEmail = useViewerEmail()
  const { data: conversations = [] } = useConversations()

  // Find partner info from conversations list
  const conv = conversations.find((c) => c.id === conversationId)
  const recipientEmail = conv?.partnerEmail ?? ""
  const recipientName = conv?.partnerName

  if (!conversationId) {
    navigate("/app/dm", { replace: true })
    return null
  }

  if (!userEmail) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-4 bg-kumo-base">
        <p className="text-sm text-kumo-subtle">Please sign in to chat</p>
      </div>
    )
  }

  return (
    <DMChat
      conversationId={conversationId}
      userEmail={userEmail}
      recipientEmail={recipientEmail}
      recipientName={recipientName}
    />
  )
}
