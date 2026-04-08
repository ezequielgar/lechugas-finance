import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { FolderOpen, DollarSign, Calendar, FileText, Tag } from 'lucide-react'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  presupuesto: z.number().positive('El presupuesto debe ser positivo').optional().or(z.literal(0).transform(() => undefined)),
  estado: z.enum(['PLANIFICANDO', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'CANCELADO']),
  fechaInicio: z.string().optional(),
  fechaObjetivo: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddProyectoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const ESTADOS = [
  { value: 'PLANIFICANDO',  label: 'Planificando' },
  { value: 'EN_PROGRESO',   label: 'En Progreso' },
  { value: 'PAUSADO',       label: 'Pausado' },
  { value: 'COMPLETADO',    label: 'Completado' },
  { value: 'CANCELADO',     label: 'Cancelado' },
]

export function AddProyectoModal({ isOpen, onClose, onSuccess }: AddProyectoModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      estado: 'PLANIFICANDO',
      fechaInicio: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    if (!isOpen) reset({ estado: 'PLANIFICANDO', fechaInicio: new Date().toISOString().split('T')[0] })
  }, [isOpen])

  const mutation = trpc.proyectos.create.useMutation({
    onSuccess: () => { onSuccess(); onClose(); reset() },
    onError: (err) => alert(`Error: ${err.message}`),
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      ...data,
      presupuesto: data.presupuesto || undefined,
      fechaInicio: data.fechaInicio || undefined,
      fechaObjetivo: data.fechaObjetivo || undefined,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Proyecto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre del Proyecto"
          placeholder="Ej: Renovar el baño, Comprar PC, Viaje a Bariloche..."
          icon={<FolderOpen size={18} />}
          error={errors.nombre?.message}
          {...register('nombre')}
          autoFocus
        />

        <Input
          label="Descripción (Opcional)"
          placeholder="Detalles del proyecto..."
          icon={<FileText size={18} />}
          {...register('descripcion')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Presupuesto (Opcional)"
            type="number"
            step="0.01"
            placeholder="0.00"
            icon={<DollarSign size={18} />}
            error={errors.presupuesto?.message as string | undefined}
            {...register('presupuesto', { valueAsNumber: true })}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Estado</label>
            <div className="relative">
              <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                {...register('estado')}
                className="w-full pl-9 pr-3 py-2.5 bg-surface-900 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 appearance-none"
              >
                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha Inicio"
            type="date"
            icon={<Calendar size={18} />}
            {...register('fechaInicio')}
          />
          <Input
            label="Fecha Objetivo"
            type="date"
            icon={<Calendar size={18} className="text-yellow-400" />}
            {...register('fechaObjetivo')}
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" className="flex-1 font-bold" isLoading={mutation.isPending}>
            Crear Proyecto
          </Button>
        </div>
      </form>
    </Modal>
  )
}
