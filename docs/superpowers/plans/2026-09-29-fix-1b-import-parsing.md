# Parse dữ liệu từng mục, nhập/đồng bộ, secret (phần 1b sửa lỗi review 2026-09-29) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Nhánh:** `fix/import-parsing` (tách từ `developer` sau khi phần trước đã merge — phần trước là Plan 1a `docs/superpowers/plans/2026-09-29-fix-1a-storage-sync.md`).

**Goal:** 1 phần tử hỏng trong dữ liệu đã lưu hoặc trong 1 bản sao (file/cloud) chỉ mất riêng phần tử đó, không làm rỗng cả mảng hay làm sập trang; "Nhập từ file"/"Tải xuống" phải hỏi lại (kèm thời điểm tạo bản sao và số liệu 2 bên) trước khi thay dữ liệu, và nếu ghi lỗi giữa chừng thì trả máy về nguyên trạng; secret đồng bộ bị gỡ khỏi máy khi đăng xuất và khi xoá toàn bộ dữ liệu.

**Architecture:** 1 helper dùng chung mới `safeArray(schema, value)` trong `src/lib/` lọc từng phần tử bằng zod và trả bản đã qua schema; mọi storage (tài chính, chi tiêu, lịch sử tài sản, nhật ký, cài đặt) parse mảng qua nó. Mỗi domain có đúng 1 hàm parse (`parseFinanceState`, `parseJournalState` mới, `parseAppSettings` mới, `parseStudyState`...) dùng chung cho cả đọc localStorage lẫn `parseImportPayload` (nhập file, tải xuống, `POST /api/sync`). `useDataManagement` tách "đọc + parse" (chỉ xếp bản sao vào `pendingRestore`) khỏi "ghi" (`confirmRestore`, chụp chuỗi thô mọi key trước khi ghi để trả lại nếu 1 lần ghi lỗi); `DataCard` hiện `AlertDialog` xác nhận. `clearSyncSecret()` được gọi ở đăng xuất và xoá dữ liệu, và báo qua `data-change-bus` để ô secret đang mở tự trống.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript, zod 4, zustand 5, Vitest + React Testing Library (jsdom) — không thêm dependency nào.

**Spec:** Không có spec riêng — nguồn là các phát hiện review đã được kiểm chứng đối kháng (2026-09-29), liệt kê đủ ở mục `## Phạm vi` bên dưới.

## Global Constraints

- Nhánh `fix/import-parsing` tách từ `developer` **sau khi** nhánh của Plan 1a đã merge. 1 commit/task, message theo CLAUDE.md (`fix:` / `change:` / `refactor:` ...) cộng dòng attribution mà phiên thực thi yêu cầu. Không commit thẳng lên `developer`/`main`, không `git push` khi chủ repo chưa yêu cầu.
- Không thêm dependency. `EXPORT_VERSION` giữ `1` (field mới tự fallback theo từng section). AutoBackup vẫn không mount. Mock login giữ nguyên. `Expense.tag` vẫn là snapshot đóng băng. Số còn phải tất toán của tháng vẫn tính lại, không khoá. `/sandbox` không đụng.
- Tên file/biến/test tiếng Anh; chữ hiển thị cho người dùng tiếng Việt, đúng nguyên văn trong plan.
- Mảng lưu lâu dài parse theo TỪNG phần tử bằng `safeArray` (`@/lib/safe-array`), trả **bản đã qua schema** (field lạ bị bỏ, field có `.catch()` được điền). Giữ fallback cả field như cũ cho `study.tasks`, `study.gameHighScores`, `study.gameStreak` (có mặc định riêng); `study.wordReviews` giữ `safeWordReviews` sẵn có.
- Mỗi domain đúng 1 hàm parse, dùng chung cho đọc localStorage và `parseImportPayload` — không viết lại quy tắc validate ở `data-transfer.ts`.
- Nạp bản sao (file hoặc cloud) KHÔNG ghi gì xuống máy trước khi người dùng bấm "Thay dữ liệu" (Task 8). Ghi lỗi giữa chừng → trả mọi key về đúng chuỗi thô trước khi nạp rồi `notifyDataChanged()` 1 lần (Task 6).
- **Plan 1a đã merge trước:** trước khi sửa 1 file, đọc lại TOÀN BỘ file đó. Đoạn nào plan này thay mà đã có logic của 1a (vd. `dedupeNames(...)` bọc `savings`/`cards` trong `parseFinanceState`, mutation dựng từ `getStored*()` đọc tươi, `useStorageSync(...)` trong hook) thì giữ nguyên logic đó trong bản mới. Plan này chỉ dựa vào hành vi đã có của 1a: mọi hook domain (qua `useStorageSync` của 1a) đọc lại storage sau `notifyDataChanged()`. Ô secret ở `DataCard` cố ý KHÔNG dùng `useStorageSync` (lý do ở Task 9).
- Test đặt trong `__tests__/` mirror cấu trúc, theo đúng pattern file bên cạnh (`renderHook` + `act`, `vi.mock("../../api")`, `window.localStorage.clear()` trong `beforeEach`). Mô phỏng "tab khác" = ghi thẳng `window.localStorage` rồi `window.dispatchEvent(new StorageEvent("storage", { key }))` trong `act`.
- Chạy từng file test bằng `npx vitest run <path>`; full suite, lint, tsc chỉ ở Task 10.
- Next.js 16 có breaking changes — plan này không dùng API Next nào mới (chỉ `next/navigation` sẵn có ở sidebar và mock sẵn có trong test); nếu buộc phải đụng API Next khác, đọc `node_modules/next/dist/docs/` trước.
- Task 1–6 (parse/độ bền, không đổi thao tác của người dùng) commit ngay khi xanh. Task 7, 8, 9 đổi thao tác người dùng nhìn thấy: làm xong + test của task xanh thì **dừng**, báo chủ repo bấm thử đúng mục tương ứng ở "Kiểm tra tay" (Task 10), chỉ commit khi chủ repo xác nhận, rồi mới sang task kế (quy ước "review before commit" của chủ repo — Task 9 sửa lại file của Task 8 nên không được chồng 2 task chưa commit).

## Quyết định cần duyệt

### 1. "Tải xuống" và "Nhập từ file" có hỏi lại trước khi thay dữ liệu không?

Hiện 1 cú bấm là toàn bộ nhật ký, tài chính, chi tiêu, học tập, lịch sử tài sản và cài đặt trên máy bị thay bằng bản kia. "Tải xuống" nằm ngay cạnh "Tải lên"; bản trên cloud có thể cũ hơn dữ liệu trên máy (hoặc gần rỗng — `{"version":1}` vẫn hợp lệ); AutoBackup đang tắt nên không có bản nào khác giữ lại. Xoá dữ liệu thì cần mật khẩu + 2 bước, còn nạp đè thì 0 bước. (1 verifier coi đây là lỗi; 1 verifier coi là hành vi có chủ đích, đang có test khẳng định.)

- **A. Giữ nguyên** — nhanh nhất; bấm nhầm hoặc nạp nhầm bản cũ là mất phần chưa tải lên, không hoàn tác.
- **B. Hộp xác nhận** — tải/đọc xong nhưng CHƯA ghi gì; hiện "Thay dữ liệu trên máy này?" kèm thời điểm tạo bản sao (`exportedAt`, có cả năm), số liệu của bản sắp nạp và số liệu đang có trên máy (bài nhật ký · khoản chi · quỹ tiết kiệm · lần mua vàng · từ đã học). Bấm "Thay dữ liệu" mới ghi. Thêm đúng 1 cú bấm mỗi lần đồng bộ về.
- **C. Như B + tự tải 1 file sao lưu dữ liệu trên máy trước khi thay** — an toàn nhất, nhưng mỗi lần "Tải xuống" lại rơi thêm 1 file JSON vào thư mục Tải xuống (trên điện thoại khá phiền), trong khi nút "Xuất file JSON" đã nằm ngay phía trên.
- **Khuyên dùng: B** — vì chặn đúng lỗi bấm nhầm/nạp nhầm bản cũ với giá 1 cú bấm, và cho thấy bản sắp nạp cũ/mới ra sao trước khi quá muộn; hộp thoại có sẵn câu nhắc "Huỷ rồi bấm Xuất file JSON trước" cho lúc muốn thêm lưới an toàn như C. Plan làm B (Task 8). Nếu chọn A thì bỏ Task 8 (Task 6 vẫn giữ: không bao giờ nạp dở dang); khi đó ở Task 9 Step 1.3, dòng import RTL gốc của `data-card.test.tsx` đổi thành `import { act, fireEvent, render, screen } from "@testing-library/react"` (không có `within`) và `BASE_PROPS` giữ nguyên bản gốc; ở "Kiểm tra tay" bỏ B.1–B.5, giữ B.6.

### 2. Khi nào xoá secret đồng bộ khỏi máy?

`sync-secret` là credential thật: ai có nó là đọc/ghi `/api/sync` từ bất cứ đâu cho tới khi đổi `SYNC_SECRET` trên Vercel. Hiện cả "Đăng xuất" lẫn "Xoá toàn bộ dữ liệu" đều để lại nó; ô secret ở Cài đặt vẫn điền sẵn và có nút Copy.

- **A. Xoá khi Đăng xuất và khi Xoá toàn bộ dữ liệu** — sau mỗi lần đăng xuất phải dán lại secret trước khi đồng bộ (mock login giữ phiên lâu nên hiếm khi phải làm).
- **B. Chỉ xoá khi Xoá toàn bộ dữ liệu** — không phải dán lại sau đăng xuất, nhưng không chặn đúng kịch bản của lỗi: trên máy mượn người ta đăng xuất, không ai bấm xoá dữ liệu.
- **C. Giữ nguyên, thêm nút "Quên secret trên máy này"** — phải nhớ bấm; quên là lộ.
- **Khuyên dùng: A** — vì đăng xuất là thao tác "xong việc trên máy này" và xoá dữ liệu là "làm lại từ đầu"; cả 2 đều không nên để lại credential. Plan làm A (Task 9). Nếu chọn B thì bỏ phần `sidebar.tsx` (Step 3.2 và test sidebar) của Task 9.

### 3. Dòng nội dung JSONL sai field: làm hỏng build hay bỏ qua dòng đó?

`content/vocabulary.jsonl`/`grammar.jsonl` do chủ repo tự sửa. Hiện 1 dòng gõ nhầm field (vd. `"Word"` thay cho `"word"`) lọt qua build rồi làm sập `/study` và `/overview` trên trình duyệt.

- **A. Ném lỗi kèm `file:dòng` và tên field** — `npm run test` (test `getVocab`/`getGrammar` đọc file thật) và `next build` (2 trang prerender gọi `getVocab()`) đều hỏng cho tới khi sửa dòng đó; trang không bao giờ sập vì nội dung.
- **B. Bỏ qua dòng hỏng (`console.warn`)** — build/deploy vẫn qua, nhưng từ/bài ngữ pháp đó biến mất âm thầm khỏi app cho tới khi có người để ý.
- **Khuyên dùng: A** — vì lỗi gõ trong file của chính mình nên bị chặn ngay tại chỗ (chỉ đúng dòng + field) trước khi commit, thay vì mất nội dung âm thầm. Plan làm A (Task 5).

## Phạm vi

| Phát hiện | Mô tả | Sửa ở |
|---|---|---|
| `area-settings-sync#2` | "Tải xuống"/"Nhập từ file" thay toàn bộ dữ liệu trên máy sau 1 cú bấm, không hỏi, không cho thấy bản sao cũ hay mới | Task 8 (theo Quyết định 1) |
| `area-finance-logic#3` | 1 phần tử hỏng làm rỗng cả mảng tài chính, lần ghi kế tiếp biến mất mát thành vĩnh viễn; ô khối lượng vàng nhận `1e400` (= Infinity, lưu thành `null`) | Task 1 (parse từng phần tử), Task 7 (ô khối lượng chỉ nhận số hữu hạn) |
| `area-settings-sync#3` | Mood/tag/module/bài nhật ký nhập vào không kiểm từng phần tử → 1 `null` làm `parseImportPayload` ném lỗi (không banner, `POST /api/sync` 500) hoặc làm sập Cài đặt/Nhật ký/Tổng quan; 1 mood `null` trong storage làm mất cả hồ sơ + nhãn + module | Task 2 (bài nhật ký), Task 3 (mood/tag/module, đọc máy lẫn nhập) |
| `lens-data-integrity#6` | Bài nhật ký là dữ liệu duy nhất không kiểm từng phần tử khi nhập/tải xuống → 1 bài `null` làm sập `/journal`, `/overview` mỗi lần mở | Task 2 |
| `area-overview-journal#8` | `journal-storage` không kiểm từng bài (kể cả `entries` không phải mảng) | Task 2 |
| `area-study#11` | 1 phần tử sai kiểu trong `learned` xoá sạch mọi đánh dấu "đã học" | Task 4 |
| `area-study#16` | Dòng JSONL từ vựng/ngữ pháp sai field lọt qua build rồi làm sập `/study`, `/overview` | Task 5 (theo Quyết định 3) |
| `lens-security#1` | Đăng xuất và xoá toàn bộ dữ liệu không gỡ `sync-secret` → người dùng sau trên cùng trình duyệt copy được secret | Task 9 (theo Quyết định 2) |
| `area-settings-sync#5` | `pullFromCloud`/`importData` không try/finally → khôi phục dở dang, kẹt "Đang đồng bộ…", lỗi không có banner | Task 6 |
| `area-settings-sync#4` | Module nhập vào bỏ qua `mergeModules` → toggle chết/thiếu cho tới khi mở trang khác | Task 3 |
| `area-finance-logic#13` | Test đang khoá chặt lỗi (1 thẻ hỏng → rỗng cả mảng) và thiếu test cho hành vi rủi ro | Task 1 (thay 2 test khoá lỗi ở `finance-storage.test.ts` và `data-transfer.test.ts`). Phần còn lại **Không sửa ở plan này** — đã thuộc phát hiện khác: test hook 2 instance/ghi từ nơi khác/trùng tên quỹ-thẻ → Plan 1a (`area-finance-logic#1`, `#2`, merge trước plan này); test copy "lãi 0 ₫ … nhờ giá vàng tăng" của `gold-tab` → Plan 6a (`area-finance-logic#6`); test `AddGoldForm` giữ cửa hàng đã đổi tên/xoá → Plan 6a (`area-finance-logic#4`) |

## Thay đổi ảnh hưởng tới các phần sau

Các plan 2, 3, 4, 5, 6a, 6b được viết song song với giả định plan này đã merge. Mọi thứ dưới đây là "hợp đồng" mới mà chúng phải dựa vào (và không được làm mất khi sửa/di chuyển file):

**Helper mới**
- `safeArray<T>(schema: z.ZodType<T>, value: unknown): T[]` — `src/lib/safe-array.ts`. Không phải mảng → `[]`; phần tử fail schema bị bỏ riêng nó; trả **bản đã qua schema** (field lạ bị bỏ, `.catch()` được điền). `budget-storage.ts` và `net-worth-history-storage.ts` bỏ bản `safeArray` cục bộ (vốn trả nguyên object gốc), dùng bản này. **Plan 2** (`area-budget-goals#16`, số tiền > 2^53) sửa schema trong `budget-storage.ts` trên nền này — `.refine()` vốn đã lọc được phần tử từ trước; nay cả `.catch()`/`.transform()` thêm vào schema cũng có hiệu lực với dữ liệu đọc ra (bản đã qua schema, field lạ bị bỏ).
- CLAUDE.md mục 3: gạch đầu dòng "Hook đọc/ghi localStorage" (của 1a) có thêm ý (4) (Task 1): mảng lưu lâu dài parse từng phần tử bằng `safeArray`, mỗi domain 1 hàm `parse*` dùng chung.

