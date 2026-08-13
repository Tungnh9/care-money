# `.claude/` — khung cấu hình Claude Code cho project này

Thư mục này chứa cấu hình riêng cho Claude Code khi làm việc trong project. Đây là bộ khung để điền dần — hiện tại đa số là placeholder.

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
