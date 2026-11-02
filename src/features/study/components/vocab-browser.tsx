"use client"

import { useEffect, useId, useRef } from "react"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { CefrLevel } from "@/lib/study/cefr"
import type { VocabEntry } from "@/lib/study/types"
import {
  filterByLevel,
  groupByLevel,
  levelCounts,
  summarizeTopics,
  topicKey,
  topicLabel,
  type TopicSummary,
} from "../vocab-catalog"
import { LevelFilter } from "./level-filter"
import { VocabWordCard } from "./vocab-word-card"

interface VocabBrowserProps {
  vocab: VocabEntry[]
  learned: string[]
  onToggleLearned: (id: string) => void
  // Chủ đề đang mở; null = lưới chủ đề. "" là nhóm "Khác" (từ không có chủ đề), vẫn mở được.
  topic: string | null
  // Cấp đang lọc; null = tất cả.
  level: CefrLevel | null
  onTopicChange: (topic: string | null) => void
  onLevelChange: (level: CefrLevel | null) => void
}

// Số cột theo bề rộng của chính Card (container query), không theo màn hình.
const TOPIC_GRID = "grid grid-cols-2 gap-3 @xl:grid-cols-3 @4xl:grid-cols-4"
const WORD_GRID = "grid grid-cols-2 gap-4 @md:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-6"
const COUNT_TEXT = "text-[12.5px] text-[var(--ob-color-text-subtle)] tabular-nums"
// Khoảng chừa khi cuộn tới Card hay 1 ô chủ đề: thanh trên (~64px) và thanh điều hướng dưới (~84px) của bản điện thoại
// là fixed, cuộn sát mép thì bị chúng che. Trên máy tính chỉ là thêm chút khoảng thở.
const SCROLL_MARGIN_TOP = "scroll-mt-[72px]"
const SCROLL_MARGIN_BOTTOM = "scroll-mb-[96px]"

// Lần chuyển màn vừa bấm: sau khi màn mới dựng xong mới biết đưa focus (và khung nhìn) tới đâu.
type PendingMove = { kind: "open" } | { kind: "back"; topic: string }

interface TopicTileProps {
  summary: TopicSummary
  statsId: string
  onOpen: () => void
}

// 1 ô chủ đề: tên là tên của nút, số từ và tiến độ đọc kèm làm mô tả.
function TopicTile({ summary, statsId, onOpen }: TopicTileProps) {
  const total = summary.words.length
  const percent = total ? Math.round((summary.learnedCount / total) * 100) : 0

  return (
    <button
      type="button"
      aria-label={summary.label}
      aria-describedby={statsId}
      data-topic={summary.topic}
      onClick={onOpen}
      className={`${SCROLL_MARGIN_TOP} ${SCROLL_MARGIN_BOTTOM} flex min-w-0 flex-col gap-2 rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-[14px] text-left transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:border-[var(--ob-color-action)]`}
    >
      <span className="text-[15px] font-bold break-words">{summary.label}</span>
      <span id={statsId} className={`flex flex-wrap gap-x-2 ${COUNT_TEXT}`}>
        <span>{`${total} từ`}</span>
        <span>{`Đã học ${summary.learnedCount}/${total}`}</span>
      </span>
      {/* Thanh tiến độ chỉ để nhìn — số đã học nằm ngay trên, đọc làm mô tả của nút. */}
      <span
        aria-hidden="true"
        className="mt-auto block h-2 overflow-hidden rounded-[var(--ob-radius-pill)] bg-[var(--ob-color-border)]"
      >
        <span className="block h-full bg-[var(--ob-color-action)]" style={{ width: `${percent}%` }} />
      </span>
    </button>
  )
}