**Parse/lưu trữ đã đổi**
- `finance-storage.ts`: `parseFinanceState` lọc từng phần tử cho cả 5 mảng (`savings`/`cards` vẫn bọc `dedupeNames(...)` của 1a); `safeField` bị xoá khỏi file này. **Plan 6b** (`area-finance-logic#11`, chuyển data layer tài chính) phải giữ nguyên.
- `journal-storage.ts`: export mới `parseJournalState(value: unknown): JournalState` — chỉ `id: number` bắt buộc; `text`/`time`/`date` thiếu → `""`, `words` thiếu → `0`, `mood` sai → `null`; `mood.score` được phép thiếu (bài viết trước commit a160fdb). Field lạ ở cấp state bị bỏ. `getStoredJournal` và `data-transfer.ts` đều dùng nó. **Plan 4** (`area-overview-journal#5`, snapshot mood đóng băng; `#6`) sửa trên nền này — không thêm field bắt buộc mới vào schema mà không cho giá trị `.catch()`.
- `settings-storage.ts`: export mới `parseAppSettings(value: unknown): AppSettings` — mood/tag lọc từng phần tử (`label` + `emoji` bắt buộc, còn lại điền mặc định; mood thiếu `score` → `3`), module gộp qua `mergeModules` (giờ nhận `Pick<ModuleToggle, "key" | "on">[]`), `profile` chỉ nhận `displayName`/`greeting` là chuỗi, `dismissedInsights` chỉ giữ chuỗi. Dùng ở `getStoredSettings` lẫn `data-transfer.ts`. **Plan 6a** (`area-settings-sync#8`, chặn mood trùng tên) thêm kiểm tra ở `addMood`; nếu muốn gỡ trùng trong dữ liệu đã lưu thì làm trong `parseAppSettings`. **Plan 6b** (`area-settings-sync#11`, chuyển `useSettings` sang `src/lib/`) không cần đụng parse.
- `study-storage.ts`: `learned` lọc từng phần tử (chỉ chuỗi, bỏ id trùng, giữ thứ tự lần đầu). **Plan 3** (`area-study#10`, bỏ đánh dấu "đã học" nhầm) có thể coi `learned` không trùng.
- `content-loader.ts`: `parseJsonl<T>(raw: string, filename: string, schema: z.ZodType<T>): T[]` — tham số `schema` mới, bắt buộc; dòng sai field ném `Error` `"<file>:<dòng>: dòng thiếu hoặc sai kiểu field <field> — <đầu dòng>"`. **Plan 6b** (`area-study#17`, chuyển code study dùng chung) phải mang theo 2 schema `vocabEntrySchema`/`grammarEntrySchema`; thêm field mới vào `VocabEntry`/`GrammarEntry` thì phải thêm vào schema.
- `data-transfer.ts`: `ImportResult` nhánh ok có thêm `exportedAt: string | null`; export mới `restoreCounts(snapshot)` và `type ImportedSnapshot`; `ensureArray` bị xoá. **Plan 6a** (`area-settings-sync#6`, tên file xuất theo ngày UTC) sửa `exportFileName` — độc lập với `exportedAt` ở đây (hộp xác nhận hiện giờ địa phương).
- `car-goal-storage.ts` export `CAR_GOAL_FUND_KEY` (đã có từ Plan 1a Task 6; Task 6 ở đây chỉ thêm nếu còn thiếu).

**Nhập/đồng bộ và Cài đặt**
- `useDataManagement`: `importData(file)` và `pullFromCloud(secret)` chỉ xếp bản đã parse vào `pendingRestore: PendingRestore | null` (không ghi); ghi thật ở `confirmRestore()`, huỷ bằng `cancelRestore()`. Ghi lỗi giữa chừng → trả mọi key về chuỗi thô cũ + `notifyDataChanged()` + banner lỗi `"Không ghi được dữ liệu vào máy (bộ nhớ trình duyệt có thể đã đầy). Dữ liệu trên máy vẫn giữ nguyên như trước."`. `pullFromCloud` luôn tắt `syncing` (try/catch/finally); lỗi bất ngờ → `"Không kết nối được máy chủ đồng bộ."`; `importData` không bao giờ reject (file không đọc được → `"Không đọc được nội dung file."`). `wipeData` gọi thêm `clearSyncSecret()`. Export thêm `type PendingRestore`. **Plan 6a** (`area-settings-sync#15`, secret có ký tự ngoài Latin-1) nên bắt lỗi đó ngay trong `api.ts` để có message riêng — nếu để lọt ra, hook sẽ báo chung "Không kết nối được máy chủ đồng bộ.".
- `DataCard`: props mới bắt buộc `pendingRestore`, `onConfirmRestore`, `onCancelRestore`; render `AlertDialog` (title "Thay dữ liệu trên máy này?", nút "Thay dữ liệu", `destructive`); mô tả là các `<span className="block">` nằm trong `<p>` của AlertDialog. Ô secret tự đọc lại `getSyncSecret()` mỗi khi có `notifyDataChanged()` (cùng tab) hoặc sự kiện `storage` (tab khác) — không dùng `useStorageSync` (xem mục phụ thuộc Plan 1a). **Plan 5** (`area-components-lib#4`, modal cuộn được) và **Plan 6b** (`area-components-lib#14`, `aria-describedby` cho AlertDialog) sẽ đụng hộp thoại này — giữ nội dung mô tả là inline/phrasing content.
- `clearSyncSecret()` giờ gọi `notifyDataChanged()`; `Sidebar.handleLogout` gọi `clearSyncSecret()` trước `clearStoredUser()`. **Plan 5** (`area-shell-auth-calc#1`, `#8`), **6a** (`area-shell-auth-calc#2`), **6b** (`area-shell-auth-calc#7`) sửa sidebar — giữ lời gọi này. **Plan 6a** (`area-settings-sync#7`, copy của ResetCard) nên nhắc rằng xoá toàn bộ dữ liệu cũng gỡ secret đồng bộ khỏi máy.

**Form tài chính**
- `AddGoldForm`/`EditGoldPurchaseModal`: điều kiện khối lượng hợp lệ là `Number.isFinite(Number(phan)) && Number(phan) > 0` (biến `phanValid`). **Plan 6a** (`area-finance-logic#9`, ô phân nhận số lẻ; `#4`, cửa hàng đã đổi tên/xoá) phải giữ kiểm tra hữu hạn này khi đổi cách nhập phân.

**Phụ thuộc vào Plan 1a (đã merge trước)**
- Task 6 trả storage về chuỗi thô cũ rồi `notifyDataChanged()`; để state trong bộ nhớ của các hook (đã kịp `setState` bản mới trước lần ghi lỗi) khớp lại storage, plan này dựa vào việc hook domain của 1a đọc lại storage khi nhận `notifyDataChanged()`. Giới hạn đã biết (chấp nhận): `useStorageSync` chỉ đọc lại khi chuỗi thô thật sự đổi, mà `useStudy.persist`/`useNetWorthHistory.replaceHistory` gọi `setState` TRƯỚC khi ghi — nếu chính lần ghi của 2 hook đó là lần lỗi thì storage của key đó chưa từng đổi, hook không đọc lại, và state trong bộ nhớ của riêng hook đó vẫn là bản mới cho tới khi rời trang Cài đặt. Hệ quả chỉ là số đếm ở ResetCard (vd. "N từ đã học") hiện số của bản sao; storage, "Xuất file JSON", "Tải lên" và mọi trang khác đều đúng bản cũ (useFinance/useBudget/useJournal/useSettings của 1a ghi trước rồi mới `setState` nên không dính). Plan sau nào đổi thứ tự `persist` của 2 hook này (xem 1a, mục "Khác biệt có chủ đích") thì giới hạn này tự hết.
- Plan 1a để lần "Tải xuống" xong muộn (sau khi đã rời Cài đặt) vẫn ghi, và cho trang đang mở tự đọc lại. Task 8 ở đây đổi hẳn: kết quả về sau khi đã rời Cài đặt không ghi gì (chỉ `setPendingRestore` trên component đã unmount) — test hook của 1a (vd. "shows budget data written after this page mounted…" ghi thẳng `setStoredBudget`) không phụ thuộc `useDataManagement` nên vẫn xanh.
- `clearSyncSecret()` gọi `notifyDataChanged()` đúng như hợp đồng 1a yêu cầu cho lần ghi không qua `setStored*()`. `setSyncSecret()` (mỗi lần gõ) cố ý vẫn KHÔNG báo — để AutoBackup (nếu có ngày bật lại) không tự tải lên chỉ vì đang gõ secret. Vì vậy chuỗi thô `sync-secret` đổi mà không có notify, và `useStorageSync` (so với chuỗi thô lần trước) sẽ có mốc cũ; DataCard (Task 9) tự nghe `onDataChanged` + sự kiện `storage` và luôn đọc lại, thay vì dùng `useStorageSync`.
- CLAUDE.md: Task 1 nối ý (4) về `safeArray` vào gạch đầu dòng "Hook đọc/ghi localStorage" mà 1a đã thêm.

## Cấu trúc file

- Create: `src/lib/safe-array.ts`, `src/lib/__tests__/safe-array.test.ts`, `src/features/journal/__tests__/journal-storage.test.ts`
- Modify (storage/parse): `src/features/finance/finance-storage.ts`, `src/features/budget/budget-storage.ts`, `src/features/overview/net-worth-history-storage.ts`, `src/features/journal/journal-storage.ts`, `src/lib/settings-storage.ts`, `src/features/study/study-storage.ts`, `src/features/study/content-loader.ts`, `src/features/settings/data-transfer.ts`, `src/features/goals/car-goal-storage.ts`, `src/lib/sync-secret-storage.ts`
- Modify (hook/UI): `src/features/settings/hooks/use-data-management.ts`, `src/features/settings/components/data-card.tsx`, `src/features/settings/components/settings-view.tsx`, `src/features/finance/components/add-gold-form.tsx`, `src/features/finance/components/edit-gold-purchase-modal.tsx`, `src/app/(app)/_components/sidebar.tsx`
- Modify (docs): `CLAUDE.md` (nối ý (4) vào gạch đầu dòng "Hook đọc/ghi localStorage" của Plan 1a ở mục 3)
- Test sửa/thêm: các file `__tests__` tương ứng, nêu cụ thể trong từng task.

---

### Task 1: `safeArray` dùng chung + tài chính lọc từng phần tử

**Files:**
- Create: `src/lib/safe-array.ts`
- Test: `src/lib/__tests__/safe-array.test.ts` (tạo mới)
- Modify: `src/features/finance/finance-storage.ts` (import, `safeField` + comment, comment của `migrateGoldShape`, `return` của `parseFinanceState` — Plan 1a đã thêm `dedupeNames` phía trên `isObject` nên số dòng lệch so với `developer` cũ; đọc lại file trước khi sửa)
- Modify: `src/features/budget/budget-storage.ts:1-4,46-53` (bỏ `safeArray` cục bộ)
- Modify: `src/features/overview/net-worth-history-storage.ts:1-3,22-27` (bỏ `safeArray` cục bộ)
- Modify: `CLAUDE.md` (mục 3)
- Test: `src/features/finance/__tests__/finance-storage.test.ts:25-32`, `src/features/settings/__tests__/data-transfer.test.ts:296-308`

**Interfaces:**
- Consumes: không có gì từ task trước.
- Produces: `safeArray<T>(schema: z.ZodType<T>, value: unknown): T[]` (`@/lib/safe-array`) — trả bản đã qua schema; dùng bởi Task 2, 3. `parseFinanceState` lọc từng phần tử cho cả 5 mảng (chữ ký không đổi).

- [ ] **Step 1: Viết test thất bại**

Tạo `src/lib/__tests__/safe-array.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { z } from "zod"

import { safeArray } from "../safe-array"

const schema = z.object({ id: z.number(), label: z.string().catch("") })

describe("safeArray", () => {
  it("returns an empty array when the value is not an array", () => {
    expect(safeArray(schema, "x")).toEqual([])
    expect(safeArray(schema, undefined)).toEqual([])
    expect(safeArray(schema, { id: 1 })).toEqual([])
  })

  it("drops only the elements that fail the schema, keeping the rest in order", () => {
    expect(safeArray(schema, [{ id: 1, label: "a" }, null, { label: "thiếu id" }, { id: 2, label: "b" }])).toEqual([
      { id: 1, label: "a" },
      { id: 2, label: "b" },
    ])
  })

  it("returns the parsed element: unknown fields dropped, .catch() fields filled in", () => {
    expect(safeArray(schema, [{ id: 1, extra: true }])).toEqual([{ id: 1, label: "" }])
  })
})
```

Trong `src/features/finance/__tests__/finance-storage.test.ts`, thay nguyên test `"falls back to an empty array when a list field contains elements missing required fields"` (test đang khoá chặt lỗi: 1 thẻ hỏng làm rỗng cả mảng) bằng 2 test:

```ts
  it("drops only the malformed element of a list field, keeping its valid siblings", () => {
    const validCard = { name: "Thẻ tốt", balance: 1_000_000, min: 100_000, limit: 10_000_000, due: "15" }
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FINANCE_STATE, cards: [{ name: "Thẻ lỗi" }, validCard] })
    )

    expect(getStoredFinance().cards).toEqual([validCard])
  })

  it("keeps every other gold purchase when one was saved with a non-finite weight (stored as null)", () => {
    const good = { id: 1, date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" }
    const broken = { id: 2, date: "12/08/2026", phan: Infinity, buy: 910_000, store: "SJC" }
    // JSON.stringify ghi Infinity thành null — đúng thứ localStorage giữ lại sau khi gõ "1e400".
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FINANCE_STATE, gold: [good, broken], goldStores: [{ name: "SJC", price: "" }] })
    )

    expect(getStoredFinance().gold).toEqual([good])
  })
```

Trong `src/features/settings/__tests__/data-transfer.test.ts`, thay nguyên test `"falls back to the default finance array when its elements are missing required fields, not just when the field is wrong-typed"` bằng:

```ts
  it("drops only the finance elements missing required fields, keeping their valid siblings", () => {
    const validCard = { name: "Thẻ tốt", balance: 1_000_000, min: 100_000, limit: 10_000_000, due: "15" }
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      finance: { cards: [{ name: "Thẻ lỗi" }, validCard] },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.finance.cards).toEqual([validCard])
    }
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/lib/__tests__/safe-array.test.ts src/features/finance/__tests__/finance-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts`
Expected: FAIL — `safe-array.test.ts`: `Failed to resolve import "../safe-array"`; `finance-storage.test.ts` 2 test mới: `expected [] to deeply equal [ { name: 'Thẻ tốt', …(4) } ]` và `expected [] to deeply equal [ { id: 1, …(4) } ]`; `data-transfer.test.ts` 1 test mới: `expected [] to deeply equal [ { name: 'Thẻ tốt', …(4) } ]`. Mọi test cũ khác vẫn PASS.

- [ ] **Step 3: Tạo `src/lib/safe-array.ts`**

```ts
import type { z } from "zod"

// Lọc TỪNG phần tử của 1 mảng lưu lâu dài: phần tử hỏng bị bỏ riêng nó, phần còn lại giữ nguyên
// thứ tự (trả về bản đã qua schema — field lạ bị bỏ, field có .catch() được điền mặc định). Không
// phải mảng thì coi như rỗng.
function safeArray<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const result = schema.safeParse(item)
    return result.success ? [result.data] : []
  })
}

export { safeArray }
```

- [ ] **Step 4: Tài chính lọc từng phần tử**

Trong `src/features/finance/finance-storage.ts`:

1. Thêm import ngay sau dòng `import { notifyDataChanged } from "@/lib/data-change-bus"`:

```ts
import { safeArray } from "@/lib/safe-array"
```

2. Xoá hẳn hàm `safeField` cùng 2 dòng comment phía trên nó (`// Đọc/khôi phục 1 field độc lập — ...` và dòng tiếp theo).

3. Trong comment phía trên `migrateGoldShape`, thay 2 dòng

```ts
// Zod validate `gold` — nếu không, purchase thiếu `store` sẽ fail goldPurchaseSchema và
// cả mảng gold rơi về [], mất sạch lịch sử mua. Không đụng vào nếu đã ở format mới
```

bằng

```ts
// Zod validate `gold` — nếu không, mọi purchase thiếu `store` sẽ fail goldPurchaseSchema và
// bị bỏ khi đọc, mất sạch lịch sử mua. Không đụng vào nếu đã ở format mới
```

