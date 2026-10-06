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

// So chữ/nghĩa không phân biệt hoa thường, bỏ khoảng trắng 2 đầu. Kho từ có cặp trùng hẳn ("pay — mức
// lương" ở 2 chủ đề), cặp trùng nghĩa (famous/popular "nổi tiếng") và cặp cùng chữ khác nghĩa (light
// "sáng (màu sắc)"/"đèn").
function normalizeText(text: string): string {
  return text.trim().toLowerCase()
}

function pickQuizOptions(pool: VocabEntry[], correct: VocabEntry, optionCount = 4): VocabEntry[] {
  // Phương án sai không được là 1 nghĩa khác của chính từ đang hỏi (cùng chữ — hỏi "light" nghĩa "sáng"
  // thì "đèn" cũng đúng), không trùng nghĩa với đáp án (chọn trúng bản trùng vẫn bị chấm "Quên" vì so
  // theo id), và không trùng nghĩa nhau (2 nút y hệt). Chính `correct` cũng bị loại nhờ điều kiện cùng
  // chữ. Kho quá nhỏ thì trả ít phương án hơn optionCount, không bao giờ thêm phương án trùng.
  const correctWord = normalizeText(correct.word)
  const usedMeanings = new Set([normalizeText(correct.meaning)])
  const wrongOptions: VocabEntry[] = []
  for (const entry of pickRandomSet(pool, pool.length)) {
    if (wrongOptions.length === optionCount - 1) break
    const meaning = normalizeText(entry.meaning)
    if (normalizeText(entry.word) === correctWord || usedMeanings.has(meaning)) continue
    usedMeanings.add(meaning)
    wrongOptions.push(entry)
  }
  return pickRandomSet([correct, ...wrongOptions], wrongOptions.length + 1)
}

// Bàn ghép cặp: không 2 mục nào cùng chữ hoặc cùng nghĩa — nếu không, 2 lá "pay" (hay 2 lá "nổi tiếng")
// trông y hệt nhau mà ghép chéo lại bị tính là lệch cặp. Kho quá nhỏ thì trả ít mục hơn count.
function pickMatchEntries(pool: VocabEntry[], count: number): VocabEntry[] {
  const usedWords = new Set<string>()
  const usedMeanings = new Set<string>()
  const picked: VocabEntry[] = []
  for (const entry of pickRandomSet(pool, pool.length)) {
    if (picked.length === count) break
    const word = normalizeText(entry.word)
    const meaning = normalizeText(entry.meaning)
    if (usedWords.has(word) || usedMeanings.has(meaning)) continue
    usedWords.add(word)
    usedMeanings.add(meaning)
    picked.push(entry)
  }
  return picked
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

// Chuỗi ngày chơi chỉ còn "sống" khi lần chơi cuối là hôm nay hoặc hôm qua (hôm nay vẫn kịp chơi để
// nối chuỗi); xa hơn là đã đứt → hiển thị 0, dù count lưu trong storage chỉ được tính lại (về 1) ở
// nextStreak khi chơi xong ván kế tiếp. Hàm thuần — nơi gọi truyền today.
function activeStreakCount(streak: GameStreak, today: string): number {
  const alive = streak.lastPlayedDayKey === today || streak.lastPlayedDayKey === shiftDay(today, -1)
  return alive ? streak.count : 0
}

export {
  pickRandomSet,
  pickQuizOptions,
  pickMatchEntries,
  matchScoreFromFlips,
  nextStreak,
  activeStreakCount,
  isTypableWord,
}
