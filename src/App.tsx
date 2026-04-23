import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import NuevoPedido from './pages/NuevoPedido'
import Resumen from './pages/Resumen'
import Historial from './pages/Historial'
import HistorialDetalle from './pages/HistorialDetalle'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="pedido/nuevo" element={<NuevoPedido />} />
          <Route path="pedido/resumen" element={<Resumen />} />
          <Route path="pedido/:clienteId" element={<NuevoPedido />} />
          <Route path="historial" element={<Historial />} />
          <Route path="historial/:pedidoId" element={<HistorialDetalle />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
