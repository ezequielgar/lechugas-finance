import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { DollarSign, Calendar, FileText, Tag } from 'lucide-react'

const CATEGORIAS = ['Vuelo', 'Hotel / Alojamiento', 'Transporte', 'Comida', 'Actividades', 'Compras', 'Seguro de viaje', 'Otro']

const schema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser positivo'),
  moneda: z.string(),
  fecha: z.string(),
  categoria: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddGastoVacacionModalProps {
  isOpen: boolean
  onClose: () => void
  vacacion: { id: string; destino: string } | null
}

export function AddGastoVacacionModal({ isOpen, onClose, vacacion }: AddGastoVacacionModalProps) {
  const utils = trpc.useUtils()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { moneda: 'ARS', fecha: new Date().toISOString().split('T')[0] },
  })

  const mutation = trpc.vacaciones.addGasto.useMutation({
    onSuccess: () => { utils.vacaciones.getMany.invalidate(); onClose(); reset() },
  })

  const onSubmit = (data: FormData) => {
    if (!vacacion) return
    mutation.mutate({ ...data, vacacionId: vacacion.id, categoria: data.categoria || undefined })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cargar Gasto — ${vacacion?.destino ?? ''}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Descripción"
          placeholder="Ej: Vuelos ida y vuelta, Hotel 3 noches..."
          icon={<FileText size={16} />}
          error={errors.descripcion?.message}
          {...register('descripcion')}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Monto"
            type="number"
            step="0.01"
            placeholder="0.00"
            icon={<DollarSign size={16} />}
            error={errors.monto?.message}
            {...register('monto', { valueAsNumber: true })}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Moneda</label>
            <select
              {...register('moneda')}
              className="w-full px-3 py-2.5 bg-surface-900 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 appearance-none"
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Categoría</label>
            <div className="relative">
              <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                {...register('categoria')}
                className="w-full pl-9 pr-3 py-2.5 bg-surface-900 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 appearance-none"
              >
                <option value="">Sin categoría</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Input
            label="Fecha"
            type="date"
            icon={<Calendar size={16} />}
            {...register('fecha')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={mutation.isPending}>Registrar Gasto</Button>
        </div>
      </form>
    </Modal>
  )
}
