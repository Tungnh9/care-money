# Trang Làm việc dạng Bento — kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Thay 3 tab + bảng Kanban của `/work` bằng một màn Bento.

**Architecture:**

- Giữ nguyên dữ liệu (`WorkState`) và phần lớn `useWork`.
- Thêm vài hàm tính trong `lib/work`.
- Thêm các ô (tile) trong `features/work/components`.
- `Modal` có thêm kiểu "khung trượt" để mở Standup, Báo cáo tuần và "Xem tất cả".
- Xoá Kanban và dnd-kit.

**Tech Stack:** Next.js 16, React 19, Tailwind v4 (container query), Base UI menu, Vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-11-03-work-bento-design.md`

## Global Constraints

- Câu chữ trong spec dùng nguyên văn.
- Lưới Bento dùng container query `@xl` (2 cột) và `@4xl` (4 cột), không dùng breakpoint màn hình.
- Không đổi `WorkState` và không đổi key `work-data`.
- Không thêm thư viện. Gỡ `@dnd-kit/*`.
- Prettier: không chấm phẩy, dòng 120 ký tự.
- Mỗi task: TDD → `npx tsc --noEmit` → `npm run lint` → `npm run test` → commit.

## Review Focus

1. Thẻ đổi cột phải giữ đúng `done`/`doneAt`, nhờ `board.moveTask`. Hai lối đổi cột dùng chung một quy tắc vị trí:
   - menu "Chuyển sang";
   - dòng "Trạng thái" trong hộp sửa.

   Vào cột cuối thì lên đầu, vào cột khác thì xuống cuối.
2. Bảng chỉ có 1 hoặc 2 cột vẫn hiện đúng:
   - không có cột giữa;
   - cột đầu cũng là cột cuối.

   Không văng lỗi, không mất việc.
3. Khung Standup giữ chữ đang gõ khi đóng rồi mở lại. Các nơi đang dùng `Modal` không đổi hành vi.
4. Vướng mắc chỉ lấy từ bản standup của ngày làm việc trước. Không lấy bản cũ hơn, và không ghi đè bản đã lưu hôm nay.
5. Trang không cuộn ngang ở 390 / 768 / 1280 / 1440 / 1920.

---

### Task 1: Hàm tính cho các ô

**Files:**

- Modify: `src/lib/work/work-calculations.ts`
- Create: `src/features/work/due-label.ts`
- Test: `src/lib/__tests__/work/work-calculations.test.ts`, `src/features/work/__tests__/due-label.test.ts`

**Produces:**

- `todayFocus(tasks: WorkTask[], today: string): { items: WorkTask[]; doneToday: number }`
  - `items` = overdue + dueToday của `groupTasks`.
  - `doneToday` = số việc có `done` và `doneAt === today`.
- `upcomingTasks(tasks: WorkTask[], today: string, days = 7): WorkTask[]`
  - Việc chưa xong có `today < dueDate <= today+days`, xếp theo hạn rồi theo id.
- `recentDone(tasks: WorkTask[]): WorkTask[]`
  - Việc đã xong, xếp `doneAt` giảm dần rồi id giảm dần. Không cắt bớt.
- `suggestStandup(...)` trả `blockers` = `lastStandup?.blockers.trim() ?? ""`.
  - `lastStandup` là chính bản đang dùng để "carry" dòng Hôm nay.
- `dueLabel(task: WorkTask, today: string): { text: string; tone: "late" | "today" | "soon" | "later" } | null`:

  | Điều kiện | Kết quả |
  |---|---|
  | Không có hạn | `null` |
  | Trễ hạn | `"Trễ N ngày"` / `"late"` (N = `daysBetween(due, today)`) |
  | Hạn hôm nay | `"Hôm nay"` / `"today"` |
  | Hạn trong 1–6 ngày tới | `"T5 · 05/11"` / `"soon"` (thứ ngắn T2…T7, CN) |
  | Xa hơn | `shortDay(due, today)` / `"later"` |

- `doneLabel(task: WorkTask, today: string): string`
  - `"xong hôm nay"`, hoặc `"xong " + shortDay(doneAt, today)`.

**Test:**

- `todayFocus`:
  - thứ tự quá hạn trước hôm nay;
  - bỏ việc đã xong;
  - đếm đúng số việc xong hôm nay.
- `upcomingTasks`: chặn biên `today+7` có, `today+8` không, hôm nay không.
- `recentDone`: thứ tự.
- `suggestStandup`: mang vướng mắc của bản ngày làm việc trước; bản cũ hơn thì không mang.
- `dueLabel`: đủ 5 nhánh, trong đó có "Trễ 1 ngày", "T5 · 05/11", "12/11".
- `doneLabel`.

### Task 2: `useWork` — thêm việc có hạn và ưu tiên, đổi cột

**Files:** Modify `src/lib/work/use-work.ts`. Test `src/lib/__tests__/work/use-work.test.ts`.

**Produces:**

- `addTask(title: string, columnId?: number, extra?: { dueDate?: string | null; priority?: WorkPriority }): boolean`
- `TaskInput { title; dueDate; priority; columnId?: number }`
  - `updateTask` đổi cột trong **cùng một lần ghi** khi `columnId` khác cột cũ.
- `moveTaskTo(id: number, columnId: number): void`
- Quy tắc vị trí dùng chung (hàm cấp module `placementIndex`): vào cột cuối thì index 0, cột khác thì `Number.MAX_SAFE_INTEGER`.

**Test:**

- `addTask`: kèm `extra` thì lưu đủ hạn và ưu tiên.
- `updateTask`:
  - có `columnId` cột cuối thì `done: true`, `doneAt` = hôm nay, đứng đầu cột;
  - `columnId` cột giữa thì đứng cuối cột;
  - `columnId` giống cột cũ thì không dời chỗ.
- `moveTaskTo`: cùng quy tắc vị trí.

### Task 3: Khung trượt (Modal `variant="sheet"`, `keepMounted`)

**Files:** Modify `src/components/ui/modal.tsx`. Test `src/components/__tests__/ui/modal.test.tsx`.

**Produces:**

- `ModalProps.variant?: "center" | "sheet"`, mặc định `"center"`. Panel sheet:
  - máy tính: dính mép phải, cao hết màn hình, rộng tối đa 560px;
  - dưới `md`: dính đáy, `max-h-[90svh]`, bo 2 góc trên.
- `ModalProps.keepMounted?: boolean`
  - Đóng thì vẫn render nội dung trong portal nhưng `hidden`.
  - Không khoá cuộn, không bẫy Tab, không nghe phím Esc.

**Test:**

- `keepMounted`: đóng rồi mở lại vẫn còn state con (ví dụ ô input giữ chữ). Khi đóng, nội dung không thấy được và không có role dialog trong cây truy cập.
- `variant="sheet"` có class mép phải.
- Test cũ của Modal giữ nguyên.

### Task 4: Thẻ việc, menu, hộp sửa có dòng Trạng thái

**Files:**

- Create:
  - `src/features/work/components/task-card.tsx`: `TaskCard`, `TaskMenu`, `DueBadge`, `PriorityMark`.
- Modify:
  - `src/features/work/components/task-form.tsx`: prop `columns: WorkColumn[]`, nhóm nút "Trạng thái", giá trị `columnId` trả về trong `onSubmit`.
- Test: `__tests__/components/task-card.test.tsx`, `task-form.test.tsx`.

**Interfaces:**

- `TaskCard({ task, today, columns, onToggle, onOpen, onMove, onDelete, tone?: "light" | "dark" })`
  - `onMove(task, columnId)`.
  - Menu "…" gồm "Sửa", "Chuyển sang" (radio theo cột) và "Xoá".
  - Nhãn của nút "…" là `` `Thao tác với "${task.title}"` ``.

**Test:**

- Tick gọi `onToggle`; bấm tên gọi `onOpen`; chọn cột trong menu gọi `onMove`.
- Chip đỏ "Trễ 2 ngày" có mặt; cờ ưu tiên cao có nhãn "Ưu tiên cao".
- `TaskForm`: chọn "Hoàn thành" rồi Lưu thì `onSubmit` nhận `columnId: 3`.

### Task 5: Các ô Bento

**Files (create):**

- `src/features/work/components/`:
  - `tile-header.tsx`
  - `quick-add.tsx`
  - `today-tile.tsx`
  - `standup-tile.tsx`
  - `week-tile.tsx`
  - `upcoming-tile.tsx`
  - `column-tile.tsx`
  - `done-tile.tsx`
  - `column-manager.tsx`
- Test: một file mỗi ô trong `__tests__/components/`.

**Interfaces:**

| Ô | Props |
|---|---|
| `QuickAdd` | `({ firstColumnTitle, today, onAdd(title, { dueDate, priority }): boolean })` |
| `TodayTile` | `({ tasks, today, onToggle, onOpen })` |
| `StandupTile` | `({ state, today, onWrite })` |
| `WeekTile` | `({ state, today, onOpenReport })` |
| `UpcomingTile` | `({ tasks, today, onOpen })` |
| `ColumnTile` | `({ column, tasks, today, columns, wide?, onAdd(title), onToggle, onOpen, onMove, onDelete, onShowAll })` |
| `DoneTile` | `({ tasks, today, onToggle, onShowAll })` |
| `ColumnManager` | `({ open, onOpenChange, columns, taskCounts, onAdd, onRename, onMove, onRemove })` |

**Test:** câu chữ đúng spec và các nút gọi đúng callback:

- `QuickAdd`:
  - chip "Hôm nay" và "Ngày mai" loại trừ nhau;
  - "Cao" thì gửi `priority: "high"`;
  - submit xong xoá ô và trả chip về mặc định.
- `TodayTile`:
  - đếm đúng;
  - từ việc thứ 7 trở đi ẩn sau "Xem thêm N việc";
  - không có việc thì hiện câu chỗ trống.
- `StandupTile`:
  - "Chưa lưu"/"Đã lưu";
  - "và N việc nữa";
  - "Từ standup trước";
  - Copy chép đúng `formatStandup`.
- `WeekTile`: số việc xong trong tuần.
- `UpcomingTile`: tối đa 4 việc kèm "và N việc nữa".
- `ColumnTile`:
  - từ thẻ thứ 7 ẩn đi, có nút "Xem tất cả N";
  - thêm việc gọi `onAdd`.
- `DoneTile`: 5 việc, có "Tất cả N".
- `ColumnManager`:
  - đổi tên khi rời ô;
  - lên/xuống;
  - xoá có hỏi lại;
  - thêm cột.

### Task 6: Ghép `WorkView`, gỡ Kanban và dnd-kit

**Files:**

- Rewrite: `work-view.tsx`.
- Delete: `kanban-board.tsx`, `kanban-column.tsx`, `kanban-card.tsx`, `kanban-dnd.ts` và test của chúng.
- Update: test `work-view.test.tsx`.
- `npm uninstall @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`.
- Sửa dòng dnd-kit trong CLAUDE.md và mô tả trang Làm việc trong README.

**WorkView** giữ các trạng thái mở/đóng:

- hộp sửa (`editingId`);
- hỏi xoá (`deletingId`);
- 3 khung trượt: standup và báo cáo dùng `keepMounted`, "xem tất cả" theo `columnId`;
- `ColumnManager`.

**Test tích hợp:**

- Thêm nhanh có hạn hôm nay thì việc hiện ở ô Hôm nay.
- Tick ở ô Hôm nay thì việc sang ô Đã xong.
- Chuyển cột bằng menu thì thẻ đổi ô và có toast.
- Mở khung Standup, gõ, đóng, mở lại thì chữ còn nguyên.
- Mở khung Báo cáo.
- Bảng chỉ còn 1 cột không văng lỗi.
- Đổi tên cột trong "Quản lý cột" thì tên ô đổi theo.

**Kiểm cuối:**

- `npx tsc --noEmit`, lint, `format:check`, toàn bộ test, `npm run build`.
- Chụp bản production ở cổng 3123: 390 / 768 / 1280 / 1440 / 1920, không cuộn ngang.
