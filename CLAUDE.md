# Fopaci — CLAUDE.md

## Stack
React 18 + TypeScript + Tailwind CSS 4 + Vite + Zustand 5 + react-router-dom v7 + Vitest + jsPDF + IndexedDB (idb)

## Context Navigation
When you need to understand the codebase, docs, or any files in this project:
1. ALWAYS query the knowledge graph first: `/graphify query "your question"`
2. Only read raw files if I explicitly say "read the file" or "look at the raw file"
3. Use `graphify-out/GRAPH_REPORT.md` as entrypoint to see communities and god nodes

## Key God Nodes
- `openVinotecaDB()` — IndexedDB setup (offlineQueue.ts)
- `fetchGviz()` / `buildGvizUrl()` — Google Sheets integration (sheets.ts)
- `cellValue()` / `mapProducto()` / `mapCliente()` — data mapping (sheets.ts)

## Communities
- **offlinequeue** — IndexedDB offline queue (src/db/offlineQueue.ts)
- **sheets / fetchcatalogo** — Google Sheets API client (src/services/sheets.ts)
- **app / main** — entry points (src/App.tsx, src/main.tsx)
- **types / index** — shared types (src/types/index.ts)

---

## Architecture Rules (Atomic Design + Uncle Bob)

### Folder Structure
```
src/
  atoms/          # Primitivos UI: Button, Input, Icon, Badge — sin lógica de negocio
  molecules/      # Combinan atoms: SearchBar, FormField, CardItem
  organisms/      # Secciones completas: Header, DataTable, OrderList
  features/       # Por feature: components/ + hooks/ + store/ + types/
  services/       # Solo lógica externa (IndexedDB, fetch, Google Sheets) — sin UI
  hooks/          # Hooks reutilizables entre features
  store/          # Zustand stores globales
  types/          # Interfaces y tipos globales
  pages/          # Route-level components — solo componen organisms/features
```

### SOLID aplicado a React/TypeScript

**SRP — Single Responsibility**
- Un componente = una responsabilidad visual. Extraer lógica a custom hooks.
- Un hook = un caso de uso. `useOfflineQueue`, `useCatalogo`, no hooks genéricos con 5 responsabilidades.
- Un service = un origen de datos. No mezclar IndexedDB con Google Sheets en el mismo archivo.

**OCP — Open/Closed**
- Extender componentes vía props y composition, nunca modificar el componente base.
- Preferir render props o children sobre if/else internos que crecen con el tiempo.

**LSP — Liskov**
- Los componentes que aceptan la misma interfaz deben ser intercambiables.
- Tipar props con interfaces explícitas, no `any` ni `object`.

**ISP — Interface Segregation**
- Props interfaces pequeñas y específicas. No pasar un objeto grande cuando solo se necesitan 2 campos.
- Separar `DisplayProps` de `BehaviorProps` si el componente crece.

**DIP — Dependency Inversion**
- Componentes dependen de interfaces/abstracciones, no de implementaciones concretas.
- Nunca llamar `openVinotecaDB()` o `fetchGviz()` directamente desde un componente — pasar vía hook o prop.

### Reglas siempre activas

**NUNCA:**
- Lógica de negocio (fetch, cálculos, transformaciones) dentro de componentes JSX
- Llamadas directas a IndexedDB o Google Sheets desde un componente
- Props drilling > 2 niveles — usar Zustand store
- Componentes > 150 líneas sin dividir
- `useEffect` para derivar estado — usar `useMemo` o calcular en el store
- `any` en TypeScript

**SIEMPRE:**
- Custom hook para cada operación de datos (`useOfflineQueue`, `useSheetsData`)
- Tipos explícitos en todas las funciones públicas y props
- Separar el "qué mostrar" (componente) del "cómo obtenerlo" (hook/service)
- Nombres que revelan intención (Uncle Bob: `getActivePendingOrders`, no `getData`)
- Un archivo = una exportación principal
