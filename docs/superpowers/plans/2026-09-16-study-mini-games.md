# Study Mini-Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Trò chơi" (Games) tab to the Học tập (Study) page with 3 mini-games (quiz, matching, spelling) sharing one menu/game/result flow, per-game high scores, and a daily play streak using the existing-but-unused `Streak` component.

**Architecture:** All 3 games are pure-presentation components that take `vocab: VocabEntry[]` and `onFinish: (score: number) => void`, and know nothing about persistence. A new `GameTab` orchestrator owns which screen is showing (menu / a game / the result) and is the single call site of `recordGameResult` (a new `useStudy()` action). All randomization and scoring math lives in one new pure-function module, `game-calculations.ts`, tested in isolation before any UI is built.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Zustand-free local state (`useState`/`useEffect`), Vitest + React Testing Library, Zod for storage validation.

**Spec:** `docs/superpowers/specs/2026-09-16-study-mini-games-design.md`

## Global Constraints

- UI copy is Vietnamese; every file/folder/function/variable name is English (CLAUDE.md §3).
- Every test file mirrors its source file's path under `__tests__/` (e.g. `components/games/quiz-game.tsx` → `__tests__/components/games/quiz-game.test.tsx`).
- TDD: write the failing test, watch it fail for the right reason, then write the minimal code to pass — for every step below.
- Reuse existing primitives (`Card`, `Button`, `Field`, `Tabs`, `Streak`) instead of inventing new ones; don't restyle them.
- One React component owns each piece of persisted state; children receive it via props and call back up (this was the exact fix for a real bug found in code review on the previous feature — two components independently calling the same stateful hook desynced).
- Game randomization must use real `Math.random()`, never the existing seeded `pickDaily`/`seedFrom` helpers — those exist specifically to be *stable per day*, which is the opposite of what a replayable mini-game needs.
- No comments except where a decision is non-obvious; never explain what code does when the identifier already says so.

---

## Task 1: `shiftDay` in `src/lib/date.ts`

**Files:**
- Modify: `src/lib/date.ts`
- Test: `src/lib/__tests__/date.test.ts`

