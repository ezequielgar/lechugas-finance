import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { FileText, DollarSign, Calendar, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { cn } from '../../../lib/utils'

const schema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  tipo: z.enum(['INGRESO', 'GASTO']),
  monto: z.number().positive('El monto debe ser positivo'),
  moneda: z.string(),
  fecha: z.string().min(1, 'La fecha es requerida'),
  notas: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddMovimientoModalProps {
  isOpen: boolean
  onClose: () => void
  boardId: string
  boardMembers: Array<{ userId: string; displayName: string | null; username: string; porcentaje: number }>
  initialData?: any | null
}

export function AddMovimientoBoardModal({ isOpen, onClose, boardId, boardMembers, initialData }: AddMovimientoModalProps) {
  const utils = trpc.useUtils()
  const isEdit = !!initialData

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'GASTO',
      moneda: 'ARS',
      fecha: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          descripcion: initialData.descripcion ?? '',
          tipo: initialData.tipo ?? 'GASTO',
          monto: Number(initialData.monto),
          moneda: initialData.moneda ?? 'ARS',
          fecha: new Date(initialData.fecha).toISOString().split('T')[0],
          notas: initialData.notas ?? '',
        })
      } else {
        reset({
          tipo: 'GASTO',
          moneda: 'ARS',
          fecha: new Date().toISOString().split('T')[0],
          descripcion: '',
          notas: '',
        })
      }
    }
  }, [isOpen, initialData])

  const invalidate = () => utils.boards.getMany.invalidate()

  const addMutation = trpc.boards.addMovimiento.useMutation({ onSuccess: () => { invalidate(); onClose() } })
  const editMutation = trpc.boards.editMovimiento.useMutation({ onSuccess: () => { invalidate(); onClose() } })

  const tipo = watch('tipo')
  const monto = watch('monto')

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      editMutation.mutate({ id: initialData.id, ...data })
    } else {
      addMutation.mutate({ boardId, ...data })
    }
  }

  const isLoading = addMutation.isPending || editMutation.isPending

  // Preview de distribución
  const previewDistribution = boardMembers.map((m) => ({
    name: m.displayName ?? m.username,
    monto: monto > 0 ? Math.round(monto * (m.porcentaje / 100) * 100) / 100 : 0,
    porcentaje: m.porcentaje,
  }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar Movimiento' : 'Nuevo Movimiento'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            {(['INGRESO', 'GASTO'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('tipo', t)}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                  tipo === t
                    ? t === 'INGRESO'
                      ? 'bg-green-500/20 border-green-500/50 text-green-400'
                      : 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                )}
              >
                {t === 'INGRESO' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                {t === 'INGRESO' ? 'Ingreso' : 'Gasto'}
              </button>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
          <Input
            {...register('descripcion')}
            placeholder="Ej: Alquiler de enero"
            icon={<FileText size={16} />}
            error={errors.descripcion?.message}
          />
        </div>

        {/* Monto + Moneda */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">Monto</label>
            <Input
              {...register('monto', { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="0.00"
              icon={<DollarSign size={16} />}
              error={errors.monto?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Moneda</label>
            <select
              {...register('moneda')}
              className="w-full h-10 bg-surface-800 border border-white/10 rounded-lg px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Fecha</label>
          <Input
            {...register('fecha')}
            type="date"
            icon={<Calendar size={16} />}
            error={errors.fecha?.message}
          />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Notas (opcional)</label>
          <Input {...register('notas')} placeholder="Aclaraciones..." />
        </div>

        {/* Preview distribución */}
        {boardMembers.length > 0 && monto > 0 && (
          <div className="bg-surface-950 rounded-xl p-3 border border-white/5">
            <p className="text-xs font-medium text-slate-400 mb-2">Distribución estimada</p>
            <div className="space-y-1.5">
              {previewDistribution.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{d.name}</span>
                  <span className="text-slate-400">
                    {d.porcentaje}% → <span className="text-slate-200 font-medium">${d.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {isEdit ? 'Guardar Cambios' : 'Agregar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