4. Thay khối `return { ... }` của `parseFinanceState` (sau Plan 1a, 2 dòng đầu là `savings: dedupeNames(safeField(...))` và `cards: dedupeNames(safeField(...))`) bằng — giữ nguyên `dedupeNames(...)` bọc ngoài `savings`/`cards`, chỉ thay `safeField(z.array(X), value, DEFAULT_FINANCE_STATE.field)` bằng `safeArray(X, value)`:

```ts
  // Lọc TỪNG phần tử (giống budget-storage): 1 purchase/thẻ hỏng chỉ mất riêng nó. Trước đây cả
  // mảng rơi về [] và lần ghi kế tiếp (vd. gõ 1 phím giá vàng) biến mất mát đó thành vĩnh viễn.
  // Lọc trước, khử trùng tên sau — bản hỏng bị bỏ thì không chiếm tên của bản hợp lệ.
  return {
    savings: dedupeNames(safeArray(savingsFundSchema, parsed.savings)),
    cards: dedupeNames(safeArray(creditCardSchema, parsed.cards)),
    gold: safeArray(goldPurchaseSchema, migrated.gold),
    goldStores: safeArray(goldStoreSchema, migrated.goldStores),
    invests: safeArray(investmentSchema, parsed.invests),
  }
```

(`import { z } from "zod"` vẫn giữ — các schema còn dùng. `dedupeNames` của 1a giữ nguyên.)

- [ ] **Step 5: Chi tiêu và lịch sử tài sản dùng `safeArray` chung**

Trong `src/features/budget/budget-storage.ts`:
1. Thêm `import { safeArray } from "@/lib/safe-array"` ngay sau dòng `import { notifyDataChanged } from "@/lib/data-change-bus"`.
2. Xoá hàm `safeArray` cục bộ cùng 2 dòng comment phía trên nó (`// Khác finance-storage.ts: ...` và dòng tiếp theo).
3. Đặt ngay trên `function parseBudgetState` comment:

```ts
// expenses/settlements là lịch sử tích luỹ dài hạn — 1 bản ghi hỏng chỉ bị bỏ riêng nó (safeArray),
// không kéo mất cả mảng.
```

Trong `src/features/overview/net-worth-history-storage.ts`:
1. Thêm `import { safeArray } from "@/lib/safe-array"` ngay sau dòng `import { notifyDataChanged } from "@/lib/data-change-bus"`.
2. Xoá hàm `safeArray` cục bộ cùng 2 dòng comment phía trên nó (`// Lịch sử tích luỹ dài hạn, ...` và dòng tiếp theo). Comment của `parseNetWorthHistory` giữ nguyên.

- [ ] **Step 6: Ghi quy ước vào CLAUDE.md**

Trong `CLAUDE.md` mục `## 3. Feature Rules (feature-sliced)`, gạch đầu dòng `- **Hook đọc/ghi localStorage** (...)` mà Plan 1a đã thêm hiện kết thúc bằng ý (3) (câu cuối là "... thì phải tự gọi `notifyDataChanged()` ngay sau."). Nối thêm vào cuối đúng gạch đầu dòng đó (cùng dòng, sau dấu chấm của ý 3, cách 1 dấu cách):

```markdown
(4) mảng đọc từ localStorage hoặc từ 1 bản sao (file/cloud) parse bằng zod theo TỪNG phần tử qua `safeArray` từ `@/lib/safe-array` — phần tử hỏng chỉ bị bỏ riêng nó, không kéo cả mảng về `[]`; mỗi domain có đúng 1 hàm `parse*` dùng chung cho đọc máy lẫn `parseImportPayload`.
```

- [ ] **Step 7: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/lib/__tests__/safe-array.test.ts src/features/finance/__tests__/finance-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts src/features/budget/__tests__/budget-storage.test.ts src/features/overview/__tests__/net-worth-history-storage.test.ts src/features/finance/__tests__/hooks/use-finance.test.ts`
Expected: PASS toàn bộ (kể cả "keeps a valid field untouched even when a sibling field is malformed" và "preserves the legacy price into a default store even when the purchase list itself is corrupted" sẵn có)

- [ ] **Step 8: Commit**

```bash
git add src/lib/safe-array.ts src/lib/__tests__/safe-array.test.ts src/features/finance/finance-storage.ts src/features/budget/budget-storage.ts src/features/overview/net-worth-history-storage.ts CLAUDE.md src/features/finance/__tests__/finance-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts
git commit -m "fix: drop only the malformed item when reading finance data"
```

---

### Task 2: Bài nhật ký được kiểm từng bài (đọc máy + nhập/tải xuống)

**Files:**
- Modify: `src/features/journal/journal-storage.ts` (toàn bộ file)
- Modify: `src/features/settings/data-transfer.ts:2,73-78`
- Create: `src/features/journal/__tests__/journal-storage.test.ts`
- Test: `src/features/settings/__tests__/data-transfer.test.ts`

**Interfaces:**
- Consumes: `safeArray` (Task 1).
- Produces: `parseJournalState(value: unknown): JournalState` (export mới của `journal-storage.ts`) — chỉ `id: number` bắt buộc; `text`/`time`/`date` thiếu hoặc sai kiểu → `""`, `words` → `0`, `mood` sai → `null`; `mood.score` được phép thiếu (bài viết trước commit a160fdb — `insights-calculations.ts` đã bỏ qua mood thiếu score). Field lạ ở cấp state (vd. `streak` cũ) bị bỏ. `parseImportPayload` dùng nó cho section `journal`.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/features/journal/__tests__/journal-storage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest"

import { DEFAULT_JOURNAL_STATE, JOURNAL_STORAGE_KEY, getStoredJournal, parseJournalState } from "../journal-storage"

const VALID = { id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }

describe("getStoredJournal", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("drops a null entry but keeps the valid ones", () => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify({ entries: [null, VALID] }))

    expect(getStoredJournal().entries).toEqual([VALID])
  })

  it("keeps an entry written before moods had a score", () => {
    const old = { ...VALID, mood: { emoji: "🙂", label: "Vui", tint: "#FFE0C7" } }
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify({ entries: [old] }))

    expect(getStoredJournal().entries).toEqual([old])
  })

  it("fills in missing fields of an entry instead of dropping it", () => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify({ entries: [{ id: 5, text: "Chỉ có chữ" }] }))

    expect(getStoredJournal().entries).toEqual([
      { id: 5, text: "Chỉ có chữ", time: "", date: "", words: 0, mood: null },
    ])
  })

  it("returns no entries when the stored entries field is not an array", () => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify({ entries: "hỏng" }))

    expect(getStoredJournal().entries).toEqual([])
  })

  it("drops fields that are no longer part of JournalState instead of carrying them forever", () => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify({ entries: [VALID], streak: 4 }))

    expect(getStoredJournal()).toEqual({ entries: [VALID] })
  })
})

describe("parseJournalState", () => {
  it("returns the default state for a value that is not an object", () => {
    expect(parseJournalState(null)).toEqual(DEFAULT_JOURNAL_STATE)
    expect(parseJournalState("x")).toEqual(DEFAULT_JOURNAL_STATE)
  })
})
```

Thêm vào cuối `describe("parseImportPayload", ...)` trong `src/features/settings/__tests__/data-transfer.test.ts`:

```ts
  it("drops a null journal entry from an imported backup, keeping the valid ones", () => {
    const entry = { id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }
    const raw = JSON.stringify({ version: EXPORT_VERSION, journal: { entries: [null, entry] } })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.journal.entries).toEqual([entry])
      expect(result.summary).toBe(
        "1 bài nhật ký · 0 lần mua vàng · 0 từ đã học · đã khôi phục tiết kiệm, nợ thẻ, mục tiêu"
      )
    }
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/journal/__tests__/journal-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts`
Expected: FAIL — `parseJournalState is not a function`; `expected [ null, { id: 1, … } ] to deeply equal [ { id: 1, … } ]`; bài thiếu field không được điền (`expected [ { id: 5, text: 'Chỉ có chữ' } ] to deeply equal [...]`); `expected 'hỏng' to deeply equal []`; field `streak` vẫn còn; test data-transfer mới giữ lại `null` (và summary báo `2 bài nhật ký`). Test "keeps an entry written before moods had a score" đã PASS sẵn — rào chắn để schema mới không làm rơi bài cũ.

- [ ] **Step 3: Viết lại `journal-storage.ts`**

Thay toàn bộ nội dung `src/features/journal/journal-storage.ts` bằng:

```ts
import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"
import { safeArray } from "@/lib/safe-array"
import type { JournalEntry } from "./types"

interface JournalState {
  entries: JournalEntry[]
}

const JOURNAL_STORAGE_KEY = "journal-entries"

const DEFAULT_JOURNAL_STATE: JournalState = {
  entries: [],
}

// Mood của bài viết trước commit a160fdb chưa có `score` — giữ nguyên là thiếu, không tự điền 3:
// insights-calculations đã bỏ qua mood thiếu score, điền vào sẽ đổi kết quả insight của bài cũ.
const moodSnapshotSchema = z.object({
  emoji: z.string(),
  label: z.string(),
  tint: z.string(),
  score: z.number().optional(),
})

// Chỉ `id` là bắt buộc (làm React key, và findOnThisDay lấy ngày viết từ id). Field khác thiếu
// hoặc sai kiểu thì điền mặc định thay vì bỏ cả bài — 1 bài nhật ký mất là không viết lại được.
// Phần tử không phải object (vd. null trong 1 file sao lưu sửa tay) thì bị bỏ riêng nó.
const journalEntrySchema = z.object({
  id: z.number(),
  text: z.string().catch(""),
  time: z.string().catch(""),
  date: z.string().catch(""),
  words: z.number().catch(0),
  mood: moodSnapshotSchema.nullable().catch(null),
})

// Dùng chung cho đọc localStorage và cho data-transfer.ts (nhập file / tải xuống từ cloud).
function parseJournalState(value: unknown): JournalState {
  const parsed = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
  // Kiểu suy ra từ schema chỉ khác JournalEntry ở mood.score (optional, xem ghi chú ở trên).
  return { entries: safeArray(journalEntrySchema, parsed.entries) as JournalEntry[] }
}

function getStoredJournal(): JournalState {
  try {
    const raw = window.localStorage.getItem(JOURNAL_STORAGE_KEY)
    if (!raw) return DEFAULT_JOURNAL_STATE
    return parseJournalState(JSON.parse(raw))
  } catch {
    return DEFAULT_JOURNAL_STATE
  }
}

function setStoredJournal(state: JournalState) {
  window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(state))
  notifyDataChanged()
}

export {
  JOURNAL_STORAGE_KEY,
  DEFAULT_JOURNAL_STATE,
  getStoredJournal,
  setStoredJournal,
  parseJournalState,
  type JournalState,
}
```

- [ ] **Step 4: `data-transfer.ts` dùng `parseJournalState`**

Dòng import journal (dòng 2) đổi thành:

```ts
import { parseJournalState, type JournalState } from "@/features/journal/journal-storage"
```

và thay khối

```ts
  const journalOverride = isObject(parsed.journal) ? parsed.journal : {}
  const journal: JournalState = {
    ...DEFAULT_JOURNAL_STATE,
    ...journalOverride,
    entries: ensureArray(journalOverride.entries, DEFAULT_JOURNAL_STATE.entries),
  }
```

bằng:

```ts
  // Cùng 1 bộ parse với getStoredJournal — 1 bài null trong file sửa tay chỉ bị bỏ riêng nó, thay
  // vì được lưu rồi làm sập /journal và /overview ở mọi lần mở sau.
  const journal: JournalState = parseJournalState(parsed.journal)
```

(`ensureArray` vẫn còn dùng cho settings — Task 3 mới xoá.)

- [ ] **Step 5: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/journal/__tests__/journal-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts src/features/journal/__tests__/hooks/use-journal.test.ts src/features/journal/__tests__/components/journal-view.test.tsx src/features/settings/__tests__/hooks/use-data-management.test.ts`
Expected: PASS toàn bộ

- [ ] **Step 6: Commit**

```bash
git add src/features/journal/journal-storage.ts src/features/settings/data-transfer.ts src/features/journal/__tests__/journal-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts
git commit -m "fix: validate journal entries one by one on read and on import"
```

---

### Task 3: Mood, tag, module được kiểm từng phần tử; module nhập vào được gộp

**Files:**
- Modify: `src/lib/settings-storage.ts:1,102-136,143-157`
- Modify: `src/features/settings/data-transfer.ts:6,50-52,90-110` (số dòng tính trên bản trước Task 2 — Task 2 làm lệch vài dòng, sửa theo nội dung nêu ở Step 4)
- Test: `src/lib/__tests__/settings-storage.test.ts`, `src/features/settings/__tests__/data-transfer.test.ts`

**Interfaces:**
- Consumes: `safeArray` (Task 1).
- Produces: `parseAppSettings(value: unknown): AppSettings` (export mới của `settings-storage.ts`), dùng ở `getStoredSettings` và `parseImportPayload`. `mergeModules` (không export) giờ nhận `Pick<ModuleToggle, "key" | "on">[]` (không còn `undefined`). `ensureArray` bị xoá khỏi `data-transfer.ts`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `describe("getStoredSettings", ...)` trong `src/lib/__tests__/settings-storage.test.ts` (`DEFAULT_MODULES`, `DEFAULT_TAGS`, `DEFAULT_SETTINGS`, `SETTINGS_STORAGE_KEY` đã import sẵn):

```ts
  it("drops a null mood instead of throwing away every stored setting", () => {
    const vui = DEFAULT_SETTINGS.moods[1]
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_SETTINGS,
        profile: { displayName: "Tùng", greeting: "Chào buổi sáng, Tùng" },
        moods: [null, vui],
      })
    )

    const settings = getStoredSettings()

    expect(settings.profile.displayName).toBe("Tùng")
    expect(settings.moods).toEqual([vui])
  })

  it("drops a null or label-less tag but keeps the valid ones", () => {
    const custom = { label: "Riêng", emoji: "✨", desc: "", tint: "#FFF0B8", on: true }
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, tags: [null, { emoji: "❓" }, custom] })
    )

    expect(getStoredSettings().tags).toEqual([custom])
  })

  it("keeps the profile and falls back to the default modules when modules is not an array", () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_SETTINGS,
        profile: { displayName: "Tùng", greeting: "Chào buổi sáng, Tùng" },
        modules: "x",
      })
    )

    const settings = getStoredSettings()

    expect(settings.profile.displayName).toBe("Tùng")
    expect(settings.modules).toEqual(DEFAULT_MODULES)
    expect(settings.tags).toEqual(DEFAULT_TAGS)
  })
```

Thêm vào cuối `describe("parseImportPayload", ...)` trong `src/features/settings/__tests__/data-transfer.test.ts`:

```ts
  it("drops null moods and tags from an imported backup instead of throwing", () => {
    const vui = DEFAULT_SETTINGS.moods[1]
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      settings: { ...DEFAULT_SETTINGS, moods: [null, vui], tags: [null] },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.settings.moods).toEqual([vui])
      expect(result.data.settings.tags).toEqual([])
    }
  })

  it("merges imported modules with the current module list, keeping only each one's on/off", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      settings: {
        modules: [
          { key: "taichinh", label: "Nhãn cũ", hint: "", on: false },
          { key: "chuoingay", label: "Chuỗi ngày", hint: "", on: true },
        ],
      },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.settings.modules).toEqual(
        DEFAULT_SETTINGS.modules.map((m) => (m.key === "taichinh" ? { ...m, on: false } : m))
      )
    }
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/lib/__tests__/settings-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts`
Expected: FAIL — `expected 'Tungnh2k1' to be 'Tùng'` (2 lần: 1 mood `null` và `modules: "x"` đều làm `getStoredSettings` ném lỗi rồi rơi về `DEFAULT_SETTINGS`, mất cả hồ sơ); tag `null`/thiếu label lọt qua (`expected [ null, { emoji: '❓' }, … ] to deeply equal [ … ]`); `TypeError: Cannot read properties of null (reading 'score')` ở test nhập; module nhập vào không được gộp (chỉ còn 2 phần tử, có cả `chuoingay`).

- [ ] **Step 3: Thêm bộ parse dùng chung vào `settings-storage.ts`**

Dòng đầu file `import { notifyDataChanged } from "./data-change-bus"` đổi thành:

```ts
import { z } from "zod"

