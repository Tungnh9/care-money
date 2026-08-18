const CONFETTI_COLORS = [
  "var(--ob-cam-500)",
  "var(--ob-chuoi-400)",
  "var(--ob-la-500)",
  "var(--ob-cam-300)",
]

interface ConfettiProps {
  n?: number
}

function Confetti({ n = 16 }: ConfettiProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className="ob-conf absolute top-0"
          style={{
            left: `${6 + i * (88 / n)}%`,
            background: CONFETTI_COLORS[i % 4],
            animationDelay: `${(i % 6) * 0.09}s`,
            width: i % 3 ? 7 : 5,
            height: i % 3 ? 7 : 9,
            borderRadius: i % 2 ? 99 : 2,
          }}
        />
      ))}
    </div>
  )
}

export { Confetti }
