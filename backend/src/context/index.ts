import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken } from '../lib/jwt.js'
import { prisma } from '../lib/prisma.js'
import type { User } from '@prisma/client'

export async function createContext({
  req,
  res,
}: {
  req: FastifyRequest
  res: FastifyReply
}) {
  let user: User | null = null

  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const payload = await verifyAccessToken(token)
      if (payload.sub) {
        user = await prisma.user.findUnique({
          where: { id: payload.sub as string },
        })
      }
    } catch {
      // Token inválido o expirado — user queda null
    }
  }

  return { req, res, user, prisma }
}

export type Context = Awaited<ReturnType<typeof createContext>>
