import { useState } from 'react'
import { trpc } from '../../../lib/trpc'
import { 
  Plus, 
  Briefcase, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  AlertCircle,
  TrendingUp,
  Receipt,
  Clock,
  Pencil
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInDays, isPast, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { AddGastoFijoModal } from '../components/AddGastoFijoModal'
import { RegistrarFacturaModal } from '../components/RegistrarFacturaModal'
import { cn } from '../../../lib/utils'

export function GastosFijosPage() {
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false)
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<{ id: string; nombre: string } | null>(null)
  const [editingBill, setEditingBill] = useState<any | null>(null)
  
  const utils = trpc.useUtils()
  const { data: rawServices, isLoading } = trpc.gastosFijos.getMany.useQuery()
  const services = rawServices as (any[] | undefined)

  const togglePagoMutation = trpc.gastosFijos.togglePago.useMutation({
    onSuccess: () => utils.gastosFijos.getMany.invalidate()
  })

  const deleteServiceMutation = trpc.gastosFijos.deleteService.useMutation({
    onSuccess: () => utils.gastosFijos.getMany.invalidate()
  })

  const deleteRecordMutation = trpc.gastosFijos.deleteRecord.useMutation({
    onSuccess: () => utils.gastosFijos.getMany.invalidate()
  })

  // Cálculos de Resumen (Mes actual)
  // Usa fechaVencimiento si está disponible (lo que vence este mes), si no usa fecha de emisión
  const currentMonthRecords = services?.flatMap(s => s.registros).filter(r => {
    const dateToCheck = r.fechaVencimiento ? new Date(r.fechaVencimiento) : new Date(r.fecha)
    const now = new Date()
    return dateToCheck.getMonth() === now.getMonth() && dateToCheck.getFullYear() === now.getFullYear()
  }) || []

  const totalMensual = currentMonthRecords.reduce((acc, r) => acc + Number(r.monto), 0)
  const totalPagado = currentMonthRecords.filter(r => r.pagado).reduce((acc, r) => acc + Number(r.monto), 0)
  const totalPendiente = totalMensual - totalPagado

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-white/5 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-white/5 rounded-3xl" />)}
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
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Gastos Fijos y Servicios</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Control mensual de servicios y facturas</p>
          </div>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsAddServiceModalOpen(true)}
        >
          <Plus size={18} />
          Definir Nuevo Servicio
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-surface-900 border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Total del Mes</span>
          </div>
          <p className="text-3xl font-black text-white tabular-nums">${totalMensual.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Suma de facturas cargadas</p>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Total Pagado</span>
          </div>
          <p className="text-3xl font-black text-green-400 tabular-nums">${totalPagado.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Servicios liquidados</p>
        </div>

        <div className="card p-6 bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
              <AlertCircle size={20} />
            </div>
            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Pendiente</span>
          </div>
          <p className="text-3xl font-black text-yellow-400 tabular-nums">${totalPendiente.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Facturas por vencer/pagar</p>
        </div>
      </div>

      {/* Grid de Servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {services?.map((service) => {
            const lastBill = service.registros[0]
            const isOverdue = lastBill && !lastBill.pagado && lastBill.fechaVencimiento && isPast(new Date(lastBill.fechaVencimiento)) && !isToday(new Date(lastBill.fechaVencimiento))
            const daysToDue = lastBill?.fechaVencimiento ? differenceInDays(new Date(lastBill.fechaVencimiento), new Date()) : null

            return (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "card group relative overflow-hidden transition-all duration-300",
                  lastBill?.pagado ? "bg-surface-900/40 border-white/5 opacity-80" : "bg-surface-900 border-white/10 hover:border-brand-500/30"
                )}
              >
                {/* Indicador de categoría al fondo */}
                <div className="absolute -right-4 -top-4 opacity-[0.03] rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6">
                  <Briefcase size={120} />
                </div>

                <div className="p-6 relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-white/5 text-slate-400">
                      <Receipt size={20} />
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => {
                          setSelectedService(service)
                          setIsAddBillModalOpen(true)
                        }}
                        className="p-2 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500 hover:text-white transition-all border border-brand-500/20"
                        title="Cargar factura"
                      >
                        <Plus size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          if(window.confirm('¿Eliminar servicio?')) deleteServiceMutation.mutate({ id: service.id })
                        }}
                        className="p-2 rounded-lg bg-white/5 text-slate-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-0.5">{service.nombre}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{service.proveedor || service.categoria}</p>
                  </div>

                  {/* Estado de Factura Actual */}
                  <div className="mt-6 pt-4 border-t border-white/5">
                    {lastBill ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Factura Actual</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingBill(lastBill)
                                setSelectedService({ id: service.id, nombre: service.nombre })
                                setIsAddBillModalOpen(true)
                              }}
                              className="p-1 rounded-lg text-slate-600 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                              title="Editar factura"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('¿Eliminar esta factura?')) deleteRecordMutation.mutate({ id: lastBill.id })
                              }}
                              className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Eliminar factura"
                            >
                              <Trash2 size={12} />
                            </button>
                            <span className={cn(
                              "text-sm font-black tabular-nums",
                              lastBill.pagado ? "text-green-400 line-through" : "text-white"
                            )}>
                              ${Number(lastBill.monto).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Alerta de Vencimiento */}
                        {!lastBill.pagado && lastBill.fechaVencimiento && (
                          <div className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider",
                            isOverdue ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                          )}>
                            <Clock size={12} />
                            {isOverdue 
                              ? `Vencida hace ${Math.abs(daysToDue || 0)} días`
                              : `Vence en ${daysToDue} días (${format(new Date(lastBill.fechaVencimiento), 'dd MMM', { locale: es })})`
                            }
                          </div>
                        )}

                        <button 
                          onClick={() => togglePagoMutation.mutate({ id: lastBill.id })}
                          className={cn(
                            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            lastBill.pagado
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-surface-950 text-slate-300 border border-white/10 hover:border-brand-500/40"
                          )}
                        >
                          {lastBill.pagado ? (
                            <><CheckCircle2 size={14} /> Pagada el {format(new Date(), 'dd/MM')}</>
                          ) : (
                            <><Circle size={14} /> Marcar como Pagada</>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-xs text-slate-500 italic mb-3">Sin facturas este mes</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            setSelectedService(service)
                            setIsAddBillModalOpen(true)
                          }}
                        >
                          Cargar Factura
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Empty State */}
        {services?.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-600 gap-4">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center opacity-20">
               <Briefcase size={32} />
             </div>
             <p className="text-sm font-medium italic">Todavía no has definido servicios recurrentes.</p>
             <Button variant="ghost" onClick={() => setIsAddServiceModalOpen(true)}>Crear el primero</Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddGastoFijoModal 
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        onSuccess={() => utils.gastosFijos.getMany.invalidate()}
      />

      <RegistrarFacturaModal
        isOpen={isAddBillModalOpen}
        onClose={() => {
          setIsAddBillModalOpen(false)
          setSelectedService(null)
          setEditingBill(null)
        }}
        service={selectedService}
        onSuccess={() => utils.gastosFijos.getMany.invalidate()}
        initialData={editingBill}
      />
    </div>
  )
}
