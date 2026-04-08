import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js'

// ── Schemas ──────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Mínimo 3 caracteres').max(30).regex(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y guion bajo'),
  displayName: z.string().min(2, 'Mínimo 2 caracteres').max(50).optional(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Campo requerido'),
  password: z.string().min(1, 'Campo requerido'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeUser(user: { id: string; email: string; username: string; displayName: string | null; avatarUrl: string | null; rol: string; aprobado: boolean; mustChangePassword: boolean; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    rol: user.rol as 'ADMIN' | 'USER',
    aprobado: user.aprobado,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
  }
}

const REFRESH_COOKIE = 'rf_token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 días en segundos
}

// ── Router ────────────────────────────────────────────────────────────────────

export const authRouter = router({
  /** Registro de nuevo usuario */
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    const { email, username, password, displayName } = input

    // Verificar si ya existe
    const existing = await ctx.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })
    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: existing.email === email ? 'Este email ya está registrado.' : 'Este nombre de usuario ya está en uso.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // El primer usuario registrado se convierte en ADMIN y queda aprobado
    const userCount = await ctx.prisma.user.count()
    const isFirstUser = userCount === 0
    const rol = isFirstUser ? ('ADMIN' as const) : ('USER' as const)
    const aprobado = isFirstUser

    const user = await ctx.prisma.user.create({
      data: { email, username, passwordHash, displayName, rol, aprobado },
    })

    if (!aprobado) {
      // Cuenta creada pero pendiente de aprobación — no emitir tokens
      return { user: sanitizeUser(user), accessToken: null, pendingApproval: true }
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user.id),
      signRefreshToken(user.id),
    ])

    ctx.res.setCookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS)

    return { user: sanitizeUser(user), accessToken, pendingApproval: false }
  }),

  /** Login con email o username */
  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const { emailOrUsername, password } = input

    const user = await ctx.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    })

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Credenciales inválidas.',
      })
    }

    if (!user.aprobado) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Tu cuenta está pendiente de aprobación por un administrador.',
      })
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user.id),
      signRefreshToken(user.id),
    ])

    ctx.res.setCookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS)

    return { user: sanitizeUser(user), accessToken }
  }),

  /** Usuario autenticado actual */
  me: protectedProcedure.query(({ ctx }) => {
    return sanitizeUser(ctx.user)
  }),

  /** Renovar access token usando refresh token de la cookie */
  refresh: publicProcedure.mutation(async ({ ctx }) => {
    const refreshToken = ctx.req.cookies?.[REFRESH_COOKIE]
    if (!refreshToken) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No hay sesión activa.' })
    }

    let userId: string
    try {
      const payload = await verifyRefreshToken(refreshToken)
      userId = payload.sub as string
    } catch {
      ctx.res.clearCookie(REFRESH_COOKIE)
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sesión expirada. Ingresá nuevamente.' })
    }

    const user = await ctx.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuario no encontrado.' })
    }

    const [newAccessToken, newRefreshToken] = await Promise.all([
      signAccessToken(user.id),
      signRefreshToken(user.id),
    ])

    ctx.res.setCookie(REFRESH_COOKIE, newRefreshToken, COOKIE_OPTIONS)

    return { accessToken: newAccessToken, user: sanitizeUser(user) }
  }),

  /** Cambiar contraseña (protegido) */
  changePassword: protectedProcedure.input(changePasswordSchema).mutation(async ({ ctx, input }) => {
    const { currentPassword, newPassword } = input

    const user = await ctx.prisma.user.findUnique({ where: { id: ctx.user.id } })
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'La contraseña actual es incorrecta.' })
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: { passwordHash: newHash, mustChangePassword: false },
    })

    return { success: true }
  }),

  /** Solicitar contraseña provisoria por email (público) */
  forgotPassword: publicProcedure.input(forgotPasswordSchema).mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({ where: { email: input.email } })

    // Siempre responder igual para no filtrar si el email existe
    if (!user) return { success: true }

    // Generar contraseña provisoria de 10 caracteres legibles
    const tempPassword = randomBytes(5).toString('hex') // e.g. "a3f9c2b1e4"

    const passwordHash = await bcrypt.hash(tempPassword, 12)
    await ctx.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: true },
    })

    return {
      success: true,
      // Datos para que el frontend envíe el email con EmailJS
      emailData: {
        to_email: user.email,
        display_name: user.displayName ?? user.username,
        temp_password: tempPassword,
      },
    }
  }),

  /** Cerrar sesión */
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(REFRESH_COOKIE, { path: '/' })
    return { success: true }
  }),

  // ── Endpoints de administración ─────────────────────────────────────────

  /** Listar usuarios pendientes de aprobación */
  listPendingUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      where: { aprobado: false },
      select: { id: true, email: true, username: true, displayName: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
  }),

  /** Listar todos los usuarios */
  listAllUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      select: { id: true, email: true, username: true, displayName: true, rol: true, aprobado: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
  }),

  /** Aprobar un usuario pendiente */
  approveUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({ where: { id: input.userId } })
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuario no encontrado.' })
      if (user.aprobado) throw new TRPCError({ code: 'BAD_REQUEST', message: 'El usuario ya está aprobado.' })
      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: { aprobado: true },
        select: { id: true, email: true, username: true, displayName: true, rol: true, aprobado: true },
      })
    }),

  /** Rechazar y eliminar un usuario pendiente */
  rejectUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({ where: { id: input.userId } })
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuario no encontrado.' })
      if (user.rol === 'ADMIN') throw new TRPCError({ code: 'BAD_REQUEST', message: 'No se puede eliminar a un administrador.' })
      await ctx.prisma.user.delete({ where: { id: input.userId } })
      return { success: true }
    }),

  /** Cambiar el rol de un usuario */
  setUserRole: adminProcedure
    .input(z.object({ userId: z.string(), rol: z.enum(['ADMIN', 'USER']) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No podés cambiar tu propio rol.' })
      const user = await ctx.prisma.user.findUnique({ where: { id: input.userId } })
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuario no encontrado.' })
      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: { rol: input.rol },
        select: { id: true, email: true, username: true, rol: true, aprobado: true },
      })
    }),
})
