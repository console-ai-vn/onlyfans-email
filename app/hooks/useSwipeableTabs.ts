import { useCallback, useEffect, useRef, useState } from "react"

interface SwipeConfig {
	threshold?: number
	velocityThreshold?: number
}

/**
 * Hook for swipeable tab navigation.
 * Detects horizontal swipes and fires onChange(tabId).
 * direction: 1 = swipe left (next tab), -1 = swipe right (previous tab)
 */
export function useSwipeableTabs(
	tabs: { id: string; label: string }[],
	onChange: (id: string) => void,
	config: SwipeConfig = {},
) {
	const { threshold = 80, velocityThreshold = 0.3 } = config
	const [activeIndex, setActiveIndex] = useState(0)
	const startX = useRef(0)
	const startTime = useRef(0)
	const isTouchDevice = useRef(true)

	useEffect(() => {
		isTouchDevice.current = !window.matchMedia("(pointer: fine)").matches
	}, [])

	const swipeTo = useCallback(
		(index: number) => {
			if (index >= 0 && index < tabs.length) {
				setActiveIndex(index)
				onChange(tabs[index].id)
			}
		},
		[tabs, onChange],
	)

	const onTouchStart = useCallback(
		(e: TouchEvent) => {
			if (!isTouchDevice.current) return
			const touch = e.touches[0]
			startX.current = touch.clientX
			startTime.current = Date.now()
		},
		[],
	)

	const onTouchEnd = useCallback(
		(e: TouchEvent) => {
			if (!isTouchDevice.current) return
			const touch = e.changedTouches[0]
			const delta = touch.clientX - startX.current
			const elapsed = Date.now() - startTime.current
			const velocity = elapsed > 0 ? Math.abs(delta) / elapsed : 0

			if (Math.abs(delta) > threshold || velocity > velocityThreshold) {
				if (delta > 0) {
					swipeTo(activeIndex - 1)
				} else {
					swipeTo(activeIndex + 1)
				}
			}
		},
		[activeIndex, swipeTo, threshold, velocityThreshold],
	)

	return { activeIndex, swipeTo, onTouchStart, onTouchEnd }
}
