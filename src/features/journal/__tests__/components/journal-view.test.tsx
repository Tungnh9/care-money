import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"

import { JournalView } from "../../components/journal-view"
import type { JournalEntry } from "../../types"

// jsdom không đồng bộ innerText <-> innerHTML như trình duyệt thật (set cái này không
// cập nhật cái kia), nên set cả 2 để mô phỏng đúng trạng thái 1 trình duyệt thật sẽ có.
function typeInto(editor: HTMLElement, text: string) {
  editor.innerHTML = text
  editor.innerText = text
  fireEvent.input(editor)
}

describe("JournalView", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("saves an entry, shows the success card, then lists it after dismissing", async () => {
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Hôm nay mình đã đi bộ")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    expect(await screen.findByText("Đã lưu vào nhật ký")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Viết thêm một bài" }))

    await waitFor(() => expect(screen.getByText("Nhật ký đã viết · 1")).toBeInTheDocument())
    expect(screen.getByText("Hôm nay mình đã đi bộ")).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })

  it("shows the mood picker when the tamtrang module is enabled by default", async () => {
    render(<JournalView />)

    expect(await screen.findByText("Tâm trạng hôm nay")).toBeInTheDocument()
  })

  it("shows the mascot empty-state when there are no entries yet", async () => {
    render(<JournalView />)

    expect(await screen.findByText("Chưa có bài nào")).toBeInTheDocument()
    expect(screen.getByText("Bài đầu tiên bạn lưu sẽ hiện ở đây.")).toBeInTheDocument()
  })

  it("celebrates a saved entry with the mascot and a firework effect", async () => {
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Hôm nay mình đã đi bộ")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    const successCard = (await screen.findByText("Đã lưu vào nhật ký")).closest("section")
    expect(successCard).not.toHaveClass("ob-tada")
    expect(successCard?.querySelector("svg")).toBeInTheDocument()
    expect(successCard?.querySelectorAll(".ob-firework-spark").length).toBeGreaterThan(0)
  })

  it("clicking Xem lại bài vừa viết keeps the success card and highlights the entry in the list", async () => {
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Hôm nay mình đã đi bộ")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    expect(await screen.findByText("Đã lưu vào nhật ký")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Xem lại bài vừa viết" }))

    expect(screen.getByText("Đã lưu vào nhật ký")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()

    const entryRow = screen.getByText("Hôm nay mình đã đi bộ").closest("[id^='journal-entry-']")
    expect(entryRow).toHaveClass("ob-highlight-flash")
  })

  it("wraps the sections in the ob-card-grid entrance-animation class", async () => {
    render(<JournalView />)

    const entriesCard = (
      await waitFor(() => screen.getByText("Nhật ký đã viết", { exact: false }))
    ).closest("section")
    const wrapper = entriesCard?.parentElement?.parentElement

    expect(wrapper).toHaveClass("ob-card-grid")
  })

  it("gives the empty-state entries card more width than the mood card, with both wrappers stretched to equal height", async () => {
    render(<JournalView />)

    const moodCard = (await screen.findByText("Tâm trạng hôm nay")).closest("section")
    const moodWrapper = moodCard?.parentElement
    expect(moodWrapper).toHaveClass("flex-[1_1_300px]")
    expect(moodWrapper).toHaveClass("[&>*]:h-full")

    const entriesCard = (await screen.findByText("Chưa có bài nào")).closest("section")
    const entriesWrapper = entriesCard?.parentElement
    expect(entriesWrapper).toHaveClass("flex-[2_1_360px]")
    expect(entriesWrapper).toHaveClass("[&>*]:h-full")
  })

  it("clicking Sửa on an entry prefills the editor and updates it instead of creating a new one", async () => {
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Bài gốc")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))
    fireEvent.click(await screen.findByRole("button", { name: "Viết thêm một bài" }))

    await waitFor(() => expect(screen.getByText("Bài gốc")).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: /Sửa bài/ }))

    expect(screen.getByRole("textbox")).toHaveTextContent("Bài gốc")
    expect(screen.getByRole("button", { name: "Cập nhật bài viết" })).toBeInTheDocument()

    typeInto(screen.getByRole("textbox"), "Bài đã sửa")
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    await waitFor(() => expect(screen.getByText("Bài đã sửa")).toBeInTheDocument())
    expect(screen.queryByText("Bài gốc")).not.toBeInTheDocument()
    expect(screen.getByText("Nhật ký đã viết · 1")).toBeInTheDocument()
  })

  it("Huỷ sửa cancels editing without changing the entry", async () => {
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Bài gốc")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))
    fireEvent.click(await screen.findByRole("button", { name: "Viết thêm một bài" }))

    await waitFor(() => expect(screen.getByText("Bài gốc")).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: /Sửa bài/ }))
    typeInto(screen.getByRole("textbox"), "Nội dung nháp bỏ đi")
    fireEvent.click(screen.getByRole("button", { name: "Huỷ sửa" }))

    expect(screen.getByText("Bài gốc")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu vào nhật ký" })).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toBeEmptyDOMElement()
  })

  it("copies the selected mood's score into the saved journal snapshot", async () => {
    render(<JournalView />)

    fireEvent.click(screen.getByText("Vui")) // mood mặc định "on: true", score = 4
    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Một ngày ổn")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    await waitFor(() => expect(screen.getByText("Đã lưu vào nhật ký")).toBeInTheDocument())
    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries[0].mood.score).toBe(4)
  })
})

