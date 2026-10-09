import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { MoneyVisibilityProvider, useMoneyVisibility } from "@/components/money-visibility-provider"

function ToggleProbe() {
  const { hidden, toggle } = useMoneyVisibility()
  return (
    <button type="button" onClick={toggle}>
      {hidden ? "Đang ẩn" : "Đang hiện"}
    </button>
  )
}

describe("MoneyVisibilityProvider", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("toggles and remembers the choice", async () => {
    render(
      <MoneyVisibilityProvider>
        <ToggleProbe />
      </MoneyVisibilityProvider>
    )

    fireEvent.click(await screen.findByRole("button", { name: "Đang hiện" }))

    expect(screen.getByRole("button", { name: "Đang ẩn" })).toBeInTheDocument()
    expect(window.localStorage.getItem("hide-money")).toBe("1")
  })

  it("keeps the app running and still hides amounts when saving the choice fails", async () => {
    render(
      <MoneyVisibilityProvider>
        <ToggleProbe />
      </MoneyVisibilityProvider>
    )
    const button = await screen.findByRole("button", { name: "Đang hiện" })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError")
    })

    fireEvent.click(button)

    expect(screen.getByRole("button", { name: "Đang ẩn" })).toBeInTheDocument()
  })
})
