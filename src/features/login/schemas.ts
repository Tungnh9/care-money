import { z } from "zod"

import type { TranslationFn } from "@/lib/i18n"

function createLoginSchema(t: TranslationFn) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t("login.emptyCredentials"))
      .pipe(z.email(t("login.invalidEmail"))),
    password: z.string().min(1, t("login.emptyCredentials")),
  })
}

type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>

export { createLoginSchema, type LoginFormValues }
