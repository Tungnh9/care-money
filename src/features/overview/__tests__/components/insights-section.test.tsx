import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { InsightsSection } from "../../components/insights-section"

describe("InsightsSection", () => {
  it("renders nothing when there are no insights", () => {
    const { container } = render(<InsightsSection insights={[]} onDismiss={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("renders each insight's text", () => {
    render(
      <InsightsSection
        insights={[
          { id: "a", text: "Insight A" },
          { id: "b", text: "Insight B" },
        ]}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.getByText("Insight A")).toBeInTheDocument()
    expect(screen.getByText("Insight B")).toBeInTheDocument()
  })

  it("calls onDismiss with the right id when its dismiss button is clicked", () => {
    const onDismiss = vi.fn()
    render(
      <InsightsSection insights={[{ id: "a", text: "Insight A" }]} onDismiss={onDismiss} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Ẩn gợi ý này" }))

    expect(onDismiss).toHaveBeenCalledWith("a")
  })
})
