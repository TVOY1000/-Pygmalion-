# Vite Configuration

**Описание:** Современный сборщик проектов с молниеносной скоростью разработки.

**Для чего используется:**
- Настройка сборщика под проект Pygmalion
- Быстрый HMR (Hot Module Replacement) в разработке
- Оптимизированная сборка для production
- Поддержка TypeScript, CSS, assets из коробки

**Основные принципы:**

1. **Базовая конфигурация (vite.config.ts):**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'dayjs']
        }
      }
    }
  }
})
```

2. **TypeScript конфигурация (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

3. **Скрипты package.json:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write src"
  }
}
```

4. **Оптимизации:**
```typescript
// Preload шрифтов и критических ресурсов
<link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>

// Code splitting через динамические импорты
const Dashboard = () => import('./pages/Dashboard')

// Asset imports
import logo from './assets/logo.svg'
import styles from './styles.module.css'
```

**Ссылки:**
- Документация: https://vitejs.dev
- Плагины: https://vitejs.dev/plugins
- Vite Ecosystem: https://vitejs.ecosyste.ms