describe("JournalView on-this-day card", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows the on-this-day card when an entry exists from exactly 1 year ago", async () => {
    vi.setSystemTime(new Date(2025, 7, 10, 9, 0))
    window.localStorage.setItem(
      "journal-entries",
      JSON.stringify({
        entries: [
          { id: new Date(2025, 7, 10, 9, 0).getTime(), text: "Bài năm ngoái", time: "09:00", date: "10/08", words: 2, mood: null },
        ],
      })
    )
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))

    render(<JournalView />)

    const onThisDayLabel = await screen.findByText("1 năm trước, bạn đã viết")
    expect(onThisDayLabel).toBeInTheDocument()
    const onThisDayCard = onThisDayLabel.closest("section") as HTMLElement
    expect(within(onThisDayCard).getByText("Bài năm ngoái")).toBeInTheDocument()

    // Bài này vẫn xuất hiện thêm 1 lần nữa ở danh sách đầy đủ bên dưới — thẻ "gợi lại
    // quá khứ" chỉ là 1 điểm nhấn, không thay thế/ẩn bài đó khỏi danh sách chính.
    expect(screen.getAllByText("Bài năm ngoái")).toHaveLength(2)
  })

  it("does not show the on-this-day card when there is no matching entry", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))

    render(<JournalView />)

    await screen.findByText("Chưa có bài nào")
    expect(screen.queryByText(/bạn đã viết/)).not.toBeInTheDocument()
  })
})

// "Hôm nay" ghim là 30/09/2026 — không bài mẫu nào trùng mốc "ngày này năm xưa" (23/09, 30/08, 30/09/2025)
// nên mỗi đoạn chữ chỉ xuất hiện 1 lần trên trang.
const ENTRY_A: JournalEntry = {
  id: new Date(2026, 8, 28, 20, 0).getTime(),
  text: "Tối nay đi bộ quanh hồ",
  time: "20:00",
  date: "28/09",
  words: 6,
  mood: null,
}

const ENTRY_B: JournalEntry = {
  id: new Date(2026, 8, 27, 21, 0).getTime(),
  text: "Đọc xong một cuốn sách",
  time: "21:00",
  date: "27/09",
  words: 5,
  mood: null,
}

function seedEntries(...entries: JournalEntry[]) {
  window.localStorage.setItem("journal-entries", JSON.stringify({ entries }))
}

