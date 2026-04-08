import { useState } from 'react'
import { trpc } from '../../../lib/trpc'
import { AddVacacionModal } from '../components/AddVacacionModal'
import { AddAhorroVacacionModal } from '../components/AddAhorroVacacionModal'
import { AddGastoVacacionModal } from '../components/AddGastoVacacionModal'
import { Button } from '../../../components/ui/Button'
import {
  Plus, Plane, CheckCircle2, Pencil, Trash2,
  PiggyBank, Receipt, ChevronDown, ChevronUp, MapPin,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

export function VacacionesPage() {
  const utils = trpc.useUtils()
  const [vacModal, setVacModal] = useState(false)
  const [editData, setEditData] = useState<any | null>(null)
  const [ahorroTarget, setAhorroTarget] = useState<{ id: string; destino: string } | null>(null)
  const [gastoTarget, setGastoTarget] = useState<{ id: string; destino: string } | null>(null)
  const [expanded, setExpanded] = useState<Record<string, 'ahorros' | 'gastos' | null>>({})

  const { data: vacaciones = [] } = trpc.vacaciones.getMany.useQuery()
  const vacsRaw = vacaciones as any[]

  const toggleMutation = trpc.vacaciones.toggleCompletada.useMutation({
    onSuccess: () => utils.vacaciones.getMany.invalidate(),
  })
  const deleteMutation = trpc.vacaciones.delete.useMutation({
    onSuccess: () => utils.vacaciones.getMany.invalidate(),
  })
  const deleteAhorroMutation = trpc.vacaciones.deleteAhorro.useMutation({
    onSuccess: () => utils.vacaciones.getMany.invalidate(),
  })
  const deleteGastoMutation = trpc.vacaciones.deleteGasto.useMutation({
    onSuccess: () => utils.vacaciones.getMany.invalidate(),
  })

  const pendientes = vacsRaw.filter(v => !v.completada)
  const completadas = vacsRaw.filter(v => v.completada)
  const totalAhorrado = pendientes.reduce((s, v) => s + (v.ahorros ?? []).reduce((a: number, x: any) => a + Number(x.monto), 0), 0)
  const totalGastado = vacsRaw.reduce((s, v) => s + (v.gastos ?? []).reduce((a: number, x: any) => a + Number(x.monto), 0), 0)

  const fmt = (v: number) => `$${v.toLocaleString('es-AR')}`

  const toggleExpanded = (id: string, section: 'ahorros' | 'gastos') => {
    setExpanded(prev => ({
      ...prev,
      [id]: prev[id] === section ? null : section,
    }))
  }

  const handleEdit = (v: any) => { setEditData(v); setVacModal(true) }
  const handleCloseVacModal = () => { setEditData(null); setVacModal(false) }

  const renderVacacion = (v: any) => {
    const totalAhorros = (v.ahorros ?? []).reduce((s: number, a: any) => s + Number(a.monto), 0)
    const totalGastos = (v.gastos ?? []).reduce((s: number, g: any) => s + Number(g.monto), 0)
    const presupuesto = v.presupuesto ? Number(v.presupuesto) : null
    const progresoPct = presupuesto && presupuesto > 0 ? Math.min((totalAhorros / presupuesto) * 100, 100) : null
    const dias = v.fechaSalida && v.fechaRegreso
      ? differenceInDays(new Date(v.fechaRegreso), new Date(v.fechaSalida))
      : null
    const daysUntil = v.fechaSalida && !v.completada
      ? differenceInDays(new Date(v.fechaSalida), new Date())
      : null
    const expandedSection = expanded[v.id]

    return (
      <div key={v.id} className={cn('card p-5 space-y-4', v.completada && 'opacity-60')}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {v.completada ? (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-green-400 bg-green-500/10">Completada</span>
              ) : daysUntil !== null && daysUntil >= 0 ? (
                <span className={cn(
                  'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
                  daysUntil <= 7 ? 'text-red-400 bg-red-500/10' : daysUntil <= 30 ? 'text-yellow-400 bg-yellow-500/10' : 'text-brand-400 bg-brand-500/10'
                )}>
                  {daysUntil === 0 ? '¡Hoy!' : `En ${daysUntil} días`}
                </span>
              ) : null}
              {dias !== null && (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-slate-500 bg-slate-500/10">
                  {dias} {dias === 1 ? 'día' : 'días'}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <MapPin size={14} className="text-brand-400 flex-shrink-0" />
              {v.destino}
            </h3>
            {v.descripcion && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{v.descripcion}</p>
            )}
            {(v.fechaSalida || v.fechaRegreso) && (
              <p className="text-[10px] text-slate-600 font-bold mt-1.5">
                {v.fechaSalida ? format(new Date(v.fechaSalida), 'd MMM yyyy', { locale: es }) : '?'}
                {' → '}
                {v.fechaRegreso ? format(new Date(v.fechaRegreso), 'd MMM yyyy', { locale: es }) : '?'}
              </p>
            )}
          </div>

          {/* Toggle completada */}
          <button
            onClick={() => toggleMutation.mutate({ id: v.id })}
            title={v.completada ? 'Marcar como pendiente' : 'Marcar como completada'}
            className={cn(
              'flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all',
              v.completada
                ? 'bg-green-500/20 border-green-500/40 text-green-400'
                : 'border-white/10 text-slate-600 hover:border-green-500/40 hover:text-green-400',
            )}
          >
            <CheckCircle2 size={15} />
          </button>
        </div>

        {/* Presupuesto + barra de progreso */}
        {presupuesto && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">Ahorro</span>
              <span className="font-black text-slate-200">
                {fmt(totalAhorros)}<span className="text-slate-600"> / {fmt(presupuesto)}</span>
                <span className="ml-1.5 text-slate-500">{v.moneda}</span>
              </span>
            </div>
            <div className="h-2 bg-surface-950 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progresoPct}%`,
                  background: progresoPct! >= 100 ? '#22c55e' : progresoPct! >= 60 ? '#3b82f6' : '#f59e0b',
                }}
              />
            </div>
            <p className="text-[10px] text-slate-600 font-bold text-right">
              {progresoPct?.toFixed(0)}% del presupuesto ahorrado
            </p>
          </div>
        )}

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => toggleExpanded(v.id, 'ahorros')}
            className={cn(
              'flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all',
              expandedSection === 'ahorros'
                ? 'bg-brand-500/10 border-brand-500/30'
                : 'bg-surface-950/60 border-white/5 hover:border-brand-500/20',
            )}
          >
            <div className="flex items-center gap-2">
              <PiggyBank size={13} className="text-brand-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase">Ahorros</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-brand-400">{fmt(totalAhorros)}</span>
              {expandedSection === 'ahorros' ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
            </div>
          </button>

          <button
            onClick={() => toggleExpanded(v.id, 'gastos')}
            className={cn(
              'flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all',
              expandedSection === 'gastos'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-surface-950/60 border-white/5 hover:border-yellow-500/20',
            )}
          >
            <div className="flex items-center gap-2">
              <Receipt size={13} className="text-yellow-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase">Gastos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-yellow-400">{fmt(totalGastos)}</span>
              {expandedSection === 'gastos' ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
            </div>
          </button>
        </div>

        {/* Lista expandida de ahorros */}
        {expandedSection === 'ahorros' && (
          <div className="space-y-1.5 pt-1">
            {(v.ahorros ?? []).length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-2">Sin ahorros registrados</p>
            ) : (
              (v.ahorros as any[]).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-950/40 border border-white/5 text-xs">
                  <div>
                    <span className="text-slate-300 font-bold">{fmt(Number(a.monto))}</span>
                    <span className="text-slate-600 ml-2">{format(new Date(a.fecha), 'd MMM yyyy', { locale: es })}</span>
                    {a.notas && <span className="text-slate-600 ml-2 italic">· {a.notas}</span>}
                  </div>
                  <button
                    onClick={() => deleteAhorroMutation.mutate({ id: a.id })}
                    className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
            <button
              onClick={() => setAhorroTarget({ id: v.id, destino: v.destino })}
              className="w-full text-xs text-brand-400 hover:text-brand-300 font-bold py-1 transition-colors"
            >
              + Agregar ahorro
            </button>
          </div>
        )}

        {/* Lista expandida de gastos */}
        {expandedSection === 'gastos' && (
          <div className="space-y-1.5 pt-1">
            {(v.gastos ?? []).length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-2">Sin gastos registrados</p>
            ) : (
              (v.gastos as any[]).map((g: any) => (
                <div key={g.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-950/40 border border-white/5 text-xs">
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-300 font-bold">{g.descripcion}</span>
                    {g.categoria && <span className="ml-2 text-[9px] font-black bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{g.categoria}</span>}
                    <div className="text-slate-600 mt-0.5">
                      {fmt(Number(g.monto))} {g.moneda} · {format(new Date(g.fecha), 'd MMM yyyy', { locale: es })}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteGastoMutation.mutate({ id: g.id })}
                    className="p-1 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
            <button
              onClick={() => setGastoTarget({ id: v.id, destino: v.destino })}
              className="w-full text-xs text-yellow-400 hover:text-yellow-300 font-bold py-1 transition-colors"
            >
              + Agregar gasto
            </button>
          </div>
        )}

        {/* Actions footer */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAhorroTarget({ id: v.id, destino: v.destino })}
              className="text-brand-400 hover:text-brand-300 text-[10px]"
            >
              <PiggyBank size={12} className="mr-1" /> Ahorrar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setGastoTarget({ id: v.id, destino: v.destino })}
              className="text-yellow-400 hover:text-yellow-300 text-[10px]"
            >
              <Receipt size={12} className="mr-1" /> Gasto
            </Button>
          </div>
          <div className="flex gap-0.5">
            <button
              onClick={() => handleEdit(v)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => deleteMutation.mutate({ id: v.id })}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="flex items-start gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          {[
            { label: 'Total',      value: vacsRaw.length,      color: 'text-brand-400' },
            { label: 'Pendientes', value: pendientes.length,   color: 'text-yellow-400' },
            { label: 'Total Ahorrado', value: totalAhorrado > 0 ? fmt(totalAhorrado) : '—', color: 'text-blue-400' },
            { label: 'Total Gastado',  value: totalGastado > 0 ? fmt(totalGastado)   : '—', color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="card p-3">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={cn('text-lg font-black tabular-nums', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
        <Button onClick={() => setVacModal(true)} className="flex-shrink-0 mt-1">
          <Plus size={16} className="mr-1" /> Nueva Vacación
        </Button>
      </div>

      {/* Empty state */}
      {vacsRaw.length === 0 && (
        <div className="card p-14 text-center">
          <Plane size={44} className="mx-auto text-slate-700 mb-4" />
          <p className="text-slate-400 font-bold text-base">No tenés viajes planificados</p>
          <p className="text-xs text-slate-600 mt-1 mb-5">Creá tu primer plan de vacaciones y empezá a ahorrar</p>
          <Button onClick={() => setVacModal(true)} size="sm">
            <Plus size={14} className="mr-1" /> Planificar vacaciones
          </Button>
        </div>
      )}

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Plane size={11} /> Próximas ({pendientes.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendientes.map(renderVacacion)}
          </div>
        </div>
      )}

      {/* Completadas */}
      {completadas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={11} /> Completadas ({completadas.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completadas.map(renderVacacion)}
          </div>
        </div>
      )}

      {/* Modales */}
      <AddVacacionModal isOpen={vacModal} onClose={handleCloseVacModal} initialData={editData} />
      <AddAhorroVacacionModal
        isOpen={!!ahorroTarget}
        onClose={() => setAhorroTarget(null)}
        vacacion={ahorroTarget}
      />
      <AddGastoVacacionModal
        isOpen={!!gastoTarget}
        onClose={() => setGastoTarget(null)}
        vacacion={gastoTarget}
      />
    </div>
  )
}