import { notifyDataChanged } from "./data-change-bus"
import { safeArray } from "./safe-array"
```

Thay toàn bộ khối từ `function mergeModules(stored: ModuleToggle[] | undefined): ModuleToggle[] {` tới hết `function getStoredSettings(): AppSettings { ... }` bằng:

```ts
// Mọi phần tử mood/tag đi qua schema riêng: phần tử hỏng (vd. null trong 1 file sao lưu sửa tay)
// chỉ bị bỏ riêng nó — trước đây 1 mood null làm getStoredSettings ném lỗi rồi rơi về
// DEFAULT_SETTINGS (mất luôn hồ sơ, nhãn, module), còn 1 tag null lọt vào làm TagsCard sập.
// Field phụ thiếu thì điền mặc định; label/emoji là định danh nên bắt buộc.
const moodSchema: z.ZodType<Mood> = z.object({
  label: z.string(),
  emoji: z.string(),
  desc: z.string().catch(""),
  tint: z.string().catch(TINT_PALETTE[0]),
  on: z.boolean().catch(true),
  // Mood cũ lưu trước tính năng insight thiếu hẳn `score` — điền 3 (trung tính).
  score: z.number().catch(3),
})

const tagSchema: z.ZodType<BudgetTag> = z.object({
  label: z.string(),
  emoji: z.string(),
  desc: z.string().catch(""),
  tint: z.string().catch(TINT_PALETTE[0]),
  on: z.boolean().catch(true),
})

// mergeModules chỉ lấy key/on từ bản lưu — label/hint luôn theo DEFAULT_MODULES.
const storedModuleSchema = z.object({ key: z.string(), on: z.boolean() })

function mergeModules(stored: Pick<ModuleToggle, "key" | "on">[]): ModuleToggle[] {
  // label/hint luôn lấy từ DEFAULT_MODULES (nguồn) — chỉ "on" lấy từ storage.
  // Nếu lưu cả object storage sẽ giữ nguyên bản cũ mãi mãi mỗi khi thêm/sửa module mới,
  // người đang dùng không bao giờ thấy module mới (vd. "chuoingay") xuất hiện.
  return DEFAULT_MODULES.map((def) => {
    const hit = stored.find((m) => m.key === def.key)
    return hit ? { ...def, on: hit.on } : def
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

// Dùng chung cho đọc localStorage và cho data-transfer.ts (nhập file / tải xuống từ cloud), để 2
// đường vào luôn cùng 1 quy tắc — bản nhập vào không reload trang nên phải sạch ngay trong bộ nhớ.
// Chỉ đọc đúng các field của AppSettings hiện tại — field cũ đã xoá khỏi type (vd. "budget") tự
// rụng thay vì sống mãi trong storage.
function parseAppSettings(value: unknown): AppSettings {
  const parsed = isRecord(value) ? value : {}
  const rawProfile = isRecord(parsed.profile) ? parsed.profile : {}
  const profile: Profile = {
    displayName: typeof rawProfile.displayName === "string" ? rawProfile.displayName : DEFAULT_PROFILE.displayName,
    greeting: typeof rawProfile.greeting === "string" ? rawProfile.greeting : DEFAULT_PROFILE.greeting,
  }
  return {
    profile,
    moods: Array.isArray(parsed.moods) ? safeArray(moodSchema, parsed.moods) : DEFAULT_MOODS,
    modules: mergeModules(safeArray(storedModuleSchema, parsed.modules)),
    tags: Array.isArray(parsed.tags) ? safeArray(tagSchema, parsed.tags) : DEFAULT_TAGS,
    dismissedInsights: Array.isArray(parsed.dismissedInsights)
      ? parsed.dismissedInsights.filter((id): id is string => typeof id === "string")
      : [],
  }
}

function getStoredSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return parseAppSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_SETTINGS
  }
}
```

Trong khối `export { ... }` cuối file, thêm `parseAppSettings,` ngay sau `setStoredSettings,`.

- [ ] **Step 4: `data-transfer.ts` dùng `parseAppSettings`**

Dòng import settings (dòng 6) đổi thành:

```ts
import { parseAppSettings, type AppSettings } from "@/lib/settings-storage"
```

Xoá hàm `ensureArray` (giờ không còn chỗ dùng). Thay toàn bộ khối từ `const settingsOverride = isObject(parsed.settings) ? parsed.settings : {}` tới hết object `const settings: AppSettings = { ... }` (gồm cả `profileOverride`, khối comment, `rawMoods`, `moods` ở giữa) bằng:

```ts
  // Cùng 1 bộ parse với getStoredSettings (lọc từng mood/tag, gộp module theo DEFAULT_MODULES) —
  // bản nhập vào không reload trang, nên phải sạch ngay trong bộ nhớ chứ không đợi lần đọc sau.
  const settings: AppSettings = parseAppSettings(parsed.settings)
```

- [ ] **Step 5: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/lib/__tests__/settings-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts src/features/settings/__tests__/hooks/use-settings.test.ts src/features/settings/__tests__/hooks/use-data-management.test.ts src/features/settings/__tests__/components/settings-view.test.tsx src/app/api/sync/__tests__/route.test.ts "src/app/(app)/_components/__tests__/sidebar.test.tsx" src/features/overview/__tests__/components/overview-view.test.tsx`
Expected: PASS toàn bộ (kể cả "backfills a score of 3 for a mood saved before this feature existed", "keeps the user's own tags list untouched when it is a valid array", "drops legacy fields no longer part of AppSettings..." và "falls back to the default modules array instead of corrupting it when wrong-typed" sẵn có)

- [ ] **Step 6: Commit**

```bash
git add src/lib/settings-storage.ts src/features/settings/data-transfer.ts src/lib/__tests__/settings-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts
git commit -m "fix: validate moods, tags and modules one by one and merge imported modules"
```

---

### Task 4: Từ đã học được kiểm từng phần tử

**Files:**
- Modify: `src/features/study/study-storage.ts:1-4,82-91`
- Test: `src/features/study/__tests__/study-storage.test.ts`, `src/features/settings/__tests__/data-transfer.test.ts`

**Interfaces:**
- Consumes: `safeArray` (Task 1).
- Produces: `parseStudyState(...).learned` chỉ chứa chuỗi, không trùng, giữ thứ tự lần xuất hiện đầu (chữ ký không đổi). `tasks`, `gameHighScores`, `gameStreak` vẫn fallback cả field qua `safeField` như cũ.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `describe("getStoredStudy", ...)` trong `src/features/study/__tests__/study-storage.test.ts`:

```ts
  it("keeps valid learned ids and drops only a wrong-typed element (and duplicates)", () => {
    window.localStorage.setItem(
      STUDY_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_STUDY_STATE, learned: ["v-0001", null, "v-0002", "v-0001"] })
    )

    expect(getStoredStudy().learned).toEqual(["v-0001", "v-0002"])
  })
```

Thêm vào cuối `describe("parseImportPayload", ...)` trong `src/features/settings/__tests__/data-transfer.test.ts`:

```ts
  it("keeps the valid learned ids from an imported backup and drops only a wrong-typed one", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      study: { ...DEFAULT_STUDY_STATE, learned: ["v-0001", null, "v-0002"] },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.study.learned).toEqual(["v-0001", "v-0002"])
      expect(result.summary).toBe(
        "0 bài nhật ký · 0 lần mua vàng · 2 từ đã học · đã khôi phục tiết kiệm, nợ thẻ, mục tiêu"
      )
    }
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/study/__tests__/study-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts`
Expected: FAIL 2 test mới — `expected [] to deeply equal [ 'v-0001', 'v-0002' ]` (đọc máy và nhập file: 1 `null` kéo cả danh sách về `[]`)

- [ ] **Step 3: `study-storage.ts` lọc từng id**

Thêm import ngay sau dòng `import { notifyDataChanged } from "@/lib/data-change-bus"`:

```ts
import { safeArray } from "@/lib/safe-array"
```

Ngay trên `function parseStudyState(value: unknown): StudyState {`, thêm:

```ts
// learned là danh sách tích luỹ dài hạn (khác tasks có mặc định riêng) — lọc TỪNG phần tử qua
// safeArray: 1 phần tử sai kiểu chỉ bị bỏ riêng nó thay vì kéo cả danh sách về [] như safeField;
// id trùng được gộp, giữ thứ tự lần xuất hiện đầu.
function safeLearned(value: unknown): string[] {
  return [...new Set(safeArray(z.string(), value))]
}
```

và trong `parseStudyState` đổi dòng

```ts
    learned: safeField(z.array(z.string()), parsed.learned, DEFAULT_STUDY_STATE.learned),
```

thành

```ts
    learned: safeLearned(parsed.learned),
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/study/__tests__/study-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts src/features/study/__tests__/hooks/use-study.test.ts`
Expected: PASS toàn bộ (kể cả "keeps valid learned words even when tasks is malformed" sẵn có; `import { z } from "zod"` vẫn giữ — các schema còn dùng)

- [ ] **Step 5: Commit**

```bash
git add src/features/study/study-storage.ts src/features/study/__tests__/study-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts
git commit -m "fix: keep valid learned words when one stored id is malformed"
```

---

### Task 5: Dòng nội dung JSONL được kiểm field lúc build

**Files:**
- Modify: `src/features/study/content-loader.ts` (toàn bộ file)
- Test: `src/features/study/__tests__/content-loader.test.ts:1-20`

**Interfaces:**
- Consumes: không có gì từ task trước.
- Produces: `parseJsonl<T>(raw: string, filename: string, schema: z.ZodType<T>): T[]` — tham số `schema` mới, bắt buộc; `getVocab()`/`getGrammar()` giữ nguyên chữ ký. Dòng sai field ném `Error` `"<file>:<dòng>: dòng thiếu hoặc sai kiểu field <field> — <80 ký tự đầu dòng>"` — hỏng ngay ở test `getVocab`/`getGrammar` (đọc file thật) và lúc prerender `/study`, `/overview`, thay vì làm sập trang trên trình duyệt (theo Quyết định 3).

- [ ] **Step 1: Viết test thất bại**

Trong `src/features/study/__tests__/content-loader.test.ts`, thay phần đầu file (các dòng import và toàn bộ `describe("parseJsonl", ...)`) bằng đoạn dưới; 2 khối `describe("getVocab", ...)` và `describe("getGrammar", ...)` giữ nguyên:

```ts
import { describe, it, expect } from "vitest"
import { z } from "zod"

import { getGrammar, getVocab, parseJsonl } from "../content-loader"

const idSchema = z.object({ id: z.string() })

describe("parseJsonl", () => {
  it("parses every valid line into an object", () => {
    const result = parseJsonl('{"id":"a"}\n{"id":"b"}', "test.jsonl", idSchema)
    expect(result).toEqual([{ id: "a" }, { id: "b" }])
  })

  it("skips blank lines", () => {
    const result = parseJsonl('{"id":"a"}\n\n   \n{"id":"b"}', "test.jsonl", idSchema)
    expect(result).toEqual([{ id: "a" }, { id: "b" }])
  })

  it("throws an error naming the file and 1-indexed line number when a line is malformed", () => {
    const raw = '{"id":"a"}\nNOT JSON\n{"id":"c"}'
    expect(() => parseJsonl(raw, "vocabulary.jsonl", idSchema)).toThrow(/vocabulary\.jsonl:2/)
  })

  it("throws naming the file, line and field when a line is missing a required field", () => {
    const schema = z.object({ id: z.string(), word: z.string(), meaning: z.string(), addedAt: z.string() })
    // Dòng 2 gõ nhầm "Word" thay cho "word" — trước đây lọt qua build rồi làm sập /study, /overview.
    const raw =
      '{"id":"v-1","word":"a","meaning":"m","addedAt":"2026-01-01"}\n' +
      '{"id":"v-2","Word":"b","meaning":"m","addedAt":"2026-01-01"}'

    expect(() => parseJsonl(raw, "vocabulary.jsonl", schema)).toThrow(/vocabulary\.jsonl:2: .*word/)
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/study/__tests__/content-loader.test.ts`
Expected: FAIL 1 test mới — `expected [Function] to throw an error` (dòng thiếu `word` vẫn lọt qua). 3 test `parseJsonl` cũ đã đổi chữ ký vẫn PASS (tham số thừa bị bỏ qua lúc chạy).

- [ ] **Step 3: Viết lại `content-loader.ts`**

Thay toàn bộ nội dung `src/features/study/content-loader.ts` bằng:

```ts
import fs from "node:fs"
import path from "node:path"
import { z } from "zod"

import type { GrammarEntry, VocabEntry } from "./types"

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
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/study/__tests__/content-loader.test.ts`
Expected: PASS toàn bộ — các test `getVocab`/`getGrammar` đọc file thật xác nhận cả 333 dòng từ vựng và 38 dòng ngữ pháp hiện có đều qua schema (mọi field hiện có đều là chuỗi, `examples`/`translations` là mảng chuỗi).

- [ ] **Step 5: Commit**

```bash
git add src/features/study/content-loader.ts src/features/study/__tests__/content-loader.test.ts
git commit -m "fix: fail the build on a vocabulary or grammar line with a missing field"
```

---

### Task 6: Nạp bản sao không bao giờ dở dang, không bao giờ kẹt "Đang đồng bộ…"

**Files:**
- Modify: `src/features/settings/hooks/use-data-management.ts:3-17,69-88,121-140` (+ helper mới cấp module)
- Modify: `src/features/goals/car-goal-storage.ts` (chỉ khi dòng export còn thiếu `CAR_GOAL_FUND_KEY` — Plan 1a Task 6 đã thêm)
- Modify: `src/features/settings/data-transfer.ts` (khối `export { ... }` cuối file)
- Test: `src/features/settings/__tests__/hooks/use-data-management.test.ts`

**Interfaces:**
- Consumes: không có gì từ task trước (Task 2/3 đã làm `parseImportPayload` không còn ném lỗi với phần tử `null`).
- Produces: trong `useDataManagement` — `applySnapshot(data: ImportedSnapshot): void` (nội bộ, `useCallback`): chụp chuỗi thô của mọi key bị ghi, gọi lần lượt `onReplace*` + `setCarGoalFundName`, lỗi ở bất kỳ bước nào → trả mọi key về chuỗi cũ, `notifyDataChanged()` rồi ném lại. Hằng `RESTORE_WRITE_ERROR` (message banner). `importData` không bao giờ reject; `pullFromCloud` luôn tắt `syncing`. `data-transfer.ts` export thêm `type ImportedSnapshot`; `car-goal-storage.ts` export thêm `CAR_GOAL_FUND_KEY`. Task 8 dùng lại cả `applySnapshot` lẫn `RESTORE_WRITE_ERROR`.

- [ ] **Step 1: Viết test thất bại**

Trong `src/features/settings/__tests__/hooks/use-data-management.test.ts`:

1. Đổi 2 dòng import đầu:

```ts
import { DEFAULT_FINANCE_STATE, setStoredFinance } from "@/features/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE, setStoredJournal } from "@/features/journal/journal-storage"
```

thành

```ts
import { DEFAULT_FINANCE_STATE, FINANCE_STORAGE_KEY, setStoredFinance } from "@/features/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE, getStoredJournal, setStoredJournal } from "@/features/journal/journal-storage"
```

2. Ngay dưới dòng `import { pushSnapshot, pullSnapshot } from "../../api"`, thêm:

```ts
const WRITE_FAILED =
  "Không ghi được dữ liệu vào máy (bộ nhớ trình duyệt có thể đã đầy). Dữ liệu trên máy vẫn giữ nguyên như trước."

const LOCAL_JOURNAL = {
  entries: [{ id: 9, text: "Bài trên máy", time: "08:00", date: "01/08", words: 3, mood: null }],
}
```

3. Thêm 4 test ngay trước dòng `  describe("car-goal fund link", () => {`:

```ts
  it("importData reports an error instead of rejecting when the file cannot be read", async () => {
    const { result, onReplaceJournal } = renderDataManagement()
    const file = new File(["{}"], "backup.json", { type: "application/json" })
    Object.defineProperty(file, "text", { value: () => Promise.reject(new Error("NotReadableError")) })

    await act(async () => {
      await result.current.importData(file)
    })

    expect(result.current.imported).toEqual({ ok: false, error: "Không đọc được nội dung file." })
    expect(onReplaceJournal).not.toHaveBeenCalled()
  })

  it("importData puts every section back and reports an error when a write fails half-way through", async () => {
    setStoredJournal(LOCAL_JOURNAL)
    const { result, onReplaceJournal, onReplaceFinance, onReplaceStudy } = renderDataManagement()
    // Journal rồi finance ghi thật xuống storage, sau đó finance ném lỗi như khi localStorage hết dung
    // lượng giữa chừng. finance-data trước đó chưa có nên phải bị gỡ lại, không để lại bản dở dang.
    onReplaceJournal.mockImplementation((journal) => setStoredJournal(journal))
    onReplaceFinance.mockImplementation((finance) => {
      setStoredFinance(finance)
      throw new Error("QuotaExceededError")
    })
    const payload = {
      version: EXPORT_VERSION,
      journal: { entries: [{ id: 1, text: "Bài từ file", time: "09:00", date: "10/08", words: 3, mood: null }] },
    }
    const file = new File([JSON.stringify(payload)], "backup.json", { type: "application/json" })

    await act(async () => {
      await result.current.importData(file)
    })

    expect(getStoredJournal()).toEqual(LOCAL_JOURNAL)
    expect(window.localStorage.getItem(FINANCE_STORAGE_KEY)).toBeNull()
    expect(onReplaceStudy).not.toHaveBeenCalled()
    expect(result.current.imported).toEqual({ ok: false, error: WRITE_FAILED })
  })

  it("pullFromCloud clears 'syncing' and reports an error even when the request itself throws", async () => {
    const { result } = renderDataManagement()
    vi.mocked(pullSnapshot).mockRejectedValue(new Error("boom"))

    await act(async () => {
      await result.current.pullFromCloud("my-secret")
    })

    expect(result.current.syncing).toBe(false)
    expect(result.current.syncResult).toEqual({ ok: false, error: "Không kết nối được máy chủ đồng bộ." })
  })

  it("pullFromCloud puts every section back, reports an error and stops syncing when a write fails half-way through", async () => {
    setStoredJournal(LOCAL_JOURNAL)
    const { result, onReplaceJournal, onReplaceFinance } = renderDataManagement()
    onReplaceJournal.mockImplementation((journal) => setStoredJournal(journal))
    onReplaceFinance.mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    vi.mocked(pullSnapshot).mockResolvedValue({
      ok: true,
      data: {
        journal: { entries: [{ id: 1, text: "Bài từ cloud", time: "09:00", date: "10/08", words: 3, mood: null }] },
        finance: DEFAULT_FINANCE_STATE,
        study: DEFAULT_STUDY_STATE,
        settings: DEFAULT_SETTINGS,
        budget: DEFAULT_BUDGET_STATE,
        netWorthHistory: DEFAULT_NET_WORTH_HISTORY,
      },
      summary: "1 bài nhật ký",
    })

    await act(async () => {
      await result.current.pullFromCloud("my-secret")
    })

    expect(getStoredJournal()).toEqual(LOCAL_JOURNAL)
    expect(result.current.syncResult).toEqual({ ok: false, error: WRITE_FAILED })
    expect(result.current.syncing).toBe(false)
  })

```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/settings/__tests__/hooks/use-data-management.test.ts`
Expected: FAIL 4 test mới — lần lượt `Error: NotReadableError`, `Error: QuotaExceededError`, `Error: boom`, `Error: QuotaExceededError` (promise của `importData`/`pullFromCloud` bị reject, không có banner nào, `syncing` không được tắt). Các test cũ vẫn PASS.

- [ ] **Step 3: Export key và type cần dùng**

Plan 1a (Task 6) đã export `CAR_GOAL_FUND_KEY`. Kiểm tra dòng export cuối `src/features/goals/car-goal-storage.ts` đúng là dòng dưới; nếu còn thiếu `CAR_GOAL_FUND_KEY` thì đổi thành:

```ts
export { CAR_GOAL_FUND_KEY, getCarGoalFundName, setCarGoalFundName }
```

Trong `src/features/settings/data-transfer.ts`, thêm `type ImportedSnapshot,` vào khối `export { ... }` cuối file, ngay sau `type ImportResult,`.

- [ ] **Step 4: `useDataManagement` ghi kiểu "tất cả hoặc không gì"**

Trong `src/features/settings/hooks/use-data-management.ts` (giữ mọi import/logic khác mà Plan 1a đã thêm):

1. Thay khối import từ `import { getStoredFinance, type FinanceState } ...` tới hết `import { buildExportPayload, exportFileName, parseImportPayload } from "../data-transfer"` bằng:

```ts
import { FINANCE_STORAGE_KEY, getStoredFinance, type FinanceState } from "@/features/finance/finance-storage"
import {
  DEFAULT_JOURNAL_STATE,
  JOURNAL_STORAGE_KEY,
  getStoredJournal,
  type JournalState,
} from "@/features/journal/journal-storage"
import { DEFAULT_STUDY_STATE, STUDY_STORAGE_KEY, getStoredStudy, type StudyState } from "@/features/study/study-storage"
import { BUDGET_STORAGE_KEY, DEFAULT_BUDGET_STATE, getStoredBudget, type BudgetState } from "@/features/budget/budget-storage"
import {
  DEFAULT_NET_WORTH_HISTORY,
  NET_WORTH_HISTORY_KEY,
  getStoredNetWorthHistory,
  type NetWorthHistory,
} from "@/features/overview/net-worth-history-storage"
import { CAR_GOAL_FUND_KEY, getCarGoalFundName, setCarGoalFundName } from "@/features/goals/car-goal-storage"
import { notifyDataChanged } from "@/lib/data-change-bus"
import { SETTINGS_STORAGE_KEY, getStoredSettings, type AppSettings } from "@/lib/settings-storage"
import { pushSnapshot, pullSnapshot } from "../api"
import { buildExportPayload, exportFileName, parseImportPayload, type ImportedSnapshot } from "../data-transfer"
```

2. Ngay sau `interface UseDataManagementOptions { ... }` (trước `function useDataManagement(`), thêm:

```ts
// Mọi key mà 1 lần nạp bản sao ghi đè — chụp lại chuỗi thô trước khi ghi để trả về nguyên trạng
// nếu 1 lần ghi giữa chừng lỗi (vd. hết dung lượng localStorage), thay vì để máy nửa cũ nửa mới.
const RESTORE_KEYS = [
  JOURNAL_STORAGE_KEY,
  FINANCE_STORAGE_KEY,
  STUDY_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  BUDGET_STORAGE_KEY,
  NET_WORTH_HISTORY_KEY,
  CAR_GOAL_FUND_KEY,
]

const RESTORE_WRITE_ERROR =
  "Không ghi được dữ liệu vào máy (bộ nhớ trình duyệt có thể đã đầy). Dữ liệu trên máy vẫn giữ nguyên như trước."

function readRawBackup(): Map<string, string | null> {
  const backup = new Map<string, string | null>()
  for (const key of RESTORE_KEYS) {
    try {
      backup.set(key, window.localStorage.getItem(key))
    } catch {
      // Không đọc được key này thì cũng không ghi đè lại nó lúc khôi phục.
    }
  }
  return backup
}

// Trả từng key về đúng chuỗi thô trước khi nạp, rồi báo 1 lần để mọi hook đang mở đọc lại storage
// (Plan 1a) — kể cả những phần đã kịp setState bản mới trước khi lần ghi kế tiếp lỗi.
function restoreRawBackup(backup: Map<string, string | null>) {
  backup.forEach((raw, key) => {
    try {
      if (raw === null) window.localStorage.removeItem(key)
      else window.localStorage.setItem(key, raw)
    } catch {
      // Ghi lại bản cũ cũng lỗi thì không còn cách nào khác — để nguyên key đó.
    }
  })
  notifyDataChanged()
}
```

3. Trong thân `useDataManagement`, ngay sau dòng `const [syncResult, setSyncResult] = useState<SyncResult | null>(null)`, thêm:

```ts
  const applySnapshot = useCallback(
    (data: ImportedSnapshot) => {
      const backup = readRawBackup()
      try {
        onReplaceJournal(data.journal)
        onReplaceFinance(data.finance)
        onReplaceStudy(data.study)
        onReplaceSettings(data.settings)
        onReplaceBudget(data.budget)
        onReplaceNetWorthHistory(data.netWorthHistory)
        if (data.goals) setCarGoalFundName(data.goals.carFundName)
      } catch (error) {
        restoreRawBackup(backup)
        throw error
      }
    },
    [onReplaceJournal, onReplaceFinance, onReplaceStudy, onReplaceSettings, onReplaceBudget, onReplaceNetWorthHistory]
  )
```

4. Thay nguyên `const pullFromCloud = useCallback(...)` bằng:

```ts
  const pullFromCloud = useCallback(
    async (secret: string) => {
      setSyncing(true)
      try {
        const result = await pullSnapshot(secret)
        if (!result.ok) {
          setSyncResult({ ok: false, error: result.error })
          return
        }
        try {
          applySnapshot(result.data)
        } catch {
          setSyncResult({ ok: false, error: RESTORE_WRITE_ERROR })
          return
        }
        setSyncResult({ ok: true, summary: result.summary })
      } catch {
        setSyncResult({ ok: false, error: "Không kết nối được máy chủ đồng bộ." })
      } finally {
        setSyncing(false)
      }
    },
    [applySnapshot]
  )
```

5. Thay nguyên `const importData = useCallback(...)` bằng:

```ts
  const importData = useCallback(
    async (file: File) => {
      setExported(null)
      const raw = await file.text().catch(() => null)
      if (raw === null) {
        setImported({ ok: false, error: "Không đọc được nội dung file." })
        return
      }
      const result = parseImportPayload(raw)
      if (!result.ok) {
        setImported({ ok: false, error: result.error })
        return
      }
      try {
        applySnapshot(result.data)
      } catch {
        setImported({ ok: false, error: RESTORE_WRITE_ERROR })
        return
      }
      setImported({ ok: true, file: file.name, summary: result.summary })
    },
    [applySnapshot]
  )
```

(`setExported(null)` chuyển lên đầu — trước đây chạy ở cuối cho mọi nhánh, kết quả như nhau.)

- [ ] **Step 5: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/settings/__tests__/hooks/use-data-management.test.ts src/features/settings/__tests__/components/settings-view.test.tsx src/features/settings/__tests__/data-transfer.test.ts`
Expected: PASS toàn bộ (mọi test nhập/tải xuống cũ vẫn xanh — hành vi khi ghi thành công không đổi)

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/hooks/use-data-management.ts src/features/goals/car-goal-storage.ts src/features/settings/data-transfer.ts src/features/settings/__tests__/hooks/use-data-management.test.ts
git commit -m "fix: roll back a half-applied restore and never leave sync stuck"
```

---

### Task 7: Ô khối lượng vàng chỉ nhận số hữu hạn

**Files:**
- Modify: `src/features/finance/components/add-gold-form.tsx:38-40,81`
- Modify: `src/features/finance/components/edit-gold-purchase-modal.tsx:39`
- Test: `src/features/finance/__tests__/components/gold-tab.test.tsx`, `src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước (Task 1 đã làm 1 purchase hỏng chỉ mất riêng nó — task này chặn không cho tạo ra nó từ UI).
- Produces: biến cục bộ `phanValid = Number.isFinite(Number(phan)) && Number(phan) > 0` ở cả 2 form (Plan 6a `area-finance-logic#9` sửa tiếp ô phân trên nền này).

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `describe("GoldTab", ...)` trong `src/features/finance/__tests__/components/gold-tab.test.tsx` (`SJC`, `ZERO_SUMMARY`, `noopHandlers` đã có sẵn ở đầu file):

```tsx
  it("keeps the add-purchase Thêm button disabled when khối lượng is not a finite number", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[]} {...noopHandlers} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua vàng" }))
    fireEvent.click(screen.getByRole("button", { name: "SJC" }))
    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), {
      target: { value: "10/08/2026" },
    })
    fireEvent.change(screen.getByLabelText("Giá mua (mỗi phân)", { exact: false }), {
      target: { value: "900000" },
    })
    // Number("1e400") = Infinity: vẫn > 0, nhưng JSON lưu thành null và lần đọc sau purchase biến mất.
    fireEvent.change(screen.getByLabelText("Khối lượng (phân)", { exact: false }), {
      target: { value: "1e400" },
    })

    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
  })
```

Thêm vào cuối `describe("EditGoldPurchaseModal", ...)` trong `src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx` (`PURCHASE`, `STORES` đã có sẵn):

```tsx
  it("disables Lưu when khối lượng is not a finite number", () => {
    render(<EditGoldPurchaseModal purchase={PURCHASE} stores={STORES} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Khối lượng", { exact: false }), { target: { value: "1e400" } })
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Khối lượng", { exact: false }), { target: { value: "Infinity" } })
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/components/gold-tab.test.tsx src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx`
Expected: FAIL 2 test mới — `Received element is not disabled: <button ...>Thêm</button>` và `... >Lưu</button>`

- [ ] **Step 3: Chỉ nhận khối lượng hữu hạn**

Trong `src/features/finance/components/add-gold-form.tsx`, ngay trước `return (` của nhánh form đang mở (ngay sau khối `if (!open) { ... }`), thêm:

```tsx
  // Number("1e400") = Infinity vẫn > 0, nhưng JSON.stringify lưu nó thành null và lần đọc sau purchase
  // bị bỏ — chỉ nhận số hữu hạn.
  const phanValid = Number.isFinite(Number(phan)) && Number(phan) > 0
```

và đổi

```tsx
          disabled={!date.trim() || !(Number(phan) > 0) || !buy.trim() || !store}
```

thành

```tsx
          disabled={!date.trim() || !phanValid || !buy.trim() || !store}
```

Trong `src/features/finance/components/edit-gold-purchase-modal.tsx`, thay dòng

```tsx
  const disabled = !date.trim() || !(Number(phan) > 0) || !buy.trim() || !store
```

bằng

```tsx
  // Number("1e400") = Infinity vẫn > 0, nhưng JSON.stringify lưu nó thành null và lần đọc sau purchase
  // bị bỏ — chỉ nhận số hữu hạn.
  const phanValid = Number.isFinite(Number(phan)) && Number(phan) > 0
  const disabled = !date.trim() || !phanValid || !buy.trim() || !store
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/components/gold-tab.test.tsx src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx`
Expected: PASS toàn bộ (kể cả "keeps the add-purchase Thêm button disabled when khối lượng is zero or negative" và "disables Lưu when khối lượng is zero or negative" sẵn có)

- [ ] **Step 5: Dừng cho chủ repo bấm thử, rồi commit**

Task này đổi thao tác trên form — chưa commit. Báo chủ repo chạy mục **A.5** ở "Kiểm tra tay" (Task 10); khi chủ repo xác nhận đúng mới chạy:

```bash
git add src/features/finance/components/add-gold-form.tsx src/features/finance/components/edit-gold-purchase-modal.tsx src/features/finance/__tests__/components/gold-tab.test.tsx src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx
git commit -m "fix: reject a non-finite gold weight in the purchase forms"
```

---

### Task 8: Hỏi lại trước khi "Nhập từ file"/"Tải xuống" thay dữ liệu trên máy

Theo Quyết định 1 (phương án B). Nếu chủ repo chọn A thì bỏ nguyên task này.

**Files:**
- Modify: `src/features/settings/data-transfer.ts` (bản sau Task 2, 3, 6: khai báo `type ImportResult`, dòng `return` cuối `parseImportPayload`, ngay sau `uploadedSummary`, khối `export { ... }`)
- Modify: `src/features/settings/hooks/use-data-management.ts` (sau Task 6)
- Modify: `src/features/settings/components/data-card.tsx:3-51,231-234`
- Modify: `src/features/settings/components/settings-view.tsx:34-51,80-89`
- Test: `src/features/settings/__tests__/data-transfer.test.ts`, `src/features/settings/__tests__/hooks/use-data-management.test.ts`, `src/features/settings/__tests__/components/data-card.test.tsx`, `src/features/settings/__tests__/components/settings-view.test.tsx`

**Interfaces:**
- Consumes: `applySnapshot`, `RESTORE_WRITE_ERROR`, `type ImportedSnapshot` (Task 6).
- Produces: `ImportResult` nhánh ok có thêm `exportedAt: string | null`; `restoreCounts(snapshot: ImportedSnapshot): string` (export mới của `data-transfer.ts`). Trong `useDataManagement`: `type PendingRestore` (export), state `pendingRestore: PendingRestore | null`, `confirmRestore(): void`, `cancelRestore(): void`; `importData`/`pullFromCloud` chỉ xếp hàng, không ghi. `DataCard` có 3 prop mới bắt buộc `pendingRestore`, `onConfirmRestore`, `onCancelRestore`. Task 9 thêm test vào `data-card.test.tsx` với `BASE_PROPS` đã có 3 prop này.

```ts
type PendingRestore = {
  data: ImportedSnapshot
  summary: string
  exportedAt: string | null
  incomingCounts: string
  localCounts: string
} & ({ source: "file"; fileName: string } | { source: "cloud" })
```

- [ ] **Step 1: Viết test thất bại — `data-transfer`**

Trong `src/features/settings/__tests__/data-transfer.test.ts`, đổi khối import `from "../data-transfer"` thành:

```ts
import {
  EXPORT_VERSION,
  buildExportPayload,
  exportFileName,
  parseImportPayload,
  restoreCounts,
} from "../data-transfer"
```

Thêm vào cuối `describe("parseImportPayload", ...)`:

```ts
  it("returns the file's exportedAt so the confirm dialog can show how old the copy is", () => {
    const result = parseImportPayload(
      JSON.stringify({ version: EXPORT_VERSION, exportedAt: "2026-09-20T02:00:00.000Z" })
    )

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.exportedAt).toBe("2026-09-20T02:00:00.000Z")
  })

  it("returns a null exportedAt when a hand-made file has none or a non-string one", () => {
    for (const exportedAt of [undefined, 123]) {
      const result = parseImportPayload(JSON.stringify({ version: EXPORT_VERSION, exportedAt }))

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.exportedAt).toBeNull()
    }
  })
```

Thêm 1 khối mới ở cuối file:

```ts
describe("restoreCounts", () => {
  it("lists journal entries, expenses, savings funds, gold purchases and learned words", () => {
    const result = parseImportPayload(
      JSON.stringify({
        version: EXPORT_VERSION,
        journal: { entries: [{ id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }] },
        budget: {
          expenses: [
            { id: 1, dayKey: "2026-09-01", amount: 50_000, tag: null },
            { id: 2, dayKey: "2026-09-02", amount: 10_000, tag: null },
          ],
        },
        finance: { savings: [{ name: "Quỹ A", amount: 1, target: 2 }] },
        study: { ...DEFAULT_STUDY_STATE, learned: ["v-1", "v-2", "v-3"] },
      })
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(restoreCounts(result.data)).toBe(
        "1 bài nhật ký · 2 khoản chi · 1 quỹ tiết kiệm · 0 lần mua vàng · 3 từ đã học"
      )
    }
  })
})
```

- [ ] **Step 2: Viết test thất bại — `useDataManagement`**

Trong `src/features/settings/__tests__/hooks/use-data-management.test.ts`:

1. Ngay sau hàm `renderDataManagement() { ... }`, thêm:

```ts
type DataManagementResult = ReturnType<typeof renderDataManagement>["result"]

// Nạp bản sao giờ gồm 2 bước: đọc + parse (xếp vào pendingRestore), rồi người dùng xác nhận.
async function importAndConfirm(result: DataManagementResult, file: File) {
  await act(async () => {
    await result.current.importData(file)
  })
  act(() => {
    result.current.confirmRestore()
  })
}

async function pullAndConfirm(result: DataManagementResult, secret: string) {
  await act(async () => {
    await result.current.pullFromCloud(secret)
  })
  act(() => {
    result.current.confirmRestore()
  })
}
```

2. Thay nguyên test `"importData reports the restored data to each domain's replace callback"` bằng 2 test:

```ts
  it("importData stages a valid backup and replaces nothing until confirmRestore", async () => {
    setStoredJournal(LOCAL_JOURNAL)
    const {
      result,
      onReplaceJournal,
      onReplaceFinance,
      onReplaceStudy,
      onReplaceSettings,
      onReplaceBudget,
      onReplaceNetWorthHistory,
    } = renderDataManagement()

    const journal = {
      entries: [{ id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }],
    }
    const finance = { ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 1, target: 2 }] }
    const settings = { ...DEFAULT_SETTINGS, profile: { ...DEFAULT_SETTINGS.profile, displayName: "Khôi phục" } }
    const budget = { ...DEFAULT_BUDGET_STATE, salaries: [{ month: "2026-09", amount: 20_000_000 }] }
    const netWorthHistory = [{ date: "2026-09-01", net: 1_000_000, savingsTotal: 500_000 }]
    const payload = {
      version: EXPORT_VERSION,
      exportedAt: "2026-09-20T02:00:00.000Z",
      journal,
      finance,
      study: DEFAULT_STUDY_STATE,
      settings,
      budget,
      netWorthHistory,
    }
    const file = new File([JSON.stringify(payload)], "backup.json", { type: "application/json" })

    await act(async () => {
      await result.current.importData(file)
    })

    expect(onReplaceJournal).not.toHaveBeenCalled()
    expect(result.current.imported).toBeNull()
    expect(result.current.pendingRestore).toMatchObject({
      source: "file",
      fileName: "backup.json",
      exportedAt: "2026-09-20T02:00:00.000Z",
      incomingCounts: "1 bài nhật ký · 0 khoản chi · 1 quỹ tiết kiệm · 0 lần mua vàng · 0 từ đã học",
      localCounts: "1 bài nhật ký · 0 khoản chi · 0 quỹ tiết kiệm · 0 lần mua vàng · 0 từ đã học",
    })

    act(() => {
      result.current.confirmRestore()
    })

    expect(onReplaceJournal).toHaveBeenCalledWith(journal)
    expect(onReplaceFinance).toHaveBeenCalledWith(finance)
    expect(onReplaceStudy).toHaveBeenCalledWith(DEFAULT_STUDY_STATE)
    expect(onReplaceSettings).toHaveBeenCalledWith(settings)
    expect(onReplaceBudget).toHaveBeenCalledWith(budget)
    expect(onReplaceNetWorthHistory).toHaveBeenCalledWith(netWorthHistory)
    expect(result.current.pendingRestore).toBeNull()
    expect(result.current.imported).toEqual({
      ok: true,
      file: "backup.json",
      summary: expect.stringContaining("bài nhật ký"),
    })
  })

  it("cancelRestore drops the staged backup without writing anything", async () => {
    const { result, onReplaceJournal } = renderDataManagement()
    const file = new File([JSON.stringify({ version: EXPORT_VERSION })], "backup.json", { type: "application/json" })

    await act(async () => {
      await result.current.importData(file)
    })
    act(() => {
      result.current.cancelRestore()
    })

    expect(result.current.pendingRestore).toBeNull()
    expect(onReplaceJournal).not.toHaveBeenCalled()
    expect(result.current.imported).toBeNull()
  })
```

3. Trong test `"importData puts every section back and reports an error when a write fails half-way through"` (Task 6), thay khối

```ts
    await act(async () => {
      await result.current.importData(file)
    })
```

bằng

```ts
    await importAndConfirm(result, file)
```

4. Thay nguyên test `"pullFromCloud reports the restored data to each domain's replace callback"` bằng:

```ts
  it("pullFromCloud stages the cloud snapshot; confirmRestore applies it and reports the summary", async () => {
    const {
      result,
      onReplaceJournal,
      onReplaceFinance,
      onReplaceStudy,
      onReplaceSettings,
      onReplaceBudget,
      onReplaceNetWorthHistory,
    } = renderDataManagement()

    const journal = {
      entries: [{ id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }],
    }
    const budget = { ...DEFAULT_BUDGET_STATE, salaries: [{ month: "2026-09", amount: 20_000_000 }] }
    const netWorthHistory = [{ date: "2026-09-01", net: 1_000_000, savingsTotal: 500_000 }]
    vi.mocked(pullSnapshot).mockResolvedValue({
      ok: true,
      data: {
        journal,
        finance: DEFAULT_FINANCE_STATE,
        study: DEFAULT_STUDY_STATE,
        settings: DEFAULT_SETTINGS,
        budget,
        netWorthHistory,
      },
      summary: "5 bài nhật ký",
      exportedAt: "2026-09-20T02:00:00.000Z",
    })

    await act(async () => {
      await result.current.pullFromCloud("my-secret")
    })

    expect(pullSnapshot).toHaveBeenCalledWith("my-secret")
    expect(onReplaceJournal).not.toHaveBeenCalled()
    expect(result.current.syncing).toBe(false)
    expect(result.current.pendingRestore).toMatchObject({ source: "cloud", exportedAt: "2026-09-20T02:00:00.000Z" })

    act(() => {
      result.current.confirmRestore()
    })

    expect(onReplaceJournal).toHaveBeenCalledWith(journal)
    expect(onReplaceFinance).toHaveBeenCalledWith(DEFAULT_FINANCE_STATE)
    expect(onReplaceStudy).toHaveBeenCalledWith(DEFAULT_STUDY_STATE)
    expect(onReplaceSettings).toHaveBeenCalledWith(DEFAULT_SETTINGS)
    expect(onReplaceBudget).toHaveBeenCalledWith(budget)
    expect(onReplaceNetWorthHistory).toHaveBeenCalledWith(netWorthHistory)
    expect(result.current.syncResult).toEqual({ ok: true, summary: "5 bài nhật ký" })
  })

  it("writes nothing when the settings page is left before the cloud answers", async () => {
    let resolvePull!: (value: Awaited<ReturnType<typeof pullSnapshot>>) => void
    vi.mocked(pullSnapshot).mockReturnValue(new Promise((resolve) => (resolvePull = resolve)))
    const onReplaceJournal = vi.fn()
    const { result, unmount } = renderHook(() =>
      useDataManagement({
        onReplaceJournal,
        onReplaceFinance: vi.fn(),
        onReplaceStudy: vi.fn(),
        onReplaceSettings: vi.fn(),
        onReplaceBudget: vi.fn(),
        onReplaceNetWorthHistory: vi.fn(),
      })
    )

    let pending!: Promise<void>
    act(() => {
      pending = result.current.pullFromCloud("my-secret")
    })
    unmount()
    await act(async () => {
      resolvePull({
        ok: true,
        data: {
          journal: DEFAULT_JOURNAL_STATE,
          finance: DEFAULT_FINANCE_STATE,
          study: DEFAULT_STUDY_STATE,
          settings: DEFAULT_SETTINGS,
          budget: DEFAULT_BUDGET_STATE,
          netWorthHistory: DEFAULT_NET_WORTH_HISTORY,
        },
        summary: "ok",
        exportedAt: null,
      })
      await pending
    })

    expect(onReplaceJournal).not.toHaveBeenCalled()
  })
```

5. Trong test `"pullFromCloud puts every section back, reports an error and stops syncing when a write fails half-way through"` (Task 6): thêm `exportedAt: null,` ngay dưới dòng `summary: "1 bài nhật ký",` của mock, và thay khối

```ts
    await act(async () => {
      await result.current.pullFromCloud("my-secret")
    })
```

bằng

```ts
    await pullAndConfirm(result, "my-secret")
```

6. Trong `describe("car-goal fund link", ...)`:
   - 3 test `"importData restores the link from a backup that has a goals section"`, `"importData clears the link when the backup explicitly has no fund chosen"`, `"importData keeps this device's link when the backup predates the goals section"`: thay khối `await act(async () => { await result.current.importData(backupFile(...)) })` bằng `await importAndConfirm(result, backupFile(...))` (giữ nguyên đối số `backupFile(...)` của từng test).
   - 3 test `"pullFromCloud restores the link from the cloud snapshot"`, `"pullFromCloud clears the link when the cloud snapshot explicitly has no fund chosen"`, `"pullFromCloud keeps this device's link when the cloud snapshot predates the goals section"`: thêm `exportedAt: null,` ngay dưới dòng `summary: "ok",` của mock, và thay khối `await act(async () => { await result.current.pullFromCloud("my-secret") })` bằng `await pullAndConfirm(result, "my-secret")`.
   - `"pullFromCloud leaves the link untouched when the pull fails"` giữ nguyên.

- [ ] **Step 3: Viết test thất bại — `DataCard` và `SettingsView`**

Trong `src/features/settings/__tests__/components/data-card.test.tsx`:

1. Thay khối import và `BASE_PROPS` ở đầu file (tới trước `describe("DataCard", ...)`) bằng:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import { DEFAULT_BUDGET_STATE } from "@/features/budget/budget-storage"
import { DEFAULT_FINANCE_STATE } from "@/features/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE } from "@/features/journal/journal-storage"
import { DEFAULT_STUDY_STATE } from "@/features/study/study-storage"
import { DEFAULT_NET_WORTH_HISTORY } from "@/features/overview/net-worth-history-storage"
import { DEFAULT_SETTINGS } from "@/lib/settings-storage"
import { setSyncSecret } from "@/lib/sync-secret-storage"
import type { PendingRestore } from "../../hooks/use-data-management"
import { setAutoBackupStatus } from "../../auto-backup-storage"
import { DataCard } from "../../components/data-card"

const BASE_PROPS = {
  exported: null,
  imported: null,
  syncing: false,
  syncResult: null,
  pendingRestore: null,
  onExport: vi.fn(),
  onImport: vi.fn(),
  onPushToCloud: vi.fn(),
  onPullFromCloud: vi.fn(),
  onConfirmRestore: vi.fn(),
  onCancelRestore: vi.fn(),
}

const PENDING_CLOUD_RESTORE: PendingRestore = {
  source: "cloud",
  data: {
    journal: DEFAULT_JOURNAL_STATE,
    finance: DEFAULT_FINANCE_STATE,
    study: DEFAULT_STUDY_STATE,
    settings: DEFAULT_SETTINGS,
    budget: DEFAULT_BUDGET_STATE,
    netWorthHistory: DEFAULT_NET_WORTH_HISTORY,
  },
  summary: "0 bài nhật ký",
  exportedAt: new Date(2026, 7, 14, 9, 5).toISOString(),
  incomingCounts: "3 bài nhật ký · 0 khoản chi · 1 quỹ tiết kiệm · 0 lần mua vàng · 0 từ đã học",
  localCounts: "5 bài nhật ký · 2 khoản chi · 1 quỹ tiết kiệm · 0 lần mua vàng · 0 từ đã học",
}
```

2. Thêm vào cuối `describe("DataCard", ...)`:

```tsx
  it("asks before replacing this device's data, showing when the incoming copy was made and both sets of counts", () => {
    render(<DataCard {...BASE_PROPS} pendingRestore={PENDING_CLOUD_RESTORE} />)

    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByText("Thay dữ liệu trên máy này?")).toBeInTheDocument()
    expect(within(dialog).getByText("Bản trên đám mây được tạo lúc", { exact: false })).toBeInTheDocument()
    expect(within(dialog).getByText("09:05 ngày 14/08/2026")).toBeInTheDocument()
    expect(within(dialog).getByText("Bản sắp nạp: 3 bài nhật ký", { exact: false })).toBeInTheDocument()
    expect(within(dialog).getByText("Trên máy này: 5 bài nhật ký", { exact: false })).toBeInTheDocument()
  })

  it("names the file and says the time is unknown when a hand-made backup has no exportedAt", () => {
    render(
      <DataCard
        {...BASE_PROPS}
        pendingRestore={{ ...PENDING_CLOUD_RESTORE, source: "file", fileName: "backup.json", exportedAt: null }}
      />
    )

    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByText("File backup.json được tạo lúc", { exact: false })).toBeInTheDocument()
    expect(within(dialog).getByText("không rõ thời điểm")).toBeInTheDocument()
  })

  it("calls onConfirmRestore from 'Thay dữ liệu' and onCancelRestore from 'Huỷ'", () => {
    const onConfirmRestore = vi.fn()
    const onCancelRestore = vi.fn()
    const { rerender } = render(
      <DataCard
        {...BASE_PROPS}
        pendingRestore={PENDING_CLOUD_RESTORE}
        onConfirmRestore={onConfirmRestore}
        onCancelRestore={onCancelRestore}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))
    expect(onCancelRestore).toHaveBeenCalledTimes(1)
    expect(onConfirmRestore).not.toHaveBeenCalled()

    rerender(
      <DataCard
        {...BASE_PROPS}
        pendingRestore={{ ...PENDING_CLOUD_RESTORE }}
        onConfirmRestore={onConfirmRestore}
        onCancelRestore={onCancelRestore}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Thay dữ liệu" }))
    expect(onConfirmRestore).toHaveBeenCalledTimes(1)
  })

  it("shows no confirm dialog while nothing is waiting to be restored", () => {
    render(<DataCard {...BASE_PROPS} />)

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })
```

Trong `src/features/settings/__tests__/components/settings-view.test.tsx`:

1. Dòng import RTL đổi thành `import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"`.
2. Trong test `"restores settings from an imported backup and shows the success banner"`, chèn giữa dòng `fireEvent.change(input, { target: { files: [file] } })` và dòng `expect(await screen.findByText("Đã nạp backup.json", ...))`:

```tsx
    // Chưa ghi gì cho tới khi xác nhận trong hộp thoại.
    const dialog = await screen.findByRole("alertdialog")
    expect(getStoredSettings().profile.displayName).toBe("Tungnh2k1")
    fireEvent.click(within(dialog).getByRole("button", { name: "Thay dữ liệu" }))
```

   và thêm ngay sau dòng `expect(await screen.findByText("Đã nạp backup.json", ...)).toBeInTheDocument()`:

```tsx
    expect(getStoredSettings().profile.displayName).toBe("Khôi phục")
```

3. Thêm test mới ngay sau test đó:

```tsx
  it("keeps this device's data when the restore is cancelled", async () => {
    render(<SettingsView />)
    await waitFor(() => expect(screen.getByText("Module hiển thị")).toBeInTheDocument())

    const payload = {
      version: EXPORT_VERSION,
      settings: { profile: { displayName: "Khôi phục", greeting: "Chào buổi sáng, Khôi phục" } },
    }
    const file = new File([JSON.stringify(payload)], "backup.json", { type: "application/json" })
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } })

    const dialog = await screen.findByRole("alertdialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Huỷ" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(getStoredSettings().profile.displayName).toBe("Tungnh2k1")
    expect(screen.queryByText("Đã nạp backup.json", { exact: false })).not.toBeInTheDocument()
  })
```

- [ ] **Step 4: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/settings/__tests__/data-transfer.test.ts src/features/settings/__tests__/hooks/use-data-management.test.ts src/features/settings/__tests__/components/data-card.test.tsx src/features/settings/__tests__/components/settings-view.test.tsx`
Expected: FAIL —
- `data-transfer`: `expected undefined to be '2026-09-20T02:00:00.000Z'`, `expected undefined to be null`, `restoreCounts is not a function`.
- `use-data-management`: test "stages…" `expected "spy" to not be called at all, but actually been called 1 times` (bản cũ ghi ngay); mọi test dùng `importAndConfirm`/`pullAndConfirm` và "cancelRestore…": `result.current.confirmRestore is not a function` / `result.current.cancelRestore is not a function`; "writes nothing when the settings page is left…": `expected "spy" to not be called at all` (Plan 1a cố ý để lần tải xuống xong muộn vẫn ghi — task này đổi điều đó).
- `data-card`: 2 test "asks before replacing…" và "names the file…" `Unable to find role="alertdialog"`; test "calls onConfirmRestore…" `Unable to find an accessible element with the role "button" and name "Huỷ"`; test "shows no confirm dialog…" PASS sẵn.
- `settings-view`: `Unable to find role="alertdialog"` ở 2 test nhập file.

- [ ] **Step 5: `data-transfer.ts` trả `exportedAt` và thêm `restoreCounts`**

1. Thay khai báo `type ImportResult` bằng:

```ts
// exportedAt: thời điểm bản sao được tạo (null nếu file sửa tay không có) — để hộp xác nhận cho
// người dùng thấy bản sắp thay dữ liệu trên máy cũ hay mới.
type ImportResult =
  | { ok: true; data: ImportedSnapshot; summary: string; exportedAt: string | null }
  | { ok: false; error: string }
```

2. Cuối `parseImportPayload`, thay dòng `return { ok: true, data, summary: restoredSummary(data) }` bằng:

```ts
  const exportedAt = typeof parsed.exportedAt === "string" ? parsed.exportedAt : null
  return { ok: true, data, summary: restoredSummary(data), exportedAt }
```

3. Ngay sau hàm `uploadedSummary`, thêm:

```ts
// Dùng trong hộp xác nhận trước khi thay dữ liệu: đặt số liệu của bản sắp nạp cạnh số liệu trên
// máy, gồm cả khoản chi và quỹ tiết kiệm (2 thứ hay đổi nhất) mà snapshotCounts không đếm.
function restoreCounts(snapshot: ImportedSnapshot): string {
  return [
    `${snapshot.journal.entries.length} bài nhật ký`,
    `${snapshot.budget.expenses.length} khoản chi`,
    `${snapshot.finance.savings.length} quỹ tiết kiệm`,
    `${snapshot.finance.gold.length} lần mua vàng`,
    `${snapshot.study.learned.length} từ đã học`,
  ].join(" · ")
}
```

4. Thêm `restoreCounts,` vào khối `export { ... }`, ngay sau `parseImportPayload,`.

- [ ] **Step 6: `useDataManagement` xếp hàng rồi mới ghi**

Trong `src/features/settings/hooks/use-data-management.ts`:

1. Dòng import `from "../data-transfer"` đổi thành:

```ts
import {
  buildExportPayload,
  exportFileName,
  parseImportPayload,
  restoreCounts,
  type ExportSnapshot,
  type ImportedSnapshot,
} from "../data-transfer"
```

2. Ngay sau dòng `type SyncResult = ...`, thêm:

```ts
// Bản sao đã đọc + parse xong nhưng CHƯA ghi gì xuống máy — chờ người dùng xác nhận ở hộp thoại
// (DataCard), vì nạp là thay TOÀN BỘ dữ liệu trên máy và không hoàn tác được.
type PendingRestore = {
  data: ImportedSnapshot
  summary: string
  exportedAt: string | null
  incomingCounts: string
  localCounts: string
} & ({ source: "file"; fileName: string } | { source: "cloud" })
```

3. Ngay sau hàm `restoreRawBackup` (Task 6), thêm:

```ts
function readLocalSnapshot(): ExportSnapshot {
  return {
    journal: getStoredJournal(),
    finance: getStoredFinance(),
    study: getStoredStudy(),
    settings: getStoredSettings(),
    budget: getStoredBudget(),
    netWorthHistory: getStoredNetWorthHistory(),
    goals: { carFundName: getCarGoalFundName() },
  }
}

function describeRestore(data: ImportedSnapshot, summary: string, exportedAt: string | null) {
  return {
    data,
    summary,
    exportedAt,
    incomingCounts: restoreCounts(data),
    localCounts: restoreCounts(readLocalSnapshot()),
  }
}
```

4. Trong `pushToCloud` và `exportData`, thay object `{ journal: getStoredJournal(), ..., goals: { carFundName: getCarGoalFundName() } }` truyền vào `buildExportPayload(...)` bằng `readLocalSnapshot()` — tức `buildExportPayload(readLocalSnapshot(), new Date().toISOString())` và `buildExportPayload(readLocalSnapshot(), now.toISOString())`.

5. Ngay sau dòng `const [syncResult, setSyncResult] = useState<SyncResult | null>(null)`, thêm:

```ts
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null)
```

6. Thay nguyên `const pullFromCloud = useCallback(...)` (bản của Task 6) bằng:

```ts
  const pullFromCloud = useCallback(async (secret: string) => {
    setSyncing(true)
    try {
      const result = await pullSnapshot(secret)
      if (result.ok) {
        // Chỉ xếp hàng chờ xác nhận — ghi thật ở confirmRestore. Kết quả về sau khi đã rời Cài đặt
        // vì thế không ghi gì (component đã unmount, không còn ai xác nhận).
        setPendingRestore({ ...describeRestore(result.data, result.summary, result.exportedAt), source: "cloud" })
      } else {
        setSyncResult({ ok: false, error: result.error })
      }
    } catch {
      setSyncResult({ ok: false, error: "Không kết nối được máy chủ đồng bộ." })
    } finally {
      setSyncing(false)
    }
  }, [])
