import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { ShoppingBag, Calendar, Hash, DollarSign, Tag, TrendingUp, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

const schema = z.object({
  tarjetaId: z.string().min(1),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  comercio: z.string().optional(),
  categoria: z.string().optional(),
  montoTotal: z.number().positive('El monto total debe ser positivo'),
  moneda: z.enum(['ARS', 'USD']),
  tipoCambio: z.number().positive().optional(),
  cuotas: z.number().int().min(1, 'Mínimo 1 cuota'),
  esRecurrente: z.boolean().default(false),
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
  initialData?: any
}

export function AddConsumoModal({ isOpen, onClose, onSuccess, tarjetaId, tarjetaNombre, initialData }: AddConsumoModalProps) {
  const isEditing = !!initialData

  const { register, handleSubmit, formState: { errors }, reset, control, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tarjetaId,
      descripcion: '',
      comercio: '',
      categoria: 'Varios',
      moneda: 'ARS',
      cuotas: 1,
      esRecurrente: false,
      fechaCompra: new Date().toISOString().split('T')[0],
      notas: '',
    }
  })

  useEffect(() => {
    setValue('tarjetaId', tarjetaId)
  }, [tarjetaId, setValue])

  useEffect(() => {
    if (initialData && isOpen) {
      reset({
        tarjetaId,
        descripcion: initialData.descripcion,
        comercio: initialData.comercio || '',
        categoria: initialData.categoria || 'Varios',
        montoTotal: Number(initialData.monto),
        moneda: (initialData.moneda as 'ARS' | 'USD') || 'ARS',
        tipoCambio: initialData.tipoCambio ? Number(initialData.tipoCambio) : undefined,
        cuotas: initialData.cuotas,
        esRecurrente: initialData.esRecurrente || false,
        fechaCompra: new Date(initialData.fechaCompra).toISOString().split('T')[0],
        notas: initialData.notas || '',
      })
    } else if (!initialData && isOpen) {
      reset({
        tarjetaId,
        descripcion: '',
        comercio: '',
        categoria: 'Varios',
        montoTotal: undefined as any,
        moneda: 'ARS',
        tipoCambio: undefined,
        cuotas: 1,
        esRecurrente: false,
        fechaCompra: new Date().toISOString().split('T')[0],
        notas: '',
      })
    }
  }, [initialData, isOpen, reset, tarjetaId])

  const cuotas = useWatch({ control, name: 'cuotas' })
  const esRecurrente = useWatch({ control, name: 'esRecurrente' })
  const montoTotal = useWatch({ control, name: 'montoTotal' })
  const moneda = watch('moneda')
  const tipoCambio = watch('tipoCambio')
  const montoCuota = (montoTotal || 0) / (cuotas || 1)
  const montoARS = moneda === 'USD' && tipoCambio ? montoCuota * tipoCambio : montoCuota

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

        {/* Recurrente toggle */}
        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${esRecurrente ? 'bg-brand-500/10 border-brand-500/30' : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50'}`}>
          <div className={`p-2 rounded-lg ${esRecurrente ? 'bg-brand-500 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
            <RefreshCw size={18} />
          </div>
          <div className="flex flex-col flex-1">
            <span className={`text-sm font-semibold ${esRecurrente ? 'text-brand-400' : 'text-slate-200'}`}>Es recurrente (Suscripción)</span>
            <span className="text-xs text-slate-500">Se cobrará todos los meses indefinidamente</span>
          </div>
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-brand-500 focus:ring-brand-500 focus:ring-offset-slate-900"
            {...register('esRecurrente')}
            onChange={(e) => {
              register('esRecurrente').onChange(e)
              if (e.target.checked) setValue('cuotas', 1)
            }}
          />
        </label>

        {/* Moneda toggle */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Moneda</label>
          <div className="flex gap-2">
            {(['ARS', 'USD'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setValue('moneda', m)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  moneda === m
                    ? m === 'USD'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-brand-500/20 border-brand-500/50 text-brand-400'
                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                }`}
              >
                {m === 'ARS' ? '🇦🇷 Pesos (ARS)' : '🇺🇸 Dólares (USD)'}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid ${esRecurrente ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
          {!esRecurrente && (
            <Input
              label="Número de Cuotas"
              type="number"
              min={1}
              icon={<Hash size={18} />}
              error={errors.cuotas?.message}
              {...register('cuotas', { valueAsNumber: true })}
            />
          )}
          <Input
            label={`Monto ${esRecurrente ? 'Mensual' : 'Total'} ${moneda === 'USD' ? '(USD)' : '(ARS)'}`}
            type="number"
            step="0.01"
            icon={<DollarSign size={18} />}
            error={errors.montoTotal?.message}
            {...register('montoTotal', { valueAsNumber: true })}
          />
        </div>

        {/* Tipo de cambio (solo USD) */}
        {moneda === 'USD' && (
          <Input
            label="Tipo de Cambio (ARS por USD)"
            type="number"
            step="0.01"
            placeholder="Ej: 1150"
            icon={<TrendingUp size={18} />}
            error={errors.tipoCambio?.message}
            {...register('tipoCambio', { valueAsNumber: true })}
          />
        )}

        {/* Resumen */}
        {(montoTotal || 0) > 0 && (
          <div className={`p-4 rounded-xl border flex flex-col gap-1 ${moneda === 'USD' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-brand-500/10 border-brand-500/20'}`}>
            <span className={`text-xs font-semibold uppercase tracking-wider ${moneda === 'USD' ? 'text-emerald-400' : 'text-brand-400'}`}>
              Precio por cuota {esRecurrente ? '(mensual)' : ''}
            </span>
            <div className="flex items-end gap-2 flex-wrap">
              <span className="text-2xl font-bold text-slate-100">
                {moneda === 'USD' ? 'U$D' : '$'}{montoCuota.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {!esRecurrente && (
                <span className="text-xs text-slate-500 mb-1.5">
                  x{cuotas} = {moneda === 'USD' ? 'U$D' : '$'}{(montoTotal || 0).toLocaleString()}
                </span>
              )}
            </div>
            {moneda === 'USD' && tipoCambio && tipoCambio > 0 && (
              <p className="text-xs text-emerald-400/70 font-medium">
                ≈ ${montoARS.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ARS por cuota
                <span className="text-slate-600"> (al TC ${tipoCambio.toLocaleString()})</span>
              </p>
            )}
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
