-- AlterTable: add rol, aprobado, mustChangePassword to User
ALTER TABLE `User`
    ADD COLUMN `rol` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    ADD COLUMN `aprobado` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `mustChangePassword` BOOLEAN NOT NULL DEFAULT false;
