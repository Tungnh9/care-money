"use client"

import { Volume2 } from "lucide-react"

import { speakWord } from "@/lib/speak"
import { cn } from "@/lib/utils"

interface SpeakButtonProps {
  word: string
  size?: "sm" | "md"
  className?: string
}

const BUTTON_SIZE_CLASSES = {
  sm: "size-6",
  md: "size-8",
}

const ICON_SIZES = {
  sm: 12,
  md: 16,
}

function SpeakButton({ word, size = "md", className }: SpeakButtonProps) {
  return (
    <button
      type="button"
      onClick={() => speakWord(word)}
      // Lưới từ vựng/thẻ ôn/Tổng quan có nhiều nút phát âm cạnh nhau — tên kèm từ để danh sách nút của
      // trình đọc màn hình phân biệt được nút nào đọc từ nào.
      aria-label={`Phát âm "${word}"`}
      className={cn(
        "flex items-center justify-center rounded-full border-[1.5px] border-transparent bg-[var(--ob-color-surface)]/90 text-[var(--ob-color-action)] shadow-sm transition-colors duration-[var(--ob-dur-fast)] hover:text-[var(--ob-color-action-hover)]",
        BUTTON_SIZE_CLASSES[size],
        className
      )}
    >
      <Volume2 size={ICON_SIZES[size]} />
    </button>
  )
}

export { SpeakButton }
