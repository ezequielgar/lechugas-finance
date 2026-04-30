-- AlterTable
ALTER TABLE "Tarjeta" ADD COLUMN "cierreManualMes" TIMESTAMP(3),
ADD COLUMN "cierreManualActual" DECIMAL(65,30),
ADD COLUMN "cierreManualProximo" DECIMAL(65,30);
