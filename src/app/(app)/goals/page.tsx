import type { Metadata } from "next"

import { GoalsView } from "@/features/goals"
import { generatePageMetadata } from "@/lib/i18n/page-metadata"

export function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata("nav.goals")
}

export default function GoalsPage() {
  return <GoalsView />
}
