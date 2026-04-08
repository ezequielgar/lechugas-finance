import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { CreditCard, Landmark, Hash, Palette } from 'lucide-react'

const schema = z.object({
  nombreEntidad: z.string().min(1, 'El banco/entidad es requerido'),
  nombreTarjeta: z.string().min(1, 'El nombre de la tarjeta es requerido'),
  tipo: z.enum(['CREDITO', 'DEBITO', 'PREPAGA']),
  red: z.enum(['VISA', 'MASTERCARD', 'AMEX', 'CABAL', 'NARANJA', 'OTRA']),
  ultimos4: z.string().max(4, 'Máximo 4 caracteres').optional(),
  color: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddTarjetaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddTarjetaModal({ isOpen, onClose, onSuccess }: AddTarjetaModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'CREDITO',
      red: 'VISA',
      color: '#22c55e',
    }
  })

  const createMutation = trpc.tarjetas.create.useMutation({
    onSuccess: () => {
      reset()
      onSuccess()
      onClose()
    },
    onError: (err) => {
      console.error('Error creating tarjeta:', err.message)
      alert('Error: ' + err.message)
    }
  })

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data)
  }

  console.log('Form errors:', errors)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Nueva Tarjeta">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre de la Entidad / Banco"
          placeholder="Ej: Santander, Galicia, Lemon..."
          icon={<Landmark size={18} />}
          error={errors.nombreEntidad?.message}
          {...register('nombreEntidad')}
        />

        <Input
          label="Nombre de la Tarjeta"
          placeholder="Ej: Visa Gold, Mastercard Black..."
          icon={<CreditCard size={18} />}
          error={errors.nombreTarjeta?.message}
          {...register('nombreTarjeta')}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Tipo</label>
            <select
              className="w-full bg-surface-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-500/50"
              {...register('tipo')}
            >
              <option value="CREDITO">Crédito</option>
              <option value="DEBITO">Débito</option>
              <option value="PREPAGA">Prepaga</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Red</label>
            <select
              className="w-full bg-surface-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-500/50"
              {...register('red')}
            >
              <option value="VISA">Visa</option>
              <option value="MASTERCARD">Mastercard</option>
              <option value="AMEX">Amex</option>
              <option value="CABAL">Cabal</option>
              <option value="NARANJA">Naranja</option>
              <option value="OTRA">Otra</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Últimos 4 dígitos"
            placeholder="1234"
            maxLength={4}
            icon={<Hash size={18} />}
            error={errors.ultimos4?.message}
            {...register('ultimos4')}
          />
          <Input
            label="Color"
            type="color"
            icon={<Palette size={18} />}
            error={errors.color?.message}
            {...register('color')}
            className="p-1 h-10 cursor-pointer"
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={createMutation.isPending}>
            Guardar Tarjeta
          </Button>
        </div>
      </form>
    </Modal>
  )
}
