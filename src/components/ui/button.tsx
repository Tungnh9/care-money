import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--ob-radius-pill)] border-[1.5px] border-transparent font-bold whitespace-nowrap [min-height:var(--ob-hit-min)] [transition:background_var(--ob-dur-fast)_var(--ob-ease-out)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45",
  {
    variants: {
      variant: {
        primary: "bg-[var(--ob-color-action)] text-[var(--ob-color-on-action)]",
        secondary:
          "bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]",
        reward: "bg-[var(--ob-color-reward)] text-[var(--ob-vo-900)]",
        ghost:
          "border-[var(--ob-color-border)] bg-transparent text-[var(--ob-color-text)]",
      },
      size: {
        sm: "px-[14px] py-[8px] text-[13px]",
        md: "px-[20px] py-[11px] text-[14px]",
        lg: "px-[26px] py-[14px] text-[16px]",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant,
  size,
  fullWidth,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
