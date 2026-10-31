import { NextResponse } from "next/server"

import { cloudinaryConfig } from "@/lib/life-plan/cloudinary"

// Không cần khoá đồng bộ: trang hỏi route này để biết có mở nút thêm ảnh không, kể cả khi máy chưa nhập khoá.
// Chỉ trả có/không — không lộ giá trị biến nào.
async function GET() {
  return NextResponse.json({ configured: cloudinaryConfig() !== null })
}

export { GET }
