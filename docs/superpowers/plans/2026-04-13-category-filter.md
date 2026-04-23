# Category Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add horizontal scrollable category pills to `NuevoPedido` so users can filter the product catalog by category (01 = GRANJA SUIZA, 02 = KöS FOOD, etc.) while keeping the text search active.

**Architecture:** Category header rows (2-digit codes) already exist in the fetched catalog — no new fetches needed. A new `CategoriaPills` molecule handles display. `NuevoPedido` adds local state and updated filter logic. No changes to stores, hooks, or services.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 4, Vitest, @testing-library/react

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/CategoriaPills.tsx` | Scrollable pill bar — pure display, no logic |
| Create | `src/__tests__/CategoriaPills.test.tsx` | Unit tests for the component |
| Modify | `src/pages/NuevoPedido.tsx` | Add `categoriaSeleccionada` state, derive categories, update filter |

---

## Task 1: `CategoriaPills` component (TDD)

**Files:**
- Create: `src/__tests__/CategoriaPills.test.tsx`
- Create: `src/components/CategoriaPills.tsx`

- [ ] **Step 1.1: Write the failing tests**

Create `src/__tests__/CategoriaPills.test.tsx`:

```tsx
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
    expect(screen.getAllByRole('button')[0].className).toContain('bg-red-800')
  })

  it('category pill has active style when seleccionada matches', () => {
    render(<CategoriaPills categorias={categorias} seleccionada="01" onSelect={vi.fn()} />)
    expect(screen.getByText('GRANJA SUIZA').className).toContain('bg-red-800')
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
```

- [ ] **Step 1.2: Run tests — verify they FAIL**

```bash
npx vitest run src/__tests__/CategoriaPills.test.tsx
```

Expected: FAIL — `Cannot find module '../components/CategoriaPills'`

- [ ] **Step 1.3: Create `src/components/CategoriaPills.tsx`**

```tsx
interface Categoria {
  codigo: string
  nombre: string
}

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
    <div className="overflow-x-auto">
      <div className="flex gap-2 pb-1">
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
    </div>
  )
}
```

- [ ] **Step 1.4: Run tests — verify they PASS**

```bash
npx vitest run src/__tests__/CategoriaPills.test.tsx
```

Expected: 7 tests PASS

- [ ] **Step 1.5: Commit**

```bash
git add src/components/CategoriaPills.tsx src/__tests__/CategoriaPills.test.tsx
git commit -m "feat: add CategoriaPills molecule with tests"
```

---

## Task 2: Wire category filter into `NuevoPedido`

**Files:**
- Modify: `src/pages/NuevoPedido.tsx`

- [ ] **Step 2.1: Add `categoriaSeleccionada` state and import**

At the top of `NuevoPedido.tsx`, add the import:

```tsx
import { CategoriaPills } from '../components/CategoriaPills'
```

Inside the component, after the existing `catalogoSearch` state:

```tsx
const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null)
```

- [ ] **Step 2.2: Derive categories and update the filter**

Replace the existing `filteredCatalogo` block:

```tsx
// Before (current code):
const filteredCatalogo = catalogo.filter(p =>
  p.descripcion.toLowerCase().includes(catalogoSearch.toLowerCase()) ||
  p.codigo.toLowerCase().includes(catalogoSearch.toLowerCase())
)
```

With:

```tsx
// After:
const categorias = catalogo
  .filter(p => p.codigo.length === 2)
  .map(p => ({ codigo: p.codigo, nombre: p.descripcion }))

const filteredCatalogo = catalogo.filter(p => {
  if (p.codigo.length === 2) return false
  const matchCategoria = !categoriaSeleccionada || p.codigo.startsWith(categoriaSeleccionada)
  const matchTexto =
    p.descripcion.toLowerCase().includes(catalogoSearch.toLowerCase()) ||
    p.codigo.toLowerCase().includes(catalogoSearch.toLowerCase())
  return matchCategoria && matchTexto
})
```

- [ ] **Step 2.3: Mount `<CategoriaPills>` in the JSX**

In the Catálogo section, just after `<label className="block text-sm font-medium text-gray-700">Catálogo</label>` and before the `<input>`:

```tsx
{!catalogoLoading && (
  <CategoriaPills
    categorias={categorias}
    seleccionada={categoriaSeleccionada}
    onSelect={setCategoriaSeleccionada}
  />
)}
```

- [ ] **Step 2.4: Run the full test suite — verify nothing broke**

```bash
npx vitest run
```

Expected: all existing tests + 7 new CategoriaPills tests PASS

- [ ] **Step 2.5: Manual smoke test**

Start the dev server:

```bash
npm run dev
```

Verify:
1. Category pills appear above the search input once catalog loads
2. "Todas" is active by default and shows all products (no 2-digit code rows)
3. Clicking a category pill filters the list to that category only
4. Text search within a selected category works
5. Clicking "Todas" restores the full list
6. Pills are hidden while catalog is loading

- [ ] **Step 2.6: Commit**

```bash
git add src/pages/NuevoPedido.tsx
git commit -m "feat: filter catalog by category in NuevoPedido"
```
