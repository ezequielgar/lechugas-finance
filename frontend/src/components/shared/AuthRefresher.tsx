import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Componente que renueva el access token automáticamente:
 * - Al montar la app (en caso de que el token esté vencido)
 * - Cada 23 horas (antes de que el token de 24h expire)
 */
export function AuthRefresher() {
  const { setAccessToken, isAuthenticated, clearAuth } = useAuthStore()

  const doRefresh = async () => {
    // Solo intentamos refrescar si el usuario tiene sesión activa
    if (!useAuthStore.getState().isAuthenticated) return

    try {
      // Llamamos al endpoint de refresh de tRPC usando fetch directamente
      // La cookie httpOnly de refresh_token se envía automáticamente con credentials: 'include'
      const res = await fetch(`${API_URL}/api/trpc/auth.refresh?batch=1`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ '0': { json: null, meta: { values: [] } } }),
      })

      if (!res.ok) {
        // Si el refresh falla (cookie expirada/inválida), cerramos sesión
        clearAuth()
        return
      }

      const data = await res.json()
      const accessToken = data?.[0]?.result?.data?.json?.accessToken

      if (accessToken) {
        setAccessToken(accessToken)
        console.info('[Auth] Token renovado exitosamente.')
      }
    } catch (err) {
      // En caso de error de red, no cerramos sesión - puede ser temporal
      console.warn('[Auth] No se pudo renovar el token:', err)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return

    // Renovar inmediatamente al montar (recupera sesiones con token expirado)
    doRefresh()

    // Renovar cada 23 horas (1 hora antes del vencimiento del token de 24h)
    const intervalMs = 23 * 60 * 60 * 1000
    const interval = setInterval(doRefresh, intervalMs)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  return null // Componente invisible
}
