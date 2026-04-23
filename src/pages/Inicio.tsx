import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePedidoStore } from '../store/pedidoStore'
import { useVendedorLogin } from '../hooks/useVendedorLogin'

export default function Inicio() {
  const navigate = useNavigate()
  const vendedor = usePedidoStore(s => s.vendedor)
  const setVendedor = usePedidoStore(s => s.setVendedor)
  const { login, loading, error } = useVendedorLogin()
  const [dni, setDni] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    await login(dni)
    setDni('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido</h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Sistema de pedidos Vinoteca</p>
      </div>

      {vendedor ? (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Vendedor</p>
            <p className="font-semibold text-gray-900">{vendedor}</p>
          </div>
          <button
            onClick={() => setVendedor('')}
            className="text-xs text-brand-700 hover:text-brand-900 cursor-pointer"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Ingresá tu DNI para continuar
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ej: 30123456"
            value={dni}
            onChange={e => setDni(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
            style={{ borderColor: 'var(--color-border)' }}
            autoFocus
          />
          {error && <p className="text-sm text-brand-700">{error}</p>}
          <button
            type="submit"
            disabled={loading || !dni.trim()}
            className="w-full bg-brand-800 text-white py-2 rounded-lg font-semibold disabled:opacity-50 hover:bg-brand-900 transition-colors cursor-pointer"
          >
            {loading ? 'Verificando…' : 'Ingresar'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        <button
          onClick={() => navigate('/pedido/nuevo')}
          disabled={!vendedor}
          className="w-full bg-brand-800 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-900 transition-colors cursor-pointer"
        >
          Nuevo Pedido
        </button>
        <button
          onClick={() => navigate('/historial')}
          disabled={!vendedor}
          className="w-full border py-3 px-4 rounded-lg font-medium hover:bg-brand-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          Ver Historial
        </button>
      </div>
    </div>
  )
}
