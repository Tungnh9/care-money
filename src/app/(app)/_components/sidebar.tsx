"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpen,
  Clover,
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
    <>
      <div className="fixed inset-x-0 top-0 z-[9] flex items-center gap-[10px] border-b border-[var(--ob-color-border)] bg-[var(--ob-color-bg)] px-4 py-2.5 md:hidden">
        <Image src="/assets/logo-mark.svg" width={26} height={26} alt="" />
        <span className="flex-1 [font:700_15px/1_var(--ob-font-display)] tracking-[-0.02em] whitespace-nowrap">
          <span className="text-[var(--ob-color-action)]">Orange</span>{" "}
          <span className="text-[var(--ob-chuoi-500)]">Banana</span>
        </span>
        {showStreak ? (
          <div className="flex items-center gap-1 rounded-[var(--ob-radius-pill)] bg-[var(--ob-color-reward-soft)] px-2.5 py-1 text-[12.5px] font-bold text-[var(--ob-color-reward-text)]">
            <Flame size={14} />
            {streak}
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Đăng xuất"
          className="flex items-center justify-center text-[var(--ob-color-text-muted)] transition-colors duration-[var(--ob-dur-fast)] hover:text-[var(--ob-color-expense)]"
        >
          <LogOut size={18} />
        </button>
      </div>

      <aside className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around gap-1 border-t border-[var(--ob-color-border)] bg-[var(--ob-color-bg)] p-[6px_4px] pb-[calc(6px+env(safe-area-inset-bottom))] md:inset-x-auto md:inset-y-0 md:right-auto md:left-0 md:w-[76px] md:flex-col md:items-stretch md:justify-start md:border-t-0 md:border-r md:p-[18px_10px] lg:w-[248px] lg:p-[22px_16px]">
        <div className="hidden items-center justify-center gap-[10px] px-2 pb-[22px] md:flex lg:justify-start">
          <Image src="/assets/logo-mark.svg" width={32} height={32} alt="" />
          <span className="hidden [font:700_17px/1_var(--ob-font-display)] tracking-[-0.02em] whitespace-nowrap lg:inline">
            <span className="text-[var(--ob-color-action)]">Orange</span>{" "}
            <span className="text-[var(--ob-chuoi-500)]">Banana</span>
          </span>
        </div>

        <nav className="flex flex-1 items-center justify-around gap-1 md:flex-none md:flex-col md:items-stretch md:justify-start">
          {nav.map(({ label, href, icon: ItemIcon }) => {
            const active = pathname === href
            return (
              <Link
                key={label}
                href={href}
                title={label}
                className={cn(
                  "flex min-h-[var(--ob-hit-min)] flex-col items-center justify-center gap-0.5 rounded-[var(--ob-radius-md)] px-2 py-1.5 text-center text-[10.5px] leading-[var(--ob-lh-normal)] no-underline transition-[background-color,color] duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] md:flex-row md:justify-center md:gap-[11px] md:px-[14px] md:py-[11px] md:text-left md:text-[length:var(--ob-size-sm)] lg:justify-start",
                  active
                    ? "bg-[var(--ob-color-action-soft)] font-bold text-[var(--ob-color-action-strong)]"
                    : "font-medium text-[var(--ob-color-text-muted)] hover:bg-[var(--ob-color-action-soft)] hover:text-[var(--ob-color-action-strong)]"
                )}
              >
                <ItemIcon size={18} />
                <span className="whitespace-nowrap md:hidden lg:inline">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="hidden md:mt-auto md:flex md:flex-col md:gap-[14px]">
          {showStreak ? (
            <div className="flex items-center justify-center gap-[9px] rounded-[var(--ob-radius-md)] bg-[var(--ob-color-reward-soft)] px-[14px] py-[11px] text-[13px] font-bold text-[var(--ob-color-reward-text)] lg:justify-start">
              <Flame size={16} />
              <span className="hidden whitespace-nowrap lg:inline">Chuỗi {streak} ngày</span>
            </div>
          ) : null}
          <div className="flex items-center justify-center gap-[10px] px-[6px] pt-0.5 lg:justify-start">
            <span className="flex size-8 flex-none items-center justify-center rounded-full bg-[var(--ob-color-reward-soft)]">
              <Clover size={18} className="text-[var(--ob-chuoi-500)]" />
            </span>
            <span className="hidden text-[13.5px] font-bold whitespace-nowrap lg:inline">
              {settings.profile.displayName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-[11px] rounded-[var(--ob-radius-md)] px-[14px] py-[11px] text-left text-[length:var(--ob-size-sm)] leading-[var(--ob-lh-normal)] font-medium text-[var(--ob-color-text-muted)] transition-colors duration-[var(--ob-dur-fast)] hover:text-[var(--ob-color-expense)] lg:justify-start"
          >
            <LogOut size={18} />
            <span className="hidden whitespace-nowrap lg:inline">Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export { Sidebar }
