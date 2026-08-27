"use client"

import Image from "next/image"
import { Lock } from "lucide-react"

import { useT } from "@/components/locale-provider"

const BRAND_ICONS = ["pig", "book", "cap", "gold"]

function LoginAside() {
  const t = useT()

  return (
    <aside className="hidden flex-col overflow-hidden bg-[var(--ob-color-surface-invert)] p-[var(--ob-space-8)] text-[var(--ob-color-text-invert)] min-[900px]:flex">
      <div className="flex items-center gap-3">
        <Image src="/assets/logo-mark.svg" width={38} height={38} alt="" />
        <span className="[font:700_20px/1_var(--ob-font-display)] tracking-[var(--ob-track-display)] whitespace-nowrap">
          <span className="text-[var(--ob-cam-400)]">Orange</span>{" "}
          <span className="text-[var(--ob-chuoi-400)]">Banana</span>
        </span>
      </div>

      <div className="my-auto">
        <h1 className="mb-[var(--ob-space-4)] [font:var(--ob-text-display)] tracking-[var(--ob-track-display)]">
          {t("login.heroLine1")}
          <br />
          {t("login.heroLine2")}
        </h1>
        <p className="max-w-[34ch] text-[17px] leading-relaxed text-[var(--ob-vo-300)]">
          {t("login.heroSubtitle")}
        </p>
        <div className="mt-[var(--ob-space-7)] flex gap-[var(--ob-space-2)]">
          {BRAND_ICONS.map((icon) => (
            <span
              key={icon}
              className="grid size-[46px] place-items-center rounded-[var(--ob-radius-md)] bg-[var(--ob-vo-700)]"
            >
              <Image
                src={`/assets/icons/${icon}.svg`}
                width={26}
                height={26}
                alt=""
              />
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-[var(--ob-space-2)] text-[13px] text-[var(--ob-vo-300)]">
        <Lock size={16} />
        {t("login.storageNote")}
      </div>
    </aside>
  )
}

export { LoginAside }
