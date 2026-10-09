import type { Metadata } from "next"

import { getGrammar, getVocab } from "@/lib/study/content-loader"
import { OverviewView } from "@/features/overview"

export const metadata: Metadata = {
  title: "Tổng quan – Orange Banana",
}

export default function OverviewPage() {
  const vocab = getVocab()
  const grammar = getGrammar()

  return <OverviewView vocab={vocab} grammar={grammar} />
}
