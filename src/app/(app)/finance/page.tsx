import type { Metadata } from "next"

import { FinanceView } from "@/features/finance"

export const metadata: Metadata = {
  title: "Tài chính – Orange Banana",
}

export default function FinancePage() {
  return <FinanceView />
}
