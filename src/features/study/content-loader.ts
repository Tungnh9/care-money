import fs from "node:fs"
import path from "node:path"

import type { GrammarEntry, VocabEntry } from "./types"

function loadJsonl<T>(filename: string): T[] {
  const raw = fs.readFileSync(path.join(process.cwd(), "content", filename), "utf-8")
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T)
}

function getVocab(): VocabEntry[] {
  return loadJsonl<VocabEntry>("vocabulary.jsonl")
}

function getGrammar(): GrammarEntry[] {
  return loadJsonl<GrammarEntry>("grammar.jsonl")
}

export { getVocab, getGrammar }
