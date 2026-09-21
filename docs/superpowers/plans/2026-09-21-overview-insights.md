# Bộ phát hiện mẫu hình (Insights) cho trang Tổng quan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm 1 khu vực "gợi ý" mới trên trang Tổng quan, tự phát hiện 4 mẫu hình thống kê thật trong dữ liệu Chi tiêu/Nhật ký/Tài chính/Mục tiêu đã có sẵn, hiển thị bằng câu tiếng Việt dựng sẵn, không gọi API nào, không tốn phí.

**Architecture:** 4 hàm phát hiện là hàm thuần, nhận dữ liệu thô + `today`/`month` làm tham số, trả về `Insight | null`. Thêm 1 storage mới (`net-worth-history`) để tích luỹ snapshot tài sản ròng theo ngày, phục vụ riêng insight dự báo mục tiêu (2 module Tài chính/Mục tiêu hiện không lưu lịch sử theo thời gian). Thêm `score` (1-5) vào `Mood`/`MoodSnapshot` để biết mood nào "thấp"/"cao". Toàn bộ tính lại mỗi lần Tổng quan render, không cache.

**Tech Stack:** Next.js/TypeScript, Zod (validate storage mới), Vitest + RTL — không thêm dependency nào mới.

**Spec:** `docs/superpowers/specs/2026-09-21-overview-insights-design.md`

## Global Constraints

- Hằng số ngưỡng: `ANOMALY_LOOKBACK_MONTHS = 3`, `ANOMALY_Z_SCORE_THRESHOLD = 1.5`, `TAG_ANOMALY_PCT_THRESHOLD = 0.5`, `MOOD_WINDOW_DAYS = 60`, `MOOD_MIN_DAYS_PER_GROUP = 5`, `MOOD_LOW_SCORE_MAX = 2`, `MOOD_HIGH_SCORE_MIN = 4`, `MOOD_PCT_THRESHOLD = 0.2`, `FORECAST_MIN_POINTS = 14`.
- Mọi hàm phát hiện đều là hàm THUẦN — nhận `today: string` (dayKey) / `month: string` (monthKey) làm tham số, KHÔNG tự gọi `dayKey()`/`monthKey()` bên trong.
- `Mood.score`/`MoodSnapshot.score`: 1 (rất tệ) – 5 (rất tốt). `MoodSnapshot` là snapshot đông cứng tại thời điểm ghi — entry Nhật ký cũ thiếu `score` phải được BỎ QUA khi tính insight (không mặc định về 3, vì đó là giả định sai lệch tín hiệu).
- Snapshot tài sản ròng lưu CẢ `net` và `savingsTotal` trong cùng 1 bản ghi/ngày — insight dự báo mục tiêu dùng đúng `savingsTotal` (khớp đơn vị với mục tiêu "Tiết kiệm"), không dùng `net`.
- `insights-calculations.ts`/`net-worth-history-calculations.ts`/`net-worth-history-storage.ts` thuộc feature `overview`, KHÔNG thuộc `finance`/`budget`/`journal` — các feature đó không cần biết gì về insight.
- `net-worth-history-storage.ts` lọc từng phần tử hỏng (không kéo sập cả mảng) — mirror đúng `budget-storage.ts`'s `safeArray`, KHÁC `finance-storage.ts`'s whole-array `safeField`.
- Mỗi insight có `id` ổn định để dismiss theo instance (không dismiss theo loại) — dismiss xong đúng `id` đó không hiện lại, kỳ sau (id khác, vd. gắn theo tháng) vẫn có cơ hội hiện lại nếu còn đúng ngưỡng.

---

### Task 1: Thêm `score` vào `Mood`, thêm `dismissedInsights` vào `AppSettings`

**Files:**
- Modify: `src/lib/settings-storage.ts`
- Test: `src/lib/__tests__/settings-storage.test.ts`

**Interfaces:**
- Produces: `Mood.score: number`, `AppSettings.dismissedInsights: string[]` — dùng bởi Task 2 (MoodSnapshot), Task 3 (`addMood`/`dismissInsight`), Task 12 (wiring).

- [ ] **Step 1: Viết test thất bại**

Thêm vào `src/lib/__tests__/settings-storage.test.ts` (trong `describe("getStoredSettings", ...)`):

```ts
  it("backfills a score of 3 for a mood saved before this feature existed", () => {
    const oldMoods = DEFAULT_MOODS.map(({ score: _score, ...rest }) => rest)
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, moods: oldMoods }))

    const settings = getStoredSettings()

    expect(settings.moods.every((m) => typeof m.score === "number")).toBe(true)
    expect(settings.moods[0].score).toBe(3)
  })

  it("keeps a mood's own score when it is already present in storage", () => {
    const moods = DEFAULT_MOODS.map((m) => (m.label === "Buồn" ? { ...m, score: 1 } : m))
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, moods }))

    expect(getStoredSettings().moods.find((m) => m.label === "Buồn")?.score).toBe(1)
  })

  it("defaults dismissedInsights to an empty array when missing from storage", () => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, dismissedInsights: undefined }))

    expect(getStoredSettings().dismissedInsights).toEqual([])
  })

  it("keeps a valid dismissedInsights array from storage", () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, dismissedInsights: ["spending-anomaly-2026-08"] })
    )

    expect(getStoredSettings().dismissedInsights).toEqual(["spending-anomaly-2026-08"])
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/lib/__tests__/settings-storage.test.ts`
Expected: FAIL — `m.score` là `undefined`, `dismissedInsights` không tồn tại trên `AppSettings`

- [ ] **Step 3: Sửa `src/lib/settings-storage.ts`**

Sửa `interface Mood`:
```ts
interface Mood {
  label: string
  emoji: string
  desc: string
  tint: string
  on: boolean
  score: number // 1 (rất tệ) – 5 (rất tốt), dùng để tính tương quan chi tiêu-tâm trạng
}
```

Sửa `DEFAULT_MOODS`:
```ts
const DEFAULT_MOODS: Mood[] = [
  { label: "Tuyệt vời", emoji: "😄", desc: "Mọi thứ đều trôi chảy", tint: "#FFF0B8", on: true, score: 5 },
  { label: "Vui", emoji: "🙂", desc: "Tâm trạng tốt, nhẹ người", tint: "#FFE0C7", on: true, score: 4 },
  { label: "Bình yên", emoji: "😌", desc: "Thư thái, không vướng bận", tint: "#E7F6EF", on: true, score: 4 },
  { label: "Bình thường", emoji: "😐", desc: "Không vui cũng không buồn", tint: "#F2E9DC", on: true, score: 3 },
  { label: "Mệt", emoji: "😴", desc: "Cần nghỉ, thiếu năng lượng", tint: "#EAF1FE", on: true, score: 2 },
  { label: "Lo lắng", emoji: "😟", desc: "Có chuyện đang nghĩ", tint: "#F0ECFE", on: false, score: 2 },
  { label: "Buồn", emoji: "😔", desc: "Hôm nay hơi trũng", tint: "#E4E9F2", on: false, score: 1 },
  { label: "Căng thẳng", emoji: "😣", desc: "Áp lực, quá tải", tint: "#FDEBF2", on: false, score: 1 },
]
```

Sửa `interface AppSettings`:
```ts
interface AppSettings {
  profile: Profile
  moods: Mood[]
  modules: ModuleToggle[]
  tags: BudgetTag[]
  dismissedInsights: string[]
}
```

Sửa `DEFAULT_SETTINGS`:
```ts
const DEFAULT_SETTINGS: AppSettings = {
  profile: DEFAULT_PROFILE,
  moods: DEFAULT_MOODS,
  modules: DEFAULT_MODULES,
  tags: DEFAULT_TAGS,
  dismissedInsights: [],
}
```

