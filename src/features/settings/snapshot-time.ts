// Có cả năm: bản sao cũ cả năm trời vẫn phải nhận ra được là cũ.
function formatSnapshotTime(iso: string | null): string {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return "không rõ thời điểm"
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
  return `${time} ngày ${date}`
}

export { formatSnapshotTime }