describe("JournalView — sửa, xoá và giữ nội dung đang viết", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 30, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("keeps a new entry in the editor when it cannot be saved, so it can be saved again", async () => {
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Bài sẽ lưu lỗi")
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota exceeded")
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))
    setItemSpy.mockRestore()

    expect(screen.queryByText("Đã lưu vào nhật ký")).not.toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent("Bài sẽ lưu lỗi")
    expect(screen.getByText("4 từ")).toBeInTheDocument()
  })

  it("stays in edit mode with the edited text when the update cannot be written", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    typeInto(screen.getByRole("textbox"), "Bài A đã sửa")
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota exceeded")
    })
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))
    setItemSpy.mockRestore()

    expect(screen.getByRole("button", { name: "Cập nhật bài viết" })).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent("Bài A đã sửa")
    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries[0].text).toBe(ENTRY_A.text)
  })

  it("keeps the edited text, and saves no new entry, when the entry was deleted in another tab meanwhile", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    typeInto(screen.getByRole("textbox"), "Bài A đã sửa")
    // Tab khác xoá bài A — ghi thẳng, KHÔNG bắn sự kiện: trang này vẫn đang ở chế độ sửa bài A.
    seedEntries(ENTRY_B)
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    expect(screen.getByRole("button", { name: "Cập nhật bài viết" })).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent("Bài A đã sửa")
    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries).toEqual([ENTRY_B])
  })

  it("leaves edit mode when the entry being edited is deleted", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    expect(screen.getByRole("button", { name: "Cập nhật bài viết" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Xoá bài 28/09 20:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(screen.queryByRole("button", { name: "Cập nhật bài viết" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu vào nhật ký" })).toBeInTheDocument()
    expect(screen.getByText("Nhật ký đã viết · 1")).toBeInTheDocument()
  })

  it("stays in edit mode, keeping the typed text, when a different entry is deleted", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    typeInto(screen.getByRole("textbox"), "Bài A đang sửa")
    fireEvent.click(screen.getByRole("button", { name: "Xoá bài 27/09 21:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(screen.getByRole("button", { name: "Cập nhật bài viết" })).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent("Bài A đang sửa")
    expect(screen.getByText("Nhật ký đã viết · 1")).toBeInTheDocument()
  })

  it("keeps the saved mood when only the text is edited, even after that mood was deleted from Settings", async () => {
    const savedMood = { emoji: "🥳", label: "Phấn khích", tint: "#FFF0B8", score: 5 } // không có trong Cài đặt
    seedEntries({ ...ENTRY_A, mood: savedMood }, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("Phấn khích")

    typeInto(screen.getByRole("textbox"), "Bài A chỉ sửa chữ")
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries[0]).toMatchObject({ text: "Bài A chỉ sửa chữ", mood: savedMood })
  })

  it("shows a switched-off mood of the edited entry as selected, and lets it be cleared", async () => {
    const savedMood = { emoji: "😔", label: "Buồn", tint: "#E4E9F2", score: 1 } // "Buồn" tắt sẵn trong Cài đặt mặc định
    seedEntries({ ...ENTRY_A, mood: savedMood }, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    const chip = screen.getByRole("button", { pressed: true })
    expect(chip).toHaveTextContent("Buồn")

    fireEvent.click(chip)
    typeInto(screen.getByRole("textbox"), "Bài A bỏ tâm trạng")
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries[0].mood).toBeNull()
  })

  it("keeps the stored mood snapshot instead of rebuilding it from the current Settings", async () => {
    // Cài đặt mặc định hiện có "Vui" với tint #FFE0C7, score 4 — bài này lưu bản cũ hơn.
    const savedMood = { emoji: "🙂", label: "Vui", tint: "#ABCDEF", score: 3 }
    seedEntries({ ...ENTRY_A, mood: savedMood }, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    typeInto(screen.getByRole("textbox"), "Bài A sửa chữ")
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries[0].mood).toEqual(savedMood)
  })

  it("keeps a half-written new entry and its mood while another entry is edited, and gives them back on Huỷ sửa", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    fireEvent.click(screen.getByText("Vui"))
    typeInto(editor, "Nháp bài mới hôm nay")

    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 28/09 20:00" }))
    expect(screen.getByRole("textbox")).toHaveTextContent(ENTRY_A.text)
    expect(screen.queryByRole("button", { pressed: true })).not.toBeInTheDocument() // bài A không có mood

    fireEvent.click(screen.getByRole("button", { name: "Huỷ sửa" }))

    expect(screen.getByRole("textbox")).toHaveTextContent("Nháp bài mới hôm nay")
    expect(screen.getByText("5 từ")).toBeInTheDocument()
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("Vui")
  })

  it("gives the new-entry draft back after the edited entry is updated, untouched by the edit", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    typeInto(await screen.findByRole("textbox"), "Nháp bài mới hôm nay")
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 28/09 20:00" }))
    typeInto(screen.getByRole("textbox"), "Bài A đã sửa lỗi chính tả")
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    expect(screen.getByText("Bài A đã sửa lỗi chính tả")).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent("Nháp bài mới hôm nay")
    expect(screen.getByRole("button", { name: "Lưu vào nhật ký" })).toBeEnabled()

    // Chữ gõ lúc sửa bài A không được lẫn vào bản nháp: sửa tiếp bài B rồi huỷ vẫn ra đúng bản nháp cũ.
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 27/09 21:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Huỷ sửa" }))
    expect(screen.getByRole("textbox")).toHaveTextContent("Nháp bài mới hôm nay")
  })

  it("gives the new-entry draft and its mood back when the entry being edited is deleted", async () => {
    seedEntries(ENTRY_A, ENTRY_B);
    render(<JournalView />);

    const editor = await screen.findByRole("textbox");
    fireEvent.click(screen.getByText("Vui"));
    typeInto(editor, "Nháp bài mới");
    fireEvent.click(
      screen.getByRole("button", { name: "Sửa bài 28/09 20:00" }),
    );
    typeInto(screen.getByRole("textbox"), "A sửa dở");
    fireEvent.click(
      screen.getByRole("button", { name: "Xoá bài 28/09 20:00" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }));

    expect(screen.getByRole("textbox")).toHaveTextContent("Nháp bài mới");
    expect(screen.getByText("3 từ")).toBeInTheDocument();
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent(
      "Vui",
    );
  });

  it("holds the new-entry draft through a failed update and gives it back with its mood after the retry", async () => {
    seedEntries(ENTRY_A, ENTRY_B);
    render(<JournalView />);

    const editor = await screen.findByRole("textbox");
    fireEvent.click(screen.getByText("Vui"));
    typeInto(editor, "Nháp bài mới");
    fireEvent.click(
      screen.getByRole("button", { name: "Sửa bài 28/09 20:00" }),
    );
    typeInto(screen.getByRole("textbox"), "A đã sửa");
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementationOnce(() => {
        throw new Error("quota exceeded");
      });
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }));
    setItemSpy.mockRestore();

    expect(screen.getByRole("textbox")).toHaveTextContent("A đã sửa");

    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }));

    const stored = JSON.parse(
      window.localStorage.getItem("journal-entries") ?? "{}",
    );
    expect(stored.entries[0]).toMatchObject({ text: "A đã sửa", mood: null });
    expect(screen.getByRole("textbox")).toHaveTextContent("Nháp bài mới");
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent(
      "Vui",
    );
  });

  it("takes a fresh Settings snapshot when the edited entry is given a different mood", async () => {
    seedEntries(
      {
        ...ENTRY_A,
        mood: { emoji: "old", label: "Vui", tint: "#ABCDEF", score: 3 },
      },
      ENTRY_B,
    );
    render(<JournalView />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }),
    );
    fireEvent.click(screen.getByText("Mệt"));
    typeInto(screen.getByRole("textbox"), "A có mood mới");
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }));

    const stored = JSON.parse(
      window.localStorage.getItem("journal-entries") ?? "{}",
    );
    expect(stored.entries[0]).toMatchObject({
      text: "A có mood mới",
      mood: { emoji: "😴", label: "Mệt", tint: "#EAF1FE", score: 2 },
    });
  });

  it("asks before discarding unsaved changes when switching from one edited entry to another", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    typeInto(screen.getByRole("textbox"), "Bài A sửa dở")
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 27/09 21:00" }))

    expect(screen.getByText("Bỏ thay đổi chưa lưu?")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục sửa" }))
    expect(screen.queryByText("Bỏ thay đổi chưa lưu?")).not.toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent("Bài A sửa dở")

    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 27/09 21:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }))
    expect(screen.getByRole("textbox")).toHaveTextContent(ENTRY_B.text)
    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries[0].text).toBe(ENTRY_A.text)
  })

  it("also asks when only the mood of the entry being edited was changed", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    fireEvent.click(screen.getByText("Vui"))
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 27/09 21:00" }))

    expect(screen.getByText("Bỏ thay đổi chưa lưu?")).toBeInTheDocument()
  })

  it("switches straight to another entry when the one being edited has no changes", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 27/09 21:00" }))

    expect(screen.queryByText("Bỏ thay đổi chưa lưu?")).not.toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent(ENTRY_B.text)
  })
})