```

7. Thay nguyên `const importData = useCallback(...)` (bản của Task 6) bằng:

```ts
  const importData = useCallback(async (file: File) => {
    setExported(null)
    const raw = await file.text().catch(() => null)
    if (raw === null) {
      setImported({ ok: false, error: "Không đọc được nội dung file." })
      return
    }
    const result = parseImportPayload(raw)
    if (!result.ok) {
      setImported({ ok: false, error: result.error })
      return
    }
    setPendingRestore({
      ...describeRestore(result.data, result.summary, result.exportedAt),
      source: "file",
      fileName: file.name,
    })
  }, [])
```

8. Ngay sau `importData`, thêm:

```ts
  const confirmRestore = useCallback(() => {
    if (!pendingRestore) return
    const pending = pendingRestore
    setPendingRestore(null)
    try {
      applySnapshot(pending.data)
    } catch {
      if (pending.source === "cloud") setSyncResult({ ok: false, error: RESTORE_WRITE_ERROR })
      else setImported({ ok: false, error: RESTORE_WRITE_ERROR })
      return
    }
    if (pending.source === "cloud") setSyncResult({ ok: true, summary: pending.summary })
    else setImported({ ok: true, file: pending.fileName, summary: pending.summary })
  }, [pendingRestore, applySnapshot])

  const cancelRestore = useCallback(() => setPendingRestore(null), [])
