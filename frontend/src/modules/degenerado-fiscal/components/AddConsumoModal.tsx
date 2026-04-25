import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { ShoppingBag, Calendar, Hash, DollarSign, Tag } from 'lucide-react'
import { useEffect } from 'react'

const schema = z.object({
  tarjetaId: z.string().min(1),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  comercio: z.string().optional(),
  categoria: z.string().optional(),
  montoTotal: z.number().positive('El monto total debe ser positivo'),
  cuotas: z.number().int().min(1, 'Mínimo 1 cuota'),
  fechaCompra: z.string(),
  notas: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddConsumoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tarjetaId: string
  tarjetaNombre: string
  initialData?: any // Para edición
}

export function AddConsumoModal({ isOpen, onClose, onSuccess, tarjetaId, tarjetaNombre, initialData }: AddConsumoModalProps) {
  const isEditing = !!initialData

  const { register, handleSubmit, formState: { errors }, reset, control, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tarjetaId,
      cuotas: 1,
      fechaCompra: new Date().toISOString().split('T')[0],
      categoria: 'Varios',
    }
  })

  // Sincronizar tarjetaId si cambia por fuera
  useEffect(() => {
    setValue('tarjetaId', tarjetaId)
  }, [tarjetaId, setValue])

  // Cargar datos al editar
  useEffect(() => {
    if (initialData && isOpen) {
      reset({
        tarjetaId,
        descripcion: initialData.descripcion,
        comercio: initialData.comercio || '',
        categoria: initialData.categoria || 'Varios',
        montoTotal: Number(initialData.monto),
        cuotas: initialData.cuotas,
        fechaCompra: new Date(initialData.fechaCompra).toISOString().split('T')[0],
        notas: initialData.notas || '',
      })
    } else if (!initialData && isOpen) {
      reset({
        tarjetaId,
        cuotas: 1,
        fechaCompra: new Date().toISOString().split('T')[0],
        categoria: 'Varios',
      })
    }
  }, [initialData, isOpen, reset, tarjetaId])

  const cuotas = useWatch({ control, name: 'cuotas' })
  const montoTotal = useWatch({ control, name: 'montoTotal' })
  const montoCuota = (montoTotal || 0) / (cuotas || 1)

  const addMutation = trpc.tarjetas.addCompra.useMutation({
    onSuccess: () => {
      reset()
      onSuccess()
      onClose()
    },
    onError: (err) => {
      console.error('Error adding consumo:', err.message)
      alert('Error al cargar consumo: ' + err.message)
    }
  })

  const updateMutation = trpc.tarjetas.updateCompra.useMutation({
    onSuccess: () => {
      reset()
      onSuccess()
      onClose()
    },
    onError: (err) => {
      console.error('Error updating consumo:', err.message)
      alert('Error al editar consumo: ' + err.message)
    }
  })

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate({ id: initialData.id, ...data })
    } else {
      addMutation.mutate(data)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? `Editar Consumo` : `Nuevo Consumo en ${tarjetaNombre}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Descripción"
          placeholder="Ej: Supermercado Coto, Cena con amigos..."
          icon={<ShoppingBag size={18} />}
          error={errors.descripcion?.message}
          {...register('descripcion')}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Comercio (Opcional)"
            placeholder="Ej: Coto, Netflix..."
            icon={<Tag size={18} />}
            {...register('comercio')}
          />
          <Input
            label="Fecha"
            type="date"
            icon={<Calendar size={18} />}
            error={errors.fechaCompra?.message}
            {...register('fechaCompra')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Número de Cuotas"
            type="number"
            min={1}
            icon={<Hash size={18} />}
            error={errors.cuotas?.message}
            {...register('cuotas', { valueAsNumber: true })}
          />
          <Input
            label="Monto Total del Producto"
            type="number"
            step="0.01"
            icon={<DollarSign size={18} />}
            error={errors.montoTotal?.message}
            {...register('montoTotal', { valueAsNumber: true })}
          />
        </div>

        {/* Resumen */}
        {(montoTotal || 0) > 0 && (
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 flex flex-col gap-1">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Precio por cuota</span>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-slate-100">${montoCuota.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-xs text-slate-500 mb-1.5">x{cuotas} = ${(montoTotal || 0).toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={addMutation.isPending || updateMutation.isPending}>
            {isEditing ? 'Guardar Cambios' : 'Cargar Consumo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