Sửa `getStoredSettings()`:
```ts
function getStoredSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    const profile =
      parsed.profile && typeof parsed.profile === "object"
        ? { ...DEFAULT_SETTINGS.profile, ...parsed.profile }
        : DEFAULT_SETTINGS.profile
    // Mood cũ lưu trước tính năng insight thiếu hẳn `score` — backfill 3 (trung tính) cho
    // từng phần tử thiếu, không làm mất cả mảng như 1 validate toàn phần sẽ làm.
    const rawMoods = Array.isArray(parsed.moods) ? parsed.moods : DEFAULT_SETTINGS.moods
    const moods = rawMoods.map((m: Partial<Mood>) => ({
      ...m,
      score: typeof m.score === "number" ? m.score : 3,
    })) as Mood[]
    const tags = Array.isArray(parsed.tags) ? parsed.tags : DEFAULT_SETTINGS.tags
    const dismissedInsights = Array.isArray(parsed.dismissedInsights) ? parsed.dismissedInsights : []
    return { profile, moods, modules: mergeModules(parsed.modules), tags, dismissedInsights }
  } catch {
    return DEFAULT_SETTINGS
  }
}
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/lib/__tests__/settings-storage.test.ts`
Expected: tất cả PASS (kể cả các test cũ không liên quan)

- [ ] **Step 5: `npx tsc --noEmit` sạch, commit**

```bash
npx tsc --noEmit
npm run lint
git add src/lib/settings-storage.ts src/lib/__tests__/settings-storage.test.ts
git commit -m "feat: add mood score and per-instance insight dismissal to settings"
```

---

### Task 2: Thêm `score` vào `MoodSnapshot`, wire vào `journal-view.tsx`

**Files:**
- Modify: `src/features/journal/types.ts`
- Modify: `src/features/journal/components/journal-view.tsx`
- Modify (compile-fix, xem Step 1): `src/features/journal/__tests__/hooks/use-journal.test.ts`, `src/features/journal/__tests__/components/journal-editor.test.tsx`, `src/features/journal/__tests__/components/journal-entries-card.test.tsx`, `src/features/journal/__tests__/components/on-this-day-card.test.tsx`

**Interfaces:**
- Consumes: `Mood.score` (Task 1).
- Produces: `MoodSnapshot.score: number` — dùng bởi Task 9 (`detectMoodSpendingCorrelation` đọc `JournalEntry.mood.score`).

- [ ] **Step 1: Sửa 5 chỗ compile lỗi trước — thêm `score` vào các mood literal có sẵn trong test**

`MoodSnapshot` sắp có thêm field bắt buộc `score` — 5 chỗ sau (đã có từ trước, không thuộc phạm vi task này) sẽ không còn khớp type nữa. Sửa NGAY để giữ tsc xanh, KHÔNG đổi gì khác:

Trong `src/features/journal/__tests__/hooks/use-journal.test.ts:81`, đổi:
```ts
    const mood = { emoji: "🙂", label: "Vui", tint: "#FFE0C7" }
```
thành:
```ts
    const mood = { emoji: "🙂", label: "Vui", tint: "#FFE0C7", score: 4 }
```

Trong `src/features/journal/__tests__/components/journal-editor.test.tsx:92`, đổi:
```ts
    const mood = { emoji: "🙂", label: "Vui", tint: "#FFE0C7" }
```
thành:
```ts
    const mood = { emoji: "🙂", label: "Vui", tint: "#FFE0C7", score: 4 }
```

Trong `src/features/journal/__tests__/components/journal-editor.test.tsx:202`, đổi:
```ts
    const mood = { emoji: "😌", label: "Bình yên", tint: "#E7F6EF" }
```
thành:
```ts
    const mood = { emoji: "😌", label: "Bình yên", tint: "#E7F6EF", score: 4 }
```

Trong `src/features/journal/__tests__/components/journal-entries-card.test.tsx:24`, đổi:
```ts
  mood: { emoji: "😌", label: "Bình yên", tint: "#E7F6EF" },
```
thành:
```ts
  mood: { emoji: "😌", label: "Bình yên", tint: "#E7F6EF", score: 4 },
```

Trong `src/features/journal/__tests__/components/on-this-day-card.test.tsx:17`, đổi:
```ts
        mood: { emoji: "🙂", label: "Vui", tint: "#FFE0C7" },
```
thành:
```ts
        mood: { emoji: "🙂", label: "Vui", tint: "#FFE0C7", score: 4 },
```

- [ ] **Step 2: Viết test thất bại cho journal-view**

File `src/features/journal/__tests__/components/journal-view.test.tsx` đã tồn tại, đã có sẵn helper `typeInto(editor, text)` ở đầu file (set cả `innerHTML`/`innerText` rồi bắn `fireEvent.input` — contentEditable không dùng được `fireEvent.change` như input/textarea thường). Thêm vào cuối `describe("JournalView", ...)`:
```tsx
  it("copies the selected mood's score into the saved journal snapshot", async () => {
    render(<JournalView />)

    fireEvent.click(screen.getByText("Vui")) // mood mặc định "on: true", score = 4
    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Một ngày ổn")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    await waitFor(() => expect(screen.getByText("Đã lưu vào nhật ký")).toBeInTheDocument())
    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries[0].mood.score).toBe(4)
  })
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/journal/__tests__/components/journal-view.test.tsx`
Expected: FAIL — `stored.entries[0].mood.score` là `undefined`

- [ ] **Step 4: Sửa `journal/types.ts` và `journal-view.tsx`**

Sửa `src/features/journal/types.ts`:
```ts
interface MoodSnapshot {
  emoji: string
  label: string
  tint: string
  score: number
}
```

Sửa `src/features/journal/components/journal-view.tsx`, dòng tạo snapshot:
```ts
  const selectedMoodSnapshot = selectedMood
    ? { emoji: selectedMood.emoji, label: selectedMood.label, tint: selectedMood.tint, score: selectedMood.score }
    : null
```

- [ ] **Step 5: Chạy lại toàn bộ test file liên quan, xác nhận PASS**

Run: `npx vitest run src/features/journal`
Expected: tất cả PASS

- [ ] **Step 6: `npx tsc --noEmit` sạch, commit**

```bash
npx tsc --noEmit
npm run lint
git add src/features/journal/types.ts src/features/journal/components/journal-view.tsx src/features/journal/__tests__/
git commit -m "feat: carry a mood's score into the saved journal snapshot"
```

---

### Task 3: `addMood` tự gán score mặc định, thêm `dismissInsight`

**Files:**
- Modify: `src/features/settings/hooks/use-settings.ts`
- Modify: `src/features/settings/__tests__/hooks/use-settings.test.ts`

