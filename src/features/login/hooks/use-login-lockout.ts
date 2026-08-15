"use client"

import { useCallback, useEffect, useState } from "react"

export const MAX_ATTEMPTS = 5
export const LOCKOUT_MINUTES = 10

const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000
const STORAGE_KEY = "login-lockout"

interface LockoutState {
  attempts: number
  lockedUntil: number | null
}

const INITIAL_STATE: LockoutState = { attempts: 0, lockedUntil: null }

function readState(): LockoutState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_STATE
    const parsed = JSON.parse(raw) as LockoutState
    if (parsed.lockedUntil && parsed.lockedUntil <= Date.now()) return INITIAL_STATE
    return parsed
  } catch {
    return INITIAL_STATE
  }
}

function writeState(state: LockoutState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function useLoginLockout() {
  const [state, setState] = useState<LockoutState>(INITIAL_STATE)

  useEffect(() => {
    // localStorage isn't available during SSR, so the real value can only be
    // synced after mount — the brief unlocked flash before this runs is expected.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readState())
  }, [])

  useEffect(() => {
    if (state.lockedUntil == null) return

    const timer = setTimeout(() => {
      setState(INITIAL_STATE)
      writeState(INITIAL_STATE)
    }, state.lockedUntil - Date.now())
    return () => clearTimeout(timer)
  }, [state.lockedUntil])

  const registerFailure = useCallback(() => {
    setState((prev) => {
      const attempts = prev.attempts + 1
      const next: LockoutState =
        attempts >= MAX_ATTEMPTS
          ? { attempts, lockedUntil: Date.now() + LOCKOUT_MS }
          : { attempts, lockedUntil: null }
      writeState(next)
      return next
    })
  }, [])

  const registerSuccess = useCallback(() => {
    writeState(INITIAL_STATE)
    setState(INITIAL_STATE)
  }, [])

  return {
    isLocked: state.lockedUntil != null,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - state.attempts),
    registerFailure,
    registerSuccess,
  }
}

export { useLoginLockout }
