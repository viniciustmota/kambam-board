export interface SessionPayload {
  userId: string
  role: string
  expiresAt: Date
  tokenVersion?: number
}

export type FormState = {
  errors?: Record<string, string | string[]>
  message?: string
} | undefined
