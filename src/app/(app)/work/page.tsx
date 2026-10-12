import type { Metadata } from "next"

import { WorkView } from "@/features/work"

export const metadata: Metadata = {
  title: "Làm việc – Orange Banana",
}

export default function WorkPage() {
  return <WorkView />
}
