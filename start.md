# 🥬 LECHUGAS WEB — FINANCEAPP
## Prompt Maestro de Arquitectura — v1.0

---

> Este documento es el prompt de referencia completo para el desarrollo de la aplicación financiera personal/familiar de Lechugas Web Developing.
> Guardalo como fuente de verdad del proyecto. Cada sección puede ser usada como prompt individual para una IA o como guía para el equipo de desarrollo.

---

## 1. VISIÓN GENERAL DEL PROYECTO

Construir una aplicación web SaaS personal/familiar llamada provisionalmente **"Lechugas Finance"** (nombre definitivo a definir).

La aplicación permite a usuarios registrados acceder a un conjunto de herramientas financieras y de organización cotidiana. El acceso es mediante registro + login. Una vez dentro, el usuario ve un **Dashboard principal con menú de herramientas**.

La primera herramienta —y la más compleja— se llama **"Degenerado Fiscal"**: un sistema completo de gestión de finanzas personales con soporte para colaboración entre usuarios, tableros compartidos, listas del supermercado inteligentes, y análisis histórico en el tiempo.

La aplicación está diseñada para uso personal/familiar real, por lo que la UX debe ser fluida, intuitiva y agradable. No es una app corporativa, pero sí profesional.

---

## 2. STACK TECNOLÓGICO DEFINITIVO

### Frontend
| Tecnología | Versión recomendada | Rol |
|---|---|---|
| React | 18+ | UI framework |
| TypeScript | 5+ | Tipado estático |
| Vite | 5+ | Bundler / Dev server |
| TailwindCSS | 3+ | Estilos utilitarios |
| Framer Motion | 11+ | Animaciones y transiciones |
| Recharts | 2+ | Gráficos y visualizaciones |
| tRPC Client | 11+ | Comunicación type-safe con backend |
| React Query (TanStack) | 5+ | Server state management |
| Zustand | 4+ | Client state management |
| React Hook Form | 7+ | Manejo de formularios |
| Zod | 3+ | Validación de esquemas |
| React Router | 6+ | Navegación SPA |
| EmailJS | 4+ | Envío de emails desde frontend |
| date-fns | 3+ | Manipulación de fechas |
| Lucide React | latest | Iconografía |

### Backend
| Tecnología | Versión recomendada | Rol |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Fastify | 4+ | HTTP server (performante, seguro) |
| tRPC Server | 11+ | API type-safe |
| Prisma ORM | 5+ | Acceso a base de datos |
| MariaDB | 10.11 LTS | Base de datos relacional |
| JWT (jose) | 4+ | Autenticación stateless |
| bcryptjs | 2+ | Hash de contraseñas |
| Zod | 3+ | Validación de inputs en server |
| Winston | 3+ | Logging |
| helmet | 7+ | Seguridad HTTP headers |

### Infraestructura / DevOps
| Tecnología | Rol |
|---|---|
| Docker + Docker Compose | Containerización |
| Nginx (reverse proxy) | Exposición pública, SSL termination |
| GitHub Actions (opcional) | CI/CD |

---

## 3. ARQUITECTURA DE REPOS Y ESTRUCTURA DE CARPETAS

### Repos separados (recomendado para VPS multi-proyecto con Docker)

```
GitHub / GitLab:
├── lechugas-finance-frontend     ← React + Vite + TypeScript
├── lechugas-finance-backend      ← Fastify + tRPC + Prisma
└── lechugas-finance-infra        ← Docker Compose maestro + Nginx config
```

---

### Estructura: `lechugas-finance-frontend`

