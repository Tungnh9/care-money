"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Monkey } from "@/components/ob/monkey"
import { dayKey } from "@/lib/date"
import {
  BREAK_SECONDS,
  WORK_SECONDS,
  getStoredPomodoro,
  setStoredPomodoro,
  type PomodoroMode,
  type PomodoroState,
} from "../pomodoro-storage"

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type Mode = PomodoroMode

// Timer chạy trong lúc rời trang vẫn phải trôi — tính lại left dựa trên thời gian
// thực đã qua kể từ lần ghi cuối, thay vì cứ đứng yên đến khi quay lại.
function resolveElapsed(stored: PomodoroState, now: number): PomodoroState {
  if (!stored.running) return stored
  const elapsed = Math.max(0, Math.floor((now - stored.updatedAt) / 1000))
  if (elapsed < stored.left) {
    return { ...stored, left: stored.left - elapsed }
  }
  // Hết giờ trong lúc rời trang — coi như phiên đã kết thúc, giống lúc setInterval tự chạy hết.
  if (stored.mode === "work") {
    // Phiên hết giờ đúng lúc updatedAt + left giây — tính cho ngày của thời điểm đó (có thể là hôm qua).
    const endedDay = dayKey(new Date(stored.updatedAt + stored.left * 1000))
    return { ...stored, mode: "break", left: BREAK_SECONDS, running: false, ...addFinishedRound(stored, endedDay) }
  }
  return { ...stored, mode: "work", left: WORK_SECONDS, running: false }
}

// Số giây còn lại tới mốc kết thúc (ms), làm tròn lên — còn 0,4 giây vẫn hiện 00:01, về 0 đúng lúc hết.
function secondsUntil(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}

// Số phiên chỉ tính trong 1 ngày: phiên xong vào ngày khác ngày của bộ đếm thì bộ đếm bắt đầu lại từ 1.
function addFinishedRound(
  state: Pick<PomodoroState, "rounds" | "roundsDay">,
  endedDay: string
): Pick<PomodoroState, "rounds" | "roundsDay"> {
  return { rounds: state.roundsDay === endedDay ? state.rounds + 1 : 1, roundsDay: endedDay }
}

