import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc.js'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createTarjetaSchema = z.object({
  nombreEntidad: z.string().min(1, 'El banco/entidad es requerido'),
  nombreTarjeta: z.string().min(1, 'El nombre de la tarjeta es requerido'),
  tipo: z.enum(['CREDITO', 'DEBITO', 'PREPAGA']),
  red: z.enum(['VISA', 'MASTERCARD', 'AMEX', 'CABAL', 'NARANJA', 'OTRA']),
  ultimos4: z.string().max(4).optional(),
  color: z.string().optional(),
})

const createCompraSchema = z.object({
  tarjetaId: z.string().min(1),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  comercio: z.string().optional(),
  categoria: z.string().optional(),
  montoTotal: z.number().positive(),
  cuotas: z.number().int().min(1).default(1),
  fechaCompra: z.string().transform((str) => new Date(str)),
  notas: z.string().optional(),
})

// ── Router ────────────────────────────────────────────────────────────────────

export const tarjetaRouter = router({
  /** Obtener todas las tarjetas del usuario */
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.tarjeta.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { compras: true }
        }
      }
    })
  }),

  /** Obtener una tarjeta específica con sus consumos */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tarjeta = await ctx.prisma.tarjeta.findUnique({
        where: { id: input.id, userId: ctx.user.id },
        include: {
          compras: {
            orderBy: { fechaCompra: 'desc' },
          },
        },
      })

      if (!tarjeta) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tarjeta no encontrada.',
        })
      }

      return tarjeta
    }),

  /** Crear una nueva tarjeta */
  create: protectedProcedure.input(createTarjetaSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.tarjeta.create({
      data: {
        ...input,
        userId: ctx.user.id,
        ultimos4: input.ultimos4 || null,
      },
    })
  }),

  /** Eliminar una tarjeta */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tarjeta = await ctx.prisma.tarjeta.findUnique({
        where: { id: input.id, userId: ctx.user.id },
      })

      if (!tarjeta) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tarjeta no encontrada o no pertenece al usuario.',
        })
      }

      await ctx.prisma.tarjeta.delete({ where: { id: input.id } })
      return { success: true }
    }),

  /** Actualizar cuotas pagadas de un consumo */
  updateCuotasPagadas: protectedProcedure
    .input(z.object({ 
      id: z.string(), 
      accion: z.enum(['ADELANTAR', 'SALDAR', 'RESETEAR']) 
    }))
    .mutation(async ({ ctx, input }) => {
      const compra = await ctx.prisma.comprarTarjeta.findUnique({
        where: { id: input.id },
        include: { tarjeta: true }
      })

      if (!compra || compra.tarjeta.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Movimiento no encontrado o no autorizado.',
        })
      }

      let nuevasCuotasPagadas = compra.cuotasPagadas

      if (input.accion === 'ADELANTAR') {
        nuevasCuotasPagadas = Math.min(compra.cuotasPagadas + 1, compra.cuotas)
      } else if (input.accion === 'SALDAR') {
        nuevasCuotasPagadas = compra.cuotas
      } else if (input.accion === 'RESETEAR') {
        nuevasCuotasPagadas = 0
      }

      return await ctx.prisma.comprarTarjeta.update({
        where: { id: input.id },
        data: { cuotasPagadas: nuevasCuotasPagadas }
      })
    }),

  /** Agregar un consumo a una tarjeta */
  addCompra: protectedProcedure.input(createCompraSchema).mutation(async ({ ctx, input }) => {
    console.log('Backend addCompra input:', input)
    const { tarjetaId, montoTotal, cuotas, ...rest } = input

    try {
      // Verificar pertenencia
      const tarjeta = await ctx.prisma.tarjeta.findUnique({
        where: { id: tarjetaId, userId: ctx.user.id },
      })

      if (!tarjeta) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tarjeta no encontrada.',
        })
      }

      const montoCuota = montoTotal / cuotas

      return await ctx.prisma.comprarTarjeta.create({
        data: {
          tarjetaId,
          monto: montoTotal,
          montoCuota: montoCuota,
          cuotas,
          ...rest,
        },
      })
    } catch (error: any) {
      console.error('Prisma Error in addCompra:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Error al guardar el consumo',
      })
    }
  }),
})
