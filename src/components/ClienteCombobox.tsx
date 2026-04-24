import { useRef, useEffect, useState, useId } from 'react'
import type { Cliente } from '../types'

function getExtra(extra: Record<string, string>, key: string): string {
  const lkey = key.toLowerCase()
  const found = Object.keys(extra).find(k => k.toLowerCase() === lkey)
  return found ? extra[found] : ''
}

interface ClienteComboboxProps {
  query: string
  onQueryChange: (q: string) => void
  clientes: Cliente[]
  loading: boolean
  onSelect: (c: Cliente) => void
}

export function ClienteCombobox({ query, onQueryChange, clientes, loading, onSelect }: ClienteComboboxProps) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()

  useEffect(() => {
    setIsOpen(clientes.length > 0)
    setActiveIndex(-1)
  }, [clientes])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen && clientes.length > 0) { setIsOpen(true); return }
      setActiveIndex(i => Math.min(i + 1, clientes.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (isOpen && activeIndex >= 0) {
        e.preventDefault()
        handleSelect(clientes[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  function handleSelect(c: Cliente) {
    onSelect(c)
    setIsOpen(false)
    setActiveIndex(-1)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
        placeholder="Buscar por nombre, CUIT o código…"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (clientes.length > 0) setIsOpen(true) }}
        autoComplete="off"
        autoFocus
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
        style={{ borderColor: 'var(--color-border)' }}
      />

      {loading && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Buscando…</p>
      )}

      {isOpen && clientes.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-52 overflow-y-auto"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {clientes.map((c, i) => (
            <li
              key={c.rowIndex}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={e => { e.preventDefault(); handleSelect(c) }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                i < clientes.length - 1 ? 'border-b' : ''
              } ${i === activeIndex ? 'bg-brand-50' : 'hover:bg-[#faf7f8]'}`}
              style={i < clientes.length - 1 ? { borderColor: 'var(--color-border)' } : {}}
            >
              <p className="font-medium text-gray-900">
                {c.nombre}
                {getExtra(c.extra, 'nombre comercial') && (
                  <span className="ml-2 text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>
                    {getExtra(c.extra, 'nombre comercial')}
                  </span>
                )}
              </p>
              {getExtra(c.extra, 'localidad') && (
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {getExtra(c.extra, 'localidad')}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
