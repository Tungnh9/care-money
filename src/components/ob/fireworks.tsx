import type { CSSProperties } from "react"

const FIREWORK_COLORS = [
  "var(--ob-cam-500)",
  "var(--ob-chuoi-400)",
  "var(--ob-la-500)",
  "var(--ob-cam-300)",
]

const BURSTS = [
  { left: "20%", top: "22%", delay: 0 },
  { left: "52%", top: "12%", delay: 0.16 },
  { left: "80%", top: "26%", delay: 0.32 },
]

interface FireworksProps {
  sparksPerBurst?: number
}

function Fireworks({ sparksPerBurst = 8 }: FireworksProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      {BURSTS.map((burst, burstIndex) =>
        Array.from({ length: sparksPerBurst }, (_, i) => {
          const angle = (i / sparksPerBurst) * Math.PI * 2
          const distance = 30 + (i % 3) * 8
          return (
            <span
              key={`${burstIndex}-${i}`}
              className="ob-firework-spark size-[6px] rounded-full"
              style={
                {
                  left: burst.left,
                  top: burst.top,
                  background: FIREWORK_COLORS[(burstIndex + i) % FIREWORK_COLORS.length],
                  animationDelay: `${burst.delay}s`,
                  "--ob-fw-dx": `${Math.cos(angle) * distance}px`,
                  "--ob-fw-dy": `${Math.sin(angle) * distance}px`,
                } as CSSProperties
              }
            />
          )
        })
      )}
    </div>
  )
}

export { Fireworks }
