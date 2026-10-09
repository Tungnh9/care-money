// Reservoir sampling dùng chung: rút dần n phần tử ngẫu nhiên khỏi 1 danh sách qua splice lặp
// lại. Dùng chung cho cả pickDaily (daily-pick.ts, rnd() có seed để ra kết quả ổn định theo
// ngày) và pickRandomSet (game-calculations.ts, rnd() = Math.random() để thật sự ngẫu nhiên mỗi
// lượt chơi) — 2 nơi cần nguồn ngẫu nhiên khác nhau nhưng cùng 1 thuật toán rút mẫu, tránh 2 bản
// implementation trôi dần khỏi nhau theo thời gian.
function sampleWithRng<T>(list: T[], n: number, rnd: () => number): T[] {
  const pool = [...list]
  const out: T[] = []
  while (out.length < n && pool.length) {
    const [item] = pool.splice(Math.floor(rnd() * pool.length), 1)
    out.push(item)
  }
  return out
}

export { sampleWithRng }
