# Trang Làm việc dạng Bento — thiết kế

## Vì sao

Chủ app thấy trang Làm việc (`/work`) xấu và muốn một bố cục khác hẳn. Bố cục hiện tại gồm:

- tiêu đề trên cùng;
- 3 tab: Việc cần làm, Standup, Báo cáo tuần;
- bảng Kanban gồm các cột 272px.

Chủ app đã xem 3 mockup có độ chi tiết cao và chọn **số 3, "Bento"**: trang là một lưới gồm các ô to nhỏ khác nhau, cùng kiểu với trang Tổng quan. Tôi tả lại cách trang mới sẽ chạy, chủ app trả lời "bắt tay vào làm", không sửa gì.

Mọi chỗ ghi *(tôi quyết)* dưới đây là quyết định của tôi. Chủ app duyệt khi kiểm tay.

## Mục tiêu

Trang Làm việc chỉ còn **một màn Bento**. Không còn tab, không còn bảng Kanban, không còn kéo thả.

**Đầu trang**

- Bên trái là tiêu đề "Làm việc", ngày hôm nay và số việc đang mở, kèm nút "Quản lý cột".
- Bên phải là ô thêm việc nhanh.

**Ô thêm việc**

- Gõ tên việc, chọn hạn bằng chip "Hôm nay" hoặc "Ngày mai" (chỉ chọn được một trong hai), bật chip "Cao" nếu ưu tiên cao, rồi bấm Enter hoặc nút Thêm.
- Việc mới vào **cột đầu**. Toast báo "Đã thêm vào “{tên cột đầu}”".
- Mặc định không đặt hạn và ưu tiên thường *(tôi quyết)*.

**Ô "Hôm nay"** (ô tối, to nhất)

- Hiện tổng số việc trễ hạn và đến hạn hôm nay, kèm dòng "N trễ hạn · M đến hạn hôm nay".
- Thanh tiến độ "x/y xong hôm nay": x là số việc xong hôm nay, y = x + số việc đang hiện trong ô.
- Danh sách việc: việc trễ hạn trước, rồi việc đến hạn hôm nay. Thứ tự giữ như `groupTasks`.
  - Tick là xong: thẻ lên đầu cột cuối, giống tick ở Tổng quan.
  - Bấm tên việc thì mở hộp sửa.
  - Ô hiện tối đa 6 việc, nút "Xem thêm N việc" mở ra hết *(tôi quyết)*.
- Không có việc nào thì hiện khỉ và câu "Không có việc trễ hay đến hạn hôm nay.".

**Ô Standup**

- Nhãn trạng thái: "Đã lưu" hoặc "Chưa lưu".
- Đọc trước 3 phần Hôm qua / Hôm nay / Vướng mắc, lấy từ bản đã lưu hôm nay, chưa có thì lấy từ gợi ý.
  - Hôm qua và Hôm nay hiện tối đa 3 dòng, còn lại ghi "và N việc nữa".
- **Gợi ý standup mang theo vướng mắc** của bản standup ngày làm việc trước. Hiện nay ô này luôn để trống. Khi vướng mắc đến từ bản trước, ô ghi thêm "Từ standup trước".
- Nút "Viết standup" mở khung soạn standup như hiện nay, trong một khung trượt.
- Nút Copy chép đúng nội dung đang hiện ở ô.

**Ô Tuần này**

- Số việc xong trong tuần, kèm cột nhỏ cho từng ngày T2 → CN. Ngày hôm nay tô màu.
- Nút "Báo cáo" mở báo cáo tuần như hiện nay, trong một khung trượt.

**Ô Sắp tới**

- Các việc chưa xong có hạn trong 7 ngày tới, không tính hôm nay, xếp theo hạn.
- Hiện tối đa 4 việc, còn lại ghi "và N việc nữa".

**Các ô theo cột**: mỗi cột của bảng hiện nay thành 1 ô, tên ô là tên cột.

- **Cột giữa**: các cột từ thứ 2 đến áp chót, mỗi cột một ô.
  - Ô hiện việc của cột dưới dạng thẻ nhỏ.
  - Có nút "Thêm việc" để thêm ngay vào cột đó.
- **Cột đầu**: một dải rộng hết hàng, nằm dưới cùng.
- **Cột cuối (đã xong)**:
  - Hiện 5 việc xong gần nhất, mới nhất trước, kèm "xong hôm nay" hoặc "xong dd/mm".
  - Bấm dấu tick xanh là bỏ tick, việc về cuối cột đầu như ở Tổng quan.
- Ô cột giữa và dải cột đầu hiện tối đa 6 thẻ *(tôi quyết)*. Có nhiều hơn thì nút "Xem tất cả N" mở khung trượt chứa toàn bộ việc của cột.
- Ô cột cuối luôn có nút "Tất cả N" để xem hết việc đã xong.

**Thẻ việc**

- Ô tròn để tick xong.
- Tên việc: bấm vào là mở hộp sửa.
- Chip hạn:
  - trễ hạn: "Trễ N ngày", màu đỏ;
  - đến hạn hôm nay: "Hôm nay", màu vàng;
  - hạn trong 6 ngày tới: thứ và ngày, ví dụ "T5 · 05/11";
  - xa hơn: "12/11", hoặc "12/11/2027" nếu khác năm.
