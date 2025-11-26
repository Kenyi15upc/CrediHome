import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  // Crear roles
  console.log('📝 Creando roles...');

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

  console.log('✅ Roles creados:');
  console.log(`   - ${roleCliente.name} (ID: ${roleCliente.id})`);
  console.log(`   - ${roleAsesor.name} (ID: ${roleAsesor.id})`);

  console.log('\n✅ Seed completado exitosamente!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

