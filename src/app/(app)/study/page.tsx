import type { Metadata } from "next"

import { getGrammar, getVocab } from "@/features/study/content-loader"
import { StudyView } from "@/features/study"
import { generatePageMetadata } from "@/lib/i18n/page-metadata"

export function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata("nav.study")
}

export default function StudyPage() {
  const vocab = getVocab()
  const grammar = getGrammar()

  return <StudyView vocab={vocab} grammar={grammar} />
}
