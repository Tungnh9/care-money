import { z } from "zod"

export const EMPTY_CREDENTIALS_MESSAGE = "Nhập email và mật khẩu để vào."
export const INVALID_EMAIL_MESSAGE = "Email chưa đúng định dạng."

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, EMPTY_CREDENTIALS_MESSAGE)
    .pipe(z.email(INVALID_EMAIL_MESSAGE)),
  password: z.string().min(1, EMPTY_CREDENTIALS_MESSAGE),
})

export type LoginFormValues = z.infer<typeof loginSchema>
