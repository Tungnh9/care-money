interface MonkeyProps {
  pose?: "wave" | "cheer" | "banana" | "book" | "sleep" | "focus" | "calc"
  size?: number
  dark?: boolean
  className?: string
}

function Monkey({ pose = "wave", size = 72, dark = false, className }: MonkeyProps) {
  // Trên nền đậm phải đổi màu lông, không thì khỉ lẫn vào nền.
  const bodyColor = dark ? "var(--ob-vo-300)" : "var(--ob-vo-700)"
  const bellyColor = dark ? "var(--ob-cam-100)" : "var(--ob-cam-200)"
  const inkColor = "var(--ob-vo-900)"

  function arm(d: string) {
    return <path d={d} fill="none" stroke={bodyColor} strokeWidth={5.4} strokeLinecap="round" />
  }
  function hand(x: number, y: number) {
    return <circle cx={x} cy={y} r={3.5} fill={bellyColor} />
  }

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={{ flex: "none", display: "block" }}
      aria-hidden="true"
      data-pose={pose}
    >
      <ellipse cx={32} cy={60.4} rx={14} ry={2.4} fill={bodyColor} opacity={0.16} />
      <path
        d="M32 40C40 40 44.5 45 44.5 51.5 44.5 56.6 39 59.2 32 59.2S19.5 56.6 19.5 51.5C19.5 45 24 40 32 40Z"
        fill={bodyColor}
      />
      <ellipse cx={32} cy={51} rx={7.4} ry={6.6} fill={bellyColor} />

      {pose === "cheer" ? (
        <g>
          {arm("M21 45C15 42 12 36 12.6 30")}
          {arm("M43 45C49 42 52 36 51.4 30")}
          {hand(12.2, 27.6)}
          {hand(51.8, 27.6)}
        </g>
      ) : pose === "wave" ? (
        <g>
          {arm("M21 45C17.4 47 16 50.4 16.8 53.4")}
          {hand(17.2, 55.4)}
        </g>
      ) : pose === "banana" ? (
        <g>
          {arm("M43 45C47.6 43 50 39.6 50 36")}
          <path
            d="M46.6 36.6q5.6-2.4 8.6 2.2"
            fill="none"
            stroke="var(--ob-chuoi-400)"
            strokeWidth={4.6}
            strokeLinecap="round"
          />
          {arm("M21 45C17.4 47 16 50.4 16.8 53.4")}
          {hand(17.2, 55.4)}
        </g>
      ) : pose === "book" ? (
        <g>
          {arm("M21.6 46C19.6 48.8 19.8 51.4 21.8 52.4")}
          {arm("M42.4 46C44.4 48.8 44.2 51.4 42.2 52.4")}
        </g>
      ) : pose === "calc" ? (
        <g>
          {arm("M21.6 46C19.2 48.8 19 51.4 20.8 53")}
          {arm("M42.4 46C44.8 48.8 45 51.4 43.2 53")}
          {hand(20.6, 54.6)}
          {hand(43.4, 54.6)}
        </g>
      ) : (
        <g>
          {arm("M21.6 46C18.4 48.4 17.4 51.6 18.4 54")}
          {arm("M42.4 46C45.6 48.4 46.6 51.6 45.6 54")}
          {hand(18.8, 55.8)}
          {hand(45.2, 55.8)}
        </g>
      )}

      <circle cx={12.6} cy={25.6} r={7.4} fill={bodyColor} />
      <circle cx={51.4} cy={25.6} r={7.4} fill={bodyColor} />
      <circle cx={12.6} cy={25.6} r={3.9} fill={bellyColor} />
      <circle cx={51.4} cy={25.6} r={3.9} fill={bellyColor} />
      <circle cx={32} cy={26} r={16.6} fill={bodyColor} />
      <path d="M31 9.8q2.2-4 5.4-2.2-.6 2.8-2.8 3.8" fill={bodyColor} />
      <ellipse cx={32} cy={29.6} rx={12.4} ry={10.8} fill={bellyColor} />

      {pose === "sleep" ? (
        <g fill="none" stroke={inkColor} strokeWidth={1.5} strokeLinecap="round">
          <path d="M23.6 27.4q2.8 2.4 5.6 0" />
          <path d="M34.8 27.4q2.8 2.4 5.6 0" />
        </g>
      ) : (
        <g className="ob-blink">
          <circle cx={26.6} cy={27.2} r={2.7} fill={inkColor} />
          <circle cx={37.4} cy={27.2} r={2.7} fill={inkColor} />
          <circle cx={27.5} cy={26.2} r={0.85} fill="#fff" />
          <circle cx={38.3} cy={26.2} r={0.85} fill="#fff" />
        </g>
      )}
      <ellipse cx={30.2} cy={33.4} rx={0.85} ry={0.7} fill={inkColor} opacity={0.5} />
      <ellipse cx={33.8} cy={33.4} rx={0.85} ry={0.7} fill={inkColor} opacity={0.5} />
      {pose === "sleep" ? (
        <path d="M29.6 36.6q2.4 1.6 4.8 0" fill="none" stroke={inkColor} strokeWidth={1.5} strokeLinecap="round" />
      ) : (
        <path d="M28.2 36.2q3.8 3.4 7.6 0" fill="none" stroke={inkColor} strokeWidth={1.6} strokeLinecap="round" />
      )}
      <ellipse cx={22.4} cy={33} rx={2.5} ry={1.5} fill="var(--ob-do-500)" opacity={0.28} />
      <ellipse cx={41.6} cy={33} rx={2.5} ry={1.5} fill="var(--ob-do-500)" opacity={0.28} />

      {pose === "sleep" ? (
        <g fill={inkColor} fontFamily="var(--ob-font-num)" fontWeight={700}>
          <text className="ob-z ob-z1" x={45.6} y={16.4} fontSize={8.5}>
            z
          </text>
          <text className="ob-z ob-z2" x={52.4} y={11} fontSize={7}>
            z
          </text>
          <text className="ob-z ob-z3" x={57.6} y={7.5} fontSize={6}>
            z
          </text>
        </g>
      ) : null}

      {pose === "cheer" ? (
        <g fill="var(--ob-chuoi-400)">
          <path d="M8 12l1.3 2.9 2.9 1.3-2.9 1.3L8 21.4l-1.3-2.9L3.8 17.2l2.9-1.3z" />
          <path d="M56 10l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z" />
        </g>
      ) : null}

      {pose === "wave" ? (
        <g className="ob-wave-arm">
          {arm("M43 45C49 42 52.4 36.4 51.6 30.4")}
          {hand(51.9, 28)}
        </g>
      ) : null}

      {pose === "book" ? (
        <g>
          <path d="M20.6 54.4V46.4q5.6-2.2 11 .4v8q-5.4-2.6-11-.4z" fill="var(--ob-kem)" />
          <path d="M43.4 54.4V46.4q-5.6-2.2-11 .4v8q5.4-2.6 11-.4z" fill="var(--ob-vo-100)" />
          <path d="M32 46.8v8" stroke={bodyColor} strokeWidth={1.6} strokeLinecap="round" />
          <path
            d="M23.4 49.4h5.6M23.4 51.8h4.4M35 49.4h5.6M35.8 51.8h4.4"
            stroke="var(--ob-vo-300)"
            strokeWidth={1.1}
            strokeLinecap="round"
          />
          {hand(19.6, 53.8)}
          {hand(44.4, 53.8)}
        </g>
      ) : null}

      {pose === "focus" ? (
        <g>
          <path
            d="M14.6 22.4C15.6 12.4 22.8 6.6 32 6.6s16.4 5.8 17.4 15.8"
            fill="none"
            stroke={inkColor}
            strokeWidth={3.6}
            strokeLinecap="round"
          />
          <rect x={7.8} y={19.6} width={9.6} height={13.6} rx={4.8} fill={inkColor} />
          <rect x={46.6} y={19.6} width={9.6} height={13.6} rx={4.8} fill={inkColor} />
          <rect x={10.4} y={23} width={4.4} height={6.8} rx={2.2} fill="var(--ob-cam-500)" />
          <rect x={49.2} y={23} width={4.4} height={6.8} rx={2.2} fill="var(--ob-cam-500)" />
        </g>
      ) : null}

      {pose === "calc" ? (
        <g>
          <rect x={21} y={44.8} width={22} height={14} rx={3} fill="var(--ob-kem)" />
          <rect x={23.4} y={47} width={17.2} height={4} rx={1} fill={inkColor} />
          <circle cx={26} cy={53.2} r={1.2} fill="var(--ob-vo-300)" />
          <circle cx={31} cy={53.2} r={1.2} fill="var(--ob-vo-300)" />
          <circle cx={26} cy={56.6} r={1.2} fill="var(--ob-vo-300)" />
          <circle cx={31} cy={56.6} r={1.2} fill="var(--ob-vo-300)" />
          <circle cx={37} cy={56.6} r={1.6} fill="var(--ob-color-action)" />
        </g>
      ) : null}
    </svg>
  )
}

export { Monkey }
export type { MonkeyProps }
