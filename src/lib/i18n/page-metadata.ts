import type { Metadata } from "next"

import type { TranslationKey } from "./types"
import { getDictionary } from "./get-dictionary"
import { getServerLocale } from "./get-server-locale"
import { translate } from "./translate"

async function generatePageMetadata(titleKey: TranslationKey): Promise<Metadata> {
  const dict = getDictionary(await getServerLocale())
  return { title: `${translate(dict, titleKey)} – ${dict.common.appName}` }
}

export { generatePageMetadata }
