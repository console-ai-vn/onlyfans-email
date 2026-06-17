import { useState, useCallback } from "react"
import { Button } from "@cloudflare/kumo"
import {
  ArticleIcon,
  BroadcastIcon,
  ImageIcon,
  LockIcon,
  LockKeyIcon,
  GlobeIcon,
} from "@phosphor-icons/react"
import RichTextEditor from "~/components/RichTextEditor"

type ContentType = "post" | "story"
type TierOption = "public" | "subscribers" | "ppv"

interface TierSelect {
  tier: TierOption
  keyPrice?: number
  label: string
  icon: React.ElementType
  desc: string
}

const CONTENT_TYPES = [
  { id: "post" as ContentType, label: "Post", icon: ArticleIcon, desc: "Long-form content" },
  { id: "story" as ContentType, label: "Story", icon: BroadcastIcon, desc: "24h disappearing" },
]

const TIERS: TierSelect[] = [
  {
    tier: "public",
    label: "Public",
    icon: GlobeIcon,
    desc: "Visible to everyone",
  },
  {
    tier: "subscribers",
    label: "Subscribers",
    icon: LockIcon,
    desc: "Subscribers only",
  },
  {
    tier: "ppv",
    label: "PPV",
    icon: LockKeyIcon,
    desc: "Pay-per-view with Keys",
  },
]

export function meta() {
  return [{ title: "Create — ONYX" }]
}

export default function CreateTab() {
  const [contentType, setContentType] = useState<ContentType>("post")
  const [selectedTier, setSelectedTier] = useState<TierOption>("public")
  const [keyPrice, setKeyPrice] = useState("49000")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handlePublish = useCallback(async () => {
    if (!title.trim()) {
      setError("Please enter a title")
      return
    }
    setIsPublishing(true)
    setError(null)
    try {
      // Use existing topic creation API for posts
      const payload = {
        title: title.trim(),
        body: body.trim() || title.trim(),
        tier: selectedTier,
        keyPrice: selectedTier === "ppv" ? parseInt(keyPrice, 10) : undefined,
        contentType,
      }

      const res = await fetch("/api/v1/home/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error || "Failed to publish")
      }

      setSuccess(true)
      setTitle("")
      setBody("")
      setSelectedTier("public")
      setKeyPrice("49000")
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish")
    } finally {
      setIsPublishing(false)
    }
  }, [title, body, selectedTier, keyPrice, contentType])

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-kumo-default mb-6">Create Content</h1>

      {/* Content type selector */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-kumo-subtle uppercase tracking-wide mb-2">
          Content Type
        </p>
        <div className="flex gap-2">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.id}
              type="button"
              onClick={() => setContentType(ct.id)}
              className={`flex-1 flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                contentType === ct.id
                  ? "border-kumo-brand bg-kumo-brand/5 text-kumo-brand"
                  : "border-kumo-line bg-kumo-base text-kumo-default hover:bg-kumo-recessed"
              }`}
            >
              <ct.icon size={18} weight={contentType === ct.id ? "fill" : "regular"} />
              <div className="text-left">
                <p>{ct.label}</p>
                <p className="text-[10px] text-kumo-subtle">{ct.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tier selector */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-kumo-subtle uppercase tracking-wide mb-2">
          Visibility
        </p>
        <div className="flex gap-2">
          {TIERS.map((tier) => (
            <button
              key={tier.tier}
              type="button"
              onClick={() => setSelectedTier(tier.tier)}
              className={`flex-1 flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                selectedTier === tier.tier
                  ? "border-kumo-brand bg-kumo-brand/5 text-kumo-brand"
                  : "border-kumo-line bg-kumo-base text-kumo-default hover:bg-kumo-recessed"
              }`}
            >
              <tier.icon size={18} weight={selectedTier === tier.tier ? "fill" : "regular"} />
              <div className="text-left">
                <p>{tier.label}</p>
                <p className="text-[10px] text-kumo-subtle">{tier.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Key price input for PPV */}
        {selectedTier === "ppv" && (
          <div className="mt-3">
            <label className="text-xs text-kumo-subtle mb-1 block">
              Key Price (VND)
            </label>
            <input
              type="number"
              min="10000"
              step="1000"
              value={keyPrice}
              onChange={(e) => setKeyPrice(e.target.value)}
              className="w-full rounded-xl border border-kumo-line bg-kumo-base px-4 py-2.5 text-sm text-kumo-default placeholder:text-kumo-inactive focus:border-kumo-brand focus:outline-none focus:ring-1 focus:ring-kumo-brand"
              placeholder="49000"
            />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-xl border border-kumo-line bg-kumo-base px-4 py-2.5 text-sm text-kumo-default placeholder:text-kumo-inactive focus:border-kumo-brand focus:outline-none focus:ring-1 focus:ring-kumo-brand"
        />
      </div>

      {/* Body */}
      <div className="mb-5">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What do you want to share with your audience?"
          rows={5}
          className="w-full rounded-xl border border-kumo-line bg-kumo-base px-4 py-3 text-sm text-kumo-default placeholder:text-kumo-inactive focus:border-kumo-brand focus:outline-none focus:ring-1 focus:ring-kumo-brand resize-none"
        />
      </div>

      {/* Error / Success */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          Published successfully!
        </div>
      )}

      {/* Publish */}
      <Button
        variant="primary"
        size="lg"
        className="w-full bg-kumo-brand"
        onClick={handlePublish}
        disabled={isPublishing || !title.trim()}
      >
        {isPublishing ? "Publishing..." : "Publish"}
      </Button>
    </div>
  )
}
