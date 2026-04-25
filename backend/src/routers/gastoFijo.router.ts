import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc.js'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createServiceSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  proveedor: z.string().optional(),
  categoria: z.enum([
    'ELECTRICIDAD', 'GAS', 'AGUA', 'INTERNET', 'TELEFONO', 'ALQUILER', 
    'EXPENSAS', 'STREAMING', 'GIMNASIO', 'SEGURO', 'TRANSPORTE', 
    'EDUCACION', 'SALUD', 'OTRO'
  ]),
})

const updateRecordSchema = z.object({
  id: z.string(),
  monto: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().optional(),
  fecha: z.string().transform(str => new Date(str + 'T12:00:00.000Z')),
  fechaVencimiento: z.string().transform(str => new Date(str + 'T12:00:00.000Z')).optional(),
  notas: z.string().optional(),
})

const addRecordSchema = z.object({
  gastoFijoId: z.string(),
  monto: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().default('ARS'),
  fecha: z.string().transform(str => new Date(str + 'T12:00:00.000Z')),
  fechaVencimiento: z.string().transform(str => new Date(str + 'T12:00:00.000Z')).optional(),
  notas: z.string().optional(),
})

// ── Router ────────────────────────────────────────────────────────────────────

export const gastoFijoRouter = router({
  /** Obtener servicios y sus registros del mes */
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.gastoFijo.findMany({
      where: { userId: ctx.user.id },
      include: {
        registros: {
          orderBy: { fechaVencimiento: 'desc' },
        }
      },
      orderBy: { nombre: 'asc' },
    })
  }),

  /** Crear un nuevo servicio (ej: Edesur, Spotify) */
  createService: protectedProcedure.input(createServiceSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.gastoFijo.create({
      data: {
        ...input,
        userId: ctx.user.id,
      },
    })
  }),

  /** Editar una factura */
  updateRecord: protectedProcedure.input(updateRecordSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input
    const registro = await ctx.prisma.registroGastoFijo.findFirst({
      where: { id, gastoFijo: { userId: ctx.user.id } }
    })
    if (!registro) throw new TRPCError({ code: 'NOT_FOUND', message: 'Factura no encontrada' })
    return ctx.prisma.registroGastoFijo.update({ where: { id }, data })
  }),

  /** Registrar una factura específica */
  addRecord: protectedProcedure.input(addRecordSchema).mutation(async ({ ctx, input }) => {
    const { gastoFijoId, ...data } = input
    
    // Verificar pertenencia
    const service = await ctx.prisma.gastoFijo.findFirst({
      where: { id: gastoFijoId, userId: ctx.user.id }
    })

    if (!service) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Servicio no encontrado' })
    }

    return ctx.prisma.registroGastoFijo.create({
      data: {
        ...data,
        gastoFijoId,
      }
    })
  }),

  /** Toggle de estado de pago */
  togglePago: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const registro = await ctx.prisma.registroGastoFijo.findFirst({
        where: { id: input.id, gastoFijo: { userId: ctx.user.id } }
      })

      if (!registro) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Registro no encontrado' })
      }

      return ctx.prisma.registroGastoFijo.update({
        where: { id: input.id },
        data: { 
          pagado: !registro.pagado,
          fechaPago: !registro.pagado ? new Date() : null
        }
      })
    }),

  /** Eliminar servicio */
  deleteService: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = await ctx.prisma.gastoFijo.findFirst({
        where: { id: input.id, userId: ctx.user.id }
      })

      if (!service) throw new TRPCError({ code: 'NOT_FOUND' })

      await ctx.prisma.gastoFijo.delete({ where: { id: input.id } })
      return { success: true }
    }),

  /** Eliminar registro de factura */
  deleteRecord: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const registro = await ctx.prisma.registroGastoFijo.findFirst({
        where: { id: input.id, gastoFijo: { userId: ctx.user.id } }
      })

      if (!registro) throw new TRPCError({ code: 'NOT_FOUND' })

      await ctx.prisma.registroGastoFijo.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
