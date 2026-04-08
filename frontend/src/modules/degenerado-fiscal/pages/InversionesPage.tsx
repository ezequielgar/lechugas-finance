import { useState } from 'react'
import { trpc } from '../../../lib/trpc'
import {
  Plus, TrendingUp, TrendingDown, Wallet, BarChart2, Edit2, Trash2,
  ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight, RefreshCw,
  Calendar, DollarSign, Archive
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInDays, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { AddInversionModal } from '../components/AddInversionModal'
import { AddMovimientoModal } from '../components/AddMovimientoModal'
import { cn } from '../../../lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  PLAZO_FIJO:  'Plazo Fijo',
  ACCIONES:    'Acciones',
  CRYPTO:      'Crypto',
  FONDO_COMUN: 'FCI',
  DOLAR:       'Dólar',
  INMUEBLE:    'Inmueble',
  OTRO:        'Otro',
}

const TIPO_COLORS: Record<string, string> = {
  PLAZO_FIJO:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ACCIONES:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  CRYPTO:      'bg-orange-500/10 text-orange-400 border-orange-500/20',
  FONDO_COMUN: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  DOLAR:       'bg-green-500/10 text-green-400 border-green-500/20',
  INMUEBLE:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  OTRO:        'bg-slate-700/50 text-slate-400 border-slate-600/30',
}

const MOV_ICON: Record<string, React.ElementType> = {
  DEPOSITO:      ArrowDownLeft,
  RETIRO:        ArrowUpRight,
  RENDIMIENTO:   TrendingUp,
  ACTUALIZACION: RefreshCw,
}

const MOV_COLOR: Record<string, string> = {
  DEPOSITO:      'text-green-400',
  RETIRO:        'text-red-400',
  RENDIMIENTO:   'text-brand-400',
  ACTUALIZACION: 'text-yellow-400',
}

const MOV_SIGN: Record<string, string> = {
  DEPOSITO:      '+',
  RETIRO:        '-',
  RENDIMIENTO:   '+',
  ACTUALIZACION: '→',
}

