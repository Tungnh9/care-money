# CLAUDE.md
@AGENTS.md

## Git workflow

- **`developer` là branch nền.** Không bao giờ commit trực tiếp lên `developer` hoặc `main` — luôn tách branch mới trước khi bắt đầu task mới.
- **Đặt tên branch**: `<type>/<mô-tả-ngắn>`, ví dụ `feat/shadcn-setup`, `fix/login-redirect`.
- **Các loại `<type>`**:

  | Type | Dùng khi |
  | --- | --- |
  | `feat` | Thêm tính năng hoặc nội dung mới |
  | `fix` | Sửa lỗi |
  | `change` | Điều chỉnh cái đã có — không phải sửa lỗi, không phải tính năng hoàn toàn mới |
  | `chore` | Việc lặt vặt: cập nhật dependency, cấu hình, tooling — không đổi hành vi |
  | `docs` | Chỉ sửa tài liệu (CLAUDE.md, README...) |
  | `refactor` | Đổi cấu trúc code, không đổi hành vi |

- **Commit message dùng cùng tiền tố**: `feat: ...`, `fix: ...`, `change: ...`.
- **Quy trình**: làm xong task trên branch riêng → báo lại để duyệt → merge vào `developer` → mới tách branch cho task tiếp theo.