```
lechugas-finance-frontend/
├── public/
├── src/
│   ├── assets/                  # Imágenes, fuentes, SVGs
│   ├── components/
│   │   ├── ui/                  # Componentes base reutilizables (Button, Input, Modal, Card...)
│   │   ├── layout/              # Sidebar, Navbar, PageWrapper, etc.
│   │   └── shared/              # Componentes compartidos entre módulos
│   ├── modules/
│   │   ├── auth/                # Login, Register, ForgotPassword
│   │   ├── dashboard/           # Home principal con menú de herramientas
│   │   └── degenerado-fiscal/
│   │       ├── overview/        # Dashboard principal del módulo
│   │       ├── tarjetas/        # Gestión de tarjetas de crédito/débito
│   │       ├── ingresos/        # Sueldos y otros ingresos
│   │       ├── gastos/          # Gastos fijos (servicios, luz, gas, agua...)
│   │       ├── inversiones/     # Inversiones
│   │       ├── creditos/        # Créditos personales / préstamos
│   │       ├── proyectos/       # Proyectos con presupuesto
│   │       ├── deseos/          # Lista de deseos / wish list
│   │       ├── vacaciones/      # Ahorro y planificación de vacaciones
│   │       ├── boards/          # Boards compartidos (gastos/ingresos compartidos)
│   │       └── supermercado/    # Lista de super inteligente
│   ├── hooks/                   # Custom hooks globales
│   ├── lib/
│   │   ├── trpc.ts              # Configuración del cliente tRPC
│   │   ├── queryClient.ts       # TanStack Query config
│   │   └── utils.ts             # Utilidades generales
│   ├── store/                   # Zustand stores globales
│   ├── types/                   # Tipos TypeScript globales / compartidos
│   ├── router/                  # Definición de rutas React Router
│   ├── styles/                  # Estilos globales, variables CSS
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── Dockerfile
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

### Estructura: `lechugas-finance-backend`

```
lechugas-finance-backend/
├── src/
│   ├── context/                 # tRPC context (user session, db)
│   ├── middleware/              # Auth middleware, rate limiting
│   ├── routers/
│   │   ├── auth.router.ts
│   │   ├── user.router.ts
│   │   ├── tarjetas.router.ts
│   │   ├── ingresos.router.ts
│   │   ├── gastos.router.ts
│   │   ├── inversiones.router.ts
│   │   ├── creditos.router.ts
│   │   ├── proyectos.router.ts
│   │   ├── deseos.router.ts
│   │   ├── vacaciones.router.ts
│   │   ├── boards.router.ts
│   │   └── supermercado.router.ts
│   ├── services/                # Lógica de negocio separada de los routers
│   ├── lib/
│   │   ├── prisma.ts            # Singleton Prisma client
│   │   ├── jwt.ts               # Helpers JWT
│   │   └── mailer.ts            # Configuración EmailJS / nodemailer fallback
│   ├── schemas/                 # Zod schemas compartidos
│   ├── utils/                   # Helpers generales
│   ├── trpc.ts                  # Init tRPC + middlewares
│   └── server.ts                # Entry point Fastify
├── prisma/
│   ├── schema.prisma            # Esquema de base de datos
│   └── migrations/
├── .env.example
├── Dockerfile
├── tsconfig.json
└── package.json
```

---

### Estructura: `lechugas-finance-infra`

```
lechugas-finance-infra/
├── docker-compose.yml           # Orquestación: frontend + backend + mariadb
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── lechugas-finance.conf
├── .env.example
└── README.md
```

---

## 4. ESQUEMA DE BASE DE DATOS COMPLETO (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"   // MariaDB es compatible con el provider mysql de Prisma
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// AUTH & USUARIOS
// ─────────────────────────────────────────────

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  username      String   @unique  // El email también funciona como username
  passwordHash  String
  displayName   String?
  avatarUrl     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relaciones
  tarjetas        Tarjeta[]
  ingresos        Ingreso[]
  gastosFijos     GastoFijo[]
  inversiones     Inversion[]
  creditos        Credito[]
  proyectos       Proyecto[]
  deseos          Deseo[]
  vacaciones      Vacacion[]
  boards          Board[]              // Boards creados por el usuario
  boardMemberships BoardMember[]       // Boards donde es miembro
  listasSuper     ListaSuper[]
  boardInvitations BoardInvitation[]   // Invitaciones recibidas
}

// ─────────────────────────────────────────────
// MÓDULO: TARJETAS
// ─────────────────────────────────────────────

model Tarjeta {
  id             String      @id @default(cuid())
  userId         String
  nombreEntidad  String      // "Banco Nación", "BBVA", etc.
  nombreTarjeta  String      // Nombre personalizado: "Mi Visa Oro"
  tipo           TipoTarjeta // CREDITO | DEBITO | PREPAGA
  red            RedTarjeta  // VISA | MASTERCARD | AMEX | CABAL | NARANJA | OTRA
  ultimos4       String?     // Últimos 4 dígitos (opcional, display)
  color          String?     // Color hex para UI
  modoSimple     Boolean     @default(false) // Si true: solo compras y pagos, ignora gastos calculados
  activa         Boolean     @default(true)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  compras        ComprarTarjeta[]
  pagos          PagoTarjeta[]
  gastosTarjeta  GastoTarjeta[]

  @@index([userId])
}

enum TipoTarjeta {
  CREDITO
  DEBITO
  PREPAGA
}

enum RedTarjeta {
  VISA
  MASTERCARD
  AMEX
  CABAL
  NARANJA
  OTRA
}

model ComprarTarjeta {
  id              String   @id @default(cuid())
  tarjetaId       String
  descripcion     String
  comercio        String?
  categoria       String?
  monto           Decimal  @db.Decimal(12, 2)
  moneda          String   @default("ARS")
  cuotas          Int      @default(1)
  montoCuota      Decimal  @db.Decimal(12, 2)
  fechaCompra     DateTime
  fechaPrimeraCuota DateTime?
  cuotasPagadas   Int      @default(0)
  notas           String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tarjeta         Tarjeta  @relation(fields: [tarjetaId], references: [id], onDelete: Cascade)

  @@index([tarjetaId])
  @@index([fechaCompra])
}

model PagoTarjeta {
  id          String   @id @default(cuid())
  tarjetaId   String
  monto       Decimal  @db.Decimal(12, 2)
  moneda      String   @default("ARS")
  fechaPago   DateTime
  descripcion String?
  tipo        TipoPago @default(PAGO_MINIMO)
  createdAt   DateTime @default(now())

  tarjeta     Tarjeta  @relation(fields: [tarjetaId], references: [id], onDelete: Cascade)

  @@index([tarjetaId])
}

enum TipoPago {
  PAGO_TOTAL
  PAGO_MINIMO
  PAGO_PARCIAL
}

model GastoTarjeta {
  id          String   @id @default(cuid())
  tarjetaId   String
  descripcion String
  monto       Decimal  @db.Decimal(12, 2)
  moneda      String   @default("ARS")
  fecha       DateTime
  tipo        String   // "INTERES", "MANTENIMIENTO", "SEGURO", "OTRO"
  createdAt   DateTime @default(now())

  tarjeta     Tarjeta  @relation(fields: [tarjetaId], references: [id], onDelete: Cascade)

  @@index([tarjetaId])
}

// ─────────────────────────────────────────────
// MÓDULO: INGRESOS
// ─────────────────────────────────────────────

model Ingreso {
  id            String       @id @default(cuid())
  userId        String
  descripcion   String       // "Sueldo", "Freelance", "Alquiler", etc.
  tipo          TipoIngreso
  monto         Decimal      @db.Decimal(12, 2)
  moneda        String       @default("ARS")
  fecha         DateTime
  recurrente    Boolean      @default(false)
  frecuencia    String?      // "MENSUAL", "QUINCENAL", "SEMANAL" (si es recurrente)
  notas         String?      @db.Text
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([fecha])
}

enum TipoIngreso {
  SUELDO
  FREELANCE
  ALQUILER
  INVERSION
  REGALO
  BONO
  OTRO
}

// ─────────────────────────────────────────────
// MÓDULO: GASTOS FIJOS (SERVICIOS)
// ─────────────────────────────────────────────

model GastoFijo {
  id             String          @id @default(cuid())
  userId         String
  nombre         String          // "Luz", "Gas", "Internet", "Agua", etc.
  proveedor      String?         // "EDESUR", "Metrogas", etc.
  categoria      CategoriaGasto
  activo         Boolean         @default(true)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  registros      RegistroGastoFijo[]

  @@index([userId])
}

enum CategoriaGasto {
  ELECTRICIDAD
  GAS
  AGUA
  INTERNET
  TELEFONO
  ALQUILER
  EXPENSAS
  STREAMING
  GIMNASIO
  SEGURO
  TRANSPORTE
  EDUCACION
  SALUD
  OTRO
}

model RegistroGastoFijo {
  id           String    @id @default(cuid())
  gastoFijoId  String
  monto        Decimal   @db.Decimal(12, 2)
  moneda       String    @default("ARS")
  fecha        DateTime  // Fecha del período o vencimiento
  fechaPago    DateTime? // Fecha en que se pagó
  pagado       Boolean   @default(false)
  notas        String?
  createdAt    DateTime  @default(now())

  gastoFijo    GastoFijo @relation(fields: [gastoFijoId], references: [id], onDelete: Cascade)

  @@index([gastoFijoId])
  @@index([fecha])
}

// ─────────────────────────────────────────────
// MÓDULO: INVERSIONES
// ─────────────────────────────────────────────

model Inversion {
  id            String         @id @default(cuid())
  userId        String
  nombre        String
  tipo          TipoInversion
  montoInicial  Decimal        @db.Decimal(12, 2)
  moneda        String         @default("ARS")
  fechaInicio   DateTime
  fechaVencimiento DateTime?
  activa        Boolean        @default(true)
  notas         String?        @db.Text
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  movimientos   MovimientoInversion[]

  @@index([userId])
}

enum TipoInversion {
  PLAZO_FIJO
  ACCIONES
  CRYPTO
  FONDO_COMUN
  DOLAR
  INMUEBLE
  OTRO
}

model MovimientoInversion {
  id           String    @id @default(cuid())
  inversionId  String
  tipo         String    // "DEPOSITO", "RETIRO", "RENDIMIENTO", "ACTUALIZACION"
  monto        Decimal   @db.Decimal(12, 2)
  moneda       String    @default("ARS")
  fecha        DateTime
  descripcion  String?
  createdAt    DateTime  @default(now())

  inversion    Inversion @relation(fields: [inversionId], references: [id], onDelete: Cascade)

  @@index([inversionId])
}

// ─────────────────────────────────────────────
// MÓDULO: CRÉDITOS / PRÉSTAMOS
// ─────────────────────────────────────────────

model Credito {
  id              String   @id @default(cuid())
  userId          String
  nombre          String   // "Préstamo Banco Nación", "Crédito auto"
  entidad         String?
  montoOriginal   Decimal  @db.Decimal(12, 2)
  moneda          String   @default("ARS")
  cuotasTotal     Int
  montoCuota      Decimal  @db.Decimal(12, 2)
  tasaInteres     Decimal? @db.Decimal(6, 4)
  fechaInicio     DateTime
  activo          Boolean  @default(true)
  notas           String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  pagos           PagoCredito[]

  @@index([userId])
}

model PagoCredito {
  id          String   @id @default(cuid())
  creditoId   String
  numeroCuota Int
  monto       Decimal  @db.Decimal(12, 2)
  fechaPago   DateTime
  pagado      Boolean  @default(false)
  notas       String?
  createdAt   DateTime @default(now())

  credito     Credito  @relation(fields: [creditoId], references: [id], onDelete: Cascade)

  @@index([creditoId])
}

// ─────────────────────────────────────────────
// MÓDULO: PROYECTOS
// ─────────────────────────────────────────────

model Proyecto {
  id             String         @id @default(cuid())
  userId         String
  nombre         String
  descripcion    String?        @db.Text
  presupuesto    Decimal?       @db.Decimal(12, 2)
  moneda         String         @default("ARS")
  estado         EstadoProyecto @default(PLANIFICANDO)
  fechaInicio    DateTime?
  fechaObjetivo  DateTime?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  gastos         GastoProyecto[]

  @@index([userId])
}

enum EstadoProyecto {
  PLANIFICANDO
  EN_PROGRESO
  PAUSADO
  COMPLETADO
  CANCELADO
}

model GastoProyecto {
  id           String   @id @default(cuid())
  proyectoId   String
  descripcion  String
  monto        Decimal  @db.Decimal(12, 2)
  moneda       String   @default("ARS")
  fecha        DateTime
  categoria    String?
  createdAt    DateTime @default(now())

  proyecto     Proyecto @relation(fields: [proyectoId], references: [id], onDelete: Cascade)

  @@index([proyectoId])
}

// ─────────────────────────────────────────────
// MÓDULO: DESEOS (WISH LIST)
// ─────────────────────────────────────────────

model Deseo {
  id           String      @id @default(cuid())
  userId       String
  nombre       String
  descripcion  String?
  precio       Decimal?    @db.Decimal(12, 2)
  moneda       String      @default("ARS")
  urlProducto  String?
  imagen       String?
  prioridad    Int         @default(3) // 1=alta, 2=media, 3=baja
  completado   Boolean     @default(false)
  fechaObjetivo DateTime?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// ─────────────────────────────────────────────
// MÓDULO: VACACIONES
// ─────────────────────────────────────────────

model Vacacion {
  id             String   @id @default(cuid())
  userId         String
  destino        String
  descripcion    String?  @db.Text
  presupuesto    Decimal? @db.Decimal(12, 2)
  moneda         String   @default("ARS")
  fechaSalida    DateTime?
  fechaRegreso   DateTime?
  completada     Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  ahorros        AhorroVacacion[]
  gastos         GastoVacacion[]

  @@index([userId])
}

model AhorroVacacion {
  id          String   @id @default(cuid())
  vacacionId  String
  monto       Decimal  @db.Decimal(12, 2)
  fecha       DateTime
  notas       String?
  createdAt   DateTime @default(now())

  vacacion    Vacacion @relation(fields: [vacacionId], references: [id], onDelete: Cascade)
}

model GastoVacacion {
  id          String   @id @default(cuid())
  vacacionId  String
  descripcion String
  monto       Decimal  @db.Decimal(12, 2)
  moneda      String   @default("ARS")
  fecha       DateTime
  categoria   String?  // "VUELO", "HOTEL", "COMIDA", "ACTIVIDAD", "OTRO"
  createdAt   DateTime @default(now())

  vacacion    Vacacion @relation(fields: [vacacionId], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────────
// MÓDULO: BOARDS COMPARTIDOS
// ─────────────────────────────────────────────

model Board {
  id           String       @id @default(cuid())
  nombre       String
  descripcion  String?
  ownerId      String       // Usuario creador
  activo       Boolean      @default(true)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  owner        User         @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  members      BoardMember[]
  movimientos  BoardMovimiento[]
  invitations  BoardInvitation[]

  @@index([ownerId])
}

model BoardMember {
  id           String   @id @default(cuid())
  boardId      String
  userId       String
  porcentaje   Decimal  @db.Decimal(5, 2) @default(50.00) // % de contribución
  rol          RolBoard @default(MIEMBRO)
  joinedAt     DateTime @default(now())

  board        Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([boardId, userId])
  @@index([boardId])
  @@index([userId])
}

enum RolBoard {
  ADMIN
  MIEMBRO
}

model BoardInvitation {
  id          String            @id @default(cuid())
  boardId     String
  invitedById String            // Quién invita
  invitedUserId String?         // Quién fue invitado (si está registrado)
  invitedEmail String           // Email al que se envió
  codigo      String            @unique // Código de 8 caracteres para aceptar
  estado      EstadoInvitacion  @default(PENDIENTE)
  expiresAt   DateTime          // Expira en 7 días
  createdAt   DateTime          @default(now())

  board       Board             @relation(fields: [boardId], references: [id], onDelete: Cascade)
  invitedBy   User              @relation(fields: [invitedById], references: [id], onDelete: Cascade)

  @@index([boardId])
  @@index([codigo])
}

enum EstadoInvitacion {
  PENDIENTE
  ACEPTADA
  RECHAZADA
  EXPIRADA
}

model BoardMovimiento {
  id           String              @id @default(cuid())
  boardId      String
  descripcion  String
  tipo         TipoMovimientoBoard
  monto        Decimal             @db.Decimal(12, 2)
  moneda       String              @default("ARS")
  fecha        DateTime
  // Distribución por miembro (JSON guardado como texto)
  distribucion String?             @db.Text  // JSON: [{userId, monto, porcentaje}]
  notas        String?
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt

  board        Board               @relation(fields: [boardId], references: [id], onDelete: Cascade)

  @@index([boardId])
  @@index([fecha])
}

enum TipoMovimientoBoard {
  INGRESO
  GASTO
}

// ─────────────────────────────────────────────
// MÓDULO: LISTA DE SUPERMERCADO
// ─────────────────────────────────────────────

model ListaSuper {
  id           String        @id @default(cuid())
  userId       String
  nombre       String        // "Semana 1 Junio", "Lista de la quincena"
  supermercado String?       // Nombre del super principal
  estado       EstadoLista   @default(ACTIVA)
  boardId      String?       // Si se asocia a un board compartido
  fechaCompra  DateTime?     // Fecha en que se hizo la compra
  montoTotal   Decimal?      @db.Decimal(12, 2)
  notas        String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  items        ItemListaSuper[]

  @@index([userId])
}

enum EstadoLista {
  ACTIVA
  COMPLETADA
  ARCHIVADA
}

model ItemListaSuper {
  id           String   @id @default(cuid())
  listaId      String
  productoId   String   // Referencia al catálogo de productos
  cantidad     Decimal  @db.Decimal(8, 3)
  unidad       String   @default("unidad")  // "kg", "g", "litro", "unidad", "pack"
  precioUnitario Decimal? @db.Decimal(12, 2)
  precioFinal  Decimal? @db.Decimal(12, 2)  // Con descuento aplicado
  descuentoTipo String?                      // "2x1", "PORCENTAJE", "MONTO_FIJO", "PROMO_BANCO"
  descuentoValor Decimal? @db.Decimal(6, 2)  // % o monto del descuento
  tienePromo   Boolean  @default(false)
  comprado     Boolean  @default(false)
  notas        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  lista        ListaSuper     @relation(fields: [listaId], references: [id], onDelete: Cascade)
  producto     ProductoSuper  @relation(fields: [productoId], references: [id])

  @@index([listaId])
  @@index([productoId])
}

model ProductoSuper {
  id           String    @id @default(cuid())
  nombre       String
  marca        String?
  categoria    String?   // "Lácteos", "Verduras", "Limpieza", etc.
  unidadBase   String    @default("unidad")
  codigoBarras String?   @unique
  imagen       String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  items        ItemListaSuper[]
  precios      PrecioProducto[]

  @@index([nombre])
}

model PrecioProducto {
  id            String   @id @default(cuid())
  productoId    String
  supermercado  String   // "Walmart", "Carrefour", "DIA", "Coto", etc.
  precio        Decimal  @db.Decimal(12, 2)
  moneda        String   @default("ARS")
  fecha         DateTime @default(now())
  tienePrecioAnterior Boolean @default(false)
  precioAnterior Decimal? @db.Decimal(12, 2)
  variacionPct  Decimal? @db.Decimal(6, 2)   // % de variación vs precio anterior en mismo super
  conDescuento  Boolean  @default(false)
  tipoDescuento String?
  valorDescuento Decimal? @db.Decimal(6, 2)
  createdAt     DateTime @default(now())

  producto      ProductoSuper @relation(fields: [productoId], references: [id], onDelete: Cascade)

  @@index([productoId])
  @@index([supermercado])
  @@index([fecha])
}
```

