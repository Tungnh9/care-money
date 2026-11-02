import { CEFR_LEVELS, type CefrLevel } from "@/lib/study/cefr"
import type { VocabEntry } from "@/lib/study/types"

// Tên tiếng Việt của các chủ đề đang có trong content/vocabulary.jsonl, xếp từ dễ tới khó — thứ tự này là thứ tự ô
// chủ đề trên tab Từ vựng. Slug trong file giữ nguyên tiếng Anh.
const TOPIC_LABELS: Record<string, string> = {
  introductions: "Giới thiệu bản thân",
  countries: "Quốc gia",
  home: "Nhà cửa",
  food: "Ăn uống",
  clothing: "Quần áo",
  possessions: "Đồ đạc cá nhân",
  time: "Thời gian rảnh",
  activities: "Học tập & hoạt động",
  jobs: "Nghề nghiệp",
  relationships: "Các mối quan hệ",
  together: "Kết nối bạn bè",
  emotions: "Cảm xúc",
  "special occasions": "Dịp đặc biệt",
}
const TOPIC_ORDER = Object.keys(TOPIC_LABELS)

// Nhóm của từ không có chủ đề.
const NO_TOPIC = ""

interface TopicSummary {
  topic: string
  label: string
  words: VocabEntry[]
  learnedCount: number
}

// null = "Chưa xếp cấp" (từ trong dữ liệu test viết tay; file nội dung thì luôn có cấp).
interface LevelGroup {
  level: CefrLevel | null
  words: VocabEntry[]
}

function topicKey(entry: VocabEntry): string {
  return entry.topic?.trim() ?? NO_TOPIC
}

// Chủ đề lạ (thêm vào file sau này mà chưa có tên tiếng Việt) vẫn hiện, bằng chính slug viết hoa chữ đầu.
function topicLabel(topic: string): string {
  if (topic === NO_TOPIC) return "Khác"
  return Object.hasOwn(TOPIC_LABELS, topic) ? TOPIC_LABELS[topic] : topic.charAt(0).toUpperCase() + topic.slice(1)
}

// 13 chủ đề theo thứ tự trên → chủ đề lạ theo ABC → "Khác" cuối cùng.
function compareTopics(a: string, b: string): number {
  const rank = (topic: string) =>
    topic === NO_TOPIC
      ? TOPIC_ORDER.length + 1
      : TOPIC_ORDER.includes(topic)
        ? TOPIC_ORDER.indexOf(topic)
        : TOPIC_ORDER.length
  return rank(a) - rank(b) || a.localeCompare(b)
}

function filterByLevel(words: VocabEntry[], level: CefrLevel | null): VocabEntry[] {
  return level === null ? words : words.filter((entry) => entry.level === level)
}

// Mỗi từ nằm đúng 1 chủ đề, giữ thứ tự của file. Lọc theo cấp thì chủ đề không còn từ nào bị bỏ.
function summarizeTopics(vocab: VocabEntry[], learned: string[], level: CefrLevel | null): TopicSummary[] {
  const learnedIds = new Set(learned)
  const byTopic = new Map<string, VocabEntry[]>()
  for (const entry of filterByLevel(vocab, level)) {
    const topic = topicKey(entry)
    byTopic.set(topic, [...(byTopic.get(topic) ?? []), entry])
  }
  return [...byTopic.keys()].sort(compareTopics).map((topic) => {
    const words = byTopic.get(topic) ?? []
    return {
      topic,
      label: topicLabel(topic),
      words,
      learnedCount: words.filter((entry) => learnedIds.has(entry.id)).length,
    }
  })
}

// Từ của 1 chủ đề chia theo cấp A1 → C2, từ chưa có cấp cuối cùng; bỏ nhóm rỗng.
function groupByLevel(words: VocabEntry[]): LevelGroup[] {
  const groups: LevelGroup[] = [...CEFR_LEVELS, null].map((level) => ({
    level,
    words: words.filter((entry) => (entry.level ?? null) === level),
  }))
  return groups.filter((group) => group.words.length > 0)
}

function levelCounts(words: VocabEntry[]): { level: CefrLevel; count: number }[] {
  return CEFR_LEVELS.map((level) => ({ level, count: words.filter((entry) => entry.level === level).length })).filter(
    (item) => item.count > 0
  )
}

export {
  filterByLevel,
  groupByLevel,
  levelCounts,
  summarizeTopics,
  topicKey,
  topicLabel,
  type LevelGroup,
  type TopicSummary,
}
