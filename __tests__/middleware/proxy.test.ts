// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

function makeRequest(path: string, cookie?: string) {
  const url = `http://localhost${path}`
  const headers: Record<string, string> = {}
  if (cookie) headers['cookie'] = cookie
  return new NextRequest(url, { headers })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('proxy middleware', () => {
  it('calls next() when /api/me returns 200', async () => {
    mockFetch.mockResolvedValue({ status: 200 })

    const req = makeRequest('/dashboard', 'session=valid-token')
    const res = await proxy(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })

  it('redirects to /login and deletes cookie when /api/me returns 401', async () => {
    mockFetch.mockResolvedValue({ status: 401 })

    const req = makeRequest('/dashboard', 'session=orphan-token')
    const res = await proxy(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toMatch(/session/)
  })

  it('redirects to /login immediately when no session cookie present', async () => {
    const req = makeRequest('/dashboard')
    const res = await proxy(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('includes original path as ?from= param on redirect', async () => {
    const req = makeRequest('/sprints/s1')
    const res = await proxy(req)

    const location = res.headers.get('location') ?? ''
    expect(location).toContain('from=%2Fsprints%2Fs1')
  })
})
