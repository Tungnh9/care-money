"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { setStoredUser } from "@/lib/auth"
import { login } from "../api"
import { useLoginLockout, MAX_ATTEMPTS, LOCKOUT_MINUTES } from "../hooks/use-login-lockout"
import { loginSchema, type LoginFormValues } from "../schemas"

function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [credentialsInvalid, setCredentialsInvalid] = useState(false)
  const { isLocked, remainingAttempts, registerFailure, registerSuccess } = useLoginLockout()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(data: LoginFormValues) {
    setCredentialsInvalid(false)
    const ok = await login(data.email, data.password)
    if (ok) {
      registerSuccess()
      setStoredUser({ email: data.email })
      router.push("/overview")
      return
    }
    registerFailure()
    setCredentialsInvalid(true)
  }

  const banner =
    errors.email?.message ??
    errors.password?.message ??
    (isLocked
      ? `Bạn đã nhập sai quá ${MAX_ATTEMPTS} lần. Vui lòng thử lại sau ${LOCKOUT_MINUTES} phút.`
      : credentialsInvalid
        ? `Đăng nhập không thành công. Còn ${remainingAttempts} lần thử.`
        : null)

  return (
    <Card tone="plain" elevated className="w-full max-w-[400px]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-[var(--ob-space-4)]"
      >
        <div className="flex items-center gap-[11px]">
          <Image src="/assets/logo-mark.svg" width={30} height={30} alt="" />
          <span className="[font:700_16px/1_var(--ob-font-display)] tracking-[-0.02em] whitespace-nowrap">
            <span className="text-[var(--ob-color-action)]">Orange</span>{" "}
            <span className="text-[var(--ob-chuoi-500)]">Banana</span>
          </span>
        </div>

        <div>
          <h2 className="mb-1 [font:var(--ob-text-h2)]">Đăng nhập</h2>
          <p className="text-sm text-[var(--ob-color-text-muted)]">
            Nhập email và mật khẩu của bạn.
          </p>
        </div>

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Field
              label="Email"
              type="email"
              placeholder="ban@email.com"
              autoFocus
              invalid={!!errors.email}
              hint={errors.email?.message}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Field
              label="Mật khẩu"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              invalid={!!errors.password}
              hint={errors.password?.message}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="flex items-center justify-center"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        {banner ? (
          <div
            role="alert"
            className="rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-color-expense)] bg-[var(--ob-color-surface)] px-[13px] py-[11px] text-sm font-medium text-[var(--ob-color-expense)]"
          >
            {banner}
          </div>
        ) : null}

        <Button type="submit" size="lg" fullWidth disabled={isSubmitting || isLocked}>
          {isSubmitting ? "Đang vào…" : "Đăng nhập"}
        </Button>

        <div className="flex items-center justify-center gap-[var(--ob-space-2)] text-[12.5px] text-[var(--ob-color-text-subtle)] min-[900px]:hidden">
          <Lock size={14} />
          Dữ liệu nằm trên máy bạn. Không tài khoản chia sẻ, không máy chủ.
        </div>
      </form>
    </Card>
  )
}

export { LoginForm }
