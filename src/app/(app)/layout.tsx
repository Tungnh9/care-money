import { Sidebar } from "./_components/sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-svh bg-[var(--ob-color-bg)]">
      <Sidebar />
      <main className="min-w-0 px-4 pt-[64px] pb-[84px] md:ml-[76px] md:px-6 md:pt-6 md:pb-16 lg:ml-[248px] lg:px-[40px] lg:pt-[32px] lg:pb-[64px]">
        {children}
      </main>
    </div>
  )
}
