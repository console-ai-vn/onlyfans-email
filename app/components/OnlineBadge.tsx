interface OnlineBadgeProps {
  online?: boolean
  lastSeen?: string
}

/**
 * 8px green dot for online status.
 * Green pulsing when online, grey when offline.
 */
export default function OnlineBadge({ online, lastSeen }: OnlineBadgeProps) {
  const tooltipText = !online && lastSeen
    ? `last seen ${lastSeen} ago`
    : online
      ? "Online"
      : "Offline"

  return (
    <span
      className={`absolute bottom-0 right-0 block size-[10px] rounded-full border-2 border-kumo-base ${
        online
          ? "bg-emerald-500 animate-pulse"
          : "bg-kumo-inactive"
      }`}
      title={tooltipText}
      aria-label={tooltipText}
    />
  )
}
