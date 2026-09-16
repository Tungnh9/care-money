import { shiftDay } from "@/lib/date"
import { sampleWithRng } from "./random-sample"
import type { GameStreak, VocabEntry } from "./types"

function pickRandomSet<T>(pool: T[], count: number): T[] {
  return sampleWithRng(pool, count, Math.random)
}

// Một số mục trong content/vocabulary.jsonl là mẫu collocation chứa dấu "..." literal (vd.
// "offer ... (to ...)", "go to ...") — không thể gõ đúng chữ để so khớp chính xác. Loại các mục
// này khỏi vòng Gõ từ (SpellingGame) trước khi rút ngẫu nhiên, để người chơi không bao giờ gặp
// từ không thể thắng được. Trắc nghiệm/Ghép cặp không cần lọc vì không yêu cầu gõ chữ.
function isTypableWord(entry: VocabEntry): boolean {
  return !entry.word.includes("...")
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

export { pickRandomSet, pickQuizOptions, matchScoreFromFlips, nextStreak, isTypableWord }