// Tab Từ vựng: lưới chủ đề, hay các từ của 1 chủ đề chia theo cấp A1 → C2. Dải lọc theo cấp dùng chung cho cả 2 màn;
// chủ đề và cấp đang chọn do StudyView giữ, để chuyển tab rồi quay lại vẫn còn.
function VocabBrowser({
  vocab,
  learned,
  onToggleLearned,
  topic,
  level,
  onTopicChange,
  onLevelChange,
}: VocabBrowserProps) {
  const statsBaseId = useId()
  const cardRef = useRef<HTMLElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
  const pendingMove = useRef<PendingMove | null>(null)

  // Lưới chủ đề và màn 1 chủ đề dùng chung 1 Card: nút vừa bấm (ô chủ đề, "Tất cả chủ đề") biến mất khỏi trang, focus
  // rơi về <body> và trang giữ nguyên chỗ cuộn. Sau khi màn mới dựng: mở chủ đề thì đầu Card đã bị cuộn khuất được kéo
  // lên (trên điện thoại, ô ở dưới thấp mở ra giữa danh sách từ, không thấy tên chủ đề và nút quay lại) và focus vào
  // "Tất cả chủ đề"; quay lại thì focus đúng ô vừa đóng, cuộn tới nó nếu đang khuất.
  useEffect(() => {
    const move = pendingMove.current
    const card = cardRef.current
    if (!move || !card) return
    pendingMove.current = null
    if (move.kind === "open") {
      const marginTop = parseFloat(getComputedStyle(card).scrollMarginTop) || 0
      if (card.getBoundingClientRect().top < marginTop) card.scrollIntoView({ block: "start" })
      backRef.current?.focus({ preventScroll: true })
      return
    }
    const tile = Array.from(card.querySelectorAll<HTMLElement>("[data-topic]")).find(
      (element) => element.dataset.topic === move.topic
    )
    if (!tile) return
    tile.focus({ preventScroll: true })
    tile.scrollIntoView({ block: "nearest" })
  })

  function openTopic(next: string) {
    pendingMove.current = { kind: "open" }
    onTopicChange(next)
  }

  function backToTopics(current: string) {
    pendingMove.current = { kind: "back", topic: current }
    onTopicChange(null)
  }

  if (topic === null) {
    const topics = summarizeTopics(vocab, learned, level)
    const shown = filterByLevel(vocab, level)
    const learnedIds = new Set(learned)
    const learnedShown = shown.filter((entry) => learnedIds.has(entry.id)).length

    return (
      <Card
        ref={cardRef}
        className={SCROLL_MARGIN_TOP}
        label={`Chủ đề · ${topics.length}`}
        action={<span className={COUNT_TEXT}>{`Đã học ${learnedShown}/${shown.length}`}</span>}
      >
        <LevelFilter counts={levelCounts(vocab)} active={level} onChange={onLevelChange} />
        {topics.length ? (
          <div className={TOPIC_GRID}>
            {topics.map((summary, index) => (
              <TopicTile
                key={summary.topic}
                summary={summary}
                statsId={`${statsBaseId}-${index}`}
                onOpen={() => openTopic(summary.topic)}
              />
            ))}
          </div>
        ) : (
          <p className="text-[13.5px] text-[var(--ob-color-text-muted)]">{`Chưa có từ ${level} nào.`}</p>
        )}
      </Card>
    )
  }

  const topicWords = vocab.filter((entry) => topicKey(entry) === topic)
  const shown = filterByLevel(topicWords, level)

  return (
    <Card
      ref={cardRef}
      className={SCROLL_MARGIN_TOP}
      label={`${topicLabel(topic)} · ${shown.length} từ`}
      action={
        <Button ref={backRef} variant="ghost" size="sm" type="button" onClick={() => backToTopics(topic)}>
          <ChevronLeft size={16} />
          Tất cả chủ đề
        </Button>
      }
    >
      <LevelFilter counts={levelCounts(topicWords)} active={level} onChange={onLevelChange} />
      {shown.length ? (
        <div className="flex flex-col gap-5">
          {groupByLevel(shown).map((group) => (
            <div key={group.level ?? "none"}>
              <h3 className="mb-3 text-[13.5px] font-bold">{`${group.level ?? "Chưa xếp cấp"} · ${group.words.length} từ`}</h3>
              <div className={WORD_GRID}>
                {group.words.map((entry) => (
                  <VocabWordCard
                    key={entry.id}
                    entry={entry}
                    learned={learned.includes(entry.id)}
                    onToggleLearned={onToggleLearned}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13.5px] text-[var(--ob-color-text-muted)]">{`Chưa có từ ${level} nào trong chủ đề này.`}</p>
      )}
    </Card>
  )
}

export { VocabBrowser }
