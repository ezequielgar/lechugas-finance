import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Leaf, UserPlus, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { trpc } from '../../lib/trpc'
import { useAuthStore } from '../../store/authStore'

const schema = z.object({
  email: z.string().email('Email inválido'),
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y guion bajo'),
  displayName: z.string().min(2, 'Mínimo 2 caracteres').max(50).optional(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const passwordStrength = (pwd: string) => {
  if (!pwd) return { label: '', color: '' }
  if (pwd.length < 8) return { label: 'Muy corta', color: 'text-red-400' }
  const score = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pwd)).length
  if (score === 0) return { label: 'Débil', color: 'text-orange-400' }
  if (score === 1) return { label: 'Normal', color: 'text-yellow-400' }
  if (score === 2) return { label: 'Fuerte', color: 'text-brand-400' }
  return { label: 'Muy fuerte', color: 'text-brand-300' }
}

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const watchedPassword = watch('password', '')
  const strength = passwordStrength(watchedPassword)

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      if (data.pendingApproval || !data.accessToken) {
        setPendingApproval(true)
      } else {
        setAuth(data.user as any, data.accessToken)
        navigate('/dashboard', { replace: true })
      }
    },
    onError: (err) => setServerError(err.message),
  })

  const onSubmit = ({ confirmPassword, ...data }: FormData) => {
    setServerError(null)
    registerMutation.mutate(data)
  }

  const fields = [
    { name: 'displayName' as const, label: 'Nombre para mostrar', placeholder: 'Ej: Juan García', optional: true },
    { name: 'email' as const,       label: 'Email', placeholder: 'tu@email.com' },
    { name: 'username' as const,    label: 'Nombre de usuario', placeholder: 'ej: juangarcia_99' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      {pendingApproval ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md relative"
        >
          <div className="card p-5 sm:p-8 shadow-2xl shadow-black/40 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mx-auto">
              <Clock size={32} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Cuenta creada</h2>
              <p className="text-sm text-slate-400 mt-2">
                Tu solicitud fue enviada. Un administrador debe aprobar tu cuenta antes de que puedas ingresar.
              </p>
            </div>
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-yellow-400/80">
                Cuando tu cuenta sea aprobada, podrás iniciar sesión con tu email y contraseña.
              </p>
            </div>
            <Link
              to="/login"
              className="block w-full text-center px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
            >
              Ir al Login
            </Link>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md relative"
        >
        <div className="card p-5 sm:p-8 shadow-2xl shadow-black/40">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center glow-brand">
              <Leaf size={28} className="text-brand-400" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-100">Crear cuenta</h1>
              <p className="text-sm text-slate-500 mt-1">
                Unite a <span className="text-brand-500 font-semibold">Lechugas Finance</span>
              </p>
            </div>
          </div>

          {/* Error servidor */}
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <AlertCircle size={16} className="shrink-0" />
              {serverError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {fields.map(({ name, label, placeholder, optional }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  {label}
                  {optional && <span className="text-slate-600 text-xs ml-1">(opcional)</span>}
                </label>
                <input
                  {...register(name)}
                  placeholder={placeholder}
                  className="input-base"
                />
                {errors[name] && (
                  <p className="mt-1.5 text-xs text-red-400">{errors[name]?.message}</p>
                )}
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className="input-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {watchedPassword && (
                <p className={`mt-1.5 text-xs font-medium ${strength.color}`}>
                  Seguridad: {strength.label}
                </p>
              )}
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Confirmar contraseña</label>
              <input
                {...register('confirmPassword')}
                type={showPass ? 'text' : 'password'}
                placeholder="Repetí la contraseña"
                className="input-base"
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="btn-primary w-full mt-2"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                <>
                  <UserPlus size={17} />
                  Crear cuenta
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Ingresá
            </Link>
          </p>
        </div>

        <p className="text-center mt-5 text-xs text-slate-700">
          Lechugas Web Developing © {new Date().getFullYear()}
        </p>
      </motion.div>
      )}
    </div>
  )
}
