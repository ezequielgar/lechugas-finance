import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc.js'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createDeseoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  precio: z.number().positive('El precio debe ser positivo').optional(),
  moneda: z.string().default('ARS'),
  urlProducto: z.string().optional(),
  prioridad: z.number().int().min(1).max(3).default(3),
  fechaObjetivo: z.string().transform(s => new Date(s)).optional(),
})

const updateDeseoSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional().nullable(),
  precio: z.number().positive().optional().nullable(),
  moneda: z.string().optional(),
  urlProducto: z.string().optional().nullable(),
  prioridad: z.number().int().min(1).max(3).optional(),
  fechaObjetivo: z.string().transform(s => new Date(s)).optional().nullable(),
})

// ── Router ────────────────────────────────────────────────────────────────────

export const deseosRouter = router({
  /** Listar todos los deseos: pendientes primero, luego por prioridad */
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.deseo.findMany({
      where: { userId: ctx.user.id },
      orderBy: [
        { completado: 'asc' },
        { prioridad: 'asc' },
        { createdAt: 'desc' },
      ],
    })
  }),

  /** Crear un nuevo deseo */
  create: protectedProcedure.input(createDeseoSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.deseo.create({
      data: { ...input, userId: ctx.user.id },
    })
  }),

  /** Editar un deseo */
  update: protectedProcedure.input(updateDeseoSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input
    const deseo = await ctx.prisma.deseo.findUnique({ where: { id, userId: ctx.user.id } })
    if (!deseo) throw new TRPCError({ code: 'NOT_FOUND', message: 'Deseo no encontrado.' })
    return ctx.prisma.deseo.update({ where: { id }, data })
  }),

  /** Marcar/desmarcar como completado */
  toggleCompletado: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deseo = await ctx.prisma.deseo.findUnique({ where: { id: input.id, userId: ctx.user.id } })
      if (!deseo) throw new TRPCError({ code: 'NOT_FOUND', message: 'Deseo no encontrado.' })
      return ctx.prisma.deseo.update({
        where: { id: input.id },
        data: { completado: !deseo.completado },
      })
    }),

  /** Eliminar un deseo */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deseo = await ctx.prisma.deseo.findUnique({ where: { id: input.id, userId: ctx.user.id } })
      if (!deseo) throw new TRPCError({ code: 'NOT_FOUND', message: 'Deseo no encontrado.' })
      await ctx.prisma.deseo.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
