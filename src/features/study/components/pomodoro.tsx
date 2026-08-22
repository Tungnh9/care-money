"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Monkey } from "@/components/ob/monkey"

const WORK_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60
const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type Mode = "work" | "break"

function Pomodoro() {
  const [mode, setMode] = useState<Mode>("work")
  const [left, setLeft] = useState(WORK_SECONDS)
  const [running, setRunning] = useState(false)
  const [rounds, setRounds] = useState(0)

  useEffect(() => {
    if (!running) return

    const id = setInterval(() => {
      setLeft((v) => {
        if (v > 1) return v - 1
        clearInterval(id)
        setRunning(false)
        if (mode === "work") {
          setRounds((r) => r + 1)
          setMode("break")
          return BREAK_SECONDS
        }
        setMode("work")
        return WORK_SECONDS
      })
    }, 1000)

    return () => clearInterval(id)
  }, [running, mode])

  const isWork = mode === "work"
  const total = isWork ? WORK_SECONDS : BREAK_SECONDS
  const pct = ((total - left) / total) * 100
  const mm = String(Math.floor(left / 60)).padStart(2, "0")
  const ss = String(left % 60).padStart(2, "0")

  function handleToggleRunning() {
    setRunning((r) => !r)
  }

  function handleReset() {
    setRunning(false)
    setLeft(isWork ? WORK_SECONDS : BREAK_SECONDS)
  }

  function handleSwitchMode() {
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
            {rounds ? `Đã xong ${rounds} phiên hôm nay` : "Chưa có phiên nào hôm nay"}
          </div>
        </div>
      </div>
    </Card>
  )
}

export { Pomodoro }
