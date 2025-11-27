import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...\n');

  console.log('Creando roles...');

  const roleCliente = await prisma.role.upsert({
    where: { id: 10 },
    update: {},
    create: {
      id: 10,
      name: 'CLIENTE'
    }
  });

  const roleAsesor = await prisma.role.upsert({
    where: { id: 20 },
    update: {},
    create: {
      id: 20,
      name: 'ASESOR'
    }
  });

  const roleAdmin = await prisma.role.upsert({
    where: { id: 30 },
    update: {},
    create: {
      id: 30,
      name: 'ADMINISTRADOR'
    }
  });

  console.log('Roles creados:');
  console.log(`   - ${roleCliente.name} (ID: ${roleCliente.id})`);
  console.log(`   - ${roleAsesor.name} (ID: ${roleAsesor.id})`);
  console.log(`   - ${roleAdmin.name} (ID: ${roleAdmin.id})`);

  console.log('\nCreando configuración del sistema...');

  const config = await prisma.configuracionSistema.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      monedaPorDefecto: 'PEN',
      tipoTasaDefecto: 'EFECTIVA',
      capitalizacionDefecto: 'MENSUAL',
      graciaTotalMaxima: 12,
      graciaParcialMaxima: 24
    }
  });

  console.log('Configuración del sistema creada');

  console.log('\nCreando entidades financieras...');

  const entidades = [
    { codigo: 'BCP', nombre: 'Banco de Crédito del Perú', tasaMinima: 6.5, tasaMaxima: 12.0 },
    { codigo: 'BBVA', nombre: 'BBVA Perú', tasaMinima: 6.8, tasaMaxima: 11.5 },
    { codigo: 'SCOTIABANK', nombre: 'Scotiabank Perú', tasaMinima: 7.0, tasaMaxima: 12.5 },
    { codigo: 'INTERBANK', nombre: 'Interbank', tasaMinima: 6.9, tasaMaxima: 11.8 },
    { codigo: 'BIF', nombre: 'Banco Interamericano de Finanzas', tasaMinima: 7.2, tasaMaxima: 13.0 },
    { codigo: 'PICHINCHA', nombre: 'Banco Pichincha', tasaMinima: 7.5, tasaMaxima: 13.5 },
    { codigo: 'GNB', nombre: 'Banco GNB Perú', tasaMinima: 7.3, tasaMaxima: 13.2 },
    { codigo: 'FALABELLA', nombre: 'Banco Falabella Perú', tasaMinima: 8.0, tasaMaxima: 14.0 },
    { codigo: 'SANTANDER', nombre: 'Banco Santander Perú', tasaMinima: 7.1, tasaMaxima: 12.8 },
    { codigo: 'CITIBANK', nombre: 'Citibank Perú', tasaMinima: 7.0, tasaMaxima: 12.0 },
    { codigo: 'MIBANCO', nombre: 'Mibanco', tasaMinima: 8.5, tasaMaxima: 15.0 },
    { codigo: 'CREDISCOTIA', nombre: 'CrediScotia Financiera', tasaMinima: 8.0, tasaMaxima: 14.5 },
    { codigo: 'COMPARTAMOS', nombre: 'Financiera Compartamos', tasaMinima: 9.0, tasaMaxima: 16.0 },
    { codigo: 'CONFIANZA', nombre: 'Financiera Confianza', tasaMinima: 8.8, tasaMaxima: 15.5 },
    { codigo: 'CREDINKA', nombre: 'Financiera Credinka', tasaMinima: 9.2, tasaMaxima: 16.5 },
    { codigo: 'EFECTIVA', nombre: 'Financiera Efectiva', tasaMinima: 8.5, tasaMaxima: 15.0 },
    { codigo: 'PROEMPRESA', nombre: 'Financiera Proempresa', tasaMinima: 8.7, tasaMaxima: 15.2 },
    { codigo: 'QAPAQ', nombre: 'Financiera Qapaq', tasaMinima: 9.0, tasaMaxima: 16.0 }
  ];

  for (const entidad of entidades) {
    await prisma.entidadFinanciera.upsert({
      where: { codigo: entidad.codigo },
      update: {},
      create: {
        codigo: entidad.codigo,
        nombre: entidad.nombre,
        activa: true,
        tasaMinima: entidad.tasaMinima,
        tasaMaxima: entidad.tasaMaxima,
        montoMinimo: 50000,
        montoMaximo: 500000,
        plazoMinimo: 60,
        plazoMaximo: 240,
        aceptaBonoTechoPropio: true
      }
    });
  }

  console.log(`${entidades.length} entidades financieras creadas`);

  console.log('\nSeed completado exitosamente!\n');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

