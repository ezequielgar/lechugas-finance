import { initTRPC, TRPCError } from '@trpc/server'
import { ZodError } from 'zod'
import type { Context } from './context/index.js'

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const publicProcedure = t.procedure

/** Procedimiento protegido: requiere token JWT válido y cuenta aprobada */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Debés iniciar sesión para acceder a este recurso.',
    })
  }
  if (!ctx.user.aprobado) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Tu cuenta está pendiente de aprobación por un administrador.',
    })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

/** Procedimiento solo para administradores */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Debés iniciar sesión.',
    })
  }
  if (ctx.user.rol !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Esta acción requiere permisos de administrador.',
    })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})
