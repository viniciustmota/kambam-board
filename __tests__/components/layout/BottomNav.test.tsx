import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import BottomNav from '@/components/layout/BottomNav'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/sprints'),
}))

describe('BottomNav', () => {
  it('renders exactly 3 navigation tabs', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sprints' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Perfil' })).toBeInTheDocument()
  })

  it('does NOT render a Board tab', () => {
    render(<BottomNav />)
    expect(screen.queryByRole('link', { name: 'Board' })).not.toBeInTheDocument()
  })

  it('links point to correct routes', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Sprints' })).toHaveAttribute('href', '/sprints')
    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/perfil')
  })

  it('marks the active tab based on current path', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: 'Sprints' })).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark inactive tabs as current', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Perfil' })).not.toHaveAttribute('aria-current', 'page')
  })
})
