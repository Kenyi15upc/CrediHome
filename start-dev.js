#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Iniciando Backend y Frontend...\n');

// Iniciar backend
const backend = spawn('npm', ['run', 'backend'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

// Esperar 3 segundos antes de iniciar el frontend
setTimeout(() => {
  console.log('\n🌐 Iniciando Frontend...\n');

  const frontend = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  // Manejar cierre de procesos
  process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo servidores...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  // Manejar errores
  frontend.on('error', (error) => {
    console.error('❌ Error al iniciar frontend:', error);
  });
}, 3000);

// Manejar errores del backend
backend.on('error', (error) => {
  console.error('❌ Error al iniciar backend:', error);
});