**Interfaces:**
- Consumes: `Mood.score`, `AppSettings.dismissedInsights` (Task 1).
- Produces: `useSettings().dismissInsight(id: string): void` — dùng bởi Task 12 (`InsightsSection`'s `onDismiss`).

- [ ] **Step 1: Viết test thất bại**

Thêm vào `src/features/settings/__tests__/hooks/use-settings.test.ts`:
```ts
  it("defaults a newly added mood's score to 3 (neutral)", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    act(() => {
      result.current.addMood({ label: "Hào hứng", desc: "Có việc đang mong chờ", emoji: "🥳" })
    })

    expect(result.current.settings.moods.at(-1)?.score).toBe(3)
  })

  it("dismisses an insight by id and persists it", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    act(() => {
      result.current.dismissInsight("spending-anomaly-2026-09")
    })

    expect(result.current.settings.dismissedInsights).toEqual(["spending-anomaly-2026-09"])
    expect(getStoredSettings().dismissedInsights).toEqual(["spending-anomaly-2026-09"])
  })

  it("does not add the same insight id twice when dismissed more than once", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    act(() => {
      result.current.dismissInsight("savings-forecast")
    })
    act(() => {
      result.current.dismissInsight("savings-forecast")
    })

    expect(result.current.settings.dismissedInsights).toEqual(["savings-forecast"])
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/settings/__tests__/hooks/use-settings.test.ts`
Expected: FAIL — `score` là `undefined`, `dismissInsight is not a function`

- [ ] **Step 3: Sửa `use-settings.ts`**

Sửa `addMood`:
```ts
  const addMood = useCallback(
    (mood: Omit<Mood, "tint" | "on" | "score">) => {
      try {
        const tint = TINT_PALETTE[settings.moods.length % TINT_PALETTE.length]
        persist({ ...settings, moods: [...settings.moods, { ...mood, tint, on: true, score: 3 }] })
        toast.success(`Đã thêm tâm trạng "${mood.label}"`)
      } catch {
        toast.error(`Không thể thêm tâm trạng "${mood.label}". Vui lòng thử lại.`)
      }
    },
    [settings, persist]
  )
```

Thêm `dismissInsight` (sau `toggleTag`, trước `return`):
```ts
  const dismissInsight = useCallback(
    (id: string) => {
      if (settings.dismissedInsights.includes(id)) return
      persist({ ...settings, dismissedInsights: [...settings.dismissedInsights, id] })
    },
    [settings, persist]
  )
```

Thêm `dismissInsight` vào object trả về:
```ts
  return {
    settings,
    updateProfile,
    toggleModule,
    toggleMood,
    removeMood,
    addMood,
    toggleTag,
    dismissInsight,
    replaceSettings: persist,
  }
```

- [ ] **Step 4: Chạy lại toàn bộ test file, xác nhận PASS**

Run: `npx vitest run src/features/settings/__tests__/hooks/use-settings.test.ts`
Expected: tất cả PASS

- [ ] **Step 5: `npx tsc --noEmit` sạch, commit**

```bash
npx tsc --noEmit
npm run lint
git add src/features/settings/hooks/use-settings.ts src/features/settings/__tests__/hooks/use-settings.test.ts
git commit -m "feat: default new moods to a neutral score, add dismissInsight"
```

---

### Task 4: `net-worth-history-storage.ts` (mới)

**Files:**
- Create: `src/features/overview/net-worth-history-storage.ts`
- Test: `src/features/overview/__tests__/net-worth-history-storage.test.ts`

**Interfaces:**
- Produces: `NetWorthSnapshot { date: string; net: number; savingsTotal: number }`, `getStoredNetWorthHistory(): NetWorthSnapshot[]`, `setStoredNetWorthHistory(history: NetWorthSnapshot[]): void` — dùng bởi Task 6.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/features/overview/__tests__/net-worth-history-storage.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest"

import {
  NET_WORTH_HISTORY_KEY,
  getStoredNetWorthHistory,
  setStoredNetWorthHistory,
} from "../net-worth-history-storage"

describe("net-worth-history-storage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("returns an empty array when nothing is stored", () => {
    expect(getStoredNetWorthHistory()).toEqual([])
  })

  it("round-trips a valid history through get/set", () => {
    const history = [
      { date: "2026-09-01", net: 10_000_000, savingsTotal: 5_000_000 },
      { date: "2026-09-02", net: 10_100_000, savingsTotal: 5_100_000 },
    ]
    setStoredNetWorthHistory(history)

    expect(getStoredNetWorthHistory()).toEqual(history)
  })

  it("drops only the malformed entries, keeping the valid ones", () => {
    window.localStorage.setItem(
      NET_WORTH_HISTORY_KEY,
      JSON.stringify([
        { date: "2026-09-01", net: 10_000_000, savingsTotal: 5_000_000 },
        { date: "2026-09-02" }, // thiếu field bắt buộc
      ])
    )

    const history = getStoredNetWorthHistory()

    expect(history).toHaveLength(1)
    expect(history[0].date).toBe("2026-09-01")
  })

  it("falls back to an empty array when localStorage has corrupted JSON", () => {
    window.localStorage.setItem(NET_WORTH_HISTORY_KEY, "{not valid json")

    expect(getStoredNetWorthHistory()).toEqual([])
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/net-worth-history-storage.test.ts`
Expected: FAIL — `Cannot find module '../net-worth-history-storage'`

- [ ] **Step 3: Tạo `net-worth-history-storage.ts`**

```ts
import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"

interface NetWorthSnapshot {
  date: string // dayKey "YYYY-MM-DD"
  net: number
  savingsTotal: number
}

type NetWorthHistory = NetWorthSnapshot[]

const NET_WORTH_HISTORY_KEY = "net-worth-history"
const DEFAULT_NET_WORTH_HISTORY: NetWorthHistory = []

const netWorthSnapshotSchema: z.ZodType<NetWorthSnapshot> = z.object({
  date: z.string(),
  net: z.number(),
  savingsTotal: z.number(),
})

// Lịch sử tích luỹ dài hạn, không giới hạn số điểm — 1 bản ghi hỏng không được kéo sập cả
// mảng, đúng nguyên tắc đã dùng ở budget-storage.ts cho expenses/settlements.
function safeArray<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is T => schema.safeParse(item).success)
}

function getStoredNetWorthHistory(): NetWorthHistory {
  try {
    const raw = window.localStorage.getItem(NET_WORTH_HISTORY_KEY)
    if (!raw) return DEFAULT_NET_WORTH_HISTORY
    return safeArray(netWorthSnapshotSchema, JSON.parse(raw))
  } catch {
    return DEFAULT_NET_WORTH_HISTORY
  }
}

function setStoredNetWorthHistory(history: NetWorthHistory) {
  window.localStorage.setItem(NET_WORTH_HISTORY_KEY, JSON.stringify(history))
  notifyDataChanged()
}

export {
  NET_WORTH_HISTORY_KEY,
  DEFAULT_NET_WORTH_HISTORY,
  getStoredNetWorthHistory,
  setStoredNetWorthHistory,
  type NetWorthSnapshot,
  type NetWorthHistory,
}
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/net-worth-history-storage.test.ts`
Expected: tất cả PASS

- [ ] **Step 5: `npx tsc --noEmit` sạch, commit**

```bash
npx tsc --noEmit
npm run lint
git add src/features/overview/net-worth-history-storage.ts src/features/overview/__tests__/net-worth-history-storage.test.ts
git commit -m "feat: add net-worth snapshot storage for the savings forecast insight"
```

---

### Task 5: `net-worth-history-calculations.ts` (mới) — `shouldRecordSnapshot`/`appendSnapshot`

**Files:**
- Create: `src/features/overview/net-worth-history-calculations.ts`
- Test: `src/features/overview/__tests__/net-worth-history-calculations.test.ts`

**Interfaces:**
- Consumes: `NetWorthSnapshot` (Task 4).
- Produces: `shouldRecordSnapshot(history, today): boolean`, `appendSnapshot(history, snapshot): NetWorthSnapshot[]` — dùng bởi Task 6.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/features/overview/__tests__/net-worth-history-calculations.test.ts`:
```ts
import { describe, it, expect } from "vitest"

import { shouldRecordSnapshot, appendSnapshot } from "../net-worth-history-calculations"
import type { NetWorthSnapshot } from "../net-worth-history-storage"

describe("shouldRecordSnapshot", () => {
  it("returns true when history is empty", () => {
    expect(shouldRecordSnapshot([], "2026-09-21")).toBe(true)
  })

  it("returns false when the last entry is already today", () => {
    const history: NetWorthSnapshot[] = [{ date: "2026-09-21", net: 1, savingsTotal: 1 }]
    expect(shouldRecordSnapshot(history, "2026-09-21")).toBe(false)
  })

  it("returns true when the last entry is an earlier day", () => {
    const history: NetWorthSnapshot[] = [{ date: "2026-09-20", net: 1, savingsTotal: 1 }]
    expect(shouldRecordSnapshot(history, "2026-09-21")).toBe(true)
  })
})

describe("appendSnapshot", () => {
  it("appends a new snapshot when today is not yet recorded", () => {
    const history: NetWorthSnapshot[] = [{ date: "2026-09-20", net: 1_000, savingsTotal: 500 }]
    const next = appendSnapshot(history, { date: "2026-09-21", net: 1_100, savingsTotal: 550 })

    expect(next).toHaveLength(2)
    expect(next[1]).toEqual({ date: "2026-09-21", net: 1_100, savingsTotal: 550 })
  })

  it("returns the same reference when today is already recorded, without duplicating", () => {
    const history: NetWorthSnapshot[] = [{ date: "2026-09-21", net: 1_000, savingsTotal: 500 }]
    const next = appendSnapshot(history, { date: "2026-09-21", net: 9_999, savingsTotal: 9_999 })

    expect(next).toBe(history)
    expect(next).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/net-worth-history-calculations.test.ts`
