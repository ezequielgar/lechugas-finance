import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, CreditCard, Trash2, Calendar, Landmark } from 'lucide-react'
import { trpc } from '../../../lib/trpc'
import { AddTarjetaModal } from '../components/AddTarjetaModal'
import { AddConsumoModal } from '../components/AddConsumoModal'
import { Button } from '../../../components/ui/Button'

export function TarjetasPage() {
  const navigate = useNavigate()
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [isAddConsumoOpen, setIsAddConsumoOpen] = useState(false)
  const [selectedTarjeta, setSelectedTarjeta] = useState<{ id: string; nombre: string } | null>(null)

  const { data: tarjetas, isLoading, refetch } = trpc.tarjetas.getMany.useQuery()

  const deleteMutation = trpc.tarjetas.delete.useMutation({
    onSuccess: () => refetch()
  })

  const handleDeleteCard = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta tarjeta? Se borrarán todos sus consumos.')) {
      deleteMutation.mutate({ id })
    }
  }

  const handleAddConsumo = (id: string, nombre: string) => {
    setSelectedTarjeta({ id, nombre })
    setIsAddConsumoOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Mis Tarjetas</h2>
          <p className="text-sm text-slate-500">Gestioná tus tarjetas de crédito y débito.</p>
        </div>
        <Button onClick={() => setIsAddCardOpen(true)} className="gap-2">
          <Plus size={18} />
          Agregar Tarjeta
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-48 animate-pulse bg-white/5 border-white/5" />
          ))}
        </div>
      ) : tarjetas?.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center gap-4 bg-surface-900 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
            <CreditCard size={32} className="text-brand-500/50" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-300">No tenés tarjetas registradas</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
              Cargá tu primera tarjeta para empezar a trackear tus consumos y cuotas.
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsAddCardOpen(true)} className="mt-2">
            Crear mi primera tarjeta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tarjetas?.map((tarjeta) => (
            <div
              key={tarjeta.id}
              className="group relative overflow-hidden flex flex-col justify-between p-6 rounded-3xl bg-surface-900 border border-white/10 hover:border-brand-500/20 transition-all duration-300 shadow-sm"
              style={{
                boxShadow: `0 4px 20px -2px ${tarjeta.color}05`,
              }}
            >
              {/* Decoración de fondo */}
              <div 
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-2xl"
                style={{ backgroundColor: tarjeta.color || '#22c55e' }}
              />

              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${tarjeta.color}15`, border: `1px solid ${tarjeta.color}30` }}
                    >
                      <Landmark size={20} style={{ color: tarjeta.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100">{tarjeta.nombreTarjeta}</h3>
                      <p className="text-xs text-slate-500">{tarjeta.nombreEntidad}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleDeleteCard(tarjeta.id)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Eliminar tarjeta"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Tipo / Red</span>
                      <span className="text-xs font-semibold text-slate-400">{tarjeta.tipo} - {tarjeta.red}</span>
                   </div>
                   {tarjeta.ultimos4 && (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Número</span>
                        <span className="text-sm font-mono text-slate-300">•••• {tarjeta.ultimos4}</span>
                      </div>
                   )}
                </div>
              </div>

              <div className="mt-8 flex gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleAddConsumo(tarjeta.id, tarjeta.nombreTarjeta)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 transition-all border border-brand-500/10"
                >
                  <Plus size={14} />
                  CARGAR CONSUMO
                </button>
                <button
                  onClick={() => navigate(`/degenerado-fiscal/tarjetas/${tarjeta.id}`)}
                  className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-300 bg-white/5 hover:bg-white/10 transition-all"
                  title="Ver movimientos"
                >
                  <Calendar size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddTarjetaModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onSuccess={() => refetch()}
      />

      <AddConsumoModal
        isOpen={isAddConsumoOpen}
        onClose={() => setIsAddConsumoOpen(false)}
        onSuccess={() => refetch()}
        tarjetaId={selectedTarjeta?.id || ''}
        tarjetaNombre={selectedTarjeta?.nombre || ''}
      />
    </div>
  )
}
