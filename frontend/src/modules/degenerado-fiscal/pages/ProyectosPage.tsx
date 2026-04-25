import { useState } from 'react'
import { trpc } from '../../../lib/trpc'
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  Calendar, DollarSign, Target, CheckCircle2, Pause,
  PlayCircle, XCircle, Clock, Receipt,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { AddProyectoModal } from '../components/AddProyectoModal'
import { AddGastoProyectoModal } from '../components/AddGastoProyectoModal'
import { cn } from '../../../lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────

type Estado = 'PLANIFICANDO' | 'EN_PROGRESO' | 'PAUSADO' | 'COMPLETADO' | 'CANCELADO'

const ESTADO_CONFIG: Record<Estado, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  PLANIFICANDO: { label: 'Planificando', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: Clock },
  EN_PROGRESO:  { label: 'En Progreso',  color: 'text-brand-400',  bg: 'bg-brand-500/10',  border: 'border-brand-500/20',  icon: PlayCircle },
  PAUSADO:      { label: 'Pausado',      color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Pause },
  COMPLETADO:   { label: 'Completado',   color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: CheckCircle2 },
  CANCELADO:    { label: 'Cancelado',    color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    icon: XCircle },
}

const NEXT_ESTADO: Record<Estado, Estado> = {
  PLANIFICANDO: 'EN_PROGRESO',
  EN_PROGRESO:  'COMPLETADO',
  PAUSADO:      'EN_PROGRESO',
  COMPLETADO:   'PLANIFICANDO',
  CANCELADO:    'PLANIFICANDO',
}

const NEXT_LABEL: Record<Estado, string> = {
  PLANIFICANDO: 'Iniciar',
  EN_PROGRESO:  'Completar',
  PAUSADO:      'Reanudar',
  COMPLETADO:   'Reabrir',
  CANCELADO:    'Reabrir',
}

