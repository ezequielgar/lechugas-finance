import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { CreditCard, Building2, DollarSign, Tag, Calendar, FileText, Percent } from 'lucide-react'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  entidad: z.string().optional(),
  montoOriginal: z.number().positive('El monto original debe ser positivo'),
  moneda: z.string().min(1),
  cuotasTotal: z.number().int().min(1, 'Al menos 1 cuota'),
  montoCuota: z.number().positive('El monto de cuota debe ser positivo'),
  tasaInteres: z.number().min(0).optional(),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  notas: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddCreditoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddCreditoModal({ isOpen, onClose, onSuccess }: AddCreditoModalProps) {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      moneda: 'ARS',
      cuotasTotal: 12,
      fechaInicio: new Date().toISOString().split('T')[0],
      montoOriginal: 0,
      montoCuota: 0,
    },
  })

  const cuotas = watch('cuotasTotal')
  const montoCuota = watch('montoCuota')
  const totalAPagar = (cuotas || 0) * (montoCuota || 0)

  const mutation = trpc.creditos.create.useMutation({
    onSuccess: () => { onSuccess(); onClose(); reset() },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      ...data,
      tasaInteres: data.tasaInteres || undefined,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Crédito / Préstamo">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Nombre del Crédito"
              placeholder="Ej: Préstamo Personal Banco Nación..."
              icon={<CreditCard size={18} />}
              error={errors.nombre?.message}
              {...register('nombre')}
              autoFocus
            />
          </div>
          <Input
            label="Entidad / Banco (Opcional)"
            placeholder="Ej: Banco Nación, Mercado Pago..."
            icon={<Building2 size={18} />}
            {...register('entidad')}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Moneda</label>
            <select
              {...register('moneda')}
              className="w-full bg-surface-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all font-medium"
            >
              <option value="ARS">ARS — Peso Arg.</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Monto Original"
            type="number"
            step="0.01"
            icon={<DollarSign size={18} />}
            error={errors.montoOriginal?.message}
            {...register('montoOriginal', { valueAsNumber: true })}
          />
          <Input
            label="TNA / TEA % (Opcional)"
            type="number"
            step="0.01"
            placeholder="Ej: 3.50"
            icon={<Percent size={18} />}
            {...register('tasaInteres', { valueAsNumber: true })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cantidad de Cuotas"
            type="number"
            min="1"
            icon={<Tag size={18} />}
            error={errors.cuotasTotal?.message}
            {...register('cuotasTotal', { valueAsNumber: true })}
          />
          <Input
            label="Monto por Cuota"
            type="number"
            step="0.01"
            icon={<DollarSign size={18} />}
            error={errors.montoCuota?.message}
            {...register('montoCuota', { valueAsNumber: true })}
          />
        </div>

        {/* Preview total a pagar */}
        {totalAPagar > 0 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total a pagar</span>
            <span className="text-sm font-black text-slate-200 tabular-nums font-mono">
              ${totalAPagar.toLocaleString()}
            </span>
          </div>
        )}

        <Input
          label="Fecha de Inicio (primer cuota un mes después)"
          type="date"
          icon={<Calendar size={18} />}
          error={errors.fechaInicio?.message}
          {...register('fechaInicio')}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
            <FileText size={13} /> Notas (Opcional)
          </label>
          <textarea
            {...register('notas')}
            placeholder="Condiciones del préstamo, garantías, observaciones..."
            rows={2}
            className="w-full bg-surface-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all resize-none"
          />
        </div>

        <p className="text-[10px] text-slate-600 font-medium px-1">
          Se generarán automáticamente {cuotas || 0} cuotas con fechas de vencimiento mensuales.
        </p>

        <div className="pt-2 flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 font-bold"
            isLoading={mutation.isPending}
          >
            Cargar Crédito
          </Button>
        </div>
      </form>
    </Modal>
  )
}
