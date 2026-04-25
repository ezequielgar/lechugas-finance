-- AlterTable: add activo to Ingreso
ALTER TABLE `Ingreso`
    ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true;
