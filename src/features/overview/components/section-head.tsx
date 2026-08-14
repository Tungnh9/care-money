import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface SectionHeadProps {
  icon: string
  title: string
  hint?: string
  href: string
}

function SectionHead({ icon, title, hint, href }: SectionHeadProps) {
  return (
    <div className="mt-8 mb-4 flex flex-wrap items-center gap-3">
      <span className="flex size-[34px] flex-none items-center justify-center rounded-[var(--ob-radius-md)] bg-[var(--ob-color-action-soft)]">
        <Image src={`/assets/icons/${icon}.svg`} width={20} height={20} alt="" />
      </span>
      <span className="[font:var(--ob-text-h3)]">{title}</span>
      {hint ? <span className="text-[13px] text-[var(--ob-color-text-subtle)]">{hint}</span> : null}
      <span className="h-px min-w-4 flex-1 bg-[var(--ob-color-border)]" />
      <Link
        href={href}
        className="flex flex-none items-center gap-[6px] rounded-[var(--ob-radius-pill)] px-[13px] py-2 text-[length:var(--ob-size-sm)] font-bold text-[var(--ob-color-action-strong)] whitespace-nowrap"
      >
        Mở
        <ArrowRight size={15} />
      </Link>
    </div>
  )
}

export { SectionHead }
