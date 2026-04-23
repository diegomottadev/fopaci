# Graph Report - C:/Users/ACER/Documents/Develop/fopaci  (2026-04-13)

## Corpus Check
- Corpus is ~2,293 words - fits in a single context window. You may not need a graph.

## Summary
- 48 nodes · 60 edges · 13 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_react  logo  eslint|react / logo / eslint]]
- [[_COMMUNITY_offlinequeue  addpendingorder  countpendingorders|offlinequeue / addpendingorder / countpendingorders]]
- [[_COMMUNITY_sheets  buildgvizurl  fetchcatalogo|sheets / buildgvizurl / fetchcatalogo]]
- [[_COMMUNITY_sheets  buscarencliente  cellnumber|sheets / buscarencliente / cellnumber]]
- [[_COMMUNITY_app  main|app / main]]
- [[_COMMUNITY_eslint|eslint]]
- [[_COMMUNITY_vite|vite]]
- [[_COMMUNITY_vitest|vitest]]
- [[_COMMUNITY_vite  env|vite / env]]
- [[_COMMUNITY_types  index|types / index]]
- [[_COMMUNITY_tests  offlinequeue|tests / offlinequeue]]
- [[_COMMUNITY_tests  sheets|tests / sheets]]
- [[_COMMUNITY_swc|swc]]

## God Nodes (most connected - your core abstractions)
1. `Fopaci Project` - 10 edges
2. `openVinotecaDB()` - 9 edges
3. `fetchGviz()` - 6 edges
4. `buildGvizUrl()` - 5 edges
5. `cellValue()` - 3 edges
6. `mapProducto()` - 3 edges
7. `mapCliente()` - 3 edges
8. `fetchCatalogo()` - 3 edges
9. `fetchVendedores()` - 3 edges
10. `fetchClientes()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `React Logo (SVG)` --semantically_similar_to--> `React`  [INFERRED] [semantically similar]
  src/assets/react.svg → README.md
- `Vite Logo (SVG)` --semantically_similar_to--> `Vite`  [INFERRED] [semantically similar]
  public/vite.svg → README.md
- `Fopaci Project` --references--> `Vite Logo (SVG)`  [INFERRED]
  README.md → public/vite.svg
- `Fopaci Project` --references--> `React Logo (SVG)`  [INFERRED]
  README.md → src/assets/react.svg

## Communities

### Community 0 - "react / logo / eslint"
Cohesion: 0.21
Nodes (12): React Logo (SVG), Babel, ESLint, eslint-plugin-react, Fopaci Project, Hot Module Replacement (HMR), @vitejs/plugin-react, React (+4 more)

### Community 1 - "offlinequeue / addpendingorder / countpendingorders"
Cohesion: 0.33
Nodes (9): addPendingOrder(), countPendingOrders(), getAllPendingOrders(), getCatalogo(), getVendedores(), openVinotecaDB(), removePendingOrder(), saveCatalogo() (+1 more)

### Community 2 - "sheets / buildgvizurl / fetchcatalogo"
Cohesion: 0.43
Nodes (7): buildGvizUrl(), fetchCatalogo(), fetchClientes(), fetchGviz(), fetchPedidos(), fetchVendedores(), parseGviz()

### Community 3 - "sheets / buscarencliente / cellnumber"
Cohesion: 0.48
Nodes (5): cellNumber(), cellValue(), findColIndex(), mapCliente(), mapProducto()

### Community 4 - "app / main"
Cohesion: 0.67
Nodes (0): 

### Community 5 - "eslint"
Cohesion: 1.0
Nodes (0): 

### Community 6 - "vite"
Cohesion: 1.0
Nodes (0): 

### Community 7 - "vitest"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "vite / env"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "types / index"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "tests / offlinequeue"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "tests / sheets"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "swc"
Cohesion: 1.0
Nodes (1): SWC

## Knowledge Gaps
- **5 isolated node(s):** `TypeScript`, `Hot Module Replacement (HMR)`, `Babel`, `SWC`, `eslint-plugin-react`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `eslint`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `vite`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `vitest`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `vite / env`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `types / index`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `tests / offlinequeue`** (1 nodes): `offlineQueue.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `tests / sheets`** (1 nodes): `sheets.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `swc`** (1 nodes): `SWC`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `Fopaci Project` (e.g. with `Vite Logo (SVG)` and `React Logo (SVG)`) actually correct?**
  _`Fopaci Project` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `TypeScript`, `Hot Module Replacement (HMR)`, `Babel` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._