// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/session', () => ({
  decrypt: vi.fn(),
}))

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    user: { findUnique: vi.fn() },
  }
  return { default: mockPrisma, prisma: mockPrisma }
})

const { mockDelete, mockGet, mockRedirect } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockGet: vi.fn(),
  mockRedirect: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: mockGet,
    delete: mockDelete,
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: (url: string) => { mockRedirect(url); throw new Error(`REDIRECT:${url}`) },
}))

import { decrypt } from '@/lib/session'
import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

const mockDecrypt = decrypt as ReturnType<typeof vi.fn>
const mockUserFindUnique = (prisma as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } }).user.findUnique

beforeEach(() => {
  vi.clearAllMocks()
  mockGet.mockReturnValue({ value: 'some-token' })
})

describe('verifySession', () => {
  it('returns session data when JWT valid and user exists with matching tokenVersion', async () => {
    mockDecrypt.mockResolvedValue({ userId: 'u1', role: 'admin', tokenVersion: 2 })
    mockUserFindUnique.mockResolvedValue({ id: 'u1', role: 'admin', tokenVersion: 2 })

    const result = await verifySession()

    expect(result.userId).toBe('u1')
    expect(result.role).toBe('admin')
    expect(result.isAuth).toBe(true)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes cookie and redirects when user does not exist in DB', async () => {
    mockDecrypt.mockResolvedValue({ userId: 'u1', role: 'member', tokenVersion: 0 })
    mockUserFindUnique.mockResolvedValue(null)

    await expect(verifySession()).rejects.toThrow('REDIRECT:/login')

    expect(mockDelete).toHaveBeenCalledWith('session')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('deletes cookie and redirects when tokenVersion in JWT differs from DB', async () => {
    mockDecrypt.mockResolvedValue({ userId: 'u1', role: 'member', tokenVersion: 0 })
    mockUserFindUnique.mockResolvedValue({ id: 'u1', role: 'member', tokenVersion: 3 })

    await expect(verifySession()).rejects.toThrow('REDIRECT:/login')

    expect(mockDelete).toHaveBeenCalledWith('session')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })
})
