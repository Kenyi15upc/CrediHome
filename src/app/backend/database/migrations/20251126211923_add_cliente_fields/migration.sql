/*
  Warnings:

  - Made the column `nombre` on table `clientes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dni` on table `clientes` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updated_at` to the `creditos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `unidades_inmobiliarias` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "apellidos" VARCHAR(100),
ADD COLUMN     "direccion" VARCHAR(255),
ADD COLUMN     "email" VARCHAR(100),
ADD COLUMN     "telefono" VARCHAR(20),
ALTER COLUMN "nombre" SET NOT NULL,
ALTER COLUMN "dni" SET NOT NULL;

-- AlterTable
ALTER TABLE "creditos" ADD COLUMN     "gracia_parcial" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gracia_total" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unidad_inmobiliaria_id" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "unidades_inmobiliarias" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "creditos" ADD CONSTRAINT "creditos_unidad_inmobiliaria_id_fkey" FOREIGN KEY ("unidad_inmobiliaria_id") REFERENCES "unidades_inmobiliarias"("id_unidad") ON DELETE SET NULL ON UPDATE CASCADE;
