import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc.js'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createIngresoSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  tipo: z.enum(['SUELDO', 'FREELANCE', 'ALQUILER', 'INVERSION', 'REGALO', 'BONO', 'OTRO']),
  monto: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().default('ARS'),
  fecha: z.string().transform((str) => new Date(str + 'T12:00:00.000Z')),
  recurrente: z.boolean().default(false),
  frecuencia: z.string().optional(),
  notas: z.string().optional(),
})

const updateIngresoSchema = createIngresoSchema.partial().extend({
  id: z.string(),
})

// ── Router ────────────────────────────────────────────────────────────────────

export const ingresoRouter = router({
  /** Obtener todos los ingresos del usuario */
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.ingreso.findMany({
      where: { userId: ctx.user.id },
      orderBy: { fecha: 'desc' },
    })
  }),

  /** Crear un nuevo ingreso */
  create: protectedProcedure.input(createIngresoSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.ingreso.create({
      data: {
        ...input,
        userId: ctx.user.id,
      },
    })
  }),

  /** Actualizar un ingreso existente */
  update: protectedProcedure.input(updateIngresoSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input
    
    const ingreso = await ctx.prisma.ingreso.findUnique({
      where: { id, userId: ctx.user.id },
    })

    if (!ingreso) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Ingreso no encontrado.',
      })
    }

    return ctx.prisma.ingreso.update({
      where: { id },
      data,
    })
  }),

  /** Toggle de estado activo (el ojo) */
  toggleActivo: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ingreso = await ctx.prisma.ingreso.findUnique({
        where: { id: input.id, userId: ctx.user.id },
      })

      if (!ingreso) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ingreso no encontrado.',
        })
      }

      return ctx.prisma.ingreso.update({
        where: { id: input.id },
        data: { activo: !ingreso.activo },
      })
    }),

  /** Eliminar un ingreso */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ingreso = await ctx.prisma.ingreso.findUnique({
        where: { id: input.id, userId: ctx.user.id },
      })

      if (!ingreso) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ingreso no encontrado.',
        })
      }

      await ctx.prisma.ingreso.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
