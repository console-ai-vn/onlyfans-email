import type { ReactNode } from "react"
import BottomTabBar from "~/components/BottomTabBar"

interface MobileShellProps {
  children: ReactNode
  badgeCount?: number
}

/**
 * MobileShell wraps authenticated tab content with a bottom tab bar.
 * On desktop (md+), it renders children directly — desktop sidebar is
 * handled by DesktopSidebar, which the layout route should wrap separately.
 */
export default function MobileShell({ children, badgeCount = 0 }: MobileShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-kumo-recessed">
      <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      <BottomTabBar badgeCount={badgeCount} />
    </div>
  )
}
