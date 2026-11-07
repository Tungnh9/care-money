import type { VocabEntry } from "@/lib/study/types"

// Chấm đáp án ở chế độ Ghi nhớ (tab Từ vựng): nhìn ảnh + nghĩa tiếng Việt, gõ lại từ tiếng Anh. Kho từ có những mục
// không ai gõ y hệt được, nên chấm theo 1 bộ đáp án chấp nhận:
// - chỗ trống "go to ...", "take ... class": để trống hay điền 1–3 từ đều được ("take a class", "throw it away");
// - phần trong ngoặc là tuỳ chọn ("busy (with)", "apply for (a job)"), trừ tên viết tắt trong ngoặc là tên khác của
//   cả từ ("the United Kingdom (the UK)" → "the UK" cũng đúng);
// - "a/b" là 1 trong 2 ("younger brother/sister" → "younger brother" hay "younger sister");
// - sau dấu "+" chỉ bỏ được mẫu ngữ pháp ("kind of + adj."); "dress + clothes" là cả cụm, khác hẳn "dress".
// So sánh không phân biệt hoa thường, dấu, khoảng trắng, gạch nối hay dấu câu.

const BLANK = /\.{3}|…/
const GRAMMAR_SLOT = /^(adj|adv|n|v|sb|sth)\.?$/i

// Chỉ giữ chữ cái và số (bỏ dấu thanh nếu có, vd. "café") — "t-shirt", "T shirt", "tshirt", "o’clock" khớp nhau.
function squash(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "")
}

// Như squash nhưng giữ ranh giới từ ("Take a  Class!" → "take a class") — để điền chỗ trống theo từng từ nguyên vẹn.
function toWords(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

// "younger brother/sister" → "younger brother", "younger sister"; "good/bad/etc." → good, bad.
function expandSlashes(form: string): string[] {
  let results = [""]
  for (const token of form.split(/\s+/).filter(Boolean)) {
    const options = token.includes("/")
      ? token.split("/").filter((option) => option && !/^etc\.?$/i.test(option))
      : [token]
    results = results.flatMap((head) => options.map((option) => `${head} ${option}`))
  }
  return results
}

// Ngoặc chứa tên viết tắt ("(the UK)") là tên khác của cả từ — gõ riêng nó cũng đúng.
function isAlias(bracketed: string): boolean {
  return /\b[A-Z]{2,}\b/.test(bracketed)
}

function acceptedAnswers(word: string): string[] {
  const noBlanks = word.split(BLANK).join(" ")
  // Giữ cả dạng ghép nội dung ngoặc vào câu: gõ y nguyên chữ đang hiện (kể cả ngoặc) luôn phải được tính đúng.
  const parensInline = noBlanks.replace(/[()]/g, " ")
  const parensDropped = noBlanks.replace(/\([^)]*\)/g, " ")
  const forms = [parensInline, parensDropped]
  for (const form of [parensInline, parensDropped]) {
    const plus = form.indexOf("+")
    if (plus !== -1 && GRAMMAR_SLOT.test(form.slice(plus + 1).trim())) forms.push(form.slice(0, plus))
  }
  for (const match of noBlanks.matchAll(/\(([^)]*)\)/g)) if (isAlias(match[1])) forms.push(match[1])
  for (const form of [...forms]) if (form.includes("/")) forms.push(...expandSlashes(form))
  return [...new Set(forms.map(squash).filter(Boolean))]
}

// Mỗi chỗ trống "..." có thể điền 1–3 từ: "take a class", "throw it away", "bring something to someone".
function blankPatterns(word: string): RegExp[] {
  return [word.replace(/[()]/g, " "), word.replace(/\([^)]*\)/g, " ")]
    .filter((form) => BLANK.test(form) && !form.includes("/"))
    .map((form) => {
      const parts = form.split(BLANK).map((part) => (toWords(part) ? `${toWords(part)} ` : ""))
      return new RegExp(`^ ${parts.join("(?:[\\p{L}\\p{N}]+ ){0,3}")}$`, "u")
    })
}

function isCorrectAnswer(typed: string, word: string): boolean {
  const answer = squash(typed)
  if (answer === "") return false
  if (acceptedAnswers(word).includes(answer)) return true
  const words = ` ${toWords(typed)} `
  return blankPatterns(word).some((pattern) => pattern.test(words))
}

function sameMeaning(a: string, b: string): boolean {
  return a.normalize("NFC").trim().toLowerCase() === b.normalize("NFC").trim().toLowerCase()
}

// Chấm cho 1 thẻ: đúng từ của thẻ ("exact"), hay đúng 1 từ khác có cùng nghĩa tiếng Việt trong kho ("synonym" — vd.
// thẻ "nổi tiếng" là popular mà gõ famous). Ảnh + nghĩa không phân biệt được 2 từ đó, nên gõ từ nào cũng tính đúng.
function gradeAnswer(typed: string, entry: VocabEntry, pool: VocabEntry[]): "exact" | "synonym" | null {
  if (isCorrectAnswer(typed, entry.word)) return "exact"
  const synonym = pool.some(
    (other) => other.id !== entry.id && sameMeaning(other.meaning, entry.meaning) && isCorrectAnswer(typed, other.word)
  )
  return synonym ? "synonym" : null
}

export { acceptedAnswers, gradeAnswer, isCorrectAnswer }
