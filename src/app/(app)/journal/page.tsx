import type { Metadata } from "next"

import { JournalView } from "@/features/journal"

export const metadata: Metadata = {
  title: "Nhật ký – Orange Banana",
}

export default function JournalPage() {
  return <JournalView />
}
