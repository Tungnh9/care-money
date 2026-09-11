import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { ImageWithFallback } from "@/components/ob/image-with-fallback"

describe("ImageWithFallback", () => {
  it("renders the image with the given alt text when src is set", () => {
    render(<ImageWithFallback src="/assets/vocab/v-0010.jpg" alt="university" />)

    const img = screen.getByAltText("university") as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.src).toContain("v-0010.jpg")
  })

  it("shows a placeholder (no broken image) when src is not set", () => {
    render(<ImageWithFallback alt="talk about" />)

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(screen.getByTestId("vocab-image-placeholder")).toBeInTheDocument()
  })

  it("falls back to the placeholder if the image fails to load", () => {
    render(<ImageWithFallback src="/assets/vocab/broken.jpg" alt="broken" />)

    fireEvent.error(screen.getByAltText("broken"))

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(screen.getByTestId("vocab-image-placeholder")).toBeInTheDocument()
  })

  it("renders children overlaid inside the same container", () => {
    render(
      <ImageWithFallback alt="talk about">
        <button type="button">action</button>
      </ImageWithFallback>
    )

    expect(screen.getByRole("button", { name: "action" })).toBeInTheDocument()
  })
})
