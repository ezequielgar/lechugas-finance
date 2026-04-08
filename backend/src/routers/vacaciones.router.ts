import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc.js'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createVacacionSchema = z.object({
  destino: z.string().min(1, 'El destino es requerido'),
  descripcion: z.string().optional(),
  presupuesto: z.number().positive().optional(),
  moneda: z.string().default('ARS'),
  fechaSalida: z.string().transform(s => new Date(s)).optional(),
  fechaRegreso: z.string().transform(s => new Date(s)).optional(),
})

const updateVacacionSchema = z.object({
  id: z.string(),
  destino: z.string().min(1).optional(),
  descripcion: z.string().optional().nullable(),
  presupuesto: z.number().positive().optional().nullable(),
  moneda: z.string().optional(),
  fechaSalida: z.string().transform(s => new Date(s)).optional().nullable(),
  fechaRegreso: z.string().transform(s => new Date(s)).optional().nullable(),
})

const addAhorroSchema = z.object({
  vacacionId: z.string(),
  monto: z.number().positive('El monto debe ser positivo'),
  fecha: z.string().transform(s => new Date(s)),
  notas: z.string().optional(),
})

const addGastoSchema = z.object({
  vacacionId: z.string(),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().default('ARS'),
  fecha: z.string().transform(s => new Date(s)),
  categoria: z.string().optional(),
})

// ── Router ────────────────────────────────────────────────────────────────────

export const vacacionesRouter = router({
  /** Listar vacaciones con ahorros y gastos */
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.vacacion.findMany({
      where: { userId: ctx.user.id },
      include: {
        ahorros: { orderBy: { fecha: 'desc' } },
        gastos: { orderBy: { fecha: 'desc' } },
      },
      orderBy: [{ completada: 'asc' }, { fechaSalida: 'asc' }, { createdAt: 'desc' }],
    })
  }),

  /** Crear vacación */
  create: protectedProcedure.input(createVacacionSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.vacacion.create({
      data: { ...input, userId: ctx.user.id },
      include: { ahorros: true, gastos: true },
    })
  }),

  /** Editar vacación */
  update: protectedProcedure.input(updateVacacionSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input
    const vac = await ctx.prisma.vacacion.findUnique({ where: { id, userId: ctx.user.id } })
    if (!vac) throw new TRPCError({ code: 'NOT_FOUND', message: 'Vacación no encontrada.' })
    return ctx.prisma.vacacion.update({ where: { id }, data })
  }),

  /** Marcar/desmarcar como completada */
  toggleCompletada: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const vac = await ctx.prisma.vacacion.findUnique({ where: { id: input.id, userId: ctx.user.id } })
      if (!vac) throw new TRPCError({ code: 'NOT_FOUND', message: 'Vacación no encontrada.' })
      return ctx.prisma.vacacion.update({
        where: { id: input.id },
        data: { completada: !vac.completada },
      })
    }),

  /** Eliminar vacación y todos sus registros */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const vac = await ctx.prisma.vacacion.findUnique({ where: { id: input.id, userId: ctx.user.id } })
      if (!vac) throw new TRPCError({ code: 'NOT_FOUND', message: 'Vacación no encontrada.' })
      await ctx.prisma.vacacion.delete({ where: { id: input.id } })
      return { success: true }
    }),

  /** Agregar ahorro */
  addAhorro: protectedProcedure.input(addAhorroSchema).mutation(async ({ ctx, input }) => {
    const { vacacionId, ...data } = input
    const vac = await ctx.prisma.vacacion.findUnique({ where: { id: vacacionId, userId: ctx.user.id } })
    if (!vac) throw new TRPCError({ code: 'NOT_FOUND', message: 'Vacación no encontrada.' })
    return ctx.prisma.ahorroVacacion.create({ data: { ...data, vacacionId } })
  }),

  /** Eliminar ahorro */
  deleteAhorro: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ahorro = await ctx.prisma.ahorroVacacion.findFirst({
        where: { id: input.id, vacacion: { userId: ctx.user.id } },
      })
      if (!ahorro) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ahorro no encontrado.' })
      await ctx.prisma.ahorroVacacion.delete({ where: { id: input.id } })
      return { success: true }
    }),

  /** Agregar gasto */
  addGasto: protectedProcedure.input(addGastoSchema).mutation(async ({ ctx, input }) => {
    const { vacacionId, ...data } = input
    const vac = await ctx.prisma.vacacion.findUnique({ where: { id: vacacionId, userId: ctx.user.id } })
    if (!vac) throw new TRPCError({ code: 'NOT_FOUND', message: 'Vacación no encontrada.' })
    return ctx.prisma.gastoVacacion.create({ data: { ...data, vacacionId } })
  }),

  /** Eliminar gasto */
  deleteGasto: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const gasto = await ctx.prisma.gastoVacacion.findFirst({
        where: { id: input.id, vacacion: { userId: ctx.user.id } },
      })
      if (!gasto) throw new TRPCError({ code: 'NOT_FOUND', message: 'Gasto no encontrado.' })
      await ctx.prisma.gastoVacacion.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
