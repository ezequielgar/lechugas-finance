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
  proximoCierre: z.string().optional(),
})

const createCompraSchema = z.object({
  tarjetaId: z.string().min(1),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  comercio: z.string().optional(),
  categoria: z.string().optional(),
  montoTotal: z.number().positive(),
  moneda: z.string().default('ARS'),
  tipoCambio: z.number().positive().optional(),
  cuotas: z.number().int().min(1).default(1),
  fechaCompra: z.string().transform((str) => new Date(str + 'T12:00:00.000Z')),
  esRecurrente: z.boolean().default(false).optional(),
  notas: z.string().optional(),
})

const updateCompraSchema = z.object({
  id: z.string(),
  descripcion: z.string().min(1, 'La descripción es requerida').optional(),
  comercio: z.string().optional(),
  categoria: z.string().optional(),
  montoTotal: z.number().positive().optional(),
  moneda: z.string().optional(),
  tipoCambio: z.number().positive().optional().nullable(),
  cuotas: z.number().int().min(1).optional(),
  fechaCompra: z.string().transform((str) => new Date(str + 'T12:00:00.000Z')).optional(),
  esRecurrente: z.boolean().optional(),
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

  /** Actualizar una tarjeta (ej. Próximo Cierre, Cierre Manual) */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      proximoCierre: z.string().optional(),
      nombreTarjeta: z.string().optional(),
      cierreManualMes: z.string().optional().nullable(),
      cierreManualActual: z.number().optional().nullable(),
      cierreManualProximo: z.number().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tarjeta = await ctx.prisma.tarjeta.findUnique({
        where: { id: input.id, userId: ctx.user.id },
      })
      if (!tarjeta) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tarjeta no encontrada' })
      }

      const data: Record<string, any> = {
        proximoCierre: input.proximoCierre ? new Date(input.proximoCierre) : tarjeta.proximoCierre,
        nombreTarjeta: input.nombreTarjeta || tarjeta.nombreTarjeta,
      }

      // Cierre manual: si se proveen los campos, actualizar (null los limpia)
      if ('cierreManualMes' in input) {
        data.cierreManualMes = input.cierreManualMes ? new Date(input.cierreManualMes) : null
        data.cierreManualActual = input.cierreManualActual ?? null
        data.cierreManualProximo = input.cierreManualProximo ?? null
      }

      return ctx.prisma.tarjeta.update({ where: { id: input.id }, data })
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
        nuevasCuotasPagadas = Math.min(compra.cuotasPagadas + 1, compra.cuotas + 1)
      } else if (input.accion === 'SALDAR') {
        nuevasCuotasPagadas = compra.cuotas + 1
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
    const { tarjetaId, montoTotal, cuotas, moneda, tipoCambio, ...rest } = input

    try {
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
          moneda: moneda || 'ARS',
          tipoCambio: tipoCambio ?? null,
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

  /** Editar un consumo existente */
  updateCompra: protectedProcedure.input(updateCompraSchema).mutation(async ({ ctx, input }) => {
    const { id, montoTotal, cuotas, ...rest } = input

    const compra = await ctx.prisma.comprarTarjeta.findUnique({
      where: { id },
      include: { tarjeta: true },
    })

    if (!compra || compra.tarjeta.userId !== ctx.user.id) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Consumo no encontrado o no autorizado.',
      })
    }

    const nuevoMontoTotal = montoTotal ?? Number(compra.monto)
    const nuevasCuotas = cuotas ?? compra.cuotas
    const nuevaMontoCuota = nuevoMontoTotal / nuevasCuotas

    return await ctx.prisma.comprarTarjeta.update({
      where: { id },
      data: {
        ...rest,
        monto: nuevoMontoTotal,
        montoCuota: nuevaMontoCuota,
        cuotas: nuevasCuotas,
      },
    })
  }),

  /** Eliminar un consumo */
  deleteCompra: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const compra = await ctx.prisma.comprarTarjeta.findUnique({
        where: { id: input.id },
        include: { tarjeta: true },
      })

      if (!compra || compra.tarjeta.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Consumo no encontrado o no autorizado.',
        })
      }

      await ctx.prisma.comprarTarjeta.delete({ where: { id: input.id } })
      return { success: true }
    }),
})