/** Calcula el valor actual de una inversión en base a sus movimientos */
function calcValorActual(montoInicial: number, movimientos: any[]): number {
  // Si el último movimiento es ACTUALIZACION, ese es el valor total vigente
  const sorted = [...movimientos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  const lastUpdate = sorted.find(m => m.tipo === 'ACTUALIZACION')
  if (lastUpdate) return Number(lastUpdate.monto)

  return movimientos.reduce((acc, m) => {
    if (m.tipo === 'DEPOSITO' || m.tipo === 'RENDIMIENTO') return acc + Number(m.monto)
    if (m.tipo === 'RETIRO') return acc - Number(m.monto)
    return acc
  }, montoInicial)
}

function calcRendimiento(_montoInicial: number, movimientos: any[]): number {
  const rendimientos = movimientos.filter(m => m.tipo === 'RENDIMIENTO')
  return rendimientos.reduce((acc, m) => acc + Number(m.monto), 0)
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function InversionesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingInversion, setEditingInversion] = useState<any>(null)
  const [movimientoTarget, setMovimientoTarget] = useState<any>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: rawInversiones, isLoading } = trpc.inversiones.getMany.useQuery()
  const inversiones = rawInversiones as (any[] | undefined)

  const toggleActivaMutation = trpc.inversiones.toggleActiva.useMutation({
    onSuccess: () => utils.inversiones.getMany.invalidate(),
  })

  const deleteMutation = trpc.inversiones.delete.useMutation({
    onSuccess: () => utils.inversiones.getMany.invalidate(),
  })

  const deleteMovMutation = trpc.inversiones.deleteMovimiento.useMutation({
    onSuccess: () => utils.inversiones.getMany.invalidate(),
  })

  // ── Resumen ─────────────────────────────────────────────────────────────

  const activas = inversiones?.filter(i => i.activa) || []
  const totalInvertido = activas.reduce((acc, i) => acc + Number(i.montoInicial), 0)
  const totalActual = activas.reduce((acc, i) => acc + calcValorActual(Number(i.montoInicial), i.movimientos), 0)
  const totalRendimiento = activas.reduce((acc, i) => acc + calcRendimiento(Number(i.montoInicial), i.movimientos), 0)
  const rendimientoPct = totalInvertido > 0 ? ((totalActual - totalInvertido) / totalInvertido) * 100 : 0

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleEdit = (inv: any) => {
    setEditingInversion(inv)
    setIsAddModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Eliminar esta inversión y todos sus movimientos?')) {
      deleteMutation.mutate({ id })
    }
  }

  const handleDeleteMovimiento = (id: string) => {
    if (window.confirm('¿Eliminar este movimiento?')) {
      deleteMovMutation.mutate({ id })
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-white/5 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl" />)}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Inversiones</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Portafolio y rendimientos</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => { setEditingInversion(null); setIsAddModalOpen(true) }}>
          <Plus size={18} />
          Nueva Inversión
        </Button>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-br from-brand-500/10 via-surface-900 to-surface-950 border-brand-500/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400">
              <Wallet size={20} />
            </div>
            <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Capital Invertido</span>
          </div>
          <p className="text-3xl font-black text-white tabular-nums">${totalInvertido.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">
            {activas.length} inversión{activas.length !== 1 ? 'es' : ''} activa{activas.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`card p-6 bg-gradient-to-br border ${
            totalActual >= totalInvertido
              ? 'from-green-500/10 via-surface-900 to-surface-950 border-green-500/20'
              : 'from-red-500/10 via-surface-900 to-surface-950 border-red-500/20'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              totalActual >= totalInvertido ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <BarChart2 size={20} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              totalActual >= totalInvertido ? 'text-green-500' : 'text-red-500'
            }`}>
              Valor Actual
            </span>
          </div>
          <p className="text-3xl font-black text-white tabular-nums">${totalActual.toLocaleString()}</p>
          <p className={`text-[10px] mt-2 font-bold uppercase tracking-tighter ${
            rendimientoPct >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {rendimientoPct >= 0 ? '+' : ''}{rendimientoPct.toFixed(2)}% vs. capital
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={`card p-6 bg-gradient-to-br border ${
            totalRendimiento > 0
              ? 'from-emerald-500/10 via-surface-900 to-surface-950 border-emerald-500/20'
              : 'from-surface-900 via-surface-900 to-surface-950 border-white/5'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              totalRendimiento > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}>
              {totalRendimiento >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rendimiento Total</span>
          </div>
          <p className={`text-3xl font-black tabular-nums ${totalRendimiento > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
            {totalRendimiento > 0 ? '+' : ''}${totalRendimiento.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Ganancia acumulada</p>
        </motion.div>
      </div>

      {/* Lista de Inversiones */}
      <div className="space-y-4">
        <AnimatePresence>
          {inversiones?.map((inv, idx) => {
            const valorActual = calcValorActual(Number(inv.montoInicial), inv.movimientos)
            const rendPct = Number(inv.montoInicial) > 0
              ? ((valorActual - Number(inv.montoInicial)) / Number(inv.montoInicial)) * 100
              : 0
            const isExpanded = expandedId === inv.id
            const isVencida = inv.fechaVencimiento && isPast(new Date(inv.fechaVencimiento))
            const diasAlVencimiento = inv.fechaVencimiento
              ? differenceInDays(new Date(inv.fechaVencimiento), new Date())
              : null

            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: inv.activa ? 1 : 0.5, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  'card overflow-hidden transition-all duration-200',
                  inv.activa ? 'border-white/10' : 'border-white/5 bg-surface-950/30'
                )}
              >
                {/* Card Header */}
                <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                  {/* Tipo badge + nombre */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={cn(
                      'shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border',
                      TIPO_COLORS[inv.tipo] || TIPO_COLORS.OTRO
                    )}>
                      {TIPO_LABELS[inv.tipo] || inv.tipo}
                    </span>
                    <div className="min-w-0">
                      <p className={cn(
                        'font-bold text-sm tracking-tight truncate',
                        inv.activa ? 'text-slate-200' : 'text-slate-500 line-through'
                      )}>
                        {inv.nombre}
                      </p>
                      <p className="text-[10px] text-slate-600 font-medium">
                        Inicio: {format(new Date(inv.fechaInicio), 'dd MMM yyyy', { locale: es })}
                        {inv.moneda !== 'ARS' && (
                          <span className="ml-2 text-slate-500">{inv.moneda}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Vencimiento */}
                  {inv.fechaVencimiento && (
                    <div className={cn(
                      'flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border',
                      isVencida
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : diasAlVencimiento !== null && diasAlVencimiento <= 15
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        : 'bg-white/[0.02] text-slate-500 border-white/5'
                    )}>
                      <Calendar size={11} />
                      {isVencida
                        ? 'Vencida'
                        : diasAlVencimiento !== null && diasAlVencimiento <= 15
                        ? `Vence en ${diasAlVencimiento}d`
                        : format(new Date(inv.fechaVencimiento), 'dd MMM yyyy', { locale: es })}
                    </div>
                  )}

                  {/* Montos */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Capital</p>
                      <p className="text-sm font-bold text-slate-400 tabular-nums font-mono">
                        ${Number(inv.montoInicial).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Actual</p>
                      <p className={cn(
                        'text-sm font-black tabular-nums font-mono',
                        valorActual >= Number(inv.montoInicial) ? 'text-green-400' : 'text-red-400'
                      )}>
                        ${valorActual.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Rend.</p>
                      <p className={cn(
                        'text-sm font-bold tabular-nums font-mono',
                        rendPct >= 0 ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {rendPct >= 0 ? '+' : ''}{rendPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setMovimientoTarget(inv)}
                      className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 hover:bg-brand-500/20 transition-all"
                      title="Agregar movimiento"
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      onClick={() => toggleActivaMutation.mutate({ id: inv.id })}
                      className={cn(
                        'p-2 rounded-xl border transition-all',
                        inv.activa
                          ? 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                          : 'bg-slate-800 border-white/5 text-slate-600 hover:text-slate-400'
                      )}
                      title={inv.activa ? 'Archivar' : 'Reactivar'}
                    >
                      <Archive size={15} />
                    </button>
                    <button
                      onClick={() => handleEdit(inv)}
                      className="p-2 rounded-xl bg-surface-800 border border-white/5 text-slate-400 hover:text-white transition-all"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                      className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-slate-500 hover:text-slate-300 transition-all"
                      title="Ver movimientos"
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Movimientos expandidos */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 bg-white/[0.01] px-6 py-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                          Historial de movimientos
                        </p>

                        {inv.movimientos.length === 0 ? (
                          <p className="text-sm text-slate-600 italic py-2">Sin movimientos registrados.</p>
                        ) : (
                          <div className="space-y-2">
                            {[...inv.movimientos]
                              .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                              .map((mov: any) => {
                                const Icon = MOV_ICON[mov.tipo] || DollarSign
                                return (
                                  <div
                                    key={mov.id}
                                    className="flex items-center gap-4 group"
                                  >
                                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/5', MOV_COLOR[mov.tipo])}>
                                      <Icon size={13} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-slate-400 truncate">
                                        {mov.descripcion || mov.tipo}
                                      </p>
                                      <p className="text-[10px] text-slate-600">
                                        {format(new Date(mov.fecha), 'dd MMM yyyy', { locale: es })}
                                      </p>
                                    </div>
                                    <p className={cn('text-sm font-bold tabular-nums font-mono', MOV_COLOR[mov.tipo])}>
                                      {MOV_SIGN[mov.tipo]}${Number(mov.monto).toLocaleString()}
                                    </p>
                                    <button
                                      onClick={() => handleDeleteMovimiento(mov.id)}
                                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )
                              })}
                          </div>
                        )}

                        <button
                          onClick={() => setMovimientoTarget(inv)}
                          className="mt-4 flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300 font-bold transition-colors"
                        >
                          <Plus size={14} /> Agregar movimiento
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {inversiones?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card p-20 text-center flex flex-col items-center gap-4 text-slate-600"
          >
            <TrendingUp size={48} className="opacity-20" />
            <p className="text-sm italic">Todavía no tenés inversiones registradas.</p>
            <Button variant="ghost" onClick={() => { setEditingInversion(null); setIsAddModalOpen(true) }}>
              Crear la primera
            </Button>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AddInversionModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingInversion(null) }}
        onSuccess={() => utils.inversiones.getMany.invalidate()}
        initialData={editingInversion}
      />

      {movimientoTarget && (
        <AddMovimientoModal
          isOpen={!!movimientoTarget}
          onClose={() => setMovimientoTarget(null)}
          inversionId={movimientoTarget.id}
          inversionNombre={movimientoTarget.nombre}
          moneda={movimientoTarget.moneda}
          onSuccess={() => utils.inversiones.getMany.invalidate()}
        />
      )}
    </div>
  )
}
