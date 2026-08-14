import type { Metadata } from "next"

import { getGrammar, getVocab } from "@/features/study/content-loader"
import { StudyView } from "@/features/study"

export const metadata: Metadata = {
  title: "Học tập – Orange Banana",
}

export default function StudyPage() {
  const vocab = getVocab()
  const grammar = getGrammar()

  return <StudyView vocab={vocab} grammar={grammar} />
}
