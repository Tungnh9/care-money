# `.claude/` — khung cấu hình Claude Code cho project này

Thư mục này chứa cấu hình riêng cho Claude Code khi làm việc trong project. Phần khung Claude Code (agents/rules/skills/settings) để điền dần — hiện tại đa số là placeholder. Phần dưới đây là tài liệu tham khảo về cấu trúc thư mục và component thật của app Orange Banana, cập nhật khi có thay đổi lớn (quy ước/luật xem `CLAUDE.md`, đây chỉ là bản đồ hiện trạng).

## Cấu trúc thư mục dự án

```
src/
├── app/                  # routing thuần (Next.js App Router) — page.tsx là shell mỏng
│   ├── layout.tsx        # root layout: nạp font, bọc <AuthGuard>
│   ├── login/            # trang đăng nhập (/login)
│   └── sandbox/          # trang tạm xem trực quan các component ui/ob
├── features/             # business logic theo feature — xem CLAUDE.md mục Feature Rules
│   └── login/            # feature đăng nhập: components/, hooks/, schemas.ts, api.ts, mock-data.ts
├── components/
│   ├── ui/               # component nền từ shadcn/ui, custom theo token --ob-*
│   ├── ob/                # component riêng Orange Banana, không có primitive shadcn tương ứng
│   └── auth-guard.tsx    # bọc root layout, check localStorage, đẩy về /login nếu chưa đăng nhập
├── lib/                  # helper dùng chung ≥ 2 feature (cn(), auth.ts)
└── test/                 # setup file cho Vitest

content/                  # dữ liệu JSONL (từ vựng/ngữ pháp) — dữ liệu, không phải code
public/assets/            # logo, icon SVG từ bản bàn giao thiết kế
```

## Component hiện có

### `components/ui/` — nền shadcn/ui, custom theo token `--ob-*`

| Component | Props chính |
| --- | --- |
| `Button` | `variant` primary/secondary/reward/ghost · `size` sm/md/lg · `fullWidth` |
| `Card` | `tone` plain/invert/reward/soft · `label` · `action` · `elevated` |
| `Switch` | `label` · `hint` · `checked` · `onCheckedChange` |
| `Progress` | `value` · `track` · `tone` reward/action · `label` · `hint` |
| `Field` | `label` · `hint` · `prefix` · `suffix` · `numeric` · `group` (format số kiểu `vi-VN`) |
| `Tag` | `module` taichinh/hoctap/ghichu/tamtrang/muctieu/kehoach |
| `Checkbox`, `Input`, `Label` | primitive gốc shadcn — dùng làm nền cho các component trên, ít khi gọi trực tiếp |

### `components/ob/` — không có primitive shadcn tương ứng, viết riêng

| Component | Props chính |
| --- | --- |
| `Figure` | `value` · `unit` · `delta` · `direction` up/down · `caption` · `size` lg/sm |
| `Streak` | `days` · `done` · `icon` |
| `TaskItem` | `label` · `done` · `onToggle` |

### Khác

| Component | Vị trí | Vai trò |
| --- | --- | --- |
| `AuthGuard` | `src/components/auth-guard.tsx` | Bọc `children` trong root layout, check user trong `localStorage` (qua `src/lib/auth.ts`), đẩy về `/login` nếu chưa đăng nhập; hiện spinner trong lúc chờ check |

## `agents/`

Subagent riêng cho project (khác với các agent chung như `Explore`, `Plan`). Mỗi agent là 1 file `.md` với frontmatter `name` + `description`, tuỳ chọn `tools` (giới hạn tool được dùng) và `model`. Dùng khi có một loại tác vụ lặp lại trong project này mà bạn muốn giao cho một agent có system prompt/tool riêng.

## `rules/`

Giống `CLAUDE.md` nhưng **tải có điều kiện** thay vì luôn tải. Thêm frontmatter `paths: ["src/api/**"]` để rule chỉ nạp khi Claude làm việc với file khớp path đó. Dùng cho quy ước chỉ áp dụng cho một phần của codebase (ví dụ riêng cho `app/api/`), để không tốn context ở mọi session.

## `skills/`

Mỗi skill là 1 thư mục `.claude/skills/<tên>/SKILL.md`. Chỉ dòng `description` trong frontmatter được tải sẵn ở mọi session (rất rẻ); toàn bộ nội dung skill chỉ tải khi được gọi — qua lệnh `/tên` (thủ công) hoặc Claude tự nhận thấy phù hợp (tự động, trừ khi đặt `disable-model-invocation: true`). Xem ví dụ đầy đủ ở `skills/agent-skill/`. Muốn tạo skill mới thì copy nguyên thư mục `agent-skill/` rồi đổi tên + nội dung.

## `settings.json` vs `settings.local.json`

- `settings.json` — **commit vào git**, áp dụng cho mọi người dùng chung repo (permissions, hooks, enabledPlugins...). Hiện đang để `{}`.
- `settings.local.json` — **không commit** (đã thêm vào `.gitignore`), dùng cho override cá nhân trên máy riêng (API key test, permission riêng...). Chưa tạo sẵn file này — tự tạo khi cần.

Ví dụ nội dung `settings.json` khi cần dùng thật:
```json
{
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": ["Bash(git status)", "Bash(git diff)"]
  }
}
```

## `.mcp.json` (ở gốc repo, **không phải trong `.claude/`**)

MCP server (kết nối tới tool/server bên ngoài) riêng cho project này — khác với plugin cài ở cấp user (`~/.claude/settings.json`). File nằm ở `/.mcp.json` (cùng cấp `package.json`), hiện để `{"mcpServers": {}}`. Ví dụ khi cần thêm 1 server:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "my-mcp-server"]
    }
  }
}
```
