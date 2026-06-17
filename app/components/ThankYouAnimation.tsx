import { useEffect, useRef } from "react"
import { HeartIcon } from "@phosphor-icons/react"

interface ThankYouAnimationProps {
  visible: boolean
  onComplete?: () => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  opacity: number
}

const COLORS = ["#3b82f6", "#f59e0b", "#ec4899", "#22c55e", "#8b5cf6", "#ef4444"]
const PARTICLE_COUNT = 50
const DURATION_MS = 2000
const GRAVITY = 0.1

export default function ThankYouAnimation({
  visible,
  onComplete,
}: ThankYouAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    if (!visible) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Resize canvas
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Initialize particles
    const particles: Particle[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.3 + Math.random() * (canvas.height * 0.2),
        vx: (Math.random() - 0.5) * 12,
        vy: -(Math.random() * 8 + 2),
        size: 4 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      })
    }
    particlesRef.current = particles
    startTimeRef.current = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / DURATION_MS, 1)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Fade out in last 30%
      const fadeOut = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1

      for (const p of particles) {
        p.x += p.vx
        p.vy += GRAVITY
        p.y += p.vy
        p.rotation += p.rotationSpeed
        p.vx *= 0.99

        ctx.save()
        ctx.globalAlpha = fadeOut * Math.max(0, p.opacity - progress * 0.5)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        // Draw confetti piece
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)

        ctx.restore()
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        // Cleanup
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        onComplete?.()
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [visible, onComplete])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Canvas for confetti */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />

      {/* Heart scale animation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex size-16 items-center justify-center text-red-500 animate-[heartBurst_2s_ease-out_forwards]"
          style={{
            animation: "heartBurst 2s ease-out forwards",
          }}
        >
          <HeartIcon size={64} weight="fill" />
        </div>
      </div>
    </div>
  )
}

// Inject heart burst keyframe into document head once
if (typeof document !== "undefined") {
  const styleId = "thankyou-animation-styles"
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style")
    style.id = styleId
    style.textContent = `
      @keyframes heartBurst {
        0% { transform: scale(1); opacity: 1; }
        30% { transform: scale(1.5); opacity: 0.9; }
        100% { transform: scale(1.8); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
}
