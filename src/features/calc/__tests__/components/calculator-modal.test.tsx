import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { CalculatorModal } from "../../components/calculator-modal"

function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }))
}

function type(keys: string[]) {
  keys.forEach(click)
}

describe("CalculatorModal", () => {
  it("không render gì khi open=false", () => {
    render(<CalculatorModal open={false} onOpenChange={vi.fn()} />)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(screen.queryByTestId("calculator-out-box")).not.toBeInTheDocument()
  })

  it("hiện '0' ban đầu khi open=true", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    expect(screen.getByTestId("calculator-result")).toHaveTextContent("0")
  })

  it("dòng biểu thức hiện nguyên văn KHÔNG format hàng nghìn: 800+200", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    type(["8", "0", "0", "+", "2", "0", "0"])

    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("800+200")
  })

  it("dòng kết quả xem trước NGAY khi đang gõ, trước khi bấm '='", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    type(["8", "0", "0", "+", "2", "0", "0"])

    expect(screen.getByTestId("calculator-result")).toHaveTextContent("1.000")
  })

  it("bấm '=' tính đúng thứ tự toán học: 800+200×2 = 1.200", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    type(["8", "0", "0", "+", "2", "0", "0", "×", "2", "="])

    expect(screen.getByTestId("calculator-result")).toHaveTextContent("1.200")
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("1200")
  })

  it("nút ',' chèn dấu phẩy thập phân và tính đúng: 10,5+2 = 12,5", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    type(["1", "0", ",", "5", "+", "2"])

    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("10,5+2")
    expect(screen.getByTestId("calculator-result")).toHaveTextContent("12,5")
  })

  it("nút '( )' chèn '(' khi chưa có ngoặc mở, chèn ')' khi đang có 1 ngoặc mở chưa đóng", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    type(["8", "0", "0", "+"])
    click("( )")
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("800+(")

    click("( )")
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("800+()")
  })

  it("nút '%' hoạt động đúng: 50% = 0,5 và 200+10% = 200,1", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    type(["5", "0", "%"])
    expect(screen.getByTestId("calculator-result")).toHaveTextContent("0,5")

    click("Xoá hết")
    type(["2", "0", "0", "+", "1", "0", "%"])
    expect(screen.getByTestId("calculator-result")).toHaveTextContent("200,1")
  })

  it("nút 'C' và nút xoá 1 ký tự hiện ICON, không phải chữ 'C'/'⌫'", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    expect(screen.queryByRole("button", { name: "C" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "⌫" })).not.toBeInTheDocument()

    const clearButton = screen.getByRole("button", { name: "Xoá hết" })
    const backspaceButton = screen.getByRole("button", { name: "Xoá một kí tự" })
    expect(clearButton.querySelector("svg")).toBeInTheDocument()
    expect(backspaceButton.querySelector("svg")).toBeInTheDocument()
  })

  it("chia cho 0, bấm '=' hiện 'Sai cú pháp' và có class ob-calc-shake", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    type(["1", "÷", "0", "="])

    expect(screen.getByTestId("calculator-result")).toHaveTextContent("Sai cú pháp")
    expect(screen.getByTestId("calculator-out-box")).toHaveClass("ob-calc-shake")
  })

  it("lịch sử: sau 1 lần '=' thành công có 1 dòng, bấm vào dòng đó nạp lại đúng expr/out", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    type(["8", "0", "0", "+", "2", "0", "0", "="])

    const items = screen.getAllByTestId("calculator-history-item")
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent("800+200")
    expect(items[0]).toHaveTextContent("= 1.000")

    type(["1", "2", "3"])
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("123")

    fireEvent.click(items[0])
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("1000")
    expect(screen.getByTestId("calculator-result")).toHaveTextContent("1.000")
  })

  it("quá 4 lần '=' thì chỉ giữ 4 dòng lịch sử mới nhất", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    for (const n of ["1", "2", "3", "4", "5"]) {
      type([n, "+", n, "="])
    }

    const items = screen.getAllByTestId("calculator-history-item")
    expect(items).toHaveLength(4)
    // Mới nhất (5+5) ở đầu, cũ nhất (1+1) đã bị đẩy ra.
    expect(items[0]).toHaveTextContent("5+5")
    expect(items[3]).toHaveTextContent("2+2")
  })

  it("bấm '=' xong bấm tiếp 1 số → thay hẳn biểu thức cũ", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    type(["8", "0", "0", "+", "2", "0", "0", "="])
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("1000")

    click("5")
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("5")
  })

  it("bấm '=' xong bấm tiếp 1 phép tính → nối tiếp từ kết quả cũ", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    type(["8", "0", "0", "+", "2", "0", "0", "="])
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("1000")

    click("+")
    click("3")
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("1000+3")
    expect(screen.getByTestId("calculator-result")).toHaveTextContent("1.003")
  })

  it("bàn phím thật: gõ số/phép tính qua keydown cập nhật giống bấm nút", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    for (const key of ["8", "0", "0", "+", "2", "0", "0"]) {
      fireEvent.keyDown(window, { key })
    }

    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("800+200")
    expect(screen.getByTestId("calculator-result")).toHaveTextContent("1.000")
  })

  it("bàn phím thật: phím ',' và '.' đều chèn dấu phẩy thập phân", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    for (const key of ["1", "0", "."]) fireEvent.keyDown(window, { key })
    fireEvent.keyDown(window, { key: "5" })

    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("10,5")
  })

  it("bàn phím thật: Enter ra kết quả giống nút '='", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    for (const key of ["8", "0", "0", "+", "2", "0", "0"]) {
      fireEvent.keyDown(window, { key })
    }
    fireEvent.keyDown(window, { key: "Enter" })

    expect(screen.getByTestId("calculator-result")).toHaveTextContent("1.000")
  })

  it("bàn phím thật: Backspace xoá đúng 1 ký tự", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    fireEvent.keyDown(window, { key: "1" })
    fireEvent.keyDown(window, { key: "2" })
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("12")

    fireEvent.keyDown(window, { key: "Backspace" })
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("1")
  })

  it("bàn phím thật: Escape gọi onOpenChange(false)", () => {
    const onOpenChange = vi.fn()
    render(<CalculatorModal open onOpenChange={onOpenChange} />)

    fireEvent.keyDown(window, { key: "Escape" })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("bẫy Tab: Tab ở nút cuối cùng nhảy về nút đầu tiên, Shift+Tab ở nút đầu nhảy tới nút cuối", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    const closeButton = screen.getByRole("button", { name: "Đóng" })
    const equalsButton = screen.getByRole("button", { name: "=" })

    equalsButton.focus()
    expect(document.activeElement).toBe(equalsButton)
    fireEvent.keyDown(window, { key: "Tab" })
    expect(document.activeElement).toBe(closeButton)

    closeButton.focus()
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true })
    expect(document.activeElement).toBe(equalsButton)
  })

  it("tự động focus vào nút Đóng sau khi mở", async () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    await waitFor(() => expect(screen.getByRole("button", { name: "Đóng" })).toHaveFocus())
  })

  it("bấm nút X đóng gọi onOpenChange(false)", () => {
    const onOpenChange = vi.fn()
    render(<CalculatorModal open onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByRole("button", { name: "Đóng" }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("bấm vào backdrop (chính veil, không phải box) gọi onOpenChange(false)", () => {
    const onOpenChange = vi.fn()
    render(<CalculatorModal open onOpenChange={onOpenChange} />)

    fireEvent.mouseDown(screen.getByRole("dialog"))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("bấm vào bên trong box KHÔNG gọi onOpenChange", () => {
    const onOpenChange = vi.fn()
    render(<CalculatorModal open onOpenChange={onOpenChange} />)

    fireEvent.mouseDown(screen.getByTestId("calculator-out-box"))

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("render qua portal trực tiếp dưới document.body", () => {
    const { container } = render(<CalculatorModal open onOpenChange={vi.fn()} />)

    expect(container.querySelector('[role="dialog"]')).toBeNull()

    const dialog = screen.getByRole("dialog")
    expect(dialog.parentElement).toBe(document.body)
  })

  it("đóng modal thì reset về '0' khi mở lại lần sau", () => {
    const { rerender } = render(<CalculatorModal open onOpenChange={vi.fn()} />)

    type(["1", "2"])
    expect(screen.getByTestId("calculator-result")).toHaveTextContent("12")

    rerender(<CalculatorModal open={false} onOpenChange={vi.fn()} />)
    rerender(<CalculatorModal open onOpenChange={vi.fn()} />)

    expect(screen.getByTestId("calculator-result")).toHaveTextContent("0")
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("")
  })
})
