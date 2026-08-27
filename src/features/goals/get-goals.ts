import { formatMoney } from "@/lib/format"
import { DEFAULT_LOCALE, translateDefault } from "@/lib/i18n"
import type { Locale, TranslationFn } from "@/lib/i18n"

import type { Goal, GoalsInput } from "./types"

function formatChi(phan: number, t: TranslationFn = translateDefault): string {
  const chi = Math.floor(phan / 10)
  const rest = phan % 10
  return rest
    ? t("finance.chiAndPhanValue", { chi, phan: rest })
    : t("finance.chiValue", { count: chi })
}

function goldRemainingNote(
  goldPhan: number,
  goldPricePerPhan: number,
  hidden: boolean,
  t: TranslationFn = translateDefault,
  locale: Locale = DEFAULT_LOCALE
): string {
  const remaining = 100 - goldPhan
  const remainingChiValue = (remaining / 10).toFixed(1)
  const remainingChi =
    remaining % 10 === 0
      ? String(remaining / 10)
      : locale === "en"
        ? remainingChiValue
        : remainingChiValue.replace(".", ",")
  return t("goals.goldRemaining", {
    chi: remainingChi,
    amount: formatMoney(remaining * goldPricePerPhan, hidden, locale),
  })
}

function withPercent(now: number, target: number) {
  const percent = Math.min(Math.round((now / target) * 100), 100)
  return { percent, done: now >= target }
}

function getGoals(
  data: GoalsInput,
  hidden = false,
  t: TranslationFn = translateDefault,
  locale: Locale = DEFAULT_LOCALE
): { goals: Goal[]; avg: number } {
  const { savingsTotal, goldPhan, goldPricePerPhan } = data

  const carFund = data.carFundName
    ? data.savings.find((f) => f.name === data.carFundName)
    : undefined

  const defs = [
    {
      key: "savings",
      name: t("overview.goals.mini.savings100m"),
      icon: "pig",
      now: savingsTotal,
      target: 100_000_000,
      format: (n: number) => formatMoney(n, hidden, locale),
      note: t("goals.savingsGoalNote"),
      tone: "action" as const,
      linked: true,
    },
    {
      key: "gold",
      name: t("goals.goldGoalName"),
      icon: "gold",
      now: goldPhan,
      target: 100,
      format: (n: number) => formatChi(n, t),
      note: goldRemainingNote(goldPhan, goldPricePerPhan, hidden, t, locale),
      tone: "reward" as const,
      linked: true,
    },
    {
      key: "car",
      name: t("overview.goals.mini.buyCar"),
      icon: "car",
      now: carFund ? carFund.amount : 0,
      target: carFund ? carFund.target : 1,
      format: (n: number) => formatMoney(n, hidden, locale),
      note: carFund
        ? t("goals.carGoalLinkedNote", { name: carFund.name })
        : t("goals.carGoalUnlinkedNote"),
      tone: "action" as const,
      linked: !!carFund,
    },
  ]

  const goals: Goal[] = defs.map((g) => ({ ...g, ...withPercent(g.now, g.target) }))
  const avg = Math.round(
    (goals.reduce((sum, g) => sum + Math.min(g.now / g.target, 1), 0) / goals.length) * 100
  )

  return { goals, avg }
}

export { formatChi, getGoals }
