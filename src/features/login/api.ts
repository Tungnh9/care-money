import { MOCK_ACCOUNT } from "./mock-data"

const MOCK_DELAY_MS = 900

async function login(email: string, password: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
  return email === MOCK_ACCOUNT.email && password === MOCK_ACCOUNT.password
}

export { login }
