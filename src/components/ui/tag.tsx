import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex items-center gap-[7px] whitespace-nowrap rounded-[var(--ob-radius-pill)] px-[13px] py-[7px] text-[13px] font-semibold",
  {
    variants: {
      module: {
        taichinh: "bg-[#FFF2E7] text-[#A63A05]",
        hoctap: "bg-[#EAF1FE] text-[#2B54B8]",
        ghichu: "bg-[#E7F6EF] text-[#0E7A50]",
        tamtrang: "bg-[#FDEBF2] text-[#B92E63]",
        muctieu: "bg-[#F0ECFE] text-[#5636C4]",
        kehoach: "bg-[#FFFAE6] text-[#8F6600]",
      },
    },
    defaultVariants: {
      module: "taichinh",
    },
  }
)

const DOT_COLOR: Record<string, string> = {
  taichinh: "var(--ob-tag-taichinh)",
  hoctap: "var(--ob-tag-hoctap)",
  ghichu: "var(--ob-tag-ghichu)",
  tamtrang: "var(--ob-tag-tamtrang)",
  muctieu: "var(--ob-tag-muctieu)",
  kehoach: "var(--ob-tag-kehoach)",
}

interface TagProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof tagVariants> {}

function Tag({ className, module, children, ...props }: TagProps) {
  const key = module ?? "taichinh"
  return (
    <span
      data-slot="tag"
      className={cn(tagVariants({ module }), className)}
      {...props}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ background: DOT_COLOR[key] }}
      />
      {children}
    </span>
  )
}

export { Tag, tagVariants }
