import Image from "next/image"
import { ImageIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface ImageWithFallbackProps {
  src?: string
  alt: string
  iconSize?: number
  imageSizes?: string
  className?: string
  children?: React.ReactNode
}

function ImageWithFallback({ src, alt, iconSize = 28, imageSizes, className, children }: ImageWithFallbackProps) {
  return (
    <div className={cn("relative aspect-[4/3] bg-[var(--ob-color-surface-sunken)]", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={imageSizes} className="object-cover" />
      ) : (
        <div
          data-testid="vocab-image-placeholder"
          className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--ob-color-action-soft)] to-[var(--ob-color-surface-sunken)] text-[var(--ob-color-text-subtle)]"
        >
          <ImageIcon size={iconSize} strokeWidth={1.5} />
        </div>
      )}
      {children}
    </div>
  )
}

export { ImageWithFallback }