Expected: FAIL — `Cannot find module '../net-worth-history-calculations'`

- [ ] **Step 3: Tạo `net-worth-history-calculations.ts`**

```ts
import type { NetWorthSnapshot } from "./net-worth-history-storage"

function shouldRecordSnapshot(history: NetWorthSnapshot[], today: string): boolean {
  const last = history[history.length - 1]
  return !last || last.date !== today
}

function appendSnapshot(history: NetWorthSnapshot[], snapshot: NetWorthSnapshot): NetWorthSnapshot[] {
  if (!shouldRecordSnapshot(history, snapshot.date)) return history
  return [...history, snapshot]
}

export { shouldRecordSnapshot, appendSnapshot }
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/net-worth-history-calculations.test.ts`
Expected: tất cả PASS

- [ ] **Step 5: `npx tsc --noEmit` sạch, commit**

```bash
npx tsc --noEmit
npm run lint
git add src/features/overview/net-worth-history-calculations.ts src/features/overview/__tests__/net-worth-history-calculations.test.ts
git commit -m "feat: add pure once-per-day snapshot recording logic"
```

---

### Task 6: `use-net-worth-history.ts` (hook mới)

**Files:**
- Create: `src/features/overview/hooks/use-net-worth-history.ts`
- Test: `src/features/overview/__tests__/hooks/use-net-worth-history.test.ts`

**Interfaces:**
- Consumes: `getStoredNetWorthHistory`/`setStoredNetWorthHistory` (Task 4), `appendSnapshot` (Task 5).
- Produces: `useNetWorthHistory(): { history: NetWorthSnapshot[]; recordSnapshot(net: number, savingsTotal: number): void }` — dùng bởi Task 12.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/features/overview/__tests__/hooks/use-net-worth-history.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"

import { useNetWorthHistory } from "../../hooks/use-net-worth-history"
import { getStoredNetWorthHistory } from "../../net-worth-history-storage"

