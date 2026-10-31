# Trang "Plan cuộc đời" — thiết kế

## Vì sao

Trang **Mục tiêu** dành cho chuyện đường dài, ví dụ quỹ mua xe. Chủ app muốn thêm một chỗ ghi lại **cuộc sống hằng ngày và tiến trình của nó**. Chỗ đó gồm:

- những chặng đã đi qua, có ảnh kỷ niệm;
- những việc muốn làm trong tương lai.

Tất cả nằm trên **một dòng thời gian**. Đây là **trang mới**. Trang **Làm việc** giữ nguyên, không đụng tới.

## Mục tiêu

- Ghi nhanh một **ghi chép**: ngày, tiêu đề, nội dung, kèm nhiều ảnh.
- Xem mọi ghi chép trên một dòng thời gian, có vạch **"Hôm nay"** chia phần đã qua và phần sắp tới.
- Tạo **kế hoạch** cho những việc lớn. Mỗi kế hoạch có:
  - tên;
  - thời điểm muốn đạt;
  - trạng thái *dự định / đang làm / đã đạt*.

  Ghi chép **có thể gắn** vào một kế hoạch, hoặc không gắn gì.
- Bấm vào một kế hoạch thì chỉ thấy các ghi chép của kế hoạch đó, tức cả chặng tiến trình.
- Ảnh được lưu trên cloud, nên mở app ở máy khác vẫn thấy. Phải chịu được **nhiều ảnh**: chủ app chưa biết sẽ đưa lên bao nhiêu, nên cứ tính là nhiều, kể cả nhập bù kỷ niệm cũ.

## Không làm (lần này)

- Thẻ "Plan cuộc đời" ở trang Tổng quan.
- Nối kế hoạch với Mục tiêu hay quỹ tiết kiệm.
- Video, file khác ngoài ảnh, hay soạn văn bản định dạng (in đậm, danh sách…). Nội dung là chữ thường, giữ xuống dòng.
- Nhắc việc, thông báo.
- Dọn ảnh mồ côi trên cloud. Ví dụ ảnh còn sót lại sau "Bắt đầu lại" hay sau khi khôi phục một bản sao lưu cũ.

## Điều không được xảy ra

- Ảnh làm hỏng **đồng bộ cloud**. Gói miễn phí của Vercel Blob chỉ cho 1GB, 2.000 lượt ghi và 10.000 lượt đọc mỗi tháng; vượt bất kỳ mức nào là Blob bị khoá 30 ngày, kéo theo đồng bộ ngừng. Vì vậy ảnh **không** nằm trên Vercel Blob.
- Mất ghi chép hay kế hoạch khi sao lưu, khôi phục hay đồng bộ cloud.
- Ảnh đời tư xem được bởi bất kỳ ai có link. Link ảnh có chữ ký không bao giờ đến được trình duyệt.
- Trang Làm việc hay các trang khác đổi hành vi.

## Chủ app đã chốt

- **Ghi chép là đơn vị chính** (ghi hằng ngày). **Kế hoạch là tuỳ chọn**, và ghi chép có thể gắn vào kế hoạch.
- **Dòng thời gian ghi cả quá khứ lẫn tương lai.**
- **Mỗi ghi chép có:** tiêu đề, nội dung, N ảnh, và vị trí trên dòng thời gian.
- **Ảnh lưu trên Cloudinary (gói miễn phí), tách khỏi Vercel Blob.** Vercel Blob chỉ để đồng bộ cloud như hiện nay. Gói miễn phí của Cloudinary có 25 "credit" mỗi tháng dùng chung (1 credit = 1GB lưu trữ, hoặc 1GB tải về, hoặc 1.000 lần xử lý ảnh). Dùng quá thì Cloudinary cảnh báo rồi có thể tạm khoá tài khoản ảnh, không tính tiền và không đụng tới đồng bộ.
- **Trang mới**, không xoá hay sửa trang Làm việc.

## Ràng buộc

- Theo CLAUDE.md:
  - feature `src/features/life-plan/` ↔ route `/life-plan`;
  - dữ liệu dùng chung ở `src/lib/life-plan/`;
  - quy tắc hook localStorage: `useStorageSync`, đọc tươi trước khi ghi, `safeArray` theo từng phần tử, một hàm `parse*` dùng chung cho đọc máy lẫn `parseImportPayload`;
  - bố cục trong Card theo container query;
  - Prettier, test trong `__tests__/`.
- Chữ ghi chép và kế hoạch nằm trong localStorage, dưới key riêng `"life-plan-data"`. Ảnh **không** nằm trong localStorage; ghi chép chỉ giữ mã ảnh trên Cloudinary (`public_id`) và kích thước.
- **Sao lưu, khôi phục và đồng bộ** mang theo `lifePlan` qua `data-transfer.ts`, giống cách đã thêm `work`. Bản sao cũ không có key này thì đọc ra rỗng, không cần tăng `EXPORT_VERSION`. File sao lưu chỉ có mã ảnh, không có ảnh; khôi phục ở máy khác vẫn xem được ảnh vì ảnh nằm trên Cloudinary.
- **"Bắt đầu lại"** xoá dữ liệu Plan cuộc đời trên máy, không đụng ảnh trên cloud (xem *Không làm*).
- **Ảnh phải nhỏ trước khi tải lên**, để tiết kiệm credit Cloudinary và vừa giới hạn 4,5MB mỗi request của Vercel Function.
- **Chủ app phải tự làm 1 việc:**
  - tạo tài khoản Cloudinary miễn phí;
  - thêm `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` vào Vercel (Production) và `.env.local`.

  Thiếu các biến này thì ghi chép bằng chữ vẫn chạy; nút thêm ảnh khoá kèm lời giải thích.
