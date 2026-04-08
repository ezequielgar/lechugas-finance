import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { Briefcase, Tag, Globe } from 'lucide-react'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  proveedor: z.string().optional(),
  categoria: z.enum([
    'ELECTRICIDAD', 'GAS', 'AGUA', 'INTERNET', 'TELEFONO', 'ALQUILER', 
    'EXPENSAS', 'STREAMING', 'GIMNASIO', 'SEGURO', 'TRANSPORTE', 
    'EDUCACION', 'SALUD', 'OTRO'
  ]),
})

type FormData = z.infer<typeof schema>

interface AddGastoFijoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const CATEGORIES = [
  { value: 'ALQUILER', label: 'Alquiler' },
  { value: 'ELECTRICIDAD', label: 'Electricidad / Luz' },
  { value: 'GAS', label: 'Gas' },
  { value: 'AGUA', label: 'Agua / AYSA' },
  { value: 'INTERNET', label: 'Internet / WiFi' },
  { value: 'TELEFONO', label: 'Teléfono / Móvil' },
  { value: 'EXPENSAS', label: 'Expensas' },
  { value: 'STREAMING', label: 'Streaming (Netflix, etc.)' },
  { value: 'GIMNASIO', label: 'Gimnasio' },
  { value: 'SEGURO', label: 'Seguros' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'EDUCACION', label: 'Educación' },
  { value: 'SALUD', label: 'Salud / Obra Social' },
  { value: 'OTRO', label: 'Otro' },
]

export function AddGastoFijoModal({ isOpen, onClose, onSuccess }: AddGastoFijoModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { categoria: 'OTRO' }
  })

  const mutation = trpc.gastosFijos.createService.useMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
      reset()
    },
    onError: (err) => {
      console.error('[AddGastoFijo] Error:', err.message)
      alert(`Error al guardar el servicio: ${err.message}`)
    }
  })

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Servicio / Gasto Fijo">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre del Servicio"
          placeholder="Ej: Edesur, Internet Fibra, Alquiler..."
          icon={<Briefcase size={18} />}
          error={errors.nombre?.message}
          {...register('nombre')}
          autoFocus
        />

        <Input
          label="Proveedor (Opcional)"
          placeholder="Ej: Movistar, Metrogas, Consorcio..."
          icon={<Globe size={18} />}
          {...register('proveedor')}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
            <Tag size={14} /> Categoría
          </label>
          <select
            {...register('categoria')}
            className="w-full bg-surface-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all font-medium"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          {errors.categoria && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.categoria.message}</p>}
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1 font-bold" isLoading={mutation.isPending}>
            Definir Servicio
          </Button>
        </div>
      </form>
    </Modal>
  )
}
