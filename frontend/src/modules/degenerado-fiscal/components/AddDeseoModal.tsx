import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { Heart, DollarSign, Link, Calendar, Tag } from 'lucide-react'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  precio: z.number().positive('El precio debe ser positivo').optional().or(z.literal(0).transform(() => undefined)),
  moneda: z.string(),
  urlProducto: z.string().optional(),
  prioridad: z.number().int().min(1).max(3),
  fechaObjetivo: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddDeseoModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: any | null
}

const PRIORIDADES = [
  { value: 1, label: '🔴 Alta' },
  { value: 2, label: '🟡 Media' },
  { value: 3, label: '⚪ Baja' },
]

export function AddDeseoModal({ isOpen, onClose, initialData }: AddDeseoModalProps) {
  const utils = trpc.useUtils()
  const isEdit = !!initialData

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { moneda: 'ARS', prioridad: 3 },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          nombre: initialData.nombre ?? '',
          descripcion: initialData.descripcion ?? '',
          precio: initialData.precio ? Number(initialData.precio) : undefined,
          moneda: initialData.moneda ?? 'ARS',
          urlProducto: initialData.urlProducto ?? '',
          prioridad: initialData.prioridad ?? 3,
          fechaObjetivo: initialData.fechaObjetivo
            ? new Date(initialData.fechaObjetivo).toISOString().split('T')[0]
            : '',
        })
      } else {
        reset({ moneda: 'ARS', prioridad: 3 })
      }
    }
  }, [isOpen, initialData])

  const invalidate = () => utils.deseos.getMany.invalidate()

  const createMutation = trpc.deseos.create.useMutation({ onSuccess: () => { invalidate(); onClose() } })
  const updateMutation = trpc.deseos.update.useMutation({ onSuccess: () => { invalidate(); onClose() } })

  const onSubmit = (data: FormData) => {
    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      precio: data.precio || undefined,
      moneda: data.moneda,
      urlProducto: data.urlProducto || undefined,
      prioridad: data.prioridad,
      fechaObjetivo: data.fechaObjetivo || undefined,
    }
    if (isEdit) {
      updateMutation.mutate({ id: initialData.id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar Deseo' : 'Nuevo Deseo'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre del producto / deseo"
          placeholder="Ej: Zapatillas Nike, Viaje a Mendoza, PS5..."
          icon={<Heart size={16} />}
          error={errors.nombre?.message}
          {...register('nombre')}
          autoFocus
        />

        <Input
          label="Descripción (Opcional)"
          placeholder="Modelo, talle, color, detalles..."
          {...register('descripcion')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Precio estimado (Opcional)"
            type="number"
            step="0.01"
            placeholder="0.00"
            icon={<DollarSign size={16} />}
            error={errors.precio?.message as string | undefined}
            {...register('precio', { valueAsNumber: true })}
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

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Prioridad</label>
          <div className="relative">
            <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <select
              {...register('prioridad', { valueAsNumber: true })}
              className="w-full pl-9 pr-3 py-2.5 bg-surface-900 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 appearance-none"
            >
              {PRIORIDADES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="URL del producto (Opcional)"
          placeholder="https://..."
          icon={<Link size={16} />}
          {...register('urlProducto')}
        />

        <Input
          label="Fecha objetivo (Opcional)"
          type="date"
          icon={<Calendar size={16} />}
          {...register('fechaObjetivo')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={isPending}>
            {isEdit ? 'Guardar Cambios' : 'Agregar Deseo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
