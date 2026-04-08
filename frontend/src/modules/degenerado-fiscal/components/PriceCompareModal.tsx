import { trpc } from '../../../lib/trpc'
import { Modal } from '../../../components/shared/Modal'
import { BarChart2, Store, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '../../../lib/utils'

interface Props {
  isOpen: boolean
  productoId: string
  nombre: string
  supermercadoActual?: string
  onClose: () => void
}

export function PriceCompareModal({ isOpen, productoId, nombre, supermercadoActual, onClose }: Props) {
  const { data: compareData, isLoading: loadingCompare } = trpc.supermercado.compararPrecios.useQuery(
    { productoId },
    { enabled: isOpen && !!productoId },
  )
  const { data: historial = [], isLoading: loadingHist } = trpc.supermercado.getHistorialPrecios.useQuery(
    { productoId, supermercado: supermercadoActual },
    { enabled: isOpen && !!productoId && !!supermercadoActual },
  )

  const compareCast = compareData as any
  const historialCast = historial as any[]
  const precios: any[] = compareCast?.precios ?? []
  const minPrecio = precios.length > 0 ? Math.min(...precios.map((p: any) => Number(p.precio))) : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Precios: ${nombre}`}>
      <div className="space-y-5">

        {/* Comparación entre supers */}
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <BarChart2 size={11} />
            Precio actual por supermercado
          </p>

          {loadingCompare && (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          )}

          {!loadingCompare && precios.length === 0 && (
            <div className="text-center py-6 text-slate-600 text-sm">
              Sin datos de precios todavía
            </div>
          )}

          {!loadingCompare && precios.length > 0 && (
            <div className="space-y-2">
              {precios.map((p: any, i: number) => {
                const esMasBarato = Number(p.precio) === minPrecio
                const esCurrent = p.supermercado === supermercadoActual

                return (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors',
                      esMasBarato
                        ? 'border-emerald-500/30 bg-emerald-500/8'
                        : 'border-white/8 bg-white/3',
                    )}
                  >
                    {/* Posición */}
                    <span className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                      esMasBarato ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500',
                    )}>
                      {i + 1}
                    </span>

                    {/* Super */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Store size={12} className="text-slate-500 shrink-0" />
                        <span className={cn('text-sm font-medium truncate', esCurrent ? 'text-brand-400' : 'text-slate-200')}>
                          {p.supermercado}
                          {esCurrent && <span className="ml-1 text-[10px] text-brand-500">(actual)</span>}
                        </span>
                        {esMasBarato && (
                          <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full ml-1">
                            más barato
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        {format(new Date(p.fecha), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>

                    {/* Precio */}
                    <div className="flex flex-col items-end shrink-0">
                      <p className={cn('text-base font-bold', esMasBarato ? 'text-emerald-400' : 'text-slate-200')}>
                        ${Number(p.precio).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {p.tienePrecioAnterior && p.variacionPct != null && (
                        <div className={cn('flex items-center gap-0.5 text-[10px] font-semibold', Number(p.variacionPct) > 0 ? 'text-red-400' : Number(p.variacionPct) < 0 ? 'text-emerald-400' : 'text-slate-500')}>
                          {Number(p.variacionPct) > 0
                            ? <TrendingUp size={10} />
                            : Number(p.variacionPct) < 0
                              ? <TrendingDown size={10} />
                              : <Minus size={10} />
                          }
                          {Number(p.variacionPct) > 0 ? '+' : ''}{Number(p.variacionPct).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Historial en el super actual */}
        {supermercadoActual && (
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingUp size={11} />
              Historial en {supermercadoActual}
            </p>

            {loadingHist && (
              <div className="space-y-1">
                {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            )}

            {!loadingHist && historialCast.length === 0 && (
              <p className="text-slate-600 text-xs text-center py-4">Sin historial en este super</p>
            )}

            {!loadingHist && historialCast.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {historialCast.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/3 transition-colors">
                    <span className="text-xs text-slate-600 w-24 shrink-0">
                      {format(new Date(h.fecha), "d MMM yyyy", { locale: es })}
                    </span>
                    <span className="text-sm font-semibold text-slate-200 flex-1">
                      ${Number(h.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                    {h.tienePrecioAnterior && h.variacionPct != null && (
                      <span className={cn(
                        'text-[10px] font-bold flex items-center gap-0.5',
                        Number(h.variacionPct) > 0 ? 'text-red-400' : Number(h.variacionPct) < 0 ? 'text-emerald-400' : 'text-slate-500',
                      )}>
                        {Number(h.variacionPct) > 0 ? '▲' : Number(h.variacionPct) < 0 ? '▼' : '—'}
                        {' '}{Math.abs(Number(h.variacionPct)).toFixed(1)}%
                      </span>
                    )}
                    {h.conDescuento && (
                      <span className="text-[10px] text-amber-400 font-semibold">PROMO</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm font-medium transition-colors"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  )
}
