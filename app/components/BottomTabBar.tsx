import { Envelope, House, MagnifyingGlass, PlusCircle, UserCircle } from "@phosphor-icons/react"
import { NavLink } from "react-router"

const TABS = [
  { id: "feed", icon: House, label: "Feed", path: "/app" },
  { id: "explore", icon: MagnifyingGlass, label: "Explore", path: "/app/explore" },
  { id: "create", icon: PlusCircle, label: "Create", path: "/app/create" },
  { id: "dm", icon: Envelope, label: "DM", path: "/app/dm" },
  { id: "profile", icon: UserCircle, label: "Profile", path: "/app/profile" },
] as const

interface BottomTabBarProps {
  badgeCount?: number
}

export default function BottomTabBar({ badgeCount = 0 }: BottomTabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-kumo-line bg-kumo-base/95 pb-[env(safe-area-inset-bottom,8px)] backdrop-blur-md md:hidden"
      style={{ height: "64px" }}
    >
      {TABS.map((tab) => {
        const hasBadge = tab.id === "dm" && badgeCount > 0
        return (
          <NavLink
            key={tab.id}
            to={tab.path}
            end={tab.id === "feed"}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-kumo-brand" : "text-kumo-subtle"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon
                  size={22}
                  weight={isActive ? "fill" : "regular"}
                  className="transition-all"
                />
                <span>{tab.label}</span>
                {hasBadge && (
                  <span className="absolute -top-0.5 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
