"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { getStoredUser } from "@/lib/auth"

const PUBLIC_PATHS = ["/login"]

interface AuthGuardProps {
  children: React.ReactNode
}

function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Reset trước khi re-check mỗi lần đổi pathname, tránh hiện tạm nội dung
    // cũ (đã checked=true) của route trước trong lúc chờ đánh giá route mới.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecked(false)
    if (PUBLIC_PATHS.includes(pathname)) {
      setChecked(true)
      return
    }
    if (!getStoredUser()) {
      router.replace("/login")
      return
    }
    setChecked(true)
  }, [pathname, router])

  // Không có localStorage lúc SSR/hydrate đầu tiên, nên phải chờ effect chạy
  // trên client mới biết chắc — hiện loading spinner trong lúc chờ để tránh
  // trắng trang, đây là hạn chế đã biết của toàn bộ hệ thống đăng nhập mock này.
  if (!checked) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--ob-color-bg)]">
        <div
          role="status"
          aria-label="Đang tải"
          className="size-8 animate-spin rounded-full border-[3px] border-[var(--ob-color-border)] border-t-[var(--ob-color-action)]"
        />
      </div>
    )
  }

  return <>{children}</>
}

export { AuthGuard }
