"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

interface SwitchProps extends SwitchPrimitive.Root.Props {
  label?: React.ReactNode
  hint?: React.ReactNode
}

function Switch({ className, label, hint, disabled, ...props }: SwitchProps) {
  return (
    <label
      className={cn(
        "flex min-h-[var(--ob-hit-min)] items-center justify-between gap-[var(--ob-space-4)]",
        disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer",
        className
      )}
    >
      {label || hint ? (
        <span>
          {label ? (
            <span className="block text-sm font-medium text-[var(--ob-color-text)]">
              {label}
            </span>
          ) : null}
          {hint ? (
            <span className="mt-0.5 block text-xs text-[var(--ob-color-text-subtle)]">
              {hint}
            </span>
          ) : null}
        </span>
      ) : null}
      <SwitchPrimitive.Root
        data-slot="switch"
        disabled={disabled}
        className="relative inline-flex h-[26px] w-[44px] shrink-0 items-center rounded-[var(--ob-radius-pill)] p-[3px] [transition:background_var(--ob-dur-base)_var(--ob-ease-out)] data-checked:bg-[var(--ob-color-action)] data-unchecked:bg-[var(--ob-vo-200)]"
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className="block size-5 rounded-full bg-white shadow-[0_1px_3px_rgb(90_44_10_/_0.35)] [transition:transform_var(--ob-dur-base)_var(--ob-ease-pop)] data-checked:translate-x-[18px] data-unchecked:translate-x-0"
        />
      </SwitchPrimitive.Root>
    </label>
  )
}

export { Switch }
