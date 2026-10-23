# Tặng vàng/bạc từ tích lũy — thiết kế

## Vì sao

Chủ app thỉnh thoảng lấy một ít vàng hoặc bạc đang tích lũy (ví dụ 1 phân vàng) để tặng người khác. Hiện app chưa có cách ghi việc này. Cách duy nhất là vào tab Tích lũy, sửa giảm số lượng của một lần mua bất kỳ. Làm vậy thì:

- mất dấu vết: không còn biết đã tặng gì, bao nhiêu, khi nào;
- trang Chi tiêu không thấy gì.

Nếu thay vào đó ghi món quà thành một **khoản chi** bình thường thì sai sổ sách:

- tháng tặng quà không có đồng tiền mặt nào ra khỏi ví;
- tiền mua vàng đã được tính lúc mua: từ khi có app, chủ app ghi lần mua vào tab Tích lũy và ghi luôn một khoản chi trong tháng; vàng mua từ trước khi có app thì tiền đã ra từ trước;
- tính thêm một khoản chi lúc tặng thì cuối tháng chốt sổ sẽ rút sổ tiết kiệm bù vào, tức tài sản bị trừ hai lần.

## Mục tiêu

- Ghi được một lần tặng vàng/bạc lấy ra từ một lần mua cụ thể. Số đang giữ, giá vốn và Tài sản ròng giảm đúng phần đã tặng.
- Giữ lịch sử các lần tặng: xem lại, sửa, huỷ.
- Trang Chi tiêu thấy được các lần tặng trong tháng, **chỉ để xem**, không ảnh hưởng tiền tháng đó.
- Vàng và bạc làm giống hệt nhau. Tab bạc dùng chung bộ component `metal-*` với tab vàng, nên làm một lần cho cả hai, chỉ khác cấu hình trong `metal-config.ts`.

## Không làm (lần này)

- **Bán vàng/bạc lấy tiền.** Sẽ làm sau, với một **nút riêng**, không gộp chung thao tác với "Tặng". Hướng đã bàn sơ bộ:
  - nhập số tiền thực nhận và chọn sổ tiết kiệm nhận tiền;
  - ghi lãi/lỗ đã chốt.
- Tặng mà không chỉ ra lấy từ lần mua nào, kiểu trừ chung vào tổng.
- Mục tiêu, Tổng quan hay biểu đồ riêng cho quà tặng.

## Điều không được xảy ra

- Lần tặng làm thay đổi "đã chi", tổng theo ngày, biểu đồ theo tag, số còn phải tất toán hay kết quả chốt sổ của Chi tiêu.
- Tặng xong, Tài sản ròng vẫn tính phần đã tặng như đang giữ.
- Huỷ một lần tặng mà số lượng không trở về đúng lần mua cũ.
- Mất lần tặng khi sao lưu/khôi phục hay đồng bộ cloud.

## Chủ app đã chốt

- **Thao tác:** mỗi lần mua trong tab Tích lũy vàng/bạc có nút **"Tặng"**. Bấm vào thì nhập:
  - số lượng: số nguyên, đơn vị của kim loại đó (phân với vàng, lượng với bạc), không quá số còn lại của lần mua đó;
  - ngày tặng;
  - ghi chú tặng ai (không bắt buộc).
- **Lần mua bị trừ:** số còn lại của lần mua = số đã mua − tổng đã tặng từ lần mua đó. Số đang giữ, giá vốn, giá trị và Tài sản ròng đều tính theo số còn lại.
- **Hiển thị lần mua:**
  - trong bảng và thẻ giao dịch, lần mua hiện số còn lại, kèm một dòng nhỏ kiểu "đã tặng 1 phân";
  - lần mua đã tặng hết thì không nằm trong danh sách các lần mua đang giữ nữa, nhưng vẫn thấy qua lịch sử tặng.
- **Trị giá một lần tặng** = số lượng tặng × **giá mua của chính lần mua đó** ("rút ra sao thì ghi như vậy"). Con số cố định, không chạy theo giá thị trường.
  - Riêng Tài sản ròng thì giảm theo giá hôm nay của phần đã tặng, vì vàng/bạc đang giữ vốn được định giá theo giá hôm nay. Hai con số có thể lệch nhau, và như vậy là đúng.
- **Lịch sử tặng** nằm ở tab Tích lũy, mỗi lần tặng một dòng: ngày, số lượng, lấy từ cửa hàng nào, trị giá, tặng ai.
  - Sửa và huỷ một lần tặng làm ở đây.
  - Huỷ thì số lượng trả về đúng lần mua cũ.
- **Ở trang Chi tiêu:** trong thẻ "Khoản chi tháng này" có khối **"Quà tặng từ tích lũy"**, đặt cạnh khối "Chốt sổ" và làm theo cùng kiểu (`src/features/budget/components/closing-block.tsx`).
  - Mỗi lần tặng **có ngày tặng thuộc tháng đang xem** là một dòng, ví dụ "12/10 · Tặng 1 phân vàng (SJC) · 900.000 ₫ · cho mẹ".
  - Khối chỉ để xem: không nút, không sửa ở đây, không cộng vào "đã chi", không vào tổng ngày hay biểu đồ, không ảnh hưởng chốt sổ.
  - Tháng nào không có lần tặng thì khối không hiện.
