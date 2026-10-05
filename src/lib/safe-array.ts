import type { z } from "zod"

// Lọc TỪNG phần tử của 1 mảng lưu lâu dài: phần tử hỏng bị bỏ riêng nó, phần còn lại giữ nguyên
// thứ tự (trả về bản đã qua schema — field lạ bị bỏ, field có .catch() được điền mặc định). Không
// phải mảng thì coi như rỗng.
function safeArray<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const result = schema.safeParse(item)
    return result.success ? [result.data] : []
  })
}

export { safeArray }
