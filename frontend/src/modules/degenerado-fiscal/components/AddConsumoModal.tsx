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
  montoCuota: z.number().positive('El monto debe ser positivo'),
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
}

export function AddConsumoModal({ isOpen, onClose, onSuccess, tarjetaId, tarjetaNombre }: AddConsumoModalProps) {
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

  const cuotas = useWatch({ control, name: 'cuotas' })
  const montoCuota = useWatch({ control, name: 'montoCuota' })
  const montoTotal = (cuotas || 0) * (montoCuota || 0)

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

  const onSubmit = (data: FormData) => {
    console.log('Submitting consumo:', data)
    // Calculamos el monto total para el backend
    const submissionData = {
      ...data,
      montoTotal: (data.montoCuota || 0) * (data.cuotas || 0),
    }
    addMutation.mutate(submissionData as any)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Nuevo Consumo en ${tarjetaNombre}`}>
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
            label="Monto de la Cuota"
            type="number"
            step="0.01"
            icon={<DollarSign size={18} />}
            error={errors.montoCuota?.message}
            {...register('montoCuota', { valueAsNumber: true })}
          />
        </div>

        {/* Resumen del total */}
        {montoTotal > 0 && (
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 flex flex-col gap-1">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Total del producto</span>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-slate-100">${montoTotal.toLocaleString()}</span>
              <span className="text-xs text-slate-500 mb-1.5">({cuotas}x ${montoCuota.toLocaleString()})</span>
            </div>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={addMutation.isPending}>
            Cargar Consumo
          </Button>
        </div>
      </form>
    </Modal>
  )
}
