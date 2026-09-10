import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { Toaster } from "@/components/ui/sonner"
import { AutoBackup } from "@/features/settings"
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
      <AutoBackup />
    </MoneyVisibilityProvider>
  )
}
