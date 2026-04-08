import { useState } from 'react'
import { trpc } from '../../../lib/trpc'
import {
  Plus, CreditCard, CheckCircle2, Circle, Trash2, Archive,
  ChevronDown, ChevronUp, AlertCircle, Calendar, DollarSign, Building2
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isPast, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { AddCreditoModal } from '../components/AddCreditoModal'
import { cn } from '../../../lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcProgreso(pagos: any[]) {
  const pagadas = pagos.filter(p => p.pagado).length
  const total = pagos.length
  const pct = total > 0 ? (pagadas / total) * 100 : 0
  return { pagadas, total, pct }
}

function calcDeudaRestante(pagos: any[]) {
  return pagos
    .filter(p => !p.pagado)
    .reduce((acc, p) => acc + Number(p.monto), 0)
}

function calcProximaCuota(pagos: any[]) {
  return pagos
    .filter(p => !p.pagado)
    .sort((a, b) => new Date(a.fechaPago).getTime() - new Date(b.fechaPago).getTime())[0] ?? null
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function CreditosPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: rawCreditos, isLoading } = trpc.creditos.getMany.useQuery()
  const creditos = rawCreditos as (any[] | undefined)

  const toggleActivoMutation = trpc.creditos.toggleActivo.useMutation({
    onSuccess: () => utils.creditos.getMany.invalidate(),
  })

  const deleteMutation = trpc.creditos.delete.useMutation({
    onSuccess: () => utils.creditos.getMany.invalidate(),
  })

  const togglePagoMutation = trpc.creditos.togglePago.useMutation({
    onSuccess: () => utils.creditos.getMany.invalidate(),
  })

  // ── Resumen ─────────────────────────────────────────────────────────────

  const activos = creditos?.filter(c => c.activo) || []
  const totalDeuda = activos.reduce((acc, c) => acc + calcDeudaRestante(c.pagos), 0)
  const totalPagado = activos.reduce((acc, c) => {
    return acc + c.pagos.filter((p: any) => p.pagado).reduce((s: number, p: any) => s + Number(p.monto), 0)
  }, 0)
  const cuotasVencidas = activos.flatMap(c => c.pagos).filter((p: any) => {
    return !p.pagado && isPast(new Date(p.fechaPago))
  }).length

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-white/5 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl" />)}
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-28 bg-white/5 rounded-3xl" />)}
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
            <CreditCard size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Créditos y Préstamos</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Control de cuotas y deuda total</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Nuevo Crédito
        </Button>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-br from-red-500/10 via-surface-900 to-surface-950 border-red-500/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
              <DollarSign size={20} />
            </div>
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Deuda Restante</span>
          </div>
          <p className="text-3xl font-black text-white tabular-nums">${totalDeuda.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">
            {activos.length} crédito{activos.length !== 1 ? 's' : ''} activo{activos.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-6 bg-gradient-to-br from-green-500/10 via-surface-900 to-surface-950 border-green-500/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Total Pagado</span>
          </div>
          <p className="text-3xl font-black text-white tabular-nums">${totalPagado.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Cuotas abonadas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={cn(
            'card p-6 bg-gradient-to-br border',
            cuotasVencidas > 0
              ? 'from-yellow-500/10 via-surface-900 to-surface-950 border-yellow-500/20'
              : 'from-surface-900 via-surface-900 to-surface-950 border-white/5'
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              cuotasVencidas > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-800 text-slate-500'
            )}>
              <AlertCircle size={20} />
            </div>
            <span className={cn(
              'text-[10px] font-black uppercase tracking-widest',
              cuotasVencidas > 0 ? 'text-yellow-500' : 'text-slate-600'
            )}>
              Cuotas Vencidas
            </span>
          </div>
          <p className={cn('text-3xl font-black tabular-nums', cuotasVencidas > 0 ? 'text-yellow-400' : 'text-slate-500')}>
            {cuotasVencidas}
          </p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">
            {cuotasVencidas > 0 ? 'Requieren atención' : 'Todo al día'}
          </p>
        </motion.div>
      </div>

      {/* Lista de Créditos */}
      <div className="space-y-4">
        <AnimatePresence>
          {creditos?.map((credito, idx) => {
            const { pagadas, total, pct } = calcProgreso(credito.pagos)
            const deudaRestante = calcDeudaRestante(credito.pagos)
            const proximaCuota = calcProximaCuota(credito.pagos)
            const isExpanded = expandedId === credito.id
            const proximaVencida = proximaCuota && isPast(new Date(proximaCuota.fechaPago))
            const diasProxima = proximaCuota
              ? differenceInDays(new Date(proximaCuota.fechaPago), new Date())
              : null
            const isCompleto = pagadas === total && total > 0

            return (
              <motion.div
                key={credito.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: credito.activo ? 1 : 0.5, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  'card overflow-hidden transition-all',
                  !credito.activo && 'border-white/5 bg-surface-950/30'
                )}
              >
                {/* Card Header */}
                <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                  {/* Nombre + entidad */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      isCompleto ? 'bg-green-500/20 text-green-400' : 'bg-brand-500/20 text-brand-400'
                    )}>
                      {isCompleto ? <CheckCircle2 size={20} /> : <CreditCard size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        'font-bold text-sm tracking-tight truncate',
                        credito.activo ? 'text-slate-200' : 'text-slate-500'
                      )}>
                        {credito.nombre}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {credito.entidad && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Building2 size={10} /> {credito.entidad}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600">
                          {credito.moneda} · {total} cuotas de ${Number(credito.montoCuota).toLocaleString()}
                        </span>
                        {credito.tasaInteres && (
                          <span className="text-[10px] text-slate-600">· TNA {credito.tasaInteres}%</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Próxima cuota */}
                  {proximaCuota && !isCompleto && (
                    <div className={cn(
                      'flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0',
                      proximaVencida
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : diasProxima !== null && diasProxima <= 7
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        : 'bg-white/[0.02] text-slate-500 border-white/5'
                    )}>
                      <Calendar size={11} />
                      {proximaVencida
                        ? `Cuota ${proximaCuota.numeroCuota} vencida`
                        : `Cuota ${proximaCuota.numeroCuota} — ${format(new Date(proximaCuota.fechaPago), 'dd MMM', { locale: es })}`}
                    </div>
                  )}

                  {isCompleto && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 shrink-0">
                      <CheckCircle2 size={11} /> ¡Saldado!
                    </div>
                  )}

                  {/* Monto restante */}
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Deuda restante</p>
                    <p className="text-sm font-black text-red-400 tabular-nums font-mono">
                      ${deudaRestante.toLocaleString()}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleActivoMutation.mutate({ id: credito.id })}
                      className={cn(
                        'p-2 rounded-xl border transition-all',
                        credito.activo
                          ? 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                          : 'bg-slate-800 border-white/5 text-slate-600 hover:text-slate-400'
                      )}
                      title={credito.activo ? 'Archivar' : 'Reactivar'}
                    >
                      <Archive size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Eliminar este crédito y todas sus cuotas?')) {
                          deleteMutation.mutate({ id: credito.id })
                        }
                      }}
                      className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : credito.id)}
                      className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-slate-500 hover:text-slate-300 transition-all"
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                      {pagadas} / {total} cuotas pagadas
                    </span>
                    <span className="text-[10px] font-black text-slate-400">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full',
                        isCompleto ? 'bg-green-500' : 'bg-brand-500'
                      )}
                    />
                  </div>
                </div>

                {/* Cuotas expandidas */}
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
                          Detalle de cuotas
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {credito.pagos.map((pago: any) => {
                            const vencida = !pago.pagado && isPast(new Date(pago.fechaPago))
                            const proxima = !pago.pagado && diferenEnDias(pago.fechaPago) <= 7 && diferenEnDias(pago.fechaPago) >= 0

                            return (
                              <button
                                key={pago.id}
                                onClick={() => togglePagoMutation.mutate({ id: pago.id })}
                                className={cn(
                                  'flex items-center gap-3 p-3 rounded-xl border text-left transition-all group',
                                  pago.pagado
                                    ? 'bg-green-500/5 border-green-500/20'
                                    : vencida
                                    ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                                    : proxima
                                    ? 'bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10'
                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                )}
                              >
                                {pago.pagado
                                  ? <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                                  : vencida
                                  ? <AlertCircle size={16} className="text-red-400 shrink-0" />
                                  : <Circle size={16} className="text-slate-600 shrink-0 group-hover:text-slate-400 transition-colors" />
                                }
                                <div className="min-w-0 flex-1">
                                  <p className={cn(
                                    'text-xs font-bold',
                                    pago.pagado ? 'text-slate-500 line-through' : 'text-slate-300'
                                  )}>
                                    Cuota {pago.numeroCuota}
                                  </p>
                                  <p className="text-[10px] text-slate-600">
                                    {format(new Date(pago.fechaPago), 'dd MMM yyyy', { locale: es })}
                                  </p>
                                </div>
                                <span className={cn(
                                  'text-xs font-black tabular-nums font-mono shrink-0',
                                  pago.pagado ? 'text-slate-600' : 'text-slate-300'
                                )}>
                                  ${Number(pago.monto).toLocaleString()}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {creditos?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card p-20 text-center flex flex-col items-center gap-4 text-slate-600"
          >
            <CreditCard size={48} className="opacity-20" />
            <p className="text-sm italic">No tenés créditos registrados.</p>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(true)}>
              Cargar el primero
            </Button>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <AddCreditoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => utils.creditos.getMany.invalidate()}
      />
    </div>
  )
}

// helper local para evitar re-import
function diferenEnDias(fechaPago: string | Date) {
  return differenceInDays(new Date(fechaPago), new Date())
}
