import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'

interface Props {
  isOpen: boolean
  onClose: () => void
  tarjetaId: string
  cierreAnterior: string | null
  cierreActual: string | null
  proximoCierre: string | null
  onSuccess: () => void
}

export function EditFechasCierreModal({ isOpen, onClose, tarjetaId, cierreAnterior, cierreActual, proximoCierre, onSuccess }: Props) {
  const [anterior, setAnterior] = useState(cierreAnterior ? cierreAnterior.split('T')[0] : '')
  const [actual, setActual] = useState(cierreActual ? cierreActual.split('T')[0] : '')
  const [proximo, setProximo] = useState(proximoCierre ? proximoCierre.split('T')[0] : '')

  useEffect(() => {
    if (isOpen) {
      setAnterior(cierreAnterior ? cierreAnterior.split('T')[0] : '')
      setActual(cierreActual ? cierreActual.split('T')[0] : '')
      setProximo(proximoCierre ? proximoCierre.split('T')[0] : '')
    }
  }, [isOpen, cierreAnterior, cierreActual, proximoCierre])

  const mutation = trpc.tarjetas.update.useMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      id: tarjetaId,
      cierreAnterior: anterior || undefined,
      cierreActual: actual || undefined,
      proximoCierre: proximo || undefined,
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={onClose}
          >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="w-full sm:max-w-md bg-surface-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] flex-shrink-0 rounded-t-3xl sm:rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/30 flex items-center justify-center text-brand-300">  
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Fechas de Cierre</h3>
                  <p className="text-xs text-slate-400 font-medium">Actualizá los cierres de tu tarjeta</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 pb-safe">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                    Cierre Anterior
                  </label>
                  <input
                    type="date"
                    value={anterior}
                    onChange={(e) => setAnterior(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                    Cierre Actual
                    <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-[10px]">Mes en curso</span>
                  </label>
                  <input
                    type="date"
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                    className="w-full bg-brand-950/20 border border-brand-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                    Próximo Cierre
                  </label>
                  <input
                    type="date"
                    value={proximo}
                    onChange={(e) => setProximo(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={onClose} type="button">
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Fechas'}
                </Button>
              </div>
            </form>
          </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
