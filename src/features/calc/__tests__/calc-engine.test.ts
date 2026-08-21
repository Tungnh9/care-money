import { describe, it, expect } from "vitest"

import { round6, formatResult, toMachineString, evalExpr, nextParen } from "../calc-engine"

describe("evalExpr - phép tính cơ bản", () => {
  it("cộng đơn giản: 800+200 = 1000", () => {
    expect(evalExpr("800+200")).toBe(1000)
  })

  it("đúng thứ tự toán học tự nhiên (nhân trước cộng): 800+200×2 = 1200, không phải 2000", () => {
    const withoutParens = evalExpr("800+200×2")
    const withParens = evalExpr("(800+200)×2")
    expect(withoutParens).toBe(1200)
    expect(withParens).toBe(2000)
    expect(withoutParens).not.toBe(withParens)
  })

  it("dấu ngoặc thay đổi kết quả: (800+200)×2 = 2000", () => {
    expect(evalExpr("(800+200)×2")).toBe(2000)
  })

  it("phần trăm đơn lẻ: 50% = 0.5", () => {
    expect(evalExpr("50%")).toBe(0.5)
  })

  it("phần trăm trong biểu thức: 200+10% = 200.1", () => {
    expect(evalExpr("200+10%")).toBe(200.1)
  })

  it("thập phân kiểu Việt (dấu phẩy): 10,5+2 = 12.5 (number JS dùng dấu chấm)", () => {
    expect(evalExpr("10,5+2")).toBe(12.5)
  })
})

describe("evalExpr - đầu vào không hợp lệ trả về null", () => {
  it("chuỗi rỗng -> null", () => {
    expect(evalExpr("")).toBeNull()
  })

  it("chuỗi rác không có ký tự toán học -> null", () => {
    expect(evalExpr("abc")).toBeNull()
  })

  it("cú pháp sai (hai dấu cộng liên tiếp không có toán hạng) -> null", () => {
    expect(evalExpr("++")).toBeNull()
  })

  it("chia cho 0 -> null, KHÔNG throw lỗi riêng (5/0=Infinity fail isFinite)", () => {
    expect(() => evalExpr("5÷0")).not.toThrow()
    expect(evalExpr("5÷0")).toBeNull()
  })
})

describe("evalExpr - an toàn: không thể tiêm mã tuỳ ý qua Function()", () => {
  it("ký tự lạ (backtick) trộn vào số bị lọc sạch, biểu thức còn lại vẫn tính đúng: 800+`200` = 1000", () => {
    expect(evalExpr("800+`200`")).toBe(1000)
  })

  it("chữ/dấu = trộn vào không có tác dụng phụ nào - biến toàn cục không bị gán, phần toán học vẫn ra đúng", () => {
    const marker = { hacked: false }
    ;(globalThis as unknown as Record<string, unknown>).__calcEngineSecurityMarker = marker

    const result = evalExpr("800+200;globalThis.__calcEngineSecurityMarker.hacked=true")

    expect(marker.hacked).toBe(false)
    expect(result).toBe(1000)

    delete (globalThis as unknown as Record<string, unknown>).__calcEngineSecurityMarker
  })

  it("chuỗi kèm dấu ; và lệnh gọi hàm kiểu alert(1) không thực thi được - bị lọc/hỏng cú pháp, trả null an toàn (không throw ra ngoài)", () => {
    expect(() => evalExpr("800+200;alert(1)")).not.toThrow()
    expect(evalExpr("800+200;alert(1)")).toBeNull()
  })

  it("chuỗi kèm comment kiểu // không thực thi được - trả null an toàn (không throw ra ngoài)", () => {
    expect(() => evalExpr("1+1//comment")).not.toThrow()
    expect(evalExpr("1+1//comment")).toBeNull()
  })
})

describe("round6", () => {
  it("làm tròn đúng 6 chữ số thập phân: 800/3 -> 266.666667", () => {
    const v = evalExpr("800/3")
    expect(v).not.toBeNull()
    expect(round6(v as number)).toBeCloseTo(266.666667, 6)
  })
})

describe("formatResult", () => {
  it("phân tách hàng nghìn kiểu Việt Nam: 1200 -> '1.200'", () => {
    expect(formatResult(1200)).toBe("1.200")
  })

  it("phần thập phân dùng dấu phẩy đúng vị trí: 12.5 -> '12,5'", () => {
    expect(formatResult(12.5)).toBe("12,5")
  })

  it("trả 'Sai cú pháp' khi truyền NaN", () => {
    expect(formatResult(NaN)).toBe("Sai cú pháp")
  })

  it("trả 'Sai cú pháp' khi truyền Infinity", () => {
    expect(formatResult(Infinity)).toBe("Sai cú pháp")
  })
})

describe("toMachineString", () => {
  it("dùng dấu phẩy thập phân, KHÔNG có dấu chấm hàng nghìn: 1200 -> '1200'", () => {
    expect(toMachineString(1200)).toBe("1200")
    expect(toMachineString(1200)).not.toContain(".")
  })

  it("giữ phần thập phân với dấu phẩy: 12.5 -> '12,5'", () => {
    expect(toMachineString(12.5)).toBe("12,5")
  })

  it("chuỗi trả về nạp lại được vào evalExpr đúng giá trị ban đầu", () => {
    const v = evalExpr("800/3") as number
    const rounded = round6(v)
    const machine = toMachineString(v)
    expect(evalExpr(machine)).toBe(rounded)
  })
})

describe("nextParen", () => {
  it("expr chưa có ngoặc nào -> trả '('", () => {
    expect(nextParen("")).toBe("(")
    expect(nextParen("800+200")).toBe("(")
  })

  it("expr có 1 dấu '(' chưa đóng -> trả ')'", () => {
    expect(nextParen("800+(")).toBe(")")
  })

  it("expr có '()' cân bằng rồi -> trả '(' để mở ngoặc mới", () => {
    expect(nextParen("800+()")).toBe("(")
  })
})
