import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { Plane, DollarSign, Calendar, FileText } from 'lucide-react'

const schema = z.object({
  destino: z.string().min(1, 'El destino es requerido'),
  descripcion: z.string().optional(),
  presupuesto: z.number().positive('El presupuesto debe ser positivo').optional().or(z.literal(0).transform(() => undefined)),
  moneda: z.string(),
  fechaSalida: z.string().optional(),
  fechaRegreso: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddVacacionModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: any | null
}

export function AddVacacionModal({ isOpen, onClose, initialData }: AddVacacionModalProps) {
  const utils = trpc.useUtils()
  const isEdit = !!initialData

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { moneda: 'ARS' },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          destino: initialData.destino ?? '',
          descripcion: initialData.descripcion ?? '',
          presupuesto: initialData.presupuesto ? Number(initialData.presupuesto) : undefined,
          moneda: initialData.moneda ?? 'ARS',
          fechaSalida: initialData.fechaSalida
            ? new Date(initialData.fechaSalida).toISOString().split('T')[0]
            : '',
          fechaRegreso: initialData.fechaRegreso
            ? new Date(initialData.fechaRegreso).toISOString().split('T')[0]
            : '',
        })
      } else {
        reset({ moneda: 'ARS' })
      }
    }
  }, [isOpen, initialData])

  const invalidate = () => utils.vacaciones.getMany.invalidate()
  const createMutation = trpc.vacaciones.create.useMutation({ onSuccess: () => { invalidate(); onClose() } })
  const updateMutation = trpc.vacaciones.update.useMutation({ onSuccess: () => { invalidate(); onClose() } })

  const onSubmit = (data: FormData) => {
    const payload = {
      destino: data.destino,
      descripcion: data.descripcion || undefined,
      presupuesto: data.presupuesto || undefined,
      moneda: data.moneda,
      fechaSalida: data.fechaSalida || undefined,
      fechaRegreso: data.fechaRegreso || undefined,
    }
    if (isEdit) {
      updateMutation.mutate({ id: initialData.id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar Vacación' : 'Nueva Vacación'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Destino"
          placeholder="Ej: Bariloche, Miami, Playa del Carmen..."
          icon={<Plane size={16} />}
          error={errors.destino?.message}
          {...register('destino')}
          autoFocus
        />

        <Input
          label="Descripción (Opcional)"
          placeholder="Detalles del viaje, itinerario..."
          icon={<FileText size={16} />}
          {...register('descripcion')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Presupuesto (Opcional)"
            type="number"
            step="0.01"
            placeholder="0.00"
            icon={<DollarSign size={16} />}
            error={errors.presupuesto?.message as string | undefined}
            {...register('presupuesto', { valueAsNumber: true })}
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
          <Input
            label="Fecha de Salida"
            type="date"
            icon={<Calendar size={16} />}
            {...register('fechaSalida')}
          />
          <Input
            label="Fecha de Regreso"
            type="date"
            icon={<Calendar size={16} className="text-brand-400" />}
            {...register('fechaRegreso')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={isPending}>
            {isEdit ? 'Guardar Cambios' : 'Crear Vacación'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
