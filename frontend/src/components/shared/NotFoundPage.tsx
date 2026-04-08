import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Leaf } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto">
          <Leaf size={36} className="text-brand-400/50" />
        </div>
        <div>
          <h1 className="text-7xl font-bold text-gradient">404</h1>
          <p className="text-xl font-semibold text-slate-300 mt-2">Página no encontrada</p>
          <p className="text-sm text-slate-500 mt-1">La página que buscás no existe o fue movida.</p>
        </div>
        <Link to="/dashboard" className="btn-primary inline-flex">
          <Home size={17} />
          Ir al inicio
        </Link>
      </motion.div>
    </div>
  )
}
