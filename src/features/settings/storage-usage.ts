const KIB = 1024
const MIB = 1024 * 1024

// Hạn mức localStorage tính như Safari — chặt nhất, và là trình duyệt của mọi app trên iPhone: Safari giữ chuỗi
// dạng UTF-16 (2 byte/ký tự) và chặn ở 5 MB, tức ~2,6 triệu ký tự cho cả trang. Chrome chặn ở 5.242.880 ký tự
// (đo trên Chrome 156), gấp đôi Safari. Dữ liệu đồng bộ giữa các máy nên máy chặt nhất quyết định khi nào hết chỗ.
const LOCAL_STORAGE_QUOTA_MB = 5
const LOCAL_STORAGE_QUOTA_BYTES = LOCAL_STORAGE_QUOTA_MB * MIB

// Từ mức này trở lên: báo sắp đầy. Đầy rồi thì trình duyệt từ chối mọi lần ghi (khoản vừa nhập không được lưu),
// và Safari trên iOS 16 từng xoá sạch localStorage sau lỗi đầy — báo sớm để còn kịp xuất file.
const STORAGE_WARN_RATIO = 0.8

// Số byte localStorage cả trang đang dùng theo cách Safari tính: (độ dài key + độ dài giá trị) × 2 byte, cộng mọi
// key — kể cả key không phải dữ liệu app (secret đồng bộ, ẩn số tiền...), vì hạn mức tính chung cho cả trang.
// null khi trình duyệt chặn localStorage.
function measureLocalStorageBytes(): number | null {
  try {
    const storage = window.localStorage
    let chars = 0
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key !== null) chars += key.length + (storage.getItem(key)?.length ?? 0)
    }
    return chars * 2
  } catch {
    return null
  }
}

// "420 KB" dưới 1 MB, "1,24 MB" từ 1 MB — dấu phẩy thập phân như dòng "Đã tải" của Sao lưu file. Làm tròn tới
// 1024 KB thì đã là 1 MB, không hiện "1024 KB".
function formatStorageSize(bytes: number): string {
  const kib = Math.round(bytes / KIB)
  if (kib < 1024) return `${kib} KB`
  return `${(bytes / MIB).toFixed(2).replace(".", ",")} MB`
}

export {
  LOCAL_STORAGE_QUOTA_BYTES,
  LOCAL_STORAGE_QUOTA_MB,
  STORAGE_WARN_RATIO,
  formatStorageSize,
  measureLocalStorageBytes,
}
