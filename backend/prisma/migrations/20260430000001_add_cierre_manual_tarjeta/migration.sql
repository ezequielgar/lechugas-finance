-- Eliminar columnas viejas si existen (de un intento anterior)
ALTER TABLE `Tarjeta`
  DROP COLUMN IF EXISTS `cierreManualMes`,
  DROP COLUMN IF EXISTS `cierreManualActual`,
  DROP COLUMN IF EXISTS `cierreManualProximo`;

-- Crear tabla CierreTarjeta (historial de cierres por mes)
CREATE TABLE IF NOT EXISTS `CierreTarjeta` (
    `id` VARCHAR(191) NOT NULL,
    `tarjetaId` VARCHAR(191) NOT NULL,
    `mes` VARCHAR(7) NOT NULL,
    `montoActual` DECIMAL(20, 4) NOT NULL,
    `montoProximo` DECIMAL(20, 4) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `CierreTarjeta_tarjetaId_mes_key`(`tarjetaId`, `mes`),
    INDEX `CierreTarjeta_tarjetaId_idx`(`tarjetaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign key
ALTER TABLE `CierreTarjeta` ADD CONSTRAINT `CierreTarjeta_tarjetaId_fkey`
    FOREIGN KEY (`tarjetaId`) REFERENCES `Tarjeta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
