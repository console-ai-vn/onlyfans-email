import { Outlet } from "react-router"
import MobileShell from "~/components/MobileShell"

/**
 * Layout route that wraps all tab-based /app routes in the mobile shell.
 * Desktop sees content without the bottom tab bar (CSS md:hidden).
 */
export default function MobileLayout() {
  return (
    <MobileShell>
      <Outlet />
    </MobileShell>
  )
}
