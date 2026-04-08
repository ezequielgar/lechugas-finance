import React from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../modules/auth/LoginPage'
import { RegisterPage } from '../modules/auth/RegisterPage'
import { DashboardPage } from '../modules/dashboard/DashboardPage'
import { NotFoundPage } from '../components/shared/NotFoundPage'
import { PendingApprovalPage } from '../components/shared/PendingApprovalPage'
import { AdminPage } from '../modules/admin/AdminPage'
import { DegeneradoFiscalLayout } from '../modules/degenerado-fiscal/components/DegeneradoFiscalLayout'
import { DegeneradoFiscalPage } from '../modules/degenerado-fiscal/pages/DegeneradoFiscalPage'
import { TarjetasPage } from '../modules/degenerado-fiscal/pages/TarjetasPage'
import { TarjetaDetallePage } from '../modules/degenerado-fiscal/pages/TarjetaDetallePage'
import { IngresosPage } from '../modules/degenerado-fiscal/pages/IngresosPage'
import { GastosFijosPage } from '../modules/degenerado-fiscal/pages/GastosFijosPage'
import { InversionesPage } from '../modules/degenerado-fiscal/pages/InversionesPage'
import { CreditosPage } from '../modules/degenerado-fiscal/pages/CreditosPage'
import { ProyectosPage } from '../modules/degenerado-fiscal/pages/ProyectosPage'
import { DeseosPage } from '../modules/degenerado-fiscal/pages/DeseosPage'
import { VacacionesPage } from '../modules/degenerado-fiscal/pages/VacacionesPage'
import { BoardsPage } from '../modules/degenerado-fiscal/pages/BoardsPage'
import { SupermercadoPage } from '../modules/degenerado-fiscal/pages/SupermercadoPage'
import { ListaSuperDetallePage } from '../modules/degenerado-fiscal/pages/ListaSuperDetallePage'
import { SettingsPage } from '../modules/settings/SettingsPage'

/** Guard: solo accesible cuando está autenticado */
function PrivateRoute() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user && !user.aprobado) return <Navigate to="/pending-approval" replace />
  // Si tiene contraseña provisoria, solo puede ir a /settings
  if (user?.mustChangePassword) return <Navigate to="/settings" replace />
  return <Outlet />
}

/** Guard: solo para administradores */
function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user || user.rol !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

/** Guard: ruta de espera — redirige si no autenticado o si ya está aprobado */
function PendingApprovalRoute() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.aprobado) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

/** Guard: redirige al dashboard si ya está autenticado */
function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

/** Guard mínimo: solo requiere autenticación (para /settings con mustChangePassword) */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user && !user.aprobado) return <Navigate to="/pending-approval" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  // ── Rutas públicas ──────────────────────────────────────────
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login',    element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },

  // ── Ruta de espera de aprobación ──────────────────────────
  {
    element: <PendingApprovalRoute />,
    children: [{ path: '/pending-approval', element: <PendingApprovalPage /> }],
  },

  // ── Rutas protegidas ────────────────────────────────────────
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          
          // Fase 2: módulos de Degenerado Fiscal
          {
            path: '/degenerado-fiscal',
            element: <DegeneradoFiscalLayout />,
            children: [
              { index: true, element: <DegeneradoFiscalPage /> },
              { path: 'tarjetas', element: <TarjetasPage /> },
              { path: 'tarjetas/:id', element: <TarjetaDetallePage /> },
              { path: 'ingresos', element: <IngresosPage /> },
              { path: 'gastos', element: <GastosFijosPage /> },
              { path: 'inversiones', element: <InversionesPage /> },
              { path: 'creditos', element: <CreditosPage /> },              { path: 'proyectos',   element: <ProyectosPage /> },
              { path: 'deseos',      element: <DeseosPage /> },
              { path: 'vacaciones',  element: <VacacionesPage /> },
              { path: 'boards',        element: <BoardsPage /> },
              { path: 'supermercado',   element: <SupermercadoPage /> },
              { path: 'supermercado/:id', element: <ListaSuperDetallePage /> },
            ],
          },
        ],
      },
    ],
  },

  // ── Rutas de administrador ──────────────────────────────────
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/admin', element: <AdminPage /> }],
      },
    ],
  },
  // ── Configuración (accesible aunque mustChangePassword sea true) ──
  {
    element: <AppLayout />,
    children: [
      {
        path: '/settings',
        element: (
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        ),
      },
    ],
  },
  // ── Raíz ────────────────────────────────────────────────────
  { path: '/',   element: <Navigate to="/dashboard" replace /> },
  { path: '*',   element: <NotFoundPage /> },
])
