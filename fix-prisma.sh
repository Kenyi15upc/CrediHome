#!/bin/bash

echo "🔧 Corrigiendo permisos de Prisma..."
sudo chown -R $(whoami):staff node_modules/.prisma node_modules/prisma

echo "📦 Regenerando cliente Prisma..."
npm run prisma:generate

echo "✅ Listo! Ahora puedes ejecutar 'npm start'"

