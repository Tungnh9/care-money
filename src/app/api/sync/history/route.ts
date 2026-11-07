import { NextResponse, type NextRequest } from "next/server"
import { list } from "@vercel/blob"

import { checkSyncSecret } from "@/lib/sync-auth"
import { SYNC_HISTORY_PREFIX, syncVersionIdFromPathname } from "@/lib/sync-blob"

// Các bản cũ đã bị thay khi tải lên, mới nhất trước. `uploadedAt` là lúc bản đó được tải lên (chính là mã của nó).
async function GET(request: NextRequest) {
  const authError = checkSyncSecret(request)
  if (authError) return authError

  const { blobs } = await list({ prefix: SYNC_HISTORY_PREFIX })
  const versions = blobs
    .map((blob) => ({ id: syncVersionIdFromPathname(blob.pathname), size: blob.size }))
    .filter((version): version is { id: string; size: number } => version.id !== null)
    .sort((a, b) => Number(b.id) - Number(a.id))
    .map((version) => ({ ...version, uploadedAt: new Date(Number(version.id)).toISOString() }))

  return NextResponse.json({ versions }, { headers: { "Cache-Control": "private, no-store" } })
}

export { GET }
