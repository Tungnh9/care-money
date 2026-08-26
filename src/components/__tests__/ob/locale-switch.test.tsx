import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { LocaleProvider, useT } from "@/components/locale-provider"
import { LocaleSwitch } from "@/components/ob/locale-switch"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

function LanguageLabel() {
  const t = useT()
  return <span>{t("settings.language.title")}</span>
}

describe("LocaleSwitch", () => {
  it("switches the dictionary locale when clicked", () => {
    render(
      <LocaleProvider initialLocale="vi">
        <LanguageLabel />
        <LocaleSwitch />
      </LocaleProvider>
    )

    expect(screen.getByText("Ngôn ngữ")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Chuyển ngôn ngữ" }))

    expect(screen.getByText("Language")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Switch language" })).toBeInTheDocument()
  })

  it("falls back to the Vietnamese dictionary when rendered without a provider", () => {
    render(<LocaleSwitch />)

    expect(screen.getByRole("button", { name: "Chuyển ngôn ngữ" })).toHaveTextContent("VI")
  })
})
