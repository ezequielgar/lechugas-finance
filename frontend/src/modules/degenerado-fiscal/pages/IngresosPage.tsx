import { useState } from 'react'
import { trpc } from '../../../lib/trpc'
import { Plus, DollarSign, Wallet, Calendar, Edit2, Trash2, Eye, EyeOff, RefreshCw, ShoppingBag } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AddIngresoModal } from '../components/AddIngresoModal'

export function IngresosPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingIngreso, setEditingIngreso] = useState<any>(null)
  
  const utils = trpc.useUtils()
  // Cast para evitar el error de lint hasta que Prisma regenere tipos en el IDE
  const { data: rawIngresos, isLoading } = trpc.ingresos.getMany.useQuery()
  const ingresos = rawIngresos as (any[] | undefined)
  
  const toggleMutation = trpc.ingresos.toggleActivo.useMutation({
    onSuccess: () => utils.ingresos.getMany.invalidate()
  })

  const deleteMutation = trpc.ingresos.delete.useMutation({
    onSuccess: () => utils.ingresos.getMany.invalidate(),
    onMutate: () => {
      if (!window.confirm('¿Estás seguro de eliminar este ingreso?')) {
        return false
      }
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white/5 rounded-3xl border border-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl border border-white/5" />)}
        </div>
        <div className="h-96 bg-white/5 rounded-3xl border border-white/5" />
      </div>
    )
  }

  // Cálculos de Resumen
  const totalCobrado = ingresos?.filter(i => i.activo).reduce((acc, i) => acc + Number(i.monto), 0) || 0
  const totalPendiente = ingresos?.filter(i => !i.activo).reduce((acc, i) => acc + Number(i.monto), 0) || 0
  const totalPotencial = totalCobrado + totalPendiente

  const handleEdit = (ingreso: any) => {
    setEditingIngreso(ingreso)
    setIsAddModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este ingreso?')) {
      deleteMutation.mutate({ id })
    }
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
            <h2 className="text-2xl font-bold tracking-tight text-white">Gestión de Ingresos</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Control de sueldos y cobros pendientes</p>
          </div>
        </div>
        <Button 
          variant="primary" 
          onClick={() => {
            setEditingIngreso(null)
            setIsAddModalOpen(true)
          }}
        >
          <Plus size={18} />
          Nuevo Ingreso
        </Button>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-br from-green-500/10 via-surface-900 to-surface-950 border-green-500/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
              <Wallet size={20} />
            </div>
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Total Cobrado</span>
          </div>
          <p className="text-3xl font-black text-white tabular-nums">${totalCobrado.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Dinero disponible hoy</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-6 bg-gradient-to-br from-brand-500/10 via-surface-900 to-surface-950 border-brand-500/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Pendiente / Cobrar</span>
          </div>
          <p className="text-3xl font-black text-white tabular-nums">${totalPendiente.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Promesas de pago este mes</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card p-6 bg-surface-900 shadow-2xl border-white/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
              <Plus size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Potencial Total</span>
          </div>
          <p className="text-3xl font-black text-slate-300 tabular-nums">${totalPotencial.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Suma de todos los ingresos</p>
        </motion.div>
      </div>

      {/* Tabla de Ingresos */}
      <div className="card overflow-hidden bg-surface-900/40 backdrop-blur-xl border-white/10 shadow-2xl">
        <div className="px-8 py-6 border-b border-white/10 bg-white/[0.01]">
          <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Listado de Ingresos</h3>
        </div>

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
                        className={`p-2 rounded-xl border transition-all ${
                          ingreso.activo 
                          ? 'bg-brand-500/10 border-brand-500/20 text-brand-400 hover:bg-brand-500/20' 
                          : 'bg-slate-800 border-white/5 text-slate-600 hover:text-slate-400'
                        }`}
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
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-800/50 px-2 py-1 rounded-lg border border-white/5 uppercase">
                        {ingreso.tipo}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[11px] font-medium text-slate-400">
                        {format(new Date(ingreso.fecha), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className={`text-sm font-bold font-mono ${ingreso.activo ? 'text-green-400' : 'text-slate-600'}`}>
                        ${Number(ingreso.monto).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(ingreso)}
                          className="p-2 rounded-lg bg-surface-800 text-slate-400 hover:text-white transition-all border border-white/5"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(ingreso.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        >
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
                      <p>Todavía no has registrado ingresos este mes.</p>
                      <Button variant="ghost" onClick={() => setIsAddModalOpen(true)}>Cargar el primero</Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddIngresoModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingIngreso(null)
        }}
        onSuccess={() => utils.ingresos.getMany.invalidate()}
        initialData={editingIngreso}
      />
    </div>
  )
}
