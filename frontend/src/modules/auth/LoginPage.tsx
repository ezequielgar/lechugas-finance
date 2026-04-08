import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Leaf, LogIn, AlertCircle, Mail, Send, CheckCircle2 } from 'lucide-react'
import { trpc } from '../../lib/trpc'
import { useAuthStore } from '../../store/authStore'
import { sendPasswordResetEmail } from '../../lib/emailjs'

const schema = z.object({
  emailOrUsername: z.string().min(1, 'Campo requerido'),
  password: z.string().min(1, 'Campo requerido'),
})
type FormData = z.infer<typeof schema>

const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
})
type ForgotFormData = z.infer<typeof forgotSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken)
      if (user.mustChangePassword) {
        navigate('/settings', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    },
    onError: (err) => {
      setServerError(err.message)
    },
  })

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: async (data) => {
      if (data.emailData) {
        try {
          await sendPasswordResetEmail({
            to_email: data.emailData.to_email,
            display_name: data.emailData.display_name,
            temp_password: data.emailData.temp_password,
          })
        } catch {
          // Si falla el email igual mostramos éxito para no filtrar info
        }
      }
      setForgotSent(true)
    },
    onError: (err) => {
      setForgotError(err.message)
    },
  })

  const { register: registerForgot, handleSubmit: handleForgotSubmit, formState: { errors: forgotErrors } } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  })

  const onForgotSubmit = (data: ForgotFormData) => {
    setForgotError(null)
    forgotMutation.mutate(data)
  }

  const onSubmit = (data: FormData) => {
    setServerError(null)
    loginMutation.mutate(data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        {/* Card principal */}
        <div className="card p-8 shadow-2xl shadow-black/40">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center glow-brand">
              <Leaf size={28} className="text-brand-400" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-100">Bienvenido</h1>
              <p className="text-sm text-slate-500 mt-1">
                Ingresá a{' '}
                <span className="text-brand-500 font-semibold">Lechugas Finance</span>
              </p>
            </div>
          </div>

          {/* Error del servidor */}
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

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Email o usuario
              </label>
              <input
                {...register('emailOrUsername')}
                placeholder="tu@email.com o username"
                className="input-base"
                autoComplete="username"
              />
              {errors.emailOrUsername && (
                <p className="mt-1.5 text-xs text-red-400">{errors.emailOrUsername.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-base pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loginMutation.isPending}
              className="btn-primary w-full mt-2"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : (
                <>
                  <LogIn size={17} />
                  Ingresar
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setShowForgot(true); setForgotSent(false); setForgotError(null) }}
              className="text-sm text-slate-500 hover:text-brand-400 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Link a registro */}
          <p className="mt-6 text-center text-sm text-slate-500">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Registrate
            </Link>
          </p>
        </div>

        {/* Footer brand */}
        <p className="text-center mt-5 text-xs text-slate-700">
          Lechugas Web Developing © {new Date().getFullYear()}
        </p>
      </motion.div>

      {/* Modal Olvidé mi contraseña */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowForgot(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm card p-6 shadow-2xl shadow-black/50"
            >
              {!forgotSent ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center">
                      <Mail size={20} className="text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100">Recuperar contraseña</h3>
                      <p className="text-xs text-slate-500">Te enviamos una contraseña provisoria</p>
                    </div>
                  </div>

                  <form onSubmit={handleForgotSubmit(onForgotSubmit)} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Tu email</label>
                      <input
                        {...registerForgot('email')}
                        type="email"
                        placeholder="tu@email.com"
                        className="input-base"
                        autoComplete="email"
                      />
                      {forgotErrors.email && (
                        <p className="mt-1 text-xs text-red-400">{forgotErrors.email.message}</p>
                      )}
                    </div>

                    {forgotError && (
                      <p className="text-sm text-red-400">{forgotError}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowForgot(false)}
                        className="flex-1 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={forgotMutation.isPending}
                        className="flex-1 btn-primary text-sm py-2"
                      >
                        {forgotMutation.isPending ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Enviando...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            <Send size={14} />
                            Enviar
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center space-y-3 py-2">
                  <CheckCircle2 size={40} className="text-brand-400 mx-auto" />
                  <h3 className="font-semibold text-slate-100">Email enviado</h3>
                  <p className="text-sm text-slate-400">
                    Si el email existe en el sistema, recibirás una contraseña provisoria.
                    Iniciá sesión con ella y cambiá tu contraseña desde Configuración.
                  </p>
                  <button
                    onClick={() => setShowForgot(false)}
                    className="btn-primary w-full mt-2"
                  >
                    Entendido
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
