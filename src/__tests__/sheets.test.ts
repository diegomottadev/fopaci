import { describe, it, expect } from 'vitest'
import { parseGviz, buildGvizUrl, mapCliente, mapProducto } from '../services/sheets'

// Columns: A=código, B=descripción, C=imagen, D=bulto ("6 X 220"), E=mayorista/u, F=mayorista/b, G=vacío, H=público/u, I=público/b
const RAW_GVIZ_CATALOGO = `/*O_o*/google.visualization.Query.setResponse({"version":"0.6","status":"ok","table":{"cols":[{"id":"A","label":"CÓDIGO","type":"string"},{"id":"B","label":"DESCRIPCIÓN","type":"string"},{"id":"C","label":"IMAGEN","type":"string"},{"id":"D","label":"BULTO","type":"string"},{"id":"E","label":"PRECIO MAYORISTA x UNIDAD","type":"number"},{"id":"F","label":"PRECIO MAYORISTA x BULTO","type":"number"},{"id":"G","label":"","type":"string"},{"id":"H","label":"PRECIO PÚBLICO x UNIDAD","type":"number"},{"id":"I","label":"PRECIO PÚBLICO x BULTO","type":"number"}],"rows":[{"c":[{"v":"VT001"},{"v":"Malbec 750ml"},null,{"v":"6"},{"v":1500},{"v":9000},null,{"v":2000},{"v":12000}]}]}});`

describe('parseGviz', () => {
  it('strips wrapper and returns parsed table', () => {
    const result = parseGviz(RAW_GVIZ_CATALOGO)
    expect(result.table.cols).toHaveLength(9)
    expect(result.table.rows).toHaveLength(1)
  })
})

describe('buildGvizUrl', () => {
  it('builds URL with sheet param', () => {
    const url = buildGvizUrl('ABC123', 'Catalogo')
    expect(url).toBe(
      'https://docs.google.com/spreadsheets/d/ABC123/gviz/tq?tqx=out:json&sheet=Catalogo'
    )
  })

  it('builds URL without sheet param when omitted', () => {
    const url = buildGvizUrl('ABC123')
    expect(url).toBe(
      'https://docs.google.com/spreadsheets/d/ABC123/gviz/tq?tqx=out:json'
    )
  })
})

describe('mapProducto', () => {
  it('maps gviz row to Producto', () => {
    const parsed = parseGviz(RAW_GVIZ_CATALOGO)
    const producto = mapProducto(parsed.table.rows[0], parsed.table.cols)
    expect(producto).toEqual({
      codigo: 'VT001',
      descripcion: 'Malbec 750ml',
      bulto: 6,           // parseInt("6") from col D
      precioMayoristaUnidad: 1500,
      precioMayoristaBulto: 9000,
      precioPublicoUnidad: 2000,  // col H (col G is empty)
      precioPublicoBulto: 12000,  // col I
    })
  })
})

const RAW_GVIZ_CLIENTES = `/*O_o*/google.visualization.Query.setResponse({"version":"0.6","status":"ok","table":{"cols":[{"id":"A","label":"NOMBRE","type":"string"},{"id":"B","label":"CUIT","type":"string"},{"id":"C","label":"CODIGO","type":"string"}],"rows":[{"c":[{"v":"Vinoteca Pepe"},{"v":"20-12345678-9"},{"v":"CLI001"}]}]}});`

describe('mapCliente', () => {
  it('maps dynamic columns using header aliases', () => {
    const parsed = parseGviz(RAW_GVIZ_CLIENTES)
    const cliente = mapCliente(parsed.table.rows[0], parsed.table.cols, 0)
    expect(cliente.nombre).toBe('Vinoteca Pepe')
    expect(cliente.cuil).toBe('20-12345678-9')
    expect(cliente.codigo).toBe('CLI001')
    expect(cliente.rowIndex).toBe(0)
  })
})