```

9. Trong object `return { ... }` của hook, thêm `pendingRestore, confirmRestore, cancelRestore,` sau `pullFromCloud,`. Dòng export cuối file đổi thành:

```ts
export { useDataManagement, type ExportedInfo, type ImportedInfo, type SyncResult, type PendingRestore }
```

- [ ] **Step 7: `DataCard` hiện hộp xác nhận**

Trong `src/features/settings/components/data-card.tsx`:

1. Thêm import `import { AlertDialog } from "@/components/ui/alert-dialog"` ngay trước dòng `import { Button } from "@/components/ui/button"`, và đổi dòng import type từ hook thành:

```tsx
import type { ExportedInfo, ImportedInfo, PendingRestore, SyncResult } from "../hooks/use-data-management"
```

2. Ngay sau hàm `formatAutoBackupTime`, thêm:

```tsx
// Có cả năm (khác formatAutoBackupTime): bản sao cũ cả năm trời vẫn phải nhận ra được là cũ.
function formatSnapshotTime(iso: string | null): string {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return "không rõ thời điểm"
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
  return `${time} ngày ${date}`
}
```

3. Trong `interface DataCardProps`, thêm `pendingRestore: PendingRestore | null` ngay sau `syncResult: SyncResult | null`, và thêm 2 dòng `onConfirmRestore: () => void` / `onCancelRestore: () => void` ngay sau `onPullFromCloud: (secret: string) => void`. Trong phần destructure tham số của `function DataCard({ ... })`, thêm `pendingRestore,` sau `syncResult,` và `onConfirmRestore,` `onCancelRestore,` sau `onPullFromCloud,`.

4. Ngay trước thẻ đóng `</Card>` cuối component (sau `</div>` của khối "Đồng bộ đám mây"), thêm:

```tsx
      <AlertDialog
        open={pendingRestore !== null}
        onOpenChange={(open) => {
          if (!open) onCancelRestore()
        }}
        title="Thay dữ liệu trên máy này?"
        description={
          pendingRestore ? (
            <>
              <span className="block">
                {pendingRestore.source === "cloud" ? "Bản trên đám mây" : `File ${pendingRestore.fileName}`} được tạo lúc{" "}
                <strong className="font-bold">{formatSnapshotTime(pendingRestore.exportedAt)}</strong>
              </span>
              <span className="mt-2 block">Bản sắp nạp: {pendingRestore.incomingCounts}</span>
              <span className="block">Trên máy này: {pendingRestore.localCounts}</span>
              <span className="mt-2 block">
                Toàn bộ dữ liệu trên máy này sẽ bị thay bằng bản đó và không hoàn tác được. Nếu chưa chắc, hãy
                Huỷ rồi bấm &quot;Xuất file JSON&quot; trước.
              </span>
            </>
          ) : null
        }
        confirmLabel="Thay dữ liệu"
        destructive
        onConfirm={onConfirmRestore}
      />