---

## 5. ENDPOINTS / ROUTERS tRPC (Resumen)

### `auth.router.ts`
- `register` — Registro con email + password
- `login` — Login, devuelve JWT
- `me` — Usuario autenticado actual
- `changePassword`
- `forgotPassword` (genera token, envía mail via EmailJS)
- `resetPassword`

### `tarjetas.router.ts`
- `list` — Listar tarjetas del usuario
- `create` / `update` / `delete`
- `getOne` — Detalle de tarjeta + resumen
- `addCompra` / `editCompra` / `deleteCompra`
- `addPago` / `deletePago`
- `addGasto` / `deleteGasto`
- `getResumenMensual` — Saldo estimado por mes
- `getHistoricoDeuda` — Serie temporal para gráfico

### `ingresos.router.ts`
- `list` / `create` / `update` / `delete`
- `getHistorico` — Serie temporal por tipo

### `gastosFijos.router.ts`
- `list` / `create` / `update` / `delete`
- `addRegistro` / `editRegistro` / `deleteRegistro`
- `getHistorico` — Evolución de un gasto en el tiempo
- `getComparativo` — Todos los gastos en un período

### `boards.router.ts`
- `list` — Boards propios + donde es miembro
- `create` / `update` / `delete`
- `inviteUser` — Busca usuario por email, genera código, envía mail
- `acceptInvitation` — Valida código e incorpora al board
- `listMembers` / `updateMemberPercentage` / `removeMember`
- `addMovimiento` / `editMovimiento` / `deleteMovimiento`
- `getResumen` — Balance total y por miembro

