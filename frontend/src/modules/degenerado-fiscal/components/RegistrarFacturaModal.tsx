import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { DollarSign, Calendar, FileText } from 'lucide-react'

const schema = z.object({
  monto: z.number().positive('El monto debe ser positivo'),
  fecha: z.string(),
  fechaVencimiento: z.string().optional(),
  notas: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface RegistrarFacturaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  service: { id: string; nombre: string } | null
  initialData?: any | null
}

export function RegistrarFacturaModal({ isOpen, onClose, onSuccess, service, initialData }: RegistrarFacturaModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      fechaVencimiento: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
    }
  })

  useEffect(() => {
    if (initialData) {
      reset({
        monto: Number(initialData.monto),
        fecha: initialData.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        fechaVencimiento: initialData.fechaVencimiento ? new Date(initialData.fechaVencimiento).toISOString().split('T')[0] : undefined,
        notas: initialData.notas ?? undefined,
      })
    } else {
      reset({
        monto: 0,
        fecha: new Date().toISOString().split('T')[0],
        fechaVencimiento: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
      })
    }
  }, [initialData, isOpen])

  const mutation = trpc.gastosFijos.addRecord.useMutation({
    onSuccess: () => { onSuccess(); onClose(); reset() },
    onError: (err) => { console.error('[RegistrarFactura] Error:', err.message); alert(`Error al guardar: ${err.message}`) }
  })

  const updateMutation = trpc.gastosFijos.updateRecord.useMutation({
    onSuccess: () => { onSuccess(); onClose(); reset() },
    onError: (err) => { console.error('[EditarFactura] Error:', err.message); alert(`Error al guardar: ${err.message}`) }
  })

  const onSubmit = (data: FormData) => {
    if (initialData) {
      updateMutation.mutate({ id: initialData.id, ...data })
    } else {
      if (!service) return
      mutation.mutate({ ...data, gastoFijoId: service.id })
    }
  }

  const isEditing = !!initialData
  const isPending = mutation.isPending || updateMutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? `Editar Factura: ${service?.nombre ?? ''}` : `Registrar Factura: ${service?.nombre ?? ''}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Monto de la Factura"
          type="number"
          step="0.01"
          placeholder="0.00"
          icon={<DollarSign size={18} />}
          error={errors.monto?.message}
          {...register('monto', { valueAsNumber: true })}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha Emisión"
            type="date"
            icon={<Calendar size={18} />}
            error={errors.fecha?.message}
            {...register('fecha')}
          />
          <Input
            label="Fecha Vencimiento"
            type="date"
            icon={<Calendar size={18} className="text-red-400" />}
            error={errors.fechaVencimiento?.message}
            {...register('fechaVencimiento')}
          />
        </div>

        <Input
          label="Notas (Opcional)"
          placeholder="Ej: Mes fuerte por aire acondicionado..."
          icon={<FileText size={18} />}
          {...register('notas')}
        />

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1 font-bold" isLoading={isPending}>
            {isEditing ? 'Guardar Cambios' : 'Cargar Factura'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
