import type { Metadata } from "next"

import { LoginAside, LoginForm } from "@/features/login"
import { generatePageMetadata } from "@/lib/i18n/page-metadata"

export function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata("login.title")
}

export default function LoginPage() {
  return (
    <div className="grid min-h-svh grid-cols-1 min-[900px]:grid-cols-[1.05fr_0.95fr]">
      <LoginAside />
      <div className="flex items-center justify-center p-[var(--ob-space-6)]">
        <LoginForm />
      </div>
    </div>
  )
}
