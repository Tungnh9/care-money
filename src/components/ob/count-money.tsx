"use client"

import * as React from "react"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { Figure } from "./figure"
import type { FigureProps } from "./figure"

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  } catch {
    return false
  }
}

function useCountUp(target: number, ms = 800): number {
  const [value, setValue] = React.useState(target)
  const isFirstRun = React.useRef(true)

  React.useEffect(() => {
    if (!isFirstRun.current) {
      // Đổi target khi đã chạy xong lần đầu (vd. tài khoản mới nạp thêm tiền) — cập nhật thẳng, không chạy lại animation.
      setValue(target)
      return
    }
    isFirstRun.current = false

    if (prefersReducedMotion() || !target) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(target)
      return
    }

    const start = Date.now()
    setValue(0)
    // setInterval thay vì requestAnimationFrame: tab nền vẫn chạy tới đích.
    const id = setInterval(() => {
      const progress = Math.min((Date.now() - start) / ms, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress >= 1) clearInterval(id)
    }, 30)
    const settle = setTimeout(() => {
      clearInterval(id)
      setValue(target)
    }, ms + 400)

    return () => {
      clearInterval(id)
      clearTimeout(settle)
    }
  }, [target, ms])

  return value
}

interface CountMoneyProps extends Omit<FigureProps, "value" | "unit"> {
  value: number
}

function CountMoney({ value, ...rest }: CountMoneyProps) {
  const { hidden } = useMoneyVisibility()
  return <Figure value={formatMoney(useCountUp(value), hidden)} {...rest} />
}

export { useCountUp, CountMoney }
