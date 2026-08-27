import { translateDefault } from "@/lib/i18n"
import type { TranslationFn } from "@/lib/i18n"

function monthLabel(d: Date = new Date()): string {
  return `tháng ${d.getMonth() + 1}`
}

interface GreetingParts {
  prefix: string
  name: string
}

function splitGreeting(greeting: string, displayName: string): GreetingParts {
  const suffix = `, ${displayName}`
  if (displayName && greeting.endsWith(suffix)) {
    return { prefix: greeting.slice(0, greeting.length - suffix.length), name: displayName }
  }
  return { prefix: greeting, name: "" }
}

interface MiniGoalsInput {
  savingsTotal: number
  goldPhan: number
}

interface MiniGoal {
  name: string
  icon: string
  percent: number
}

function getMiniGoals(
  { savingsTotal, goldPhan }: MiniGoalsInput,
  t: TranslationFn = translateDefault
): MiniGoal[] {
  return [
    {
      name: t("overview.goals.mini.savings100m"),
      icon: "pig",
      percent: Math.min(Math.round((savingsTotal / 100_000_000) * 100), 100),
    },
    {
      name: t("overview.goals.mini.gold10chi"),
      icon: "gold",
      percent: Math.min(Math.round((goldPhan / 100) * 100), 100),
    },
    { name: t("overview.goals.mini.buyCar"), icon: "car", percent: 0 },
  ]
}

export { monthLabel, splitGreeting, getMiniGoals, type MiniGoal, type GreetingParts }
