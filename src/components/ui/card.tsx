import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-[var(--ob-radius-lg)] p-[var(--ob-card-pad)] [container-type:inline-size]",
  {
    variants: {
      tone: {
        plain:
          "border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] text-[var(--ob-color-text)]",
        invert:
          "border-[1.5px] border-transparent bg-[var(--ob-color-surface-invert)] text-[var(--ob-color-text-invert)]",
        reward:
          "border-[1.5px] border-transparent bg-[var(--ob-color-reward)] text-[var(--ob-vo-900)]",
        soft:
          "border-[1.5px] border-transparent bg-[var(--ob-color-action-soft)] text-[var(--ob-color-text)]",
      },
      elevated: {
        true: "shadow-[var(--ob-shadow-md)]",
        false: "shadow-none",
      },
    },
    defaultVariants: {
      tone: "plain",
      elevated: false,
    },
  }
)

interface CardProps
  extends React.ComponentProps<"section">,
    VariantProps<typeof cardVariants> {
  label?: React.ReactNode
  action?: React.ReactNode
}

function Card({
  className,
  tone,
  elevated,
  label,
  action,
  children,
  ...props
}: CardProps) {
  return (
    <section
      data-slot="card"
      className={cn(cardVariants({ tone, elevated }), className)}
      {...props}
    >
      {label || action ? (
        <div className="mb-[var(--ob-space-3)] flex items-center justify-between gap-[var(--ob-space-3)]">
          <span className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] opacity-[.66]">
            {label}
          </span>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export { Card }
