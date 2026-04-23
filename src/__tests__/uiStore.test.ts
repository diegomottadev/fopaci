import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../store/uiStore'

beforeEach(() => {
  useUIStore.setState({ toast: null })
})

describe('uiStore', () => {
  it('showToast sets toast', () => {
    useUIStore.getState().showToast('Operación exitosa', 'success')
    const state = useUIStore.getState()
    expect(state.toast).toEqual({ message: 'Operación exitosa', type: 'success' })
  })

  it('hideToast clears toast', () => {
    useUIStore.getState().showToast('Error al guardar', 'error')
    useUIStore.getState().hideToast()
    expect(useUIStore.getState().toast).toBeNull()
  })
})
