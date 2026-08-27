import type { Metadata } from "next"

import { JournalView } from "@/features/journal"
import { generatePageMetadata } from "@/lib/i18n/page-metadata"

export function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata("nav.journal")
}

export default function JournalPage() {
  return <JournalView />
}
