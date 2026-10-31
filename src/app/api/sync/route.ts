import { NextResponse, type NextRequest } from "next/server"
import { get, put } from "@vercel/blob"

import { parseImportPayload, uploadedSummary } from "@/lib/data-transfer"
import { checkSyncSecret } from "@/lib/sync-auth"

const SYNC_PATHNAME = "sync/snapshot.json"

async function GET(request: NextRequest) {
  const authError = checkSyncSecret(request)
  if (authError) return authError

  const result = await get(SYNC_PATHNAME, { access: "private", useCache: false })
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "Chưa có bản đồng bộ nào." }, { status: 404 })
  }

  const text = await new Response(result.stream).text()
  return new NextResponse(text, {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
  })
}

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

  await put(SYNC_PATHNAME, JSON.stringify(body), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
  })

  return NextResponse.json({ ok: true, summary: uploadedSummary(result.data) })
}

export { GET, POST }
