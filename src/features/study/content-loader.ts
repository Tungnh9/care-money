import fs from "node:fs"
import path from "node:path"

import type { GrammarEntry, VocabEntry } from "./types"

function parseJsonl<T>(raw: string, filename: string): T[] {
  return raw
    .split("\n")
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => Boolean(line))
    .map(({ line, lineNumber }) => {
      try {
        return JSON.parse(line) as T
      } catch (cause) {
        throw new Error(
          `${filename}:${lineNumber}: dòng JSON không hợp lệ — ${line.slice(0, 80)}`,
          { cause }
        )
      }
    })
}

function loadJsonl<T>(filename: string): T[] {
  const raw = fs.readFileSync(path.join(process.cwd(), "content", filename), "utf-8")
  return parseJsonl<T>(raw, filename)
}

function getVocab(): VocabEntry[] {
  return loadJsonl<VocabEntry>("vocabulary.jsonl")
}

function getGrammar(): GrammarEntry[] {
  return loadJsonl<GrammarEntry>("grammar.jsonl")
}

export { getVocab, getGrammar, parseJsonl }
