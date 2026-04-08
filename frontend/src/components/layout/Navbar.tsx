import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCircle2, XCircle, Clock, UserPlus } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { trpc } from '../../lib/trpc'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function Navbar() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.rol === 'ADMIN'
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const utils = trpc.useUtils()

  const { data: pendingUsers = [] } = trpc.auth.listPendingUsers.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: 30_000,
  })

  const pendingList = pendingUsers as Array<{
    id: string; email: string; username: string; displayName: string | null; createdAt: string
  }>

  const approveMutation = trpc.auth.approveUser.useMutation({
    onSuccess: () => utils.auth.listPendingUsers.invalidate(),
  })
  const rejectMutation = trpc.auth.rejectUser.useMutation({
    onSuccess: () => utils.auth.listPendingUsers.invalidate(),
  })

  // Cerrar al click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-14 px-6 flex items-center justify-between border-b border-white/5 bg-surface-900/40 backdrop-blur-sm shrink-0">
      <div>
        <h1 className="text-sm font-medium text-slate-400">
          Bienvenido de vuelta,{' '}
          <span className="text-slate-200 font-semibold">
            {user?.displayName?.split(' ')[0] || user?.username}
          </span>{' '}
          👋
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
          >
            <Bell size={18} />
            {isAdmin && pendingList.length > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {pendingList.length}
              </span>
            )}
            {(!isAdmin || pendingList.length === 0) && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-500 rounded-full" />
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
              {/* Header dropdown */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <Bell size={14} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-200">Notificaciones</span>
                {isAdmin && pendingList.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                    {pendingList.length} pendiente{pendingList.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Lista de pendientes */}
              <div className="max-h-80 overflow-y-auto">
                {!isAdmin || pendingList.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-slate-600">
                    <Bell size={22} />
                    <p className="text-xs">Sin notificaciones</p>
                  </div>
                ) : (
                  pendingList.map((u) => (
                    <div key={u.id} className="px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <UserPlus size={14} className="text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">
                            {u.displayName || u.username}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                          <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                            <Clock size={10} />
                            {format(new Date(u.createdAt), "d MMM, HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2.5">
                        <button
                          onClick={() => approveMutation.mutate({ userId: u.id })}
                          disabled={approveMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 size={12} />
                          Aprobar
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate({ userId: u.id })}
                          disabled={rejectMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <XCircle size={12} />
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