**Interfaces:**
- Produces: `shiftDay(day: string, delta: number): string` — `day` and the return value are both `"YYYY-MM-DD"` day keys (same format as `dayKey()`'s output).

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/__tests__/date.test.ts` (append a new `describe` block after the existing `shiftMonth` block):

```ts
describe("shiftDay", () => {
  it("moves forward and backward within the same month", () => {
    expect(shiftDay("2026-09-15", 1)).toBe("2026-09-16")
    expect(shiftDay("2026-09-15", -1)).toBe("2026-09-14")
  })

  it("rolls over across a month boundary backward", () => {
    expect(shiftDay("2026-09-01", -1)).toBe("2026-08-31")
  })

  it("rolls over across a year boundary backward", () => {
    expect(shiftDay("2026-01-01", -1)).toBe("2025-12-31")
  })
})
```

Add `shiftDay` to the import list at the top of the same file:

```ts
import {
  dayKey,
  formatDayKey,
  formatMonthKey,
  monthKey,
  monthKeyFromDayKey,
  monthsFrom,
  monthsThroughYearEnd,
  shiftDay,
  shiftMonth,
} from "../date"
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/date.test.ts`
Expected: FAIL — `shiftDay is not defined` / import error, since `shiftDay` doesn't exist yet in `../date`.

- [ ] **Step 3: Implement `shiftDay`**

In `src/lib/date.ts`, add this function right after `shiftMonth`:

```ts
function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number)
  return dayKey(new Date(y, m - 1, d + delta))
}
```

Add `shiftDay` to the file's `export { ... }` block (alongside `shiftMonth`).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/date.test.ts`
Expected: PASS — all tests in the file, including the 3 new `shiftDay` ones.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add src/lib/date.ts src/lib/__tests__/date.test.ts
git commit -m "feat: add shiftDay to lib/date for day-level streak math"
```

---

## Task 2: Extend `StudyState` with game high scores and streak

**Files:**
- Modify: `src/features/study/types.ts`
- Modify: `src/features/study/study-storage.ts`
- Modify: `src/features/study/__tests__/study-storage.test.ts`
- Modify: `src/features/study/__tests__/hooks/use-study.test.ts` (fix one existing test broken by the new required fields)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `type GameType = "quiz" | "match" | "spelling"`, `interface GameHighScores { quiz: number; match: number; spelling: number }`, `interface GameStreak { count: number; lastPlayedDayKey: string | null }`, and `StudyState` now includes `gameHighScores: GameHighScores` and `gameStreak: GameStreak`. `DEFAULT_STUDY_STATE.gameHighScores = { quiz: 0, match: 0, spelling: 0 }`, `DEFAULT_STUDY_STATE.gameStreak = { count: 0, lastPlayedDayKey: null }`.

- [ ] **Step 1: Write the failing tests**

Add to `src/features/study/__tests__/study-storage.test.ts` (append inside the existing `describe("getStoredStudy", ...)` block, before the closing `})`):

```ts
  it("backfills default game high scores and streak for data saved before this feature existed", () => {
    window.localStorage.setItem(
      STUDY_STORAGE_KEY,
      JSON.stringify({ tasks: DEFAULT_STUDY_STATE.tasks, learned: ["v-1"] })
    )

    const state = getStoredStudy()
    expect(state.gameHighScores).toEqual({ quiz: 0, match: 0, spelling: 0 })
    expect(state.gameStreak).toEqual({ count: 0, lastPlayedDayKey: null })
    expect(state.learned).toEqual(["v-1"])
  })

  it("keeps valid game high scores and streak already in storage", () => {
    const saved = {
      ...DEFAULT_STUDY_STATE,
      gameHighScores: { quiz: 8, match: 6, spelling: 10 },
      gameStreak: { count: 4, lastPlayedDayKey: "2026-09-15" },
    }
    window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(saved))

    expect(getStoredStudy().gameHighScores).toEqual({ quiz: 8, match: 6, spelling: 10 })
    expect(getStoredStudy().gameStreak).toEqual({ count: 4, lastPlayedDayKey: "2026-09-15" })
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/study/__tests__/study-storage.test.ts`
Expected: FAIL — `state.gameHighScores` is `undefined`, not `{quiz:0, match:0, spelling:0}`.

- [ ] **Step 3: Add the types**

In `src/features/study/types.ts`, add after the existing `Task` interface:

```ts
type GameType = "quiz" | "match" | "spelling"

interface GameHighScores {
  quiz: number
  match: number
  spelling: number
}

interface GameStreak {
  count: number
  lastPlayedDayKey: string | null
}
```

Update the file's export line to:

```ts
export type { VocabEntry, GrammarEntry, Task, GameType, GameHighScores, GameStreak }
```

- [ ] **Step 4: Extend `study-storage.ts`**

In `src/features/study/study-storage.ts`:

Update the import:
```ts
import type { GameHighScores, GameStreak, Task } from "./types"
```

Update `StudyState`:
```ts
interface StudyState {
  tasks: Task[]
  learned: string[]
  gameHighScores: GameHighScores
  gameStreak: GameStreak
}
```

Update `DEFAULT_STUDY_STATE`:
```ts
const DEFAULT_STUDY_STATE: StudyState = {
  tasks: DEFAULT_TASKS,
  learned: [],
  gameHighScores: { quiz: 0, match: 0, spelling: 0 },
  gameStreak: { count: 0, lastPlayedDayKey: null },
}
```

Add two new schemas right after `taskSchema`:
```ts
const gameHighScoresSchema: z.ZodType<GameHighScores> = z.object({
  quiz: z.number(),
  match: z.number(),
  spelling: z.number(),
})

const gameStreakSchema: z.ZodType<GameStreak> = z.object({
  count: z.number(),
  lastPlayedDayKey: z.string().nullable(),
})
```

Update `parseStudyState`:
```ts
function parseStudyState(value: unknown): StudyState {
  const parsed = (value ?? {}) as Partial<StudyState>
  return {
    tasks: safeField(z.array(taskSchema), parsed.tasks, DEFAULT_STUDY_STATE.tasks),
    learned: safeField(z.array(z.string()), parsed.learned, DEFAULT_STUDY_STATE.learned),
    gameHighScores: safeField(gameHighScoresSchema, parsed.gameHighScores, DEFAULT_STUDY_STATE.gameHighScores),
    gameStreak: safeField(gameStreakSchema, parsed.gameStreak, DEFAULT_STUDY_STATE.gameStreak),
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/features/study/__tests__/study-storage.test.ts`
Expected: PASS — all tests, including the 2 new ones.

- [ ] **Step 6: Fix the now-broken `replaceStudy` test**

`StudyState` is now a wider type, so the existing test in `src/features/study/__tests__/hooks/use-study.test.ts` that builds a `StudyState` object literal without the 2 new fields will fail to type-check. Open that file and replace:

```ts
    const restored = { tasks: [{ label: "Việc mới", done: true }], learned: ["v-0009"] }
```

with:

```ts
    const restored = {
      tasks: [{ label: "Việc mới", done: true }],
      learned: ["v-0009"],
      gameHighScores: { quiz: 0, match: 0, spelling: 0 },
      gameStreak: { count: 0, lastPlayedDayKey: null },
    }
```

- [ ] **Step 7: Run the full study test suite and type-check**

Run: `npx vitest run src/features/study && npx tsc --noEmit && npm run lint`
Expected: all green.

- [ ] **Step 8: Commit**

```bash
git add src/features/study/types.ts src/features/study/study-storage.ts src/features/study/__tests__/study-storage.test.ts src/features/study/__tests__/hooks/use-study.test.ts
git commit -m "feat: add game high scores and streak fields to StudyState"
```

---

## Task 3: Pure game logic — `game-calculations.ts`

**Files:**
- Create: `src/features/study/game-calculations.ts`
- Test: `src/features/study/__tests__/game-calculations.test.ts`

**Interfaces:**
- Consumes: `shiftDay` from `@/lib/date` (Task 1), `GameStreak`/`VocabEntry` types from `./types` (Task 2 for `GameStreak`, pre-existing for `VocabEntry`).
- Produces: `pickRandomSet<T>(pool: T[], count: number): T[]`, `pickQuizOptions(pool: VocabEntry[], correct: VocabEntry, optionCount?: number): VocabEntry[]`, `matchScoreFromFlips(pairCount: number, flipsUsed: number): number`, `nextStreak(current: GameStreak, today: string): GameStreak`.

- [ ] **Step 1: Write the failing tests**

Create `src/features/study/__tests__/game-calculations.test.ts`:

```ts
import { describe, it, expect } from "vitest"

import { matchScoreFromFlips, nextStreak, pickQuizOptions, pickRandomSet } from "../game-calculations"
import type { VocabEntry } from "../types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

const POOL: VocabEntry[] = Array.from({ length: 10 }, (_, i) => vocab(`${i}`))

describe("pickRandomSet", () => {
  it("returns the requested count with no duplicates", () => {
    const result = pickRandomSet(POOL, 5)
    expect(result).toHaveLength(5)
    expect(new Set(result.map((v) => v.id)).size).toBe(5)
  })

  it("returns the whole pool, shuffled, when count exceeds the pool size", () => {
    const result = pickRandomSet(POOL, 100)
    expect(result).toHaveLength(POOL.length)
    expect(new Set(result.map((v) => v.id)).size).toBe(POOL.length)
  })

  it("returns an empty array when the pool is empty", () => {
    expect(pickRandomSet([], 5)).toEqual([])
  })
})

describe("pickQuizOptions", () => {
  it("includes the correct entry exactly once among optionCount options", () => {
    const correct = POOL[0]
    const options = pickQuizOptions(POOL, correct, 4)
    expect(options).toHaveLength(4)
    expect(options.filter((o) => o.id === correct.id)).toHaveLength(1)
  })

  it("never repeats an option", () => {
    const correct = POOL[0]
    const options = pickQuizOptions(POOL, correct, 4)
    expect(new Set(options.map((o) => o.id)).size).toBe(4)
  })
})

describe("matchScoreFromFlips", () => {
  it("scores 10 for a perfect game at the theoretical minimum flip count", () => {
    expect(matchScoreFromFlips(6, 12)).toBe(10)
  })

  it("scores about half for double the minimum flips", () => {
    expect(matchScoreFromFlips(6, 24)).toBe(5)
  })

  it("never goes below 0 even with a very high flip count", () => {
    expect(matchScoreFromFlips(6, 1000)).toBeGreaterThanOrEqual(0)
  })
})

describe("nextStreak", () => {
  it("stays unchanged when playing again on the same day", () => {
    const current = { count: 3, lastPlayedDayKey: "2026-09-15" }
    expect(nextStreak(current, "2026-09-15")).toEqual(current)
  })

  it("increments when playing on the very next day", () => {
    const current = { count: 3, lastPlayedDayKey: "2026-09-15" }
    expect(nextStreak(current, "2026-09-16")).toEqual({ count: 4, lastPlayedDayKey: "2026-09-16" })
  })

  it("resets to 1 after skipping a day", () => {
    const current = { count: 5, lastPlayedDayKey: "2026-09-10" }
    expect(nextStreak(current, "2026-09-16")).toEqual({ count: 1, lastPlayedDayKey: "2026-09-16" })
  })

  it("starts at 1 on the very first play (lastPlayedDayKey is null)", () => {
    const current = { count: 0, lastPlayedDayKey: null }
    expect(nextStreak(current, "2026-09-16")).toEqual({ count: 1, lastPlayedDayKey: "2026-09-16" })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/study/__tests__/game-calculations.test.ts`
Expected: FAIL — cannot find module `../game-calculations`.

- [ ] **Step 3: Implement `game-calculations.ts`**

Create `src/features/study/game-calculations.ts`:

```ts
import { shiftDay } from "@/lib/date"
import type { GameStreak, VocabEntry } from "./types"

function pickRandomSet<T>(pool: T[], count: number): T[] {
  const remaining = [...pool]
  const out: T[] = []
  while (out.length < count && remaining.length) {
    const [item] = remaining.splice(Math.floor(Math.random() * remaining.length), 1)
    out.push(item)
  }
  return out
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

export { pickRandomSet, pickQuizOptions, matchScoreFromFlips, nextStreak }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/features/study/__tests__/game-calculations.test.ts`
Expected: PASS — all tests.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/study/game-calculations.ts src/features/study/__tests__/game-calculations.test.ts
git commit -m "feat: add pure game logic for mini-games (random pick, quiz options, match scoring, streak)"
```

---

## Task 4: `recordGameResult` in `useStudy()`

**Files:**
- Modify: `src/features/study/hooks/use-study.ts`
- Modify: `src/features/study/__tests__/hooks/use-study.test.ts`

**Interfaces:**
- Consumes: `nextStreak` from `../game-calculations` (Task 3), `dayKey` from `@/lib/date`, `GameType` from `../types` (Task 2).
- Produces: `recordGameResult(type: GameType, score: number): { isNewHighScore: boolean }`, plus `useStudy()` now also returns `gameHighScores: GameHighScores` and `gameStreak: GameStreak`.

- [ ] **Step 1: Write the failing tests**

Add to `src/features/study/__tests__/hooks/use-study.test.ts` (append inside the `describe("useStudy", ...)` block, before the closing `})`). Also add `import { dayKey } from "@/lib/date"` to the top of the file:

```ts
  it("records a game result, returns isNewHighScore, and only raises the stored high score when beaten", async () => {
    const { result } = renderHook(() => useStudy())
    await waitFor(() => expect(result.current.tasks).toEqual(DEFAULT_STUDY_STATE.tasks))

    let outcome: { isNewHighScore: boolean } | undefined
    act(() => {
      outcome = result.current.recordGameResult("quiz", 7)
    })
    expect(outcome).toEqual({ isNewHighScore: true })
    expect(result.current.gameHighScores.quiz).toBe(7)
    expect(getStoredStudy().gameHighScores.quiz).toBe(7)

    act(() => {
      outcome = result.current.recordGameResult("quiz", 5)
    })
    expect(outcome).toEqual({ isNewHighScore: false })
    expect(result.current.gameHighScores.quiz).toBe(7)
  })

  it("advances the play streak via nextStreak when recording a game result", async () => {
    const { result } = renderHook(() => useStudy())
    await waitFor(() => expect(result.current.tasks).toEqual(DEFAULT_STUDY_STATE.tasks))

    act(() => {
      result.current.recordGameResult("spelling", 3)
    })

    expect(result.current.gameStreak).toEqual({ count: 1, lastPlayedDayKey: dayKey() })
    expect(getStoredStudy().gameStreak).toEqual({ count: 1, lastPlayedDayKey: dayKey() })
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/study/__tests__/hooks/use-study.test.ts`
Expected: FAIL — `result.current.recordGameResult is not a function`.

- [ ] **Step 3: Implement `recordGameResult`**

In `src/features/study/hooks/use-study.ts`, update the imports:

```ts
"use client"

import { useCallback, useEffect, useState } from "react"

import { dayKey } from "@/lib/date"
import { nextStreak } from "../game-calculations"
import {
  DEFAULT_STUDY_STATE,
  getStoredStudy,
  setStoredStudy,
  type StudyState,
} from "../study-storage"
import type { GameType } from "../types"
```

Add this new callback right after `toggleLearned` (before the `return { ... }`):

```ts
  const recordGameResult = useCallback(
    (type: GameType, score: number): { isNewHighScore: boolean } => {
      const isNewHighScore = score > state.gameHighScores[type]
      const gameHighScores = {
        ...state.gameHighScores,
        [type]: Math.max(state.gameHighScores[type], score),
      }
      const gameStreak = nextStreak(state.gameStreak, dayKey())
      persist({ ...state, gameHighScores, gameStreak })
      return { isNewHighScore }
    },
    [state, persist]
  )
```

Update the hook's return statement to also expose the new state and action:

```ts
  return {
    tasks: state.tasks,
    learned: state.learned,
    gameHighScores: state.gameHighScores,
    gameStreak: state.gameStreak,
    toggleTask,
    toggleLearned,
    recordGameResult,
    replaceStudy: persist,
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/features/study/__tests__/hooks/use-study.test.ts`
Expected: PASS — all tests.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/study/hooks/use-study.ts src/features/study/__tests__/hooks/use-study.test.ts
git commit -m "feat: add recordGameResult action to useStudy"
```

---

## Task 5: `GameResultCard` (shared results screen)

**Files:**
- Create: `src/features/study/components/games/game-result-card.tsx`
- Test: `src/features/study/__tests__/components/games/game-result-card.test.tsx`

**Interfaces:**
- Consumes: `GameType` from `../../../types`, `Card` from `@/components/ui/card`, `Button` from `@/components/ui/button`.
- Produces: `<GameResultCard type score isNewHighScore onPlayAgain onBackToMenu />`.

- [ ] **Step 1: Write the failing tests**

Create `src/features/study/__tests__/components/games/game-result-card.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { GameResultCard } from "../../../components/games/game-result-card"

describe("GameResultCard", () => {
  it("shows the score and the game's label", () => {
    render(
      <GameResultCard type="quiz" score={7} isNewHighScore={false} onPlayAgain={vi.fn()} onBackToMenu={vi.fn()} />
    )

    expect(screen.getByText("7/10")).toBeInTheDocument()
    expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument()
  })

  it("shows the new-high-score banner only when isNewHighScore is true", () => {
    const { rerender } = render(
      <GameResultCard type="match" score={9} isNewHighScore={false} onPlayAgain={vi.fn()} onBackToMenu={vi.fn()} />
    )
    expect(screen.queryByText("🎉 Kỷ lục mới!")).not.toBeInTheDocument()

    rerender(<GameResultCard type="match" score={9} isNewHighScore onPlayAgain={vi.fn()} onBackToMenu={vi.fn()} />)
    expect(screen.getByText("🎉 Kỷ lục mới!")).toBeInTheDocument()
  })

  it("calls onPlayAgain and onBackToMenu from their buttons", () => {
    const onPlayAgain = vi.fn()
    const onBackToMenu = vi.fn()
    render(
      <GameResultCard
        type="spelling"
        score={5}
        isNewHighScore={false}
        onPlayAgain={onPlayAgain}
        onBackToMenu={onBackToMenu}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Chơi lại" }))
    fireEvent.click(screen.getByRole("button", { name: "Về màn chọn" }))

    expect(onPlayAgain).toHaveBeenCalled()
    expect(onBackToMenu).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/study/__tests__/components/games/game-result-card.test.tsx`
Expected: FAIL — cannot find module `../../../components/games/game-result-card`.

- [ ] **Step 3: Implement `GameResultCard`**

Create `src/features/study/components/games/game-result-card.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { GameType } from "../../types"

const GAME_LABELS: Record<GameType, string> = {
  quiz: "Trắc nghiệm",
  match: "Ghép cặp",
  spelling: "Gõ từ",
}

interface GameResultCardProps {
  type: GameType
  score: number
  isNewHighScore: boolean
  onPlayAgain: () => void
  onBackToMenu: () => void
}

function GameResultCard({ type, score, isNewHighScore, onPlayAgain, onBackToMenu }: GameResultCardProps) {
  return (
    <Card label={GAME_LABELS[type]} tone="soft" className="min-w-0 flex-[1_1_300px]">
      <p className="mb-2 [font-family:var(--ob-font-num)] text-3xl font-bold">{score}/10</p>
      {isNewHighScore ? (
        <p className="mb-4 text-sm font-bold text-[var(--ob-color-income)]">🎉 Kỷ lục mới!</p>
      ) : null}
      <div className="flex flex-wrap gap-[10px]">
        <Button variant="primary" size="sm" type="button" onClick={onPlayAgain}>
          Chơi lại
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={onBackToMenu}>
          Về màn chọn
        </Button>
      </div>
    </Card>
  )
}

export { GameResultCard }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/features/study/__tests__/components/games/game-result-card.test.tsx`
Expected: PASS.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/study/components/games/game-result-card.tsx src/features/study/__tests__/components/games/game-result-card.test.tsx
git commit -m "feat: add shared GameResultCard for mini-games"
```

---

## Task 6: `GameMenuCard` (game picker + streak)

**Files:**
- Create: `src/features/study/components/games/game-menu-card.tsx`
- Test: `src/features/study/__tests__/components/games/game-menu-card.test.tsx`

**Interfaces:**
- Consumes: `GameHighScores`/`GameStreak`/`GameType` from `../../types`, `Card` from `@/components/ui/card`, `Streak` from `@/components/ob/streak`.
- Produces: `<GameMenuCard highScores streak onSelect />` where `onSelect: (type: GameType) => void`.

- [ ] **Step 1: Write the failing tests**

Create `src/features/study/__tests__/components/games/game-menu-card.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { GameMenuCard } from "../../../components/games/game-menu-card"

const HIGH_SCORES = { quiz: 8, match: 6, spelling: 10 }
const STREAK = { count: 3, lastPlayedDayKey: "2026-09-15" }

describe("GameMenuCard", () => {
  it("shows each game's high score", () => {
    render(<GameMenuCard highScores={HIGH_SCORES} streak={STREAK} onSelect={vi.fn()} />)

    expect(screen.getByText("Kỷ lục: 8/10")).toBeInTheDocument()
    expect(screen.getByText("Kỷ lục: 6/10")).toBeInTheDocument()
    expect(screen.getByText("Kỷ lục: 10/10")).toBeInTheDocument()
  })

  it("calls onSelect with the right game type when a card is clicked", () => {
    const onSelect = vi.fn()
    render(<GameMenuCard highScores={HIGH_SCORES} streak={STREAK} onSelect={onSelect} />)

    fireEvent.click(screen.getByText("Ghép cặp"))

    expect(onSelect).toHaveBeenCalledWith("match")
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/study/__tests__/components/games/game-menu-card.test.tsx`
Expected: FAIL — cannot find module `../../../components/games/game-menu-card`.

- [ ] **Step 3: Implement `GameMenuCard`**

Create `src/features/study/components/games/game-menu-card.tsx`:

```tsx
"use client"

import { Card } from "@/components/ui/card"
import { Streak } from "@/components/ob/streak"
import type { GameHighScores, GameStreak, GameType } from "../../types"

const GAMES: { type: GameType; icon: string; label: string }[] = [
  { type: "quiz", icon: "❓", label: "Trắc nghiệm" },
  { type: "match", icon: "🃏", label: "Ghép cặp" },
  { type: "spelling", icon: "⌨️", label: "Gõ từ" },
]

interface GameMenuCardProps {
  highScores: GameHighScores
  streak: GameStreak
  onSelect: (type: GameType) => void
}

function GameMenuCard({ highScores, streak, onSelect }: GameMenuCardProps) {
  return (
    <div className="flex flex-col gap-5">
      <Card label="Chuỗi ngày chơi" className="min-w-0">
        <Streak days={7} done={Math.min(streak.count, 7)} icon="🔥" />
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {GAMES.map((game) => (
          <button
            key={game.type}
            type="button"
            onClick={() => onSelect(game.type)}
            className="flex flex-col items-center gap-2 rounded-[var(--ob-radius-lg)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-5 text-center transition-colors duration-[var(--ob-dur-fast)] hover:bg-[var(--ob-color-surface-sunken)]"
          >
            <span className="text-3xl">{game.icon}</span>
            <span className="font-bold">{game.label}</span>
            <span className="text-[12.5px] text-[var(--ob-color-text-subtle)]">
              Kỷ lục: {highScores[game.type]}/10
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export { GameMenuCard }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/features/study/__tests__/components/games/game-menu-card.test.tsx`
Expected: PASS.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/study/components/games/game-menu-card.tsx src/features/study/__tests__/components/games/game-menu-card.test.tsx
git commit -m "feat: add GameMenuCard with per-game high scores and play streak"
```

---

## Task 7: `QuizGame`

**Files:**
- Create: `src/features/study/components/games/quiz-game.tsx`
- Test: `src/features/study/__tests__/components/games/quiz-game.test.tsx`

**Interfaces:**
- Consumes: `pickQuizOptions`, `pickRandomSet` from `../../game-calculations` (Task 3), `VocabEntry` from `../../types`.
- Produces: `<QuizGame vocab onFinish />` where `onFinish: (score: number) => void`, score is an integer 0-10.

- [ ] **Step 1: Write the failing tests**

Create `src/features/study/__tests__/components/games/quiz-game.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"

import { QuizGame } from "../../../components/games/quiz-game"
import type { VocabEntry } from "../../../types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

const VOCAB: VocabEntry[] = Array.from({ length: 20 }, (_, i) => vocab(`${i}`))

describe("QuizGame", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the first question with 4 options", () => {
    render(<QuizGame vocab={VOCAB} onFinish={vi.fn()} />)

    expect(screen.getByText("Câu 1/10", { exact: false })).toBeInTheDocument()
    expect(screen.getAllByRole("button")).toHaveLength(4)
  })

  it("calls onFinish with a numeric score after answering all 10 questions", () => {
    const onFinish = vi.fn()
    render(<QuizGame vocab={VOCAB} onFinish={onFinish} />)

    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getAllByRole("button")[0])
    }

    expect(onFinish).toHaveBeenCalledWith(expect.any(Number))
  })

  it("auto-advances to the next question when the 10-second timer runs out", () => {
    render(<QuizGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(screen.getByText("Câu 2/10", { exact: false })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/study/__tests__/components/games/quiz-game.test.tsx`
Expected: FAIL — cannot find module `../../../components/games/quiz-game`.

- [ ] **Step 3: Implement `QuizGame`**

Create `src/features/study/components/games/quiz-game.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { pickQuizOptions, pickRandomSet } from "../../game-calculations"
import type { VocabEntry } from "../../types"

const QUESTION_COUNT = 10
const QUESTION_SECONDS = 10

interface QuizGameProps {
  vocab: VocabEntry[]
  onFinish: (score: number) => void
}

interface QuizQuestion {
  correct: VocabEntry
  options: VocabEntry[]
}

function buildQuestions(vocab: VocabEntry[]): QuizQuestion[] {
  return pickRandomSet(vocab, QUESTION_COUNT).map((correct) => ({
    correct,
    options: pickQuizOptions(vocab, correct, 4),
  }))
}

function QuizGame({ vocab, onFinish }: QuizGameProps) {
  const [questions] = useState(() => buildQuestions(vocab))
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS)

  const question = questions[index]

  function advance(gainedPoint: boolean) {
    const nextScore = gainedPoint ? score + 1 : score
    if (index + 1 >= questions.length) {
      onFinish(nextScore)
      return
    }
    setScore(nextScore)
    setIndex(index + 1)
  }

  // Mirror của cách Pomodoro (pomodoro.tsx) chạy đồng hồ đếm ngược: 1 setInterval trong effect
  // khoá theo "vòng hiện tại" (ở đây là index câu hỏi), dùng updater dạng hàm để đọc giá trị mới
  // nhất mà không cần đưa secondsLeft vào dependency — effect chỉ tạo lại khi sang câu mới.
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1
        clearInterval(id)
        advance(false)
        return QUESTION_SECONDS
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  function handleSelect(optionId: string) {
    setSecondsLeft(QUESTION_SECONDS)
    advance(optionId === question.correct.id)
  }

  return (
    <div>
      <p className="mb-2 text-sm text-[var(--ob-color-text-subtle)]">
        Câu {index + 1}/{questions.length} · còn {secondsLeft}s
      </p>
      <h3 className="mb-4 text-xl font-bold">{question.correct.word}</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {question.options.map((option) => (
          <Button key={option.id} type="button" variant="secondary" onClick={() => handleSelect(option.id)}>
            {option.meaning}
          </Button>
        ))}
      </div>
    </div>
  )
}

export { QuizGame }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/features/study/__tests__/components/games/quiz-game.test.tsx`
Expected: PASS.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean. If lint complains about `react-hooks/exhaustive-deps` even with the disable comment, remove the comment and instead confirm the rule accepts it as-is (this repo's config may not enforce that rule as an error) — check the terminal output for the specific rule name before deciding.

- [ ] **Step 6: Commit**

```bash
git add src/features/study/components/games/quiz-game.tsx src/features/study/__tests__/components/games/quiz-game.test.tsx
git commit -m "feat: add QuizGame mini-game"
```

---

## Task 8: `MatchGame`

**Files:**
- Create: `src/features/study/components/games/match-game.tsx`
- Test: `src/features/study/__tests__/components/games/match-game.test.tsx`

**Interfaces:**
- Consumes: `pickRandomSet`, `matchScoreFromFlips` from `../../game-calculations` (Task 3), `VocabEntry` from `../../types`.
- Produces: `<MatchGame vocab onFinish />` where `onFinish: (score: number) => void`.

- [ ] **Step 1: Write the failing tests**

Create `src/features/study/__tests__/components/games/match-game.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"

import { MatchGame } from "../../../components/games/match-game"
import type { VocabEntry } from "../../../types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

const VOCAB: VocabEntry[] = Array.from({ length: 10 }, (_, i) => vocab(`${i}`))

function sortedByVocabId(cards: HTMLElement[]): HTMLElement[] {
  return [...cards].sort((a, b) =>
    (a.getAttribute("data-vocab-id") ?? "").localeCompare(b.getAttribute("data-vocab-id") ?? "")
  )
}

describe("MatchGame", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders 12 face-down cards for 6 pairs", () => {
    render(<MatchGame vocab={VOCAB} onFinish={vi.fn()} />)

    expect(screen.getAllByRole("button")).toHaveLength(12)
    screen.getAllByRole("button").forEach((card) => expect(card.textContent).toBe("?"))
  })

  it("flips a mismatched pair back face-down after a short delay", () => {
    render(<MatchGame vocab={VOCAB} onFinish={vi.fn()} />)

    const sorted = sortedByVocabId(screen.getAllByRole("button"))
    // sorted[0]/[1] là 1 cặp giống nhau, sorted[2]/[3] là cặp khác — sorted[0] và sorted[2] chắc
    // chắn khác vocabId nên chắc chắn KHÔNG khớp cặp.
    const cardA = sorted[0]
    const cardB = sorted[2]

    fireEvent.click(cardA)
    fireEvent.click(cardB)
    expect(cardA.textContent).not.toBe("?")
    expect(cardB.textContent).not.toBe("?")

    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(cardA.textContent).toBe("?")
    expect(cardB.textContent).toBe("?")
  })

  it("keeps a matched pair face-up and calls onFinish once all 6 pairs are matched", () => {
    const onFinish = vi.fn()
    render(<MatchGame vocab={VOCAB} onFinish={onFinish} />)

    const sorted = sortedByVocabId(screen.getAllByRole("button"))
    for (let i = 0; i < sorted.length; i += 2) {
      fireEvent.click(sorted[i])
      fireEvent.click(sorted[i + 1])
    }

    expect(sorted[0].textContent).not.toBe("?")
    expect(onFinish).toHaveBeenCalledWith(expect.any(Number))
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/study/__tests__/components/games/match-game.test.tsx`
Expected: FAIL — cannot find module `../../../components/games/match-game`.

- [ ] **Step 3: Implement `MatchGame`**

Create `src/features/study/components/games/match-game.tsx`:

```tsx
"use client"

import { useState } from "react"

import { pickRandomSet } from "../../game-calculations"
import type { VocabEntry } from "../../types"

const PAIR_COUNT = 6
const MISMATCH_DELAY_MS = 800

interface MatchGameProps {
  vocab: VocabEntry[]
  onFinish: (score: number) => void
}

interface MatchCard {
  key: string
  vocabId: string
  label: string
}

function buildCards(vocab: VocabEntry[]): MatchCard[] {
  const entries = pickRandomSet(vocab, PAIR_COUNT)
  const cards: MatchCard[] = entries.flatMap((entry) => [
    { key: `${entry.id}-word`, vocabId: entry.id, label: entry.word },
    { key: `${entry.id}-meaning`, vocabId: entry.id, label: entry.meaning },
  ])
  return pickRandomSet(cards, cards.length)
}

function MatchGame({ vocab, onFinish }: MatchGameProps) {
  const [cards] = useState(() => buildCards(vocab))
  const [flippedCards, setFlippedCards] = useState<MatchCard[]>([])
  const [matchedIds, setMatchedIds] = useState<string[]>([])
  const [flipsUsed, setFlipsUsed] = useState(0)
  const [locked, setLocked] = useState(false)

  function isFaceUp(card: MatchCard): boolean {
    return flippedCards.some((c) => c.key === card.key) || matchedIds.includes(card.vocabId)
  }

  function handleFlip(card: MatchCard) {
    if (locked || isFaceUp(card)) return

    const nextFlipped = [...flippedCards, card]
    setFlippedCards(nextFlipped)
    if (nextFlipped.length < 2) return

    const [first, second] = nextFlipped
    const usedFlips = flipsUsed + 1
    setFlipsUsed(usedFlips)

    if (first.vocabId === second.vocabId) {
      const nextMatched = [...matchedIds, first.vocabId]
      setMatchedIds(nextMatched)
      setFlippedCards([])
      if (nextMatched.length === PAIR_COUNT) {
        onFinish(matchScoreFromFlips(PAIR_COUNT, usedFlips))
      }
      return
    }

    setLocked(true)
    setTimeout(() => {
      setFlippedCards([])
      setLocked(false)
    }, MISMATCH_DELAY_MS)
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          data-vocab-id={card.vocabId}
          disabled={matchedIds.includes(card.vocabId)}
          onClick={() => handleFlip(card)}
          className="flex aspect-square items-center justify-center rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-2 text-center text-[13px] font-bold"
        >
          {isFaceUp(card) ? card.label : "?"}
        </button>
      ))}
    </div>
  )
}

export { MatchGame }
```

Note: the import above must also bring in `matchScoreFromFlips`:

```ts
import { matchScoreFromFlips, pickRandomSet } from "../../game-calculations"
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/features/study/__tests__/components/games/match-game.test.tsx`
Expected: PASS.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/study/components/games/match-game.tsx src/features/study/__tests__/components/games/match-game.test.tsx
git commit -m "feat: add MatchGame mini-game"
```

---

## Task 9: `SpellingGame`

**Files:**
- Create: `src/features/study/components/games/spelling-game.tsx`
- Test: `src/features/study/__tests__/components/games/spelling-game.test.tsx`

**Interfaces:**
- Consumes: `pickRandomSet` from `../../game-calculations` (Task 3), `VocabEntry` from `../../types`, `Field`/`Button` from `@/components/ui/*`.
- Produces: `<SpellingGame vocab onFinish />` where `onFinish: (score: number) => void`.

- [ ] **Step 1: Write the failing tests**

Create `src/features/study/__tests__/components/games/spelling-game.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { SpellingGame } from "../../../components/games/spelling-game"
import type { VocabEntry } from "../../../types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

const VOCAB: VocabEntry[] = Array.from({ length: 15 }, (_, i) => vocab(`${i}`))

function currentWord(): VocabEntry {
  const meaning = screen.getByTestId("spelling-meaning").textContent
  const entry = VOCAB.find((v) => v.meaning === meaning)
  if (!entry) throw new Error("test setup error: current meaning not found in VOCAB")
  return entry
}

describe("SpellingGame", () => {
  it("shows the meaning for the first word and an input to type the answer", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    expect(screen.getByText("Từ 1/10", { exact: false })).toBeInTheDocument()
    expect(screen.getByLabelText("Gõ lại từ tiếng Anh", { exact: false })).toBeInTheDocument()
  })

  it("accepts a correct answer regardless of case, and calls onFinish with 10 after 10 correct words", () => {
    const onFinish = vi.fn()
    render(<SpellingGame vocab={VOCAB} onFinish={onFinish} />)

    for (let i = 0; i < 10; i++) {
      const entry = currentWord()
      fireEvent.change(screen.getByLabelText("Gõ lại từ tiếng Anh", { exact: false }), {
        target: { value: entry.word.toUpperCase() },
      })
      fireEvent.click(screen.getByRole("button"))
    }

    expect(onFinish).toHaveBeenCalledWith(10)
  })

  it("does not count a wrong spelling as correct", () => {
    const onFinish = vi.fn()
    render(<SpellingGame vocab={VOCAB} onFinish={onFinish} />)

    for (let i = 0; i < 10; i++) {
      fireEvent.change(screen.getByLabelText("Gõ lại từ tiếng Anh", { exact: false }), {
        target: { value: "definitely-wrong-answer" },
      })
      fireEvent.click(screen.getByRole("button"))
    }

    expect(onFinish).toHaveBeenCalledWith(0)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/study/__tests__/components/games/spelling-game.test.tsx`
Expected: FAIL — cannot find module `../../../components/games/spelling-game`.

- [ ] **Step 3: Implement `SpellingGame`**

Create `src/features/study/components/games/spelling-game.tsx`:

```tsx
"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { pickRandomSet } from "../../game-calculations"
import type { VocabEntry } from "../../types"

const WORD_COUNT = 10

interface SpellingGameProps {
  vocab: VocabEntry[]
  onFinish: (score: number) => void
}

function SpellingGame({ vocab, onFinish }: SpellingGameProps) {
  const [words] = useState(() => pickRandomSet(vocab, WORD_COUNT))
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [input, setInput] = useState("")

  const word = words[index]
  const isLast = index + 1 >= words.length

  function handleSubmit() {
    const correct = input.trim().toLowerCase() === word.word.trim().toLowerCase()
    const nextScore = correct ? score + 1 : score
    if (isLast) {
      onFinish(nextScore)
      return
    }
    setScore(nextScore)
    setIndex(index + 1)
    setInput("")
  }

  return (
    <div>
      <p className="mb-2 text-sm text-[var(--ob-color-text-subtle)]">
        Từ {index + 1}/{words.length}
      </p>
      <p data-testid="spelling-meaning" className="mb-1 text-lg font-bold">
        {word.meaning}
      </p>
      {word.phonetic ? <p className="mb-4 text-sm text-[var(--ob-color-text-subtle)]">{word.phonetic}</p> : null}
      <Field
        label="Gõ lại từ tiếng Anh"
        placeholder="Nhập câu trả lời..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
      />
      <Button className="mt-4" type="button" onClick={handleSubmit} disabled={!input.trim()}>
        {isLast ? "Hoàn thành" : "Tiếp theo"}
      </Button>
    </div>
  )
}

export { SpellingGame }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/features/study/__tests__/components/games/spelling-game.test.tsx`
Expected: PASS.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/study/components/games/spelling-game.tsx src/features/study/__tests__/components/games/spelling-game.test.tsx
git commit -m "feat: add SpellingGame mini-game"
```

---

## Task 10: `GameTab` orchestrator

**Files:**
- Create: `src/features/study/components/games/game-tab.tsx`
- Test: `src/features/study/__tests__/components/games/game-tab.test.tsx`

**Interfaces:**
- Consumes: `GameMenuCard` (Task 6), `GameResultCard` (Task 5), `QuizGame` (Task 7), `MatchGame` (Task 8), `SpellingGame` (Task 9), `GameHighScores`/`GameStreak`/`GameType`/`VocabEntry` from `../../types`.
- Produces: `<GameTab vocab highScores streak onFinish />` where `onFinish: (type: GameType, score: number) => { isNewHighScore: boolean }` (this is exactly `recordGameResult`'s signature from Task 4 — `GameTab` calls it directly, no game component calls it itself).

- [ ] **Step 1: Write the failing tests**

Create `src/features/study/__tests__/components/games/game-tab.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { GameTab } from "../../../components/games/game-tab"
import type { VocabEntry } from "../../../types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

const VOCAB: VocabEntry[] = Array.from({ length: 20 }, (_, i) => vocab(`${i}`))
const HIGH_SCORES = { quiz: 0, match: 0, spelling: 0 }
const STREAK = { count: 0, lastPlayedDayKey: null }

function playSpellingBadlyToTheEnd() {
  for (let i = 0; i < 10; i++) {
    fireEvent.change(screen.getByLabelText("Gõ lại từ tiếng Anh", { exact: false }), {
      target: { value: "wrong" },
    })
    fireEvent.click(screen.getByRole("button"))
  }
}

describe("GameTab", () => {
  it("starts on the menu and enters a game when a card is selected", () => {
    render(
      <GameTab vocab={VOCAB} highScores={HIGH_SCORES} streak={STREAK} onFinish={vi.fn(() => ({ isNewHighScore: false }))} />
    )

    expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Gõ từ"))

    expect(screen.getByText("Từ 1/10", { exact: false })).toBeInTheDocument()
  })

  it("calls onFinish exactly once with (type, score) when a game ends, then shows the result screen", () => {
    const onFinish = vi.fn(() => ({ isNewHighScore: true }))
    render(<GameTab vocab={VOCAB} highScores={HIGH_SCORES} streak={STREAK} onFinish={onFinish} />)

    fireEvent.click(screen.getByText("Gõ từ"))
    playSpellingBadlyToTheEnd()

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish).toHaveBeenCalledWith("spelling", 0)
    expect(screen.getByText("🎉 Kỷ lục mới!")).toBeInTheDocument()
  })

  it("returns to the menu from the result screen", () => {
    const onFinish = vi.fn(() => ({ isNewHighScore: false }))
    render(<GameTab vocab={VOCAB} highScores={HIGH_SCORES} streak={STREAK} onFinish={onFinish} />)

    fireEvent.click(screen.getByText("Gõ từ"))
    playSpellingBadlyToTheEnd()
    fireEvent.click(screen.getByRole("button", { name: "Về màn chọn" }))

    expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/study/__tests__/components/games/game-tab.test.tsx`
Expected: FAIL — cannot find module `../../../components/games/game-tab`.

- [ ] **Step 3: Implement `GameTab`**

Create `src/features/study/components/games/game-tab.tsx`:

```tsx
"use client"

import { useState } from "react"

import type { GameHighScores, GameStreak, GameType, VocabEntry } from "../../types"
import { GameMenuCard } from "./game-menu-card"
import { GameResultCard } from "./game-result-card"
import { MatchGame } from "./match-game"
import { QuizGame } from "./quiz-game"
import { SpellingGame } from "./spelling-game"

interface GameTabProps {
  vocab: VocabEntry[]
  highScores: GameHighScores
  streak: GameStreak
  onFinish: (type: GameType, score: number) => { isNewHighScore: boolean }
}

interface GameResult {
  type: GameType
  score: number
  isNewHighScore: boolean
}

function GameTab({ vocab, highScores, streak, onFinish }: GameTabProps) {
  const [activeGame, setActiveGame] = useState<GameType | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  function handleGameFinish(type: GameType, score: number) {
    const { isNewHighScore } = onFinish(type, score)
    setActiveGame(null)
    setResult({ type, score, isNewHighScore })
  }

  if (result) {
    return (
      <GameResultCard
        type={result.type}
        score={result.score}
        isNewHighScore={result.isNewHighScore}
        onPlayAgain={() => {
          const type = result.type
          setResult(null)
          setActiveGame(type)
        }}
        onBackToMenu={() => setResult(null)}
      />
    )
  }

  if (activeGame === "quiz") {
    return <QuizGame vocab={vocab} onFinish={(score) => handleGameFinish("quiz", score)} />
  }
  if (activeGame === "match") {
    return <MatchGame vocab={vocab} onFinish={(score) => handleGameFinish("match", score)} />
  }
  if (activeGame === "spelling") {
    return <SpellingGame vocab={vocab} onFinish={(score) => handleGameFinish("spelling", score)} />
  }

  return <GameMenuCard highScores={highScores} streak={streak} onSelect={setActiveGame} />
}

export { GameTab }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/features/study/__tests__/components/games/game-tab.test.tsx`
Expected: PASS.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/study/components/games/game-tab.tsx src/features/study/__tests__/components/games/game-tab.test.tsx
git commit -m "feat: add GameTab orchestrator wiring menu, games, and results together"
```

---

## Task 11: Wire the "Trò chơi" tab into `StudyView`

**Files:**
- Modify: `src/features/study/components/study-view.tsx`
- Modify: `src/features/study/__tests__/components/study-view.test.tsx`

**Interfaces:**
- Consumes: `GameTab` (Task 10), `gameHighScores`/`gameStreak`/`recordGameResult` from `useStudy()` (Task 4).
- Produces: nothing new for other tasks — this is the final integration point.

- [ ] **Step 1: Write the failing test**

Add to `src/features/study/__tests__/components/study-view.test.tsx` (append inside the `describe("StudyView", ...)` block, before the closing `})`):

```ts
  it("renders the game menu when the Trò chơi tab is selected", () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    fireEvent.click(screen.getByRole("button", { name: "Trò chơi" }))

    expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument()
    expect(screen.getByText("Ghép cặp")).toBeInTheDocument()
    expect(screen.getByText("Gõ từ")).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/study/__tests__/components/study-view.test.tsx`
Expected: FAIL — no button named "Trò chơi" exists yet, so `getByRole` throws.

- [ ] **Step 3: Wire `GameTab` into `StudyView`**

In `src/features/study/components/study-view.tsx`:

Add the import:
```ts
import { GameTab } from "./games/game-tab"
```

Change the `TABS` constant:
```ts
const TABS = ["Hôm nay", "Từ vựng", "Ngữ pháp", "Trò chơi"]
```

Change the destructuring from `useStudy()`:
```ts
  const { tasks, learned, toggleTask, toggleLearned, gameHighScores, gameStreak, recordGameResult } = useStudy()
```

Replace the whole return statement's JSX (everything from `{tab === "Hôm nay" ? (` down to the matching `)}` right before the closing `</div>` of the component) with this — the "Hôm nay" branch's contents are copied verbatim from the current file, only the new `"Trò chơi"` branch in the middle is new:

```tsx
      {tab === "Hôm nay" ? (
        <div className="ob-card-grid flex flex-wrap gap-5">
          <div className="min-w-0 flex-[1_1_100%]">
            <Pomodoro />
          </div>
          <VocabCard
            label="5 từ vựng hôm nay"
            action={
              <span className="[font-family:var(--ob-font-num)] text-[12.5px] font-bold text-[var(--ob-color-text-subtle)]">
                {learnedToday}/5
              </span>
            }
            intro={`Bốc từ kho ${vocab.length} từ, cố định theo ngày — mai sẽ là bộ khác.`}
            entries={daily}
            learned={learned}
            onToggleLearned={toggleLearned}
            celebrate={learnedToday === 5}
            className="min-w-0 flex-[1_1_100%]"
            gridClassName="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          />
          {dailyGrammar ? <GrammarHighlightCard key={dailyGrammar.id} entry={dailyGrammar} vocab={vocab} /> : null}
          <TasksCard tasks={tasks} onToggle={toggleTask} className="min-w-0 flex-[1_1_300px]" />
          <LearnedProgressCard
            learnedCount={learned.length}
            totalCount={vocab.length}
            className="min-w-0 flex-[1_1_300px]"
          />
        </div>
      ) : tab === "Trò chơi" ? (
        <div className="ob-card-grid">
          <GameTab vocab={vocab} highScores={gameHighScores} streak={gameStreak} onFinish={recordGameResult} />
        </div>
      ) : (
        <div className="ob-card-grid">
          {tab === "Từ vựng" ? (
            <VocabCard
              label={`Kho từ vựng giao tiếp · ${vocab.length} từ`}
              action={
                <span className="text-[12.5px] text-[var(--ob-color-text-subtle)]">Đã học {learned.length}</span>
              }
              entries={vocab}
              learned={learned}
              onToggleLearned={toggleLearned}
            />
          ) : (
            <GrammarListCard entries={grammar} vocab={vocab} />
          )}
        </div>
      )}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/study/__tests__/components/study-view.test.tsx`
Expected: PASS — all tests in the file, including the new one.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/study/components/study-view.tsx src/features/study/__tests__/components/study-view.test.tsx
git commit -m "feat: add Trò chơi tab to the Study page"
```

---

## Task 12: Full checkpoint and manual verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full automated checkpoint**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: all three clean/green.

- [ ] **Step 2: Manually verify in the browser**

Run: `npm run dev`, open `/study`, click the "Trò chơi" tab.

- Play the Trắc nghiệm game to completion (10 questions) — confirm it ends on the result screen with a score out of 10, and that letting a question's 10-second timer expire counts it wrong.
- Click "Chơi lại" — confirm a fresh game starts with a new random set of words (not the same 10 as before).
- Click "Về màn chọn" — confirm the menu shows updated "Kỷ lục" for the game just played.
- Play the Ghép cặp game to completion — confirm matched pairs stay revealed, mismatched pairs flip back down after under a second, and finishing all 6 pairs shows the result screen.
- Play the Gõ từ game to completion — confirm a correct answer in the wrong case (e.g. typing the word in all caps) still counts as correct.
- Reload the page and confirm all 3 "Kỷ lục" values persisted.
- Open the browser devtools console and run `JSON.parse(localStorage.getItem("study-progress")).gameStreak` — confirm `count` is `1` and `lastPlayedDayKey` is today's date after playing once.
- To confirm the streak actually increments on consecutive days (rather than just verify it once): in devtools, run
  ```js
  const s = JSON.parse(localStorage.getItem("study-progress"))
  s.gameStreak.lastPlayedDayKey = "2026-09-15" // ngày hôm qua so với hôm nay trong dev
  localStorage.setItem("study-progress", JSON.stringify(s))
  ```
  then reload and play any game once — confirm `gameStreak.count` becomes `2`, and the `Streak` bar on the menu shows 2 lit cells.

- [ ] **Step 3: Confirm nothing outside Study was touched**

Run: `git diff developer --stat` (or the plan's base branch) and confirm every changed file is under `src/features/study/` or `src/lib/date.ts` / `src/lib/__tests__/date.test.ts`.

- [ ] **Step 4: Report completion**

No commit needed for this task (it's verification-only) — tell the user the mini-games are implemented and pass the full checkpoint, ready for them to review in their own browser before any merge.
