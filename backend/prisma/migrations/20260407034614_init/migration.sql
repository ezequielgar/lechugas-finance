-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tarjeta` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nombreEntidad` VARCHAR(191) NOT NULL,
    `nombreTarjeta` VARCHAR(191) NOT NULL,
    `tipo` ENUM('CREDITO', 'DEBITO', 'PREPAGA') NOT NULL,
    `red` ENUM('VISA', 'MASTERCARD', 'AMEX', 'CABAL', 'NARANJA', 'OTRA') NOT NULL,
    `ultimos4` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `modoSimple` BOOLEAN NOT NULL DEFAULT false,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Tarjeta_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComprarTarjeta` (
    `id` VARCHAR(191) NOT NULL,
    `tarjetaId` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `comercio` VARCHAR(191) NULL,
    `categoria` VARCHAR(191) NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `cuotas` INTEGER NOT NULL DEFAULT 1,
    `montoCuota` DECIMAL(12, 2) NOT NULL,
    `fechaCompra` DATETIME(3) NOT NULL,
    `fechaPrimeraCuota` DATETIME(3) NULL,
    `cuotasPagadas` INTEGER NOT NULL DEFAULT 0,
    `notas` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ComprarTarjeta_tarjetaId_idx`(`tarjetaId`),
    INDEX `ComprarTarjeta_fechaCompra_idx`(`fechaCompra`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PagoTarjeta` (
    `id` VARCHAR(191) NOT NULL,
    `tarjetaId` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `fechaPago` DATETIME(3) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `tipo` ENUM('PAGO_TOTAL', 'PAGO_MINIMO', 'PAGO_PARCIAL') NOT NULL DEFAULT 'PAGO_MINIMO',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PagoTarjeta_tarjetaId_idx`(`tarjetaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GastoTarjeta` (
    `id` VARCHAR(191) NOT NULL,
    `tarjetaId` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `fecha` DATETIME(3) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GastoTarjeta_tarjetaId_idx`(`tarjetaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ingreso` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `tipo` ENUM('SUELDO', 'FREELANCE', 'ALQUILER', 'INVERSION', 'REGALO', 'BONO', 'OTRO') NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `fecha` DATETIME(3) NOT NULL,
    `recurrente` BOOLEAN NOT NULL DEFAULT false,
    `frecuencia` VARCHAR(191) NULL,
    `notas` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Ingreso_userId_idx`(`userId`),
    INDEX `Ingreso_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GastoFijo` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `proveedor` VARCHAR(191) NULL,
    `categoria` ENUM('ELECTRICIDAD', 'GAS', 'AGUA', 'INTERNET', 'TELEFONO', 'ALQUILER', 'EXPENSAS', 'STREAMING', 'GIMNASIO', 'SEGURO', 'TRANSPORTE', 'EDUCACION', 'SALUD', 'OTRO') NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GastoFijo_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RegistroGastoFijo` (
    `id` VARCHAR(191) NOT NULL,
    `gastoFijoId` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `fecha` DATETIME(3) NOT NULL,
    `fechaPago` DATETIME(3) NULL,
    `pagado` BOOLEAN NOT NULL DEFAULT false,
    `notas` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RegistroGastoFijo_gastoFijoId_idx`(`gastoFijoId`),
    INDEX `RegistroGastoFijo_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inversion` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `tipo` ENUM('PLAZO_FIJO', 'ACCIONES', 'CRYPTO', 'FONDO_COMUN', 'DOLAR', 'INMUEBLE', 'OTRO') NOT NULL,
    `montoInicial` DECIMAL(12, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaVencimiento` DATETIME(3) NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `notas` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Inversion_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MovimientoInversion` (
    `id` VARCHAR(191) NOT NULL,
    `inversionId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `fecha` DATETIME(3) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MovimientoInversion_inversionId_idx`(`inversionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Credito` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `entidad` VARCHAR(191) NULL,
    `montoOriginal` DECIMAL(12, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `cuotasTotal` INTEGER NOT NULL,
    `montoCuota` DECIMAL(12, 2) NOT NULL,
    `tasaInteres` DECIMAL(6, 4) NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `notas` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Credito_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PagoCredito` (
    `id` VARCHAR(191) NOT NULL,
    `creditoId` VARCHAR(191) NOT NULL,
    `numeroCuota` INTEGER NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `fechaPago` DATETIME(3) NOT NULL,
    `pagado` BOOLEAN NOT NULL DEFAULT false,
    `notas` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PagoCredito_creditoId_idx`(`creditoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Proyecto` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `presupuesto` DECIMAL(12, 2) NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `estado` ENUM('PLANIFICANDO', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'CANCELADO') NOT NULL DEFAULT 'PLANIFICANDO',
    `fechaInicio` DATETIME(3) NULL,
    `fechaObjetivo` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Proyecto_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GastoProyecto` (
    `id` VARCHAR(191) NOT NULL,
    `proyectoId` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `fecha` DATETIME(3) NOT NULL,
    `categoria` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GastoProyecto_proyectoId_idx`(`proyectoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Deseo` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `precio` DECIMAL(12, 2) NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `urlProducto` VARCHAR(191) NULL,
    `imagen` VARCHAR(191) NULL,
    `prioridad` INTEGER NOT NULL DEFAULT 3,
    `completado` BOOLEAN NOT NULL DEFAULT false,
    `fechaObjetivo` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Deseo_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vacacion` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `destino` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `presupuesto` DECIMAL(12, 2) NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `fechaSalida` DATETIME(3) NULL,
    `fechaRegreso` DATETIME(3) NULL,
    `completada` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Vacacion_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AhorroVacacion` (
    `id` VARCHAR(191) NOT NULL,
    `vacacionId` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `notas` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GastoVacacion` (
    `id` VARCHAR(191) NOT NULL,
    `vacacionId` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `fecha` DATETIME(3) NOT NULL,
    `categoria` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Board` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Board_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BoardMember` (
    `id` VARCHAR(191) NOT NULL,
    `boardId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `porcentaje` DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
    `rol` ENUM('ADMIN', 'MIEMBRO') NOT NULL DEFAULT 'MIEMBRO',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BoardMember_boardId_idx`(`boardId`),
    INDEX `BoardMember_userId_idx`(`userId`),
    UNIQUE INDEX `BoardMember_boardId_userId_key`(`boardId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BoardInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `boardId` VARCHAR(191) NOT NULL,
    `invitedById` VARCHAR(191) NOT NULL,
    `invitedUserId` VARCHAR(191) NULL,
    `invitedEmail` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `estado` ENUM('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'EXPIRADA') NOT NULL DEFAULT 'PENDIENTE',
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BoardInvitation_codigo_key`(`codigo`),
    INDEX `BoardInvitation_boardId_idx`(`boardId`),
    INDEX `BoardInvitation_codigo_idx`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BoardMovimiento` (
    `id` VARCHAR(191) NOT NULL,
    `boardId` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `tipo` ENUM('INGRESO', 'GASTO') NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `fecha` DATETIME(3) NOT NULL,
    `distribucion` TEXT NULL,
    `notas` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BoardMovimiento_boardId_idx`(`boardId`),
    INDEX `BoardMovimiento_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ListaSuper` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `supermercado` VARCHAR(191) NULL,
    `estado` ENUM('ACTIVA', 'COMPLETADA', 'ARCHIVADA') NOT NULL DEFAULT 'ACTIVA',
    `boardId` VARCHAR(191) NULL,
    `fechaCompra` DATETIME(3) NULL,
    `montoTotal` DECIMAL(12, 2) NULL,
    `notas` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ListaSuper_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemListaSuper` (
    `id` VARCHAR(191) NOT NULL,
    `listaId` VARCHAR(191) NOT NULL,
    `productoId` VARCHAR(191) NOT NULL,
    `cantidad` DECIMAL(8, 3) NOT NULL,
    `unidad` VARCHAR(191) NOT NULL DEFAULT 'unidad',
    `precioUnitario` DECIMAL(12, 2) NULL,
    `precioFinal` DECIMAL(12, 2) NULL,
    `descuentoTipo` VARCHAR(191) NULL,
    `descuentoValor` DECIMAL(6, 2) NULL,
    `tienePromo` BOOLEAN NOT NULL DEFAULT false,
    `comprado` BOOLEAN NOT NULL DEFAULT false,
    `notas` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ItemListaSuper_listaId_idx`(`listaId`),
    INDEX `ItemListaSuper_productoId_idx`(`productoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductoSuper` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `marca` VARCHAR(191) NULL,
    `categoria` VARCHAR(191) NULL,
    `unidadBase` VARCHAR(191) NOT NULL DEFAULT 'unidad',
    `codigoBarras` VARCHAR(191) NULL,
    `imagen` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductoSuper_codigoBarras_key`(`codigoBarras`),
    INDEX `ProductoSuper_nombre_idx`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PrecioProducto` (
    `id` VARCHAR(191) NOT NULL,
    `productoId` VARCHAR(191) NOT NULL,
    `supermercado` VARCHAR(191) NOT NULL,
    `precio` DECIMAL(12, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tienePrecioAnterior` BOOLEAN NOT NULL DEFAULT false,
    `precioAnterior` DECIMAL(12, 2) NULL,
    `variacionPct` DECIMAL(6, 2) NULL,
    `conDescuento` BOOLEAN NOT NULL DEFAULT false,
    `tipoDescuento` VARCHAR(191) NULL,
    `valorDescuento` DECIMAL(6, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PrecioProducto_productoId_idx`(`productoId`),
    INDEX `PrecioProducto_supermercado_idx`(`supermercado`),
    INDEX `PrecioProducto_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Tarjeta` ADD CONSTRAINT `Tarjeta_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComprarTarjeta` ADD CONSTRAINT `ComprarTarjeta_tarjetaId_fkey` FOREIGN KEY (`tarjetaId`) REFERENCES `Tarjeta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PagoTarjeta` ADD CONSTRAINT `PagoTarjeta_tarjetaId_fkey` FOREIGN KEY (`tarjetaId`) REFERENCES `Tarjeta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GastoTarjeta` ADD CONSTRAINT `GastoTarjeta_tarjetaId_fkey` FOREIGN KEY (`tarjetaId`) REFERENCES `Tarjeta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ingreso` ADD CONSTRAINT `Ingreso_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GastoFijo` ADD CONSTRAINT `GastoFijo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegistroGastoFijo` ADD CONSTRAINT `RegistroGastoFijo_gastoFijoId_fkey` FOREIGN KEY (`gastoFijoId`) REFERENCES `GastoFijo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inversion` ADD CONSTRAINT `Inversion_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInversion` ADD CONSTRAINT `MovimientoInversion_inversionId_fkey` FOREIGN KEY (`inversionId`) REFERENCES `Inversion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Credito` ADD CONSTRAINT `Credito_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PagoCredito` ADD CONSTRAINT `PagoCredito_creditoId_fkey` FOREIGN KEY (`creditoId`) REFERENCES `Credito`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proyecto` ADD CONSTRAINT `Proyecto_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GastoProyecto` ADD CONSTRAINT `GastoProyecto_proyectoId_fkey` FOREIGN KEY (`proyectoId`) REFERENCES `Proyecto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deseo` ADD CONSTRAINT `Deseo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vacacion` ADD CONSTRAINT `Vacacion_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AhorroVacacion` ADD CONSTRAINT `AhorroVacacion_vacacionId_fkey` FOREIGN KEY (`vacacionId`) REFERENCES `Vacacion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GastoVacacion` ADD CONSTRAINT `GastoVacacion_vacacionId_fkey` FOREIGN KEY (`vacacionId`) REFERENCES `Vacacion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Board` ADD CONSTRAINT `Board_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BoardMember` ADD CONSTRAINT `BoardMember_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `Board`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BoardMember` ADD CONSTRAINT `BoardMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BoardInvitation` ADD CONSTRAINT `BoardInvitation_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `Board`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BoardInvitation` ADD CONSTRAINT `BoardInvitation_invitedById_fkey` FOREIGN KEY (`invitedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BoardMovimiento` ADD CONSTRAINT `BoardMovimiento_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `Board`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListaSuper` ADD CONSTRAINT `ListaSuper_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemListaSuper` ADD CONSTRAINT `ItemListaSuper_listaId_fkey` FOREIGN KEY (`listaId`) REFERENCES `ListaSuper`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemListaSuper` ADD CONSTRAINT `ItemListaSuper_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `ProductoSuper`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrecioProducto` ADD CONSTRAINT `PrecioProducto_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `ProductoSuper`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
