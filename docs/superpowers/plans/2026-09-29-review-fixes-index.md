# Sửa lỗi sau review toàn bộ source (2026-09-29) — mục lục

Review toàn bộ source ngày 2026-09-29 (8 agent theo khu vực + 2 agent xuyên suốt về toàn vẹn dữ liệu và bảo mật, mỗi phát hiện được agent phản biện cố bác bỏ) cho ra **120 phát hiện đã kiểm chứng** — không có lỗi critical, không có lỗ hổng bảo mật nghiêm trọng. 120 phát hiện được chia vào 8 plan dưới đây, **thực thi đúng thứ tự**; mỗi plan một nhánh riêng, nhánh sau chỉ tách khi nhánh trước đã được chủ repo bấm thử ("Kiểm tra tay") và duyệt merge vào `developer`.

## Thứ tự thực thi

| # | Plan | Nhánh | Task | Phát hiện | Nội dung chính |
|---|------|-------|------|-----------|----------------|
| 1a | [fix-1a-storage-sync](2026-09-29-fix-1a-storage-sync.md) | `fix/storage-sync` | 11 | 10 | Hook tự đọc lại khi storage đổi (`useStorageSync`), ghi từ bản đọc tươi; ô "Tên hiển thị" theo tên đang lưu; tên quỹ/thẻ là duy nhất; xoá quỹ gỡ liên kết mục tiêu xe |
| 1b | [fix-1b-import-parsing](2026-09-29-fix-1b-import-parsing.md) | `fix/import-parsing` | 10 | 11 | Lọc từng phần tử khi parse (`safeArray`); hỏi lại trước khi "Tải xuống"/"Nhập từ file" thay dữ liệu; khôi phục lỗi giữa chừng thì trả máy về nguyên trạng; gỡ secret khi đăng xuất/xoá dữ liệu; kiểm tra file JSONL |
| 2 | [fix-2-budget](2026-09-29-fix-2-budget.md) | `fix/budget-review-fixes` | 13 | 16 | "đã chi" đúng; tất toán nguyên tử, tất toán tháng trước; ẩn lương khi ẩn tiền; xác nhận xoá khoản chi; màu thẻ thống nhất; mục tiêu không NaN/âm |
| 3 | [fix-3-study](2026-09-29-fix-3-study.md) | `fix/study-review-fixes` | 11 | 12 | Lượt ôn thật trước từ mới; "Ôn tiếp"; nhiệm vụ reset mỗi ngày; Pomodoro theo đồng hồ thật; "Gõ từ" chơi được trên điện thoại; lựa chọn không trùng nghĩa |
| 4 | [fix-4-journal](2026-09-29-fix-4-journal.md) | `fix/journal-review-fixes` | 10 | 11 | Bản xem trước đúng chữ; giữ chữ khi lưu lỗi; xác nhận xoá; giữ bản nháp khi bấm Sửa; giữ mood đã lưu; hiện năm cho bài năm khác |
| 5 | [fix-5-mobile-layout](2026-09-29-fix-5-mobile-layout.md) | `fix/mobile-layout` | 9 | 8 | Thanh điều hướng 7 mục vừa màn 360px; số tiền lớn tự co cỡ chữ; modal cuộn được; lưới/thẻ game không tràn |
| 6a | [fix-6a-small-bugs](2026-09-29-fix-6a-small-bugs.md) | `fix/small-bugs-finance` → `fix/small-bugs-calc` → `fix/small-bugs-settings` | 25 | 33 | Lỗi nhỏ còn lại: vàng/thẻ/đầu tư, insight, máy tính (Ctrl+C, toán tử lặp, số lớn), cài đặt, component dùng chung |
| 6b | [fix-6b-a11y-conventions](2026-09-29-fix-6b-a11y-conventions.md) | `change/a11y` → `refactor/conventions` | 17 | 19 | Tên/trạng thái cho trình đọc màn hình, vòng focus, reduced motion; dọn CSS; chuyển code dùng chung lên `src/lib`/`src/components` theo CLAUDE.md §3 |
| | **Tổng** | 12 nhánh | **106** | **120** | |

## Quyết định (plan đang làm theo phương án khuyên dùng)

Chủ repo muốn đổi quyết định nào thì báo trước khi tới plan đó — plan tương ứng ghi sẵn cách lùi về phương án khác.

**1a**
- Quỹ/thẻ trùng tên đã có sẵn trong dữ liệu → tự đổi tên bản trùng thành "Tên (2)", "Tên (3)"… khi đọc (không mất số dư).
- Xoá quỹ đang gắn mục tiêu mua xe → gỡ liên kết; liên kết mồ côi không tự gắn vào quỹ mới trùng tên (tạo lại quỹ cũ thì chọn lại ở trang Mục tiêu).

**1b**
- "Tải xuống"/"Nhập từ file" → hiện hộp "Thay dữ liệu trên máy này?" kèm thời điểm tạo bản sao và số liệu 2 bên; chỉ bấm "Thay dữ liệu" mới ghi.
- Secret đồng bộ → gỡ khỏi máy khi "Đăng xuất" và khi "Xoá toàn bộ dữ liệu".
- Dòng JSONL từ vựng/ngữ pháp sai field → test báo lỗi ngay (chỉ rõ dòng + field), không lặng lẽ bỏ qua.

