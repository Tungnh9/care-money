import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { Empty } from "@/components/ob/empty"

describe("Empty", () => {
  it("renders the title", () => {
    render(<Empty title="Chưa có bài nào" />)

    expect(screen.getByText("Chưa có bài nào")).toBeInTheDocument()
  })

  it("renders the hint when given", () => {
    render(<Empty title="Chưa có bài nào" hint="Bài đầu tiên bạn lưu sẽ hiện ở đây." />)

    expect(screen.getByText("Bài đầu tiên bạn lưu sẽ hiện ở đây.")).toBeInTheDocument()
  })

  it("omits the hint paragraph when not given", () => {
    render(<Empty title="Chưa có bài nào" />)

    expect(screen.queryByText(/hiện ở đây/)).not.toBeInTheDocument()
  })

  it("renders children (call to action)", () => {
    render(
      <Empty title="Chưa có bài nào">
        <button type="button">Viết nhật ký hôm nay</button>
      </Empty>
    )

    expect(screen.getByRole("button", { name: "Viết nhật ký hôm nay" })).toBeInTheDocument()
  })

  it("renders the Monkey mascot", () => {
    const { container } = render(<Empty title="Chưa có bài nào" />)

    expect(container.querySelector("svg")).toBeInTheDocument()
  })
})
