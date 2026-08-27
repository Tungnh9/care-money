const vi = {
  common: {
    appName: "Orange Banana",
    appDescription: "Tài chính, nhật ký và việc học của bạn — một nơi duy nhất.",
    switchLanguage: "Chuyển ngôn ngữ",
    loading: "Đang tải",
    calculator: "Máy tính",
    showMoney: "Hiện số tiền",
    hideMoney: "Ẩn số tiền",
    logout: "Đăng xuất",
  },
  netWorth: {
    title: "Tài sản ròng",
    savings: "Tiết kiệm",
    gold: "Vàng",
    invest: "Đầu tư",
    debt: "Nợ thẻ",
  },
  nav: {
    overview: "Tổng quan",
    finance: "Tài chính",
    journal: "Nhật ký",
    study: "Học tập",
    goals: "Mục tiêu",
    settings: "Cài đặt",
  },
  settings: {
    language: {
      title: "Ngôn ngữ",
      hint: "Chọn ngôn ngữ hiển thị cho ứng dụng",
    },
  },
  login: {
    title: "Đăng nhập",
    subtitle: "Nhập email và mật khẩu của bạn.",
    email: "Email",
    emailPlaceholder: "ban@email.com",
    password: "Mật khẩu",
    showPassword: "Hiện mật khẩu",
    hidePassword: "Ẩn mật khẩu",
    submitting: "Đang vào…",
    emptyCredentials: "Nhập email và mật khẩu để vào.",
    invalidEmail: "Email chưa đúng định dạng.",
    lockedOut: "Bạn đã nhập sai quá {maxAttempts} lần. Vui lòng thử lại sau {minutes} phút.",
    failedAttempt: "Đăng nhập không thành công. Còn {remaining} lần thử.",
    storageNote: "Mặc định lưu trên máy bạn. Đồng bộ giữa thiết bị là tuỳ chọn, chỉ bạn giữ secret.",
    heroLine1: "Giữ nhịp",
    heroLine2: "mỗi ngày.",
    heroSubtitle: "Tiền bạc, nhật ký và việc học của bạn — một nơi duy nhất, chỉ bạn nhìn thấy.",
  },
  calc: {
    hint: "Gõ bàn phím cũng được · Esc để đóng",
    close: "Đóng",
    clear: "Xoá hết",
    backspace: "Xoá một kí tự",
    invalidSyntax: "Sai cú pháp",
    restoreHistory: "Nạp lại {expr} bằng {result}",
  },
}

export default vi
export type Dictionary = typeof vi