function Pomodoro() {
  const [mode, setMode] = useState<Mode>("work")
  const [left, setLeft] = useState(WORK_SECONDS)
  const [running, setRunning] = useState(false)
  const [rounds, setRounds] = useState(0)
  const [roundsDay, setRoundsDay] = useState<string | null>(null)
  // Mốc đồng hồ (ms) lúc phiên đang chạy hết giờ; null khi không chạy. Đếm lùi luôn tính lại từ mốc
  // này thay vì trừ 1 mỗi tick: tab ẩn bị trình duyệt bóp setInterval (~1 lần/phút sau 5 phút) hay
  // điện thoại khoá màn hình dừng hẳn JS thì lần tick/visibilitychange kế tiếp vẫn ra đúng giờ.
  const endsAtRef = useRef<number | null>(null)
  const skipPersistRef = useRef(true)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    const now = Date.now()
    const resolved = resolveElapsed(getStoredPomodoro(), now)
    endsAtRef.current = resolved.running ? now + resolved.left * 1000 : null
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(resolved.mode)
    setLeft(resolved.left)
    setRunning(resolved.running)
    setRounds(resolved.rounds)
    setRoundsDay(resolved.roundsDay)
  }, [])

  useEffect(() => {
    // Bỏ qua lần chạy đầu tiên (render mặc định trước khi effect hydrate ở trên kịp
    // cập nhật state) — nếu không sẽ ghi đè mất state vừa đọc được từ storage.
    if (skipPersistRef.current) {
      skipPersistRef.current = false
      return
    }
    setStoredPomodoro({ mode, left, running, rounds, roundsDay, updatedAt: Date.now() })
  }, [mode, left, running, rounds, roundsDay])

  useEffect(() => {
    if (!running) return

    // Chỉ đặt giá trị tính từ đồng hồ (không trừ dần, không side effect) — kết thúc phiên nằm ở
    // effect bên dưới.
    function syncWithClock() {
      if (endsAtRef.current !== null) setLeft(secondsUntil(endsAtRef.current, Date.now()))
    }
    const id = setInterval(syncWithClock, 1000)
    // Quay lại tab / mở khoá máy: cập nhật ngay, không chờ tới tick kế tiếp.
    document.addEventListener("visibilitychange", syncWithClock)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", syncWithClock)
    }
  }, [running])

  // Hết giờ: xử lý đúng 1 lần ở effect riêng khi left về 0 — không đặt trong updater của setLeft như
  // trước, vì Strict Mode (bật mặc định ở App Router) gọi updater 2 lần lúc dev nên 1 phiên bị đếm
  // thành 2. Cùng pattern với quiz-game.tsx (updater thuần + effect riêng phản ứng với giá trị mới).
  useEffect(() => {
    if (left > 0) return
    // Ngày của phiên = ngày của mốc kết thúc thật — tab ẩn có thể chỉ phát hiện ra sau nửa đêm.
    const endedDay = dayKey(new Date(endsAtRef.current ?? Date.now()))
    endsAtRef.current = null
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ chạy đúng lúc đồng hồ về 0, không phải mỗi lần effect chạy
    setRunning(false)
    if (mode === "work") {
      const finished = addFinishedRound({ rounds, roundsDay }, endedDay)
      setRounds(finished.rounds)
      setRoundsDay(finished.roundsDay)
      setMode("break")
      setLeft(BREAK_SECONDS)
      return
    }
    setMode("work")
    setLeft(WORK_SECONDS)
  }, [left, mode, rounds, roundsDay])

  const isWork = mode === "work"
  const total = isWork ? WORK_SECONDS : BREAK_SECONDS
  const pct = ((total - left) / total) * 100
  const mm = String(Math.floor(left / 60)).padStart(2, "0")
  const ss = String(left % 60).padStart(2, "0")
  // Bộ đếm của ngày khác (hoặc không rõ ngày) không phải "hôm nay" — không cần ghi lại storage để về 0.
  const todayRounds = roundsDay === dayKey() ? rounds : 0

  function handleToggleRunning() {
    if (running) {
      // Tạm dừng: chốt số giây còn lại theo đồng hồ thật đúng lúc bấm.
      if (endsAtRef.current !== null) setLeft(secondsUntil(endsAtRef.current, Date.now()))
      endsAtRef.current = null
      setRunning(false)
      return
    }
    endsAtRef.current = Date.now() + left * 1000
    setRunning(true)
  }

  function handleReset() {
    endsAtRef.current = null
    setRunning(false)
    setLeft(isWork ? WORK_SECONDS : BREAK_SECONDS)
  }

  function handleSwitchMode() {
    endsAtRef.current = null
    setRunning(false)
    setMode(isWork ? "break" : "work")
    setLeft(isWork ? BREAK_SECONDS : WORK_SECONDS)
  }

  return (
    <Card tone={isWork ? "plain" : "reward"} label={isWork ? "Pomodoro · tập trung" : "Pomodoro · nghỉ ngắn"}>
      <div className="flex flex-wrap items-center gap-6">
        <Monkey size={72} pose={!isWork ? "banana" : running ? "focus" : "sleep"} />
        <div className="relative size-[132px] flex-none">
          <svg width="132" height="132" viewBox="0 0 132 132" className="rotate-[-90deg]">
            <circle
              cx="66"
              cy="66"
              r={RADIUS}
              fill="none"
              stroke={isWork ? "var(--ob-color-surface-sunken)" : "rgba(36,26,18,.16)"}
              strokeWidth="11"
            />
            <circle
              cx="66"
              cy="66"
              r={RADIUS}
              fill="none"
              strokeWidth="11"
              strokeLinecap="round"
              stroke={isWork ? "var(--ob-color-action)" : "var(--ob-vo-900)"}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - pct / 100)}
              className="[transition:stroke-dashoffset_1s_linear]"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="[font-family:var(--ob-font-num)] text-[28px] font-bold tracking-[-0.02em] tabular-nums">
              {mm}:{ss}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-[14px] flex flex-wrap gap-[10px]">
            <Button variant="primary" size="sm" type="button" onClick={handleToggleRunning}>
              {running ? "Tạm dừng" : left < total ? "Tiếp tục" : "Bắt đầu"}
            </Button>
            <Button variant="ghost" size="sm" type="button" onClick={handleReset}>
              Đặt lại
            </Button>
            <Button variant="ghost" size="sm" type="button" onClick={handleSwitchMode}>
              {isWork ? "Sang nghỉ 5 phút" : "Sang học 25 phút"}
            </Button>
          </div>
          <div
            className="flex items-center gap-[9px] text-[13.5px] font-medium"
            style={{ color: isWork ? "var(--ob-color-text-muted)" : "#5C4200" }}
          >
            <Image src="/assets/icons/timer.svg" width={19} height={19} alt="" />
            {todayRounds ? `Đã xong ${todayRounds} phiên hôm nay` : "Chưa có phiên nào hôm nay"}
          </div>
        </div>
      </div>
    </Card>
  )
}

export { Pomodoro }
