import type { Metadata } from "next"

import type { Dictionary } from "./dictionaries/vi"
import { getDictionary } from "./get-dictionary"
import { getServerLocale } from "./get-server-locale"

async function generatePageMetadata(navKey: keyof Dictionary["nav"]): Promise<Metadata> {
  const dict = getDictionary(await getServerLocale())
  return { title: `${dict.nav[navKey]} – ${dict.common.appName}` }
}

export { generatePageMetadata }
