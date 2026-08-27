import type { Metadata } from "next"

import { SettingsView } from "@/features/settings"
import { generatePageMetadata } from "@/lib/i18n/page-metadata"

export function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata("nav.settings")
}

export default function SettingsPage() {
  return <SettingsView />
}
