// Đường dẫn trên Vercel Blob của bản đồng bộ và các bản cũ — dùng chung cho /api/sync và /api/sync/history.
const SYNC_PATHNAME = "sync/snapshot.json"
const SYNC_HISTORY_PREFIX = "sync/history/"
// Mỗi lần tải lên cất bản đang có vào lịch sử trước khi thay; chỉ giữ chừng này bản gần nhất.
const SYNC_HISTORY_KEEP = 10

// Mã 1 bản cũ = mốc ms lúc bản đó được tải lên. Chỉ nhận chữ số: mã đi thẳng vào đường dẫn Blob, không được trỏ ra
// ngoài thư mục lịch sử.
function isSyncVersionId(id: string): boolean {
  return /^\d{1,15}$/.test(id)
}

function syncVersionPathname(id: string): string {
  return `${SYNC_HISTORY_PREFIX}${id}.json`
}

function syncVersionIdFromPathname(pathname: string): string | null {
  if (!pathname.startsWith(SYNC_HISTORY_PREFIX) || !pathname.endsWith(".json")) return null
  const id = pathname.slice(SYNC_HISTORY_PREFIX.length, -".json".length)
  return isSyncVersionId(id) ? id : null
}

export {
  SYNC_HISTORY_KEEP,
  SYNC_HISTORY_PREFIX,
  SYNC_PATHNAME,
  isSyncVersionId,
  syncVersionIdFromPathname,
  syncVersionPathname,
}
