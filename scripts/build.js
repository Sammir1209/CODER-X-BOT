import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

console.log('🧹 Limpiando compilaciones anteriores (dist/ y dist-exe/)...');
const distPath = resolve(root, 'dist');
const distExePath = resolve(root, 'dist-exe');
fs.rmSync(distPath, { recursive: true, force: true });
try {
  fs.rmSync(distExePath, { recursive: true, force: true });
} catch (e) {
  console.log('⚠️ No se pudo limpiar dist-exe/ (puede estar en uso por otro proceso).');
}

console.log('📦 Iniciando compilación de la extensión CODER...');

const run = (cmd, env = {}) => {
  execSync(cmd, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env }
  });
};

try {
  // 1. Ejecutar el chequeo de tipos de TypeScript
  console.log('\n🔍 Verificando tipos (TypeScript)...');
  run('npm run typecheck');

  // 2. Compilar Popup
  console.log('\n🎨 Compilando interfaz (Popup)...');
  run('npx vite build', { BUILD_TARGET: 'popup' });

  // 3. Compilar Background Service Worker
  console.log('\n⚙️ Compilando Service Worker (Background)...');
  run('npx vite build', { BUILD_TARGET: 'background' });

  // 4. Compilar Content Scripts (General)
  console.log('\n📄 Compilando Scripts de Contenido (General)...');
  run('npx vite build', { BUILD_TARGET: 'content' });

  // 5. Compilar Stripe Main Script
  console.log('\n💳 Compilando Stripe Interceptor (MAIN World)...');
  run('npx vite build', { BUILD_TARGET: 'stripe-main' });

  // 6. Compilar hCaptcha Solver Script
  console.log('\n🤖 Compilando hCaptcha AI Solver...');
  run('npx vite build', { BUILD_TARGET: 'hcaptcha-solver' });

  console.log('\n✅ ¡Compilación completada con éxito! Carga la carpeta "dist" en Chrome.');
} catch (error) {
  console.error('\n❌ La compilación falló:', error.message);
  process.exit(1);
}
