import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc.js'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createInversionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.enum(['PLAZO_FIJO', 'ACCIONES', 'CRYPTO', 'FONDO_COMUN', 'DOLAR', 'INMUEBLE', 'OTRO']),
  montoInicial: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().default('ARS'),
  fechaInicio: z.string().transform((s) => new Date(s + 'T12:00:00.000Z')),
  fechaVencimiento: z.string().transform((s) => new Date(s + 'T12:00:00.000Z')).optional(),
  notas: z.string().optional(),
})

const updateInversionSchema = createInversionSchema.partial().extend({
  id: z.string(),
})

const addMovimientoSchema = z.object({
  inversionId: z.string(),
  tipo: z.enum(['DEPOSITO', 'RETIRO', 'RENDIMIENTO', 'ACTUALIZACION']),
  monto: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().default('ARS'),
  fecha: z.string().transform((s) => new Date(s + 'T12:00:00.000Z')),
  descripcion: z.string().optional(),
})

// ── Router ────────────────────────────────────────────────────────────────────

export const inversionesRouter = router({
  /** Obtener todas las inversiones del usuario con sus movimientos */
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.inversion.findMany({
      where: { userId: ctx.user.id },
      include: {
        movimientos: {
          orderBy: { fecha: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }),

  /** Crear una nueva inversión */
  create: protectedProcedure.input(createInversionSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.inversion.create({
      data: {
        ...input,
        userId: ctx.user.id,
      },
    })
  }),

  /** Actualizar una inversión existente */
  update: protectedProcedure.input(updateInversionSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input

    const inversion = await ctx.prisma.inversion.findUnique({
      where: { id, userId: ctx.user.id },
    })

    if (!inversion) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Inversión no encontrada.' })
    }

    return ctx.prisma.inversion.update({ where: { id }, data })
  }),

  /** Activar / desactivar una inversión */
  toggleActiva: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inversion = await ctx.prisma.inversion.findUnique({
        where: { id: input.id, userId: ctx.user.id },
      })

      if (!inversion) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Inversión no encontrada.' })
      }

      return ctx.prisma.inversion.update({
        where: { id: input.id },
        data: { activa: !inversion.activa },
      })
    }),

  /** Eliminar una inversión y todos sus movimientos */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inversion = await ctx.prisma.inversion.findUnique({
        where: { id: input.id, userId: ctx.user.id },
      })

      if (!inversion) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Inversión no encontrada.' })
      }

      await ctx.prisma.inversion.delete({ where: { id: input.id } })
      return { success: true }
    }),

  /** Añadir un movimiento a una inversión */
  addMovimiento: protectedProcedure.input(addMovimientoSchema).mutation(async ({ ctx, input }) => {
    const { inversionId, ...data } = input

    const inversion = await ctx.prisma.inversion.findUnique({
      where: { id: inversionId, userId: ctx.user.id },
    })

    if (!inversion) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Inversión no encontrada.' })
    }

    return ctx.prisma.movimientoInversion.create({
      data: { ...data, inversionId },
    })
  }),

  /** Eliminar un movimiento */
  deleteMovimiento: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const movimiento = await ctx.prisma.movimientoInversion.findFirst({
        where: { id: input.id, inversion: { userId: ctx.user.id } },
      })

      if (!movimiento) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Movimiento no encontrado.' })
      }

      await ctx.prisma.movimientoInversion.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
