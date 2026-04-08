import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { DollarSign, Calendar, FileText, Tag } from 'lucide-react'

const schema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser positivo'),
  fecha: z.string(),
  categoria: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddGastoProyectoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  proyecto: { id: string; nombre: string } | null
}

const CATEGORIAS = ['Material', 'Mano de obra', 'Herramientas', 'Transporte', 'Tecnología', 'Servicios', 'Otro']

export function AddGastoProyectoModal({ isOpen, onClose, onSuccess, proyecto }: AddGastoProyectoModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
    },
  })

  const mutation = trpc.proyectos.addGasto.useMutation({
    onSuccess: () => { onSuccess(); onClose(); reset() },
    onError: (err) => alert(`Error: ${err.message}`),
  })

  const onSubmit = (data: FormData) => {
    if (!proyecto) return
    mutation.mutate({ ...data, proyectoId: proyecto.id })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cargar Gasto: ${proyecto?.nombre ?? ''}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Descripción"
          placeholder="Ej: Compra de cerámicos, Electricista..."
          icon={<FileText size={18} />}
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
            icon={<DollarSign size={18} />}
            error={errors.monto?.message}
            {...register('monto', { valueAsNumber: true })}
          />
          <Input
            label="Fecha"
            type="date"
            icon={<Calendar size={18} />}
            {...register('fecha')}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Categoría (Opcional)</label>
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

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" className="flex-1 font-bold" isLoading={mutation.isPending}>
            Cargar Gasto
          </Button>
        </div>
      </form>
    </Modal>
  )
}
