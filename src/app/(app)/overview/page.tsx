import type { Metadata } from "next"

import { getGrammar, getVocab } from "@/features/study/content-loader"
import { OverviewView } from "@/features/overview"
import { generatePageMetadata } from "@/lib/i18n/page-metadata"

export function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata("nav.overview")
}

export default function OverviewPage() {
  const vocab = getVocab()
  const grammar = getGrammar()

  return <OverviewView vocab={vocab} grammar={grammar} />
}
