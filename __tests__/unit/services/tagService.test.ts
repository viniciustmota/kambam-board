// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  default: {
    tag: {
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    cardTag: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    card: {
      findUnique: vi.fn(),
    },
  },
}))

import prisma from '@/lib/prisma'
import { createTag, assignTagToCard, removeTagFromCard, getTagsForUser } from '@/services/tagService'

const mockPrisma = prisma as {
  tag: {
    create: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  cardTag: {
    create: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  card: {
    findUnique: ReturnType<typeof vi.fn>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createTag', () => {
  it('throws ValidationError on empty name', async () => {
    await expect(createTag({ name: '', color: '#ef4444', userId: 'u1' })).rejects.toThrow()
  })

  it('creates tag record and returns it', async () => {
    mockPrisma.tag.create.mockResolvedValue({ id: 't1', name: 'bug', color: '#ef4444', userId: 'u1' })
    const tag = await createTag({ name: 'bug', color: '#ef4444', userId: 'u1' })
    expect(mockPrisma.tag.create).toHaveBeenCalledOnce()
    expect(tag.name).toBe('bug')
  })
})

describe('assignTagToCard', () => {
  it('creates CardTag join record', async () => {
    mockPrisma.cardTag.create.mockResolvedValue({ cardId: 'c1', tagId: 't1' })
    await assignTagToCard('c1', 't1')
    expect(mockPrisma.cardTag.create).toHaveBeenCalledWith({ data: { cardId: 'c1', tagId: 't1' } })
  })
})

describe('removeTagFromCard', () => {
  it('deletes the CardTag record', async () => {
    mockPrisma.cardTag.delete.mockResolvedValue({ cardId: 'c1', tagId: 't1' })
    await removeTagFromCard('c1', 't1')
    expect(mockPrisma.cardTag.delete).toHaveBeenCalledWith({
      where: { cardId_tagId: { cardId: 'c1', tagId: 't1' } },
    })
  })
})

describe('getTagsForUser', () => {
  it('returns all tags for a userId', async () => {
    mockPrisma.tag.findMany.mockResolvedValue([
      { id: 't1', name: 'bug', userId: 'u1' },
      { id: 't2', name: 'feature', userId: 'u1' },
    ])
    const tags = await getTagsForUser('u1')
    expect(tags).toHaveLength(2)
    expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({ where: { userId: 'u1' } })
  })
})
