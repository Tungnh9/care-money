import type { Metadata } from "next"

import { BudgetView } from "@/features/budget"

export const metadata: Metadata = {
  title: "Chi tiêu – Orange Banana",
}

export default function BudgetPage() {
  return <BudgetView />
}
