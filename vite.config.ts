import { defineConfig, mergeConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Custom plugin to copy manifest.json and icons to dist directory
function copyManifestPlugin() {
  return {
    name: 'copy-manifest',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
      }
      
      const manifestPath = resolve(__dirname, 'manifest.json');
      if (existsSync(manifestPath)) {
        copyFileSync(manifestPath, resolve(distDir, 'manifest.json'));
      }

      const publicIcons = resolve(__dirname, 'public/icons');
      const distIcons = resolve(distDir, 'icons');
      if (existsSync(publicIcons)) {
        if (!existsSync(distIcons)) mkdirSync(distIcons, { recursive: true });
      }

      // Copy ONNX models
      const publicModels = resolve(__dirname, 'public/models');
      const distModels = resolve(distDir, 'models');
      if (existsSync(publicModels)) {
        if (!existsSync(distModels)) mkdirSync(distModels, { recursive: true });
        const models = ['mobileone-s0.ort', 'nms-yolov5-det.ort'];
        models.forEach(model => {
          if (existsSync(resolve(publicModels, model))) {
            copyFileSync(resolve(publicModels, model), resolve(distModels, model));
          }
        });
      }

      // Copy ONNX Runtime WASM files
      const wasmSrc = resolve(__dirname, 'node_modules/onnxruntime-web/dist');
      const wasmDest = resolve(distDir, 'assets');
      if (existsSync(wasmSrc)) {
        if (!existsSync(wasmDest)) mkdirSync(wasmDest, { recursive: true });
        // Lista de binarios WASM requeridos por onnxruntime-web
        const wasmFiles = [
          'ort-wasm.wasm',
          'ort-wasm-simd.wasm',
          'ort-wasm-threaded.wasm',
          'ort-wasm-simd-threaded.wasm'
        ];
        wasmFiles.forEach(file => {
          if (existsSync(resolve(wasmSrc, file))) {
            copyFileSync(resolve(wasmSrc, file), resolve(wasmDest, file));
          }
        });
      }
    }
  };
}

export default defineConfig(() => {
  const target = process.env.BUILD_TARGET || 'popup';

  const baseConfig = {
    // base path set to default for Chrome Extension
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      // Only empty the directory on the initial popup build
      emptyOutDir: target === 'popup',
    }
  };

  // Build target: Background Service Worker (Inlined - Single File)
  if (target === 'background') {
    return mergeConfig(baseConfig, {
      build: {
        rollupOptions: {
          input: {
            background: resolve(__dirname, 'src/background/serviceWorker.ts'),
          },
          output: {
            inlineDynamicImports: true,
            entryFileNames: 'background.js',
            chunkFileNames: '[name].js',
            assetFileNames: '[name].[ext]',
          },
        },
      },
    });
  }

  // Build target: Content Script (Inlined - Single File)
  if (target === 'content') {
    return mergeConfig(baseConfig, {
      build: {
        rollupOptions: {
          input: {
            content: resolve(__dirname, 'src/content/index.ts'),
          },
          output: {
            inlineDynamicImports: true,
            entryFileNames: 'content.js',
            chunkFileNames: '[name].js',
            assetFileNames: '[name].[ext]',
          },
        },
      },
    });
  }

  // Build target: Stripe Main Content Script (Inlined - Single File)
  if (target === 'stripe-main') {
    return mergeConfig(baseConfig, {
      build: {
        rollupOptions: {
          input: {
            'stripe-main': resolve(__dirname, 'src/content/stripe-main.ts'),
          },
          output: {
            inlineDynamicImports: true,
            entryFileNames: 'stripe-main.js',
            chunkFileNames: '[name].js',
            assetFileNames: '[name].[ext]',
          },
        },
      },
    });
  }

  // Build target: hCaptcha Solver Content Script (Inlined - Single File)
  if (target === 'hcaptcha-solver') {
    return mergeConfig(baseConfig, {
      build: {
        rollupOptions: {
          input: {
            'hcaptcha-solver': resolve(__dirname, 'src/content/hcaptcha-solver.ts'),
          },
          output: {
            inlineDynamicImports: true,
            entryFileNames: 'hcaptcha-solver.js',
            chunkFileNames: '[name].js',
            assetFileNames: '[name].[ext]',
          },
        },
      },
    });
  }

  // Default build target: React Popup (Standard HTML/CSS/JS code-splitting is fine here)
  return mergeConfig(baseConfig, {
    plugins: [copyManifestPlugin()],
    build: {
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'index.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
  });
});
