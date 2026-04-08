import { useState } from 'react'
import { trpc } from '../../../lib/trpc'
import { AddDeseoModal } from '../components/AddDeseoModal'
import { Button } from '../../../components/ui/Button'
import { Plus, Heart, CheckCircle2, ExternalLink, Pencil, Trash2, Sparkles } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const PRIORIDAD_CONFIG = {
  1: { label: 'Alta',  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    dot: 'bg-red-400' },
  2: { label: 'Media', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-400' },
  3: { label: 'Baja',  color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/20',  dot: 'bg-slate-500' },
} as const

export function DeseosPage() {
  const utils = trpc.useUtils()
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<any | null>(null)

  const { data: deseos = [] } = trpc.deseos.getMany.useQuery()
  const deseosRaw = deseos as any[]

  const toggleMutation = trpc.deseos.toggleCompletado.useMutation({
    onSuccess: () => utils.deseos.getMany.invalidate(),
  })
  const deleteMutation = trpc.deseos.delete.useMutation({
    onSuccess: () => utils.deseos.getMany.invalidate(),
  })

  const pendientes = deseosRaw.filter(d => !d.completado)
  const completados = deseosRaw.filter(d => d.completado)
  const totalEstimado = pendientes.reduce((s, d) => s + Number(d.precio ?? 0), 0)

  const fmt = (v: number) => `$${v.toLocaleString('es-AR')}`

  const handleEdit = (d: any) => { setEditData(d); setModalOpen(true) }
  const handleClose = () => { setEditData(null); setModalOpen(false) }

  const renderCard = (d: any) => {
    const p = PRIORIDAD_CONFIG[d.prioridad as 1 | 2 | 3] ?? PRIORIDAD_CONFIG[3]
    return (
      <div
        key={d.id}
        className={cn(
          'card p-5 flex flex-col gap-3 transition-all',
          d.completado && 'opacity-50',
        )}
      >
        {/* Top row: prioridad badge + toggle */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full', p.color, p.bg)}>
                {p.label}
              </span>
              {d.completado && (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-green-400 bg-green-500/10">
                  ¡Conseguido!
                </span>
              )}
            </div>
            <h3 className={cn('text-sm font-bold leading-tight', d.completado ? 'line-through text-slate-500' : 'text-slate-100')}>
              {d.nombre}
            </h3>
            {d.descripcion && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{d.descripcion}</p>
            )}
          </div>

          {/* Toggle completado */}
          <button
            onClick={() => toggleMutation.mutate({ id: d.id })}
            title={d.completado ? 'Marcar como pendiente' : 'Marcar como conseguido'}
            className={cn(
              'flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all',
              d.completado
                ? 'bg-green-500/20 border-green-500/40 text-green-400'
                : 'border-white/10 text-slate-600 hover:border-green-500/40 hover:text-green-400',
            )}
          >
            <CheckCircle2 size={15} />
          </button>
        </div>

        {/* Precio */}
        {d.precio && (
          <p className="text-xl font-black text-white tabular-nums">
            {fmt(Number(d.precio))}
            <span className="text-xs font-bold text-slate-500 ml-1.5">{d.moneda}</span>
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1 border-t border-white/5">
          <div>
            {d.fechaObjetivo && (
              <span className="text-[10px] text-slate-600 font-bold">
                Objetivo: {format(new Date(d.fechaObjetivo), 'd MMM yyyy', { locale: es })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {d.urlProducto && (
              <a
                href={d.urlProducto}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-white/5 transition-all"
                title="Ver producto"
              >
                <ExternalLink size={13} />
              </a>
            )}
            <button
              onClick={() => handleEdit(d)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => deleteMutation.mutate({ id: d.id })}
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
      {/* Header: stats + add button */}
      <div className="flex items-start gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          {[
            { label: 'Total',       value: deseosRaw.length, color: 'text-brand-400' },
            { label: 'Pendientes',  value: pendientes.length, color: 'text-yellow-400' },
            { label: 'Conseguidos', value: completados.length, color: 'text-green-400' },
            { label: 'Total Est.',  value: totalEstimado > 0 ? fmt(totalEstimado) : '—', color: 'text-white' },
          ].map(s => (
            <div key={s.label} className="card p-3">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={cn('text-lg font-black tabular-nums', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
        <Button onClick={() => setModalOpen(true)} className="flex-shrink-0 mt-1">
          <Plus size={16} className="mr-1" /> Nuevo Deseo
        </Button>
      </div>

      {/* Empty state */}
      {deseosRaw.length === 0 && (
        <div className="card p-14 text-center">
          <Heart size={44} className="mx-auto text-slate-700 mb-4" />
          <p className="text-slate-400 font-bold text-base">Tu lista de deseos está vacía</p>
          <p className="text-xs text-slate-600 mt-1 mb-5">Agregá productos o metas que querés conseguir</p>
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus size={14} className="mr-1" /> Agregar primer deseo
          </Button>
        </div>
      )}

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={11} /> Pendientes ({pendientes.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendientes.map(renderCard)}
          </div>
        </div>
      )}

      {/* Completados */}
      {completados.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={11} /> Conseguidos ({completados.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completados.map(renderCard)}
          </div>
        </div>
      )}

      <AddDeseoModal isOpen={modalOpen} onClose={handleClose} initialData={editData} />
    </div>
  )
}
