import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc.js'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createProyectoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  presupuesto: z.number().positive('El presupuesto debe ser positivo').optional(),
  moneda: z.string().default('ARS'),
  estado: z.enum(['PLANIFICANDO', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'CANCELADO']).default('PLANIFICANDO'),
  fechaInicio: z.string().transform(s => new Date(s)).optional(),
  fechaObjetivo: z.string().transform(s => new Date(s)).optional(),
})

const updateProyectoSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  presupuesto: z.number().positive().optional(),
  moneda: z.string().optional(),
  fechaInicio: z.string().transform(s => new Date(s)).optional(),
  fechaObjetivo: z.string().transform(s => new Date(s)).optional(),
})

const changeEstadoSchema = z.object({
  id: z.string(),
  estado: z.enum(['PLANIFICANDO', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'CANCELADO']),
})

const addGastoSchema = z.object({
  proyectoId: z.string(),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().default('ARS'),
  fecha: z.string().transform(s => new Date(s)),
  categoria: z.string().optional(),
})

// ── Router ────────────────────────────────────────────────────────────────────

export const proyectosRouter = router({
  /** Listar todos los proyectos con sus gastos */
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.proyecto.findMany({
      where: { userId: ctx.user.id },
      include: {
        gastos: { orderBy: { fecha: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }),

  /** Crear un nuevo proyecto */
  create: protectedProcedure.input(createProyectoSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.proyecto.create({
      data: {
        ...input,
        userId: ctx.user.id,
      },
      include: { gastos: true },
    })
  }),

  /** Editar nombre, descripción, presupuesto o fechas */
  update: protectedProcedure.input(updateProyectoSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input
    const proyecto = await ctx.prisma.proyecto.findUnique({ where: { id, userId: ctx.user.id } })
    if (!proyecto) throw new TRPCError({ code: 'NOT_FOUND', message: 'Proyecto no encontrado.' })
    return ctx.prisma.proyecto.update({ where: { id }, data })
  }),

  /** Cambiar estado del proyecto */
  changeEstado: protectedProcedure.input(changeEstadoSchema).mutation(async ({ ctx, input }) => {
    const proyecto = await ctx.prisma.proyecto.findUnique({ where: { id: input.id, userId: ctx.user.id } })
    if (!proyecto) throw new TRPCError({ code: 'NOT_FOUND', message: 'Proyecto no encontrado.' })
    return ctx.prisma.proyecto.update({ where: { id: input.id }, data: { estado: input.estado } })
  }),

  /** Eliminar proyecto y todos sus gastos */
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const proyecto = await ctx.prisma.proyecto.findUnique({ where: { id: input.id, userId: ctx.user.id } })
    if (!proyecto) throw new TRPCError({ code: 'NOT_FOUND', message: 'Proyecto no encontrado.' })
    await ctx.prisma.proyecto.delete({ where: { id: input.id } })
    return { success: true }
  }),

  /** Agregar un gasto al proyecto */
  addGasto: protectedProcedure.input(addGastoSchema).mutation(async ({ ctx, input }) => {
    const { proyectoId, ...data } = input
    const proyecto = await ctx.prisma.proyecto.findUnique({ where: { id: proyectoId, userId: ctx.user.id } })
    if (!proyecto) throw new TRPCError({ code: 'NOT_FOUND', message: 'Proyecto no encontrado.' })
    return ctx.prisma.gastoProyecto.create({ data: { ...data, proyectoId } })
  }),

  /** Eliminar un gasto del proyecto */
  deleteGasto: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const gasto = await ctx.prisma.gastoProyecto.findFirst({
      where: { id: input.id, proyecto: { userId: ctx.user.id } },
    })
    if (!gasto) throw new TRPCError({ code: 'NOT_FOUND', message: 'Gasto no encontrado.' })
    await ctx.prisma.gastoProyecto.delete({ where: { id: input.id } })
    return { success: true }
  }),
})
