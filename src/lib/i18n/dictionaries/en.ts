import type { Dictionary } from "./vi"

const en: Dictionary = {
  common: {
    appName: "Orange Banana",
    appDescription: "Your finances, journal, and study — all in one place.",
    switchLanguage: "Switch language",
    loading: "Loading",
    calculator: "Calculator",
    showMoney: "Show amount",
    hideMoney: "Hide amount",
    logout: "Log out",
  },
  netWorth: {
    title: "Net worth",
    savings: "Savings",
    gold: "Gold",
    invest: "Investments",
    debt: "Card debt",
  },
  nav: {
    overview: "Overview",
    finance: "Finance",
    journal: "Journal",
    study: "Study",
    goals: "Goals",
    settings: "Settings",
  },
  settings: {
    language: {
      title: "Language",
      hint: "Choose the app's display language",
    },
  },
  login: {
    title: "Login",
    subtitle: "Enter your email and password.",
    email: "Email",
    emailPlaceholder: "you@email.com",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submitting: "Signing in…",
    emptyCredentials: "Enter your email and password to continue.",
    invalidEmail: "That email doesn't look right.",
    lockedOut: "Too many failed attempts ({maxAttempts}). Try again in {minutes} minutes.",
    failedAttempt: "Login failed. {remaining} attempts left.",
    storageNote: "Stored on your device by default. Syncing across devices is optional — only you keep the secret.",
    heroLine1: "Keep the",
    heroLine2: "rhythm daily.",
    heroSubtitle: "Your money, journal, and study — all in one place, seen by no one but you.",
  },
  calc: {
    hint: "You can also type · Esc to close",
    close: "Close",
    clear: "Clear all",
    backspace: "Delete one character",
    invalidSyntax: "Invalid syntax",
    restoreHistory: "Reload {expr} as {result}",
  },
}

export default en