```

(AlertDialog gọi `onConfirm()` rồi `onOpenChange(false)` — nên sau "Thay dữ liệu" `cancelRestore` cũng chạy, vô hại vì `confirmRestore` đã đọc xong `pendingRestore`.)

- [ ] **Step 8: `SettingsView` nối hộp thoại**

Trong `src/features/settings/components/settings-view.tsx`: thêm `pendingRestore, confirmRestore, cancelRestore,` vào phần destructure kết quả `useDataManagement(...)` (sau `pullFromCloud,`), và trong `<DataCard ... />` thêm `pendingRestore={pendingRestore}` ngay sau `syncResult={syncResult}`, thêm `onConfirmRestore={confirmRestore}` và `onCancelRestore={cancelRestore}` ngay sau `onPullFromCloud={pullFromCloud}`.

- [ ] **Step 9: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/settings/__tests__/data-transfer.test.ts src/features/settings/__tests__/hooks/use-data-management.test.ts src/features/settings/__tests__/components/data-card.test.tsx src/features/settings/__tests__/components/settings-view.test.tsx src/app/api/sync/__tests__/route.test.ts src/features/settings/__tests__/components/auto-backup.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 10: Dừng cho chủ repo bấm thử, rồi commit**

Task này đổi luồng nạp dữ liệu — chưa commit. Báo chủ repo chạy mục **B** ở "Kiểm tra tay" (Task 10); khi chủ repo xác nhận đúng mới chạy:

```bash
git add src/features/settings/data-transfer.ts src/features/settings/hooks/use-data-management.ts src/features/settings/components/data-card.tsx src/features/settings/components/settings-view.tsx src/features/settings/__tests__/data-transfer.test.ts src/features/settings/__tests__/hooks/use-data-management.test.ts src/features/settings/__tests__/components/data-card.test.tsx src/features/settings/__tests__/components/settings-view.test.tsx
git commit -m "change: ask before an import or cloud pull replaces this device's data"
```

---

### Task 9: Gỡ secret đồng bộ khi đăng xuất và khi xoá toàn bộ dữ liệu

Theo Quyết định 2 (phương án A). Nếu chủ repo chọn B thì bỏ test sidebar (Step 1.1) và phần `sidebar.tsx` (Step 3.2).

**Files:**
- Modify: `src/lib/sync-secret-storage.ts` (toàn bộ file)
- Modify: `src/app/(app)/_components/sidebar.tsx:22,83-86`
- Modify: `src/features/settings/hooks/use-data-management.ts` (`wipeData` + 1 import)
- Modify: `src/features/settings/components/data-card.tsx:9,46-51` (ô secret đọc lại khi secret bị gỡ)
- Test: `src/app/(app)/_components/__tests__/sidebar.test.tsx`, `src/features/settings/__tests__/hooks/use-data-management.test.ts`, `src/features/settings/__tests__/components/data-card.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước (dùng `BASE_PROPS` của `data-card.test.tsx` như Task 8 để lại).
- Produces: `clearSyncSecret()` giờ gọi `notifyDataChanged()` sau khi gỡ key (`setSyncSecret` KHÔNG báo — đó là chính ô secret đang gõ, và báo thì AutoBackup nếu được bật lại sẽ tự tải lên). `Sidebar.handleLogout` và `wipeData` gọi `clearSyncSecret()`. `DataCard` đọc lại `getSyncSecret()` khi nhận `notifyDataChanged()` hoặc sự kiện `storage`. Không dùng `useStorageSync` của Plan 1a cho ô này: hook đó so với chuỗi thô lần trước, mà lần gõ (không notify) làm mốc đó cũ — mở Cài đặt khi chưa có secret, gõ secret, rồi tab khác đăng xuất thì chuỗi thô vẫn là `null` như mốc và ô sẽ không trống.

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/app/(app)/_components/__tests__/sidebar.test.tsx`, thêm 2 import ngay sau dòng `import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"`:

