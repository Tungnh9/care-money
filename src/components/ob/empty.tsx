import type { ReactNode } from "react"

import { Monkey } from "./monkey"
import type { MonkeyProps } from "./monkey"

interface EmptyProps {
  pose?: MonkeyProps["pose"]
  title: ReactNode
  hint?: ReactNode
  children?: ReactNode
  size?: number
}

function Empty({ pose = "sleep", title, hint, children, size = 88 }: EmptyProps) {
  return (
    <div className="flex flex-col items-center px-1 pt-2.5 pb-1 text-center">
      <Monkey pose={pose} size={size} className="mb-3.5" />
      <div className="mb-[5px] text-[14.5px] font-bold">{title}</div>
      {hint ? (
        <p className="mx-auto mb-4 max-w-[30ch] text-[13px] leading-[1.55] text-[var(--ob-color-text-subtle)]">
          {hint}
        </p>
      ) : null}
      {children}
    </div>
  )
}

export { Empty }