describe("useNetWorthHistory", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("starts empty and records a snapshot for today", async () => {
    const { result } = renderHook(() => useNetWorthHistory())
    await waitFor(() => expect(result.current.history).toEqual([]))

    act(() => {
      result.current.recordSnapshot(10_000_000, 5_000_000)
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].net).toBe(10_000_000)
    expect(result.current.history[0].savingsTotal).toBe(5_000_000)
    expect(getStoredNetWorthHistory()).toHaveLength(1)
  })

  it("does not record a second snapshot for the same day", async () => {
    const { result } = renderHook(() => useNetWorthHistory())
    await waitFor(() => expect(result.current.history).toEqual([]))

    act(() => {
      result.current.recordSnapshot(10_000_000, 5_000_000)
    })
    act(() => {
      result.current.recordSnapshot(20_000_000, 9_000_000)
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].net).toBe(10_000_000)
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/hooks/use-net-worth-history.test.ts`
Expected: FAIL — `Cannot find module '../../hooks/use-net-worth-history'`

- [ ] **Step 3: Tạo `use-net-worth-history.ts`**

```ts
"use client"

import { useCallback, useEffect, useState } from "react"

import { dayKey } from "@/lib/date"
import { appendSnapshot } from "../net-worth-history-calculations"
import {
  DEFAULT_NET_WORTH_HISTORY,
  getStoredNetWorthHistory,
  setStoredNetWorthHistory,
  type NetWorthHistory,
} from "../net-worth-history-storage"

function useNetWorthHistory() {
  const [history, setHistory] = useState<NetWorthHistory>(DEFAULT_NET_WORTH_HISTORY)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(getStoredNetWorthHistory())
  }, [])

  const recordSnapshot = useCallback(
    (net: number, savingsTotal: number) => {
      setHistory((current) => {
        const next = appendSnapshot(current, { date: dayKey(), net, savingsTotal })
        if (next !== current) setStoredNetWorthHistory(next)
        return next
      })
    },
    []
  )

  return { history, recordSnapshot }
}

export { useNetWorthHistory }
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/hooks/use-net-worth-history.test.ts`
Expected: tất cả PASS

- [ ] **Step 5: `npx tsc --noEmit` sạch, commit**

```bash
npx tsc --noEmit
npm run lint
git add src/features/overview/hooks/use-net-worth-history.ts src/features/overview/__tests__/hooks/use-net-worth-history.test.ts
git commit -m "feat: add useNetWorthHistory hook for daily snapshot recording"
```

---

### Task 7: `insights-calculations.ts` — `detectSpendingAnomaly`

**Files:**
- Create: `src/features/overview/insights-calculations.ts`
- Test: `src/features/overview/__tests__/insights-calculations.test.ts`

**Interfaces:**
- Produces: `Insight { id: string; text: string }`, `detectSpendingAnomaly(expenses, month, today): Insight | null` — dùng bởi Task 12. Hằng số `ANOMALY_LOOKBACK_MONTHS`, `ANOMALY_Z_SCORE_THRESHOLD` cũng dùng lại ở Task 8.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/features/overview/__tests__/insights-calculations.test.ts`:
```ts
import { describe, it, expect } from "vitest"

import { detectSpendingAnomaly } from "../insights-calculations"
import type { Expense } from "@/features/budget/types"

function expense(id: number, dayKey: string, amount: number): Expense {
  return { id, dayKey, amount, tag: null }
}

describe("detectSpendingAnomaly", () => {
  it("returns null when there is less than 3 months of prior history", () => {
    const expenses = [expense(1, "2026-03-01", 1_000_000), expense(2, "2026-04-01", 1_000_000)]
    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-15")).toBeNull()
  })

  it("returns null when the current month is within normal variance", () => {
    const expenses = [
      expense(1, "2026-01-15", 1_000_000),
      expense(2, "2026-02-15", 1_100_000),
      expense(3, "2026-03-15", 900_000),
      expense(4, "2026-04-15", 1_050_000),
    ]
    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-20")).toBeNull()
  })

  it("returns null when the 3 prior months have zero variance (std = 0)", () => {
    const expenses = [
      expense(1, "2026-01-15", 1_000_000),
      expense(2, "2026-02-15", 1_000_000),
      expense(3, "2026-03-15", 1_000_000),
      expense(4, "2026-04-15", 5_000_000),
    ]
    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-20")).toBeNull()
  })

  it("reports a high anomaly with the correct id, direction and percentage", () => {
    const expenses = [
      expense(1, "2026-01-15", 1_000_000),
      expense(2, "2026-02-15", 1_100_000),
      expense(3, "2026-03-15", 900_000),
      expense(4, "2026-04-15", 3_000_000),
    ]
    const insight = detectSpendingAnomaly(expenses, "2026-04", "2026-04-20")

    expect(insight).toEqual({
      id: "spending-anomaly-2026-04",
      text: "Tháng này bạn chi tiêu cao hơn khoảng 200% so với trung bình 3 tháng gần đây.",
    })
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/insights-calculations.test.ts`
Expected: FAIL — `Cannot find module '../insights-calculations'`

- [ ] **Step 3: Tạo `insights-calculations.ts`**

```ts
import { monthKeyFromDayKey, shiftMonth } from "@/lib/date"
import { monthlyExpenseTotals, totalExpensesForMonth } from "@/features/budget/budget-calculations"
import type { Expense } from "@/features/budget/types"

interface Insight {
  id: string
  text: string
}

const ANOMALY_LOOKBACK_MONTHS = 3
const ANOMALY_Z_SCORE_THRESHOLD = 1.5

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function sampleStdDev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function detectSpendingAnomaly(expenses: Expense[], month: string, today: string): Insight | null {
  if (!expenses.length) return null
  const earliestMonth = expenses.reduce(
    (min, e) => (monthKeyFromDayKey(e.dayKey) < min ? monthKeyFromDayKey(e.dayKey) : min),
    monthKeyFromDayKey(expenses[0].dayKey)
  )
  const requiredEarliest = shiftMonth(month, -ANOMALY_LOOKBACK_MONTHS)
  if (earliestMonth > requiredEarliest) return null

  const priorMonths = Array.from({ length: ANOMALY_LOOKBACK_MONTHS }, (_, i) =>
    shiftMonth(month, -(ANOMALY_LOOKBACK_MONTHS - i))
  )
  const priorTotals = monthlyExpenseTotals(expenses, priorMonths).map((p) => p.total)
  const currentTotal = totalExpensesForMonth(expenses, month)
  const std = sampleStdDev(priorTotals)
  if (std === 0) return null

  const z = (currentTotal - mean(priorTotals)) / std
  if (Math.abs(z) < ANOMALY_Z_SCORE_THRESHOLD) return null

  const pct = Math.round((Math.abs(currentTotal - mean(priorTotals)) / mean(priorTotals)) * 100)
  const direction = z > 0 ? "cao hơn" : "thấp hơn"
  return {
    id: `spending-anomaly-${month}`,
    text: `Tháng này bạn chi tiêu ${direction} khoảng ${pct}% so với trung bình 3 tháng gần đây.`,
  }
}

export { ANOMALY_LOOKBACK_MONTHS, ANOMALY_Z_SCORE_THRESHOLD, detectSpendingAnomaly, type Insight }
```
(`mean`/`sampleStdDev` chưa export — sẽ export thêm ở Task 8 vì `detectTagAnomaly` cũng cần dùng lại.)

`today` chưa thực sự được dùng bên trong hàm ở bước này (chỉ `month` được dùng) — giữ nguyên tham số vì interface đã chốt trong spec (mọi hàm phát hiện đều nhận `today` để nhất quán, kể cả khi 1 hàm cụ thể chưa cần tới nó) và vì test đã gọi với 3 tham số.

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/insights-calculations.test.ts`
Expected: tất cả PASS

- [ ] **Step 5: `npx tsc --noEmit` sạch, commit**

```bash
npx tsc --noEmit
npm run lint
git add src/features/overview/insights-calculations.ts src/features/overview/__tests__/insights-calculations.test.ts
git commit -m "feat: add detectSpendingAnomaly insight"
```

---

### Task 8: `insights-calculations.ts` — `detectTagAnomaly`

**Files:**
- Modify: `src/features/overview/insights-calculations.ts`
- Modify: `src/features/overview/__tests__/insights-calculations.test.ts`

**Interfaces:**
- Consumes: `ANOMALY_LOOKBACK_MONTHS`, `mean` (Task 7, cần export thêm `mean`).
- Produces: `detectTagAnomaly(expenses, month): Insight | null` — dùng bởi Task 12.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `src/features/overview/__tests__/insights-calculations.test.ts`:
```ts
import { detectTagAnomaly } from "../insights-calculations"

function taggedExpense(id: number, dayKey: string, amount: number, label: string): Expense {
  return { id, dayKey, amount, tag: { label, emoji: "🛍️", tint: "#E7F6EF" } }
}

describe("detectTagAnomaly", () => {
  it("reports only the single most-deviated tag, ignoring one within threshold", () => {
    const expenses = [
      // "Ăn uống" ổn định quanh 500k mỗi tháng — KHÔNG lệch.
      taggedExpense(1, "2026-01-10", 500_000, "Ăn uống"),
      taggedExpense(2, "2026-02-10", 520_000, "Ăn uống"),
      taggedExpense(3, "2026-03-10", 480_000, "Ăn uống"),
      taggedExpense(4, "2026-04-10", 510_000, "Ăn uống"),
      // "Mua sắm" tăng vọt tháng 4 — LỆCH mạnh.
      taggedExpense(5, "2026-01-12", 200_000, "Mua sắm"),
      taggedExpense(6, "2026-02-12", 200_000, "Mua sắm"),
      taggedExpense(7, "2026-03-12", 200_000, "Mua sắm"),
      taggedExpense(8, "2026-04-12", 500_000, "Mua sắm"),
    ]

    const insight = detectTagAnomaly(expenses, "2026-04")

    expect(insight).toEqual({
      id: "tag-anomaly-2026-04",
      text: 'Chi tiêu cho "🛍️ Mua sắm" tháng này tăng 150% so với trung bình 3 tháng trước.',
    })
  })

  it("returns null when no tag exceeds the threshold", () => {
    const expenses = [
      taggedExpense(1, "2026-01-10", 500_000, "Ăn uống"),
      taggedExpense(2, "2026-02-10", 520_000, "Ăn uống"),
      taggedExpense(3, "2026-03-10", 480_000, "Ăn uống"),
      taggedExpense(4, "2026-04-10", 510_000, "Ăn uống"),
    ]

    expect(detectTagAnomaly(expenses, "2026-04")).toBeNull()
  })

  it("ignores a tag with no spending in the prior 3 months (no baseline to compare)", () => {
    const expenses = [taggedExpense(1, "2026-04-05", 1_000_000, "Du lịch")]

    expect(detectTagAnomaly(expenses, "2026-04")).toBeNull()
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/insights-calculations.test.ts`
Expected: FAIL — `detectTagAnomaly is not exported`

- [ ] **Step 3: Thêm `detectTagAnomaly` vào `insights-calculations.ts`**

Thêm import `monthlyTagBreakdown` vào dòng import có sẵn:
```ts
import { monthlyExpenseTotals, monthlyTagBreakdown, totalExpensesForMonth } from "@/features/budget/budget-calculations"
```

Thêm hằng số:
```ts
const TAG_ANOMALY_PCT_THRESHOLD = 0.5
```

Thêm hàm (sau `detectSpendingAnomaly`):
```ts
function detectTagAnomaly(expenses: Expense[], month: string): Insight | null {
  const priorMonths = Array.from({ length: ANOMALY_LOOKBACK_MONTHS }, (_, i) =>
    shiftMonth(month, -(ANOMALY_LOOKBACK_MONTHS - i))
  )
  const allMonths = [...priorMonths, month]
  const series = monthlyTagBreakdown(expenses, allMonths)

  let worst: { label: string; emoji: string; pct: number; direction: string } | null = null
  for (const tagSeries of series) {
    const priorValues = tagSeries.data.slice(0, ANOMALY_LOOKBACK_MONTHS)
    const currentValue = tagSeries.data[ANOMALY_LOOKBACK_MONTHS]
    const avgPrior = mean(priorValues)
    if (avgPrior === 0) continue
    const pct = (currentValue - avgPrior) / avgPrior
    if (Math.abs(pct) < TAG_ANOMALY_PCT_THRESHOLD) continue
    if (!worst || Math.abs(pct) > Math.abs(worst.pct)) {
      worst = { label: tagSeries.label, emoji: tagSeries.emoji, pct, direction: pct > 0 ? "tăng" : "giảm" }
    }
  }
  if (!worst) return null

  return {
    id: `tag-anomaly-${month}`,
    text: `Chi tiêu cho "${worst.emoji} ${worst.label}" tháng này ${worst.direction} ${Math.round(Math.abs(worst.pct) * 100)}% so với trung bình 3 tháng trước.`,
  }
}
```

Cập nhật dòng `export` cuối file:
```ts
export {
  ANOMALY_LOOKBACK_MONTHS,
  ANOMALY_Z_SCORE_THRESHOLD,
  TAG_ANOMALY_PCT_THRESHOLD,
  detectSpendingAnomaly,
  detectTagAnomaly,
  type Insight,
}
```

- [ ] **Step 4: Chạy lại toàn bộ test file, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/insights-calculations.test.ts`
Expected: tất cả PASS

- [ ] **Step 5: `npx tsc --noEmit` sạch, commit**

```bash
npx tsc --noEmit
npm run lint
git add src/features/overview/insights-calculations.ts src/features/overview/__tests__/insights-calculations.test.ts
git commit -m "feat: add detectTagAnomaly insight"
```

---

### Task 9: `insights-calculations.ts` — `detectMoodSpendingCorrelation`

**Files:**
- Modify: `src/features/overview/insights-calculations.ts`
- Modify: `src/features/overview/__tests__/insights-calculations.test.ts`

**Interfaces:**
- Consumes: `mean` (Task 7), `JournalEntry.mood.score` (Task 2).
- Produces: `detectMoodSpendingCorrelation(expenses, entries, today): Insight | null` — dùng bởi Task 12.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `src/features/overview/__tests__/insights-calculations.test.ts`:
```ts
import { detectMoodSpendingCorrelation } from "../insights-calculations"
import type { JournalEntry } from "@/features/journal/types"

function moodEntry(id: number, score: number): JournalEntry {
  return { id, text: "x", time: "09:00", date: "01/01", words: 1, mood: { emoji: "🙂", label: "x", tint: "#fff", score } }
}

describe("detectMoodSpendingCorrelation", () => {
  const DAY_MS = 24 * 60 * 60 * 1000

  it("returns null when there are fewer than 5 days in either group", () => {
    const today = "2026-09-21"
    const entries = [moodEntry(new Date(2026, 8, 20).getTime(), 1), moodEntry(new Date(2026, 8, 19).getTime(), 5)]
    expect(detectMoodSpendingCorrelation([], entries, today)).toBeNull()
  })

  it("ignores entries with no score (saved before this feature existed)", () => {
    const today = "2026-09-21"
    const legacyEntry: JournalEntry = {
      id: new Date(2026, 8, 20).getTime(),
      text: "x",
      time: "09:00",
      date: "20/09",
      words: 1,
      mood: { emoji: "🙂", label: "x", tint: "#fff" } as JournalEntry["mood"],
    }
    expect(detectMoodSpendingCorrelation([], [legacyEntry], today)).toBeNull()
  })

  it("reports a correlation when low-mood days spend noticeably more than high-mood days", () => {
    const today = new Date(2026, 8, 21)
    const todayKey = "2026-09-21"
    const entries: JournalEntry[] = []
    const expenses: Expense[] = []

    for (let i = 0; i < 5; i++) {
      const lowDay = new Date(today.getTime() - i * DAY_MS)
      entries.push(moodEntry(lowDay.getTime(), 1))
      const lowDayKey = `2026-09-${String(21 - i).padStart(2, "0")}`
      expenses.push(expense(100 + i, lowDayKey, 300_000))
    }
    for (let i = 5; i < 10; i++) {
      const highDay = new Date(today.getTime() - i * DAY_MS)
      entries.push(moodEntry(highDay.getTime(), 5))
      const highDayKey = `2026-09-${String(21 - i).padStart(2, "0")}`
      expenses.push(expense(200 + i, highDayKey, 100_000))
    }

    const insight = detectMoodSpendingCorrelation(expenses, entries, todayKey)

    expect(insight).toEqual({
      id: "mood-spending-2026-09",
      text: "Trong 60 ngày qua, những ngày tâm trạng thấp bạn chi tiêu nhiều hơn khoảng 200% so với những ngày tâm trạng cao.",
    })
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/insights-calculations.test.ts`
Expected: FAIL — `detectMoodSpendingCorrelation is not exported`

- [ ] **Step 3: Thêm `detectMoodSpendingCorrelation` vào `insights-calculations.ts`**

Thêm import:
```ts
import { dayKey, monthKeyFromDayKey, shiftDay, shiftMonth } from "@/lib/date"
import type { JournalEntry } from "@/features/journal/types"
```
(gộp chung với dòng import `date.ts` đã có ở Task 7 — chỉ thêm `dayKey`, `shiftDay` vào danh sách đang import, `monthKeyFromDayKey` đã có sẵn từ Task 7.)

Thêm hằng số:
```ts
const MOOD_WINDOW_DAYS = 60
const MOOD_MIN_DAYS_PER_GROUP = 5
const MOOD_LOW_SCORE_MAX = 2
const MOOD_HIGH_SCORE_MIN = 4
const MOOD_PCT_THRESHOLD = 0.2
```

Thêm hàm:
```ts
function detectMoodSpendingCorrelation(expenses: Expense[], entries: JournalEntry[], today: string): Insight | null {
  const windowStart = shiftDay(today, -MOOD_WINDOW_DAYS)
  const moodByDay = new Map<string, number[]>()
  for (const entry of entries) {
    if (entry.mood?.score === undefined) continue
    const day = dayKey(new Date(entry.id))
    if (day < windowStart || day > today) continue
    const scores = moodByDay.get(day) ?? []
    scores.push(entry.mood.score)
    moodByDay.set(day, scores)
  }

  const lowDaySpends: number[] = []
  const highDaySpends: number[] = []
  for (const [day, scores] of moodByDay) {
    const avgScore = mean(scores)
    const daySpend = expenses.filter((e) => e.dayKey === day).reduce((sum, e) => sum + e.amount, 0)
    if (avgScore <= MOOD_LOW_SCORE_MAX) lowDaySpends.push(daySpend)
    else if (avgScore >= MOOD_HIGH_SCORE_MIN) highDaySpends.push(daySpend)
  }

  if (lowDaySpends.length < MOOD_MIN_DAYS_PER_GROUP || highDaySpends.length < MOOD_MIN_DAYS_PER_GROUP) return null

  const avgLow = mean(lowDaySpends)
  const avgHigh = mean(highDaySpends)
  if (avgHigh === 0) return null
  const pct = (avgLow - avgHigh) / avgHigh
  if (Math.abs(pct) < MOOD_PCT_THRESHOLD) return null

  const direction = pct > 0 ? "nhiều hơn" : "ít hơn"
  return {
    // monthKeyFromDayKey (cắt chuỗi, không parse Date) — KHÔNG dùng `new Date(today)` ở đây:
    // `today` là chuỗi "YYYY-MM-DD", `new Date("YYYY-MM-DD")` bị parse theo UTC (không phải giờ
    // local) trong JS, có thể lệch ngày/tháng tuỳ múi giờ máy chạy — đúng lỗi date.ts's các hàm
    // khác (shiftDay/formatDayKey) đã cố ý tránh bằng cách tự parse tay từng phần.
    id: `mood-spending-${monthKeyFromDayKey(today)}`,
    text: `Trong 60 ngày qua, những ngày tâm trạng thấp bạn chi tiêu ${direction} khoảng ${Math.round(Math.abs(pct) * 100)}% so với những ngày tâm trạng cao.`,
  }
}
```

Cập nhật dòng `export` cuối file, thêm `detectMoodSpendingCorrelation`.

- [ ] **Step 4: Chạy lại toàn bộ test file, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/insights-calculations.test.ts`
Expected: tất cả PASS

- [ ] **Step 5: `npx tsc --noEmit` sạch, commit**

```bash
npx tsc --noEmit
npm run lint
git add src/features/overview/insights-calculations.ts src/features/overview/__tests__/insights-calculations.test.ts
git commit -m "feat: add detectMoodSpendingCorrelation insight"
```

---

### Task 10: `insights-calculations.ts` — `forecastSavingsGoal`

**Files:**
- Modify: `src/features/overview/insights-calculations.ts`
- Modify: `src/features/overview/__tests__/insights-calculations.test.ts`

**Interfaces:**
- Consumes: `mean` (Task 7), `NetWorthSnapshot` (Task 4).
- Produces: `forecastSavingsGoal(history, target, today): Insight | null` — dùng bởi Task 12.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `src/features/overview/__tests__/insights-calculations.test.ts`:
```ts
import { forecastSavingsGoal } from "../insights-calculations"
import type { NetWorthSnapshot } from "../net-worth-history-storage"

function linearHistory(startDate: string, points: number, dailyIncrease: number, startValue: number): NetWorthSnapshot[] {
  return Array.from({ length: points }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const date = d.toISOString().slice(0, 10)
    const savingsTotal = startValue + i * dailyIncrease
    return { date, net: savingsTotal, savingsTotal }
  })
}

describe("forecastSavingsGoal", () => {
  it("returns null when there are fewer than 14 points", () => {
    const history = linearHistory("2026-09-01", 10, 100_000, 5_000_000)
    expect(forecastSavingsGoal(history, 10_000_000, "2026-09-10")).toBeNull()
  })

  it("returns null when the trend is flat or decreasing", () => {
    const history = linearHistory("2026-09-01", 14, 0, 5_000_000)
    expect(forecastSavingsGoal(history, 10_000_000, "2026-09-14")).toBeNull()
  })

  it("returns null when the target is already reached", () => {
    const history = linearHistory("2026-09-01", 14, 100_000, 9_500_000)
    expect(forecastSavingsGoal(history, 10_000_000, "2026-09-14")).toBeNull()
  })

  it("forecasts the correct target date for a steady upward trend", () => {
    const history = linearHistory("2026-09-01", 14, 100_000, 5_000_000)
    const today = "2026-09-14"

    const insight = forecastSavingsGoal(history, 10_000_000, today)

    // Điểm cuối: 5,000,000 + 13*100,000 = 6,300,000. Còn thiếu 3,700,000, tốc độ 100,000/ngày
    // → 37 ngày nữa. shiftDay("2026-09-14", 37) = "2026-10-21".
    expect(insight).toEqual({
      id: "savings-forecast",
      text: expect.stringContaining("21/10"),
    })
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/insights-calculations.test.ts`
Expected: FAIL — `forecastSavingsGoal is not exported`

- [ ] **Step 3: Thêm `forecastSavingsGoal` vào `insights-calculations.ts`**

Thêm `formatDayKey` vào dòng import `@/lib/date` đã có sẵn từ Task 7/9 (gộp chung, KHÔNG tạo thêm 1 dòng `import ... from "@/lib/date"` riêng — ESLint của repo chặn duplicate import cùng 1 module):
```ts
import { dayKey, formatDayKey, monthKeyFromDayKey, shiftDay, shiftMonth } from "@/lib/date"
```
Thêm import type mới:
```ts
import type { NetWorthSnapshot } from "./net-worth-history-storage"
```

Thêm hằng số:
```ts
const FORECAST_MIN_POINTS = 14
```

Thêm hàm:
```ts
function forecastSavingsGoal(history: NetWorthSnapshot[], target: number, today: string): Insight | null {
  if (history.length < FORECAST_MIN_POINTS) return null

  const n = history.length
  const xs = history.map((_, i) => i)
  const ys = history.map((h) => h.savingsTotal)
  const meanX = mean(xs)
  const meanY = mean(ys)
  const numerator = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0)
  const denominator = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0)
  const slope = denominator === 0 ? 0 : numerator / denominator

  const currentSavings = history[n - 1].savingsTotal
  if (currentSavings >= target || slope <= 0) return null

  const daysToTarget = Math.ceil((target - currentSavings) / slope)
  const targetDate = shiftDay(today, daysToTarget)

  return {
    id: "savings-forecast",
    text: `Với nhịp tiết kiệm hiện tại, bạn có thể đạt mục tiêu tiết kiệm vào khoảng ${formatDayKey(targetDate)}.`,
  }
}
```

Cập nhật dòng `export` cuối file, thêm `forecastSavingsGoal`, `FORECAST_MIN_POINTS`.

- [ ] **Step 4: Chạy lại toàn bộ test file, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/insights-calculations.test.ts`
Expected: tất cả PASS

- [ ] **Step 5: `npx tsc --noEmit` sạch, commit**

```bash
npx tsc --noEmit
npm run lint
git add src/features/overview/insights-calculations.ts src/features/overview/__tests__/insights-calculations.test.ts
git commit -m "feat: add forecastSavingsGoal insight"
```

---

### Task 11: Component `InsightsSection`

**Files:**
- Create: `src/features/overview/components/insights-section.tsx`
- Test: `src/features/overview/__tests__/components/insights-section.test.tsx`

**Interfaces:**
- Consumes: `Insight` (Task 7).
- Produces: `InsightsSection({insights, onDismiss}): JSX.Element | null` — dùng bởi Task 12.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/features/overview/__tests__/components/insights-section.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { InsightsSection } from "../../components/insights-section"

describe("InsightsSection", () => {
  it("renders nothing when there are no insights", () => {
    const { container } = render(<InsightsSection insights={[]} onDismiss={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("renders each insight's text", () => {
    render(
      <InsightsSection
        insights={[
          { id: "a", text: "Insight A" },
          { id: "b", text: "Insight B" },
        ]}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.getByText("Insight A")).toBeInTheDocument()
    expect(screen.getByText("Insight B")).toBeInTheDocument()
  })

  it("calls onDismiss with the right id when its dismiss button is clicked", () => {
    const onDismiss = vi.fn()
    render(
      <InsightsSection insights={[{ id: "a", text: "Insight A" }]} onDismiss={onDismiss} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Ẩn gợi ý này" }))

    expect(onDismiss).toHaveBeenCalledWith("a")
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/components/insights-section.test.tsx`
Expected: FAIL — `Cannot find module '../../components/insights-section'`

- [ ] **Step 3: Tạo `insights-section.tsx`**

```tsx
"use client"

import { X } from "lucide-react"

import { Card } from "@/components/ui/card"
import type { Insight } from "../insights-calculations"

interface InsightsSectionProps {
  insights: Insight[]
  onDismiss: (id: string) => void
}

function InsightsSection({ insights, onDismiss }: InsightsSectionProps) {
  if (!insights.length) return null

  return (
    <Card label="Gợi ý cho bạn" className="mb-5">
      <div className="flex flex-col gap-[10px]">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="flex items-start gap-[10px] rounded-[var(--ob-radius-md)] bg-[var(--ob-color-surface-sunken)] px-[14px] py-[11px]"
          >
            <span className="text-base leading-none">💡</span>
            <p className="min-w-0 flex-1 text-[13.5px] leading-[1.5] text-[var(--ob-color-text)]">{insight.text}</p>
            <button
              type="button"
              aria-label="Ẩn gợi ý này"
              onClick={() => onDismiss(insight.id)}
              className="flex size-6 flex-none items-center justify-center rounded-full text-[var(--ob-color-text-subtle)] hover:bg-[var(--ob-color-border)]"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}

export { InsightsSection }
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/components/insights-section.test.tsx`
Expected: tất cả PASS

- [ ] **Step 5: `npx tsc --noEmit` sạch, commit**

```bash
npx tsc --noEmit
npm run lint
git add src/features/overview/components/insights-section.tsx src/features/overview/__tests__/components/insights-section.test.tsx
git commit -m "feat: add InsightsSection component with per-instance dismiss"
```

---

### Task 12: Wire vào `overview-view.tsx`

**Files:**
- Modify: `src/features/overview/components/overview-view.tsx`
- Modify: `src/features/overview/__tests__/components/overview-view.test.tsx`

**Interfaces:**
- Consumes: `useNetWorthHistory` (Task 6), 4 hàm `detect*`/`forecastSavingsGoal` (Task 7-10), `InsightsSection` (Task 11), `useSettings().dismissInsight` (Task 3).
- Produces: hoàn thiện tính năng — khu vực insight hiện trên Tổng quan, tính đúng, dismiss đúng.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `src/features/overview/__tests__/components/overview-view.test.tsx` (đọc phần đầu file hiện có trước để dùng đúng `VOCAB`/`GRAMMAR` fixture và style `beforeEach` đã có — file này đã set `vi.setSystemTime(new Date(2026, 7, 14, 9, 0))`, tức hôm nay là `2026-08-14`):
```tsx
  it("shows a spending-anomaly insight and dismisses it correctly", async () => {
    const { setStoredBudget } = await import("@/features/budget/budget-storage")
    // Hôm nay là 2026-08-14 (beforeEach ở trên đã setSystemTime) → currentMonth = "2026-08",
    // 3 tháng nền = 05/06/07. Nền KHÔNG được bằng nhau hệt nhau (std=0 → detectSpendingAnomaly
    // luôn trả null) — dùng đúng 3 số đã kiểm chứng ở Task 7 (mean=1,000,000, std=100,000),
    // tháng 8 vọt lên 5,000,000 → z=40, pct=400% → chắc chắn kích hoạt.
    setStoredBudget({
      salaries: [],
      settlements: [],
      expenses: [
        { id: 1, dayKey: "2026-05-10", amount: 1_000_000, tag: null },
        { id: 2, dayKey: "2026-06-10", amount: 1_100_000, tag: null },
        { id: 3, dayKey: "2026-07-10", amount: 900_000, tag: null },
        { id: 4, dayKey: "2026-08-10", amount: 5_000_000, tag: null },
      ],
    })

    render(<OverviewView vocab={VOCAB} grammar={GRAMMAR} />)

    await waitFor(() => expect(screen.getByText(/chi tiêu cao hơn/)).toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: "Ẩn gợi ý này" }))

    await waitFor(() => expect(screen.queryByText(/chi tiêu cao hơn/)).not.toBeInTheDocument())
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/components/overview-view.test.tsx`
Expected: FAIL — không tìm thấy text "chi tiêu cao hơn" nào trên trang

- [ ] **Step 3: Sửa `overview-view.tsx`**

Thêm import:
```ts
import { useNetWorthHistory } from "../hooks/use-net-worth-history"
import {
  detectMoodSpendingCorrelation,
  detectSpendingAnomaly,
  detectTagAnomaly,
  forecastSavingsGoal,
  type Insight,
} from "../insights-calculations"
import { InsightsSection } from "./insights-section"
```

Sửa dòng import `date.ts` để có thêm nếu chưa có (đã có `dayKey`, `longDate`, `monthKey` — không cần thêm gì).

Trong component, sau dòng `const { settings } = useSettings()`, đổi thành lấy thêm `dismissInsight`:
```ts
  const { settings, dismissInsight } = useSettings()
```

Thêm ngay sau khối tính `goals`/`avgGoal` (trước `const greeting = ...`):
```ts
  const { history: netWorthHistory, recordSnapshot } = useNetWorthHistory()

  useEffect(() => {
    recordSnapshot(summary.net, summary.savingsTotal)
  }, [recordSnapshot, summary.net, summary.savingsTotal])

  const today = dayKey()
  const savingsGoal = goals.find((g) => g.key === "savings")
  const insights: Insight[] = [
    enabled("chitieu") ? detectSpendingAnomaly(expenses, currentMonth, today) : null,
    enabled("chitieu") ? detectTagAnomaly(expenses, currentMonth) : null,
    enabled("chitieu") && enabled("nhatky") ? detectMoodSpendingCorrelation(expenses, entries, today) : null,
    enabled("muctieu") && savingsGoal ? forecastSavingsGoal(netWorthHistory, savingsGoal.target, today) : null,
  ]
    .filter((i): i is Insight => i !== null)
    .filter((i) => !settings.dismissedInsights.includes(i.id))
```

Thêm `useEffect` vào import React ở đầu file (hiện đang là component `"use client"` thuần không import gì từ react — cần thêm):
```ts
import { useEffect } from "react"
```

Thêm `<InsightsSection>` vào JSX, ngay sau khối lời chào (`</div>` đóng khối `Monkey`+greeting), trước `{enabled("taichinh") ? (`:
```tsx
      <InsightsSection insights={insights} onDismiss={dismissInsight} />

```

- [ ] **Step 4: Chạy lại toàn bộ test file, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/components/overview-view.test.tsx`
Expected: tất cả PASS (kể cả các test cũ không liên quan tới insight)

- [ ] **Step 5: Chạy toàn bộ test suite, lint, typecheck**

```bash
npm run test
npm run lint
npx tsc --noEmit
```
Expected: tất cả xanh

- [ ] **Step 6: Kiểm tra tay qua `npm run dev`**

1. `npm run dev`, đăng nhập, vào `/overview`.
2. Qua DevTools → Local Storage, seed `budget-data` với 4 tháng chi tiêu (3 tháng nền gần bằng nhau, 1 tháng vọt lên) — reload, xác nhận thấy khu vực "Gợi ý cho bạn" hiện đúng insight chi tiêu bất thường.
3. Bấm "×" trên 1 insight, xác nhận biến mất ngay; reload trang, xác nhận vẫn không hiện lại (đã lưu vào `dismissedInsights`).
4. Mở DevTools → Local Storage, xác nhận khoá `net-worth-history` đã có đúng 1 bản ghi cho hôm nay sau khi mở `/overview`.
5. Ghi vài bài Nhật ký với mood khác nhau (score thấp/cao) vào các ngày khác nhau trong DevTools (sửa tay `journal-entries` nếu cần để có đủ ≥5 ngày mỗi nhóm), reload, xác nhận insight tương quan tâm trạng hiện đúng khi đủ điều kiện.
6. Xác nhận trang Tổng quan không có lỗi console nào khi tắt/bật từng module ("Chi tiêu", "Nhật ký", "Mục tiêu") trong Cài đặt — insight tương ứng phải ẩn đúng khi module bị tắt.

- [ ] **Step 7: Commit cuối**

```bash
git add src/features/overview/components/overview-view.tsx src/features/overview/__tests__/components/overview-view.test.tsx
git commit -m "feat: surface pattern-detection insights on the Overview page"
```
