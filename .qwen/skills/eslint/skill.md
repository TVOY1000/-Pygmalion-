# ESLint + Prettier

**Описание:** Инструменты для обеспечения качества кода и единого стиля.

**Для чего используется:**
- Качество кода в проекте Pygmalion
- Единый стиль кодирования
- Автоматическое форматирование
- Предотвращение распространённых ошибок

**Основные принципы:**

1. **Конфигурация ESLint (.eslintrc.cjs):**
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
}
```

2. **Конфигурация Prettier (.prettierrc):**
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

3. **Prettier игнор (.prettierignore):**
```
dist
node_modules
coverage
*.min.js
.env
.env.local
```

4. **NPM скрипты:**
```json
{
  "scripts": {
    "lint": "eslint src --ext ts,tsx",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "format": "prettier --write src",
    "format:check": "prettier --check src",
    "prepare": "husky install"
  }
}
```

5. **Husky pre-commit hook:**
```bash
#!/bin/bash
npm run lint
npm run format:check
```

**Ссылки:**
- ESLint: https://eslint.org
- Prettier: https://prettier.io
- TypeScript ESLint: https://typescript-eslint.io
