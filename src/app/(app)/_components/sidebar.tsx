"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpen,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Target,
  Wallet,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { clearStoredUser } from "@/lib/auth"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { useJournal } from "@/features/journal/hooks/use-journal"

const NAV = [
  { label: "Tổng quan", href: "/overview", icon: LayoutDashboard, moduleKey: null },
  { label: "Tài chính", href: "/finance", icon: Wallet, moduleKey: "taichinh" },
  { label: "Nhật ký", href: "/journal", icon: BookOpen, moduleKey: "nhatky" },
  { label: "Học tập", href: "/study", icon: GraduationCap, moduleKey: "hoctap" },
  { label: "Mục tiêu", href: "/goals", icon: Target, moduleKey: "muctieu" },
  { label: "Cài đặt", href: "/settings", icon: Settings, moduleKey: null },
] as const

function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { settings } = useSettings()
  const { streak } = useJournal()

  function isModuleOn(key: string) {
    return settings.modules.find((m) => m.key === key)?.on ?? true
  }

  const nav = NAV.filter((item) => !item.moduleKey || isModuleOn(item.moduleKey))
  const showStreak = isModuleOn("chuoingay")

  function handleLogout() {
    clearStoredUser()
    router.push("/login")
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex w-[248px] flex-col border-r border-[var(--ob-color-border)] bg-[var(--ob-color-bg)] p-[22px_16px]">
      <div className="flex items-center gap-[10px] px-2 pb-[22px]">
        <Image src="/assets/logo-mark.svg" width={32} height={32} alt="" />
        <span className="[font:700_17px/1_var(--ob-font-display)] tracking-[-0.02em] whitespace-nowrap">
          <span className="text-[var(--ob-color-action)]">Orange</span>{" "}
          <span className="text-[var(--ob-chuoi-500)]">Banana</span>
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map(({ label, href, icon: ItemIcon }) => {
          const active = pathname === href
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex min-h-[var(--ob-hit-min)] items-center gap-[11px] rounded-[var(--ob-radius-md)] px-[14px] py-[11px] text-left text-[length:var(--ob-size-sm)] leading-[var(--ob-lh-normal)] whitespace-nowrap no-underline transition-[background-color,color] duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]",
                active
                  ? "bg-[var(--ob-color-action-soft)] font-bold text-[var(--ob-color-action-strong)]"
                  : "font-medium text-[var(--ob-color-text-muted)] hover:bg-[var(--ob-color-action-soft)] hover:text-[var(--ob-color-action-strong)]"
              )}
            >
              <ItemIcon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-[14px]">
        {showStreak ? (
          <div className="flex items-center gap-[9px] rounded-[var(--ob-radius-md)] bg-[var(--ob-color-reward-soft)] px-[14px] py-[11px] text-[13px] font-bold text-[var(--ob-color-reward-text)]">
            <Flame size={16} />
            Chuỗi {streak} ngày
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-[11px] rounded-[var(--ob-radius-md)] px-[14px] py-[11px] text-left text-[length:var(--ob-size-sm)] leading-[var(--ob-lh-normal)] font-medium text-[var(--ob-color-text-muted)]"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
        <div className="flex items-center gap-[10px] px-[6px] pt-0.5">
          <span className="size-8 flex-none rounded-full bg-[var(--ob-vo-200)]" />
          <span className="text-[13.5px] font-bold">{settings.profile.displayName}</span>
        </div>
      </div>
    </aside>
  )
}

export { Sidebar }
