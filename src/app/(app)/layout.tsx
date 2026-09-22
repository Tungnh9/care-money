import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { Toaster } from "@/components/ui/sonner"
import { Sidebar } from "./_components/sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <MoneyVisibilityProvider>
      <div className="min-h-svh">
        <Sidebar />
        <main className="min-w-0 px-4 pt-[64px] pb-[84px] md:ml-[76px] md:px-6 md:pt-6 md:pb-16 lg:ml-[248px] lg:px-[40px] lg:pt-[32px] lg:pb-[64px]">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
      <Toaster />
      {/* <AutoBackup /> — tạm ngưng (2026-09-22): 2 thiết bị dùng chung 1 SYNC_SECRET nhưng tự
          động tải lên hiện chỉ ghi đè toàn bộ snapshot, không tự động tải xuống hay gộp dữ liệu
          — máy nào tải lên sau sẽ âm thầm xoá thay đổi máy kia chưa kịp lấy về. Chỉ bật lại sau
          khi có cơ chế tải xuống tự động (hoặc gộp) để tránh mất dữ liệu tương tự. Đồng bộ thủ
          công (nút "Tải lên"/"Tải xuống" trong Cài đặt) không bị ảnh hưởng, vẫn dùng được. */}
    </MoneyVisibilityProvider>
  )
}
