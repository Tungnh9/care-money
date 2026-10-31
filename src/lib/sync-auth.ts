import { NextResponse, type NextRequest } from "next/server"

// Khoá đồng bộ SYNC_SECRET chặn mọi API chạm tới dữ liệu riêng: bản đồng bộ (/api/sync) và ảnh trang Plan
// (/api/life-plan/images). Trả response lỗi để route trả thẳng, hoặc null khi request mang đúng khoá.
function checkSyncSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.SYNC_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Server chưa cấu hình SYNC_SECRET." }, { status: 500 })
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Sai secret đồng bộ." }, { status: 401 })
  }
  return null
}

export { checkSyncSecret }
