import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { trpc } from '../../../lib/trpc'
import { Package, Tag, Minus, Plus } from 'lucide-react'

const CATEGORIAS = ['Almacén', 'Lácteos', 'Carnes', 'Verduras y Frutas', 'Bebidas', 'Limpieza', 'Higiene', 'Otro']
const UNIDADES = ['unidad', 'kg', 'g', 'litro', 'ml', '6-pack', '12-pack']

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  marca: z.string().optional(),
  categoria: z.string().optional(),
  unidad: z.string(),
  cantidad: z.number().positive(),
  precioUnitario: z.number().nonnegative(),
  tienePromo: z.boolean(),
  descuentoTipo: z.enum(['PORCENTAJE', 'MONTO']).optional(),
  descuentoValor: z.number().nonnegative().optional(),
  notas: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  listaId: string
  supermercado?: string
  onClose: () => void
  onSuccess: () => void
}

export function AddItemModal({ isOpen, listaId, onClose, onSuccess }: Props) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: suggestions = [] } = trpc.supermercado.searchProductos.useQuery(
    { query },
    { enabled: query.length >= 2 },
  )
  const suggestionsCast = suggestions as any[]

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      unidad: 'unidad',
      cantidad: 1,
      precioUnitario: 0,
      tienePromo: false,
    },
  })

  const tienePromo = watch('tienePromo')
  const cantidad = watch('cantidad')
  const precio = watch('precioUnitario')
  const descTipo = watch('descuentoTipo')
  const descValor = watch('descuentoValor')

  // Calculate final price preview
  let precioFinal = (precio ?? 0) * (cantidad ?? 1)
  if (tienePromo && descValor) {
    if (descTipo === 'PORCENTAJE') {
      precioFinal = precioFinal * (1 - descValor / 100)
    } else if (descTipo === 'MONTO') {
      precioFinal = Math.max(0, precioFinal - descValor * (cantidad ?? 1))
    }
  }

  const addMutation = trpc.supermercado.addItem.useMutation({
    onSuccess: () => {
      reset()
      setQuery('')
      onSuccess()
    },
  })

  useEffect(() => {
    if (!isOpen) { reset(); setQuery('') }
  }, [isOpen, reset])

  function selectSuggestion(prod: any) {
    setValue('nombre', prod.nombre)
    setValue('marca', prod.marca ?? '')
    setValue('categoria', prod.categoria ?? '')
    setValue('unidad', prod.unidadBase ?? 'unidad')
    setQuery(prod.nombre)
    setShowSuggestions(false)
  }

  function onSubmit(data: FormData) {
    addMutation.mutate({ ...data, listaId })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar producto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Nombre con autocomplete */}
        <div className="relative">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            <Package size={12} className="inline mr-1" />Producto
          </label>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setValue('nombre', e.target.value)
              setShowSuggestions(true)
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Ej: Leche La Serenísima"
            className="input-base"
          />
          {errors.nombre && <p className="text-xs text-red-400 mt-1">{errors.nombre.message}</p>}

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestionsCast.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-surface-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              {suggestionsCast.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => selectSuggestion(p)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <Package size={14} className="text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-200">{p.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {[p.marca, p.categoria].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
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

        {/* Unidad + Cantidad */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Unidad</label>
            <select {...register('unidad')} className="input-base">
              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Cantidad</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setValue('cantidad', Math.max(1, (cantidad ?? 1) - 1))}
                className="w-8 h-9 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 flex items-center justify-center"
              >
                <Minus size={13} />
              </button>
              <input
                type="number"
                step="0.5"
                {...register('cantidad', { valueAsNumber: true })}
                className="input-base text-center flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => setValue('cantidad', (cantidad ?? 1) + 1)}
                className="w-8 h-9 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 flex items-center justify-center"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Precio unitario */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Precio unitario (ARS)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              {...register('precioUnitario', { valueAsNumber: true })}
              className="input-base pl-6"
              placeholder="0.00"
            />
          </div>
          {errors.precioUnitario && <p className="text-xs text-red-400 mt-1">{errors.precioUnitario.message}</p>}
        </div>

        {/* Promo */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" {...register('tienePromo')} className="w-4 h-4 accent-amber-500 cursor-pointer" />
            <span className="text-sm text-slate-300 flex items-center gap-1.5">
              <Tag size={13} className="text-amber-400" />
              Tiene promoción / descuento
            </span>
          </label>
        </div>

        {tienePromo && (
          <div className="grid grid-cols-2 gap-3 pl-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tipo</label>
              <select {...register('descuentoTipo')} className="input-base">
                <option value="PORCENTAJE">% Porcentaje</option>
                <option value="MONTO">$ Monto fijo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Valor</label>
              <input
                type="number"
                step="0.01"
                {...register('descuentoValor', { valueAsNumber: true })}
                className="input-base"
                placeholder={descTipo === 'PORCENTAJE' ? '20' : '500'}
              />
            </div>
          </div>
        )}

        {/* Total preview */}
        {precio > 0 && (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-brand-500/8 border border-brand-500/20">
            <span className="text-xs text-slate-400">Total estimado</span>
            <span className="text-base font-bold text-brand-400">
              ${precioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm font-medium transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {addMutation.isPending ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
