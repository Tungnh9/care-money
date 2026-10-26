# Bán vàng/bạc lấy tiền — thiết kế

## Vì sao

Tab Tích lũy vàng/bạc đã có mua, giữ và tặng, nhưng chưa có **bán**. Khi chủ app bán một phần vàng/bạc lấy tiền:

- số đang giữ phải giảm;
- tiền nhận về phải vào một sổ tiết kiệm (chủ app đã chọn: **gửi vào sổ tiết kiệm**);
- phải biết lần bán đó lời hay lỗ thật bao nhiêu.

Hiện chỉ có cách sửa tay số lượng lần mua, rồi tự cộng tiền vào sổ. Làm vậy thì mất dấu vết và không có lãi/lỗ đã chốt.

## Mục tiêu

- Ghi một lần bán lấy ra từ một lần mua cụ thể. Tiền thực nhận được cộng vào sổ tiết kiệm đã chọn, trong **cùng một lần ghi** với lần bán.
- Lần mua còn lại = đã mua − đã tặng − đã bán. Số đang giữ, giá vốn, giá trị và Tài sản ròng tính theo số còn lại.
- Lãi/lỗ đã chốt của lần bán = tiền thực nhận − số lượng × giá mua của lần mua đó.
- Có "Lịch sử bán" để xem lại và **huỷ** một lần bán: số lượng về lại lần mua, tiền được rút lại khỏi sổ đã nhận.
- Trang Chi tiêu thấy được các lần bán trong tháng, **chỉ để xem**.
- Vàng và bạc làm như nhau, qua bộ component `metal-*` và cấu hình `metal-config.ts` dùng chung.

## Không làm (lần này)

- Sửa một lần bán. Muốn đổi thì huỷ rồi bán lại.
- Bán mà không chỉ ra lấy từ lần mua nào.
- Bán lấy tiền mặt không vào sổ nào.
- Đưa lần bán vào hộp xác nhận khôi phục hay vào số liệu "Bắt đầu lại", cùng lý do như lần tặng.

## Điều không được xảy ra

- Sổ đã cộng tiền mà lần bán chưa được ghi, hoặc ngược lại.
- Huỷ lần bán mà tiền không được rút lại, hoặc rút từ nhầm sổ.
- Lần bán làm thay đổi "đã chi", tổng theo ngày, biểu đồ hay chốt sổ của Chi tiêu.
- Tài sản ròng vẫn tính phần đã bán như đang giữ.
- Mất lần bán khi sao lưu/khôi phục hay đồng bộ cloud.

## Chủ app đã chốt

- **Nút "Bán" riêng** trên mỗi lần mua, cạnh nút Tặng. Bấm vào thì nhập:
  - ngày bán;
  - số lượng: số nguyên, không quá số còn lại;
  - **tổng số tiền thực nhận**;
  - sổ tiết kiệm nhận tiền, chọn bằng nút chọn sổ (`FundPicker`) như lúc chốt sổ.
- **Lưu xong:** số còn lại của lần mua giảm theo, sổ được cộng tiền. Tài sản ròng chỉ đổi đúng phần chênh giữa tiền nhận và giá hôm nay của phần đã bán.
- **"Lịch sử bán"** là thẻ riêng, đặt cạnh "Lịch sử tặng". Mỗi dòng có ngày, số lượng, cửa hàng, tiền nhận, sổ nhận và lãi/lỗ đã chốt.
- **Huỷ một lần bán:** số lượng về lại lần mua, tiền rút lại khỏi sổ đã nhận. Sổ đã xoá hoặc không đủ tiền thì không cho huỷ, kèm lời giải thích.
- **Ở Chi tiêu:** lần bán trong tháng hiện chung khối với quà tặng, khối đổi tên thành **"Vàng/bạc tháng này"**. Khối chỉ để xem: không cộng vào "đã chi", không vào biểu đồ hay chốt sổ.

## Ràng buộc