- **Dữ liệu:** các lần tặng đi theo khi xuất/nhập file, đồng bộ cloud và "Bắt đầu lại", giống mọi dữ liệu Tài chính khác.

## Ràng buộc

- Theo CLAUDE.md:
  - feature-sliced: code dùng chung ≥ 2 feature đặt ở `src/lib/`;
  - Chi tiêu đọc dữ liệu tặng qua `src/lib/finance`, không import `src/features/finance`;
  - tên định danh tiếng Anh, chữ hiển thị tiếng Việt;
  - token `--ob-*`; container query bên trong Card;
  - quy tắc hook đọc/ghi localStorage: đọc tươi trước khi ghi, `safeArray` theo từng phần tử, một hàm `parse*` cho cả domain.
- Lần tặng nằm trong key `"finance-data"` cùng vàng/bạc (qua `parseFinanceState`). Dữ liệu cũ không có lần tặng thì đọc ra rỗng, không cần migrate.
- "Ẩn số tiền" áp dụng cho mọi số tiền mới.
- Tab vàng hiện có rất nhiều test khoá chữ và DOM. Phần không liên quan tới tặng phải giữ y nguyên.

## Quyết định của tôi (chủ app chưa nói, có thể đổi)

- **Cách lưu:**
  - giữ nguyên số lượng gốc của lần mua;
  - mỗi lần tặng là một bản ghi riêng `{ id, purchaseId, date, qty, note? }`, trong danh sách riêng cho từng kim loại;
  - số còn lại của lần mua được tính ra, không ghi đè lên lần mua.

  Lý do: lịch sử mua giữ đúng, và huỷ tặng chỉ là xoá bản ghi tặng.
- **Lần tặng chụp lại cửa hàng và giá mua** tại thời điểm tặng. Sau đó có sửa hay đổi tên lần mua, cửa hàng thì dòng lịch sử vẫn ghi đúng "rút ra sao".
- **Chặn những thao tác làm hỏng liên kết**, kèm thông báo lý do:
  - không xoá được lần mua còn lần tặng gắn vào. Id lần mua cấp bằng `nextId` (lớn nhất + 1), nên id của lần mua vừa xoá có thể bị lần mua mới lấy lại; không chặn thì lần tặng cũ sẽ gắn nhầm vào lần mua mới. Muốn xoá thì huỷ các lần tặng của nó trước;
  - không sửa số lượng lần mua xuống thấp hơn tổng đã tặng.
- **Ngày tặng** là ô chữ dd/mm/yyyy giống ô ngày mua, điền sẵn ngày hôm nay.
- **Tên thao tác:** "Tặng".
- **Phần hiển thị dùng chung chuyển xuống `src/lib/finance/`:** danh từ ("vàng"/"bạc"), đơn vị ("phân"/"lượng") và cách hiện khối lượng ("1 chỉ 2 phân", "3 lượng"). Lý do: trang Chi tiêu cũng phải viết "Tặng 1 phân vàng" mà không được import feature Tài chính. `src/features/finance/metal-config.ts` dùng lại phần này.
- **Lần mua còn dưới 1 đơn vị thì khoá nút "Tặng".** Trường hợp này chỉ gặp với vàng cũ có phân lẻ, ví dụ còn 0,3 phân, vì số tặng phải là số nguyên. Phần lẻ đó vẫn tính vào số đang giữ.

## Hệ quả cần biết (không cần làm thêm)

- Mục tiêu "Tích lũy 18 chỉ vàng" và các số vàng/bạc ở Tổng quan cũng giảm sau khi tặng, vì chúng đọc cùng số đang giữ. Đúng với ý "số đang giữ giảm đúng phần đã tặng".
- Lịch sử Tài sản ròng chỉ thay đổi từ ngày tặng trở đi; các ngày trước giữ nguyên.

## Để người làm tự quyết

- Bố cục cụ thể của nút "Tặng", hộp nhập và mục "Lịch sử tặng" trong tab. Tuân theo các mẫu đang có: `Modal`, `AlertDialog`, `Field`, thẻ/bảng giao dịch.
- Lần mua đã tặng hết có tính vào số "lần lãi/lần lỗ" và "Các lần mua · N lần" hay không. Gợi ý: không tính, vì không còn giữ.
- Cửa hàng chỉ còn lần mua đã tặng hết có xoá được không, và đổi tên cửa hàng có lan sang bản chụp trong lịch sử tặng không.
- Có thêm "N lần tặng" vào hộp xác nhận khôi phục và số liệu "Bắt đầu lại" hay không.
- Ngày tặng có được trước ngày mua không.
