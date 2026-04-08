import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { ArrowDownLeft, ArrowUpRight, TrendingUp, RefreshCw, Calendar, FileText, DollarSign } from 'lucide-react'

const schema = z.object({
  tipo: z.enum(['DEPOSITO', 'RETIRO', 'RENDIMIENTO', 'ACTUALIZACION']),
  monto: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().min(1),
  fecha: z.string().min(1, 'La fecha es requerida'),
  descripcion: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddMovimientoModalProps {
  isOpen: boolean
  onClose: () => void
  inversionId: string
  inversionNombre: string
  moneda: string
  onSuccess: () => void
}

const TIPOS_MOV = [
  { value: 'DEPOSITO',      label: 'Depósito / Aporte',      icon: ArrowDownLeft,  color: 'text-green-400' },
  { value: 'RETIRO',        label: 'Retiro / Extracción',     icon: ArrowUpRight,   color: 'text-red-400' },
  { value: 'RENDIMIENTO',   label: 'Rendimiento / Ganancia',  icon: TrendingUp,     color: 'text-brand-400' },
  { value: 'ACTUALIZACION', label: 'Actualización de Valor',  icon: RefreshCw,      color: 'text-yellow-400' },
]

export function AddMovimientoModal({ isOpen, onClose, inversionId, inversionNombre, moneda, onSuccess }: AddMovimientoModalProps) {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'RENDIMIENTO',
      moneda,
      fecha: new Date().toISOString().split('T')[0],
      monto: 0,
    },
  })

  const tipoSeleccionado = watch('tipo')

  const mutation = trpc.inversiones.addMovimiento.useMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
      reset({ tipo: 'RENDIMIENTO', moneda, fecha: new Date().toISOString().split('T')[0], monto: 0 })
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({ ...data, inversionId })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Movimiento — ${inversionNombre}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Tipo selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tipo de Movimiento</label>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_MOV.map(({ value, label, icon: Icon, color }) => (
              <label
                key={value}
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  tipoSeleccionado === value
                    ? 'bg-white/5 border-brand-500/40 ring-1 ring-brand-500/20'
                    : 'bg-surface-950 border-white/5 hover:border-white/10'
                }`}
              >
                <input type="radio" value={value} {...register('tipo')} className="sr-only" />
                <Icon size={16} className={tipoSeleccionado === value ? color : 'text-slate-600'} />
                <span className={`text-xs font-bold ${tipoSeleccionado === value ? 'text-slate-200' : 'text-slate-500'}`}>
                  {label}
                </span>
              </label>
            ))}
          </div>
          {tipoSeleccionado === 'ACTUALIZACION' && (
            <p className="text-[10px] text-yellow-500/70 ml-1 font-medium">
              Registra el nuevo valor total actual de la inversión.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={tipoSeleccionado === 'ACTUALIZACION' ? 'Valor Total Actual' : 'Monto'}
            type="number"
            step="0.01"
            icon={<DollarSign size={18} />}
            error={errors.monto?.message}
            {...register('monto', { valueAsNumber: true })}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Moneda</label>
            <select
              {...register('moneda')}
              className="w-full bg-surface-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all font-medium"
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="BTC">BTC</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
        </div>

        <Input
          label="Fecha"
          type="date"
          icon={<Calendar size={18} />}
          error={errors.fecha?.message}
          {...register('fecha')}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
            <FileText size={13} /> Descripción (Opcional)
          </label>
          <input
            {...register('descripcion')}
            placeholder="Ej: Capitalización cuota 3, Venta parcial BTC..."
            className="w-full bg-surface-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all"
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 font-bold"
            isLoading={mutation.isPending}
          >
            Registrar Movimiento
          </Button>
        </div>
      </form>
    </Modal>
  )
}
