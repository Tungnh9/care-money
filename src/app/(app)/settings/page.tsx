import type { Metadata } from "next"

import { SettingsView } from "@/features/settings"

export const metadata: Metadata = {
  title: "Cài đặt – Orange Banana",
}

export default function SettingsPage() {
  return <SettingsView />
}
