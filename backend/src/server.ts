import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import staticPlugin from '@fastify/static'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { appRouter } from './routers/index.js'
import { createContext } from './context/index.js'
import { logger } from './lib/logger.js'
import { verifyAccessToken } from './lib/jwt.js'
import { prisma } from './lib/prisma.js'
import { saveProductImage, deleteProductImage, UPLOADS_DIR } from './lib/imageStorage.js'

const PORT = Number(process.env.PORT) || 3001
const HOST = '0.0.0.0'

async function main() {
  const fastify = Fastify({
    logger: false, // Usamos Winston en su lugar
    trustProxy: true,
  })

  // ── Plugins de seguridad ────────────────────────────────────────────────
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // tRPC no lo necesita en API mode
  })

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })

  await fastify.register(cookie, {
    secret: process.env.JWT_SECRET, // firmado para seguridad extra
  })

  // ── Multipart (file uploads) ────────────────────────────────────────────
  await fastify.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max before sharp compression
  })

  // ── Static files (uploaded product images) ─────────────────────────────
  await fastify.register(staticPlugin, {
    root: UPLOADS_DIR,
    prefix: '/uploads/products/',
    decorateReply: false,
    setHeaders(res) {
      // Allow cross-origin loading (helmet sets same-origin by default)
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:5173')
    },
  })

  // ── Upload endpoint ─────────────────────────────────────────────────────
  /**
   * POST /api/upload/product-image?productoId=<optional>
   * Requires Authorization: Bearer <token>
   * Body: multipart/form-data with field "image" (any image mime type)
   * Returns: { url: string }
   */
  fastify.post('/api/upload/product-image', async (req, reply) => {
    // Auth check
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'No autorizado' })
    }
    let userId: string
    try {
      const payload = await verifyAccessToken(authHeader.slice(7))
      userId = payload.sub as string
      if (!userId) throw new Error()
    } catch {
      return reply.status(401).send({ error: 'Token inválido' })
    }

    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'No se recibió ningún archivo' })

    const mime = data.mimetype
    if (!mime.startsWith('image/')) {
      return reply.status(400).send({ error: 'El archivo debe ser una imagen' })
    }

    const buffer = await data.toBuffer()
    const { filename } = await saveProductImage(buffer)
    const url = `/uploads/products/${filename}`

    // If productoId is provided, update the product record and delete the old image
    const productoId = (req.query as Record<string, string>).productoId
    if (productoId) {
      const producto = await prisma.productoSuper.findUnique({ where: { id: productoId } })
      if (producto) {
        await deleteProductImage(producto.imagen)
        await prisma.productoSuper.update({ where: { id: productoId }, data: { imagen: url } })
      }
    }

    return reply.status(200).send({ url })
  })


  await fastify.register(fastifyTRPCPlugin, {
    prefix: '/api/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
      onError({ path, error }: { path?: string; error: { code: string } & Error }) {
        if (error.code === 'INTERNAL_SERVER_ERROR') {
          logger.error(`[tRPC] Error en ${path}:`, error)
        }
      },
    },
  })

  // ── Health check ────────────────────────────────────────────────────────
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  }))

  // ── Arrancar servidor ───────────────────────────────────────────────────
  try {
    await fastify.listen({ port: PORT, host: HOST })
    logger.info(`🚀 Lechugas Finance API corriendo en http://${HOST}:${PORT}`)
    logger.info(`🔍 Health check: http://localhost:${PORT}/health`)
    logger.info(`📡 tRPC endpoint: http://localhost:${PORT}/api/trpc`)
  } catch (err) {
    logger.error('Error al iniciar el servidor:', err)
    process.exit(1)
  }
}

main()
