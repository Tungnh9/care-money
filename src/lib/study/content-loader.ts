import fs from "node:fs"
import path from "node:path"
import { z } from "zod"

import type { GrammarEntry, VocabEntry } from "@/lib/study/types"

// Kiểm từng dòng ngay lúc build (trang /study, /overview gọi getVocab/getGrammar khi prerender):
// 1 dòng gõ nhầm field (vd. "Word" thay cho "word") làm build hỏng kèm đúng file:dòng, thay vì lọt
// qua rồi làm sập trang trên trình duyệt ở buildVocabIndex (`entry.word.includes`).
const vocabEntrySchema: z.ZodType<VocabEntry> = z.object({
  id: z.string(),
  word: z.string(),
  pos: z.string().optional(),
  phonetic: z.string().optional(),
  meaning: z.string(),
  topic: z.string().optional(),
  addedAt: z.string(),
  example: z.string().optional(),
  image: z.string().optional(),
})

const grammarEntrySchema: z.ZodType<GrammarEntry> = z.object({
  id: z.string(),
  title: z.string(),
  explanation: z.string(),
  examples: z.array(z.string()).optional(),
  translations: z.array(z.string()).optional(),
  structure: z.string().optional(),
  addedAt: z.string(),
})

function parseJsonl<T>(raw: string, filename: string, schema: z.ZodType<T>): T[] {
  return raw
    .split("\n")
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => Boolean(line))
    .map(({ line, lineNumber }) => {
      let value: unknown
      try {
        value = JSON.parse(line)
      } catch (cause) {
        throw new Error(
          `${filename}:${lineNumber}: dòng JSON không hợp lệ — ${line.slice(0, 80)}`,
          { cause }
        )
      }
      const result = schema.safeParse(value)
      if (!result.success) {
        const fields = result.error.issues.map((issue) => issue.path.join(".") || "(cả dòng)").join(", ")
        throw new Error(`${filename}:${lineNumber}: dòng thiếu hoặc sai kiểu field ${fields} — ${line.slice(0, 80)}`)
      }
      return result.data
    })
}

function loadJsonl<T>(filename: string, schema: z.ZodType<T>): T[] {
  const raw = fs.readFileSync(path.join(process.cwd(), "content", filename), "utf-8")
  return parseJsonl(raw, filename, schema)
}

function getVocab(): VocabEntry[] {
  return loadJsonl("vocabulary.jsonl", vocabEntrySchema)
}

function getGrammar(): GrammarEntry[] {
  return loadJsonl("grammar.jsonl", grammarEntrySchema)
}

export { getVocab, getGrammar, parseJsonl }
