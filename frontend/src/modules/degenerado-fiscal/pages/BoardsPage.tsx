import { useState } from 'react'
import { trpc } from '../../../lib/trpc'
import { AddBoardModal } from '../components/AddBoardModal'
import { InviteMemberModal } from '../components/InviteMemberModal'
import { AcceptInviteModal } from '../components/AcceptInviteModal'
import { AddMovimientoBoardModal } from '../components/AddMovimientoBoardModal'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../store/authStore'
import {
  Plus, Users, ArrowLeft, ArrowUpCircle, ArrowDownCircle,
  TrendingUp, TrendingDown, Wallet, Pencil, Trash2,
  UserPlus, Key, Crown, Shield, User as UserIcon,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ── Types ─────────────────────────────────────────────────────────────────────

type BoardMember = {
  id: string
  userId: string
  porcentaje: number
  rol: 'ADMIN' | 'MIEMBRO'
  user: { id: string; displayName: string | null; username: string; avatarUrl: string | null }
}

type BoardMovimiento = {
  id: string
  descripcion: string
  tipo: 'INGRESO' | 'GASTO'
  monto: string | number
  moneda: string
  fecha: string
  distribucion: string | null
  notas: string | null
}

type Board = {
  id: string
  nombre: string
  descripcion: string | null
  ownerId: string
  members: BoardMember[]
  movimientos: BoardMovimiento[]
  invitations: Array<{
    id: string
    invitedEmail: string
    codigo: string
    estado: string
    expiresAt: string
  }>
  owner: { id: string; displayName: string | null; username: string }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function AvatarBadge({ user, size = 'sm' }: { user: { displayName: string | null; username: string }; size?: 'sm' | 'md' }) {
  const initials = (user.displayName ?? user.username).slice(0, 2).toUpperCase()
  return (
    <div className={cn(
      'rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center font-bold text-brand-400',
      size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
    )}>
      {initials}
    </div>
  )
}

function RolIcon({ rol, isOwner }: { rol: 'ADMIN' | 'MIEMBRO'; isOwner: boolean }) {
  if (isOwner) return <span title="Owner"><Crown size={12} className="text-yellow-400" /></span>
  if (rol === 'ADMIN') return <span title="Admin"><Shield size={12} className="text-brand-400" /></span>
  return <span title="Miembro"><UserIcon size={12} className="text-slate-500" /></span>
}

// ── BoardCard ─────────────────────────────────────────────────────────────────

function BoardCard({ board, onSelect }: { board: Board; onSelect: () => void }) {
  const totalIngresos = board.movimientos.filter(m => m.tipo === 'INGRESO').reduce((s, m) => s + Number(m.monto), 0)
  const totalGastos = board.movimientos.filter(m => m.tipo === 'GASTO').reduce((s, m) => s + Number(m.monto), 0)
  const balance = totalIngresos - totalGastos
  const recentMovs = board.movimientos.slice(0, 3)

  return (
    <button
      onClick={onSelect}
      className="card p-5 text-left hover:border-brand-500/40 transition-all group w-full space-y-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-100 group-hover:text-brand-400 transition-colors truncate">
            {board.nombre}
          </h3>
          {board.descripcion && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{board.descripcion}</p>
          )}
        </div>
        <div className="flex -space-x-2">
          {board.members.slice(0, 4).map((m) => (
            <AvatarBadge key={m.id} user={m.user} size="sm" />
          ))}
          {board.members.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-slate-400">
              +{board.members.length - 4}
            </div>
          )}
        </div>
      </div>

      {/* Balance rápido */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-green-500/10 rounded-lg p-2 text-center">
          <p className="text-[9px] text-green-400 font-bold uppercase tracking-wider">Ingresos</p>
          <p className="text-xs font-bold text-green-400">${totalIngresos.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-2 text-center">
          <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider">Gastos</p>
          <p className="text-xs font-bold text-red-400">${totalGastos.toLocaleString('es-AR')}</p>
        </div>
        <div className={cn('rounded-lg p-2 text-center', balance >= 0 ? 'bg-brand-500/10' : 'bg-orange-500/10')}>
          <p className={cn('text-[9px] font-bold uppercase tracking-wider', balance >= 0 ? 'text-brand-400' : 'text-orange-400')}>Balance</p>
          <p className={cn('text-xs font-bold', balance >= 0 ? 'text-brand-400' : 'text-orange-400')}>
            {balance >= 0 ? '+' : '-'}${Math.abs(balance).toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {recentMovs.length > 0 && (
        <div className="space-y-1">
          {recentMovs.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs py-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                {m.tipo === 'INGRESO'
                  ? <ArrowUpCircle size={12} className="text-green-400 flex-shrink-0" />
                  : <ArrowDownCircle size={12} className="text-red-400 flex-shrink-0" />}
                <span className="text-slate-400 truncate">{m.descripcion}</span>
              </div>
              <span className={cn('font-medium flex-shrink-0 ml-2', m.tipo === 'INGRESO' ? 'text-green-400' : 'text-red-400')}>
                {m.tipo === 'INGRESO' ? '+' : '-'}${Number(m.monto).toLocaleString('es-AR')}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-slate-600">
        <span>{board.members.length} miembro{board.members.length !== 1 ? 's' : ''}</span>
        <span>{board.movimientos.length} movimiento{board.movimientos.length !== 1 ? 's' : ''}</span>
      </div>
    </button>
  )
}

// ── BoardDetail ───────────────────────────────────────────────────────────────

function BoardDetail({
  board,
  onBack,
}: {
  board: Board
  onBack: () => void
}) {
  const utils = trpc.useUtils()
  const currentUser = useAuthStore((s) => s.user)
  const [movModal, setMovModal] = useState(false)
  const [editMovData, setEditMovData] = useState<any | null>(null)
  const [editBoardModal, setEditBoardModal] = useState(false)
  const [inviteModal, setInviteModal] = useState(false)
  const [showInvitations, setShowInvitations] = useState(false)
  const [showPercentages, setShowPercentages] = useState(false)

  const isOwner = board.ownerId === currentUser?.id
  const currentMember = board.members.find((m) => m.userId === currentUser?.id)
  const isAdmin = isOwner || currentMember?.rol === 'ADMIN'

  const deleteBoardMutation = trpc.boards.delete.useMutation({
    onSuccess: () => { utils.boards.getMany.invalidate(); onBack() },
  })
  const deleteMovMutation = trpc.boards.deleteMovimiento.useMutation({
    onSuccess: () => utils.boards.getMany.invalidate(),
  })
  const removeMemberMutation = trpc.boards.removeMember.useMutation({
    onSuccess: () => utils.boards.getMany.invalidate(),
  })
  const revokeInviteMutation = trpc.boards.revokeInvitation.useMutation({
    onSuccess: () => utils.boards.getMany.invalidate(),
  })
  const updatePctMutation = trpc.boards.updateMemberPercentage.useMutation({
    onSuccess: () => utils.boards.getMany.invalidate(),
  })

  // Calc resumen
  const totalIngresos = board.movimientos.filter(m => m.tipo === 'INGRESO').reduce((s, m) => s + Number(m.monto), 0)
  const totalGastos = board.movimientos.filter(m => m.tipo === 'GASTO').reduce((s, m) => s + Number(m.monto), 0)
  const balance = totalIngresos - totalGastos

  // Per-member breakdown from distribucion JSON
  const memberBreakdown = board.members.map((member) => {
    let ingresos = 0, gastos = 0
    for (const mov of board.movimientos) {
      if (!mov.distribucion) continue
      try {
        const dist: Array<{ userId: string; monto: number }> = JSON.parse(mov.distribucion)
        const entry = dist.find((d) => d.userId === member.userId)
        if (entry) {
          if (mov.tipo === 'INGRESO') ingresos += entry.monto
          else gastos += entry.monto
        }
      } catch { /* skip */ }
    }
    return { ...member, ingresos, gastos, balance: ingresos - gastos }
  })

  const memberProps = board.members.map((m) => ({
    userId: m.userId,
    displayName: m.user.displayName,
    username: m.user.username,
    porcentaje: Number(m.porcentaje),
  }))

  const handleEditMov = (m: any) => { setEditMovData(m); setMovModal(true) }
  const handleCloseMovModal = () => { setEditMovData(null); setMovModal(false) }

  const pendingInvites = board.invitations.filter((i) => i.estado === 'PENDIENTE')

  return (
    <div className="space-y-6">
      {/* Modals */}
      <AddMovimientoBoardModal
        isOpen={movModal}
        onClose={handleCloseMovModal}
        boardId={board.id}
        boardMembers={memberProps}
        initialData={editMovData}
      />
      <AddBoardModal
        isOpen={editBoardModal}
        onClose={() => setEditBoardModal(false)}
        initialData={board}
      />
      <InviteMemberModal
        isOpen={inviteModal}
        onClose={() => setInviteModal(false)}
        boardId={board.id}
        boardNombre={board.nombre}
      />

      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-1 p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-100">{board.nombre}</h2>
            {isOwner && <span title="Sos el owner"><Crown size={14} className="text-yellow-400" /></span>}
          </div>
          {board.descripcion && (
            <p className="text-sm text-slate-500 mt-0.5">{board.descripcion}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setInviteModal(true)}>
                <UserPlus size={15} className="mr-1" /> Invitar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditBoardModal(true)}>
                <Pencil size={14} />
              </Button>
            </>
          )}
          {isOwner && (
            <button
              onClick={() => {
                if (confirm(`¿Eliminar el board "${board.nombre}"? Esta acción no se puede deshacer.`)) {
                  deleteBoardMutation.mutate({ id: board.id })
                }
              }}
              className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <TrendingUp size={18} className="text-green-400 mx-auto mb-1" />
          <p className="text-xs text-slate-500 font-medium">Ingresos</p>
          <p className="text-lg font-bold text-green-400">${totalIngresos.toLocaleString('es-AR')}</p>
        </div>
        <div className="card p-4 text-center">
          <TrendingDown size={18} className="text-red-400 mx-auto mb-1" />
          <p className="text-xs text-slate-500 font-medium">Gastos</p>
          <p className="text-lg font-bold text-red-400">${totalGastos.toLocaleString('es-AR')}</p>
        </div>
        <div className="card p-4 text-center">
          <Wallet size={18} className={cn('mx-auto mb-1', balance >= 0 ? 'text-brand-400' : 'text-orange-400')} />
          <p className="text-xs text-slate-500 font-medium">Balance</p>
          <p className={cn('text-lg font-bold', balance >= 0 ? 'text-brand-400' : 'text-orange-400')}>
            {balance >= 0 ? '+' : '-'}${Math.abs(balance).toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Miembros */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Users size={15} className="text-brand-400" />
            Miembros ({board.members.length})
          </h3>
          {isAdmin && (
            <button
              onClick={() => setShowPercentages(!showPercentages)}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              {showPercentages ? 'Ocultar %' : 'Editar %'}
              {showPercentages ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
        <div className="space-y-2">
          {memberBreakdown.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
              <AvatarBadge user={m.user} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-slate-200 truncate">
                    {m.user.displayName ?? m.user.username}
                  </span>
                  <RolIcon rol={m.rol} isOwner={board.ownerId === m.userId} />
                  {m.userId === currentUser?.id && (
                    <span className="text-[9px] font-bold text-brand-400 bg-brand-500/10 px-1.5 rounded">Vos</span>
                  )}
                </div>
                {showPercentages ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      defaultValue={Number(m.porcentaje)}
                      min={0}
                      max={100}
                      step={0.01}
                      className="w-20 text-xs bg-surface-800 border border-white/10 rounded px-2 py-0.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      onBlur={(e) => {
                        const newVal = parseFloat(e.target.value)
                        if (!isNaN(newVal) && newVal !== Number(m.porcentaje)) {
                          updatePctMutation.mutate({ boardId: board.id, userId: m.userId, porcentaje: newVal })
                        }
                      }}
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                    <span className="text-green-400">+${m.ingresos.toLocaleString('es-AR')}</span>
                    <span className="text-red-400">-${m.gastos.toLocaleString('es-AR')}</span>
                    <span className={m.balance >= 0 ? 'text-brand-400' : 'text-orange-400'}>
                      = {m.balance >= 0 ? '+' : '-'}${Math.abs(m.balance).toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-brand-400">{Number(m.porcentaje).toFixed(0)}%</p>
                {isAdmin && board.ownerId !== m.userId && m.userId !== currentUser?.id && (
                  <button
                    onClick={() => {
                      if (confirm(`¿Remover a ${m.user.displayName ?? m.user.username} del board?`)) {
                        removeMemberMutation.mutate({ boardId: board.id, userId: m.userId })
                      }
                    }}
                    className="text-[10px] text-red-400/50 hover:text-red-400 transition-colors mt-0.5"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Invitaciones pendientes */}
        {isAdmin && pendingInvites.length > 0 && (
          <div>
            <button
              onClick={() => setShowInvitations(!showInvitations)}
              className="text-xs text-yellow-400/70 hover:text-yellow-400 flex items-center gap-1"
            >
              {pendingInvites.length} invitación{pendingInvites.length !== 1 ? 'es' : ''} pendiente{pendingInvites.length !== 1 ? 's' : ''}
              {showInvitations ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showInvitations && (
              <div className="mt-2 space-y-1.5">
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-xs bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-slate-300">{inv.invitedEmail}</span>
                      <span className="text-slate-600 ml-2">· {inv.codigo}</span>
                    </div>
                    <button
                      onClick={() => revokeInviteMutation.mutate({ id: inv.id })}
                      className="text-red-400/50 hover:text-red-400 transition-colors ml-3"
                    >
                      Cancelar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Movimientos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">
            Movimientos ({board.movimientos.length})
          </h3>
          <Button size="sm" onClick={() => setMovModal(true)}>
            <Plus size={14} className="mr-1" /> Agregar
          </Button>
        </div>

        {board.movimientos.length === 0 ? (
          <div className="card p-8 text-center">
            <Wallet size={32} className="text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No hay movimientos aún.</p>
            <p className="text-xs text-slate-600">Agregá el primero con el botón de arriba.</p>
          </div>
        ) : (
          <div className="card divide-y divide-white/5">
            {board.movimientos.map((m) => {
              let dist: Array<{ userId: string; displayName: string; monto: number; porcentaje: number }> = []
              try { if (m.distribucion) dist = JSON.parse(m.distribucion) } catch { /* skip */ }

              return (
                <div key={m.id} className="p-4 hover:bg-white/2 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                        m.tipo === 'INGRESO' ? 'bg-green-500/15' : 'bg-red-500/15'
                      )}>
                        {m.tipo === 'INGRESO'
                          ? <ArrowUpCircle size={17} className="text-green-400" />
                          : <ArrowDownCircle size={17} className="text-red-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{m.descripcion}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {format(new Date(m.fecha), "d 'de' MMM yyyy", { locale: es })}
                          {m.notas && <span className="ml-2 italic">· {m.notas}</span>}
                        </p>
                        {dist.length > 0 && (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            {dist.map((d) => (
                              <span key={d.userId} className="text-[10px] text-slate-600">
                                {d.displayName}: <span className="text-slate-400">${d.monto.toLocaleString('es-AR')}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn('text-base font-bold', m.tipo === 'INGRESO' ? 'text-green-400' : 'text-red-400')}>
                        {m.tipo === 'INGRESO' ? '+' : '-'}{m.moneda} ${Number(m.monto).toLocaleString('es-AR')}
                      </span>
                      <button onClick={() => handleEditMov(m)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar este movimiento?')) {
                            deleteMovMutation.mutate({ id: m.id })
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function BoardsPage() {
  const [boardModal, setBoardModal] = useState(false)
  const [acceptModal, setAcceptModal] = useState(false)
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)

  const { data: boards = [], isLoading } = trpc.boards.getMany.useQuery()
  const boardsRaw = boards as unknown as Board[]

  // Si hay un board seleccionado actualmente, actualizarlo con los últimos datos
  const activeBoard = selectedBoard
    ? (boardsRaw.find((b) => b.id === selectedBoard.id) ?? null)
    : null

  if (activeBoard && activeBoard !== selectedBoard) {
    // Sincronizar referencia cuando llegan nuevos datos
  }

  const currentUser = useAuthStore((s) => s.user)
  const myBoards = boardsRaw.filter((b) => b.ownerId === currentUser?.id)
  const memberBoards = boardsRaw.filter((b) => b.ownerId !== currentUser?.id)

  // Stats globales
  const totalIngresos = boardsRaw.reduce((s, b) => s + b.movimientos.filter(m => m.tipo === 'INGRESO').reduce((a, m) => a + Number(m.monto), 0), 0)
  const totalGastos = boardsRaw.reduce((s, b) => s + b.movimientos.filter(m => m.tipo === 'GASTO').reduce((a, m) => a + Number(m.monto), 0), 0)

  if (activeBoard) {
    return (
      <BoardDetail
        board={activeBoard}
        onBack={() => setSelectedBoard(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Modals */}
      <AddBoardModal isOpen={boardModal} onClose={() => setBoardModal(false)} />
      <AcceptInviteModal isOpen={acceptModal} onClose={() => setAcceptModal(false)} />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users size={18} className="text-brand-400" /> Boards Compartidos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestioná gastos e ingresos con otras personas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setAcceptModal(true)}>
            <Key size={14} className="mr-1" /> Unirme con código
          </Button>
          <Button size="sm" onClick={() => setBoardModal(true)}>
            <Plus size={14} className="mr-1" /> Nuevo Board
          </Button>
        </div>
      </div>

      {/* Stats globales */}
      {boardsRaw.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-xs text-slate-500">Boards</p>
            <p className="text-xl font-bold text-brand-400">{boardsRaw.length}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-slate-500">Ingresos totales</p>
            <p className="text-lg font-bold text-green-400">${totalIngresos.toLocaleString('es-AR')}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-slate-500">Gastos totales</p>
            <p className="text-lg font-bold text-red-400">${totalGastos.toLocaleString('es-AR')}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mr-3" />
          Cargando boards...
        </div>
      )}

      {!isLoading && boardsRaw.length === 0 && (
        <div className="card p-12 text-center space-y-3">
          <Users size={40} className="text-slate-700 mx-auto" />
          <div>
            <p className="text-base font-semibold text-slate-400">Todavía no tenés boards</p>
            <p className="text-sm text-slate-600 mt-1">
              Creá uno nuevo o unite a uno existente con un código de invitación.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="ghost" onClick={() => setAcceptModal(true)}>
              <Key size={14} className="mr-1" /> Tengo un código
            </Button>
            <Button onClick={() => setBoardModal(true)}>
              <Plus size={14} className="mr-1" /> Crear Board
            </Button>
          </div>
        </div>
      )}

      {/* Mis boards */}
      {myBoards.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Crown size={11} className="text-yellow-400" /> Mis Boards
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myBoards.map((board) => (
              <BoardCard key={board.id} board={board} onSelect={() => setSelectedBoard(board)} />
            ))}
          </div>
        </div>
      )}

      {/* Boards en los que soy miembro */}
      {memberBoards.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Users size={11} /> Boards donde participo
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberBoards.map((board) => (
              <BoardCard key={board.id} board={board} onSelect={() => setSelectedBoard(board)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
