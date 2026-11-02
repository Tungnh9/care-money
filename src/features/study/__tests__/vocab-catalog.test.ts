import { describe, it, expect } from "vitest"

import type { VocabEntry } from "@/lib/study/types"
import { filterByLevel, groupByLevel, levelCounts, summarizeTopics, topicKey, topicLabel } from "../vocab-catalog"

function word(id: string, overrides: Partial<VocabEntry> = {}): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa ${id}`, addedAt: "2026-08-11", ...overrides }
}

const VOCAB: VocabEntry[] = [
  word("v-1", { topic: "jobs", level: "B1" }),
  word("v-2", { topic: "food", level: "A1" }),
  word("v-3", { topic: "travel", level: "A2" }),
  word("v-4", { level: "A1" }),
  word("v-5", { topic: "jobs", level: "A1" }),
  word("v-6", { topic: "introductions", level: "A2" }),
  word("v-7", { topic: "art", level: "C1" }),
  word("v-8", { topic: "  food  " }),
]

describe("topicKey / topicLabel", () => {
  it("names the 13 topics in Vietnamese, words without a topic Khác, and unknown slugs by themselves", () => {
    expect(topicLabel("introductions")).toBe("Giới thiệu bản thân")
    expect(topicLabel("special occasions")).toBe("Dịp đặc biệt")
    expect(topicLabel("activities")).toBe("Học tập & hoạt động")
    expect(topicLabel("")).toBe("Khác")
    expect(topicLabel("travel")).toBe("Travel")
    // Slug trùng tên thuộc tính có sẵn của object không được đọc ra hàm.
    expect(topicLabel("constructor")).toBe("Constructor")
    expect(topicKey(word("x", { topic: "  food  " }))).toBe("food")
    expect(topicKey(word("x"))).toBe("")
  })
})

describe("summarizeTopics", () => {
  it("orders the 13 known topics from the spec, unknown slugs after them, and words without a topic last as Khác", () => {
    const topics = summarizeTopics(VOCAB, [], null)

    expect(topics.map((t) => t.topic)).toEqual(["introductions", "food", "jobs", "art", "travel", ""])
    expect(topics.map((t) => t.label)).toEqual([
      "Giới thiệu bản thân",
      "Ăn uống",
      "Nghề nghiệp",
      "Art",
      "Travel",
      "Khác",
    ])
  })

  it("keeps every word exactly once across the topics", () => {
    const topics = summarizeTopics(VOCAB, [], null)
    const ids = topics.flatMap((t) => t.words.map((w) => w.id))

    expect(ids).toHaveLength(VOCAB.length)
    expect(new Set(ids)).toEqual(new Set(VOCAB.map((w) => w.id)))
  })

  it("shows a word without a topic, or with an unknown slug, instead of dropping it", () => {
    const topics = summarizeTopics(VOCAB, [], null)

    expect(topics.find((t) => t.topic === "")?.words.map((w) => w.id)).toEqual(["v-4"])
    expect(topics.find((t) => t.topic === "travel")).toMatchObject({ label: "Travel", words: [VOCAB[2]] })
  })

  it("keeps the file order inside a topic and trims stray spaces around a slug", () => {
    const food = summarizeTopics(VOCAB, [], null).find((t) => t.topic === "food")

    expect(food?.words.map((w) => w.id)).toEqual(["v-2", "v-8"])
  })

  it("counts learned words per topic", () => {
    const topics = summarizeTopics(VOCAB, ["v-1", "v-5", "v-2", "v-unknown"], null)

    expect(topics.find((t) => t.topic === "jobs")?.learnedCount).toBe(2)
    expect(topics.find((t) => t.topic === "food")?.learnedCount).toBe(1)
    expect(topics.find((t) => t.topic === "art")?.learnedCount).toBe(0)
  })

  it("filters by level and leaves out topics with no word at that level", () => {
    const topics = summarizeTopics(VOCAB, ["v-1", "v-5"], "A1")

    expect(topics.map((t) => t.topic)).toEqual(["food", "jobs", ""])
    expect(topics.find((t) => t.topic === "jobs")).toMatchObject({ words: [VOCAB[4]], learnedCount: 1 })
  })
})

describe("filterByLevel", () => {
  it("keeps every word for null and only that level otherwise", () => {
    expect(filterByLevel(VOCAB, null)).toEqual(VOCAB)
    expect(filterByLevel(VOCAB, "A2").map((w) => w.id)).toEqual(["v-3", "v-6"])
    expect(filterByLevel(VOCAB, "C2")).toEqual([])
  })
})

describe("groupByLevel", () => {
  it("groups a topic's words from A1 up, with words without a level last", () => {
    const groups = groupByLevel([VOCAB[0], VOCAB[7], VOCAB[6], VOCAB[1], VOCAB[4]])

    expect(groups.map((g) => [g.level, g.words.map((w) => w.id)])).toEqual([
      ["A1", ["v-2", "v-5"]],
      ["B1", ["v-1"]],
      ["C1", ["v-7"]],
      [null, ["v-8"]],
    ])
  })
})

describe("levelCounts", () => {
  it("counts words per level, only for levels that have words", () => {
    expect(levelCounts(VOCAB)).toEqual([
      { level: "A1", count: 3 },
      { level: "A2", count: 2 },
      { level: "B1", count: 1 },
      { level: "C1", count: 1 },
    ])
    expect(levelCounts([])).toEqual([])
  })
})
