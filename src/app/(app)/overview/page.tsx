import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tổng quan – Orange Banana",
}

export default function OverviewPage() {
  return <h1 className="[font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Tổng quan</h1>
}
