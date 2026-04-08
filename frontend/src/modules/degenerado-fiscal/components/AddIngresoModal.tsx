import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { DollarSign, Tag, Calendar, FileText, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { motion } from 'framer-motion'

const schema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  tipo: z.enum(['SUELDO', 'FREELANCE', 'ALQUILER', 'INVERSION', 'REGALO', 'BONO', 'OTRO']),
  monto: z.number().positive('El monto debe ser positivo'),
  fecha: z.string(),
  recurrente: z.boolean(),
  frecuencia: z.string().optional(),
  notas: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddIngresoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: any // Para edición
}

export function AddIngresoModal({ isOpen, onClose, onSuccess, initialData }: AddIngresoModalProps) {
  const isEditing = !!initialData

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'SUELDO',
      monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      recurrente: false,
    }
  })

  // Cargar datos si estamos editando
  useEffect(() => {
    if (initialData) {
      reset({
        descripcion: initialData.descripcion,
        tipo: initialData.tipo,
        monto: Number(initialData.monto),
        fecha: new Date(initialData.fecha).toISOString().split('T')[0],
        recurrente: initialData.recurrente,
        frecuencia: initialData.frecuencia || '',
        notas: initialData.notas || '',
      })
    } else if (isOpen) {
      reset({
        descripcion: '',
        tipo: 'SUELDO',
        monto: 0,
        fecha: new Date().toISOString().split('T')[0],
        recurrente: false,
      })
    }
  }, [initialData, reset, isOpen])

  const createMutation = trpc.ingresos.create.useMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
      reset()
    }
  })

  const updateMutation = trpc.ingresos.update.useMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
      reset()
    }
  })

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate({ ...data, id: initialData.id })
    } else {
      createMutation.mutate(data)
    }
  }

  const isRecurrente = watch('recurrente')

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? 'Editar Ingreso' : 'Nuevo Ingreso'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Descripción"
          placeholder="Ej: Sueldo Marzo, Proyecto Web..."
          icon={<FileText size={18} />}
          error={errors.descripcion?.message}
          {...register('descripcion')}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tipo de Ingreso</label>
            <select
              {...register('tipo')}
              className="w-full bg-surface-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all font-medium"
            >
              <option value="SUELDO">Sueldo</option>
              <option value="FREELANCE">Freelance</option>
              <option value="ALQUILER">Alquiler</option>
              <option value="INVERSION">Inversión</option>
              <option value="REGALO">Regalo</option>
              <option value="BONO">Bono</option>
              <option value="OTRO">Otro</option>
            </select>
            {errors.tipo && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.tipo.message}</p>}
          </div>
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

        {/* Recurrencia */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className={isRecurrente ? 'text-brand-400' : 'text-slate-600'} />
              <span className="text-sm font-bold text-slate-300">Ingreso Recurrente</span>
            </div>
            <input
              type="checkbox"
              {...register('recurrente')}
              className="w-5 h-5 rounded-lg bg-surface-950 border-white/10 text-brand-500 focus:ring-brand-500/20"
            />
          </div>
          
          {isRecurrente && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="pt-2"
            >
              <Input
                label="Frecuencia"
                placeholder="Ej: Mensual, Quincenal..."
                icon={<Tag size={16} />}
                {...register('frecuencia')}
              />
            </motion.div>
          )}
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            className="flex-1 font-bold" 
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Guardar Cambios' : 'Registrar Ingreso'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
