import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { trpc } from '../../../lib/trpc'
import { Store, ShoppingCart, Calendar } from 'lucide-react'
const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  supermercado: z.string().min(1, 'El supermercado es requerido'),
  fechaCompra: z.string().min(1),
  notas: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddListaModal({ isOpen, onClose, onSuccess }: Props) {
  const { data: recentSupers = [] } = trpc.supermercado.getRecentSupermercados.useQuery()
  const supersCast = recentSupers as string[]

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      supermercado: '',
      fechaCompra: new Date().toISOString().slice(0, 10),
    },
  })

  const superValue = watch('supermercado')

  const createMutation = trpc.supermercado.createLista.useMutation({
    onSuccess: () => {
      reset()
      onSuccess()
    },
  })

  useEffect(() => {
    if (!isOpen) reset()
  }, [isOpen, reset])

  function onSubmit(data: FormData) {
    createMutation.mutate({
      ...data,
      fechaCompra: new Date(data.fechaCompra).toISOString(),
    })
  }

  // Auto-fill nombre when supermercado is set
  useEffect(() => {
    if (superValue && !watch('nombre')) {
      const fecha = watch('fechaCompra')
      const d = fecha ? new Date(fecha) : new Date()
      const mes = d.toLocaleString('es-AR', { month: 'long' })
      setValue('nombre', `${superValue} — ${mes.charAt(0).toUpperCase() + mes.slice(1)} ${d.getFullYear()}`)
    }
  }, [superValue])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo carrito">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Supermercado */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            <Store size={12} className="inline mr-1" />Supermercado
          </label>
          {supersCast.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {supersCast.slice(0, 6).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue('supermercado', s)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    superValue === s
                      ? 'border-brand-500/50 bg-brand-500/15 text-brand-400'
                      : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <input
            {...register('supermercado')}
            placeholder="Ej: Carrefour, Coto, DIA..."
            className="input-base"
          />
          {errors.supermercado && <p className="text-xs text-red-400 mt-1">{errors.supermercado.message}</p>}
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            <ShoppingCart size={12} className="inline mr-1" />Nombre del carrito
          </label>
          <input {...register('nombre')} placeholder="Ej: Compra mensual mayo" className="input-base" />
          {errors.nombre && <p className="text-xs text-red-400 mt-1">{errors.nombre.message}</p>}
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            <Calendar size={12} className="inline mr-1" />Fecha de compra
          </label>
          <input type="date" {...register('fechaCompra')} className="input-base" />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Notas (opcional)</label>
          <textarea {...register('notas')} rows={2} placeholder="Ej: Compra del mes, faltaron algunas cosas..." className="input-base resize-none" />
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm font-medium transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creando...' : 'Crear carrito'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
