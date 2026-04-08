import { z } from 'zod'
import { router, protectedProcedure } from '../trpc.js'
import { TRPCError } from '@trpc/server'
import { deleteProductImage } from '../lib/imageStorage.js'

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────
async function recalcTotal(prisma: any, listaId: string) {
  const items = await prisma.itemListaSuper.findMany({
    where: { listaId },
    select: { precioFinal: true },
  })
  const total = items.reduce((acc: number, i: any) => acc + Number(i.precioFinal ?? 0), 0)
  await prisma.listaSuper.update({ where: { id: listaId }, data: { montoTotal: total } })
  return total
}

async function findOrCreateProducto(prisma: any, nombre: string, marca?: string, categoria?: string, unidad?: string) {
  const existing = await prisma.productoSuper.findFirst({
    where: { nombre, marca: marca ?? null },
  })
  if (existing) return existing
  return prisma.productoSuper.create({
    data: { nombre, marca, categoria, unidadBase: unidad ?? 'unidad' },
  })
}

async function recordPrecio(
  prisma: any,
  productoId: string,
  supermercado: string,
  precio: number,
  tienePromo: boolean,
  descuentoTipo?: string,
  descuentoValor?: number,
) {
  const last = await prisma.precioProducto.findFirst({
    where: { productoId, supermercado },
    orderBy: { fecha: 'desc' },
  })
  const variacion = last
    ? Math.round(((precio - Number(last.precio)) / Number(last.precio)) * 10000) / 100
    : null
  return prisma.precioProducto.create({
    data: {
      productoId,
      supermercado,
      precio,
      tienePrecioAnterior: !!last,
      precioAnterior: last?.precio ?? null,
      variacionPct: variacion,
      conDescuento: tienePromo,
      tipoDescuento: descuentoTipo,
      valorDescuento: descuentoValor,
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// ROUTER
// ──────────────────────────────────────────────────────────────────────────────
export const supermercadoRouter = router({

  // ── Listas ──────────────────────────────────────────────────────────────────

  listListas: protectedProcedure
    .input(z.object({
      supermercado: z.string().optional(),
      estado: z.enum(['ACTIVA', 'COMPLETADA', 'ARCHIVADA']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const listas = await ctx.prisma.listaSuper.findMany({
        where: {
          userId: ctx.user!.id,
          ...(input?.supermercado ? { supermercado: input.supermercado } : {}),
          ...(input?.estado ? { estado: input.estado } : {}),
        },
        include: {
          _count: { select: { items: true } },
          items: { select: { comprado: true, precioFinal: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return listas.map((l) => ({
        id: l.id,
        nombre: l.nombre,
        supermercado: l.supermercado,
        estado: l.estado,
        fechaCompra: l.fechaCompra,
        montoTotal: l.montoTotal,
        notas: l.notas,
        createdAt: l.createdAt,
        totalItems: l._count.items,
        itemsComprados: l.items.filter((i) => i.comprado).length,
      }))
    }),

  createLista: protectedProcedure
    .input(z.object({
      nombre: z.string().min(1),
      supermercado: z.string().min(1),
      fechaCompra: z.string().datetime().optional(),
      notas: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.listaSuper.create({
        data: {
          userId: ctx.user!.id,
          nombre: input.nombre,
          supermercado: input.supermercado,
          fechaCompra: input.fechaCompra ? new Date(input.fechaCompra) : new Date(),
          notas: input.notas,
        },
      })
    }),

  getLista: protectedProcedure
    .input(z.object({ listaId: z.string() }))
    .query(async ({ ctx, input }) => {
      const lista = await ctx.prisma.listaSuper.findFirst({
        where: { id: input.listaId, userId: ctx.user!.id },
        include: {
          items: {
            include: { producto: true },
            orderBy: [{ comprado: 'asc' }, { createdAt: 'asc' }],
          },
        },
      })
      if (!lista) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lista no encontrada.' })
      return lista
    }),

  updateLista: protectedProcedure
    .input(z.object({
      listaId: z.string(),
      nombre: z.string().min(1).optional(),
      supermercado: z.string().optional(),
      estado: z.enum(['ACTIVA', 'COMPLETADA', 'ARCHIVADA']).optional(),
      fechaCompra: z.string().datetime().nullable().optional(),
      notas: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { listaId, fechaCompra, ...rest } = input
      const lista = await ctx.prisma.listaSuper.findFirst({ where: { id: listaId, userId: ctx.user!.id } })
      if (!lista) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lista no encontrada.' })
      return ctx.prisma.listaSuper.update({
        where: { id: listaId },
        data: {
          ...rest,
          ...(fechaCompra !== undefined
            ? { fechaCompra: fechaCompra ? new Date(fechaCompra) : null }
            : {}),
        },
      })
    }),

  deleteLista: protectedProcedure
    .input(z.object({ listaId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lista = await ctx.prisma.listaSuper.findFirst({ where: { id: input.listaId, userId: ctx.user!.id } })
      if (!lista) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lista no encontrada.' })
      return ctx.prisma.listaSuper.delete({ where: { id: input.listaId } })
    }),

  // ── Supers recientes (autocomplete) ─────────────────────────────────────────

  getRecentSupermercados: protectedProcedure
    .query(async ({ ctx }) => {
      const listas = await ctx.prisma.listaSuper.findMany({
        where: { userId: ctx.user!.id, supermercado: { not: null } },
        select: { supermercado: true },
        distinct: ['supermercado'],
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      return listas.map((l) => l.supermercado).filter(Boolean) as string[]
    }),

  // ── Productos (autocomplete) ─────────────────────────────────────────────────

  searchProductos: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.query.length < 2) return []
      return ctx.prisma.productoSuper.findMany({
        where: {
          OR: [
            { nombre: { contains: input.query } },
            { marca: { contains: input.query } },
          ],
        },
        take: 10,
        orderBy: { nombre: 'asc' },
      })
    }),

  // ── Items ────────────────────────────────────────────────────────────────────

  addItem: protectedProcedure
    .input(z.object({
      listaId: z.string(),
      nombre: z.string().min(1),
      marca: z.string().optional(),
      categoria: z.string().optional(),
      unidad: z.string().default('unidad'),
      cantidad: z.number().positive().default(1),
      precioUnitario: z.number().nonnegative(),
      tienePromo: z.boolean().default(false),
      descuentoTipo: z.enum(['PORCENTAJE', 'MONTO']).optional(),
      descuentoValor: z.number().nonnegative().optional(),
      notas: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const lista = await ctx.prisma.listaSuper.findFirst({ where: { id: input.listaId, userId: ctx.user!.id } })
      if (!lista) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lista no encontrada.' })

      // 1. Find or create canonical product
      const producto = await findOrCreateProducto(
        ctx.prisma, input.nombre, input.marca, input.categoria, input.unidad,
      )

      // 2. Record price history
      if (input.precioUnitario > 0 && lista.supermercado) {
        await recordPrecio(
          ctx.prisma, producto.id, lista.supermercado, input.precioUnitario,
          input.tienePromo, input.descuentoTipo, input.descuentoValor,
        )
      }

      // 3. Compute final price with discount
      let precioFinal = input.precioUnitario * input.cantidad
      if (input.tienePromo && input.descuentoValor) {
        if (input.descuentoTipo === 'PORCENTAJE') {
          precioFinal = precioFinal * (1 - input.descuentoValor / 100)
        } else if (input.descuentoTipo === 'MONTO') {
          precioFinal = Math.max(0, precioFinal - input.descuentoValor * input.cantidad)
        }
      }

      // 4. Create item
      const item = await ctx.prisma.itemListaSuper.create({
        data: {
          listaId: input.listaId,
          productoId: producto.id,
          cantidad: input.cantidad,
          unidad: input.unidad,
          precioUnitario: input.precioUnitario,
          precioFinal,
          tienePromo: input.tienePromo,
          descuentoTipo: input.descuentoTipo,
          descuentoValor: input.descuentoValor,
          notas: input.notas,
        },
        include: { producto: true },
      })

      // 5. Recalculate total
      await recalcTotal(ctx.prisma, input.listaId)

      return item
    }),

  updateItem: protectedProcedure
    .input(z.object({
      itemId: z.string(),
      cantidad: z.number().positive().optional(),
      precioUnitario: z.number().nonnegative().optional(),
      comprado: z.boolean().optional(),
      notas: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.itemListaSuper.findFirst({
        where: { id: input.itemId },
        include: { lista: true },
      })
      if (!item || item.lista.userId !== ctx.user!.id) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const { itemId, ...data } = input
      const cantidad = data.cantidad ?? Number(item.cantidad)
      const precio = data.precioUnitario ?? Number(item.precioUnitario ?? 0)
      const precioFinal = precio * cantidad

      const updated = await ctx.prisma.itemListaSuper.update({
        where: { id: itemId },
        data: { ...data, precioFinal },
        include: { producto: true },
      })

      await recalcTotal(ctx.prisma, item.listaId)
      return updated
    }),

  deleteItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.itemListaSuper.findFirst({
        where: { id: input.itemId },
        include: { lista: true },
      })
      if (!item || item.lista.userId !== ctx.user!.id) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      await ctx.prisma.itemListaSuper.delete({ where: { id: input.itemId } })
      await recalcTotal(ctx.prisma, item.listaId)
      return { ok: true }
    }),

  // ── Precios / Comparación ────────────────────────────────────────────────────

  getHistorialPrecios: protectedProcedure
    .input(z.object({
      productoId: z.string(),
      supermercado: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.precioProducto.findMany({
        where: {
          productoId: input.productoId,
          ...(input.supermercado ? { supermercado: input.supermercado } : {}),
        },
        orderBy: { fecha: 'desc' },
        take: 30,
      })
    }),

  compararPrecios: protectedProcedure
    .input(z.object({ productoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const producto = await ctx.prisma.productoSuper.findUnique({ where: { id: input.productoId } })
      if (!producto) throw new TRPCError({ code: 'NOT_FOUND' })

      const allPrecios = await ctx.prisma.precioProducto.findMany({
        where: { productoId: input.productoId },
        orderBy: { fecha: 'desc' },
      })

      // Latest price per supermarket
      const bySuper = new Map<string, typeof allPrecios[0]>()
      for (const p of allPrecios) {
        if (!bySuper.has(p.supermercado)) bySuper.set(p.supermercado, p)
      }

      return {
        producto,
        precios: Array.from(bySuper.values()).sort((a, b) => Number(a.precio) - Number(b.precio)),
      }
    }),

  getResumen: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user!.id

      const totalListas = await ctx.prisma.listaSuper.count({ where: { userId } })
      const supers = await ctx.prisma.listaSuper.findMany({
        where: { userId, supermercado: { not: null } },
        select: { supermercado: true, montoTotal: true, createdAt: true },
      })

      const porSuper = new Map<string, { visitas: number; total: number; ultima: Date }>()
      for (const l of supers) {
        const key = l.supermercado!
        const prev = porSuper.get(key) ?? { visitas: 0, total: 0, ultima: new Date(0) }
        porSuper.set(key, {
          visitas: prev.visitas + 1,
          total: prev.total + Number(l.montoTotal ?? 0),
          ultima: l.createdAt > prev.ultima ? l.createdAt : prev.ultima,
        })
      }

      const gastoTotal = supers.reduce((acc, l) => acc + Number(l.montoTotal ?? 0), 0)

      return {
        totalListas,
        gastoTotal,
        supermercados: Array.from(porSuper.entries())
          .map(([nombre, d]) => ({ nombre, ...d }))
          .sort((a, b) => b.visitas - a.visitas),
      }
    }),

  // ── Imagen de producto ───────────────────────────────────────────────────────

  /**
   * Remove the image from a ProductoSuper.
   * Also deletes the file from disk.
   */
  removeProductImage: protectedProcedure
    .input(z.object({ productoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const producto = await ctx.prisma.productoSuper.findUnique({ where: { id: input.productoId } })
      if (!producto) throw new TRPCError({ code: 'NOT_FOUND', message: 'Producto no encontrado.' })

      await deleteProductImage(producto.imagen)
      await ctx.prisma.productoSuper.update({
        where: { id: input.productoId },
        data: { imagen: null },
      })
      return { ok: true }
    }),

  updateProducto: protectedProcedure
    .input(z.object({
      productoId: z.string(),
      nombre: z.string().min(1).optional(),
      marca: z.string().nullable().optional(),
      categoria: z.string().nullable().optional(),
      unidadBase: z.string().optional(),
      codigoBarras: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { productoId, ...data } = input
      const producto = await ctx.prisma.productoSuper.findUnique({ where: { id: productoId } })
      if (!producto) throw new TRPCError({ code: 'NOT_FOUND', message: 'Producto no encontrado.' })

      return ctx.prisma.productoSuper.update({
        where: { id: productoId },
        data,
      })
    }),
})

