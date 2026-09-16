import { shiftDay } from "@/lib/date"
import type { GameStreak, VocabEntry } from "./types"

function pickRandomSet<T>(pool: T[], count: number): T[] {
  const remaining = [...pool]
  const out: T[] = []
  while (out.length < count && remaining.length) {
    const [item] = remaining.splice(Math.floor(Math.random() * remaining.length), 1)
    out.push(item)
  }
  return out
}

function pickQuizOptions(pool: VocabEntry[], correct: VocabEntry, optionCount = 4): VocabEntry[] {
  const wrongPool = pool.filter((entry) => entry.id !== correct.id)
  const wrongOptions = pickRandomSet(wrongPool, optionCount - 1)
  return pickRandomSet([correct, ...wrongOptions], optionCount)
}

// Chơi hoàn hảo tốn đúng pairCount*2 lượt lật (mỗi cặp ăn được tốn 2 lượt, không có lượt thừa).
function matchScoreFromFlips(pairCount: number, flipsUsed: number): number {
  const minFlips = pairCount * 2
  const raw = Math.round((10 * minFlips) / flipsUsed)
  return Math.max(0, Math.min(10, raw))
}

function nextStreak(current: GameStreak, today: string): GameStreak {
  if (current.lastPlayedDayKey === today) return current
  if (current.lastPlayedDayKey === shiftDay(today, -1)) {
    return { count: current.count + 1, lastPlayedDayKey: today }
  }
  return { count: 1, lastPlayedDayKey: today }
}

export { pickRandomSet, pickQuizOptions, matchScoreFromFlips, nextStreak }
