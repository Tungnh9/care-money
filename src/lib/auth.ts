const AUTH_STORAGE_KEY = "auth-user"

interface AuthUser {
  email: string
}

function getStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function setStoredUser(user: AuthUser) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
}

function clearStoredUser() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export { AUTH_STORAGE_KEY, getStoredUser, setStoredUser, clearStoredUser, type AuthUser }
