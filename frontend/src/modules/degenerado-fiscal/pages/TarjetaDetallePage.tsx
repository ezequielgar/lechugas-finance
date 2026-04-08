import { useParams, useNavigate } from 'react-router-dom'
import { trpc } from '../../../lib/trpc'
import { ArrowLeft, Landmark, CreditCard, Calendar, ShoppingBag, Trash2, FastForward, CheckCircle, RotateCcw, Check } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#6366f1', '#14b8a6']

export function TarjetaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const utils = trpc.useUtils()

  const { data: tarjeta, isLoading } = trpc.tarjetas.getById.useQuery(
    { id: id || '' },
    { enabled: !!id }
  )

  const updateMutation = trpc.tarjetas.updateCuotasPagadas.useMutation({
    onSuccess: () => {
      utils.tarjetas.getById.invalidate({ id: id || '' })
    }
  })

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

  // Orden cronológico (más reciente primero)
  const sortedCompras = [...tarjeta.compras].sort(
    (a, b) => new Date(b.fechaCompra).getTime() - new Date(a.fechaCompra).getTime()
  )

  // Próximo vencimiento: SOLO sumamos si NO está saldado (cuotasPagadas < cuotas)
  const nextPayment = tarjeta.compras.reduce((acc, compra) => {
    if (compra.cuotasPagadas < compra.cuotas) {
      return acc + Number(compra.montoCuota)
    }
    return acc
  }, 0)

  // Gráfico de Categorías (solo si hay datos)
  const categoryMap = tarjeta.compras.reduce((acc, comp) => {
    const cat = comp.categoria || 'Otros'
    acc[cat] = (acc[cat] || 0) + Number(comp.monto)
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }))

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
            </div>
          </div>
        </div>

        {/* Action card rápido */}
        <div className="flex items-center gap-2 p-1 bg-surface-900/50 rounded-2xl border border-white/5 shadow-inner">
           <Button variant="ghost" className="h-10 text-xs px-4 text-slate-400">Ver Resumen</Button>
           <Button variant="outline" className="h-10 text-xs px-4 bg-brand-500/5 border-brand-500/10 text-brand-400 hover:bg-brand-500/10">Exportar PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado izquierdo: Listado de movimientos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden bg-surface-900/40 backdrop-blur-xl border-white/10 shadow-2xl">
            <div className="px-8 py-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Consumos Realizados</h3>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Orden Cronológico • {tarjeta.compras.length} Movimientos</p>
              </div>
              <div className="hidden sm:block">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-surface-950 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-lg">
                        {i}
                      </div>
                    ))}
                 </div>
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
                  <AnimatePresence>
                    {sortedCompras.map((compra) => {
                      const isSaldado = compra.cuotasPagadas === compra.cuotas
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
                            <div className="flex items-center gap-3">
                               <div className="flex-1 w-16 h-1 rounded-full bg-slate-800 overflow-hidden relative">
                                  <div 
                                    className={`h-full transition-all duration-700 ${isSaldado ? 'bg-brand-500' : 'bg-brand-400'}`} 
                                    style={{ width: `${(compra.cuotasPagadas / (compra.cuotas || 1)) * 100}%` }}
                                  />
                               </div>
                               <div className="flex items-center gap-1.5 min-w-[45px]">
                                  <span className={`text-[10px] font-black tracking-tighter px-2 py-0.5 rounded-md ${isSaldado ? 'bg-brand-500/10 text-brand-400' : 'bg-slate-800 text-slate-300'}`}>
                                     {compra.cuotasPagadas} / {compra.cuotas}
                                  </span>
                                  {isSaldado && <Check size={12} className="text-brand-500" />}
                               </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`text-sm font-bold font-mono ${isSaldado ? 'text-slate-600' : 'text-slate-100'}`}>
                                ${Number(compra.montoCuota).toLocaleString()}
                              </span>
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Total: ${Number(compra.monto).toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                  {tarjeta.compras.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-600 italic text-sm">
                        <div className="flex flex-col items-center gap-3">
                           <Calendar size={32} className="opacity-20" />
                           <span>No hay movimientos registrados para esta tarjeta.</span>
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
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center text-brand-400 shadow-inner">
                <Calendar size={24} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-brand-500/70 uppercase tracking-[0.2em]">Estimado Cierre</h4>
                <p className="text-sm font-bold text-slate-200">Próximo Pago</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-4xl font-black text-white tracking-tighter tabular-nums">${nextPayment.toLocaleString()}</span>
              <div className="flex items-center gap-1.5 text-xs text-brand-500/80 font-bold">
                 <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                 Solo cuotas pendientes de este mes
              </div>
            </div>
          </motion.div>

          {/* Gráfico de Categorías */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6 bg-surface-900 shadow-xl border-white/5"
          >
            <div className="flex items-center justify-between mb-6">
               <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Gastos por Categoría</h4>
            </div>

            {chartData.length > 0 ? (
              <div className="h-[240px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="40%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-600 italic border-2 border-dashed border-white/5 rounded-2xl">
                 Carga consumos para generar datos
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Cat. Principal</span>
                  <p className="text-xs font-bold text-slate-300 truncate">
                    {chartData.sort((a,b) => b.value - a.value)[0]?.name || 'S/D'}
                  </p>
               </div>
               <div className="space-y-1 text-right">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Items Totales</span>
                  <p className="text-xs font-bold text-brand-400">{tarjeta.compras.length}</p>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