- Theo CLAUDE.md:
  - feature-sliced, Chi tiêu chỉ đọc qua `src/lib/finance`;
  - quy tắc hook localStorage: đọc tươi trước khi ghi, `safeArray` theo từng phần tử, một hàm `parse*` cho cả domain;
  - container query bên trong Card;
  - `src/` phải đúng định dạng Prettier.
- Lần bán nằm trong key `"finance-data"` (`goldSales`, `silverSales`) cùng vàng/bạc và sổ tiết kiệm. Dữ liệu cũ không có các key này thì đọc ra rỗng.
- "Ẩn số tiền" áp dụng cho mọi số tiền mới.
- Phần vàng/bạc hiện có (mua, tặng, cửa hàng) giữ nguyên hành vi, trừ những chỗ phải tính cả phần đã bán.

## Quyết định của tôi (chủ app chưa nói, có thể đổi)

- **Cách lưu:** giống lần tặng, mỗi lần bán là một bản ghi riêng `{ id, purchaseId, date, qty, store, buy, received, fundName, fundRemoved?, note? }`.
  - `store` và `buy` chụp lại từ lần mua lúc bán.
  - `received` là tổng tiền nhận, số nguyên dương.
  - `fundName` là tên sổ nhận tiền (sổ tiết kiệm vốn định danh bằng tên).
- **Đổi tên sổ tiết kiệm thì đổi theo trong mọi lần bán đã gửi vào sổ đó**, cùng một lần ghi. Không làm thì lúc huỷ không tìm thấy sổ.
- **Xoá sổ vẫn được.** Các lần bán đã gửi vào sổ đó được đánh dấu `fundRemoved: true` ngay trong cùng lần ghi xoá sổ, theo đúng cách xoá thẻ tín dụng đang gỡ liên kết khỏi khoản chi. Lần bán đã đánh dấu thì ghi tên sổ kèm "(đã xoá)" và không huỷ được nữa.
  - Không suy "đã xoá" theo tên sổ, vì tạo lại sổ trùng tên sẽ làm lần bán cũ huỷ được và rút nhầm tiền từ sổ mới.
- **Chặn làm hỏng liên kết, giống lần tặng:**
  - không xoá được lần mua đã có lần bán;
  - không sửa số lượng lần mua xuống dưới tổng đã tặng và đã bán;
  - không dời ngày mua qua ngày tặng hay ngày bán sớm nhất.
- **Nút Bán bị khoá khi lần mua còn dưới 1 đơn vị, hoặc khi chưa có sổ tiết kiệm nào.** Modal không lưu được nếu chưa chọn sổ.
- **Ngày bán** điền sẵn hôm nay, không được trước ngày mua.
- **Ghi chú** không bắt buộc, có ô nhập trong modal như modal Tặng.
- **Tiền nhận** là số nguyên từ 1 đến 999.999.999.999 đ, cùng mức trần với số tiền ở Chi tiêu (`MAX_BUDGET_AMOUNT`). Schema đọc `received` bằng `z.number()` (không `.int()`) để không bao giờ làm rơi một lần bán đã ghi.
- **Modal Bán hiện trước lãi/lỗ sẽ chốt** khi đã nhập đủ số lượng và tiền nhận.
- **Thẻ "Lịch sử bán" ghi tổng lãi/lỗ đã chốt** ngay trên danh sách.
- **Ở Chi tiêu**, dòng bán ghi "Bán 2 phân vàng", dòng phụ "15/09 · SJC · vào Quỹ dự phòng", bên phải là tiền nhận, màu chữ thường. Khối tên "Vàng/bạc tháng này".
- **Dòng phụ dưới lần mua** ghi gộp, ví dụ "đã tặng 1 phân · đã bán 2 phân".

## Để người làm tự quyết

- Bố cục cụ thể của nút Bán, modal và thẻ Lịch sử bán. Theo mẫu của Tặng: `MetalGiftModal`, `MetalGiftHistoryCard`, bố cục lưới theo bề rộng Card.
- Icon cho nút Bán.
- Câu chữ cụ thể của các thông báo lỗi và toast, giữ cùng giọng với phần Tặng.