**2**
- Tất toán tháng trước → 1 dòng "tháng trước" trong card tất toán (chỉ tháng liền trước).
- Ô lương và ô số tiền tất toán khi đang ẩn tiền → che cho tới khi bấm vào ô.
- Xoá khoản chi → hộp xác nhận như các tab Tài chính.

**3**
- Lượt ôn đã lên lịch đứng trước từ chưa học.
- Có nút "Ôn tiếp N từ" sau khi chấm xong 5 từ.
- "Gõ từ" → gõ qua 1 ô `<input>` thật; khu chơi cao 300px dưới 640px; từ rơi khi chưa gõ phím nào không bị chấm "Quên".
- Pomodoro đếm theo mốc kết thúc, tự bắt kịp khi quay lại tab.
- Mục trùng trong `content/` giữ nguyên; code tự lọc nghĩa/chữ trùng.

**4**
- Đang viết bài mới mà bấm Sửa bài cũ → giữ bản nháp trong trang; bài đang sửa có thay đổi (kể cả đổi mood) thì hỏi trước khi bỏ.
- Xoá bài → hộp xác nhận như Tài chính.
- Ngày của bài → chỉ thêm năm cho bài không thuộc năm nay.

**5**
- Thanh điều hướng dưới → giữ đủ 7 mục, các mục tự co và cắt nhãn.
- Số tiền lớn → cỡ chữ co theo số ký tự. *Hệ quả:* số tiền ở 4 thẻ đầu trang `/finance` nhỏ đi khoảng 1/5 ở mọi bề rộng (cỡ cũ tràn thẻ từ khoảng 10 triệu).
- Game ghép cặp → 3 cột dưới 640px, thẻ không cắt chữ.

**6a**
- Vàng của cửa hàng chưa có giá → tính theo giá mua, kèm dòng nhắc nhập giá.
- Ngày mua vàng → vẫn là ô chữ nhưng phải là ngày thật, lưu dạng `dd/mm/yyyy`.
- Khối lượng vàng → chỉ nhận số phân nguyên; giá trị lẻ cũ hiển thị làm tròn.
- "Hạn gần nhất" → lấy số 1–31 đầu tiên trong ô ngày đến hạn, chỉ tính thẻ còn dư nợ.
- Bỏ ô "Ngày trả" không dùng tới trong hộp trả thẻ.
- Insight "chi tiêu giảm" → so với cùng số ngày của 3 tháng trước; cảnh báo tổng chi cần chênh ít nhất 10%.
- Máy tính và nút ẩn tiền → hiện khi bật 1 trong Tài chính, Chi tiêu, Mục tiêu.
- Xoá mood → hỏi xác nhận.

**6b**
- Code dùng chung ≥ 2 feature → **chuyển lên `src/lib/<domain>/` và `src/components/ob/`** đúng CLAUDE.md §3 (khoảng 61 file di chuyển, ~325 dòng import; chạy cuối nên không đụng plan nào; kiểm bằng tsc + toàn bộ test + "diff chỉ đổi dòng import"). Phương án khác: B — chỉ cho import chéo qua barrel `index.ts` (gây vòng import); C — để nguyên.
- Tabs → `aria-pressed` trên từng nút (không đổi sang mẫu tablist đầy đủ).

## File nhiều plan cùng sửa

35 file (trên tổng 190 file được đụng tới) được hơn 1 plan sửa (ví dụ `sidebar.tsx`: 5 → 6a → 6b; `use-finance.ts`/`finance-storage.ts`: 1a → 1b; `spelling-game.tsx`: 3 → 5; `field.tsx`: 2 → 6a). Plan sau luôn neo đoạn code theo **nội dung sau khi plan trước đã merge** (không theo số dòng) và ghi rõ phần phải giữ của plan trước — xem mục "Thay đổi ảnh hưởng tới các phần sau" của từng plan. Trước khi sửa 1 file, đọc lại toàn bộ file đó.

## Lưu ý khi thực thi

- Mỗi task commit ngay khi test xanh và đã tự review diff — không dừng giữa plan. Mọi thứ cần bấm thử gom vào "Kiểm tra tay" ở task checkpoint cuối của từng nhánh; thấy sai thì sửa tiếp trên chính nhánh đó.
- Không merge vào `developer` khi chủ repo chưa duyệt; không `git push` khi chủ repo chưa yêu cầu.
- Khi bấm thử ở máy local: `npm run dev` nạp `.env.local` — nếu file này chứa `SYNC_SECRET`/Blob token thật thì bấm "Tải lên" sẽ ghi đè bản cloud thật. Kiểm tra bằng xuất/nhập file, hoặc trong cửa sổ ẩn danh chưa nhập secret.
- Plan 6b: test CSS (`globals-css.test.ts`) dùng `postcss` có sẵn trong `node_modules` (dependency của `vite`/`@tailwindcss/postcss`) nhưng không khai báo trong `package.json` — cân nhắc lại lúc thực thi (khai báo devDependency, hoặc kiểm CSS bằng cách khác).
