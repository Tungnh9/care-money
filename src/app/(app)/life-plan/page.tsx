import type { Metadata } from "next"

import { LifePlanView } from "@/features/life-plan"

export const metadata: Metadata = {
  title: "Plan cuộc đời – Orange Banana",
}

export default function LifePlanPage() {
  return <LifePlanView />
}
