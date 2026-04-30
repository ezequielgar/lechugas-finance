import { useParams, useNavigate } from 'react-router-dom'
import { trpc } from '../../../lib/trpc'
import { ArrowLeft, Landmark, CreditCard, Calendar, ShoppingBag, Trash2, FastForward, CheckCircle, RotateCcw, Check, Edit2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInCalendarMonths, startOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from 'recharts'
import { AddConsumoModal } from '../components/AddConsumoModal'
import { EditCierreManualModal } from '../components/EditCierreManualModal'
import { useState } from 'react'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#6366f1', '#14b8a6']

// Helper: Parsea fecha segura (evita shift de timezone al leer UTC)
const parseSafeDate = (dateStr: string | Date) => {
  const str = typeof dateStr === 'string' ? dateStr : dateStr.toISOString()
  const [year, month, day] = str.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Convierte una cuota a ARS (usa tipoCambio si es USD)
const getCuotaARS = (compra: any) => {
  const cuota = Number(compra.montoCuota)
  if (compra.moneda === 'USD' && compra.tipoCambio) {
    return cuota * Number(compra.tipoCambio)
  }
  return cuota
}

// Helper: Obtiene en qué mes entra el consumo (en qué Resumen se factura)
const getMesPrimeraCuota = (compra: any, proximoCierreStr: string | null) => {
  const compraDate = parseSafeDate(compra.fechaCompra)
  const compraDay = compraDate.getDate()
  const compraMonth = compraDate.getMonth()
  const compraYear = compraDate.getFullYear()
  
  let cierreDay = 25
  if (proximoCierreStr) {
     const cierreDate = parseSafeDate(proximoCierreStr)
     cierreDay = cierreDate.getDate()
     
     if (compraYear === cierreDate.getFullYear() && compraMonth === cierreDate.getMonth()) {
        if (compraDate.getTime() > cierreDate.getTime()) {
           return addMonths(startOfMonth(compraDate), 1)
        } else {
           return startOfMonth(compraDate)
        }
     }
  }
  
  if (compraDay > cierreDay) {
    return addMonths(startOfMonth(compraDate), 1)
  } else {
    return startOfMonth(compraDate)
  }
}

export function TarjetaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const utils = trpc.useUtils()

  const [isConsumoModalOpen, setIsConsumoModalOpen] = useState(false)
  const [editingCompra, setEditingCompra] = useState<any>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [isEditCierreOpen, setIsEditCierreOpen] = useState(false)

  const { data: tarjeta, isLoading } = trpc.tarjetas.getById.useQuery(
    { id: id || '' },
    { enabled: !!id }
  )

  const updateMutation = trpc.tarjetas.updateCuotasPagadas.useMutation({
    onSuccess: () => {
      utils.tarjetas.getById.invalidate({ id: id || '' })
    }
  })

  const deleteMutation = trpc.tarjetas.deleteCompra.useMutation({
    onSuccess: () => {
      utils.tarjetas.getById.invalidate({ id: id || '' })
    }
  })

  const updateTarjetaMutation = trpc.tarjetas.update.useMutation({
    onSuccess: () => {
      utils.tarjetas.getById.invalidate({ id: id || '' })
    }
  })

  const handleEdit = (compra: any) => {
    setEditingCompra(compra)
    setIsConsumoModalOpen(true)
  }

  const handleDelete = (compraId: string) => {
    if (window.confirm('¿Eliminar este consumo? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate({ id: compraId })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white/5 rounded-3xl border border-white/5" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white/5 rounded-3xl border border-white/5" />
          <div className="space-y-6">
            <div className="h-40 bg-white/5 rounded-3xl border border-white/5" />
            <div className="h-40 bg-white/5 rounded-3xl border border-white/5" />
          </div>
        </div>
      </div>
    )
  }

  if (!tarjeta) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center text-slate-600 mb-4 border border-slate-700/30">
          <CreditCard size={32} />
        </div>
        <p className="text-slate-500 font-medium">No se encontró la tarjeta.</p>
        <Button variant="ghost" onClick={() => navigate('/degenerado-fiscal/tarjetas')} className="mt-4">
          Volver al listado
        </Button>
      </div>
    )
  }

  // Orden cronológico (más viejo primero)
  const sortedCompras = [...tarjeta.compras].sort(
    (a, b) => parseSafeDate(a.fechaCompra).getTime() - parseSafeDate(b.fechaCompra).getTime()
  )

  const proximoCierreStr = tarjeta.proximoCierre as string | null

  // Obtener solo consumos activos para el mes seleccionado
  const activeCompras = sortedCompras.filter(compra => {
    const start = getMesPrimeraCuota(compra, proximoCierreStr)
    const target = startOfMonth(selectedMonth)
    
    if (start > target) return false // Aún no se compró o entra el próximo mes
    
    if (compra.esRecurrente) return true
    
    const diff = differenceInCalendarMonths(target, start)
    return diff >= 0 && diff < compra.cuotas
  })

  // Próximo pago: suma en ARS para el mes seleccionado
  const nextPayment = activeCompras.reduce((acc, compra) => {
    return acc + getCuotaARS(compra)
  }, 0)

  // Cierre manual: verificar si los datos guardados corresponden al mes seleccionado
  const cierreManualMesDate = tarjeta.cierreManualMes
    ? parseSafeDate(tarjeta.cierreManualMes as string)
    : null
  const manualMatchesCurrent =
    cierreManualMesDate !== null &&
    cierreManualMesDate.getFullYear() === selectedMonth.getFullYear() &&
    cierreManualMesDate.getMonth() === selectedMonth.getMonth()
  const hasManualData = manualMatchesCurrent &&
    (tarjeta.cierreManualActual !== null || tarjeta.cierreManualProximo !== null)

  // Estimado Mes Siguiente (al seleccionado)
  const futurePayment = sortedCompras.filter(compra => {
    const start = getMesPrimeraCuota(compra, proximoCierreStr)
    const target = startOfMonth(addMonths(selectedMonth, 1))
    if (start > target) return false
    if (compra.esRecurrente) return true
    const diff = differenceInCalendarMonths(target, start)
    return diff >= 0 && diff < compra.cuotas
  }).reduce((acc, compra) => acc + getCuotaARS(compra), 0)

  // Gráfico de Volumen de Compras (últimos 6 meses hasta el actual)
  const last6Months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), 5 - i))
  const chartData = last6Months.map(monthDate => {
     let sum = 0
     tarjeta.compras.forEach(compra => {
        if (isSameMonth(parseSafeDate(compra.fechaCompra), monthDate)) {
           const montoTotal = Number(compra.monto)
           if (compra.moneda === 'USD' && compra.tipoCambio) {
              sum += montoTotal * Number(compra.tipoCambio)
           } else {
              sum += montoTotal
           }
        }
     })
     return {
        name: format(monthDate, 'MMM', { locale: es }),
        value: sum,
        fullDate: monthDate
     }
  })

  const handleUpdateCuotas = (compraId: string, accion: 'ADELANTAR' | 'SALDAR' | 'RESETEAR') => {
    updateMutation.mutate({ id: compraId, accion })
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/degenerado-fiscal/tarjetas')}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-brand-400 hover:border-brand-500/20 transition-all shadow-xl"
          >
            <ArrowLeft size={18} />
          </motion.button>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white">{tarjeta.nombreTarjeta}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-surface-900 border border-white/5 font-semibold uppercase tracking-wider">
                <Landmark size={12} className="text-brand-500" /> {tarjeta.nombreEntidad}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="font-bold text-slate-400 uppercase tracking-widest">{tarjeta.tipo} {tarjeta.red}</span>
              {tarjeta.ultimos4 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="font-mono bg-slate-800/50 px-2 py-0.5 rounded-md text-slate-400 text-[10px]">•••• {tarjeta.ultimos4}</span>
                </>
              )}
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span 
                className="font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 cursor-pointer hover:text-white transition-colors"
                onClick={() => {
                  const currentStr = proximoCierreStr ? proximoCierreStr.split('T')[0] : new Date().toISOString().split('T')[0]
                  const val = prompt('Fecha exacta del próximo cierre (Formato YYYY-MM-DD):', currentStr)
                  if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                     updateTarjetaMutation.mutate({ id: tarjeta.id, proximoCierre: val })
                  } else if (val !== null) {
                     alert('Formato inválido. Debe ser YYYY-MM-DD (ej: 2026-04-24)')
                  }
                }}
                title="Cambiar fecha de próximo cierre"
              >
                 {proximoCierreStr ? `Próximo Cierre: ${format(parseSafeDate(proximoCierreStr), 'dd MMM yyyy', { locale: es })}` : 'Configurar Cierre'} <Edit2 size={10} />
              </span>
            </div>
          </div>
        </div>

        {/* Action card rápido */}
        <div className="flex items-center gap-2 p-1 bg-surface-900/50 rounded-2xl border border-white/5 shadow-inner">
           <Button
             variant="primary"
             className="h-10 text-xs px-4"
             onClick={() => { setEditingCompra(null); setIsConsumoModalOpen(true) }}
           >
             <Plus size={14} /> Nuevo Consumo
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado izquierdo: Listado de movimientos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden bg-surface-900/40 backdrop-blur-xl border-white/10 shadow-2xl">
            <div className="px-8 py-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Consumos Realizados</h3>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{activeCompras.length} Movimientos en este mes</p>
              </div>
              <div className="flex items-center gap-2 bg-surface-950/50 p-1 rounded-2xl border border-white/5">
                 <button onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-brand-400 transition-colors">
                   <ArrowLeft size={16} />
                 </button>
                 <div className="flex flex-col items-center min-w-[120px]">
                   <span className="text-[9px] font-black text-brand-500/70 uppercase tracking-widest">Consultar Mes</span>
                   <span className="text-sm font-bold text-slate-200 capitalize">{format(selectedMonth, 'MMMM yyyy', { locale: es })}</span>
                 </div>
                 <button onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-brand-400 transition-colors">
                   <ArrowLeft size={16} className="rotate-180" />
                 </button>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <table className="w-full text-left min-w-[750px]">
                <thead>
                  <tr className="bg-white/[0.01]">
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Fecha</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Ítem y Comercio</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Estado Cuotas</th>
                    <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Monto Cuota</th>
                    <th className="px-8 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence mode="wait">
                    {activeCompras.map((compra) => {
                      const isSaldado = !compra.esRecurrente && compra.cuotasPagadas >= compra.cuotas
                      const currentCuota = compra.esRecurrente ? 1 : differenceInCalendarMonths(selectedMonth, getMesPrimeraCuota(compra, proximoCierreStr)) + 1
                      return (
                        <motion.tr
                          key={compra.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: isSaldado ? 0.6 : 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`group transition-all ${isSaldado ? 'bg-slate-900/20' : 'hover:bg-white/[0.03]'}`}
                        >
                          <td className="px-8 py-5">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${isSaldado ? 'text-slate-600 bg-slate-800/50' : 'text-slate-400 bg-white/5'}`}>
                              {format(new Date(compra.fechaCompra), 'dd MMM', { locale: es })}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-0.5">
                              <span className={`text-sm font-bold transition-colors uppercase tracking-tight ${isSaldado ? 'text-slate-500 line-through decoration-brand-500/50' : 'text-slate-200 group-hover:text-brand-400'}`}>
                                {compra.descripcion}
                              </span>
                              <div className="flex items-center gap-2">
                                 <ShoppingBag size={10} className="text-slate-600" />
                                 <span className="text-[11px] font-medium text-slate-500 truncate max-w-[150px]">{compra.comercio || 'SIN COMERCIO'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            {compra.esRecurrente ? (
                              <div className="flex items-center gap-2">
                                <RefreshCw size={14} className="text-brand-500" />
                                <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest bg-brand-500/10 px-2 py-1 rounded-md border border-brand-500/20">
                                  Suscripción
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                 <div className="flex-1 w-16 h-1 rounded-full bg-slate-800 overflow-hidden relative">
                                    <div 
                                      className={`h-full transition-all duration-700 ${isSaldado ? 'bg-brand-500' : 'bg-brand-400'}`} 
                                      style={{ width: `${(Math.min(currentCuota, compra.cuotas) / (compra.cuotas || 1)) * 100}%` }}
                                    />
                                 </div>
                                 <div className="flex items-center gap-1.5 min-w-[45px]">
                                    <span className={`text-[10px] font-black tracking-tighter px-2 py-0.5 rounded-md ${isSaldado ? 'bg-brand-500/10 text-brand-400' : 'bg-slate-800 text-slate-300'}`}>
                                       {Math.min(currentCuota, compra.cuotas)} / {compra.cuotas}
                                    </span>
                                    {isSaldado && <Check size={12} className="text-brand-500" />}
                                 </div>
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex flex-col items-end gap-0.5">
                              {/* Badge de moneda */}
                              {compra.moneda === 'USD' && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">USD</span>
                              )}
                              <span className={`text-sm font-bold font-mono ${isSaldado ? 'text-slate-600' : compra.moneda === 'USD' ? 'text-emerald-300' : 'text-slate-100'}`}>
                                {compra.moneda === 'USD' ? 'U$D' : '$'}{Number(compra.montoCuota).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              {compra.moneda === 'USD' && compra.tipoCambio && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  ≈ ${(Number(compra.montoCuota) * Number(compra.tipoCambio)).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Total: {compra.moneda === 'USD' ? 'U$D' : '$'}{Number(compra.monto).toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-center gap-1.5">
                               {/* Editar — siempre visible */}
                               <button
                                 onClick={() => handleEdit(compra)}
                                 className="p-2 rounded-lg bg-surface-800 text-slate-400 hover:text-white transition-all border border-white/5"
                                 title="Editar consumo"
                               >
                                 <Edit2 size={14} />
                               </button>

                               {/* Eliminar — siempre visible */}
                               <button
                                 onClick={() => handleDelete(compra.id)}
                                 disabled={deleteMutation.isPending}
                                 className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                 title="Eliminar consumo"
                               >
                                 <Trash2 size={14} />
                               </button>

                               {/* Separador */}
                               <div className="w-px h-6 bg-white/10 mx-1" />

                               {/* Acciones de cuotas — aparecen en hover, ocultas si es recurrente */}
                               {!compra.esRecurrente && (
                                 <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                   {!isSaldado ? (
                                     <>
                                       <button
                                         onClick={() => handleUpdateCuotas(compra.id, 'ADELANTAR')}
                                         disabled={updateMutation.isPending}
                                         className="p-2 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500 hover:text-white transition-all border border-brand-500/20"
                                         title="Adelantar 1 cuota"
                                       >
                                         <FastForward size={14} />
                                       </button>
                                       <button
                                         onClick={() => handleUpdateCuotas(compra.id, 'SALDAR')}
                                         disabled={updateMutation.isPending}
                                         className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all border border-green-500/20"
                                         title="Saldar total del producto"
                                       >
                                         <CheckCircle size={14} />
                                       </button>
                                     </>
                                   ) : (
                                     <button
                                       onClick={() => handleUpdateCuotas(compra.id, 'RESETEAR')}
                                       disabled={updateMutation.isPending}
                                       className="p-2 rounded-lg bg-slate-800 text-slate-500 hover:text-slate-200 transition-all border border-white/5"
                                       title="Resetear cuotas (0)"
                                     >
                                       <RotateCcw size={14} />
                                     </button>
                                   )}
                                 </div>
                               )}
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                  {activeCompras.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-600 italic text-sm">
                        <div className="flex flex-col items-center gap-3">
                           <Calendar size={32} className="opacity-20" />
                           <span>No hay movimientos activos para {format(selectedMonth, 'MMMM', { locale: es })}.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Stats y Gráficos */}
        <div className="space-y-8">
          {/* Card de Proyección Mensual */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-8 bg-gradient-to-br from-brand-600/20 via-surface-900 to-surface-950 border-brand-500/30 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-3xl -mr-10 -mt-10" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center text-brand-400 shadow-inner">
                  <Calendar size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-brand-500/70 uppercase tracking-[0.2em]">
                    {hasManualData ? 'Cierre Real' : 'Estimado Cierre'}
                  </h4>
                  <p className="text-sm font-bold text-slate-200 capitalize">{format(selectedMonth, 'MMMM yyyy', { locale: es })}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditCierreOpen(true)}
                className="p-2 rounded-xl text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 border border-white/5 hover:border-brand-500/20 transition-all"
                title="Ingresar cierre real"
              >
                <Edit2 size={14} />
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-4xl font-black text-white tracking-tighter tabular-nums">
                  ${(hasManualData && tarjeta.cierreManualActual !== null
                    ? Number(tarjeta.cierreManualActual)
                    : nextPayment
                  ).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                {hasManualData && tarjeta.cierreManualActual !== null && (
                  <span className="mt-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    REAL
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: hasManualData ? '#86efac' : undefined }}>
                 <span className={`w-2 h-2 rounded-full ${hasManualData ? 'bg-green-400' : 'bg-brand-500 animate-pulse'}`} />
                 {hasManualData ? 'Monto informado por la tarjeta' : 'Total a pagar proyectado en este mes'}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-brand-500/10 space-y-2">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                 {hasManualData && tarjeta.cierreManualProximo !== null ? 'Cierre Próximo Mes' : 'Estimado Mes Siguiente'}{' '}({format(addMonths(selectedMonth, 1), 'MMM', { locale: es })})
               </h4>
               <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-slate-300 tabular-nums">
                    ${(hasManualData && tarjeta.cierreManualProximo !== null
                      ? Number(tarjeta.cierreManualProximo)
                      : futurePayment
                    ).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  {hasManualData && tarjeta.cierreManualProximo !== null && (
                    <span className="mb-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md bg-slate-700/50 text-slate-400 border border-white/10">
                      REAL
                    </span>
                  )}
               </div>
               <p className="text-[10px] text-slate-500 font-medium leading-tight">
                 {hasManualData && tarjeta.cierreManualProximo !== null
                   ? 'Monto informado por la tarjeta.'
                   : 'Cuotas y suscripciones del próximo mes.'}
               </p>
            </div>
          </motion.div>

          {/* Gráfico de Volumen de Consumo */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6 bg-surface-900 shadow-xl border-white/5"
          >
            <div className="flex items-center justify-between mb-6">
               <div className="space-y-1">
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Volumen de Nuevos Consumos</h4>
                 <p className="text-[10px] text-brand-500/70 font-bold uppercase tracking-widest">Últimos 6 meses</p>
               </div>
            </div>

            {chartData.some(d => d.value > 0) ? (
              <div className="h-[240px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                       dy={10}
                    />
                    <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                       tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', padding: '12px' }}
                      itemStyle={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 'bold' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Comprado']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fullDate.getMonth() === new Date().getMonth() ? '#10b981' : '#1e293b'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-600 italic border-2 border-dashed border-white/5 rounded-2xl">
                 Sin consumos nuevos en los últimos meses
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
               <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Promedio Mensual</span>
                  <p className="text-xs font-bold text-slate-300">
                    ${(chartData.reduce((acc, curr) => acc + curr.value, 0) / 6).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </p>
               </div>
               <div className="space-y-1 text-right">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Total 6 meses</span>
                  <p className="text-xs font-bold text-brand-400">
                    ${chartData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                  </p>
               </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de consumo (crear / editar) */}
      {tarjeta && (
        <AddConsumoModal
          isOpen={isConsumoModalOpen}
          onClose={() => {
            setIsConsumoModalOpen(false)
            setEditingCompra(null)
          }}
          onSuccess={() => utils.tarjetas.getById.invalidate({ id: id || '' })}
          tarjetaId={id || ''}
          tarjetaNombre={tarjeta.nombreTarjeta}
          initialData={editingCompra}
        />
      )}

      {/* Modal de cierre manual */}
      {tarjeta && (
        <EditCierreManualModal
          isOpen={isEditCierreOpen}
          onClose={() => setIsEditCierreOpen(false)}
          tarjetaId={tarjeta.id}
          mesActual={selectedMonth}
          cierreManualActual={tarjeta.cierreManualActual !== undefined && tarjeta.cierreManualActual !== null ? Number(tarjeta.cierreManualActual) : null}
          cierreManualProximo={tarjeta.cierreManualProximo !== undefined && tarjeta.cierreManualProximo !== null ? Number(tarjeta.cierreManualProximo) : null}
          cierreManualMes={cierreManualMesDate}
        />
      )}
    </div>
  )
}
