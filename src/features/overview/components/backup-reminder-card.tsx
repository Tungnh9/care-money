"use client"

import Link from "next/link"
import { CloudUpload, HardDriveDownload } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { backupReminder, formatBackupAge, type BackupReminder } from "@/lib/backup/backup-reminder"
import { useBackupStatus } from "@/lib/backup/use-backup-status"
import { dayKey } from "@/lib/date"

function reminderCopy(reminder: BackupReminder, today: string) {
  if (reminder.kind === "empty") {
    return {
      title: "Máy này chưa có dữ liệu",
      text: "Đã dùng Orange Banana ở máy khác? Tải bản trên đám mây xuống hoặc nhập file sao lưu ở Cài đặt.",
      cta: "Khôi phục dữ liệu",
    }
  }
  if (reminder.kind === "never") {
    return {
      title: "Dữ liệu chưa được sao lưu",
      text: "Mọi thứ chỉ nằm trong trình duyệt này — xoá dữ liệu trình duyệt hay mất máy là mất hết. Xuất 1 file JSON hoặc tải lên đám mây ở Cài đặt.",
      cta: "Sao lưu ngay",
    }
  }
  return {
    title: `Đã ${reminder.days} ngày chưa sao lưu`,
    text: `Có thay đổi từ bản sao gần nhất (${formatBackupAge(reminder.latestAt, today)}). Xuất file hoặc tải lên đám mây để giữ an toàn.`,
    cta: "Sao lưu ngay",
  }
}

// Nhắc sao lưu ở đầu Tổng quan: máy trống (khôi phục từ bản sao), chưa sao lưu lần nào, hay đã lâu mà dữ liệu đã đổi.
// Hết nhắc ngay khi xuất file / tải lên / nạp xong — không có nút ẩn, vì cách tắt nhắc là sao lưu.
function BackupReminderCard() {
  const backup = useBackupStatus()
  const today = dayKey()
  const reminder = backupReminder(backup, today)
  if (!reminder) return null

  const { title, text, cta } = reminderCopy(reminder, today)
  const Icon = reminder.kind === "empty" ? HardDriveDownload : CloudUpload

  return (
    <Card tone="soft" className="mb-5" aria-label={title}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-[1_1_260px] items-start gap-3">
          <Icon size={22} className="mt-[1px] flex-none text-[var(--ob-color-action-strong)]" aria-hidden />
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[var(--ob-color-text)]">{title}</p>
            <p className="mt-1 text-[13.5px] leading-[1.5] text-[var(--ob-color-text-muted)]">{text}</p>
          </div>
        </div>
        <Link href="/settings#data" className={buttonVariants({ variant: "primary", size: "sm" })}>
          {cta}
        </Link>
      </div>
    </Card>
  )
}

export { BackupReminderCard }
