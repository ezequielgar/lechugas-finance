import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc.js'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createBoardSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
})

const updateBoardSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional().nullable(),
})

const inviteUserSchema = z.object({
  boardId: z.string(),
  email: z.string().email('Email inválido'),
})

const acceptInvitationSchema = z.object({
  codigo: z.string().length(8, 'El código debe tener 8 caracteres'),
})

const updateMemberPercentageSchema = z.object({
  boardId: z.string(),
  userId: z.string(),
  porcentaje: z.number().min(0).max(100),
})

const removeMemberSchema = z.object({
  boardId: z.string(),
  userId: z.string(),
})

const addMovimientoSchema = z.object({
  boardId: z.string(),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  tipo: z.enum(['INGRESO', 'GASTO']),
  monto: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().default('ARS'),
  fecha: z.string().transform(s => new Date(s)),
  notas: z.string().optional(),
})

const editMovimientoSchema = z.object({
  id: z.string(),
  descripcion: z.string().min(1).optional(),
  tipo: z.enum(['INGRESO', 'GASTO']).optional(),
  monto: z.number().positive().optional(),
  moneda: z.string().optional(),
  fecha: z.string().transform(s => new Date(s)).optional(),
  notas: z.string().optional().nullable(),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Verifica que el usuario es miembro (o dueño) del board */
async function requireMember(ctx: any, boardId: string) {
  const board = await ctx.prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [
        { ownerId: ctx.user.id },
        { members: { some: { userId: ctx.user.id } } },
      ],
    },
    include: {
      members: { include: { user: true } },
      movimientos: { orderBy: { fecha: 'desc' } },
      invitations: true,
    },
  })
  if (!board) throw new TRPCError({ code: 'NOT_FOUND', message: 'Board no encontrado o sin acceso.' })
  return board
}

/** Verifica que el usuario es owner o ADMIN del board */
async function requireAdmin(ctx: any, boardId: string) {
  const board = await ctx.prisma.board.findFirst({
    where: { id: boardId },
    include: { members: true },
  })
  if (!board) throw new TRPCError({ code: 'NOT_FOUND', message: 'Board no encontrado.' })
  if (board.ownerId !== ctx.user.id) {
    const member = board.members.find((m: any) => m.userId === ctx.user.id)
    if (!member || member.rol !== 'ADMIN') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo el owner o admins pueden realizar esta acción.' })
    }
  }
  return board
}

// ── Router ────────────────────────────────────────────────────────────────────

