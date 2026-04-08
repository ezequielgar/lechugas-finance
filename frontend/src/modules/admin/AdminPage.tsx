import { useState } from 'react'
import { trpc } from '../../lib/trpc'
import { useAuthStore } from '../../store/authStore'
import {
  Users, CheckCircle2, XCircle, Shield, UserCheck,
  Clock, Crown, ChevronDown, ChevronUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '../../lib/utils'

export function AdminPage() {
  const utils = trpc.useUtils()
  const currentUser = useAuthStore((s) => s.user)
  const [showAllUsers, setShowAllUsers] = useState(false)

  const { data: pendingUsers = [], isLoading: loadingPending } = trpc.auth.listPendingUsers.useQuery()
  const { data: allUsers = [], isLoading: loadingAll } = trpc.auth.listAllUsers.useQuery(
    undefined,
    { enabled: showAllUsers }
  )

  const approveMutation = trpc.auth.approveUser.useMutation({
    onSuccess: () => {
      utils.auth.listPendingUsers.invalidate()
      utils.auth.listAllUsers.invalidate()
    },
  })
  const rejectMutation = trpc.auth.rejectUser.useMutation({
    onSuccess: () => {
      utils.auth.listPendingUsers.invalidate()
      utils.auth.listAllUsers.invalidate()
    },
  })
  const setRoleMutation = trpc.auth.setUserRole.useMutation({
    onSuccess: () => utils.auth.listAllUsers.invalidate(),
  })

  const pendingList = pendingUsers as Array<{
    id: string; email: string; username: string; displayName: string | null; createdAt: string
  }>
  const allList = allUsers as Array<{
    id: string; email: string; username: string; displayName: string | null
    rol: 'ADMIN' | 'USER'; aprobado: boolean; createdAt: string
  }>

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center">
          <Shield size={20} className="text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Panel de Administración</h1>
          <p className="text-xs text-slate-500">Gestión de usuarios y permisos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <Clock size={20} className="text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Pendientes de aprobación</p>
            <p className="text-2xl font-bold text-yellow-400">{pendingList.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <Users size={20} className="text-brand-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Usuarios aprobados</p>
            <p className="text-2xl font-bold text-brand-400">
              {allList.filter(u => u.aprobado).length || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Pendientes */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Clock size={15} className="text-yellow-400" />
          Solicitudes pendientes
          {pendingList.length > 0 && (
            <span className="ml-1 text-[10px] font-bold bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full">
              {pendingList.length}
            </span>
          )}
        </h2>

        {loadingPending && (
          <div className="card p-6 text-center text-slate-500 text-sm">Cargando...</div>
        )}

        {!loadingPending && pendingList.length === 0 && (
          <div className="card p-8 text-center space-y-2">
            <CheckCircle2 size={32} className="text-green-400 mx-auto" />
            <p className="text-sm text-slate-400">No hay solicitudes pendientes.</p>
          </div>
        )}

        {pendingList.length > 0 && (
          <div className="card divide-y divide-white/5">
            {pendingList.map((user) => (
              <div key={user.id} className="p-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-surface-800 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-slate-400">
                    {(user.displayName ?? user.username).slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">
                    {user.displayName ?? user.username}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    @{user.username} · Registrado {format(new Date(user.createdAt), "d 'de' MMM yyyy", { locale: es })}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (confirm(`¿Rechazar y eliminar la cuenta de ${user.displayName ?? user.username}?`)) {
                        rejectMutation.mutate({ userId: user.id })
                      }
                    }}
                    disabled={rejectMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={13} />
                    Rechazar
                  </button>
                  <button
                    onClick={() => approveMutation.mutate({ userId: user.id })}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors disabled:opacity-50"
                  >
                    <UserCheck size={13} />
                    Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Todos los usuarios (colapsable) */}
      <section className="space-y-3">
        <button
          onClick={() => setShowAllUsers(!showAllUsers)}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Users size={15} />
          Todos los usuarios
          {showAllUsers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAllUsers && (
          <>
            {loadingAll && <div className="card p-4 text-center text-slate-500 text-sm">Cargando...</div>}
            {!loadingAll && allList.length > 0 && (
              <div className="card divide-y divide-white/5">
                {allList.map((user) => (
                  <div key={user.id} className="p-4 flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0',
                      user.rol === 'ADMIN'
                        ? 'bg-brand-500/15 border-brand-500/30'
                        : 'bg-surface-800 border-white/10'
                    )}>
                      {user.rol === 'ADMIN'
                        ? <Crown size={16} className="text-brand-400" />
                        : <span className="text-sm font-bold text-slate-400">
                            {(user.displayName ?? user.username).slice(0, 2).toUpperCase()}
                          </span>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-200 truncate">
                          {user.displayName ?? user.username}
                        </p>
                        {user.id === currentUser?.id && (
                          <span className="text-[9px] font-bold text-brand-400 bg-brand-500/10 px-1.5 rounded-full">Vos</span>
                        )}
                        <span className={cn(
                          'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full',
                          user.aprobado ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'
                        )}>
                          {user.aprobado ? 'Aprobado' : 'Pendiente'}
                        </span>
                        <span className={cn(
                          'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full',
                          user.rol === 'ADMIN' ? 'text-brand-400 bg-brand-500/10' : 'text-slate-500 bg-slate-500/10'
                        )}>
                          {user.rol}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{user.email} · @{user.username}</p>
                    </div>

                    {/* Cambiar rol (solo si no es uno mismo) */}
                    {user.id !== currentUser?.id && (
                      <select
                        value={user.rol}
                        onChange={(e) => setRoleMutation.mutate({ userId: user.id, rol: e.target.value as 'ADMIN' | 'USER' })}
                        className="text-xs bg-surface-800 border border-white/10 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 flex-shrink-0"
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
