import type { Metadata } from "next"

import { GoalsView } from "@/features/goals"

export const metadata: Metadata = {
  title: "Mục tiêu – Orange Banana",
}

export default function GoalsPage() {
  return <GoalsView />
}
