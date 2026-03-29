import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import BottomNav from '@/components/layout/BottomNav'

const mockUsePathname = vi.fn().mockReturnValue('/sprints')

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

describe('BottomNav', () => {
  it('renders exactly 3 navigation tabs', () => {
    mockUsePathname.mockReturnValue('/sprints')
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sprints' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Perfil' })).toBeInTheDocument()
  })

  it('does NOT render a Board tab', () => {
    mockUsePathname.mockReturnValue('/sprints')
    render(<BottomNav />)
    expect(screen.queryByRole('link', { name: 'Board' })).not.toBeInTheDocument()
  })

  it('links point to correct routes', () => {
    mockUsePathname.mockReturnValue('/sprints')
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Sprints' })).toHaveAttribute('href', '/sprints')
    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/perfil')
  })

  it('marks the active tab based on current path', () => {
    mockUsePathname.mockReturnValue('/sprints')
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: 'Sprints' })).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark inactive tabs as current', () => {
    mockUsePathname.mockReturnValue('/sprints')
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Perfil' })).not.toHaveAttribute('aria-current', 'page')
  })

  it('does not render on /login', () => {
    mockUsePathname.mockReturnValue('/login')
    const { container } = render(<BottomNav />)
    expect(container.firstChild).toBeNull()
  })

  it('does not render on /register', () => {
    mockUsePathname.mockReturnValue('/register')
    const { container } = render(<BottomNav />)
    expect(container.firstChild).toBeNull()
  })

  it('renders on /sprints', () => {
    mockUsePathname.mockReturnValue('/sprints')
    render(<BottomNav />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
