# Tailwind CSS

**Описание:** Utility-first CSS фреймворк для быстрой стилизации интерфейсов.

**Для чего используется:**
- Стилизация интерфейса MVP Pygmalion
- Быстрое прототипирование UI компонентов
- Консистентный дизайн через дизайн-токены
- Адаптивная верстка (mobile-first)

**Основные принципы:**

1. **Базовые utility классы:**
```html
<!-- Типографика -->
<p class="text-lg font-bold text-gray-900">Заголовок</p>

<!-- Отступы -->
<div class="p-4 m-2 space-y-4">Контент</div>

<!-- Flexbox -->
<div class="flex items-center justify-between gap-4">
  <span>Элемент 1</span>
  <span>Элемент 2</span>
</div>

<!-- Grid -->
<div class="grid grid-cols-3 gap-4">
  <div>Ячейка 1</div>
  <div>Ячейка 2</div>
</div>
```

2. **Адаптивность:**
```html
<!-- Mobile-first breakpoints -->
<div class="
  w-full 
  sm:w-1/2      /* ≥640px */
  md:w-1/3      /* ≥768px */
  lg:w-1/4      /* ≥1024px */
  xl:w-1/5      /* ≥1280px */
">
  Контент
</div>
```

3. **Состояния:**
```html
<!-- Hover, Focus, Active -->
<button class="
  bg-blue-500 
  hover:bg-blue-600 
  focus:ring-2 
  focus:ring-blue-400
  active:bg-blue-700
">
  Нажми меня
</button>

<!-- Dark mode -->
<div class="
  bg-white 
  dark:bg-gray-800
  text-gray-900 
  dark:text-white
">
  Контент
</div>
```

4. **Кастомизация (tailwind.config.js):**
```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        crystalll: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        }
      }
    }
  },
  plugins: []
}
```

**Ссылки:**
- Документация: https://tailwindcss.com
- Tailwind UI: https://tailwindui.com
- Headless UI: https://headlessui.com
