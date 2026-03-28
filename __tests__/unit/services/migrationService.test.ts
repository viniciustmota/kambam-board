// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  default: {
    card: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    sprint: {
      create: vi.fn(),
    },
    sprintColumn: {
      create: vi.fn(),
    },
  },
}))

import prisma from '@/lib/prisma'
import { migrateOrphanCards } from '@/services/migrationService'

const mockPrisma = prisma as {
  card: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  sprint: { create: ReturnType<typeof vi.fn> }
  sprintColumn: { create: ReturnType<typeof vi.fn> }
}

beforeEach(() => vi.clearAllMocks())

describe('migrateOrphanCards', () => {
  it('returns migrated=0 when there are no orphan cards', async () => {
    mockPrisma.card.findMany.mockResolvedValue([])
    const result = await migrateOrphanCards('b1')
    expect(result).toEqual({ sprintId: '', migrated: 0 })
    expect(mockPrisma.sprint.create).not.toHaveBeenCalled()
  })

  it('creates "Sprint Backlog Inicial" sprint when orphan cards exist', async () => {
    mockPrisma.card.findMany.mockResolvedValue([
      { id: 'c1', column: { title: 'To Do' } },
    ])
    mockPrisma.sprint.create.mockResolvedValue({ id: 'sprint-new' })
    mockPrisma.sprintColumn.create
      .mockResolvedValueOnce({ id: 'sc-todo' })
      .mockResolvedValueOnce({ id: 'sc-doing' })
      .mockResolvedValueOnce({ id: 'sc-done' })
    mockPrisma.card.update.mockResolvedValue({})

    await migrateOrphanCards('b1')

    expect(mockPrisma.sprint.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ boardId: 'b1', name: 'Sprint Backlog Inicial', status: 'ACTIVE' }),
      })
    )
  })

  it('creates 3 sprint columns (A Fazer, Em Andamento, Concluído)', async () => {
    mockPrisma.card.findMany.mockResolvedValue([
      { id: 'c1', column: { title: 'Backlog' } },
    ])
    mockPrisma.sprint.create.mockResolvedValue({ id: 'sprint-new' })
    mockPrisma.sprintColumn.create
      .mockResolvedValueOnce({ id: 'sc-todo' })
      .mockResolvedValueOnce({ id: 'sc-doing' })
      .mockResolvedValueOnce({ id: 'sc-done' })
    mockPrisma.card.update.mockResolvedValue({})

    await migrateOrphanCards('b1')

    const createCalls = mockPrisma.sprintColumn.create.mock.calls.map((c: unknown[]) => (c[0] as { data: { title: string; position: number } }).data.title)
    expect(createCalls).toContain('A Fazer')
    expect(createCalls).toContain('Em Andamento')
    expect(createCalls).toContain('Concluído')
  })

  it('maps cards from "Concluído"-like columns to the done sprint column', async () => {
    mockPrisma.card.findMany.mockResolvedValue([
      { id: 'c1', column: { title: 'Concluído' } },
      { id: 'c2', column: { title: 'Done' } },
    ])
    mockPrisma.sprint.create.mockResolvedValue({ id: 'sprint-new' })
    mockPrisma.sprintColumn.create
      .mockResolvedValueOnce({ id: 'sc-todo' })
      .mockResolvedValueOnce({ id: 'sc-doing' })
      .mockResolvedValueOnce({ id: 'sc-done' })
    mockPrisma.card.update.mockResolvedValue({})

    await migrateOrphanCards('b1')

    const updateCalls = mockPrisma.card.update.mock.calls as { where: { id: string }; data: { sprintColumnId: string } }[][]
    const c1Update = updateCalls.find(([arg]) => arg.where.id === 'c1')
    const c2Update = updateCalls.find(([arg]) => arg.where.id === 'c2')
    expect(c1Update![0].data.sprintColumnId).toBe('sc-done')
    expect(c2Update![0].data.sprintColumnId).toBe('sc-done')
  })

  it('maps cards from "Em Andamento"-like columns to the doing sprint column', async () => {
    mockPrisma.card.findMany.mockResolvedValue([
      { id: 'c1', column: { title: 'Em Andamento' } },
      { id: 'c2', column: { title: 'In Progress' } },
    ])
    mockPrisma.sprint.create.mockResolvedValue({ id: 'sprint-new' })
    mockPrisma.sprintColumn.create
      .mockResolvedValueOnce({ id: 'sc-todo' })
      .mockResolvedValueOnce({ id: 'sc-doing' })
      .mockResolvedValueOnce({ id: 'sc-done' })
    mockPrisma.card.update.mockResolvedValue({})

    await migrateOrphanCards('b1')

    const updateCalls = mockPrisma.card.update.mock.calls as { where: { id: string }; data: { sprintColumnId: string } }[][]
    const c1Update = updateCalls.find(([arg]) => arg.where.id === 'c1')
    const c2Update = updateCalls.find(([arg]) => arg.where.id === 'c2')
    expect(c1Update![0].data.sprintColumnId).toBe('sc-doing')
    expect(c2Update![0].data.sprintColumnId).toBe('sc-doing')
  })

  it('maps other columns to the todo sprint column', async () => {
    mockPrisma.card.findMany.mockResolvedValue([
      { id: 'c1', column: { title: 'Backlog' } },
      { id: 'c2', column: { title: 'A Fazer' } },
    ])
    mockPrisma.sprint.create.mockResolvedValue({ id: 'sprint-new' })
    mockPrisma.sprintColumn.create
      .mockResolvedValueOnce({ id: 'sc-todo' })
      .mockResolvedValueOnce({ id: 'sc-doing' })
      .mockResolvedValueOnce({ id: 'sc-done' })
    mockPrisma.card.update.mockResolvedValue({})

    await migrateOrphanCards('b1')

    const updateCalls = mockPrisma.card.update.mock.calls as { where: { id: string }; data: { sprintColumnId: string } }[][]
    const c1Update = updateCalls.find(([arg]) => arg.where.id === 'c1')
    const c2Update = updateCalls.find(([arg]) => arg.where.id === 'c2')
    expect(c1Update![0].data.sprintColumnId).toBe('sc-todo')
    expect(c2Update![0].data.sprintColumnId).toBe('sc-todo')
  })

  it('returns count of migrated cards and new sprintId', async () => {
    mockPrisma.card.findMany.mockResolvedValue([
      { id: 'c1', column: { title: 'Backlog' } },
      { id: 'c2', column: { title: 'Backlog' } },
      { id: 'c3', column: { title: 'Concluído' } },
    ])
    mockPrisma.sprint.create.mockResolvedValue({ id: 'sprint-abc' })
    mockPrisma.sprintColumn.create
      .mockResolvedValueOnce({ id: 'sc-todo' })
      .mockResolvedValueOnce({ id: 'sc-doing' })
      .mockResolvedValueOnce({ id: 'sc-done' })
    mockPrisma.card.update.mockResolvedValue({})

    const result = await migrateOrphanCards('b1')

    expect(result).toEqual({ sprintId: 'sprint-abc', migrated: 3 })
  })

  it('assigns sequential sprintPosition per column', async () => {
    mockPrisma.card.findMany.mockResolvedValue([
      { id: 'c1', column: { title: 'Backlog' } },
      { id: 'c2', column: { title: 'Backlog' } },
      { id: 'c3', column: { title: 'Backlog' } },
    ])
    mockPrisma.sprint.create.mockResolvedValue({ id: 'sprint-new' })
    mockPrisma.sprintColumn.create
      .mockResolvedValueOnce({ id: 'sc-todo' })
      .mockResolvedValueOnce({ id: 'sc-doing' })
      .mockResolvedValueOnce({ id: 'sc-done' })
    mockPrisma.card.update.mockResolvedValue({})

    await migrateOrphanCards('b1')

    const positions = mockPrisma.card.update.mock.calls.map(
      (c: unknown[]) => (c[0] as { data: { sprintPosition: number } }).data.sprintPosition
    )
    expect(positions).toContain(0)
    expect(positions).toContain(1)
    expect(positions).toContain(2)
  })
})
