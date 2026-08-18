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
  const hasAnimated = React.useRef(false)

  React.useEffect(() => {
    if (hasAnimated.current) {
      // Đổi target khi đã chạy xong lần đầu (vd. tài khoản mới nạp thêm tiền) — cập nhật thẳng, không chạy lại animation.
      setValue(target)
      return
    }

    if (!target) {
      // target=0 có thể là dữ liệu thật, hoặc chỉ là placeholder lúc localStorage chưa kịp nạp (useFinance/useSettings
      // khởi tạo bằng 0 trước, nạp dữ liệu thật ngay sau qua effect) — chưa đánh dấu đã chạy, để dành animation cho
      // lần target thật sự khác 0 tới, tránh mất hiệu ứng đếm dần ngay khi vào trang.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(0)
      return
    }
    hasAnimated.current = true

    if (prefersReducedMotion()) {
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
