import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/shared/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { trpc } from '../../../lib/trpc'
import { DollarSign, Trash2 } from 'lucide-react'
import { format, addMonths } from 'date-fns'
import { es } from 'date-fns/locale'

const schema = z.object({
  montoActual: z.number({ invalid_type_error: 'Ingresá un monto válido' }).positive('Debe ser positivo'),
  montoProximo: z.number({ invalid_type_error: 'Ingresá un monto válido' }).nonnegative().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface EditCierreManualModalProps {
  isOpen: boolean
  onClose: () => void
  tarjetaId: string
  mesActual: Date
  cierreExistente: { montoActual: number; montoProximo: number | null } | null
}

export function EditCierreManualModal({
  isOpen,
  onClose,
  tarjetaId,
  mesActual,
  cierreExistente,
}: EditCierreManualModalProps) {
  const utils = trpc.useUtils()
  const mesKey = format(mesActual, 'yyyy-MM')

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        montoActual: cierreExistente?.montoActual ?? undefined,
        montoProximo: cierreExistente?.montoProximo ?? undefined,
      })
    }
  }, [isOpen, cierreExistente, reset])

  const setCierreMutation = trpc.tarjetas.setCierre.useMutation({
    onSuccess: () => {
      utils.tarjetas.getById.invalidate({ id: tarjetaId })
      onClose()
    },
  })

  const deleteCierreMutation = trpc.tarjetas.deleteCierre.useMutation({
    onSuccess: () => {
      utils.tarjetas.getById.invalidate({ id: tarjetaId })
      onClose()
    },
  })

  const onSubmit = (data: FormData) => {
    setCierreMutation.mutate({
      tarjetaId,
      mes: mesKey,
      montoActual: data.montoActual,
      montoProximo: data.montoProximo ?? null,
    })
  }

  const handleDelete = () => {
    deleteCierreMutation.mutate({ tarjetaId, mes: mesKey })
  }

  const mesProximo = addMonths(mesActual, 1)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ingresar Cierre Real de Tarjeta">
      <div className="space-y-5">
        <p className="text-xs text-slate-400 leading-relaxed">
          Ingresá los montos que te informó la tarjeta para{' '}
          <span className="text-brand-400 font-bold capitalize">{format(mesActual, 'MMMM yyyy', { locale: es })}</span>.
          Estos valores reemplazan el estimado calculado y quedan guardados en el historial.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Cierre de{' '}
              <span className="text-brand-400 capitalize">
                {format(mesActual, 'MMMM yyyy', { locale: es })}
              </span>
              {' '}(mes en curso)
            </label>
            <Input
              placeholder="Ej: 423550"
              icon={<DollarSign size={18} />}
              error={errors.montoActual?.message}
              type="number"
              step="0.01"
              {...register('montoActual', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Cierre proyectado de{' '}
              <span className="text-slate-300 capitalize">
                {format(mesProximo, 'MMMM yyyy', { locale: es })}
              </span>
              {' '}(próximo mes — opcional)
            </label>
            <Input
              placeholder="Ej: 236880"
              icon={<DollarSign size={18} />}
              error={errors.montoProximo?.message}
              type="number"
              step="0.01"
              {...register('montoProximo', { valueAsNumber: true })}
            />
          </div>

          <div className="pt-2 flex gap-3">
            {cierreExistente && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteCierreMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all"
                title="Eliminar cierre de este mes"
              >
                <Trash2 size={14} />
                Borrar
              </button>
            )}
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={setCierreMutation.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}


const schema = z.object({
  montoActual: z.number({ invalid_type_error: 'Ingresá un monto válido' }).positive('Debe ser positivo'),
  montoProximo: z.number({ invalid_type_error: 'Ingresá un monto válido' }).nonnegative().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface EditCierreManualModalProps {
  isOpen: boolean
  onClose: () => void
  tarjetaId: string
  mesActual: Date
  cierreExistente: { montoActual: number; montoProximo: number | null } | null
}

export function EditCierreManualModal({
  isOpen,
  onClose,
  tarjetaId,
  mesActual,
  cierreExistente,
}: EditCierreManualModalProps) {
  const utils = trpc.useUtils()
  const mesKey = format(mesActual, 'yyyy-MM')

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        montoActual: cierreExistente?.montoActual ?? undefined,
        montoProximo: cierreExistente?.montoProximo ?? undefined,
      })
    }
  }, [isOpen, cierreExistente, reset])

  const setCierreMutation = trpc.tarjetas.setCierre.useMutation({
    onSuccess: () => {
      utils.tarjetas.getById.invalidate({ id: tarjetaId })
      onClose()
    },
  })

  const deleteCierreMutation = trpc.tarjetas.deleteCierre.useMutation({
    onSuccess: () => {
      utils.tarjetas.getById.invalidate({ id: tarjetaId })
      onClose()
    },
  })

  const onSubmit = (data: FormData) => {
    setCierreMutation.mutate({
      tarjetaId,
      mes: mesKey,
      montoActual: data.montoActual,
      montoProximo: data.montoProximo ?? null,
    })
  }

  const handleDelete = () => {
    deleteCierreMutation.mutate({ tarjetaId, mes: mesKey })
  }

  const mesProximo = addMonths(mesActual, 1)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ingresar Cierre Real de Tarjeta">
      <div className="space-y-5">
        <p className="text-xs text-slate-400 leading-relaxed">
          Ingresá los montos que te informó la tarjeta para{' '}
          <span className="text-brand-400 font-bold capitalize">{format(mesActual, 'MMMM yyyy', { locale: es })}</span>.
          Estos valores reemplazan el estimado calculado y quedan guardados en el historial.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Cierre de{' '}
              <span className="text-brand-400 capitalize">
                {format(mesActual, 'MMMM yyyy', { locale: es })}
              </span>
              {' '}(mes en curso)
            </label>
            <Input
              placeholder="Ej: 423550"
              icon={<DollarSign size={18} />}
              error={errors.montoActual?.message}
              type="number"
              step="0.01"
              {...register('montoActual', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Cierre proyectado de{' '}
              <span className="text-slate-300 capitalize">
                {format(mesProximo, 'MMMM yyyy', { locale: es })}
              </span>
              {' '}(próximo mes — opcional)
            </label>
            <Input
              placeholder="Ej: 236880"
              icon={<DollarSign size={18} />}
              error={errors.montoProximo?.message}
              type="number"
              step="0.01"
              {...register('montoProximo', { valueAsNumber: true })}
            />
          </div>

          <div className="pt-2 flex gap-3">
            {cierreExistente && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteCierreMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all"
                title="Eliminar cierre de este mes"
              >
                <Trash2 size={14} />
                Borrar
              </button>
            )}
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={setCierreMutation.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}


const schema = z.object({
  cierreActual: z.number({ invalid_type_error: 'Ingresá un monto válido' }).positive('Debe ser positivo'),
  cierreProximo: z.number({ invalid_type_error: 'Ingresá un monto válido' }).nonnegative('Debe ser 0 o positivo'),
})

type FormData = z.infer<typeof schema>

interface EditCierreManualModalProps {
  isOpen: boolean
  onClose: () => void
  tarjetaId: string
  /** Mes al que corresponde el cierre actual (selectedMonth) */
  mesActual: Date
  /** Valores actuales ya guardados (si existen) */
  cierreManualActual: number | null
  cierreManualProximo: number | null
  cierreManualMes: Date | null
}

export function EditCierreManualModal({
  isOpen,
  onClose,
  tarjetaId,
  mesActual,
  cierreManualActual,
  cierreManualProximo,
  cierreManualMes,
}: EditCierreManualModalProps) {
  const utils = trpc.useUtils()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cierreActual: cierreManualActual ?? undefined,
      cierreProximo: cierreManualProximo ?? undefined,
    },
  })

  // Sincronizar valores cuando se abre
  useEffect(() => {
    if (isOpen) {
      // Si el mes guardado coincide con el mes que estamos viendo, pre-cargar
      const mesCoincide =
        cierreManualMes &&
        cierreManualMes.getFullYear() === mesActual.getFullYear() &&
        cierreManualMes.getMonth() === mesActual.getMonth()

      reset({
        cierreActual: mesCoincide && cierreManualActual ? cierreManualActual : undefined,
        cierreProximo: mesCoincide && cierreManualProximo ? cierreManualProximo : undefined,
      })
    }
  }, [isOpen, cierreManualActual, cierreManualProximo, cierreManualMes, mesActual, reset])

  const updateMutation = trpc.tarjetas.update.useMutation({
    onSuccess: () => {
      utils.tarjetas.getById.invalidate({ id: tarjetaId })
      onClose()
    },
  })

  const onSubmit = (data: FormData) => {
    // Guardar la fecha del mes como YYYY-MM-01 (primer día del mes, timezone-safe)
    const mesStr = `${mesActual.getFullYear()}-${String(mesActual.getMonth() + 1).padStart(2, '0')}-01`
    updateMutation.mutate({
      id: tarjetaId,
      cierreManualMes: mesStr,
      cierreManualActual: data.cierreActual,
      cierreManualProximo: data.cierreProximo,
    })
  }

  const handleClear = () => {
    updateMutation.mutate({
      id: tarjetaId,
      cierreManualMes: null,
      cierreManualActual: null,
      cierreManualProximo: null,
    })
  }

  const mesProximo = addMonths(mesActual, 1)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ingresar Cierre Real de Tarjeta">
      <div className="space-y-5">
        <p className="text-xs text-slate-400 leading-relaxed">
          Ingresá los montos que te informó la tarjeta. Estos valores reemplazan el estimado calculado.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Cierre de{' '}
              <span className="text-brand-400 capitalize">
                {format(mesActual, 'MMMM yyyy', { locale: es })}
              </span>
              {' '}(mes en curso)
            </label>
            <Input
              placeholder="Ej: 423550"
              icon={<DollarSign size={18} />}
              error={errors.cierreActual?.message}
              type="number"
              step="0.01"
              {...register('cierreActual', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Cierre proyectado de{' '}
              <span className="text-slate-300 capitalize">
                {format(mesProximo, 'MMMM yyyy', { locale: es })}
              </span>
              {' '}(próximo mes)
            </label>
            <Input
              placeholder="Ej: 236880"
              icon={<DollarSign size={18} />}
              error={errors.cierreProximo?.message}
              type="number"
              step="0.01"
              {...register('cierreProximo', { valueAsNumber: true })}
            />
          </div>

          <div className="pt-2 flex gap-3">
            {(cierreManualActual !== null || cierreManualProximo !== null) && (
              <button
                type="button"
                onClick={handleClear}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all"
                title="Limpiar valores manuales"
              >
                <Trash2 size={14} />
                Limpiar
              </button>
            )}
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={updateMutation.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
