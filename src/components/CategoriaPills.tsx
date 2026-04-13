import type { Categoria } from '../types'

interface CategoriaPillsProps {
  categorias: Categoria[]
  seleccionada: string | null
  onSelect: (codigo: string | null) => void
}

const pillBase = 'px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors'
const pillActive = 'bg-red-800 text-white border-red-800'
const pillInactive = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'

export function CategoriaPills({ categorias, seleccionada, onSelect }: CategoriaPillsProps) {
  if (categorias.length === 0) return null

  return (
    <div className="overflow-x-auto flex gap-2 pb-1">
      <button
        className={`${pillBase} ${seleccionada === null ? pillActive : pillInactive}`}
        onClick={() => onSelect(null)}
      >
        Todas
      </button>
      {categorias.map(cat => (
        <button
          key={cat.codigo}
          className={`${pillBase} ${seleccionada === cat.codigo ? pillActive : pillInactive}`}
          onClick={() => onSelect(cat.codigo)}
        >
          {cat.nombre}
        </button>
      ))}
    </div>
  )
}
