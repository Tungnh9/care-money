const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]

function longDate(d: Date = new Date()): string {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}`
}

export { longDate }