- Ưu tiên cao: cờ màu cam. Ưu tiên thấp: mũi tên xuống, màu nhạt. Ưu tiên thường: không hiện gì.
- Nút "…" mở menu:
  - "Sửa";
  - "Chuyển sang" kèm danh sách các cột;
  - "Xoá", có hỏi lại như hiện nay.
- Thẻ trễ hạn có vạch đỏ bên trái.

**Chuyển cột**

- Đổi cột bằng menu "Chuyển sang", hoặc bằng dòng "Trạng thái" mới trong hộp sửa.
- Chuyển vào cột cuối thì thẻ lên **đầu** cột, chuyển vào cột khác thì xuống cuối cột *(tôi quyết, sửa lỗi "thẻ chìm xuống đáy cột Hoàn thành")*.
- Toast báo "Đã chuyển sang “{cột}”".

**Hộp sửa việc**

- Tiêu đề hộp là "Sửa việc", trước đây là "Sửa thẻ".
- Giữ các trường đang có: tên, hạn, ưu tiên, nút xoá.
- Thêm nhóm nút "Trạng thái", mỗi cột một nút.

**Hộp "Quản lý cột"**

- Mỗi cột một dòng: ô sửa tên (lưu khi rời ô hoặc bấm Enter), nút lên, nút xuống, nút xoá.
  - Xoá có hỏi lại, câu chữ như hiện nay.
  - Cột cuối có nhãn "Cột hoàn thành".
- Ô "Thêm cột" ở dưới cùng. Cột mới chen trước cột cuối, như hiện nay.

**Khung trượt** (dùng cho Standup, Báo cáo tuần và "Xem tất cả")

- Máy tính: trượt từ bên phải, rộng tối đa 560px.
- Điện thoại (dưới 768px): trượt từ dưới lên, cao tối đa 90% màn hình.
- Đóng bằng nút X, phím Esc hoặc bấm ra nền.
- Khung Standup giữ nguyên chữ đang gõ khi đóng rồi mở lại, như việc chuyển tab hiện nay.

**Dữ liệu**

- Dữ liệu giữ nguyên: key `work-data`, kiểu `WorkState` không đổi, không cần migrate.
- Trang Tổng quan không đổi.

## Bố cục

- Lưới đặt trong một khung có `container-type: inline-size`, nên số cột theo bề rộng nội dung chứ không theo màn hình:

  | Bề rộng nội dung | Số cột |
  |---|---|
  | dưới 576px | 1 |
  | từ 576px (`@xl`) | 2 |
  | từ 1024px (`@5xl`) | 4 |

  *(tôi quyết, sau khi chụp bản thật)* Ban đầu là 896px (`@4xl`). Nhưng ở màn 1280px, nội dung rộng 952px nên ô 1 cột chỉ còn khoảng 220px: nhãn "Tuần này" bị cắt và nút "Viết standup" xuống dòng.

- Thứ tự ô và cỡ ở lưới 4 cột:

  | Ô | Cỡ |
  |---|---|
  | Hôm nay | 2×2 |
  | Standup | 1×2 |
  | Tuần này | 1×1 |
  | Sắp tới | 1×1 |
  | các cột giữa | xem bảng dưới |
  | Đã xong | 1 |
  | cột đầu | hết hàng |

- Số cột lưới mỗi ô cột giữa chiếm, theo số cột giữa, ở lưới 4 cột:

  | Số cột giữa | Cỡ từng ô | Ô Đã xong |
  |---|---|---|
  | 0 | — | rộng 4 |
  | 1 | rộng 3 | rộng 1 |
  | 2 | rộng 2, rộng 1 | rộng 1 |
  | 3 | mỗi ô rộng 1 | rộng 1 |
  | từ 4 | mỗi ô rộng 1, xuống hàng | rộng 1 |

  Ở lưới 2 cột, mọi ô rộng tối đa 2.
- Mỗi ô là một `Card` (bo 24px, viền 1.5px). Ô Hôm nay dùng `tone="invert"`. Đầu mỗi ô có ô icon 36px, nhãn chữ nhỏ viết hoa, số đếm và nút link, giống trang Tổng quan.
- Chạm được ≥ 44px trên điện thoại. Trang không cuộn ngang ở bề rộng nào.

## Không làm (lần này)

- Ghi chú hay link cho việc.
- Xem dạng bảng hay kéo thả.
- Đổi trang Tổng quan.
- Các lỗi khác trong bản rà soát, ví dụ: Copy standup không lưu, ô gõ standup cố định chiều cao, báo cáo tuần thiếu việc chưa có hạn.

## Gỡ bỏ

- Xoá `kanban-board`, `kanban-column`, `kanban-card`, `kanban-dnd` và test của chúng.
- Gỡ hai package `@dnd-kit/core` và `@dnd-kit/sortable` (cùng `@dnd-kit/utilities` nếu có), vì không còn chỗ nào dùng.
- Sửa dòng dnd-kit trong bảng tech stack ở CLAUDE.md và phần mô tả trang Làm việc trong README.

## Ràng buộc

- Theo CLAUDE.md:
  - component nằm trong `src/features/work/`;
  - hàm tính toán dùng chung nằm trong `src/lib/work/`;
  - test để trong `__tests__/`;
  - code định dạng bằng Prettier;
  - không thêm thư viện.
- Dev server của chủ app chạy ở cổng 3000. Không đụng tới cổng này; kiểm giao diện bằng bản production ở một cổng khác.
