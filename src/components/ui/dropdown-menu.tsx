"use client"

import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Từ `npx shadcn add dropdown-menu` (base-nova), giữ phần đang dùng và đổi style sang token --ob-*.
// Base UI đánh dấu mục đang trỏ bằng data-highlighted (chuột lẫn phím mũi tên).

const ITEM_CLASS =
  "relative flex min-h-10 cursor-pointer items-center gap-2 rounded-[var(--ob-radius-sm)] px-2.5 text-sm outline-none select-none data-highlighted:bg-[var(--ob-color-action-soft)] data-highlighted:text-[var(--ob-color-action-strong)] data-disabled:pointer-events-none data-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

// Menu render qua portal — không bị khung cuộn (vd. bảng Kanban cuộn ngang) cắt mất.
function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "z-50 max-h-(--available-height) min-w-44 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-1 text-[var(--ob-color-text)] shadow-[var(--ob-shadow-md)] outline-none duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

// Đặt trong DropdownMenuRadioGroup (hoặc Menu.Group) thì trở thành tên của nhóm đó.
function DropdownMenuLabel({ className, ...props }: MenuPrimitive.GroupLabel.Props) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      className={cn(
        "px-2.5 pt-1.5 pb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
  return <MenuPrimitive.Item data-slot="dropdown-menu-item" className={cn(ITEM_CLASS, className)} {...props} />
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

// Mục đang chọn có dấu ✓ bên trái. Base UI mặc định KHÔNG đóng menu khi bấm mục radio — truyền
// `closeOnClick` khi chọn xong là xong việc (vd. "Chuyển sang…").
function DropdownMenuRadioItem({ className, children, ...props }: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(ITEM_CLASS, "pl-8 data-checked:font-semibold", className)}
      {...props}
    >
      <span className="pointer-events-none absolute left-2.5 flex items-center justify-center">
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon className="size-4" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
}
