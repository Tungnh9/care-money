// Tách lời chào ở hồ sơ ("Chào buổi sáng, Tungnh2k1") thành câu chào + tên hiển thị — Tổng quan tô riêng
// phần tên, Cài đặt giữ lại câu chào khi đổi tên hiển thị. 2 feature cùng dùng nên nằm cạnh settings-storage.
interface GreetingParts {
  prefix: string
  name: string
}

function splitGreeting(greeting: string, displayName: string): GreetingParts {
  const suffix = `, ${displayName}`
  if (displayName && greeting.endsWith(suffix)) {
    return { prefix: greeting.slice(0, greeting.length - suffix.length), name: displayName }
  }
  return { prefix: greeting, name: "" }
}

export { splitGreeting, type GreetingParts }
