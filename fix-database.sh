#!/bin/bash

echo "🔧 Solucionando conexión a la base de datos..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Corregir permisos
echo -e "${YELLOW}1. Corrigiendo permisos...${NC}"
sudo chown -R $(whoami):staff node_modules/.prisma node_modules/prisma node_modules/@prisma 2>/dev/null || true
sudo mkdir -p node_modules/.prisma/client 2>/dev/null || true
sudo chown -R $(whoami):staff node_modules/.prisma 2>/dev/null || true

# 2. Generar cliente Prisma
echo -e "${YELLOW}2. Generando cliente Prisma...${NC}"
npm run prisma:generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cliente Prisma generado correctamente${NC}"
else
    echo -e "${RED}❌ Error al generar cliente Prisma${NC}"
    echo -e "${YELLOW}Intentando solución alternativa...${NC}"
    
    # Solución alternativa: reinstalar @prisma/client
    echo "Reinstalando @prisma/client..."
    npm install @prisma/client --save
    npm run prisma:generate
fi

# 3. Verificar migraciones
echo -e "${YELLOW}3. Verificando migraciones...${NC}"
echo "¿Deseas ejecutar las migraciones? (s/n)"
read -r response
if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
    npm run prisma:migrate
fi

echo ""
echo -e "${GREEN}✅ Configuración completada${NC}"
echo "Ahora puedes ejecutar: npm start"

