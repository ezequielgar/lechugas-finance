import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc.js'

// ── Schemas ──────────────────────────────────────────────────────────────────

const categorias = ['COMIDA', 'TRANSPORTE', 'ENTRETENIMIENTO', 'SALUD', 'ROPA', 'HOGAR', 'TECNOLOGIA', 'EDUCACION', 'OTRO'] as const

const createGastoVariableSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  categoria: z.enum(categorias).default('OTRO'),
  monto: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().default('ARS'),
  fecha: z.string().transform((str) => new Date(str + 'T12:00:00.000Z')),
  notas: z.string().optional(),
})

const updateGastoVariableSchema = createGastoVariableSchema.partial().extend({
  id: z.string(),
})

// ── Router ────────────────────────────────────────────────────────────────────

export const gastoVariableRouter = router({
  /** Obtener todos los gastos variables del usuario */
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.gastoVariable.findMany({
      where: { userId: ctx.user.id },
      orderBy: { fecha: 'desc' },
    })
  }),

  /** Crear un nuevo gasto variable */
  create: protectedProcedure.input(createGastoVariableSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.gastoVariable.create({
      data: {
        ...input,
        userId: ctx.user.id,
      },
    })
  }),

  /** Actualizar un gasto variable */
  update: protectedProcedure.input(updateGastoVariableSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input

    const gasto = await ctx.prisma.gastoVariable.findUnique({
      where: { id, userId: ctx.user.id },
    })

    if (!gasto) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Gasto no encontrado.' })
    }

    return ctx.prisma.gastoVariable.update({ where: { id }, data })
  }),

  /** Eliminar un gasto variable */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const gasto = await ctx.prisma.gastoVariable.findUnique({
        where: { id: input.id, userId: ctx.user.id },
      })

      if (!gasto) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Gasto no encontrado.' })
      }

      await ctx.prisma.gastoVariable.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
