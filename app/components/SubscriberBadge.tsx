interface SubscriberBadgeProps {
  visible: boolean
}

export default function SubscriberBadge({ visible }: SubscriberBadgeProps) {
  if (!visible) return null

  return (
    <span className="relative inline-flex items-center overflow-hidden rounded-full bg-kumo-brand/10 px-2 py-0.5 text-xs font-semibold text-kumo-brand">
      {/* Shine animation overlay */}
      <span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        style={{
          backgroundSize: "200% 100%",
          animation: "shimmer 2s ease-in-out infinite",
        }}
      />
      <span className="relative z-10">SUBSCRIBER</span>
    </span>
  )
}
