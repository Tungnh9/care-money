"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { AlertTriangle, Check } from "lucide-react"

// App này chỉ có 1 theme OB cố định (không có dark mode/next-themes), nên
// không dùng useTheme() — set thẳng theme="light" và map màu vào token --ob-*.
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      richColors
      icons={{
        success: <Check className="size-4" />,
        error: <AlertTriangle className="size-4" />,
      }}
      style={
        {
          "--normal-bg": "var(--ob-color-surface)",
          "--normal-text": "var(--ob-color-text)",
          "--normal-border": "var(--ob-color-border)",
          "--border-radius": "var(--ob-radius-md)",
          "--success-bg": "#E7F6EF",
          "--success-border": "#E7F6EF",
          "--success-text": "#0E7A50",
          "--error-bg": "#FDEBF2",
          "--error-border": "#FDEBF2",
          "--error-text": "#B92E63",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
