-- AlterTable
ALTER TABLE `CierreTarjeta` MODIFY `montoActual` DECIMAL(20, 4) NULL,
    ADD COLUMN `fechaCierre` DATETIME(3) NULL;
