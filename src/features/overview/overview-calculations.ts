function monthLabel(d: Date = new Date()): string {
  return `tháng ${d.getMonth() + 1}`
}

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

export { monthLabel, splitGreeting, type GreetingParts }
