import { NextResponse, type NextRequest } from "next/server"
import { get, put } from "@vercel/blob"

import { parseImportPayload } from "@/features/settings/data-transfer"

const SYNC_PATHNAME = "sync/snapshot.json"

function checkAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.SYNC_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Server chưa cấu hình SYNC_SECRET." }, { status: 500 })
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Sai secret đồng bộ." }, { status: 401 })
  }
  return null
}

async function GET(request: NextRequest) {
  const authError = checkAuth(request)
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
  const authError = checkAuth(request)
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

  return NextResponse.json({ ok: true, summary: result.summary })
}

export { GET, POST }
