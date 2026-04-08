import { motion } from 'framer-motion'
import { Clock, Leaf, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export function PendingApprovalPage() {
  const { user, clearAuth } = useAuthStore()

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        <div className="card p-8 shadow-2xl shadow-black/40 text-center space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <Leaf size={18} className="text-brand-400" />
            </div>
            <p className="text-sm font-bold text-slate-100">Lechugas <span className="text-brand-500">Finance</span></p>
          </div>

          {/* Ícono central */}
          <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto">
            <Clock size={40} className="text-yellow-400" />
          </div>

          {/* Texto */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-100">Cuenta pendiente</h2>
            <p className="text-sm text-slate-400">
              Hola <span className="text-slate-200 font-medium">{user?.displayName ?? user?.username}</span>,
              tu cuenta está esperando aprobación por un administrador.
            </p>
          </div>

          <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">¿Qué sigue?</p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Un administrador revisará tu solicitud</li>
              <li>• Una vez aprobada, podrás ingresar normalmente</li>
              <li>• Volvé a intentar hacer login más tarde</li>
            </ul>
          </div>

          <button
            onClick={() => clearAuth()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5 text-sm font-medium transition-all"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </motion.div>
    </div>
  )
}
