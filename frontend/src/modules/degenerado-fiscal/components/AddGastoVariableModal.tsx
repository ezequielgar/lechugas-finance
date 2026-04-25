import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { DollarSign, Calendar, FileText, Tag } from 'lucide-react'
import { useEffect } from 'react'

const CATEGORIAS = ['COMIDA', 'TRANSPORTE', 'ENTRETENIMIENTO', 'SALUD', 'ROPA', 'HOGAR', 'TECNOLOGIA', 'EDUCACION', 'OTRO'] as const

const CATEGORIA_LABELS: Record<string, string> = {
  COMIDA: '🍔 Comida',
  TRANSPORTE: '🚗 Transporte',
  ENTRETENIMIENTO: '🎬 Entretenimiento',
  SALUD: '💊 Salud',
  ROPA: '👕 Ropa',
  HOGAR: '🏠 Hogar',
  TECNOLOGIA: '💻 Tecnología',
  EDUCACION: '📚 Educación',
  OTRO: '📦 Otro',
}

const schema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  categoria: z.enum(CATEGORIAS),
  monto: z.number().positive('El monto debe ser positivo'),
  fecha: z.string(),
  notas: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddGastoVariableModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: any
}

export function AddGastoVariableModal({ isOpen, onClose, onSuccess, initialData }: AddGastoVariableModalProps) {
  const isEditing = !!initialData

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoria: 'OTRO',
      fecha: new Date().toISOString().split('T')[0],
    }
  })

  useEffect(() => {
    if (initialData && isOpen) {
      reset({
        descripcion: initialData.descripcion,
        categoria: initialData.categoria,
        monto: Number(initialData.monto),
        fecha: new Date(initialData.fecha).toISOString().split('T')[0],
        notas: initialData.notas || '',
      })
    } else if (!initialData && isOpen) {
      reset({
        descripcion: '',
        categoria: 'OTRO',
        fecha: new Date().toISOString().split('T')[0],
        notas: '',
      })
    }
  }, [initialData, isOpen, reset])

  const createMutation = trpc.gastosVariables.create.useMutation({
    onSuccess: () => { onSuccess(); onClose(); reset() },
    onError: (err) => alert('Error: ' + err.message),
  })

  const updateMutation = trpc.gastosVariables.update.useMutation({
    onSuccess: () => { onSuccess(); onClose(); reset() },
    onError: (err) => alert('Error: ' + err.message),
  })

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate({ ...data, id: initialData.id })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Gasto' : 'Nuevo Gasto Variable'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Descripción"
          placeholder="Ej: Asado con amigos, Remis, Farmacia..."
          icon={<FileText size={18} />}
          error={errors.descripcion?.message}
          {...register('descripcion')}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Categoría</label>
            <select
              {...register('categoria')}
              className="w-full bg-surface-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 transition-all font-medium"
            >
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{CATEGORIA_LABELS[cat]}</option>
              ))}
            </select>
            {errors.categoria && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.categoria.message}</p>}
          </div>

          {/* Monto */}
          <Input
            label="Monto"
            type="number"
            step="0.01"
            icon={<DollarSign size={18} />}
            error={errors.monto?.message}
            {...register('monto', { valueAsNumber: true })}
          />
        </div>

        <Input
          label="Fecha"
          type="date"
          icon={<Calendar size={18} />}
          error={errors.fecha?.message}
          {...register('fecha')}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Notas (opcional)</label>
          <textarea
            {...register('notas')}
            placeholder="Algún detalle extra..."
            rows={2}
            className="w-full bg-surface-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 transition-all resize-none placeholder-slate-600"
          />
        </div>

        <div className="pt-2 flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 font-bold !bg-red-500/20 !text-red-400 !border-red-500/30 hover:!bg-red-500 hover:!text-white"
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Guardar Cambios' : 'Registrar Gasto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