```tsx
import { setStoredUser } from "@/lib/auth"
import { setSyncSecret } from "@/lib/sync-secret-storage"
```

và thêm vào cuối `describe("Sidebar", ...)`:

```tsx
  it("forgets the sync secret saved on this device when logging out", () => {
    setStoredUser({ email: "owner@example.com" })
    setSyncSecret("real-secret")
    render(<Sidebar />)

    fireEvent.click(screen.getAllByRole("button", { name: "Đăng xuất" })[0])

    expect(window.localStorage.getItem("auth-user")).toBeNull()
    expect(window.localStorage.getItem("sync-secret")).toBeNull()
  })
```

1.2. Trong `src/features/settings/__tests__/hooks/use-data-management.test.ts`, thêm import `import { setSyncSecret } from "@/lib/sync-secret-storage"` ngay sau dòng `import { DEFAULT_SETTINGS } from "@/lib/settings-storage"`, và thêm test ngay sau test `"wipeData replaces journal/finance/study/budget/net-worth-history with empty defaults but keeps the gold stores"`:

```ts
  it("wipeData also forgets the sync secret saved on this device", () => {
    setSyncSecret("real-secret")
    const { result } = renderDataManagement()

    act(() => {
      result.current.wipeData()
    })

    expect(window.localStorage.getItem("sync-secret")).toBeNull()
  })
```

1.3. Trong `src/features/settings/__tests__/components/data-card.test.tsx`, thêm `act` vào dòng import `from "@testing-library/react"` (sau Task 8 dòng đó thành `import { act, fireEvent, render, screen, within } from "@testing-library/react"`) và đổi dòng import sync-secret thành `import { clearSyncSecret, setSyncSecret } from "@/lib/sync-secret-storage"`; thêm vào cuối `describe("DataCard", ...)`:

```tsx
  it("empties the secret field when the saved secret is removed from this device", () => {
    setSyncSecret("saved-secret")
    render(<DataCard {...BASE_PROPS} />)
    expect(screen.getByLabelText("Secret đồng bộ", { exact: false })).toHaveValue("saved-secret")

    act(() => {
      clearSyncSecret()
    })

    expect(screen.getByLabelText("Secret đồng bộ", { exact: false })).toHaveValue("")
    expect(screen.getByRole("button", { name: "Tải xuống" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Copy secret" })).toBeDisabled()
  })

  it("empties a secret typed on this page when another tab logs out and removes it", () => {
    render(<DataCard {...BASE_PROPS} />)
    fireEvent.change(screen.getByLabelText("Secret đồng bộ", { exact: false }), {
      target: { value: "typed-secret" },
    })

    act(() => {
      window.localStorage.removeItem("sync-secret")
      window.dispatchEvent(new StorageEvent("storage", { key: "sync-secret" }))
    })

    expect(screen.getByLabelText("Secret đồng bộ", { exact: false })).toHaveValue("")
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run "src/app/(app)/_components/__tests__/sidebar.test.tsx" src/features/settings/__tests__/hooks/use-data-management.test.ts src/features/settings/__tests__/components/data-card.test.tsx`
Expected: FAIL 4 test mới — `expected 'real-secret' to be null` (đăng xuất, xoá dữ liệu) và `toHaveValue("")` fail vì ô secret vẫn giữ `saved-secret` / `typed-secret` (2 test DataCard)

- [ ] **Step 3: Gỡ secret ở cả 2 nơi và cho ô secret đọc lại**

3.1. Thay toàn bộ nội dung `src/lib/sync-secret-storage.ts` bằng:

```ts
import { notifyDataChanged } from "./data-change-bus"

const SYNC_SECRET_STORAGE_KEY = "sync-secret"

function getSyncSecret(): string {
  try {
    return window.localStorage.getItem(SYNC_SECRET_STORAGE_KEY) ?? ""
  } catch {
    return ""
  }
}

function setSyncSecret(secret: string) {
  window.localStorage.setItem(SYNC_SECRET_STORAGE_KEY, secret)
}

// Báo qua data-change-bus để ô secret đang mở ở Cài đặt (DataCard) tự trống theo — không báo ở
// setSyncSecret vì đó là chính ô đó đang gõ.
function clearSyncSecret() {
  window.localStorage.removeItem(SYNC_SECRET_STORAGE_KEY)
  notifyDataChanged()
}

export { SYNC_SECRET_STORAGE_KEY, getSyncSecret, setSyncSecret, clearSyncSecret }
```

3.2. Trong `src/app/(app)/_components/sidebar.tsx`, thêm `import { clearSyncSecret } from "@/lib/sync-secret-storage"` ngay sau dòng `import { clearStoredUser } from "@/lib/auth"`, và thay hàm `handleLogout` bằng:

```tsx
  function handleLogout() {
    // Secret đồng bộ là credential thật của /api/sync (đọc/ghi được từ bất cứ đâu) — không để lại
    // cho người dùng sau trên cùng trình duyệt. Dữ liệu trên máy vẫn giữ như thiết kế mock login.
    clearSyncSecret()
    clearStoredUser()
    router.push("/login")
  }
```

3.3. Trong `src/features/settings/hooks/use-data-management.ts`, thêm `import { clearSyncSecret } from "@/lib/sync-secret-storage"` ngay sau dòng import `@/lib/settings-storage`, và trong `wipeData` thêm ngay sau dòng `setCarGoalFundName(null)`:

```ts
    // "Làm lại từ đầu" trên máy này — không giữ lại credential đồng bộ.
    clearSyncSecret()
```

3.4. Trong `src/features/settings/components/data-card.tsx`: thêm `import { onDataChanged } from "@/lib/data-change-bus"` ngay trước dòng `import { getSyncSecret, setSyncSecret } from "@/lib/sync-secret-storage"`, và thêm ngay sau `useEffect` đọc secret lúc mount (khối có `setSecret(getSyncSecret())` + `setAutoBackup(...)`):

```tsx
  useEffect(() => {
    // Đăng xuất (kể cả ở tab khác) hay xoá toàn bộ dữ liệu đều gỡ secret khỏi máy — ô nhập phải
    // trống theo, không giữ bản cũ trong state để còn bấm "Tải lên"/"Copy" được. Luôn đọc lại thay
    // vì dùng useStorageSync: gõ trong ô này (setSyncSecret) cố ý không báo data-change-bus, nên
    // mốc "chuỗi thô lần trước" của useStorageSync sẽ cũ. Đọc lại khi đang gõ vẫn vô hại — storage
    // luôn giữ đúng chữ vừa gõ.
    function reloadSecret() {
      setSecret(getSyncSecret())
    }
    const unsubscribe = onDataChanged(reloadSecret)
    window.addEventListener("storage", reloadSecret)
    return () => {
      unsubscribe()
      window.removeEventListener("storage", reloadSecret)
    }
  }, [])
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run "src/app/(app)/_components/__tests__/sidebar.test.tsx" src/features/settings/__tests__/hooks/use-data-management.test.ts src/features/settings/__tests__/components/data-card.test.tsx src/features/settings/__tests__/components/settings-view.test.tsx src/features/settings/__tests__/components/auto-backup.test.tsx`
Expected: PASS toàn bộ (kể cả "preloads a secret already saved on this device and persists edits" sẵn có — gõ secret không bị đọc lại đè)

- [ ] **Step 5: Dừng cho chủ repo bấm thử, rồi commit**

Task này đổi thao tác đăng xuất/xoá dữ liệu — chưa commit. Báo chủ repo chạy mục **C** ở "Kiểm tra tay" (Task 10); khi chủ repo xác nhận đúng mới chạy:

```bash
git add src/lib/sync-secret-storage.ts "src/app/(app)/_components/sidebar.tsx" src/features/settings/hooks/use-data-management.ts src/features/settings/components/data-card.tsx "src/app/(app)/_components/__tests__/sidebar.test.tsx" src/features/settings/__tests__/hooks/use-data-management.test.ts src/features/settings/__tests__/components/data-card.test.tsx
git commit -m "fix: forget the sync secret on logout and on a full data wipe"
```

---

### Task 10: Checkpoint — tsc, lint, toàn bộ test, kiểm tra tay

**Files:** không sửa file nào (nếu 1 bước dưới đây fail, sửa ở đúng task gây ra rồi chạy lại từ đầu task này).

**Interfaces:**
- Consumes: toàn bộ Task 1–9.
- Produces: nhánh `fix/import-parsing` sẵn sàng để chủ repo duyệt merge vào `developer`.

- [ ] **Step 1: Kiểm tra kiểu**

Run: `npx tsc --noEmit`
Expected: không có lỗi (đặc biệt: mọi mock `pullSnapshot` với `ok: true` trong test đã có `exportedAt`; mọi chỗ render `DataCard` truyền đủ 3 prop mới)

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: sạch, không error/warning mới

- [ ] **Step 3: Toàn bộ test suite**

Run: `npm run test`
Expected: PASS toàn bộ

- [ ] **Step 4: Kiểm tra tay**

Chạy `npm run dev`, mở app trong trình duyệt, đăng nhập bằng mock account. Mục A.5 đã chạy ở Task 7, B ở Task 8, C ở Task 9 — trước khi duyệt merge, chạy lại toàn bộ 1 lượt trên bản cuối.

### Kiểm tra tay

**A. Dữ liệu hỏng chỉ mất đúng phần hỏng (Task 1–5, 7)**

- [ ] A.1 Cài đặt → "Xuất file JSON". Mở file `orange-banana-….json` vừa tải bằng trình soạn thảo, sửa rồi lưu thành `backup-hong.json`:
  - `journal.entries`: thêm `null,` làm phần tử đầu.
  - `settings.moods` và `settings.tags`: mỗi mảng thêm `null,` làm phần tử đầu.
  - `study.learned`: thêm `null,` làm phần tử đầu (mảng đang rỗng thì vẫn thêm — kết quả mong đợi khi đó là 0 từ đã học, không lỗi).
  - `finance.cards`: thêm `{ "name": "Thẻ lỗi" },` làm phần tử đầu.
- [ ] A.2 Trong cùng file, thay `settings.modules` bằng `[{"key":"taichinh","label":"Cũ","hint":"","on":false},{"key":"chuoingay","label":"Chuỗi ngày","hint":"","on":true}]`.
- [ ] A.3 Cài đặt → "Nhập từ file" → chọn `backup-hong.json` → hộp xác nhận hiện, dòng "Bản sắp nạp" đếm đúng số bài nhật ký/từ đã học hợp lệ (không tính `null`) → "Thay dữ liệu" → banner xanh "Đã nạp backup-hong.json". Ngay lập tức (không tải lại trang): Cài đặt không sập; "Tâm trạng dùng trong nhật ký" và "Nhãn dùng trong chi tiêu" đủ các dòng cũ, không có dòng trống; "Module hiển thị" có đúng 6 module, "Tài chính" đang tắt, KHÔNG có "Chuỗi ngày"; sidebar không còn mục "Tài chính". Bật lại "Tài chính".
- [ ] A.4 Mở `/journal` và `/overview`: không sập, các bài cũ còn nguyên. Mở `/finance` → Thẻ tín dụng: các thẻ cũ còn, không có "Thẻ lỗi". Mở `/study`: số từ đã học đúng như trước.
- [ ] A.5 (ô khối lượng — Task 7) `/finance` → tab Vàng → "Thêm lần mua vàng" → chọn cửa hàng, nhập ngày `10/08/2026`, giá `900000`, khối lượng `1e400` → nút "Thêm" bị khoá; đổi khối lượng thành `10` → "Thêm" bấm được (bấm "Huỷ" nếu không muốn lưu). Bấm sửa 1 lần mua vàng có sẵn → khối lượng `Infinity` → "Lưu" bị khoá → "Huỷ".
- [ ] A.6 (tuỳ chọn, nội dung JSONL — Task 5) Chép dòng cuối của `content/vocabulary.jsonl` thành 1 dòng mới, đổi `"id"` thành id chưa có và đổi khoá `"word"` thành `"Word"` → `npx vitest run src/features/study/__tests__/content-loader.test.ts` → FAIL với `vocabulary.jsonl:<số dòng>: dòng thiếu hoặc sai kiểu field word — …` → hoàn tác bằng `git checkout content/vocabulary.jsonl`.
- [ ] A.7 Nhập lại file `orange-banana-….json` gốc (bước A.1) → "Thay dữ liệu" để trả dữ liệu như cũ.

**B. Hỏi lại trước khi thay dữ liệu (Task 6, 8)**

- [ ] B.1 Cài đặt → "Xuất file JSON" (nhớ giờ xuất). Sang `/journal` viết 1 bài ngắn "test xác nhận" và lưu. Quay lại Cài đặt → "Nhập từ file" → chọn file vừa xuất → hộp "Thay dữ liệu trên máy này?" hiện "File orange-banana-….json được tạo lúc HH:mm ngày dd/mm/yyyy" đúng giờ vừa xuất (có cả năm); "Bản sắp nạp" ít hơn "Trên máy này" đúng 1 bài nhật ký.
- [ ] B.2 Bấm "Huỷ" → hộp đóng, không có banner "Đã nạp"; `/journal` vẫn còn bài "test xác nhận". Lặp lại, lần này đóng bằng phím Esc và bằng bấm ra vùng mờ ngoài hộp → kết quả như "Huỷ".
- [ ] B.3 Nhập lại file đó → "Thay dữ liệu" → banner xanh "Đã nạp orange-banana-….json"; `/journal` không còn bài "test xác nhận" (đúng như bản sao).
- [ ] B.4 Có secret đồng bộ. Trước tiên "Xuất file JSON" (giữ file này — bản trên cloud có thể cũ hơn dữ liệu trên máy). Bấm "Tải xuống" → 2 nút hiện "Đang đồng bộ…" rồi hộp "Bản trên đám mây được tạo lúc …" (giờ của lần "Tải lên" gần nhất) → "Huỷ" → không đổi gì, 2 nút trở lại "Tải lên"/"Tải xuống". Bấm "Tải xuống" lần nữa → "Thay dữ liệu" → banner "Đã đồng bộ". Nếu "Bản sắp nạp" cũ hơn dữ liệu trên máy: "Nhập từ file" file vừa xuất → "Thay dữ liệu" để lấy lại dữ liệu như trước B.4.
- [ ] B.5 DevTools → Network → chọn "Slow 3G" → bấm "Tải xuống" rồi chuyển ngay sang `/budget` trước khi hộp hiện → đợi vài giây → quay lại Cài đặt: không có hộp thoại, dữ liệu trên máy không đổi. Trả Network về "No throttling".
- [ ] B.6 DevTools → Network → "Offline" → "Tải xuống" → banner đỏ "Đồng bộ không thành công" / "Không kết nối được máy chủ đồng bộ.", 2 nút không kẹt ở "Đang đồng bộ…". Bật mạng lại.

**C. Secret đồng bộ không ở lại máy (Task 9)**

- [ ] C.1 Cài đặt → dán secret vào "Secret đồng bộ" → "Đăng xuất" → DevTools → Application → Local Storage: không còn key `sync-secret` → đăng nhập lại → Cài đặt: ô secret trống; nút Copy, "Tải lên", "Tải xuống" đều bị khoá.
- [ ] C.2 "Xuất file JSON" trước (để khôi phục), dán lại secret → "Xoá toàn bộ dữ liệu" → làm đủ các bước + mật khẩu → ô secret trống ngay, không cần tải lại trang. Sau đó "Nhập từ file" file vừa xuất → "Thay dữ liệu" để lấy lại dữ liệu, rồi dán lại secret.
- [ ] C.3 Mở 2 tab cùng app; tab 1 ở Cài đặt, ô secret có giá trị; ở tab 2 bấm "Đăng xuất" → quay lại tab 1: ô secret đã trống.

- [ ] **Step 5: Báo lại để duyệt**

Báo chủ repo: kết quả Step 1–3, kết quả từng mục Kiểm tra tay, danh sách commit trên `fix/import-parsing`. Chỉ merge vào `developer` khi chủ repo duyệt (CLAUDE.md mục 5). Không `git push` nếu chủ repo chưa yêu cầu.
