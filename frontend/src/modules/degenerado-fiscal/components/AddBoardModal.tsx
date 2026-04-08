import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { Users, FileText } from 'lucide-react'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddBoardModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: any | null
}

export function AddBoardModal({ isOpen, onClose, initialData }: AddBoardModalProps) {
  const utils = trpc.useUtils()
  const isEdit = !!initialData

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', descripcion: '' },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({ nombre: initialData.nombre ?? '', descripcion: initialData.descripcion ?? '' })
      } else {
        reset({ nombre: '', descripcion: '' })
      }
    }
  }, [isOpen, initialData])

  const invalidate = () => utils.boards.getMany.invalidate()

  const createMutation = trpc.boards.create.useMutation({ onSuccess: () => { invalidate(); onClose() } })
  const updateMutation = trpc.boards.update.useMutation({ onSuccess: () => { invalidate(); onClose() } })

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate({ id: initialData.id, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar Board' : 'Nuevo Board'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Nombre del Board</label>
          <Input
            {...register('nombre')}
            placeholder="Ej: Gastos del depto"
            icon={<Users size={16} />}
            error={errors.nombre?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Descripción (opcional)</label>
          <Input
            {...register('descripcion')}
            placeholder="Para qué sirve este board..."
            icon={<FileText size={16} />}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {isEdit ? 'Guardar Cambios' : 'Crear Board'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
