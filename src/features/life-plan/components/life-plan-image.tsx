"use client"

import { useRef } from "react"
import Image from "next/image"
import { ImageOff, LoaderCircle } from "lucide-react"

import type { LifePlanImage as LifePlanImageData } from "@/lib/life-plan/types"
import { cn } from "@/lib/utils"
import { useLifePlanImage } from "../hooks/use-life-plan-image"
import { useNearViewport } from "../hooks/use-near-viewport"

interface LifePlanImageProps {
  image: LifePlanImageData
  alt: string
  // "thumb": ô vuông, ảnh cắt vừa ô (lưới ảnh nhỏ); "full": cả tấm ảnh vừa khung xem to.
  variant?: "thumb" | "full"
  className?: string
}

// 1 ảnh của ghi chép: lấy từ cache của máy, chưa có thì tải về qua API của app (useLifePlanImage). Link là object URL
// (blob:) nên next/image tự bỏ tối ưu hoá, chỉ lo khung `fill`. Khung luôn là <span> để đặt được trong <button>.
// Ảnh nhỏ chỉ đọc/tải khi ô của nó tới gần màn hình: dòng thời gian có thể có hàng trăm ảnh, mở trên máy mới không
// được kéo về hết cùng lúc (tốn mạng, tốn credit tải về). Ảnh xem to thì tải ngay.
function LifePlanImage({ image, alt, variant = "thumb", className }: LifePlanImageProps) {
  const thumb = variant === "thumb"
  const frameRef = useRef<HTMLSpanElement>(null)
  const near = useNearViewport(frameRef, thumb)
  const { url, failed } = useLifePlanImage(near ? image.id : null)

  return (
    <span
      ref={frameRef}
      className={cn(
        "relative block overflow-hidden bg-[var(--ob-color-surface-sunken)]",
        thumb
          ? "aspect-square rounded-[var(--ob-radius-sm)]"
          : "h-[min(70svh,720px)] w-full rounded-[var(--ob-radius-md)]",
        className
      )}
    >
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={thumb ? "160px" : "100vw"}
          className={thumb ? "object-cover" : "object-contain"}
        />
      ) : (
        // Chưa có ảnh (đang tải, hay không lấy được: chưa nhập khoá đồng bộ, mất mạng, ảnh đã bị xoá trên cloud) vẫn
        // giữ đúng chỗ của ảnh, kèm tên đọc được cho trình đọc màn hình.
        <span
          role="img"
          aria-label={`${alt} (${failed ? "không tải được" : "đang tải"})`}
          className="flex size-full items-center justify-center text-[var(--ob-color-text-subtle)]"
        >
          {failed ? (
            <ImageOff size={thumb ? 18 : 28} />
          ) : (
            <LoaderCircle size={thumb ? 18 : 28} className="animate-spin motion-reduce:animate-none" />
          )}
        </span>
      )}
    </span>
  )
}

export { LifePlanImage }
