import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '../../../lib/utils'
import { Link } from 'react-router-dom'

const tabs = [
  { label: 'Resumen', to: '/degenerado-fiscal' },
  { label: 'Tarjetas', to: '/degenerado-fiscal/tarjetas' },
  { label: 'Ingresos', to: '/degenerado-fiscal/ingresos' },
  { label: 'Gastos', to: '/degenerado-fiscal/gastos' },
  { label: 'Inversiones', to: '/degenerado-fiscal/inversiones' },
  { label: 'Créditos',    to: '/degenerado-fiscal/creditos' },
  { label: 'Proyectos',   to: '/degenerado-fiscal/proyectos' },
  { label: 'Deseos',      to: '/degenerado-fiscal/deseos' },
  { label: 'Vacaciones',  to: '/degenerado-fiscal/vacaciones' },
  { label: 'Boards',      to: '/degenerado-fiscal/boards' },
]

export function DegeneradoFiscalLayout() {
  const location = useLocation()

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Degenerado Fiscal</h1>
          <p className="text-sm text-slate-500">Gestioná tus movimientos financieros personales.</p>
        </div>

        <nav className="overflow-x-auto pb-1">
          <div className="flex items-center gap-1 bg-surface-900/50 p-1 rounded-xl border border-white/5 w-max min-w-full sm:w-fit sm:min-w-0">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.to
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  'px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                )}
              >
                {tab.label}
              </Link>
            )
          })}
          </div>
        </nav>
      </header>

      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Outlet />
      </motion.div>
    </div>
  )
}
