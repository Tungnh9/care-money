import type { Metadata } from "next"

import { FinanceView } from "@/features/finance"
import { generatePageMetadata } from "@/lib/i18n/page-metadata"

export function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata("nav.finance")
}

export default function FinancePage() {
  return <FinanceView />
}
