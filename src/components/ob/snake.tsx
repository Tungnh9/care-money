interface SnakeProps {
  pose?: "wave" | "cheer" | "banana" | "book" | "sleep" | "focus" | "calc"
  size?: number
  dark?: boolean
  className?: string
}

const INK = "var(--ob-vo-900)"
const SPOT = "var(--ob-chuoi-700)"
const SHINE = "var(--ob-chuoi-200)"
const COIL = "var(--ob-chuoi-400)"
const COIL_EDGE = "var(--ob-chuoi-500)"
const SKIN = "var(--ob-chuoi-300)"
const CREAM = "var(--ob-chuoi-100)"

// Linh vật: rắn chuối (tuổi Tân Tỵ của chủ app) — rắn con vàng như chuối chín có chấm nâu, cuộn 2 vòng, cuống chuối kèm
// lá non trên đầu, chóp đuôi nâu như đầu quả chuối. Không có tay nên đuôi làm thay: vẫy, giơ, cầm chuối, giữ sách, bấm
// máy tính.
function Snake({ pose = "wave", size = 72, dark = false, className }: SnakeProps) {
  // Trên nền đậm bóng dưới chân phải sáng lên, không thì rắn như lơ lửng; những nét nằm ngoài thân (chữ z, tai nghe,
  // cuống chuối) cũng đổi sang màu sáng hơn, không thì chìm vào nền.
  const shadowColor = dark ? "var(--ob-vo-300)" : "var(--ob-vo-700)"
  const lineColor = dark ? "var(--ob-kem)" : INK
  const stemColor = dark ? COIL_EDGE : SPOT
  // Mặt tươi (thè lưỡi) khi chào, ăn mừng, cầm chuối; ngậm miệng khi đang chăm chú hay ngủ.
  const playful = pose === "wave" || pose === "cheer" || pose === "banana"

  function tail(d: string, tipX: number, tipY: number) {
    return (
      <>
        <path d={d} fill="none" stroke={COIL} strokeWidth={5} strokeLinecap="round" />
        <circle cx={tipX} cy={tipY} r={1.7} fill={SPOT} />
      </>
    )
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
      <ellipse cx={32} cy={60.6} rx={18} ry={2.4} fill={shadowColor} opacity={0.16} />

      {/* 2 vòng cuộn: viền dưới đậm + vệt sáng trên đỉnh cho ra thân tròn như ống. */}
      <ellipse cx={32} cy={54} rx={18.4} ry={6.6} fill={COIL_EDGE} />
      <ellipse cx={32} cy={52.8} rx={17.6} ry={5.6} fill={COIL} />
      <path d="M18.2 51.2q13.8-4.4 27.6 0" fill="none" stroke={SHINE} strokeWidth={1.4} strokeLinecap="round" />
      <ellipse cx={32} cy={46.8} rx={13.6} ry={5.6} fill={COIL_EDGE} />
      <ellipse cx={32} cy={45.7} rx={12.8} ry={4.7} fill={COIL} />
      <path d="M22.4 44.2q9.6-3.2 19.2 0" fill="none" stroke={SHINE} strokeWidth={1.3} strokeLinecap="round" />
      <g fill={SPOT} opacity={0.5}>
        <circle cx={18.6} cy={54} r={1.1} />
        <circle cx={41.4} cy={56.2} r={0.9} />
        <circle cx={29.6} cy={57.2} r={0.8} />
        <circle cx={22.8} cy={47.6} r={0.8} />
        <circle cx={42.4} cy={48} r={0.9} />
      </g>
      {/* Cổ thon nhô lên từ vòng trên, bụng màu kem. */}
      <rect x={25.8} y={30} width={12.4} height={17} rx={6.2} fill={SKIN} />
      <ellipse cx={32} cy={41.8} rx={4} ry={4.8} fill={CREAM} />

      {pose === "focus" ? (
        // Vòng tai nghe vẽ trước đầu và cuống chuối: chỉ lộ phần vòng qua đỉnh đầu, cuống chuối và lá chồi lên trước nó.
        <path
          d="M12.6 22.6C13.2 13 21.6 8.2 32 8.2S50.8 13 51.4 22.6"
          fill="none"
          stroke={lineColor}
          strokeWidth={3.4}
          strokeLinecap="round"
        />
      ) : null}
      <path d="M31.6 12.6Q30.8 8.6 33.2 6.4" fill="none" stroke={stemColor} strokeWidth={2.6} strokeLinecap="round" />
      <ellipse cx={36.2} cy={8} rx={3.2} ry={1.5} fill="var(--ob-la-500)" transform="rotate(-24 36.2 8)" />
      <ellipse cx={32} cy={25} rx={17.8} ry={13.4} fill={SKIN} />
      <g fill={SPOT} opacity={0.5}>
        <circle cx={18.6} cy={20.4} r={1.1} />
        <circle cx={45.4} cy={20.8} r={0.9} />
        <circle cx={40.6} cy={14.4} r={0.8} />
      </g>
      <ellipse cx={32} cy={30.6} rx={11} ry={6} fill={CREAM} />

      {pose === "sleep" ? (
        <g fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round">
          <path d="M21.8 24q2.8 2.4 5.6 0" />
          <path d="M36.6 24q2.8 2.4 5.6 0" />
        </g>
      ) : (
        <g className="ob-blink">
          <circle cx={24.6} cy={23.8} r={3} fill={INK} />
          <circle cx={39.4} cy={23.8} r={3} fill={INK} />
          <circle cx={25.6} cy={22.7} r={1} fill="#fff" />
          <circle cx={40.4} cy={22.7} r={1} fill="#fff" />
        </g>
      )}
      <circle cx={30.4} cy={28.6} r={0.6} fill={INK} opacity={0.45} />
      <circle cx={33.6} cy={28.6} r={0.6} fill={INK} opacity={0.45} />
      {pose === "sleep" ? (
        <path d="M30.2 32.2q1.8 1.2 3.6 0" fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
      ) : (
        <path d="M29 31.6q3 2.6 6 0" fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
      )}
      {playful ? (
        <path
          d="M32 33.2v2m0 0-1.1 1.3m1.1-1.3 1.1 1.3"
          fill="none"
          stroke="var(--ob-do-500)"
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      <ellipse cx={20.4} cy={29.4} rx={2.5} ry={1.5} fill="var(--ob-do-500)" opacity={0.3} />
      <ellipse cx={43.6} cy={29.4} rx={2.5} ry={1.5} fill="var(--ob-do-500)" opacity={0.3} />

      {pose === "sleep" ? (
        <g fill={lineColor} fontFamily="var(--ob-font-num)" fontWeight={700}>
          <text className="ob-z ob-z1" x={47.2} y={15.8} fontSize={8.5}>
            z
          </text>
          <text className="ob-z ob-z2" x={52.6} y={11.6} fontSize={7}>
            z
          </text>
          <text className="ob-z ob-z3" x={58} y={7.6} fontSize={6}>
            z
          </text>
        </g>
      ) : null}

      {pose === "focus" ? (
        <g>
          <rect x={7.8} y={18.6} width={9.6} height={13.6} rx={4.8} fill={lineColor} />
          <rect x={46.6} y={18.6} width={9.6} height={13.6} rx={4.8} fill={lineColor} />
          <rect x={10.4} y={22} width={4.4} height={6.8} rx={2.2} fill="var(--ob-cam-500)" />
          <rect x={49.2} y={22} width={4.4} height={6.8} rx={2.2} fill="var(--ob-cam-500)" />
        </g>
      ) : null}

      {pose === "cheer" ? (
        <g fill="var(--ob-chuoi-400)">
          <path d="M8 10l1.3 2.9 2.9 1.3-2.9 1.3L8 18.4l-1.3-2.9-2.9-1.3 2.9-1.3z" />
          <path d="M56.4 8l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z" />
        </g>
      ) : null}

      {pose === "book" ? (
        <g>
          <path d="M20.6 51.4V43.4q5.6-2.2 11 .4v8q-5.4-2.6-11-.4z" fill="var(--ob-kem)" />
          <path d="M43.4 51.4V43.4q-5.6-2.2-11 .4v8q5.4-2.6 11-.4z" fill="var(--ob-vo-100)" />
          <path d="M32 43.8v8" stroke="var(--ob-vo-300)" strokeWidth={1.6} strokeLinecap="round" />
          <path
            d="M23.4 46.4h5.6M23.4 48.8h4.4M35 46.4h5.6M35.8 48.8h4.4"
            stroke="var(--ob-vo-300)"
            strokeWidth={1.1}
            strokeLinecap="round"
          />
        </g>
      ) : null}

      {pose === "calc" ? (
        <g>
          <rect x={21} y={44.4} width={22} height={14} rx={3} fill="var(--ob-kem)" />
          <rect x={23.4} y={46.6} width={17.2} height={4} rx={1} fill={INK} />
          <circle cx={26} cy={52.8} r={1.2} fill="var(--ob-vo-300)" />
          <circle cx={31} cy={52.8} r={1.2} fill="var(--ob-vo-300)" />
          <circle cx={26} cy={56.2} r={1.2} fill="var(--ob-vo-300)" />
          <circle cx={31} cy={56.2} r={1.2} fill="var(--ob-vo-300)" />
          <circle cx={37} cy={56.2} r={1.6} fill="var(--ob-color-action)" />
        </g>
      ) : null}

      {pose === "wave" ? (
        <g className="ob-wave-tail">{tail("M47 54.4C53 54 56.2 49.4 55.6 43.4", 55.6, 42.4)}</g>
      ) : pose === "cheer" ? (
        tail("M47 54.4C54.4 53.8 58.6 46.4 56.4 37.6", 56.2, 36.6)
      ) : pose === "banana" ? (
        <g>
          {tail("M47 54.4C53 54 56.6 49.6 56.2 44.4", 56.2, 43.6)}
          {/* Quả chuối dựng trên chóp đuôi: vàng nhạt hơn thân, viền vàng đậm để không lẫn với thân rắn cùng màu. */}
          <path
            d="M54.6 41.6C51 37 52.4 31.4 59.6 28.8 56.4 32.2 55.8 37 58 41.4Z"
            fill={SHINE}
            stroke={COIL_EDGE}
            strokeWidth={1}
            strokeLinejoin="round"
          />
          <path
            d="M56.2 39.8C54.8 36.4 55.6 32.8 58.4 30.4"
            fill="none"
            stroke={COIL}
            strokeWidth={0.8}
            strokeLinecap="round"
          />
          <path d="M59.6 28.8l1.6-1.8" fill="none" stroke={stemColor} strokeWidth={1.8} strokeLinecap="round" />
        </g>
      ) : pose === "book" ? (
        // Đuôi vòng ra ngoài vòng cuộn, lên mép phải rồi móc qua góc trên trang phải — đi trong vòng cuộn thì cùng màu,
        // không thấy đuôi đâu.
        tail("M47 54.4C53 54.4 54.4 49.2 52.2 46.4C50.6 44.4 47.4 44 45.4 45.2", 44.9, 45.6)
      ) : pose === "calc" ? (
        // Đuôi vắt qua mép phải máy tính, chóp đuôi ấn nút "=".
        tail("M47.4 53.6C46.6 50.6 42.8 50.6 39.8 54", 39.2, 54.8)
      ) : (
        tail("M47 54.6C52.6 56.8 57.4 56.2 58 52.6", 58, 51.8)
      )}
    </svg>
  )
}

export { Snake }
export type { SnakeProps }
