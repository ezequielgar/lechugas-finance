import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc.js'

// Suma N meses a una fecha sin dependencias externas
function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const createCreditoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  entidad: z.string().optional(),
  montoOriginal: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().default('ARS'),
  cuotasTotal: z.number().int().positive('Debe tener al menos 1 cuota'),
  montoCuota: z.number().positive('El monto de cuota debe ser positivo'),
  tasaInteres: z.number().min(0).optional(),
  fechaInicio: z.string().transform((s) => new Date(s)),
  notas: z.string().optional(),
})

const updateCreditoSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1).optional(),
  entidad: z.string().optional(),
  notas: z.string().optional(),
})

// ── Router ────────────────────────────────────────────────────────────────────

export const creditosRouter = router({
  /** Listar todos los créditos del usuario con sus cuotas */
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.credito.findMany({
      where: { userId: ctx.user.id },
      include: {
        pagos: { orderBy: { numeroCuota: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }),

  /** Crear crédito y auto-generar todas las cuotas */
  create: protectedProcedure.input(createCreditoSchema).mutation(async ({ ctx, input }) => {
    const { fechaInicio, cuotasTotal, montoCuota, tasaInteres, ...rest } = input

    const credito = await ctx.prisma.credito.create({
      data: {
        ...rest,
        fechaInicio,
        cuotasTotal,
        montoCuota,
        tasaInteres: tasaInteres != null ? tasaInteres : null,
        userId: ctx.user.id,
      },
    })

    // Auto-generar cuotas: la primera vence un mes después de fechaInicio
    const cuotas = Array.from({ length: cuotasTotal }, (_, i) => ({
      creditoId: credito.id,
      numeroCuota: i + 1,
      monto: montoCuota,
      fechaPago: addMonths(fechaInicio, i + 1),
      pagado: false,
    }))

    await ctx.prisma.pagoCredito.createMany({ data: cuotas })

    return ctx.prisma.credito.findUnique({
      where: { id: credito.id },
      include: { pagos: { orderBy: { numeroCuota: 'asc' } } },
    })
  }),

  /** Editar nombre, entidad o notas de un crédito */
  update: protectedProcedure.input(updateCreditoSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input

    const credito = await ctx.prisma.credito.findUnique({
      where: { id, userId: ctx.user.id },
    })

    if (!credito) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Crédito no encontrado.' })
    }

    return ctx.prisma.credito.update({ where: { id }, data })
  }),

  /** Archivar / reactivar crédito */
  toggleActivo: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const credito = await ctx.prisma.credito.findUnique({
        where: { id: input.id, userId: ctx.user.id },
      })

      if (!credito) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Crédito no encontrado.' })
      }

      return ctx.prisma.credito.update({
        where: { id: input.id },
        data: { activo: !credito.activo },
      })
    }),

  /** Eliminar crédito y todas sus cuotas */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const credito = await ctx.prisma.credito.findUnique({
        where: { id: input.id, userId: ctx.user.id },
      })

      if (!credito) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Crédito no encontrado.' })
      }

      await ctx.prisma.credito.delete({ where: { id: input.id } })
      return { success: true }
    }),

  /** Marcar / desmarcar cuota como pagada */
  togglePago: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pago = await ctx.prisma.pagoCredito.findFirst({
        where: { id: input.id, credito: { userId: ctx.user.id } },
      })

      if (!pago) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cuota no encontrada.' })
      }

      return ctx.prisma.pagoCredito.update({
        where: { id: input.id },
        data: {
          pagado: !pago.pagado,
          ...((!pago.pagado) ? { fechaPago: new Date() } : {}),
        },
      })
    }),
})
