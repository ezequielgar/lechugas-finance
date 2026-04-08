import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { trpc } from '../../../lib/trpc'
import { Package } from 'lucide-react'

const CATEGORIAS = ['Almacén', 'Lácteos', 'Carnes', 'Verduras y Frutas', 'Bebidas', 'Limpieza', 'Higiene', 'Otro']
const UNIDADES = ['unidad', 'kg', 'g', 'litro', 'ml', '6-pack', '12-pack']

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  marca: z.string().optional(),
  categoria: z.string().optional(),
  unidadBase: z.string(),
  codigoBarras: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  producto: {
    id: string
    nombre: string
    marca?: string | null
    categoria?: string | null
    unidadBase?: string | null
    codigoBarras?: string | null
  }
  onClose: () => void
  onSuccess: () => void
}

export function EditProductoModal({ isOpen, producto, onClose, onSuccess }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: producto.nombre,
      marca: producto.marca ?? '',
      categoria: producto.categoria ?? '',
      unidadBase: producto.unidadBase ?? 'unidad',
      codigoBarras: producto.codigoBarras ?? '',
    },
  })

  // Re-populate whenever the product changes
  useEffect(() => {
    reset({
      nombre: producto.nombre,
      marca: producto.marca ?? '',
      categoria: producto.categoria ?? '',
      unidadBase: producto.unidadBase ?? 'unidad',
      codigoBarras: producto.codigoBarras ?? '',
    })
  }, [producto.id, reset]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateMutation = trpc.supermercado.updateProducto.useMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  function onSubmit(data: FormData) {
    updateMutation.mutate({
      productoId: producto.id,
      nombre: data.nombre,
      marca: data.marca || null,
      categoria: data.categoria || null,
      unidadBase: data.unidadBase,
      codigoBarras: data.codigoBarras || null,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar producto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Nombre */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            <Package size={12} className="inline mr-1" />Nombre
          </label>
          <input {...register('nombre')} placeholder="Ej: Leche La Serenísima" className="input-base" />
          {errors.nombre && <p className="text-xs text-red-400 mt-1">{errors.nombre.message}</p>}
        </div>

        {/* Marca + Categoría */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Marca</label>
            <input {...register('marca')} placeholder="Ej: La Serenísima" className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Categoría</label>
            <select {...register('categoria')} className="input-base">
              <option value="">Sin categoría</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Unidad base */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Unidad base</label>
          <select {...register('unidadBase')} className="input-base">
            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        {/* Código de barras */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Código de barras (opcional)</label>
          <input
            {...register('codigoBarras')}
            placeholder="Ej: 7790895001206"
            className="input-base font-mono tracking-wide"
          />
        </div>

        {updateMutation.error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {updateMutation.error.message}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
