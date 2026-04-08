import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  DollarSign,
  Briefcase,
  Heart,
  Plane,
  Users,
  ShoppingCart,
  Settings,
  LogOut,
  Leaf,
  Target,
  Shield,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { trpc } from '../../lib/trpc'
import { cn } from '../../lib/utils'

const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
    active: true,
  },
  {
    section: 'Degenerado Fiscal',
    items: [
      { label: 'Resumen',        icon: TrendingUp,   to: '/degenerado-fiscal',              active: true },
      { label: 'Tarjetas',       icon: CreditCard,   to: '/degenerado-fiscal/tarjetas',     active: true },
      { label: 'Ingresos',       icon: DollarSign,   to: '/degenerado-fiscal/ingresos',     active: true },
      { label: 'Gastos Fijos',   icon: Briefcase,    to: '/degenerado-fiscal/gastos',       active: true },
      { label: 'Inversiones',    icon: TrendingUp,   to: '/degenerado-fiscal/inversiones',  active: true },
      { label: 'Créditos',       icon: CreditCard,   to: '/degenerado-fiscal/creditos',     active: true },
      { label: 'Proyectos',      icon: Target,       to: '/degenerado-fiscal/proyectos',    active: true },
      { label: 'Deseos',         icon: Heart,        to: '/degenerado-fiscal/deseos',       active: true },
      { label: 'Vacaciones',     icon: Plane,        to: '/degenerado-fiscal/vacaciones',   active: true },
      { label: 'Boards',         icon: Users,        to: '/degenerado-fiscal/boards',       active: true },
      { label: 'Supermercado',   icon: ShoppingCart, to: '/degenerado-fiscal/supermercado', active: true },
    ],
  },
]

interface NavItemProps {
  to: string
  icon: React.ElementType
  label: string
  active?: boolean
}

function NavItem({ to, icon: Icon, label, active = true }: NavItemProps) {

  if (!active) {
    return (
      <button
        onClick={() => {/* proximamente */}}
        title="Próximamente"
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                   text-slate-600 cursor-not-allowed
                   text-sm font-medium"
      >
        <Icon size={17} />
        <span>{label}</span>
        <span className="ml-auto text-[10px] font-semibold bg-slate-800 text-slate-600 px-1.5 py-0.5 rounded-md">Pronto</span>
      </button>
    )
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
        )
      }
    >
      <Icon size={17} />
      <span>{label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const { user, clearAuth } = useAuthStore()
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => clearAuth(),
  })

  const pendingQuery = trpc.auth.listPendingUsers.useQuery(undefined, {
    enabled: user?.rol === 'ADMIN',
  })

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? 'LF'

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 flex flex-col bg-surface-900/60 border-r border-white/5 shrink-0"
    >
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Leaf size={18} className="text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">Lechugas</p>
            <p className="text-xs text-brand-500 font-semibold tracking-wider">FINANCE</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" active />

        <div className="pt-4 pb-1">
          <p className="px-3 text-[10px] font-bold tracking-widest text-slate-600 uppercase">
            Degenerado Fiscal
          </p>
        </div>

        {navItems[1] && 'items' in navItems[1] && navItems[1].items.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        {/* Admin section — solo si es ADMIN */}
        {user?.rol === 'ADMIN' && (
          <>
            <div className="pt-4 pb-1">
              <p className="px-3 text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                Administración
              </p>
            </div>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
                )
              }
            >
              <Shield size={17} />
              <span>Panel Admin</span>
              {(pendingQuery.data?.length ?? 0) > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                  {pendingQuery.data!.length}
                </span>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer usuario */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all">
          <Settings size={17} />
          <span>Configuración</span>
        </button>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-800/50 border border-white/5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand-400">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {user?.displayName || user?.username}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
