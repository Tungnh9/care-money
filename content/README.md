# Kho từ vựng & ngữ pháp

Nguồn dữ liệu cho tính năng "5 từ vựng + 1 ngữ pháp random theo ngày" của module **Học tập** (Orange Banana). Chưa có code đọc 2 file này — đó là việc của sub-project Học tập sau này.

## Định dạng: JSONL

Mỗi dòng là 1 object JSON độc lập (không phải 1 array bao ngoài) — thêm bản ghi mới chỉ cần append thêm dòng, không sửa dòng cũ, giữ diff git sạch khi nội dung tăng dần theo thời gian.

### `vocabulary.jsonl`

```jsonc
{"id": "v-0001", "word": "resilient", "pos": "adj.", "phonetic": "/rɪˈzɪliənt/", "meaning": "kiên cường, bền bỉ", "example": "She stayed resilient through the setback.", "topic": "tính cách", "addedAt": "2026-08-11"}
```

| Field | Bắt buộc | Ghi chú |
| --- | --- | --- |
| `id` | có | `v-0001`, `v-0002`... tăng dần theo thứ tự thêm |
| `word` | có | từ tiếng Anh (có thể kèm `...` nếu là cụm, ví dụ `offer ... (to ...)`) |
| `pos` | không | loại từ, giữ đúng ký hiệu nguồn: `v.`, `n.`, `adj.`, `adv.`, `phr.`, `v. phr.`... |
| `phonetic` | không | phiên âm IPA |
| `meaning` | có | nghĩa tiếng Việt (không kèm loại từ, đã tách ra field `pos`) |
| `example` | không | câu ví dụ |
| `topic` | không | chủ đề (tự do, không cần danh sách cố định) |
| `addedAt` | có | ngày xử lý ảnh, không phải ngày trong ảnh gốc |

### `grammar.jsonl`

```jsonc
{"id": "g-0001", "title": "Present Perfect vs Past Simple", "explanation": "Dùng Present Perfect khi...", "examples": ["I have lived here for 5 years.", "I lived there in 2015."], "addedAt": "2026-08-11"}
```

| Field | Bắt buộc | Ghi chú |
| --- | --- | --- |
| `id` | có | `g-0001`, `g-0002`... |
| `title` | có | tên điểm ngữ pháp |
| `explanation` | có | giải thích tiếng Việt |
| `examples` | không | mảng câu ví dụ |
| `addedAt` | có | ngày xử lý |

## Quy trình thêm mới

Người dùng gửi ảnh (chụp/màn hình) → Claude đọc ảnh, trích nháp → **xác nhận với người dùng trước khi lưu** (ảnh dễ đọc sai, đặc biệt dấu tiếng Việt) → append vào file tương ứng.
