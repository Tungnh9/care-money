import * as React from "react"

import { cn } from "@/lib/utils"

interface StreakProps {
  days?: number
  done?: number
  icon?: React.ReactNode
  className?: string
}

function Streak({ days = 7, done = 0, icon, className }: StreakProps) {
  return (
    <div className={cn("flex gap-[5px]", className)}>
      {Array.from({ length: days }, (_, i) => {
        const on = i < done
        return (
          <span
            key={i}
            className="flex flex-1 items-center justify-center rounded-[8px]"
            style={{
              height: icon ? 32 : 26,
              background: on ? "var(--ob-vo-900)" : "rgba(36,26,18,.16)",
              color: on ? "var(--ob-color-action)" : "rgba(36,26,18,.42)",
            }}
          >
            {icon}
          </span>
        )
      })}
    </div>
  )
}

export { Streak }
