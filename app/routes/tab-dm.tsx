import { useNavigate } from "react-router"
import { PlusCircle } from "@phosphor-icons/react"
import DMList from "~/components/DMList"
import { useConversations } from "~/queries/dm"
import { useViewerEmail } from "~/hooks/useViewerEmail"

export function meta() {
  return [{ title: "DM — ONYX" }]
}

export default function DMTab() {
  const navigate = useNavigate()
  const userEmail = useViewerEmail()
  const { data: conversations = [], isLoading } = useConversations()

  const handleSelect = (conversationId: string) => {
    navigate(`/app/dm/${encodeURIComponent(conversationId)}`)
  }

  const handleDelete = (conversationId: string) => {
    // Soft-delete: just remove from cache for now
    // TODO: POST /api/v1/dm/conversations/:id/delete
    console.log("Delete conversation:", conversationId)
  }

  // Count unread messages for badge
  const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div className="flex flex-col h-dvh bg-kumo-base relative">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-kumo-default">Direct Messages</h1>
        <p className="text-xs text-kumo-subtle mt-0.5">
          Chat privately with subscribers and creators
        </p>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-hidden">
        <DMList
          conversations={conversations}
          isLoading={isLoading}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      </div>

      {/* FAB: New Message */}
      <button
        type="button"
        className="absolute bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-kumo-brand text-white shadow-lg shadow-kumo-brand/30 hover:bg-kumo-brand-light transition-colors active:scale-95"
        aria-label="New message"
        onClick={() => {
          // TODO: Open new conversation composer
          console.log("New message")
        }}
      >
        <PlusCircle size={26} weight="fill" />
      </button>
    </div>
  )
}
