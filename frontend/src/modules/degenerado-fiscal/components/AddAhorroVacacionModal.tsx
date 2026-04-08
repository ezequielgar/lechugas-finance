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
  notas: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddAhorroVacacionModalProps {
  isOpen: boolean
  onClose: () => void
  vacacion: { id: string; destino: string } | null
}

export function AddAhorroVacacionModal({ isOpen, onClose, vacacion }: AddAhorroVacacionModalProps) {
  const utils = trpc.useUtils()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fecha: new Date().toISOString().split('T')[0] },
  })

  const mutation = trpc.vacaciones.addAhorro.useMutation({
    onSuccess: () => { utils.vacaciones.getMany.invalidate(); onClose(); reset() },
  })

  const onSubmit = (data: FormData) => {
    if (!vacacion) return
    mutation.mutate({ ...data, vacacionId: vacacion.id })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cargar Ahorro — ${vacacion?.destino ?? ''}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Monto ahorrado"
            type="number"
            step="0.01"
            placeholder="0.00"
            icon={<DollarSign size={16} />}
            error={errors.monto?.message}
            {...register('monto', { valueAsNumber: true })}
            autoFocus
          />
          <Input
            label="Fecha"
            type="date"
            icon={<Calendar size={16} />}
            {...register('fecha')}
          />
        </div>

        <Input
          label="Notas (Opcional)"
          placeholder="Ej: Cobré el aguinaldo, ahorré del sueldo..."
          icon={<FileText size={16} />}
          {...register('notas')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={mutation.isPending}>Registrar Ahorro</Button>
        </div>
      </form>
    </Modal>
  )
}
