import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { trpc } from '../../../lib/trpc'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Store, Calendar, CheckCircle2, Circle,
  Trash2, Plus, Tag, BarChart2, X, ShoppingCart, Camera, Pencil,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '../../../lib/utils'
import { AddItemModal } from '../components/AddItemModal'
import { PriceCompareModal } from '../components/PriceCompareModal'
import { ProductImageModal } from '../components/ProductImageModal'
import { EditProductoModal } from '../components/EditProductoModal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function ListaSuperDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const utils = trpc.useUtils()

  const [showAddItem, setShowAddItem] = useState(false)
  const [compareProducto, setCompareProducto] = useState<{ id: string; nombre: string } | null>(null)
  const [editEstado, setEditEstado] = useState(false)
  const [imageProducto, setImageProducto] = useState<{ id: string; nombre: string; imagen?: string | null } | null>(null)
  const [editProducto, setEditProducto] = useState<{ id: string; nombre: string; marca?: string | null; categoria?: string | null; unidadBase?: string | null; codigoBarras?: string | null } | null>(null)

  const { data: lista, isLoading } = trpc.supermercado.getLista.useQuery(
    { listaId: id! },
    { enabled: !!id },
  )

  const toggleMutation = trpc.supermercado.updateItem.useMutation({
    onSuccess: () => utils.supermercado.getLista.invalidate({ listaId: id }),
  })
  const deleteMutation = trpc.supermercado.deleteItem.useMutation({
    onSuccess: () => utils.supermercado.getLista.invalidate({ listaId: id }),
  })
  const updateListaMutation = trpc.supermercado.updateLista.useMutation({
    onSuccess: () => {
      utils.supermercado.getLista.invalidate({ listaId: id })
      utils.supermercado.listListas.invalidate()
      setEditEstado(false)
    },
  })

  const listaCast = lista as any

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-white/5 rounded-2xl border border-white/5" />
        <div className="h-64 bg-white/5 rounded-2xl border border-white/5" />
      </div>
    )
  }
  if (!listaCast) return null

  const items: any[] = listaCast.items ?? []
  const pendientes = items.filter((i: any) => !i.comprado)
  const comprados = items.filter((i: any) => i.comprado)
  const totalPendiente = pendientes.reduce((acc: number, i: any) => acc + Number(i.precioFinal ?? 0), 0)

  // Group pending by category
  const byCategoria = pendientes.reduce((acc: Record<string, any[]>, item: any) => {
    const cat = item.producto?.categoria || 'Sin categoría'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/degenerado-fiscal/supermercado')}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-100">{listaCast.nombre}</h1>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {listaCast.supermercado && (
              <span className="flex items-center gap-1"><Store size={11} />{listaCast.supermercado}</span>
            )}
            {listaCast.fechaCompra && (
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {format(new Date(listaCast.fechaCompra), "d MMM yyyy", { locale: es })}
              </span>
            )}
          </div>
        </div>

        {/* Estado toggle */}
        {!editEstado ? (
          <button
            onClick={() => setEditEstado(true)}
            className={cn(
              'text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-colors',
              listaCast.estado === 'ACTIVA'
                ? 'text-brand-400 bg-brand-500/10 border-brand-500/20 hover:bg-brand-500/20'
                : listaCast.estado === 'COMPLETADA'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-slate-500 bg-slate-500/10 border-slate-500/20',
            )}
          >
            {listaCast.estado}
          </button>
        ) : (
          <div className="flex gap-1">
            {(['ACTIVA', 'COMPLETADA', 'ARCHIVADA'] as const).map((e) => (
              <button
                key={e}
                onClick={() => updateListaMutation.mutate({ listaId: listaCast.id, estado: e })}
                className="text-[10px] font-bold px-2 py-1 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-colors"
              >
                {e}
              </button>
            ))}
            <button onClick={() => setEditEstado(false)} className="p-1 text-slate-600 hover:text-slate-400"><X size={14} /></button>
          </div>
        )}
      </div>

      {/* Totales rápidos */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <p className="text-[10px] text-slate-500 mb-1">Total</p>
          <p className="text-lg font-bold text-slate-100">
            ${Number(listaCast.montoTotal ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-[10px] text-slate-500 mb-1">Pendiente</p>
          <p className="text-lg font-bold text-amber-400">
            ${totalPendiente.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-[10px] text-slate-500 mb-1">Items</p>
          <p className="text-lg font-bold text-slate-100">
            {comprados.length}<span className="text-slate-600">/{items.length}</span>
          </p>
        </div>
      </div>

      {/* Agregar item */}
      <button
        onClick={() => setShowAddItem(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/15 text-slate-500 hover:text-slate-300 hover:border-brand-500/40 hover:bg-brand-500/5 transition-all text-sm font-medium"
      >
        <Plus size={15} />
        Agregar producto
      </button>

      {/* Items pendientes por categoría */}
      {pendientes.length > 0 && (
        <div className="space-y-3">
          {Object.entries(byCategoria).map(([cat, catItems]) => (
            <div key={cat}>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-1 mb-1.5">{cat}</p>
              <div className="space-y-1.5">
                {(catItems as any[]).map((item: any) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    supermercado={listaCast.supermercado}
                    onToggle={() => toggleMutation.mutate({ itemId: item.id, comprado: !item.comprado })}
                    onDelete={() => deleteMutation.mutate({ itemId: item.id })}
                    onCompare={() => setCompareProducto({ id: item.productoId, nombre: item.producto?.nombre ?? '' })}
                    onImage={() => setImageProducto({ id: item.productoId, nombre: item.producto?.nombre ?? '', imagen: item.producto?.imagen })}                    onEdit={() => setEditProducto(item.produto ?? null)}                    onEdit={() => setEditProducto(item.producto ?? null)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comprados */}
      {comprados.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-500" />
            En el carrito ({comprados.length})
          </p>
          <div className="space-y-1.5">
            <AnimatePresence>
              {comprados.map((item: any) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  supermercado={listaCast.supermercado}
                  onToggle={() => toggleMutation.mutate({ itemId: item.id, comprado: false })}
                  onDelete={() => deleteMutation.mutate({ itemId: item.id })}
                  onCompare={() => setCompareProducto({ id: item.productoId, nombre: item.producto?.nombre ?? '' })}
                  onImage={() => setImageProducto({ id: item.productoId, nombre: item.producto?.nombre ?? '', imagen: item.producto?.imagen })}
                  onEdit={() => setEditProducto(item.producto ?? null)}
                  checked
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="card p-10 text-center space-y-2">
          <ShoppingCart size={32} className="text-slate-700 mx-auto" />
          <p className="text-slate-500 text-sm">El carrito está vacío</p>
          <p className="text-slate-600 text-xs">Agregá productos con el botón de arriba</p>
        </div>
      )}

      {/* Modales */}
      <AddItemModal
        isOpen={showAddItem}
        listaId={listaCast.id}
        supermercado={listaCast.supermercado}
        onClose={() => setShowAddItem(false)}
        onSuccess={() => {
          setShowAddItem(false)
          utils.supermercado.getLista.invalidate({ listaId: id })
          utils.supermercado.listListas.invalidate()
        }}
      />

      {compareProducto && (
        <PriceCompareModal
          isOpen
          productoId={compareProducto.id}
          nombre={compareProducto.nombre}
          supermercadoActual={listaCast.supermercado}
          onClose={() => setCompareProducto(null)}
        />
      )}

      {imageProducto && (
        <ProductImageModal
          isOpen
          productoId={imageProducto.id}
          nombre={imageProducto.nombre}
          currentImage={imageProducto.imagen}
          onClose={() => setImageProducto(null)}
          onSuccess={(newUrl) => {
            utils.supermercado.getLista.invalidate({ listaId: id })
            setImageProducto(prev => prev ? { ...prev, imagen: newUrl } : null)
            if (newUrl === null) setImageProducto(null)
          }}
        />
      )}

      {editProducto && (
        <EditProductoModal
          isOpen
          producto={editProducto}
          onClose={() => setEditProducto(null)}
          onSuccess={() => utils.supermercado.getLista.invalidate({ listaId: id })}
        />
      )}
    </div>
  )
}

// ── Item Row ──────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: any
  supermercado?: string
  checked?: boolean
  onToggle: () => void
  onDelete: () => void
  onCompare: () => void
  onImage: () => void
  onEdit: () => void
}

function ItemRow({ item, checked, onToggle, onDelete, onCompare, onImage, onEdit }: ItemRowProps) {
  const imagen = item.producto?.imagen
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors group',
        checked
          ? 'border-white/5 bg-white/2 opacity-60'
          : 'border-white/8 bg-white/3 hover:border-white/12',
      )}
    >
      {/* Checkbox */}
      <button onClick={onToggle} className="shrink-0 transition-transform active:scale-90">
        {checked
          ? <CheckCircle2 size={18} className="text-emerald-400" />
          : <Circle size={18} className="text-slate-600 hover:text-brand-400 transition-colors" />
        }
      </button>

      {/* Thumbnail */}
      {imagen ? (
        <img
          src={`${API_URL}${imagen}`}
          alt={item.producto?.nombre}
          className="w-9 h-9 shrink-0 rounded-lg object-cover border border-white/10"
        />
      ) : (
        <button
          onClick={onImage}
          title="Agregar foto"
          className="w-9 h-9 shrink-0 rounded-lg border border-dashed border-white/10 bg-white/3 hover:border-brand-500/40 hover:bg-brand-500/5 flex items-center justify-center text-slate-700 hover:text-brand-400 transition-all opacity-0 group-hover:opacity-100"
        >
          <Camera size={13} />
        </button>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', checked ? 'line-through text-slate-500' : 'text-slate-200')}>
          {item.producto?.nombre ?? '—'}
          {item.producto?.marca && (
            <span className="ml-1.5 text-xs text-slate-600 font-normal">{item.producto.marca}</span>
          )}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>{Number(item.cantidad)} {item.unidad}</span>
          {item.precioUnitario != null && (
            <span>× ${Number(item.precioUnitario).toLocaleString('es-AR')}</span>
          )}
          {item.tienePromo && (
            <span className="text-amber-500 flex items-center gap-0.5">
              <Tag size={9} /> Promo
            </span>
          )}
        </div>
      </div>

      {/* Precio final */}
      <div className="flex items-center gap-2 shrink-0">
        <p className={cn('text-sm font-semibold', checked ? 'text-slate-500' : 'text-slate-100')}>
          ${Number(item.precioFinal ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
        </p>

        {/* Acciones */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {imagen && (
            <button
              onClick={onImage}
              title="Ver/cambiar foto"
              className="p-1.5 rounded-lg text-slate-600 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
            >
              <Camera size={13} />
            </button>
          )}
          <button
            onClick={onEdit}
            title="Editar producto"
            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-400 hover:bg-amber-400/10 transition-all"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onCompare}
            title="Comparar precios"
            className="p-1.5 rounded-lg text-slate-600 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
          >
            <BarChart2 size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