export const boardsRouter = router({
  /** Listar boards donde el usuario es owner O miembro */
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.board.findMany({
      where: {
        activo: true,
        OR: [
          { ownerId: ctx.user.id },
          { members: { some: { userId: ctx.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
        movimientos: { orderBy: { fecha: 'desc' } },
        invitations: {
          where: { estado: 'PENDIENTE' },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }),

  /** Crear un board y añadir al creador como ADMIN */
  create: protectedProcedure.input(createBoardSchema).mutation(async ({ ctx, input }) => {
    const board = await ctx.prisma.board.create({
      data: {
        ...input,
        ownerId: ctx.user.id,
        members: {
          create: {
            userId: ctx.user.id,
            rol: 'ADMIN',
            porcentaje: 100,
          },
        },
      },
      include: {
        owner: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
          },
        },
        movimientos: true,
        invitations: true,
      },
    })
    return board
  }),

  /** Editar nombre/descripción del board */
  update: protectedProcedure.input(updateBoardSchema).mutation(async ({ ctx, input }) => {
    await requireAdmin(ctx, input.id)
    const { id, ...data } = input
    return ctx.prisma.board.update({
      where: { id },
      data,
    })
  }),

  /** Eliminar board (solo owner) */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const board = await ctx.prisma.board.findFirst({ where: { id: input.id } })
      if (!board) throw new TRPCError({ code: 'NOT_FOUND', message: 'Board no encontrado.' })
      if (board.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo el owner puede eliminar el board.' })
      }
      await ctx.prisma.board.delete({ where: { id: input.id } })
      return { success: true }
    }),

  /** Invitar un usuario al board por email */
  inviteUser: protectedProcedure.input(inviteUserSchema).mutation(async ({ ctx, input }) => {
    await requireAdmin(ctx, input.boardId)

    // Buscar si el usuario ya existe en el sistema
    const targetUser = await ctx.prisma.user.findFirst({
      where: { email: input.email },
      select: { id: true, email: true, displayName: true },
    })

    // Verificar que no sea ya miembro
    if (targetUser) {
      const alreadyMember = await ctx.prisma.boardMember.findFirst({
        where: { boardId: input.boardId, userId: targetUser.id },
      })
      if (alreadyMember) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Este usuario ya es miembro del board.' })
      }
    }

    // Revocar invitaciones previas pendientes para este email en este board
    await ctx.prisma.boardInvitation.updateMany({
      where: { boardId: input.boardId, invitedEmail: input.email, estado: 'PENDIENTE' },
      data: { estado: 'EXPIRADA' },
    })

    // Generar código único de 8 caracteres
    const codigo = randomBytes(4).toString('hex')

    const invitation = await ctx.prisma.boardInvitation.create({
      data: {
        boardId: input.boardId,
        invitedById: ctx.user.id,
        invitedUserId: targetUser?.id ?? null,
        invitedEmail: input.email,
        codigo,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    })

    return {
      codigo: invitation.codigo,
      invitedEmail: invitation.invitedEmail,
      expiresAt: invitation.expiresAt,
      targetUser,
    }
  }),

  /** Aceptar invitación usando el código */
  acceptInvitation: protectedProcedure.input(acceptInvitationSchema).mutation(async ({ ctx, input }) => {
    const invitation = await ctx.prisma.boardInvitation.findFirst({
      where: { codigo: input.codigo, estado: 'PENDIENTE' },
      include: { board: { include: { members: true } } },
    })

    if (!invitation) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Código inválido o ya utilizado.' })
    }

    if (invitation.expiresAt < new Date()) {
      await ctx.prisma.boardInvitation.update({
        where: { id: invitation.id },
        data: { estado: 'EXPIRADA' },
      })
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'La invitación ha expirado.' })
    }

    // Verificar que no sea ya miembro
    const alreadyMember = invitation.board.members.some((m: any) => m.userId === ctx.user.id)
    if (alreadyMember) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ya eres miembro de este board.' })
    }

    // Calcular porcentaje: distribuir equitativamente
    const currentMemberCount = invitation.board.members.length
    const newPorcentaje = 100 / (currentMemberCount + 1)
    const adjustedPorcentaje = Math.round(newPorcentaje * 100) / 100

    // Ajustar porcentajes existentes
    if (currentMemberCount > 0) {
      const adjustedExisting = Math.round((100 - adjustedPorcentaje) / currentMemberCount * 100) / 100
      for (const member of invitation.board.members) {
        await ctx.prisma.boardMember.update({
          where: { id: member.id },
          data: { porcentaje: adjustedExisting },
        })
      }
    }

    // Agregar nuevo miembro
    await ctx.prisma.boardMember.create({
      data: {
        boardId: invitation.boardId,
        userId: ctx.user.id,
        rol: 'MIEMBRO',
        porcentaje: adjustedPorcentaje,
      },
    })

    // Marcar invitación como aceptada
    await ctx.prisma.boardInvitation.update({
      where: { id: invitation.id },
      data: { estado: 'ACEPTADA', invitedUserId: ctx.user.id },
    })

    return { success: true, boardId: invitation.boardId, boardNombre: invitation.board.nombre }
  }),

  /** Remover un miembro del board */
  removeMember: protectedProcedure.input(removeMemberSchema).mutation(async ({ ctx, input }) => {
    await requireAdmin(ctx, input.boardId)

    // No se puede remover al owner
    const board = await ctx.prisma.board.findUnique({ where: { id: input.boardId } })
    if (board?.ownerId === input.userId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'No se puede remover al owner del board.' })
    }

    const member = await ctx.prisma.boardMember.findFirst({
      where: { boardId: input.boardId, userId: input.userId },
    })
    if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: 'Miembro no encontrado.' })

    await ctx.prisma.boardMember.delete({ where: { id: member.id } })
    return { success: true }
  }),

  /** Actualizar porcentaje de contribución de un miembro */
  updateMemberPercentage: protectedProcedure.input(updateMemberPercentageSchema).mutation(async ({ ctx, input }) => {
    await requireAdmin(ctx, input.boardId)

    const member = await ctx.prisma.boardMember.findFirst({
      where: { boardId: input.boardId, userId: input.userId },
    })
    if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: 'Miembro no encontrado.' })

    return ctx.prisma.boardMember.update({
      where: { id: member.id },
      data: { porcentaje: input.porcentaje },
    })
  }),

  /** Agregar un movimiento al board */
  addMovimiento: protectedProcedure.input(addMovimientoSchema).mutation(async ({ ctx, input }) => {
    const board = await requireMember(ctx, input.boardId)

    // Calcular distribucion por porcentajes de miembros
    const distribucion = board.members.map((m: any) => ({
      userId: m.userId,
      displayName: m.user.displayName ?? m.user.username,
      monto: Math.round(Number(input.monto) * (Number(m.porcentaje) / 100) * 100) / 100,
      porcentaje: Number(m.porcentaje),
    }))

    const { boardId, ...rest } = input
    return ctx.prisma.boardMovimiento.create({
      data: {
        ...rest,
        boardId,
        distribucion: JSON.stringify(distribucion),
      },
    })
  }),

  /** Editar un movimiento */
  editMovimiento: protectedProcedure.input(editMovimientoSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input

    // Verificar que el movimiento pertenece a un board del que es miembro
    const mov = await ctx.prisma.boardMovimiento.findFirst({
      where: {
        id,
        board: {
          OR: [
            { ownerId: ctx.user.id },
            { members: { some: { userId: ctx.user.id } } },
          ],
        },
      },
      include: {
        board: { include: { members: { include: { user: true } } } },
      },
    })
    if (!mov) throw new TRPCError({ code: 'NOT_FOUND', message: 'Movimiento no encontrado.' })

    // Si cambia el monto, recalcular distribucion
    let updatedData: any = { ...data }
    if (data.monto !== undefined) {
      const nuevoMonto = data.monto
      const distribucion = mov.board.members.map((m: any) => ({
        userId: m.userId,
        displayName: m.user.displayName ?? m.user.username,
        monto: Math.round(nuevoMonto * (Number(m.porcentaje) / 100) * 100) / 100,
        porcentaje: Number(m.porcentaje),
      }))
      updatedData.distribucion = JSON.stringify(distribucion)
    }

    return ctx.prisma.boardMovimiento.update({ where: { id }, data: updatedData })
  }),

  /** Eliminar un movimiento */
  deleteMovimiento: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const mov = await ctx.prisma.boardMovimiento.findFirst({
        where: {
          id: input.id,
          board: {
            OR: [
              { ownerId: ctx.user.id },
              { members: { some: { userId: ctx.user.id } } },
            ],
          },
        },
      })
      if (!mov) throw new TRPCError({ code: 'NOT_FOUND', message: 'Movimiento no encontrado.' })
      await ctx.prisma.boardMovimiento.delete({ where: { id: input.id } })
      return { success: true }
    }),

  /** Resumen financiero del board */
  getResumen: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ ctx, input }) => {
      const board = await requireMember(ctx, input.boardId)

      let totalIngresos = 0
      let totalGastos = 0

      // Acumular breakdown por miembro
      const breakdown: Record<string, {
        userId: string
        displayName: string
        ingresos: number
        gastos: number
        balance: number
      }> = {}

      for (const member of board.members) {
        breakdown[member.userId] = {
          userId: member.userId,
          displayName: (member.user as any).displayName ?? (member.user as any).username,
          ingresos: 0,
          gastos: 0,
          balance: 0,
        }
      }

      for (const mov of board.movimientos) {
        const monto = Number(mov.monto)
        if (mov.tipo === 'INGRESO') totalIngresos += monto
        else totalGastos += monto

        if (mov.distribucion) {
          try {
            const dist: Array<{ userId: string; monto: number }> = JSON.parse(mov.distribucion)
            for (const entry of dist) {
              if (breakdown[entry.userId]) {
                if (mov.tipo === 'INGRESO') breakdown[entry.userId].ingresos += entry.monto
                else breakdown[entry.userId].gastos += entry.monto
              }
            }
          } catch { /* ignorar JSON inválido */ }
        }
      }

      // Calcular balance por miembro
      for (const key of Object.keys(breakdown)) {
        breakdown[key].balance = breakdown[key].ingresos - breakdown[key].gastos
      }

      return {
        totalIngresos,
        totalGastos,
        balance: totalIngresos - totalGastos,
        breakdown: Object.values(breakdown),
        movimientos: board.movimientos,
      }
    }),

  /** Cancelar/revocar una invitación pendiente */
  revokeInvitation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.boardInvitation.findFirst({
        where: { id: input.id },
        include: { board: true },
      })
      if (!invitation) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitación no encontrada.' })

      // Solo admin/owner puede revocar
      await requireAdmin(ctx, invitation.boardId)

      await ctx.prisma.boardInvitation.update({
        where: { id: input.id },
        data: { estado: 'EXPIRADA' },
      })
      return { success: true }
    }),
})
