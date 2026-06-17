// Gesture utilities — custom useSwipe + usePullRefresh hooks
// ~3KB total, zero external deps. CSS transitions for animations.

import { useCallback, useEffect, useRef, useState } from "react"

interface SwipeState {
  isSwiping: boolean
  offsetX: number
}

interface SwipeOptions {
  /** Minimum horizontal distance (px) to trigger a swipe. Default 80. */
  threshold?: number
  /** Minimum velocity (px/ms) to trigger a swipe. Default 0.3. */
  velocityThreshold?: number
  /** Easing duration in ms for the snap-back. Default 200. */
  snapDuration?: number
}

/**
 * Tracks horizontal touch swipes on a container.
 * Calls onSwipeLeft/onSwipeRight when a swipe crosses the threshold.
 * Disabled on desktop (pointer: fine) automatically.
 *
 * Returns { isSwiping, offsetX } for rendering translateX during the gesture.
 */
export function useSwipe(
  containerRef: React.RefObject<HTMLElement | null>,
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  options: SwipeOptions = {}
): SwipeState {
  const { threshold = 80, velocityThreshold = 0.3 } = options
  const [state, setState] = useState<SwipeState>({ isSwiping: false, offsetX: 0 })
  const startX = useRef(0)
  const startTime = useRef(0)
  const currentX = useRef(0)
  const isTouchDevice = useRef(true)

  useEffect(() => {
    isTouchDevice.current = !window.matchMedia("(pointer: fine)").matches
  }, [])

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isTouchDevice.current) return
      const touch = e.touches[0]
      startX.current = touch.clientX
      startTime.current = Date.now()
      currentX.current = touch.clientX
      setState({ isSwiping: true, offsetX: 0 })
    },
    []
  )

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isTouchDevice.current) return
      const touch = e.touches[0]
      currentX.current = touch.clientX
      const delta = touch.clientX - startX.current
      setState({ isSwiping: true, offsetX: delta })
    },
    []
  )

  const onTouchEnd = useCallback(() => {
    if (!isTouchDevice.current) return
    const delta = currentX.current - startX.current
    const elapsed = Date.now() - startTime.current
    const velocity = elapsed > 0 ? Math.abs(delta) / elapsed : 0

    setState({ isSwiping: false, offsetX: 0 })

    if (Math.abs(delta) > threshold || velocity > velocityThreshold) {
      if (delta > 0) {
        onSwipeRight()
      } else {
        onSwipeLeft()
      }
    }
  }, [onSwipeLeft, onSwipeRight, threshold, velocityThreshold])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    el.addEventListener("touchend", onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
    }
  }, [containerRef, onTouchStart, onTouchMove, onTouchEnd])

  return state
}

// ================================================================

interface PullState {
  isPulling: boolean
  pullDistance: number
}

/**
 * Pull-to-refresh gesture. Fires onRefresh() when the user pulls down >60px
 * while scrolled to the top of the container.
 *
 * Returns { isPulling, pullDistance } for rendering the pull indicator.
 */
export function usePullRefresh(
  containerRef: React.RefObject<HTMLElement | null>,
  onRefresh: () => void,
  threshold = 60
): PullState {
  const [state, setState] = useState<PullState>({ isPulling: false, pullDistance: 0 })
  const startY = useRef(0)
  const pulling = useRef(false)

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      const el = containerRef.current
      if (!el || el.scrollTop > 0) return
      const touch = e.touches[0]
      startY.current = touch.clientY
      pulling.current = true
    },
    [containerRef]
  )

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current) return
      const touch = e.touches[0]
      const distance = touch.clientY - startY.current
      if (distance > 0) {
        // Resistance: dampen the pull distance
        const damped = distance > 80 ? 80 + (distance - 80) * 0.3 : distance
        setState({ isPulling: true, pullDistance: damped })
      }
    },
    []
  )

  const onTouchEnd = useCallback(() => {
    if (!pulling.current) return
    pulling.current = false
    const distance = state.pullDistance
    setState({ isPulling: false, pullDistance: 0 })
    if (distance >= threshold) {
      onRefresh()
    }
  }, [onRefresh, threshold, state.pullDistance])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    el.addEventListener("touchend", onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
    }
  }, [containerRef, onTouchStart, onTouchMove, onTouchEnd])

  return state
}
