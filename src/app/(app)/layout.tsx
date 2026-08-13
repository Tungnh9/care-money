import { Sidebar } from "./_components/sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-svh bg-[var(--ob-color-bg)]">
      <Sidebar />
      <main className="ml-[248px] min-w-0 px-[40px] pt-[32px] pb-[64px]">{children}</main>
    </div>
  )
}
