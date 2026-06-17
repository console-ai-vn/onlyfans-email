import { useCallback, useRef } from "react"
import { useSwipeableTabs } from "~/hooks/useSwipeableTabs"

interface Tab {
	id: string
	label: string
}

interface TabsProps {
	tabs: Tab[]
	activeTab: string
	onChange: (id: string) => void
}

/**
 * Swipeable tab component with underline animation.
 * Supports horizontal swipe via useSwipeableTabs hook.
 */
export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
	const containerRef = useRef<HTMLDivElement>(null)

	const activeIdx = tabs.findIndex((t) => t.id === activeTab)

	const { onTouchStart, onTouchEnd } = useSwipeableTabs(tabs, onChange)

	return (
		<div
			ref={containerRef}
			className="relative border-b border-kumo-line"
			onTouchStart={(e) =>
				onTouchStart(e as unknown as TouchEvent)
			}
			onTouchEnd={(e) =>
				onTouchEnd(e as unknown as TouchEvent)
			}
		>
			<div className="flex">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => onChange(tab.id)}
						className={`relative flex-1 px-4 py-3 text-sm font-medium transition-colors ${
							activeTab === tab.id
								? "text-kumo-default"
								: "text-kumo-subtle hover:text-kumo-default"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Animated underline */}
			<div
				className="absolute bottom-0 h-0.5 rounded-full bg-kumo-brand transition-all duration-300 ease-out"
				style={{
					left: `${(activeIdx / tabs.length) * 100}%`,
					width: `${100 / tabs.length}%`,
				}}
			/>
		</div>
	)
}