- **Không gọi dịch vụ trả phí**, app chỉ có một người dùng.

## Quyết định của tôi (chủ app chưa nói, có thể đổi)

- **Tên và chỗ trên thanh điều hướng:**
  - nhãn **"Plan cuộc đời"** (đúng chữ chủ app dùng), đường dẫn `/life-plan`;
  - đứng ngay sau "Mục tiêu", trước "Làm việc";
  - là một **module bật/tắt được** ở Cài đặt (key `kehoach`, mặc định bật). Trên điện thoại thanh dưới chật thì có thể tắt bớt module không dùng.
- **Ghi chép** `{ id, date, title, content, images[], planId? }`:
  - `date` là ngày dd/mm/yyyy, điền sẵn hôm nay, được chọn ngày tương lai;
  - tiêu đề bắt buộc;
  - nội dung không bắt buộc;
  - tối đa **10 ảnh** mỗi ghi chép;
  - sửa và xoá được.
- **Kế hoạch** `{ id, title, target, status, doneAt?, note? }`:
  - `target` là tháng/năm muốn đạt, năm bắt buộc, tháng tuỳ chọn;
  - chuyển sang *đã đạt* thì ghi `doneAt` là hôm nay;
  - sửa được;
  - xoá kế hoạch thì các ghi chép đã gắn **vẫn giữ**, chỉ bỏ gắn.
- **Dòng thời gian:**
  - một cột dọc, sắp **mới nhất ở trên** theo một chiều duy nhất, nên tương lai xa nhất nằm trên cùng;
  - vạch **"Hôm nay"** chen đúng chỗ giữa phần sắp tới và phần đã qua;
  - kế hoạch chưa đạt hiện như một mốc ở thời điểm muốn đạt; kế hoạch đã đạt hiện ở ngày `doneAt`;
  - ảnh trong ghi chép hiện thành lưới ảnh nhỏ, bấm vào thì xem to;
  - danh sách hiện dần từng đợt như danh sách lần mua vàng.
- **Lọc theo kế hoạch:** một dải nút chọn kế hoạch ở đầu trang. Chọn một kế hoạch thì dòng thời gian chỉ còn mốc của nó và các ghi chép đã gắn; bấm lại thì bỏ lọc.
- **Ảnh riêng tư trên Cloudinary:**
  - ảnh tải lên dạng `type: "authenticated"`; gói miễn phí chỉ cho xem loại này bằng link có chữ ký, không hết hạn;
  - **link có chữ ký chỉ được tạo và dùng trên server**: API của app `/api/life-plan/images` lấy ảnh từ Cloudinary rồi trả bytes về trình duyệt;
  - tải lên, xem và xoá đều đi qua API đó, kèm **khoá đồng bộ** đã nhập ở Cài đặt (`Authorization: Bearer`, cùng `SYNC_SECRET`);
  - gọi thẳng REST API của Cloudinary bằng `fetch` + chữ ký SHA-1 (`node:crypto`), **không thêm thư viện** `cloudinary`;
  - máy chưa nhập khoá thì vẫn ghi chép bằng chữ được, nhưng nút thêm ảnh bị khoá kèm lời nhắc vào Cài đặt nhập khoá;
  - ảnh tải về được **lưu lại trên máy** (IndexedDB), để mỗi ảnh chỉ tải từ cloud một lần trên mỗi máy, tiết kiệm credit tải về.
- **Thu nhỏ ảnh trên trình duyệt** trước khi tải lên: cạnh dài tối đa 1600px, định dạng WebP chất lượng khoảng 0,8, tức khoảng 150–400KB mỗi ảnh. Ảnh hỏng hay không phải ảnh thì báo lỗi và bỏ qua riêng ảnh đó.
- **Không tự chặn số ảnh.** Ảnh quá nhiều giờ chỉ ảnh hưởng Cloudinary, không còn ảnh hưởng đồng bộ. Trang vẫn hiện tổng dung lượng ảnh đã dùng, tính từ dữ liệu trên máy (mỗi ảnh lưu kèm kích thước), để chủ app tự theo dõi.
- **Xoá ghi chép, hay bỏ một ảnh khỏi ghi chép,** thì xoá ảnh đó trên Cloudinary. Xoá lỗi thì vẫn xoá trên máy và báo toast, chấp nhận còn ảnh mồ côi.
- **Chạy trên máy dev:** `.env.local` có khoá thật, nên ảnh tải lên từ `npm run dev` vào thẳng tài khoản thật. Ảnh được lưu trong thư mục tách theo môi trường, `life-plan/production/…` và `life-plan/development/…`, để dễ phân biệt và dọn.

## Để người làm tự quyết

- Bố cục cụ thể của dòng thời gian, form ghi chép và form kế hoạch (modal hay khung trên trang), màu theo trạng thái. Dùng token `--ob-*` và các component sẵn có (`Card`, `Field`, `Modal`, `AlertDialog`).
- Thư viện hay cách thu nhỏ ảnh. Ưu tiên canvas sẵn có của trình duyệt, không thêm phụ thuộc nặng.
- Câu chữ toast, câu báo lỗi, chỗ trống ("Chưa có ghi chép nào…"), giữ cùng giọng với các trang khác.
- Biểu tượng cho mục trên thanh điều hướng.
