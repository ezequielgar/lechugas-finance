# Lechugas Finance

Aplicacion web full-stack para gestion financiera personal y colaborativa.

Incluye autenticacion con aprobacion por admin, panel administrativo, modulos de finanzas (tarjetas, ingresos, gastos, creditos, inversiones, proyectos, deseos, vacaciones), tableros compartidos y un modulo de supermercado con historial/comparacion de precios e imagenes de productos optimizadas.

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind, React Query, tRPC client, Zustand
- Backend: Fastify, tRPC server, Prisma, MariaDB, JWT (access + refresh), Zod
- Infra local: Docker Compose (MariaDB)
- Imagenes: upload multipart + compresion con sharp (WebP)

## Arquitectura

Monorepo con dos aplicaciones:

- `frontend/`: app React (UI + routing + estado cliente)
- `backend/`: API Fastify+tRPC (auth, reglas de negocio, acceso a DB)

Comunicacion frontend-backend via tRPC en `/api/trpc`.

## Funcionalidades principales

- Registro/login con JWT y refresh token
- Flujo de aprobacion de usuarios por administrador
- Roles `ADMIN` y `USER`
- Dashboard principal
- Modulos de finanzas:
  - Tarjetas y consumos
  - Ingresos
  - Gastos fijos
  - Inversiones
  - Creditos
  - Proyectos
  - Deseos
  - Vacaciones
- Boards compartidos para trabajo colaborativo
- Modulo Supermercado:
  - Carritos por supermercado
  - Historial de precios por producto
  - Comparacion entre supermercados
  - Carga opcional de foto por producto
  - Compresion de imagen y limpieza automatica de archivos viejos

## Requisitos

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Setup rapido (desarrollo)

1. Clonar repo

```bash
git clone https://github.com/ezequielgar/lechugas-finance.git
cd lechugas-finance
```

2. Backend: instalar dependencias

```bash
cd backend
npm install
```

3. Backend: crear `.env` desde ejemplo

```bash
cp .env.example .env
```

4. Levantar MariaDB local

```bash
docker compose up -d
```

5. Prisma: generar cliente y aplicar esquema

```bash
npm run db:generate
npx prisma db push
```

6. Frontend: instalar dependencias y variables

```bash
cd ../frontend
npm install
cp .env.example .env
```

7. Ejecutar apps (en 2 terminales)

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

8. Abrir en navegador

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:3001/health`

## Variables de entorno

### Backend (`backend/.env`)

- `DATABASE_URL` (MariaDB)
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `PORT` (default 3001)
- `NODE_ENV`
- `CORS_ORIGIN` (default `http://localhost:5173`)

### Frontend (`frontend/.env`)

- `VITE_API_URL` (default `http://localhost:3001`)
- Variables de EmailJS (opcionales)

## Scripts utiles

### Backend

- `npm run dev` - modo desarrollo
- `npm run build` - build de produccion
- `npm run start` - correr build
- `npm run db:generate` - generar cliente Prisma
- `npm run db:migrate` - migraciones en desarrollo
- `npm run db:migrate:prod` - migraciones en produccion
- `npm run db:studio` - abrir Prisma Studio

### Frontend

- `npm run dev` - modo desarrollo
- `npm run build` - build de produccion
- `npm run preview` - preview local del build
- `npm run lint` - linting

## Estado del proyecto

Proyecto en evolucion activa. La base funcional principal ya esta implementada y operativa para uso local.

---

Si queres, el proximo paso puede ser agregar capturas de pantalla y una seccion "Roadmap" en este README.