### `supermercado.router.ts`
- `listListas` / `createLista` / `updateLista` / `deleteLista`
- `addItem` / `updateItem` / `deleteItem` / `duplicateItem`
- `marcarComprado`
- `searchProducto` — Busca en catálogo
- `createProducto` / `updateProducto`
- `registrarPrecio` — Registra precio nuevo + calcula variación
- `getHistoricoPrecio` — Evolución de precio de producto en un super
- `getComparativoSupers` — Mismo producto en distintos supers

---

## 6. AUTENTICACIÓN Y SEGURIDAD

- **JWT stateless** con access token (15 min) + refresh token (7 días) almacenado en `httpOnly cookie`
- Contraseñas hasheadas con `bcryptjs` (salt rounds: 12)
- Rate limiting en rutas de auth (máx 5 intentos / 15 min por IP)
- Helmet.js en Fastify para headers de seguridad
- CORS configurado solo para el dominio del frontend
- Variables de entorno para todos los secrets (nunca hardcodeado)
- Prisma con validaciones Zod antes de cada mutación

---

## 7. DOCKER COMPOSE (Estructura base)

```yaml
# docker-compose.yml en lechugas-finance-infra

version: '3.9'

services:
  mariadb:
    image: mariadb:10.11
    container_name: lechugas_finance_db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - lechugas_db_data:/var/lib/mysql
    networks:
      - lechugas_net
    # NO exponer puerto 3306 al exterior

  backend:
    build:
      context: ../lechugas-finance-backend
      dockerfile: Dockerfile
    container_name: lechugas_finance_api
    restart: unless-stopped
    environment:
      DATABASE_URL: mysql://${DB_USER}:${DB_PASSWORD}@mariadb:3306/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      NODE_ENV: production
      PORT: 3001
    depends_on:
      - mariadb
    networks:
      - lechugas_net
    # NO exponer al exterior, solo Nginx llega acá

  frontend:
    build:
      context: ../lechugas-finance-frontend
      dockerfile: Dockerfile
    container_name: lechugas_finance_web
    restart: unless-stopped
    networks:
      - lechugas_net

  nginx:
    image: nginx:alpine
    container_name: lechugas_finance_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro  # SSL via Certbot
    depends_on:
      - frontend
      - backend
    networks:
      - lechugas_net

volumes:
  lechugas_db_data:

networks:
  lechugas_net:
    driver: bridge
```

