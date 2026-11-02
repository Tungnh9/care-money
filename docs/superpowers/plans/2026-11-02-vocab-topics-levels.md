# Từ vựng theo chủ đề và cấp độ CEFR — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tab Từ vựng mở ra là lưới 13 chủ đề. Bấm một chủ đề thì thấy từ chia theo cấp độ A1–C2. Có dải lọc theo cấp độ, và mỗi từ trong `vocabulary.jsonl` có `level`.

**Architecture:** File nội dung thêm `level`; loader bắt buộc field này lúc build. Logic thuần (nhóm theo chủ đề, theo cấp, đếm) nằm ở `src/features/study/vocab-catalog.ts`. Giao diện là `VocabBrowser`, thay `VocabCard`; trạng thái chọn chủ đề và cấp độ nằm ở `StudyView`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4 (container query), zod 4, Vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-11-02-vocab-topics-levels-design.md`

## Global Constraints

- Nhánh `feat/vocab-topics-levels`, tách từ `developer` @ `c1d03c1`.
- Cấp độ hợp lệ, theo đúng thứ tự: `A1`, `A2`, `B1`, `B2`, `C1`, `C2`.
- Mọi câu chữ và tên chủ đề lấy nguyên văn từ mục *Quyết định của tôi* trong spec.
- Không đổi `study-data` (`study-storage.ts`, `use-study.ts`). Không đổi Trò chơi, tab Hôm nay, Tổng quan.
- `vocabulary.jsonl`:
  - mỗi dòng chỉ thêm `, "level": "XX"` ngay sau `"topic": "…"` (dòng không có topic thì thêm sau `"meaning": "…"`);
  - giữ nguyên khoảng trắng `", "`/`": "`, thứ tự key khác, LF;
  - không format lại cả dòng.
- Lưới trong Card dùng container query (`@md:`, `@2xl:`, `@4xl:`), không dùng `sm:`/`md:`/`lg:`.
- Không thêm thư viện. Danh sách Oxford và script xếp cấp nằm ở scratchpad, không vào repo.
- Commit kết thúc bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Không push.

## Review Focus

1. Từ không có `topic` hay có slug lạ vẫn hiện, ở nhóm "Khác" hay dưới chính slug (Task 2).
2. Tổng số từ trên các ô chủ đề khi lọc "Tất cả" bằng đúng số từ trong kho: không từ nào mất, không từ nào hiện 2 lần (Task 2).
3. Đang mở 1 chủ đề mà lọc sang cấp không có từ: hiện câu chỗ trống, dải lọc vẫn còn, nút "Tất cả chủ đề" vẫn dùng được (Task 3).
4. Đánh dấu đã học trong màn 1 chủ đề, quay về lưới thì `Đã học x/n` của ô đó đã tăng (Task 3).
5. Điện thoại 360px: ô chủ đề 2 cột, dải lọc xuống dòng, không có thanh cuộn ngang (Task 3, kiểm bằng headless Chrome).

---

### Task 1: Gắn cấp độ CEFR cho cả kho từ

**Files:**
- Create: `src/lib/study/cefr.ts`, `docs/superpowers/specs/2026-11-02-vocab-levels-review.md`
- Modify: `src/lib/study/types.ts`, `src/lib/study/content-loader.ts`, `content/vocabulary.jsonl`, `content/README.md`
- Test: `src/lib/__tests__/study/content-loader.test.ts`

**Interfaces:**
- Produces:
  - `src/lib/study/cefr.ts`: `CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const` và `type CefrLevel = (typeof CEFR_LEVELS)[number]`.
  - `VocabEntry.level?: CefrLevel` (tuỳ chọn trong kiểu, để fixture test không phải sửa).
  - `vocabEntrySchema` export từ `content-loader.ts`, có `level: z.enum(CEFR_LEVELS)` **bắt buộc**.

- [ ] **Step 1: Test (đỏ)** trong `content-loader.test.ts`:
  - `"gives every entry a CEFR level from A1 to C2"`: `getVocab().every((v) => CEFR_LEVELS.includes(v.level!))` là `true`.
  - `"refuses a vocabulary line without a level, or with a level outside A1–C2"`:
    - dòng thiếu `level` → `parseJsonl(raw, "vocabulary.jsonl", vocabEntrySchema)` ném `/vocabulary\.jsonl:1: .*level/`;
    - dòng có `"level": "A3"` cũng ném lỗi.
- [ ] **Step 2:** `npx vitest run src/lib/__tests__/study/content-loader.test.ts` → đỏ (chưa có `CEFR_LEVELS`, chưa có `level`).
- [ ] **Step 3:** Thêm `cefr.ts`, `level?: CefrLevel` vào `VocabEntry`, export `vocabEntrySchema` với `level` bắt buộc. Test "thiếu level" giờ xanh; test "every entry" vẫn đỏ vì file chưa có level.
- [ ] **Step 4: Xếp cấp nháp** bằng script Node ở scratchpad:
  - tải `https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf` và `…/The_Oxford_5000_by_CEFR_level.pdf`, chuyển sang chữ bằng `pdftotext` (không `-layout`);
  - đọc dòng tiêu đề cấp `A1`…`C1` và các mục `word pos.`. Một từ có nhiều mục thì lấy cấp thấp nhất;
  - chuẩn hoá `word` của từng từ trong kho: bỏ `...`, `…`, phần trong ngoặc, `+ adj.`, hạ chữ thường;
  - áp quy tắc *Nguồn cấp độ* của spec theo thứ tự: khớp thẳng → số nhiều tra số ít → cụm từ lấy cấp cao nhất của từ chính → tên nước và quốc tịch là A1 → còn lại đánh dấu `estimated`;
  - xuất `{ id, word, meaning, level, source: "oxford" | "estimated", reason }`.
- [ ] **Step 5: Ước lượng tay** từng từ `estimated` theo khung CEFR. Ghi `reason` ngắn, ví dụ "như sock (A2)" hay "từ thời trang, ít gặp → B1". C2 chỉ dành cho từ thật hiếm.
- [ ] **Step 6: Ghi `level` vào `vocabulary.jsonl`** theo đúng quy tắc ở Global Constraints. Kiểm bằng script:
  - xoá đoạn `, "level": "XX"` khỏi mỗi dòng mới thì ra đúng từng byte file cũ (`git show HEAD:content/vocabulary.jsonl`);
  - `git diff --stat` báo 422 dòng đổi.
- [ ] **Step 7: File duyệt** `docs/superpowers/specs/2026-11-02-vocab-levels-review.md`:
  - bảng đếm số từ theo cấp và theo nguồn;
  - bảng mọi từ `estimated`: `id | từ | nghĩa | cấp | lý do`, xếp theo chủ đề.
- [ ] **Step 8: `content/README.md`:**
  - thêm hàng `level` vào bảng field: bắt buộc, `A1`…`C2`, xếp theo Oxford 3000/5000, không có trong danh sách thì ước lượng;
  - ở *Quy trình thêm mới*, thêm 1 câu: từ mới phải kèm `level`.
- [ ] **Step 9:** Chạy test của task, `npx tsc --noEmit`, `npm run lint`, `npm run format:check`, `npm run test`; tất cả phải xanh.
- [ ] **Step 10: Commit** `feat: give every vocabulary word a CEFR level`.

### Task 2: Nhóm từ theo chủ đề và cấp độ

**Files:**
- Create: `src/features/study/vocab-catalog.ts`
- Test: `src/features/study/__tests__/vocab-catalog.test.ts`

**Interfaces:**
- Consumes: `CEFR_LEVELS`, `CefrLevel` (Task 1).
- Produces:
  ```ts
  function topicKey(entry: VocabEntry): string // topic đã trim; không có thì ""
  function topicLabel(topic: string): string // 13 slug → tên trong spec; "" → "Khác"; lạ → viết hoa chữ đầu
  function filterByLevel(words: VocabEntry[], level: CefrLevel | null): VocabEntry[] // null = tất cả
  interface TopicSummary { topic: string; label: string; words: VocabEntry[]; learnedCount: number }
  function summarizeTopics(vocab: VocabEntry[], learned: string[], level: CefrLevel | null): TopicSummary[]
  interface LevelGroup { level: CefrLevel | null; words: VocabEntry[] } // null = "Chưa xếp cấp"
  function groupByLevel(words: VocabEntry[]): LevelGroup[]
  function levelCounts(words: VocabEntry[]): { level: CefrLevel; count: number }[]
  ```
  - Thứ tự chủ đề: 13 slug theo bảng của spec → slug lạ theo ABC → `""` cuối cùng.
  - `summarizeTopics` bỏ chủ đề có 0 từ sau khi lọc; trong mỗi chủ đề, từ giữ thứ tự của file.
  - `groupByLevel` xếp A1→C2 rồi tới `null`, bỏ nhóm rỗng.
  - `levelCounts` chỉ trả cấp có ≥ 1 từ, theo thứ tự A1→C2.

- [ ] **Step 1: Test (đỏ):**
  - `"orders the 13 known topics from the spec, unknown slugs after them, and words without a topic last as Khác"`
  - `"keeps every word exactly once across the topics"`: tổng `words.length` = `vocab.length`, và tập id bằng nhau (Review Focus 2).
  - `"shows a word without a topic, or with an unknown slug, instead of dropping it"`: `topic` thiếu → nhóm `""`, nhãn `"Khác"`; `"travel"` → nhãn `"Travel"` (Review Focus 1).
  - `"counts learned words per topic"`: `learnedCount` đúng với mảng `learned`.
  - `"filters by level and leaves out topics with no word at that level"`
  - `"groups a topic's words from A1 up, with words without a level last"`
  - `"counts words per level, only for levels that have words"`
- [ ] **Step 2:** `npx vitest run src/features/study/__tests__/vocab-catalog.test.ts` → đỏ (module chưa có).
- [ ] **Step 3:** Viết `vocab-catalog.ts` theo Interfaces.
- [ ] **Step 4:** Test xanh; `npx tsc --noEmit`, lint, format sạch.
- [ ] **Step 5: Commit** `feat: group vocabulary by topic and CEFR level`.

### Task 3: Duyệt từ vựng theo chủ đề, lọc theo cấp độ

**Files:**
- Create: `src/features/study/components/vocab-browser.tsx` (`VocabBrowser`, gồm lưới chủ đề và màn 1 chủ đề), `src/features/study/components/level-filter.tsx` (`LevelFilter`)
- Modify:
  - `src/features/study/components/study-view.tsx`: state `vocabTopic: string | null` và `vocabLevel: CefrLevel | null`; tab Từ vựng render `VocabBrowser`;
  - `src/features/study/components/vocab-word-card.tsx`: nhãn cấp độ đứng sau nhãn loại từ, cùng kiểu chip;
  - `README.md`: câu mô tả tab Từ vựng.
- Delete: `src/features/study/components/vocab-card.tsx` (không còn ai dùng).
- Test:
  - `src/features/study/__tests__/components/vocab-browser.test.tsx`
  - `src/features/study/__tests__/components/vocab-word-card.test.tsx`
  - `src/features/study/__tests__/components/study-view.test.tsx`

**Interfaces:**
- Consumes: mọi hàm của Task 2.
- Produces:
  ```ts
  interface LevelFilterProps { counts: { level: CefrLevel; count: number }[]; active: CefrLevel | null; onChange: (level: CefrLevel | null) => void }
  interface VocabBrowserProps {
    vocab: VocabEntry[]; learned: string[]; onToggleLearned: (id: string) => void
    topic: string | null; level: CefrLevel | null // topic null = lưới chủ đề
    onTopicChange: (topic: string | null) => void; onLevelChange: (level: CefrLevel | null) => void
  }
  ```
- Bố cục:
  - `LevelFilter`:
    - `role="group"`, `aria-label="Lọc theo cấp độ"`;
    - nút chip `aria-pressed` kiểu dải nút lọc của trang Plan (`plan-bar.tsx`);
    - dòng chú thích nguyên văn spec ở dưới.
  - Ở lưới chủ đề, `counts = levelCounts(vocab)`; ở màn 1 chủ đề là `levelCounts` các từ của chủ đề đó.
  - Ô chủ đề:
    - là `<button>`, tên đọc được là tên chủ đề;
    - thanh tiến độ giống `LearnedProgressCard`;
    - lưới `grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-4`.
  - Lưới thẻ từ: `grid-cols-2 gap-4 @md:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-6`.
  - Tiêu đề nhóm cấp ở màn 1 chủ đề là `{cấp} · {n} từ`. Nhóm `level: null` có tiêu đề `Chưa xếp cấp · {n} từ`.

- [ ] **Step 1: Test (đỏ)** trong `vocab-browser.test.tsx`, với fixture 3 chủ đề và các cấp A1/A2/B1:
  - `"lists the topics with their word count and learned progress"`: thấy `Chủ đề · 3`, `Đã học 1/6`, và ô có `2 từ`, `Đã học 1/2`.
  - `"opens a topic and shows its words grouped by level, then goes back"`:
    - bấm ô → gọi `onTopicChange("food")`;
    - render lại với `topic="food"` → tiêu đề `A1 · 1 từ`, `A2 · 1 từ` theo đúng thứ tự;
    - bấm "Tất cả chủ đề" → gọi `onTopicChange(null)`.
  - `"filters by level from the chips, and the topic counts follow"`: bấm `A1 · 3` → `onLevelChange("A1")`; render lại với `level="A1"` → ô hiện số từ A1 và ẩn chủ đề không có từ A1.
  - `"says so when the open topic has no word at the chosen level"`: thấy `Chưa có từ B1 nào trong chủ đề này.`, dải lọc và nút "Tất cả chủ đề" vẫn còn (Review Focus 3).
  - `"lays the grids out by the card's own width"`: lưới ô chủ đề và lưới thẻ từ có class `@`, không có `sm:`/`md:`/`lg:`.
- [ ] **Step 2: Test (đỏ)** ở `vocab-word-card.test.tsx`: `"shows the word's CEFR level next to its part of speech"`; từ không có `level` thì không có nhãn.
- [ ] **Step 3: Sửa `study-view.test.tsx`:**
  - Bỏ `"lists every vocab word on the Từ vựng tab"` và chuỗi `Kho từ vựng giao tiếp · 10 từ` (fixture không có topic, nên mọi từ vào ô "Khác").
  - Thêm `"opens a topic on the Từ vựng tab and lists its words"`.
  - Thêm `"marking a word learned inside a topic updates that topic's progress"`: bấm "Đánh dấu đã học", về lưới thấy `Đã học 1/10` (Review Focus 4).
  - Thêm `"keeps the open topic when switching to another tab and back"`.
  - Test stagger-animate của tab Từ vựng tìm section theo `Chủ đề · 1`.
- [ ] **Step 4:** Chạy 3 file test trên → đỏ đúng lý do.
- [ ] **Step 5:** Viết `LevelFilter` và `VocabBrowser`, nối vào `StudyView`, thêm nhãn cấp độ, xoá `vocab-card.tsx`, sửa `README.md`.
- [ ] **Step 6:** Test xanh; `npx tsc --noEmit`, `npm run lint`, `npm run format:check`, `npm run test`, `npm run build` đều sạch.
- [ ] **Step 7: Kiểm bằng headless Chrome** (production build, cổng 3123, không đụng cổng 3000) ở 1280px và 360px. Nạp `auth-user` vào localStorage rồi mở `/study`, tab Từ vựng:
  - không có thanh cuộn ngang;
  - ở 360px ô chủ đề 2 cột (Review Focus 5);
  - chụp lưới chủ đề, màn "Nghề nghiệp" lọc A2, và màn điện thoại.
- [ ] **Step 8: Commit** `feat: browse vocabulary by topic and filter by CEFR level`.
