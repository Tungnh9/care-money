"use client"

import { useAttemptLockout, MAX_ATTEMPTS, LOCKOUT_MINUTES } from "@/lib/use-attempt-lockout"

const LOGIN_LOCKOUT_STORAGE_KEY = "login-lockout"

function useLoginLockout() {
  return useAttemptLockout(LOGIN_LOCKOUT_STORAGE_KEY)
}

export { useLoginLockout, MAX_ATTEMPTS, LOCKOUT_MINUTES }
