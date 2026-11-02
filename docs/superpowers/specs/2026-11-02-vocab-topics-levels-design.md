# Từ vựng theo chủ đề và cấp độ CEFR — thiết kế

## Vì sao

Tab **Từ vựng** ở trang Học tập đang là một lưới dài 422 từ, không chọn được gì. Chủ app muốn:

- học theo **từng chủ đề**;
- biết mỗi từ ở **cấp độ nào** theo khung CEFR (A1, A2, B1, B2, C1, C2), để học từ dễ tới khó.

Chủ app bỏ qua phần hỏi và để tôi tự chốt. Mọi quyết định dưới đây là của tôi, chủ app duyệt khi đọc.

## Hiện trạng

- `content/vocabulary.jsonl` có 422 từ. Mỗi từ đã có `topic`, gồm 13 chủ đề: jobs 72, emotions 47, time 31, clothing 30, together 30, home 29, food 28, relationships 28, activities 26, possessions 26, special occasions 26, introductions 25, countries 24.
- Chưa từ nào có cấp độ.
- Tab Từ vựng là một `VocabCard` với lưới đổi số cột theo màn hình (`sm:`/`md:`/`lg:`), trái quy tắc container query của CLAUDE.md.

## Mục tiêu

- Mỗi từ có trường `level` là một trong `A1`, `A2`, `B1`, `B2`, `C1`, `C2`.
- Tab Từ vựng mở ra là **lưới chủ đề**. Mỗi ô chủ đề có:
  - tên tiếng Việt;
  - số từ;
  - số từ đã học;
  - thanh tiến độ.
- Bấm một chủ đề thì thấy các từ của chủ đề đó, **chia theo cấp độ** từ A1 lên. Có nút quay về tất cả chủ đề.
- Một dải nút **lọc theo cấp độ** (Tất cả, A1…C2), dùng được ở cả hai màn. Lọc thì số từ trên ô chủ đề cũng đổi theo.
- Thẻ từ hiện nhãn cấp độ cạnh loại từ.
- Đánh dấu đã học vẫn như cũ, và tiến độ trên ô chủ đề đổi ngay.

## Không làm (lần này)

- Chọn chủ đề hay cấp độ cho Trò chơi, cho phần ôn hằng ngày ("Hôm nay") hay cho Tổng quan.
- Thêm từ mới, đổi chủ đề của từ, đổi nghĩa.
- Nhớ chủ đề hay cấp độ đang chọn sau khi rời trang.

## Điều không được xảy ra

- Một từ biến mất khỏi tab Từ vựng: thiếu chủ đề, chủ đề lạ hay thiếu cấp độ đều vẫn phải hiện.
- Thay đổi dữ liệu học của người dùng (`study-data`: đã học, lịch ôn). Chỉ có file nội dung đổi.
- Diff của `vocabulary.jsonl` làm đổi gì khác ngoài việc thêm `"level"`.

## Quyết định của tôi

- **Nguồn cấp độ:** danh sách *Oxford 3000/5000 by CEFR level* (A1–C1) trên Oxford Learner's Dictionaries.
  - Cách chọn cấp độ:
    - Từ khớp danh sách thì lấy cấp độ trong đó.
    - Danh từ số nhiều (shorts, socks…) thì tra theo số ít.
    - Cụm từ ("wait for", "major in …") lấy cấp độ cao nhất trong các từ chính, bỏ qua giới từ và từ đệm như to, for, in, something.
    - Tên nước, quốc tịch: A1.
    - Từ không có trong danh sách (startup, flip-flops…) thì tôi ước lượng theo khung CEFR. C2 chỉ dùng cho từ thật hiếm.
  - Hiện khớp thẳng được khoảng 229/422 từ. Mọi từ phải ước lượng được liệt kê trong một file để chủ app duyệt lúc kiểm tay.
- **`level` bắt buộc trong file nội dung:** build báo lỗi đúng dòng nếu một từ thiếu `level` hay sai giá trị, giống các field bắt buộc khác. Kiểu `VocabEntry.level` để tuỳ chọn, để dữ liệu test viết tay không phải sửa; từ không có cấp độ hiện ở nhóm "Chưa xếp cấp".
- **Tên chủ đề tiếng Việt** (slug trong file giữ nguyên, thứ tự đi từ dễ tới khó):

  | Slug | Tên hiện |
  |---|---|
  | introductions | Giới thiệu bản thân |
  | countries | Quốc gia |
  | home | Nhà cửa |
  | food | Ăn uống |
  | clothing | Quần áo |
  | possessions | Đồ đạc cá nhân |
  | time | Thời gian rảnh |
  | activities | Học tập & hoạt động |
  | jobs | Nghề nghiệp |
  | relationships | Các mối quan hệ |
  | together | Kết nối bạn bè |
  | emotions | Cảm xúc |
  | special occasions | Dịp đặc biệt |

  Chủ đề lạ hiện bằng chính slug viết hoa chữ đầu và đứng sau 13 chủ đề trên. Từ không có chủ đề vào nhóm "Khác", đứng cuối.
- **Câu chữ:**
  - Card lưới chủ đề: `Chủ đề · {số chủ đề}`, góc phải `Đã học {x}/{tổng}`.
  - Ô chủ đề: `{n} từ`, `Đã học {x}/{n}`.
  - Dải lọc: nhóm nút tên "Lọc theo cấp độ"; nút "Tất cả" và `A1 · {n}` cho từng cấp có từ.
  - Dòng chú thích dưới dải lọc: `A1–A2: cơ bản · B1–B2: trung cấp · C1–C2: nâng cao`.
  - Màn một chủ đề:
    - Card `{tên chủ đề} · {n} từ`;
    - nút "Tất cả chủ đề";
    - tiêu đề nhóm `{cấp} · {n} từ`.
  - Chỗ trống: `Chưa có từ {cấp} nào.` ở lưới chủ đề, `Chưa có từ {cấp} nào trong chủ đề này.` ở màn một chủ đề.
- **Trạng thái chọn** (chủ đề, cấp độ) nằm ở `StudyView`. Chuyển qua tab khác rồi quay lại vẫn giữ; tải lại trang thì về mặc định.
- **Bố cục:** lưới trong Card theo container query, ô chủ đề 2 cột ở điện thoại. Lưới thẻ từ dùng `@md:`/`@2xl:`/`@4xl:`, tối đa 6 cột như hiện nay.

## Ràng buộc

- Theo CLAUDE.md:
  - logic nhóm và lọc nằm trong `src/features/study/`, vì chỉ trang Học tập dùng;
  - test trong `__tests__/`;
  - Prettier;
  - không thêm thư viện.
- Danh sách Oxford chỉ dùng lúc xếp cấp độ (một script chạy một lần, ngoài repo), không đưa vào repo hay vào app.
