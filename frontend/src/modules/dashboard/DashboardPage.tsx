import { motion } from 'framer-motion'
import {
  TrendingUp, CreditCard, DollarSign, Briefcase,
  ShoppingCart, Users, ArrowRight, Leaf,
  Wallet, BarChart3, PiggyBank,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface ToolCardProps {
  icon: React.ElementType
  title: string
  description: string
  color: string
  to: string
  available?: boolean
}

function ToolCard({ icon: Icon, title, description, color, to, available = false }: ToolCardProps) {
  const content = (
    <motion.div
      whileHover={available ? { scale: 1.02 } : {}}
      whileTap={available ? { scale: 0.98 } : {}}
      className={`card-hover p-5 flex flex-col gap-3 relative overflow-hidden group ${
        !available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {/* Glow decorativo */}
      {available && (
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          style={{ background: `radial-gradient(circle at top left, ${color}08 0%, transparent 60%)` }}
        />
      )}

      <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon size={20} style={{ color }} />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {!available && (
            <span className="text-[10px] font-bold bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md">
              PRONTO
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>

      {available && (
        <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all mt-auto" />
      )}
    </motion.div>
  )

  return available ? <Link to={to}>{content}</Link> : <div>{content}</div>
}

const tools = [
  {
    icon: TrendingUp,
    title: 'Degenerado Fiscal',
    description: 'Controlá tus finanzas: tarjetas, ingresos, gastos, inversiones y más.',
    color: '#22c55e',
    to: '/degenerado-fiscal',
    available: true,
  },
  {
    icon: Users,
    title: 'Boards Compartidos',
    description: 'Gestioná gastos e ingresos con otras personas.',
    color: '#3b82f6',
    to: '/degenerado-fiscal/boards',
    available: false,
  },
  {
    icon: ShoppingCart,
    title: 'Lista de Super',
    description: 'Armá listas inteligentes con historial de precios por super.',
    color: '#f59e0b',
    to: '/degenerado-fiscal/supermercado',
    available: false,
  },
]

const stats = [
  { label: 'Balance del mes', value: '$0', icon: Wallet,    color: '#22c55e', desc: 'Ingresos - Gastos' },
  { label: 'Deuda en tarjetas', value: '$0', icon: CreditCard, color: '#ef4444', desc: 'Total estimado' },
  { label: 'Gastos del mes',  value: '$0', icon: BarChart3,  color: '#f59e0b', desc: 'Vs mes anterior' },
  { label: 'Ahorro acumulado', value: '$0', icon: PiggyBank,  color: '#3b82f6', desc: 'Este año' },
]

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {greeting},{' '}
            <span className="text-gradient">
              {user?.displayName?.split(' ')[0] || user?.username}
            </span>{' '}
            👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tu centro de control financiero personal.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
          <Leaf size={22} className="text-brand-400" />
        </div>
      </motion.div>

      {/* Stats rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{stat.label}</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon size={14} style={{ color: stat.color }} />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-100">{stat.value}</p>
              <p className="text-xs text-slate-600 mt-0.5">{stat.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Herramientas */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-300">Herramientas</h2>
          <span className="text-xs text-slate-600">Más próximamente</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </motion.div>

      {/* Empty state principal — se completará en Fase 2 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-10 flex flex-col items-center justify-center text-center gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
          <BarChart3 size={28} className="text-brand-500/50" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-300">Tu resumen financiero</h3>
          <p className="text-sm text-slate-600 mt-1 max-w-xs">
            Cuando actives el módulo <strong className="text-slate-500">Degenerado Fiscal</strong>, acá vas a ver tu panorama financiero completo.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
