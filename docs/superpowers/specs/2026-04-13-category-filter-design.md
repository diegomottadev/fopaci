# Category Filter — Design Spec
Date: 2026-04-13

## Summary
Add horizontal scrollable category pills to `NuevoPedido` so the user can filter the product catalog by category (01 = GRANJA SUIZA, 02 = KöS FOOD, etc.) while keeping the existing text search active.

## Data Model

The Google Sheet catalog already contains category header rows:
- `codigo.length === 2` → category header row (e.g. `{ codigo: "01", descripcion: "GRANJA SUIZA" }`)
- `codigo.length > 2` → real product row (e.g. `0101`, `0101GS0220`)

No changes to `useCatalogo`, `sheets.ts`, or `types/index.ts`. Categories and products are derived from the data already fetched.

## Filtering Logic

```ts
const categorias = catalogo
  .filter(p => p.codigo.length === 2)
  .map(p => ({ codigo: p.codigo, nombre: p.descripcion }))

const productosCatalogo = catalogo.filter(p => p.codigo.length > 2)

const filteredCatalogo = productosCatalogo.filter(p => {
  const matchCategoria = !categoriaSeleccionada || p.codigo.startsWith(categoriaSeleccionada)
  const matchTexto =
    p.descripcion.toLowerCase().includes(catalogoSearch.toLowerCase()) ||
    p.codigo.toLowerCase().includes(catalogoSearch.toLowerCase())
  return matchCategoria && matchTexto
})
```

Category filter and text search are **independent and cumulative** — both can be active simultaneously.

## Components

### New: `src/components/CategoriaPills.tsx`
- Molecule — no business logic, pure display + callback
- Props:
  ```ts
  interface CategoriaPillsProps {
    categorias: { codigo: string; nombre: string }[]
    seleccionada: string | null
    onSelect: (codigo: string | null) => void
  }
  ```
- Renders a horizontally scrollable row (`overflow-x-auto flex gap-2 pb-1`)
- "Todas" pill always first (`onSelect(null)`)
- One pill per category
- Active pill: `bg-red-800 text-white border-red-800`
- Inactive pill: `bg-white text-gray-700 border-gray-300 hover:bg-gray-50`

### Modified: `src/pages/NuevoPedido.tsx`
- Add local state: `const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null)`
- Derive `categorias` and `productosCatalogo` from `catalogo`
- Replace current `filteredCatalogo` with combined category + text filter
- Mount `<CategoriaPills>` above the search input in the Catálogo section

## Edge Cases & Decisions

- **Loading / empty catalog**: `CategoriaPills` renders `null` while `catalogoLoading` is true or `categorias` is empty — no flash of empty pills.
- **Category with no products**: The existing "Sin resultados" empty state in `NuevoPedido` already handles this — no additional UI needed.
- **Prefix invariant**: All category codes are exactly 2 digits (confirmed by business owner, enforced by the Google Sheet structure). Products always have `codigo.length > 2`, so `startsWith(categoriaSeleccionada)` never produces false matches. No runtime guard is added — the data source is controlled and not user-generated.
- **Scroll on selection**: Pill row scroll position is unchanged on selection — no auto-scroll to active pill.
- **Filter persistence**: `categoriaSeleccionada` is local state — intentionally resets on navigation. Out of scope.

## Scope
- No changes to Zustand stores
- No changes to hooks or services
- No new routes
- `CategoriaPills` lives in `src/components/` — consistent with existing components (OfflineBadge, Layout, Toast)

## Success Criteria
1. Pills render correctly with all categories from the sheet
2. Selecting a pill filters the product list to that category only
3. Text search within a selected category works
4. "Todas" shows all products
5. Category header rows (`codigo.length === 2`) never appear in the product list
6. Pills are hidden while catalog is loading
