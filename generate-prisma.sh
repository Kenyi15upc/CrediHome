#!/bin/bash

echo "🔧 Corrigiendo permisos de Prisma..."
sudo chown -R $(whoami):staff node_modules/.prisma node_modules/prisma 2>/dev/null || true

echo "📦 Creando directorio .prisma si no existe..."
mkdir -p node_modules/.prisma/client

echo "🔨 Regenerando cliente Prisma..."
npm run prisma:generate

echo "✅ Cliente Prisma generado correctamente!"