function calcGastado(gastos: any[]) {
  return gastos.reduce((s, g) => s + Number(g.monto), 0)
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function ProyectosPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addGastoFor, setAddGastoFor] = useState<{ id: string; nombre: string } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: rawProyectos, isLoading } = trpc.proyectos.getMany.useQuery()
  const proyectos = rawProyectos as (any[] | undefined)

  const changeEstadoMutation = trpc.proyectos.changeEstado.useMutation({
    onSuccess: () => utils.proyectos.getMany.invalidate(),
  })

  const deleteMutation = trpc.proyectos.delete.useMutation({
    onSuccess: () => utils.proyectos.getMany.invalidate(),
  })

  const deleteGastoMutation = trpc.proyectos.deleteGasto.useMutation({
    onSuccess: () => utils.proyectos.getMany.invalidate(),
  })

  // ── Resumen ──────────────────────────────────────────────────────────────

  const activos = proyectos?.filter(p => p.estado !== 'CANCELADO') || []
  const totalPresupuestado = activos.reduce((s, p) => s + (Number(p.presupuesto) || 0), 0)
  const totalGastado = activos.reduce((s, p) => s + calcGastado(p.gastos), 0)
  const enProgreso = activos.filter(p => p.estado === 'EN_PROGRESO').length

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
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Target size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Proyectos</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Presupuesto y seguimiento de proyectos</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-gradient-to-br from-violet-500/10 to-transparent border-violet-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
              <DollarSign size={20} />
            </div>
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Presupuesto Total</span>
          </div>
          <p className="text-3xl font-black text-white tabular-nums">
            {totalPresupuestado > 0 ? `$${totalPresupuestado.toLocaleString('es-AR')}` : '—'}
          </p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Proyectos activos</p>
        </div>

        <div className="card p-6 bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
              <Receipt size={20} />
            </div>
            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Gastado</span>
          </div>
          <p className="text-3xl font-black text-yellow-400 tabular-nums">
            ${totalGastado.toLocaleString('es-AR')}
          </p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">
            {totalPresupuestado > 0
              ? `${Math.round((totalGastado / totalPresupuestado) * 100)}% del presupuesto`
              : 'Sin presupuesto asignado'}
          </p>
        </div>

        <div className="card p-6 bg-surface-900 border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
              <PlayCircle size={20} />
            </div>
            <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">En Progreso</span>
          </div>
          <p className="text-3xl font-black text-white tabular-nums">{enProgreso}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">
            {activos.length} proyecto{activos.length !== 1 ? 's' : ''} activo{activos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Lista de proyectos */}
      <div className="space-y-4">
        <AnimatePresence>
          {proyectos?.map((proyecto) => {
            const estado = proyecto.estado as Estado
            const cfg = ESTADO_CONFIG[estado]
            const StatusIcon = cfg.icon
            const gastado = calcGastado(proyecto.gastos)
            const presupuesto = Number(proyecto.presupuesto) || 0
            const pct = presupuesto > 0 ? Math.min((gastado / presupuesto) * 100, 100) : 0
            const overBudget = presupuesto > 0 && gastado > presupuesto
            const isExpanded = expandedId === proyecto.id
            const diasRestantes = proyecto.fechaObjetivo
              ? differenceInDays(new Date(proyecto.fechaObjetivo), new Date())
              : null
            const vencido = diasRestantes !== null && diasRestantes < 0 && estado !== 'COMPLETADO'

            return (
              <motion.div
                key={proyecto.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  'card overflow-hidden transition-all duration-300',
                  estado === 'CANCELADO' ? 'opacity-50' : '',
                  estado === 'COMPLETADO' ? 'border-green-500/15' : 'border-white/10 hover:border-violet-500/30'
                )}
              >
                {/* Header del proyecto */}
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Icono + info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={cn('mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg, cfg.border, 'border')}>
                        <StatusIcon size={18} className={cfg.color} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white">{proyecto.nombre}</h3>
                          <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg', cfg.bg, cfg.color, cfg.border, 'border')}>
                            {cfg.label}
                          </span>
                          {vencido && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                              Vencido
                            </span>
                          )}
                        </div>
                        {proyecto.descripcion && (
                          <p className="text-xs text-slate-500 mt-0.5">{proyecto.descripcion}</p>
                        )}
                        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                          {proyecto.fechaInicio && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-600 font-bold uppercase">
                              <Calendar size={10} />
                              Inicio: {format(new Date(proyecto.fechaInicio), 'dd MMM yyyy', { locale: es })}
                            </span>
                          )}
                          {proyecto.fechaObjetivo && (
                            <span className={cn(
                              'flex items-center gap-1 text-[10px] font-bold uppercase',
                              vencido ? 'text-red-500' : 'text-slate-600'
                            )}>
                              <Target size={10} />
                              Objetivo: {format(new Date(proyecto.fechaObjetivo), 'dd MMM yyyy', { locale: es })}
                              {diasRestantes !== null && !vencido && diasRestantes <= 30 && (
                                <span className="text-yellow-500"> · {diasRestantes}d</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right mr-2">
                        <p className="text-base font-black text-white tabular-nums">
                          ${gastado.toLocaleString('es-AR')}
                        </p>
                        {presupuesto > 0 && (
                          <p className={cn('text-[10px] font-bold uppercase', overBudget ? 'text-red-400' : 'text-slate-500')}>
                            {overBudget ? '⚠ Sobre presupuesto' : `de $${presupuesto.toLocaleString('es-AR')}`}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setAddGastoFor({ id: proyecto.id, nombre: proyecto.nombre })}
                        className="p-2 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500 hover:text-white transition-all border border-violet-500/20"
                        title="Cargar gasto"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => changeEstadoMutation.mutate({ id: proyecto.id, estado: NEXT_ESTADO[estado] })}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 hover:border-white/20"
                        title={NEXT_LABEL[estado]}
                      >
                        {NEXT_LABEL[estado]}
                      </button>
                      <button
                        onClick={() => { if (window.confirm('¿Eliminar proyecto?')) deleteMutation.mutate({ id: proyecto.id }) }}
                        className="p-2 rounded-lg bg-white/5 text-slate-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : proyecto.id)}
                        className="p-2 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-all"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  {presupuesto > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Presupuesto ejecutado</span>
                        <span className={cn('text-[10px] font-black', overBudget ? 'text-red-400' : 'text-slate-400')}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', overBudget ? 'bg-red-500' : 'bg-violet-500')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Detalle de gastos (expandible) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="p-5 space-y-3">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Gastos cargados ({proyecto.gastos.length})
                        </p>
                        {proyecto.gastos.length === 0 ? (
                          <p className="text-xs text-slate-600 italic text-center py-4">
                            Sin gastos registrados aún.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {proyecto.gastos.map((g: any) => (
                              <div key={g.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 group">
                                <div className="min-w-0">
                                  <p className="text-sm text-slate-200 font-medium truncate">{g.descripcion}</p>
                                  <p className="text-[10px] text-slate-600 mt-0.5 font-bold uppercase">
                                    {format(new Date(g.fecha), 'dd MMM yyyy', { locale: es })}
                                    {g.categoria && ` · ${g.categoria}`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                  <span className="text-sm font-black text-white tabular-nums">
                                    ${Number(g.monto).toLocaleString('es-AR')}
                                  </span>
                                  <button
                                    onClick={() => { if (window.confirm('¿Eliminar este gasto?')) deleteGastoMutation.mutate({ id: g.id }) }}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setAddGastoFor({ id: proyecto.id, nombre: proyecto.nombre })}
                        >
                          <Plus size={14} /> Agregar Gasto
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Empty state */}
        {proyectos?.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-600 gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center opacity-20">
              <Target size={32} />
            </div>
            <p className="text-sm font-medium italic">Todavía no tenés proyectos creados.</p>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(true)}>Crear el primero</Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddProyectoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => utils.proyectos.getMany.invalidate()}
      />

      <AddGastoProyectoModal
        isOpen={!!addGastoFor}
        onClose={() => setAddGastoFor(null)}
        proyecto={addGastoFor}
        onSuccess={() => utils.proyectos.getMany.invalidate()}
      />
    </div>
  )
}
