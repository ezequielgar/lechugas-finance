import { router } from '../trpc.js'
import { authRouter } from './auth.router.js'
import { tarjetaRouter } from './tarjeta.router.js'
import { ingresoRouter } from './ingreso.router.js'
import { gastoFijoRouter } from './gastoFijo.router.js'
import { gastoVariableRouter } from './gastoVariable.router.js'
import { inversionesRouter } from './inversiones.router.js'
import { creditosRouter } from './creditos.router.js'
import { proyectosRouter } from './proyectos.router.js'
import { deseosRouter } from './deseos.router.js'
import { vacacionesRouter } from './vacaciones.router.js'
import { boardsRouter } from './boards.router.js'
import { supermercadoRouter } from './supermercado.router.js'

export const appRouter = router({
  auth: authRouter,
  tarjetas: tarjetaRouter,
  ingresos: ingresoRouter,
  gastosFijos: gastoFijoRouter,
  gastosVariables: gastoVariableRouter,
  inversiones: inversionesRouter,
  creditos: creditosRouter,
  proyectos: proyectosRouter,
  deseos: deseosRouter,
  vacaciones: vacacionesRouter,
  boards: boardsRouter,
  supermercado: supermercadoRouter,
})

export type AppRouter = typeof appRouter
