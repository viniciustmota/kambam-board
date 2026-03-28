import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SprintListPage from '@/components/sprint/SprintListPage'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
  usePathname: vi.fn().mockReturnValue('/sprints'),
}))

vi.mock('@/app/actions/sprints', () => ({
  createSprintAction: vi.fn(),
}))

vi.mock('@/app/actions/migration', () => ({
  migrateOrphanCardsAction: vi.fn(),
  getOrphanCardCountAction: vi.fn(),
}))

const sprintsWithMetrics = [
  {
    sprint: {
      id: 's1',
      name: 'Sprint 1',
      status: 'ACTIVE' as const,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-03-15'),
      qualidade: 8,
      dificuldade: 6,
    },
    metrics: {
      horasTotais: 24.5,
      custoTotal: 1800,
      cardsTotal: 10,
      cardsConcluidos: 7,
      cardsAtrasados: 1,
    },
  },
  {
    sprint: {
      id: 's2',
      name: 'Sprint 2',
      status: 'PLANNED' as const,
      startDate: null,
      endDate: null,
      qualidade: null,
      dificuldade: null,
    },
    metrics: {
      horasTotais: 0,
      custoTotal: 0,
      cardsTotal: 0,
      cardsConcluidos: 0,
      cardsAtrasados: 0,
    },
  },
]

describe('SprintListPage', () => {
  it('renders sprint names', () => {
    render(<SprintListPage sprintsWithMetrics={sprintsWithMetrics} boardId="b1" />)
    expect(screen.getByText('Sprint 1')).toBeInTheDocument()
    expect(screen.getByText('Sprint 2')).toBeInTheDocument()
  })

  it('renders hours for each sprint', () => {
    render(<SprintListPage sprintsWithMetrics={sprintsWithMetrics} boardId="b1" />)
    expect(screen.getByText(/24h/)).toBeInTheDocument()
  })

  it('renders progress percentage', () => {
    render(<SprintListPage sprintsWithMetrics={sprintsWithMetrics} boardId="b1" />)
    // 7/10 = 70% — appears in both progress bar and metrics grid
    const matches = screen.getAllByText(/70%/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('renders quality when set', () => {
    render(<SprintListPage sprintsWithMetrics={sprintsWithMetrics} boardId="b1" />)
    expect(screen.getByText(/8\/10/)).toBeInTheDocument()
  })

  it('each sprint card links to its kanban board', () => {
    render(<SprintListPage sprintsWithMetrics={sprintsWithMetrics} boardId="b1" />)
    const links = screen.getAllByRole('link').filter(l => l.getAttribute('href')?.startsWith('/sprints/'))
    expect(links.length).toBeGreaterThanOrEqual(2)
    expect(links[0]).toHaveAttribute('href', '/sprints/s1')
    expect(links[1]).toHaveAttribute('href', '/sprints/s2')
  })

  it('shows "Nova Sprint" button', () => {
    render(<SprintListPage sprintsWithMetrics={sprintsWithMetrics} boardId="b1" />)
    expect(screen.getByRole('button', { name: /nova sprint/i })).toBeInTheDocument()
  })

  it('shows empty state when no sprints', () => {
    render(<SprintListPage sprintsWithMetrics={[]} boardId="b1" />)
    expect(screen.getByText(/nenhuma sprint/i)).toBeInTheDocument()
  })
})
