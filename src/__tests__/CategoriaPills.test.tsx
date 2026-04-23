import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoriaPills } from '../components/CategoriaPills'

const categorias = [
  { codigo: '01', nombre: 'GRANJA SUIZA' },
  { codigo: '02', nombre: 'KöS FOOD' },
]

describe('CategoriaPills', () => {
  it('renders null when categorias is empty', () => {
    const { container } = render(
      <CategoriaPills categorias={[]} seleccionada={null} onSelect={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('always renders "Todas" pill first', () => {
    render(<CategoriaPills categorias={categorias} seleccionada={null} onSelect={vi.fn()} />)
    expect(screen.getAllByRole('button')[0]).toHaveTextContent('Todas')
  })

  it('renders one pill per category', () => {
    render(<CategoriaPills categorias={categorias} seleccionada={null} onSelect={vi.fn()} />)
    expect(screen.getByText('GRANJA SUIZA')).toBeInTheDocument()
    expect(screen.getByText('KöS FOOD')).toBeInTheDocument()
  })

  it('"Todas" pill has active style when seleccionada is null', () => {
    render(<CategoriaPills categorias={categorias} seleccionada={null} onSelect={vi.fn()} />)
    expect(screen.getAllByRole('button')[0].className).toContain('bg-brand-800')
  })

  it('category pill has active style when seleccionada matches', () => {
    render(<CategoriaPills categorias={categorias} seleccionada="01" onSelect={vi.fn()} />)
    expect(screen.getByText('GRANJA SUIZA').className).toContain('bg-brand-800')
  })

  it('clicking "Todas" calls onSelect(null)', async () => {
    const onSelect = vi.fn()
    render(<CategoriaPills categorias={categorias} seleccionada="01" onSelect={onSelect} />)
    await userEvent.click(screen.getAllByRole('button')[0])
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('clicking a category pill calls onSelect with its codigo', async () => {
    const onSelect = vi.fn()
    render(<CategoriaPills categorias={categorias} seleccionada={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('KöS FOOD'))
    expect(onSelect).toHaveBeenCalledWith('02')
  })
})
