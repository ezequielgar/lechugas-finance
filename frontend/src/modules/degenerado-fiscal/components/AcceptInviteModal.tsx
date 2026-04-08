import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { Key, CheckCircle } from 'lucide-react'
import { useState } from 'react'

const schema = z.object({
  codigo: z.string().length(8, 'El código debe tener exactamente 8 caracteres'),
})

type FormData = z.infer<typeof schema>

interface AcceptInviteModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AcceptInviteModal({ isOpen, onClose }: AcceptInviteModalProps) {
  const utils = trpc.useUtils()
  const [success, setSuccess] = useState<{ boardNombre: string } | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { codigo: '' },
  })

  const acceptMutation = trpc.boards.acceptInvitation.useMutation({
    onSuccess: (data) => {
      utils.boards.getMany.invalidate()
      setSuccess({ boardNombre: data.boardNombre })
    },
  })

  const handleClose = () => {
    setSuccess(null)
    reset()
    onClose()
  }

  const onSubmit = (data: FormData) => {
    acceptMutation.mutate({ codigo: data.codigo.toLowerCase() })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Unirse a un Board">
      {!success ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-slate-400">
            Ingresá el código de 8 caracteres que te compartió el dueño del board.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Código de invitación</label>
            <Input
              {...register('codigo')}
              placeholder="ej: a1b2c3d4"
              icon={<Key size={16} />}
              error={errors.codigo?.message}
              className="font-mono tracking-widest text-center uppercase"
              maxLength={8}
            />
          </div>

          {acceptMutation.error && (
            <p className="text-sm text-red-400">{acceptMutation.error.message}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" isLoading={acceptMutation.isPending} className="flex-1">
              Unirme al Board
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle size={48} className="text-green-400" />
            <div>
              <p className="text-lg font-semibold text-slate-100">¡Te uniste!</p>
              <p className="text-sm text-slate-400 mt-1">
                Ahora sos miembro del board <span className="text-brand-400 font-medium">"{success.boardNombre}"</span>
              </p>
            </div>
          </div>
          <Button onClick={handleClose} className="w-full">
            Ver mis Boards
          </Button>
        </div>
      )}
    </Modal>
  )
}
