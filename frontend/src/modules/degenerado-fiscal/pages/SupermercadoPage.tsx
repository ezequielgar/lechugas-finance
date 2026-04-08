import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trpc } from '../../../lib/trpc'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Plus, Store, Calendar, Package,
  Trash2, TrendingUp, ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AddListaModal } from '../components/AddListaModal'

const ESTADO_CONFIG = {
  ACTIVA:     { label: 'Activa',     color: 'text-brand-400 bg-brand-500/10 border-brand-500/20' },
  COMPLETADA: { label: 'Completada', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  ARCHIVADA:  { label: 'Archivada',  color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
}

export function SupermercadoPage() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const utils = trpc.useUtils()

  const { data: listas = [], isLoading } = trpc.supermercado.listListas.useQuery()
  const { data: resumen } = trpc.supermercado.getResumen.useQuery()
  const deleteMutation = trpc.supermercado.deleteLista.useMutation({
    onSuccess: () => utils.supermercado.listListas.invalidate(),
  })

  const listasCast = listas as any[]
  const resumenCast = resumen as any

  function handleDelete(e: React.MouseEvent, listaId: string) {
    e.stopPropagation()
    if (!window.confirm('¿Eliminar esta lista? Se perderán todos los items.')) return
    deleteMutation.mutate({ listaId })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-white/5 rounded-3xl border border-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-white/5 rounded-2xl border border-white/5" />)}
        </div>
        <div className="h-64 bg-white/5 rounded-2xl border border-white/5" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center">
            <ShoppingCart size={20} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Supermercado</h1>
            <p className="text-xs text-slate-500">Seguí precios y comparalos entre supers</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          Nuevo carrito
        </button>
      </div>

      {/* Stats */}
      {resumenCast && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
              <ShoppingCart size={13} /> Carritos totales
            </div>
            <p className="text-2xl font-bold text-slate-100">{resumenCast.totalListas}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
              <TrendingUp size={13} /> Gasto registrado
            </div>
            <p className="text-2xl font-bold text-slate-100">
              ${resumenCast.gastoTotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="card p-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
              <Store size={13} /> Supers registrados
            </div>
            <p className="text-2xl font-bold text-slate-100">{resumenCast.supermercados?.length ?? 0}</p>
          </div>
        </div>
      )}

      {/* Supers visitados */}
      {resumenCast?.supermercados?.length > 0 && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Supers visitados</p>
          <div className="flex flex-wrap gap-2">
            {(resumenCast.supermercados as any[]).map((s: any) => (
              <div key={s.nombre} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm">
                <Store size={13} className="text-brand-400" />
                <span className="text-slate-300 font-medium">{s.nombre}</span>
                <span className="text-slate-600 text-xs">{s.visitas} {s.visitas === 1 ? 'visita' : 'visitas'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de carritos */}
      {listasCast.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center space-y-3"
        >
          <ShoppingCart size={36} className="text-slate-700 mx-auto" />
          <p className="text-slate-400 font-medium">No tenés carritos todavía</p>
          <p className="text-slate-600 text-sm">Creá tu primer carrito para empezar a registrar precios</p>
          <button
            onClick={() => setShowModal(true)}
            className="mx-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors mt-2"
          >
            <Plus size={15} />
            Crear carrito
          </button>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Todos los carritos ({listasCast.length})
          </p>
          <AnimatePresence>
            {listasCast.map((lista: any, i: number) => {
              const estado = ESTADO_CONFIG[lista.estado as keyof typeof ESTADO_CONFIG]
              const progreso = lista.totalItems > 0
                ? Math.round((lista.itemsComprados / lista.totalItems) * 100)
                : 0

              return (
                <motion.div
                  key={lista.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/degenerado-fiscal/supermercado/${lista.id}`)}
                  className="card p-4 cursor-pointer hover:border-white/15 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {/* Ícono */}
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                      <Store size={18} className="text-brand-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                          {lista.nombre}
                        </p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${estado.color}`}>
                          {estado.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {lista.supermercado && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Store size={11} />
                            {lista.supermercado}
                          </span>
                        )}
                        {lista.fechaCompra && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={11} />
                            {format(new Date(lista.fechaCompra), "d MMM yyyy", { locale: es })}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Package size={11} />
                          {lista.totalItems} {lista.totalItems === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      {/* Progress bar */}
                      {lista.totalItems > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${progreso}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-600">
                            {lista.itemsComprados}/{lista.totalItems}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Total + acciones */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {lista.montoTotal != null && (
                        <p className="text-base font-bold text-slate-100">
                          ${Number(lista.montoTotal).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleDelete(e, lista.id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={13} />
                        </button>
                        <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <AddListaModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false)
          utils.supermercado.listListas.invalidate()
          utils.supermercado.getResumen.invalidate()
        }}
      />
    </div>
  )
}
