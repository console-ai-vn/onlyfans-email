import { useCallback, useRef, useState } from "react"
import { UserCircle, MagnifyingGlass } from "@phosphor-icons/react"
import { Loader } from "@cloudflare/kumo"
import { useSwipe } from "~/lib/gesture-utils"
import OnlineBadge from "~/components/OnlineBadge"
import type { DMConversation } from "~/queries/dm"

// ── Helpers ───────────────────────────────────────────────────────

function relativeTime(iso: string | undefined): string {
  if (!iso) return ""
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then

  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`

  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ── SwipeableRow (extracted for stable hook usage) ────────────────

function SwipeableRow({
  conv,
  onSelect,
  onDelete,
}: {
  conv: DMConversation
  onSelect: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const rowRef = useRef<HTMLLIElement>(null)
  const { isSwiping, offsetX } = useSwipe(
    rowRef,
    () => onDelete?.(conv.id),
    () => {},
    { threshold: 100 },
  )

  return (
    <li
      ref={rowRef}
      className="relative border-b border-kumo-line/50 cursor-pointer transition-colors hover:bg-kumo-recessed/50 active:bg-kumo-recessed"
      style={{
        transform: `translateX(${offsetX}px)`,
        transition: isSwiping ? "none" : "transform 0.2s ease-out",
      }}
      onClick={() => onSelect(conv.id)}
    >
      {/* Delete indicator behind the row */}
      {offsetX < -40 && (
        <div className="absolute inset-y-0 right-0 flex items-center bg-red-500/90 px-4 z-0">
          <span className="text-xs font-medium text-white">Delete</span>
        </div>
      )}

      <div className="relative z-10 flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {conv.partnerAvatar ? (
            <img
              src={conv.partnerAvatar}
              alt={conv.partnerName}
              className="size-12 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <UserCircle size={48} className="text-kumo-inactive" weight="light" />
          )}
          <OnlineBadge online={conv.online} lastSeen={conv.lastSeen} />
        </div>

        {/* Name + last message */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-kumo-default truncate">
              {conv.partnerName || conv.partnerEmail}
            </span>
            <span className="text-[11px] text-kumo-muted shrink-0 ml-2">
              {relativeTime(conv.lastMessageAt)}
            </span>
          </div>
          <p className="text-xs text-kumo-subtle truncate mt-0.5">
            {conv.lastMessage || "No messages yet"}
          </p>
        </div>

        {/* Unread badge */}
        {conv.unreadCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-kumo-brand px-1.5 text-[10px] font-bold text-white shrink-0">
            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
          </span>
        )}
      </div>
    </li>
  )
}

// ── DMList ────────────────────────────────────────────────────────

interface DMListProps {
  conversations: DMConversation[]
  isLoading: boolean
  onSelect: (conversationId: string) => void
  onDelete?: (conversationId: string) => void
}

/**
 * Conversation list component.
 * Scrollable list with search bar, swipe-to-delete rows,
 * avatar, name, last message, timestamp, unread badge, online dot.
 */
export default function DMList({ conversations, isLoading, onSelect, onDelete }: DMListProps) {
  const [search, setSearch] = useState("")

  const filtered = conversations.filter((c) =>
    (c.partnerName || c.partnerEmail).toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-kumo-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-lg border border-kumo-line bg-kumo-recessed py-2 pl-9 pr-3 text-sm text-kumo-default placeholder:text-kumo-muted focus:border-kumo-brand focus:outline-none"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <UserCircle size={48} className="text-kumo-inactive" weight="light" />
          <p className="text-sm font-medium text-kumo-default">
            {search ? "No conversations found" : "No messages yet"}
          </p>
          <p className="text-xs text-kumo-subtle">
            {search
              ? "Try a different search term"
              : "Start a conversation from the home feed or a creator profile"}
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto scrollbar-hide">
          {filtered.map((conv) => (
            <SwipeableRow
              key={conv.id}
              conv={conv}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
