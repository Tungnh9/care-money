import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function renderMenu(onValueChange = vi.fn(), onClick = vi.fn()) {
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>Chuyển</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={1} onValueChange={onValueChange}>
          <DropdownMenuLabel>Chuyển sang</DropdownMenuLabel>
          <DropdownMenuRadioItem value={1} closeOnClick>
            Bắt đầu
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={2} closeOnClick>
            Đang làm
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuItem onClick={onClick}>Sửa</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
  return { onValueChange, onClick }
}

describe("DropdownMenu", () => {
  it("stays closed until the trigger is pressed", () => {
    renderMenu()

    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Chuyển" }))

    expect(screen.getByRole("menu")).toBeInTheDocument()
  })

  it("names the radio group by its label and marks the current choice checked", () => {
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: "Chuyển" }))

    expect(screen.getByRole("group", { name: "Chuyển sang" })).toBeInTheDocument()
    expect(screen.getByRole("menuitemradio", { name: "Bắt đầu" })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("menuitemradio", { name: "Đang làm" })).toHaveAttribute("aria-checked", "false")
  })

  it("reports the picked value and closes", async () => {
    const { onValueChange } = renderMenu()
    fireEvent.click(screen.getByRole("button", { name: "Chuyển" }))

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Đang làm" }))

    expect(onValueChange).toHaveBeenCalledWith(2, expect.anything())
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument())
  })

  it("runs a plain item's action", () => {
    const { onClick } = renderMenu()
    fireEvent.click(screen.getByRole("button", { name: "Chuyển" }))

    fireEvent.click(screen.getByRole("menuitem", { name: "Sửa" }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
