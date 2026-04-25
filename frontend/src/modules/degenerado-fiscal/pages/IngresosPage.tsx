import { useState } from 'react'
import { trpc } from '../../../lib/trpc'
import {
  Plus, DollarSign, Wallet, TrendingDown, TrendingUp,
  Edit2, Trash2, Eye, EyeOff, RefreshCw, ShoppingBag, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AddIngresoModal } from '../components/AddIngresoModal'
import { AddGastoVariableModal } from '../components/AddGastoVariableModal'

const CATEGORIA_LABELS: Record<string, string> = {
  COMIDA: '🍔 Comida',
  TRANSPORTE: '🚗 Transporte',
  ENTRETENIMIENTO: '🎬 Entretenimiento',
  SALUD: '💊 Salud',
  ROPA: '👕 Ropa',
  HOGAR: '🏠 Hogar',
  TECNOLOGIA: '💻 Tecnología',
  EDUCACION: '📚 Educación',
  OTRO: '📦 Otro',
}

type Tab = 'ingresos' | 'gastos'

export function IngresosPage() {
  const [tab, setTab] = useState<Tab>('ingresos')
  const [isIngresoModalOpen, setIsIngresoModalOpen] = useState(false)
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false)
  const [editingIngreso, setEditingIngreso] = useState<any>(null)
  const [editingGasto, setEditingGasto] = useState<any>(null)

  const utils = trpc.useUtils()

  const { data: rawIngresos, isLoading: loadingIngresos } = trpc.ingresos.getMany.useQuery()
  const ingresos = rawIngresos as (any[] | undefined)

  const { data: rawGastos, isLoading: loadingGastos } = trpc.gastosVariables.getMany.useQuery()
  const gastos = rawGastos as (any[] | undefined)

  const toggleMutation = trpc.ingresos.toggleActivo.useMutation({
    onSuccess: () => utils.ingresos.getMany.invalidate()
  })
  const deleteIngresoMutation = trpc.ingresos.delete.useMutation({
    onSuccess: () => utils.ingresos.getMany.invalidate()
  })
  const deleteGastoMutation = trpc.gastosVariables.delete.useMutation({
    onSuccess: () => utils.gastosVariables.getMany.invalidate()
  })

  const isLoading = loadingIngresos || loadingGastos

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white/5 rounded-3xl border border-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl border border-white/5" />)}
        </div>
        <div className="h-96 bg-white/5 rounded-3xl border border-white/5" />
      </div>
    )
  }

  // ── Cálculos ────────────────────────────────────────────────────────────────
  const totalCobrado = ingresos?.filter(i => i.activo).reduce((acc, i) => acc + Number(i.monto), 0) || 0
  const totalPendiente = ingresos?.filter(i => !i.activo).reduce((acc, i) => acc + Number(i.monto), 0) || 0
  const totalGastos = gastos?.reduce((acc, g) => acc + Number(g.monto), 0) || 0
  const balance = totalCobrado - totalGastos

  const handleDeleteIngreso = (id: string) => {
    if (window.confirm('¿Eliminar este ingreso?')) deleteIngresoMutation.mutate({ id })
  }
  const handleDeleteGasto = (id: string) => {
    if (window.confirm('¿Eliminar este gasto?')) deleteGastoMutation.mutate({ id })
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <DollarSign size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Flujo de Caja</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Ingresos y gastos del período</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={() => { setEditingGasto(null); setIsGastoModalOpen(true) }}
            className="!border-red-500/20 !text-red-400 hover:!bg-red-500/10"
          >
            <Plus size={18} />
            Nuevo Gasto
          </Button>
          <Button
            variant="primary"
            onClick={() => { setEditingIngreso(null); setIsIngresoModalOpen(true) }}
          >
            <Plus size={18} />
            Nuevo Ingreso
          </Button>
        </div>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Cobrado */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card p-5 bg-gradient-to-br from-green-500/10 via-surface-900 to-surface-950 border-green-500/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
              <Wallet size={16} />
            </div>
            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Total Cobrado</span>
          </div>
          <p className="text-2xl font-black text-white tabular-nums">${totalCobrado.toLocaleString('es-AR')}</p>
          <p className="text-[9px] text-slate-500 mt-1 font-bold uppercase">Dinero recibido</p>
        </motion.div>

        {/* Gastos Variables */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-5 bg-gradient-to-br from-red-500/10 via-surface-900 to-surface-950 border-red-500/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
              <TrendingDown size={16} />
            </div>
            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Gastos Varios</span>
          </div>
          <p className="text-2xl font-black text-white tabular-nums">${totalGastos.toLocaleString('es-AR')}</p>
          <p className="text-[9px] text-slate-500 mt-1 font-bold uppercase">{gastos?.length || 0} registros</p>
        </motion.div>

        {/* Balance Neto */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={`card p-5 col-span-2 bg-gradient-to-br ${balance >= 0 ? 'from-brand-500/10 border-brand-500/20' : 'from-orange-500/10 border-orange-500/20'} via-surface-900 to-surface-950`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${balance >= 0 ? 'bg-brand-500/20 text-brand-400' : 'bg-orange-500/20 text-orange-400'}`}>
              {balance >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${balance >= 0 ? 'text-brand-500' : 'text-orange-500'}`}>Balance Neto</span>
          </div>
          <p className={`text-3xl font-black tabular-nums ${balance >= 0 ? 'text-white' : 'text-orange-400'}`}>
            {balance >= 0 ? '+' : ''}${balance.toLocaleString('es-AR')}
          </p>
          <p className="text-[9px] text-slate-500 mt-1 font-bold uppercase">Ingresos − Gastos variables</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden bg-surface-900/40 backdrop-blur-xl border-white/10 shadow-2xl">
        {/* Tab Switcher */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setTab('ingresos')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all ${tab === 'ingresos' ? 'text-green-400 border-b-2 border-green-400 bg-green-500/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ArrowUpCircle size={16} />
            Ingresos ({ingresos?.length || 0})
          </button>
          <button
            onClick={() => setTab('gastos')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all ${tab === 'gastos' ? 'text-red-400 border-b-2 border-red-400 bg-red-500/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ArrowDownCircle size={16} />
            Gastos Varios ({gastos?.length || 0})
          </button>
        </div>

        {/* Tabla Ingresos */}
        <AnimatePresence mode="wait">
          {tab === 'ingresos' && (
            <motion.div key="ingresos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="bg-white/[0.01]">
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Estado</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Descripción</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Tipo</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Fecha</th>
                      <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Monto</th>
                      <th className="px-8 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence>
                      {ingresos?.map((ingreso) => (
                        <motion.tr
                          key={ingreso.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: ingreso.activo ? 1 : 0.5 }}
                          className={`hover:bg-white/[0.02] transition-colors group ${!ingreso.activo ? 'bg-slate-900/10' : ''}`}
                        >
                          <td className="px-8 py-5">
                            <button
                              onClick={() => toggleMutation.mutate({ id: ingreso.id })}
                              className={`p-2 rounded-xl border transition-all ${ingreso.activo ? 'bg-brand-500/10 border-brand-500/20 text-brand-400 hover:bg-brand-500/20' : 'bg-slate-800 border-white/5 text-slate-600 hover:text-slate-400'}`}
                              title={ingreso.activo ? 'Contando para el total' : 'Omitido del total'}
                            >
                              {ingreso.activo ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-bold tracking-tight uppercase ${ingreso.activo ? 'text-slate-200' : 'text-slate-500'}`}>
                                {ingreso.descripcion}
                              </span>
                              {ingreso.recurrente && (
                                <div className="flex items-center gap-1 bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter">
                                  <RefreshCw size={10} />
                                  {ingreso.frecuencia || 'Mensual'}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-800/50 px-2 py-1 rounded-lg border border-white/5 uppercase">{ingreso.tipo}</span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-[11px] font-medium text-slate-400">
                              {format(new Date(ingreso.fecha), 'dd MMM yyyy', { locale: es })}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className={`text-sm font-bold font-mono ${ingreso.activo ? 'text-green-400' : 'text-slate-600'}`}>
                              +${Number(ingreso.monto).toLocaleString('es-AR')}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingIngreso(ingreso); setIsIngresoModalOpen(true) }} className="p-2 rounded-lg bg-surface-800 text-slate-400 hover:text-white transition-all border border-white/5">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteIngreso(ingreso.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>

                    {ingresos?.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-4 text-slate-600 italic">
                            <ShoppingBag size={40} className="opacity-20" />
                            <p>Todavía no hay ingresos registrados.</p>
                            <Button variant="ghost" onClick={() => setIsIngresoModalOpen(true)}>Cargar el primero</Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Tabla Gastos Variables */}
          {tab === 'gastos' && (
            <motion.div key="gastos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-white/[0.01]">
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Categoría</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Descripción</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Fecha</th>
                      <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Monto</th>
                      <th className="px-8 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence>
                      {gastos?.map((gasto) => (
                        <motion.tr
                          key={gasto.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-8 py-5">
                            <span className="text-[11px] font-bold text-slate-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 uppercase">
                              {CATEGORIA_LABELS[gasto.categoria] || gasto.categoria}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div>
                              <span className="text-sm font-bold text-slate-200 uppercase tracking-tight">{gasto.descripcion}</span>
                              {gasto.notas && <p className="text-[10px] text-slate-500 mt-0.5">{gasto.notas}</p>}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-[11px] font-medium text-slate-400">
                              {format(new Date(gasto.fecha), 'dd MMM yyyy', { locale: es })}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className="text-sm font-bold font-mono text-red-400">
                              -${Number(gasto.monto).toLocaleString('es-AR')}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingGasto(gasto); setIsGastoModalOpen(true) }} className="p-2 rounded-lg bg-surface-800 text-slate-400 hover:text-white transition-all border border-white/5">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteGasto(gasto.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>

                    {gastos?.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-4 text-slate-600 italic">
                            <TrendingDown size={40} className="opacity-20" />
                            <p>No hay gastos variables registrados.</p>
                            <Button variant="ghost" onClick={() => setIsGastoModalOpen(true)}>Cargar el primero</Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AddIngresoModal
        isOpen={isIngresoModalOpen}
        onClose={() => { setIsIngresoModalOpen(false); setEditingIngreso(null) }}
        onSuccess={() => utils.ingresos.getMany.invalidate()}
        initialData={editingIngreso}
      />
      <AddGastoVariableModal
        isOpen={isGastoModalOpen}
        onClose={() => { setIsGastoModalOpen(false); setEditingGasto(null) }}
        onSuccess={() => utils.gastosVariables.getMany.invalidate()}
        initialData={editingGasto}
      />
    </div>
  )
}
