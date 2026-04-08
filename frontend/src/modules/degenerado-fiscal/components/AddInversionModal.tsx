import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { TrendingUp, Tag, Calendar, FileText, DollarSign } from 'lucide-react'
import { useEffect } from 'react'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.enum(['PLAZO_FIJO', 'ACCIONES', 'CRYPTO', 'FONDO_COMUN', 'DOLAR', 'INMUEBLE', 'OTRO']),
  montoInicial: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().min(1),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaVencimiento: z.string().optional(),
  notas: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddInversionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: any
}

const TIPOS = [
  { value: 'PLAZO_FIJO',  label: 'Plazo Fijo' },
  { value: 'ACCIONES',    label: 'Acciones' },
  { value: 'CRYPTO',      label: 'Criptomonedas' },
  { value: 'FONDO_COMUN', label: 'Fondo Común de Inversión' },
  { value: 'DOLAR',       label: 'Dólar / Divisa' },
  { value: 'INMUEBLE',    label: 'Inmueble' },
  { value: 'OTRO',        label: 'Otro' },
]

export function AddInversionModal({ isOpen, onClose, onSuccess, initialData }: AddInversionModalProps) {
  const isEditing = !!initialData

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'PLAZO_FIJO',
      moneda: 'ARS',
      fechaInicio: new Date().toISOString().split('T')[0],
      montoInicial: 0,
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        nombre: initialData.nombre,
        tipo: initialData.tipo,
        montoInicial: Number(initialData.montoInicial),
        moneda: initialData.moneda,
        fechaInicio: new Date(initialData.fechaInicio).toISOString().split('T')[0],
        fechaVencimiento: initialData.fechaVencimiento
          ? new Date(initialData.fechaVencimiento).toISOString().split('T')[0]
          : '',
        notas: initialData.notas || '',
      })
    } else if (isOpen) {
      reset({
        tipo: 'PLAZO_FIJO',
        moneda: 'ARS',
        fechaInicio: new Date().toISOString().split('T')[0],
        montoInicial: 0,
        notas: '',
        fechaVencimiento: '',
      })
    }
  }, [initialData, isOpen, reset])

  const createMutation = trpc.inversiones.create.useMutation({
    onSuccess: () => { onSuccess(); onClose(); reset() },
  })

  const updateMutation = trpc.inversiones.update.useMutation({
    onSuccess: () => { onSuccess(); onClose(); reset() },
  })

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      fechaVencimiento: data.fechaVencimiento || undefined,
    }
    if (isEditing) {
      updateMutation.mutate({ ...payload, id: initialData.id })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Inversión' : 'Nueva Inversión'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre"
          placeholder="Ej: Plazo Fijo Macro, BTC Personal..."
          icon={<TrendingUp size={18} />}
          error={errors.nombre?.message}
          {...register('nombre')}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
              <Tag size={13} /> Tipo
            </label>
            <select
              {...register('tipo')}
              className="w-full bg-surface-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all font-medium"
            >
              {TIPOS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.tipo && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.tipo.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
              <DollarSign size={13} /> Moneda
            </label>
            <select
              {...register('moneda')}
              className="w-full bg-surface-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all font-medium"
            >
              <option value="ARS">ARS — Peso Arg.</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="BTC">BTC — Bitcoin</option>
              <option value="USDT">USDT — Tether</option>
            </select>
          </div>
        </div>

        <Input
          label="Monto Inicial"
          type="number"
          step="0.01"
          icon={<DollarSign size={18} />}
          error={errors.montoInicial?.message}
          {...register('montoInicial', { valueAsNumber: true })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de Inicio"
            type="date"
            icon={<Calendar size={18} />}
            error={errors.fechaInicio?.message}
            {...register('fechaInicio')}
          />
          <Input
            label="Vencimiento (Opcional)"
            type="date"
            icon={<Calendar size={18} />}
            {...register('fechaVencimiento')}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
            <FileText size={13} /> Notas (Opcional)
          </label>
          <textarea
            {...register('notas')}
            placeholder="TEA, comisiones, detalles del instrumento..."
            rows={3}
            className="w-full bg-surface-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all resize-none"
          />
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
            {isEditing ? 'Guardar Cambios' : 'Crear Inversión'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
