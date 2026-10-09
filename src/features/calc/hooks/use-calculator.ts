"use client"

import { useCallback, useState } from "react"

import { evalExpr, formatResult, nextParen, toMachineString } from "../calc-engine"

/** Một dòng lịch sử: q = biểu thức đã gõ, a = kết quả hiển thị (định dạng VN), m = kết quả dạng "máy" (nạp lại được vào evalExpr). */
interface HistoryItem {
  q: string
  a: string
  m: string
}

const MAX_HISTORY = 4

const OPERATORS = ["+", "−", "×", "÷"]

/**
 * Nối 1 phím vào biểu thức. Bấm 2 phép tính liền nhau thì phép sau THAY phép trước (như máy tính
 * điện thoại) — nối thẳng thì "××" thành luỹ thừa JS và "÷×" mở comment JS. Riêng "−" sau "×"/"÷"
 * được giữ để nhập số âm (5×−2); đang có cụm "×−"/"÷−" thì thêm "−" nữa không đổi gì, còn phép khác
 * thay cả cụm.
 */
function appendToken(expr: string, t: string): string {
  const last = expr.slice(-1)
  if (!OPERATORS.includes(t) || !OPERATORS.includes(last)) return expr + t
  if (/[×÷]−$/.test(expr)) return t === "−" ? expr : expr.slice(0, -2) + t
  if (t === "−" && (last === "×" || last === "÷")) return expr + t
  return expr.slice(0, -1) + t
}

/**
 * State + hành vi của Máy tính — port 1:1 từ thuật toán trong file thiết kế tham khảo
 * (chuỗi biểu thức thô, xem trước kết quả khi đang gõ, lịch sử tối đa 4 dòng).
 */
function useCalculator() {
  const [expr, setExpr] = useState("")
  const [out, setOut] = useState("0")
  const [error, setError] = useState(false)
  const [justEvaluated, setJustEvaluated] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const push = useCallback(
    (t: string) => {
      setError(false)
      // Sau khi "=" (justEvaluated), gõ số/phẩy/"(" thì THAY hẳn biểu thức cũ; gõ phép tính thì NỐI
      // tiếp từ kết quả cũ (fresh=false).
      const fresh = justEvaluated && /^[0-9,(]$/.test(t)
      setJustEvaluated(false)
      const next = fresh ? (t === "," ? "0," : t) : appendToken(expr, t)
      const v = evalExpr(next)
      if (v !== null) setOut(formatResult(v))
      else if (fresh) setOut("0")
      setExpr(next)
    },
    [expr, justEvaluated]
  )

  const back = useCallback(() => {
    setError(false)
    setJustEvaluated(false)
    const next = expr.slice(0, -1)
    const v = evalExpr(next)
    setOut(v === null ? "0" : formatResult(v))
    setExpr(next)
  }, [expr])

  const clear = useCallback(() => {
    setExpr("")
    setOut("0")
    setError(false)
    setJustEvaluated(false)
  }, [])

  const equals = useCallback(() => {
    const v = evalExpr(expr)
    if (v === null) {
      setError(true)
      return
    }
    const a = formatResult(v)
    const m = toMachineString(v)
    setHistory((h) => [...h, { q: expr, a, m }].slice(-MAX_HISTORY))
    setExpr(m)
    setOut(a)
    setError(false)
    setJustEvaluated(true)
  }, [expr])

  const restoreFromHistory = useCallback((item: HistoryItem) => {
    setExpr(item.m)
    setOut(item.a)
    setError(false)
    setJustEvaluated(true)
  }, [])

  const insertParen = useCallback(() => {
    push(nextParen(expr))
  }, [push, expr])

  return {
    expr,
    out,
    error,
    history,
    push,
    back,
    clear,
    equals,
    restoreFromHistory,
    insertParen,
  }
}

export { useCalculator }
export type { HistoryItem }