---

## 8. CONFIGURACIÓN NGINX (Rutas)

```nginx
# nginx/conf.d/lechugas-finance.conf

server {
  listen 80;
  server_name tudominio.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  server_name tudominio.com;

  ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

  # Frontend (React SPA)
  location / {
    proxy_pass http://lechugas_finance_web:80;
    proxy_set_header Host $host;
    try_files $uri $uri/ /index.html;
  }

  # Backend API (tRPC)
  location /api/ {
    proxy_pass http://lechugas_finance_api:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## 9. EMAILJS — CONFIGURACIÓN Y USO

EmailJS se usa desde el **frontend** para envitar a usuarios a boards compartidos y para notificaciones de recuperación de contraseña (la lógica de generación del código es del backend, pero el envío del mail se hace desde el cliente).

### Configuración
1. Crear cuenta en emailjs.com
2. Crear un **Service** (Gmail o SMTP propio)
3. Crear **Templates**:
   - `template_board_invite`: Invitación a board compartido
   - `template_reset_password`: Recuperación de contraseña
4. Guardar `SERVICE_ID`, `TEMPLATE_ID` y `PUBLIC_KEY` en `.env` del frontend

### Template: Invitación a Board Compartido
Variables que recibe:
```
{{inviter_name}}     → Nombre de quien invita
{{board_name}}       → Nombre del board
{{invite_code}}      → Código de 8 caracteres
{{app_url}}          → URL de la app
{{to_email}}         → Email del destinatario
```

Mensaje sugerido:
> **{{inviter_name}} te invitó a colaborar en "{{board_name}}"**
>
> Para unirte al tablero compartido de gastos e ingresos, ingresá el siguiente código en la aplicación:
>
> **{{invite_code}}**
>
> Este código expira en 7 días.
> Ingresá a {{app_url}} → Sección "Boards" → "Unirme con código"

---

## 10. MÓDULO: DEGENERADO FISCAL — DESCRIPCIÓN FUNCIONAL COMPLETA

### 10.1 Dashboard Principal del Módulo
- Resumen mensual: ingresos vs egresos vs saldo
- Widgets: deuda total en tarjetas, próximos vencimientos, alertas
- Gráfico de barras: ingresos vs gastos por mes (últimos 12 meses)
- Acceso rápido a todos los sub-módulos

### 10.2 Tarjetas
- Alta/baja/modificación de tarjetas
- Switch "Modo Simple": cuando activo, solo se registran compras y pagos. Los gastos de la tarjeta (intereses, seguros) se ignoran porque el usuario no quiere calcularlos.
- Por cada tarjeta: listado de compras con cuotas (con tracking cuotas pagadas/pendientes), pagos realizados, gastos bancarios
- Resumen mensual estimado (qué pago este mes)
- Gráfico de evolución de deuda en el tiempo
- Comparativo entre tarjetas

### 10.3 Ingresos
- Registrar sueldo, freelance, alquileres, bonos, etc.
- Opción de marcar como recurrente con frecuencia
- Gráfico: evolución del sueldo en el tiempo

### 10.4 Gastos Fijos (Servicios)
- Alta de servicio (luz, gas, agua, internet, etc.)
- Registrar cada boleta/factura mensualmente
- Gráfico histórico por servicio: "¿cuánto vengo pagando de agua cada mes?"
- Comparativo: todos los servicios en el mes

### 10.5 Boards Compartidos
- Crear board con nombre
- Invitar usuario por email (búsqueda en DB, si no existe se informa)
- Envío de mail con código via EmailJS
- El invitado acepta con el código en sección "Mis Boards"
- Porcentajes de distribución configurables por miembro (no tiene que sumar 100%, es indicativo)
- Registrar gastos/ingresos del board
- Vista: balance por miembro, quién debe qué
- Cada movimiento del board también refleja en el perfil individual del usuario (su porción)

### 10.6 Lista de Supermercado
- Crear múltiples listas
- Buscador de productos con autocompletado (catálogo compartido)
- Crear producto si no existe
- Al agregar un producto al carrito: se muestra si la última vez se compró con promo
- Registrar precio al comprar, el sistema calcula variación vs precio anterior en el mismo super
- Si hay descuento: registrar tipo y valor, guardar precio con y sin promo
- Al completar la lista: el monto total puede asignarse al perfil individual o a un board compartido
- Estadísticas: evolución de precio de un producto en el tiempo, comparativo entre supers

---

## 11. HERRAMIENTAS ADICIONALES EN EL MENÚ PRINCIPAL

El menú de herramientas de la app está diseñado para crecer. Degenerado Fiscal es la primera. Futuras herramientas pueden incluir (a definir):

- 📋 Lista de tareas / pendientes
- 🎯 Gestor de metas personales
- 📅 Planificador de eventos
- 🏋️ Tracker de hábitos
- Otras a definir por Lechugas Web

Cada herramienta vive en su propia sección del menú y es modular e independiente.

---

## 12. LINEAMIENTOS DE UI/UX

- Paleta: Oscura (dark mode first), con acentos en verde (#22c55e) como identidad de "Lechugas"
- Tipografía: Inter o Geist
- Animaciones: Framer Motion para transiciones de página, aparición de cards y modales
- Gráficos: Recharts — barras, líneas, área
- Responsive: Mobile-first, la app debe ser usable en celular
- Iconografía: Lucide React
- Feedback: Toasts para acciones, skeletons para carga, estados vacíos ilustrados
- Modales para formularios complejos (tarjetas, compras, invitaciones)

---

## 13. VARIABLES DE ENTORNO

### Backend `.env`
```
DATABASE_URL=mysql://user:pass@mariadb:3306/lechugas_finance
JWT_SECRET=supersecreto_cambiar
JWT_REFRESH_SECRET=otroSecreto_cambiar
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:3001
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_PUBLIC_KEY=
VITE_EMAILJS_TEMPLATE_BOARD_INVITE=
VITE_EMAILJS_TEMPLATE_RESET_PASSWORD=
```

---

## 14. FASES DE DESARROLLO SUGERIDAS

### Fase 1 — Fundamentos (Sprint 1-2)
- [ ] Setup repos, Docker Compose, MariaDB
- [ ] Backend: Fastify + tRPC + Prisma (conexión y migraciones)
- [ ] Auth completo: registro, login, JWT, refresh token
- [ ] Frontend: Vite + React + TailwindCSS + tRPC client
- [ ] Pantallas: Login, Register, Dashboard skeleton con menú

### Fase 2 — Degenerado Fiscal Core (Sprint 3-5)
- [ ] Módulo Ingresos CRUD + gráfico histórico
- [ ] Módulo Gastos Fijos CRUD + gráfico por servicio
- [ ] Módulo Tarjetas completo (modo simple + modo completo)
- [ ] Dashboard resumen Degenerado Fiscal

### Fase 3 — Colaboración (Sprint 6-7)
- [ ] Boards compartidos: crear, invitar, código, aceptar
- [ ] EmailJS integración
- [ ] Movimientos en board + distribución por porcentaje
- [ ] Reflejo en perfil individual

### Fase 4 — Supermercado (Sprint 8-9)
- [ ] Lista de super: crear, agregar items, catálogo de productos
- [ ] Registro de precios + cálculo de variación
- [ ] Historial de precios + comparativo de supers
- [ ] Integración con board compartido

### Fase 5 — Extras y Pulido (Sprint 10+)
- [ ] Módulos: Inversiones, Créditos, Proyectos, Deseos, Vacaciones
- [ ] Gráficos comparativos entre productos/tarjetas
- [ ] Modo oscuro refinado, animaciones Framer Motion
- [ ] Performance: lazy loading por módulo
- [ ] Deploy final en VPS con SSL

---

*Documento generado por Lechugas Web Developing — v1.0*
*Stack: TypeScript + React + Vite + Fastify + tRPC + Prisma + MariaDB + Docker*
```