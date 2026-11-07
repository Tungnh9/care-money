import { NextResponse, type NextRequest } from "next/server"
import { BlobNotFoundError, BlobPreconditionFailedError, copy, del, get, head, list, put } from "@vercel/blob"

import { parseImportPayload, uploadedSummary } from "@/lib/data-transfer"
import { checkSyncSecret } from "@/lib/sync-auth"
import {
  SYNC_HISTORY_KEEP,
  SYNC_HISTORY_PREFIX,
  SYNC_PATHNAME,
  isSyncVersionId,
  syncVersionIdFromPathname,
  syncVersionPathname,
} from "@/lib/sync-blob"

async function currentSnapshot() {
  try {
    return await head(SYNC_PATHNAME)
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null
    throw error
  }
}

// ETag từ head/put có thể có ngoặc kép hay tiền tố W/ tuỳ nguồn — so ở dạng trần.
function sameEtag(a: string | null, b: string | null): boolean {
  const bare = (etag: string) => etag.replace(/^W\//, "").replaceAll('"', "")
  return a !== null && b !== null && bare(a) === bare(b)
}

// ?version=<mã> lấy 1 bản cũ trong lịch sử thay vì bản hiện tại. Bản hiện tại trả kèm ETag (X-Sync-Etag) để máy
// tải xuống nhớ mình đang dựa trên bản nào; bản cũ thì không — nạp bản cũ không làm máy "bắt kịp" bản hiện tại.
// ETag đọc bằng head TRƯỚC khi đọc nội dung: máy khác tải lên chen giữa thì ETag cũ hơn nội dung, lần tải lên sau
// của máy này chỉ bị hỏi lại thừa 1 lần — đọc ngược thứ tự thì ETag mới hơn nội dung, và lần tải lên đó sẽ âm thầm
// ghi đè phần máy kia vừa thêm.
async function GET(request: NextRequest) {
  const authError = checkSyncSecret(request)
  if (authError) return authError

  const version = request.nextUrl.searchParams.get("version")
  if (version !== null && !isSyncVersionId(version)) {
    return NextResponse.json({ error: "Mã bản sao không hợp lệ." }, { status: 400 })
  }

  const meta = version ? null : await currentSnapshot()
  const result =
    version || meta
      ? await get(version ? syncVersionPathname(version) : SYNC_PATHNAME, { access: "private", useCache: false })
      : null
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json(
      { error: version ? "Không còn bản sao này trên đám mây." : "Chưa có bản đồng bộ nào." },
      { status: 404 }
    )
  }

  const text = await new Response(result.stream).text()
  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
      ...(meta ? { "X-Sync-Etag": meta.etag } : {}),
    },
  })
}

function conflict(cloudUploadedAt: Date | null) {
  return NextResponse.json(
    {
      error: "Bản trên đám mây đã đổi từ lần đồng bộ trước của máy này.",
      conflict: true,
      cloudUploadedAt: cloudUploadedAt ? cloudUploadedAt.toISOString() : null,
    },
    { status: 409 }
  )
}

// Bỏ các bản cũ quá SYNC_HISTORY_KEEP. Lỗi ở đây không làm hỏng lần tải lên đã xong — lần sau dọn tiếp.
async function pruneHistory() {
  try {
    const { blobs } = await list({ prefix: SYNC_HISTORY_PREFIX })
    const stale = blobs
      .map((blob) => ({ pathname: blob.pathname, id: syncVersionIdFromPathname(blob.pathname) }))
      .filter((blob) => blob.id !== null)
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(SYNC_HISTORY_KEEP)
    if (stale.length) await del(stale.map((blob) => blob.pathname))
  } catch {
    return
  }
}

// Tải lên là GHI ĐÈ bản trên đám mây, nên:
// - Máy gửi kèm X-Sync-Base-Etag (ETag của bản nó dựa trên). Bản trên đám mây khác bản đó — máy khác đã tải lên
//   sau, hay máy này chưa tải xuống lần nào — thì trả 409 để người dùng chọn, trừ khi đã chọn ghi đè (X-Sync-Force).
// - Trước khi thay, cất bản đang có vào sync/history/ để còn lấy lại được nếu ghi đè nhầm.
// - put kèm ifMatch ETag vừa đọc: máy khác tải lên chen giữa lúc đọc và lúc ghi cũng thành 409, không ghi đè.
async function POST(request: NextRequest) {
  const authError = checkSyncSecret(request)
  if (authError) return authError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 })
  }

  const result = parseImportPayload(JSON.stringify(body))
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const baseEtag = request.headers.get("x-sync-base-etag")
  const force = request.headers.get("x-sync-force") === "1"
  const current = await currentSnapshot()
  if (current && !force && !sameEtag(current.etag, baseEtag)) return conflict(current.uploadedAt)

  if (current) {
    await copy(SYNC_PATHNAME, syncVersionPathname(String(current.uploadedAt.getTime())), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    })
  }

  let saved
  try {
    saved = await put(SYNC_PATHNAME, JSON.stringify(body), {
      access: "private",
      contentType: "application/json",
      ...(current ? { ifMatch: current.etag } : { allowOverwrite: true }),
    })
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) return conflict(null)
    throw error
  }

  await pruneHistory()

  return NextResponse.json({ ok: true, summary: uploadedSummary(result.data), etag: saved.etag })
}

export { GET, POST }
