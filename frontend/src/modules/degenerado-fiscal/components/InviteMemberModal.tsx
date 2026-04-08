import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { Mail, Copy, Check, Clock, Send } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { sendBoardInviteEmail } from '../../../lib/emailjs'
import { useAuthStore } from '../../../store/authStore'

const schema = z.object({
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof schema>

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  boardId: string
  boardNombre: string
}

interface GeneratedInvite {
  codigo: string
  invitedEmail: string
  expiresAt: Date
  targetUser: { displayName: string | null; email: string } | null
}

export function InviteMemberModal({ isOpen, onClose, boardId, boardNombre }: InviteMemberModalProps) {
  const utils = trpc.useUtils()
  const user = useAuthStore((s) => s.user)
  const [generatedInvite, setGeneratedInvite] = useState<GeneratedInvite | null>(null)
  const [copied, setCopied] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const inviteMutation = trpc.boards.inviteUser.useMutation({
    onSuccess: async (data) => {
      utils.boards.getMany.invalidate()
      const invite: GeneratedInvite = {
        codigo: data.codigo!,
        invitedEmail: data.invitedEmail!,
        expiresAt: new Date(data.expiresAt),
        targetUser: data.targetUser ? {
          displayName: data.targetUser.displayName ?? null,
          email: data.targetUser.email,
        } : null,
      }
      setGeneratedInvite(invite)

      // Enviar email con EmailJS
      try {
        await sendBoardInviteEmail({
          to_email: data.invitedEmail!,
          board_name: boardNombre,
          invitation_code: data.codigo!,
          expires_at: format(new Date(data.expiresAt), "d 'de' MMMM 'a las' HH:mm", { locale: es }),
          invited_by: user?.displayName ?? user?.email ?? 'Un usuario',          user_email: user?.email ?? '',        })
        setEmailSent(true)
      } catch {
        setEmailError('El código fue generado pero no se pudo enviar el email.')
      }
    },
  })

  const handleClose = () => {
    setGeneratedInvite(null)
    setEmailSent(false)
    setEmailError(null)
    reset()
    onClose()
  }

  const onSubmit = (data: FormData) => {
    inviteMutation.mutate({ boardId, email: data.email })
  }

  const handleCopy = async () => {
    if (!generatedInvite) return
    await navigator.clipboard.writeText(generatedInvite.codigo)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Invitar a "${boardNombre}"`}>
      {!generatedInvite ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-slate-400">
            Ingresá el email del usuario que querés invitar. Se generará un código de 8 caracteres válido por 7 días.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email del usuario</label>
            <Input
              {...register('email')}
              type="email"
              placeholder="usuario@email.com"
              icon={<Mail size={16} />}
              error={errors.email?.message}
            />
          </div>

          {inviteMutation.error && (
            <p className="text-sm text-red-400">{inviteMutation.error.message}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" isLoading={inviteMutation.isPending} className="flex-1">
              Generar código
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-4 text-center space-y-3">
            <p className="text-sm text-slate-400">Código de invitación para</p>
            <p className="font-medium text-slate-200">{generatedInvite.invitedEmail}</p>
            {generatedInvite.targetUser && (
              <p className="text-xs text-slate-500">
                ({generatedInvite.targetUser.displayName ?? generatedInvite.targetUser.email} ya existe en el sistema)
              </p>
            )}

            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold tracking-widest text-brand-400 bg-surface-950 px-4 py-2 rounded-lg border border-white/10">
                {generatedInvite.codigo}
              </span>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-200"
                title="Copiar código"
              >
                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Clock size={12} />
              <span>
                Expira el {format(generatedInvite.expiresAt, "d 'de' MMMM 'a las' HH:mm", { locale: es })}
              </span>
            </div>
          </div>

          {emailSent && (
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
              <Send size={14} />
              <span>Email enviado a <strong>{generatedInvite.invitedEmail}</strong></span>
            </div>
          )}

          {emailError && (
            <p className="text-xs text-amber-400 text-center">{emailError}</p>
          )}

          {!emailSent && !emailError && (
            <p className="text-xs text-slate-500 text-center">
              Compartí este código con el usuario. Lo pueden ingresar en "Unirse a un Board" para acceder.
            </p>
          )}

          <Button onClick={handleClose} className="w-full">
            Listo
          </Button>
        </div>
      )}
    </Modal>
  )
}
