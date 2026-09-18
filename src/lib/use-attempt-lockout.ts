"use client"

import { useCallback, useEffect, useState } from "react"

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 10
const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000

interface LockoutState {
  attempts: number
  lockedUntil: number | null
}

const INITIAL_STATE: LockoutState = { attempts: 0, lockedUntil: null }

function readState(storageKey: string): LockoutState {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return INITIAL_STATE
    const parsed = JSON.parse(raw) as LockoutState
    if (parsed.lockedUntil && parsed.lockedUntil <= Date.now()) return INITIAL_STATE
    return parsed
  } catch {
    return INITIAL_STATE
  }
}

function writeState(storageKey: string, state: LockoutState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state))
}

// Dùng chung cho mọi luồng "khoá tạm sau N lần nhập sai" trong app (đăng nhập, xác nhận mật khẩu
// trước khi xoá dữ liệu...) — mỗi nơi gọi truyền 1 storageKey riêng nên trạng thái không đụng nhau.
function useAttemptLockout(storageKey: string) {
  const [state, setState] = useState<LockoutState>(INITIAL_STATE)

  useEffect(() => {
    // localStorage isn't available during SSR, so the real value can only be
    // synced after mount — the brief unlocked flash before this runs is expected.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readState(storageKey))
  }, [storageKey])

  useEffect(() => {
    if (state.lockedUntil == null) return

    const timer = setTimeout(() => {
      setState(INITIAL_STATE)
      writeState(storageKey, INITIAL_STATE)
    }, state.lockedUntil - Date.now())
    return () => clearTimeout(timer)
  }, [state.lockedUntil, storageKey])

  const registerFailure = useCallback(() => {
    setState((prev) => {
      const attempts = prev.attempts + 1
      const next: LockoutState =
        attempts >= MAX_ATTEMPTS
          ? { attempts, lockedUntil: Date.now() + LOCKOUT_MS }
          : { attempts, lockedUntil: null }
      writeState(storageKey, next)
      return next
    })
  }, [storageKey])

  const registerSuccess = useCallback(() => {
    writeState(storageKey, INITIAL_STATE)
    setState(INITIAL_STATE)
  }, [storageKey])

  return {
    isLocked: state.lockedUntil != null,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - state.attempts),
    registerFailure,
    registerSuccess,
  }
}

export { useAttemptLockout, MAX_ATTEMPTS, LOCKOUT_MINUTES }
