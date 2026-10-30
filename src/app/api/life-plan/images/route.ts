import { NextResponse, type NextRequest } from "next/server"

import {
  cloudinaryConfig,
  destroyOnCloudinary,
  isLifePlanImageId,
  lifePlanImageFolder,
  signedDeliveryUrl,
  uploadToCloudinary,
  type CloudinaryConfig,
} from "@/lib/life-plan/cloudinary"
import { checkSyncSecret } from "@/lib/sync-auth"

// Ảnh đã được thu nhỏ trên trình duyệt (~150–400KB) — 4MB chỉ là chốt chặn, vẫn dưới giới hạn 4,5MB mỗi
// request của Vercel Function.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

function notConfigured() {
  return errorResponse("Server chưa cấu hình Cloudinary.", 503)
}

// Kiểm chung cho xem và xoá: khoá đồng bộ, mã ảnh đúng khuôn server đã tạo, rồi tới cấu hình Cloudinary.
function checkImageRequest(request: NextRequest): { error: NextResponse } | { id: string; config: CloudinaryConfig } {
  const authError = checkSyncSecret(request)
  if (authError) return { error: authError }
  const id = request.nextUrl.searchParams.get("id")
  if (id === null || !isLifePlanImageId(id)) return { error: errorResponse("Mã ảnh không hợp lệ.", 400) }
  const config = cloudinaryConfig()
  if (!config) return { error: notConfigured() }
  return { id, config }
}

async function POST(request: NextRequest) {
  const authError = checkSyncSecret(request)
  if (authError) return authError
  const config = cloudinaryConfig()
  if (!config) return notConfigured()

  // Body không phải form (formData() ném lỗi) cũng coi như thiếu file.
  const file = await request
    .formData()
    .then((form) => form.get("file"))
    .catch(() => null)
  if (file === null || typeof file === "string") return errorResponse("Thiếu file ảnh.", 400)
  if (!file.type.startsWith("image/")) return errorResponse("File tải lên không phải ảnh.", 400)
  if (file.size > MAX_IMAGE_BYTES) return errorResponse("Ảnh lớn hơn 4MB.", 400)

  try {
    const image = await uploadToCloudinary(file, lifePlanImageFolder(), config)
    return NextResponse.json(image, { status: 201 })
  } catch {
    return errorResponse("Không tải được ảnh lên. Vui lòng thử lại.", 502)
  }
}

// Server tự lấy ảnh qua link có chữ ký rồi trả bytes — link đó không bao giờ tới trình duyệt. Mỗi lần tải lên
// là 1 mã ảnh mới, nội dung sau 1 mã không bao giờ đổi, nên trình duyệt được giữ ảnh lâu.
async function GET(request: NextRequest) {
  const checked = checkImageRequest(request)
  if ("error" in checked) return checked.error

  let upstream: Response
  try {
    upstream = await fetch(signedDeliveryUrl(checked.id, checked.config), { cache: "no-store" })
  } catch {
    return errorResponse("Không tải được ảnh về. Vui lòng thử lại.", 502)
  }
  if (upstream.status === 404) return errorResponse("Không tìm thấy ảnh.", 404)
  if (!upstream.ok || !upstream.body) return errorResponse("Không tải được ảnh về. Vui lòng thử lại.", 502)

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  })
}

// Cloudinary trả lời mà không xoá → { ok: false }. Không gọi được Cloudinary → 502, vẫn kèm ok: false.
async function DELETE(request: NextRequest) {
  const checked = checkImageRequest(request)
  if ("error" in checked) return checked.error

  try {
    return NextResponse.json({ ok: await destroyOnCloudinary(checked.id, checked.config) })
  } catch {
    return NextResponse.json(
      { ok: false, error: "Không xoá được ảnh trên Cloudinary. Vui lòng thử lại." },
      { status: 502 }
    )
  }
}

export { DELETE, GET, POST }
