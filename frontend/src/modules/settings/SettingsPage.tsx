import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { trpc } from '../../lib/trpc'
import { useAuthStore } from '../../store/authStore'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Requerido'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Requerido'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof changePasswordSchema>

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      updateUser({ mustChangePassword: false })
      setSuccess(true)
      reset()
    },
  })

  const onSubmit = (data: FormData) => {
    setSuccess(false)
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Configuración</h1>
        <p className="text-sm text-slate-500 mt-1">Gestioná tu cuenta y seguridad</p>
      </div>

      {/* Banner de alerta si tiene contraseña provisoria */}
      {user?.mustChangePassword && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400"
        >
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Contraseña provisoria activa</p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              Estás usando una contraseña temporal. Por seguridad, cambiala ahora antes de continuar.
            </p>
          </div>
        </motion.div>
      )}

      {/* Card cambio de contraseña */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center">
            <Lock size={18} className="text-brand-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100">Cambiar contraseña</h2>
            <p className="text-xs text-slate-500">Mínimo 8 caracteres</p>
          </div>
        </div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm"
          >
            <CheckCircle2 size={16} />
            Contraseña actualizada correctamente.
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Contraseña actual */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Contraseña actual
            </label>
            <div className="relative">
              <input
                {...register('currentPassword')}
                type={showCurrent ? 'text' : 'password'}
                placeholder="••••••••"
                className="input-base pr-12"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-400">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showNew ? 'text' : 'password'}
                placeholder="••••••••"
                className="input-base pr-12"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-400">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirmar nueva contraseña */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                className="input-base pr-12"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {changePasswordMutation.error && (
            <p className="text-sm text-red-400">{changePasswordMutation.error.message}</p>
          )}

          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="btn-primary w-full"
          >
            {changePasswordMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              'Guardar nueva contraseña'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
