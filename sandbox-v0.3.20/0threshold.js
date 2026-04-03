/**
 * ========================================
 * Pygmalion v0.3.0 — Порог: ЧисСлоБукВ
 * Создание Открытого Ключика (О.К.)
 * ========================================
 */

// === КОНСТАНТЫ ===
const OK_MIN_LENGTH = 3;
const OK_MAX_LENGTH = 50;  // Для песочницы
const MAX_SPACES = 5;

// Цветовая схема символов
const CHAR_COLORS = {
  // Русские буквы (красные)
  'Ё': 'RED', 'Й': 'RED', 'Ы': 'RED', 'Э': 'RED', 'Ю': 'RED', 'Я': 'RED',
  'З': 'RED', 'Ч': 'RED', 'Ц': 'RED', 'У': 'RED', 'Ф': 'RED', 'Г': 'RED',
  'Ж': 'RED', 'И': 'RED', 'Ш': 'RED', 'Щ': 'RED', 'Л': 'RED', 'Б': 'RED',
  'П': 'RED', 'Ь': 'RED', 'Ъ': 'RED',
  // Латинские буквы (синие)
  'Q': 'BLUE', 'Z': 'BLUE', 'Y': 'BLUE', 'S': 'BLUE', 'U': 'BLUE',
  'F': 'BLUE', 'G': 'BLUE', 'J': 'BLUE', 'I': 'BLUE', 'W': 'BLUE',
  'V': 'BLUE', 'L': 'BLUE', 'N': 'BLUE', 'R': 'BLUE',
  // Общие буквы (зелёные)
  'X': 'GREEN', 'C': 'GREEN', 'T': 'GREEN', '𝕯': 'GREEN', 'M': 'GREEN',
  'O': 'GREEN', 'A': 'GREEN', 'K': 'GREEN', 'E': 'GREEN', 'B': 'GREEN',
  'H': 'GREEN', 'P': 'GREEN'
};

// Получить цвет символа
function getCharColor(char) {
  return CHAR_COLORS[char] ?? 'WHITE';
}

// Раскладка клавиатуры с парными символами (спутниками)
const KEYBOARD_ROWS = [
  // Ряд 0: Ё Й цифры Ы Э
  [
    { val: 'Ё', color: 'RED' }, { val: 'Й', color: 'RED' },
    { val: '8', color: 'WHITE', isDigit: true }, { val: '6', color: 'WHITE', isDigit: true },
    { val: '4', color: 'WHITE', isDigit: true }, { val: '2', color: 'WHITE', isDigit: true },
    { val: '0', color: 'WHITE', isDigit: true }, { val: '1', color: 'WHITE', isDigit: true },
    { val: '3', color: 'WHITE', isDigit: true }, { val: '5', color: 'WHITE', isDigit: true },
    { val: '7', color: 'WHITE', isDigit: true }, { val: '9', color: 'WHITE', isDigit: true },
    { val: 'Ы', color: 'RED' }, { val: 'Э', color: 'RED' }
  ],
  // Ряд 1: Q X C T 𝕯 M O A K E B H P Ю
  [
    { val: 'Q', color: 'BLUE' }, { val: 'X', color: 'GREEN' },
    { val: 'C', color: 'GREEN' }, { val: 'T', color: 'GREEN' },
    { val: '𝕯', color: 'GREEN', isDouble: true },  // Спецсимвол
    { val: 'M', color: 'GREEN' }, { val: 'O', color: 'GREEN' },
    { val: 'A', color: 'GREEN' }, { val: 'K', color: 'GREEN' },
    { val: 'E', color: 'GREEN' }, { val: 'B', color: 'GREEN' },
    { val: 'H', color: 'GREEN' }, { val: 'P', color: 'GREEN' },
    { val: 'Ю', color: 'RED' }
  ],
  // Ряд 2: Z Y S U F G J I W V L N R Я
  [
    { val: 'Z', color: 'BLUE' }, { val: 'Y', color: 'BLUE' },
    { val: 'S', color: 'BLUE' }, { val: 'U', color: 'BLUE' },
    { val: 'F', color: 'BLUE' }, { val: 'G', color: 'BLUE' },
    { val: 'J', color: 'BLUE' }, { val: 'I', color: 'BLUE' },
    { val: 'W', color: 'BLUE' }, { val: 'V', color: 'BLUE' },
    { val: 'L', color: 'BLUE' }, { val: 'N', color: 'BLUE' },
    { val: 'R', color: 'BLUE' }, { val: 'Я', color: 'RED' }
  ],
  // Ряд 3: З Ч Ц У Ф Г Ж И Ш Щ Л Б П Ь/Ъ
  [
    { val: 'З', color: 'RED' }, { val: 'Ч', color: 'RED' },
    { val: 'Ц', color: 'RED' }, { val: 'У', color: 'RED' },
    { val: 'Ф', color: 'RED' }, { val: 'Г', color: 'RED' },
    { val: 'Ж', color: 'RED' }, { val: 'И', color: 'RED' },
    { val: 'Ш', color: 'RED' }, { val: 'Щ', color: 'RED' },
    { val: 'Л', color: 'RED' }, { val: 'Б', color: 'RED' },
    { val: 'П', color: 'RED' },
    { val: 'Ь', alt: 'Ъ', color: 'RED', isSplit: true }  // Разделённая кнопка
  ],
  // Ряд 4: Управление + парные символы (спутники)
  [
    { val: 'delete', type: 'func' },
    { val: '-', alt: '+', color: 'WHITE', isDigit: true, isSplit: true },
    { val: '/', alt: '\\', color: 'WHITE', isDigit: true, isSplit: true },
    { val: '(', alt: '[', color: 'WHITE', isDigit: true, isSplit: true },
    { val: '?', alt: '!', color: 'WHITE', isDigit: true, isSplit: true },
    { val: '=', alt: '≠', color: 'WHITE', isDigit: true, isSplit: true },
    { val: ' ', type: 'space' },
    { val: ',', alt: '.', color: 'WHITE', isDigit: true, isSplit: true },
    { val: ';', alt: ':', color: 'WHITE', isDigit: true, isSplit: true },
    { val: ')', alt: ']', color: 'WHITE', isDigit: true, isSplit: true },
    { val: '@', alt: '&', color: 'WHITE', isDigit: true, isSplit: true },
    { val: '*', alt: '#', color: 'WHITE', isDigit: true, isSplit: true },
    { val: 'backspace', type: 'func' }
  ]
];

// === СОСТОЯНИЕ ===
const ThresholdState = {
  inputData: [],       // Введённые символы
  rowsOrder: [0, 1, 2, 3],  // Порядок рядов (для drag-and-drop)
  draggedRowIndex: null,
  isComplete: false,
  okKey: ''
};

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

// Правильный подсчёт длины строки (𝕯 = 1 символ)
function getCorrectLength(str) {
  return [...str].length;
}

// Проверка валидности О.К.
function isValidOK() {
  const text = ThresholdState.inputData.map(i => i.char).join('');
  const length = getCorrectLength(text);
  const hasConsecutiveSpaces = /  +/.test(text);
  const endsWithSpace = text.endsWith(' ');
  const spaceCount = (text.match(/ /g) || []).length;

  return (
    length >= OK_MIN_LENGTH &&
    length <= OK_MAX_LENGTH &&
    !hasConsecutiveSpaces &&
    !endsWithSpace &&
    spaceCount <= MAX_SPACES
  );
}

// === ОТРИСОВКА ===

function renderKeyboard() {
  const keyboard = document.getElementById('keyboard');
  if (!keyboard) return;

  let html = '';

  // Ряды 0-3 (перетаскиваемые)
  ThresholdState.rowsOrder.forEach((rowIdx, visualIdx) => {
    const row = KEYBOARD_ROWS[rowIdx];
    html += `
      <div class="kb-row kb-draggable" draggable="true" data-row="${rowIdx}" data-visual="${visualIdx}">
        <span class="kb-label">Ряд ${visualIdx}:</span>
        ${row.map(key => renderKey(key)).join('')}
      </div>
    `;
  });

  // Ряд 4 (фиксированный)
  html += `
    <div class="kb-row kb-fixed" data-row="4">
      <span class="kb-label">Ряд 4:</span>
      ${KEYBOARD_ROWS[4].map(key => renderKey(key)).join('')}
    </div>
  `;

  keyboard.innerHTML = html;
  setupKeyboardHandlers();
}

function renderKey(key) {
  if (key.type === 'func') {
    const actionClass = key.val === 'delete' ? 'kb-delete' : 'kb-backspace';
    const label = key.val === 'delete' ? '✕ DEL' : '← BACK';
    return `<button class="kb-btn kb-control ${actionClass}" data-action="${key.val}">${label}</button>`;
  }

  if (key.type === 'space') {
    return `<button class="kb-btn kb-space" data-char=" ">ПРОБЕЛ</button>`;
  }

  if (key.isSplit) {
    // Для разделённых кнопок используем цвет из CHAR_COLORS
    const color = getCharColor(key.val);
    const colorClass = color === 'RED' ? 'kb-red' : (color === 'BLUE' ? 'kb-blue' : 'kb-num');
    return `
      <button class="kb-btn ${colorClass} kb-split" data-char="${key.val}" data-char-alt="${key.alt}">
        <span class="kb-split-tl">${key.val}</span>
        <span class="kb-split-br">${key.alt}</span>
      </button>
    `;
  }

  // Используем правильную цветовую схему
  const color = getCharColor(key.val);
  let colorClass = 'kb-num';
  if (color === 'RED') colorClass = 'kb-red';
  if (color === 'BLUE') colorClass = 'kb-blue';
  if (color === 'GREEN') colorClass = 'kb-green';

  return `<button class="kb-btn ${colorClass}" data-char="${key.val}">${key.val}</button>`;
}

function updateInputDisplay() {
  const display = document.getElementById('ok-display');
  const lengthCounter = document.getElementById('ok-length');
  const confirmBtn = document.getElementById('confirm-ok-btn');

  if (!display || !lengthCounter) return;

  const inputData = ThresholdState.inputData;
  const text = inputData.map(i => i.char).join('');
  const length = getCorrectLength(text);

  if (length === 0) {
    display.innerHTML = '<span class="ok-display-placeholder">_</span>';
    display.classList.remove('valid', 'invalid');
  } else {
    // Цветовое отображение каждого символа с :: границами
    display.innerHTML = `
      <span class="ok-display-border">::</span>
      ${inputData.map(item => {
        const color = getCharColor(item.char);
        const colorClass = color === 'RED' ? 'ok-display-char-red' :
                           (color === 'BLUE' ? 'ok-display-char-blue' :
                           (color === 'GREEN' ? 'ok-display-char-green' : 'ok-display-char-num'));
        return `<span class="${colorClass}">${item.char}</span>`;
      }).join('')}
      <span class="ok-display-border">::</span>
    `;

    const valid = isValidOK();
    display.classList.toggle('valid', valid);
    display.classList.toggle('invalid', !valid);
  }

  lengthCounter.textContent = `${length} / ${OK_MAX_LENGTH}`;
  lengthCounter.classList.toggle('valid', isValidOK());
  lengthCounter.classList.toggle('warning', !isValidOK() && length > 0);

  // Блокировка кнопки подтверждения
  if (confirmBtn) {
    confirmBtn.disabled = !isValidOK();
  }
}

// === ОБРАБОТЧИКИ КЛАВИАТУРЫ ===

function setupKeyboardHandlers() {
  // Обработка кнопок клавиатуры
  document.querySelectorAll('.kb-btn').forEach(btn => {
    btn.addEventListener('click', (event) => {
      const action = btn.dataset.action;
      const char = btn.dataset.char;
      const altChar = btn.dataset.charAlt;

      if (action === 'delete') {
        ThresholdState.inputData = [];
      } else if (action === 'backspace') {
        ThresholdState.inputData = ThresholdState.inputData.slice(0, -1);
      } else if (char) {
        // Обработка разделённой кнопки (Ь/Ъ или парные символы)
        if (altChar) {
          const rect = btn.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;

          // Правая верхняя часть = alt символ
          const useAlt = x > rect.width / 2 && y < rect.height / 2;
          handleKeyPress(useAlt ? altChar : char);
        } else {
          handleKeyPress(char);
        }
      }

      updateInputDisplay();
    });
  });

  // Drag-and-drop для рядов
  document.querySelectorAll('.kb-row.kb-draggable').forEach(row => {
    row.addEventListener('dragstart', handleDragStart);
    row.addEventListener('dragend', handleDragEnd);
    row.addEventListener('dragover', handleDragOver);
    row.addEventListener('dragleave', handleDragLeave);
    row.addEventListener('drop', handleDrop);
  });
}

function handleKeyPress(char) {
  const text = ThresholdState.inputData.map(i => i.char).join('');
  const length = getCorrectLength(text);

  if (length >= OK_MAX_LENGTH) return;

  if (char === ' ') {
    if (length === 0) return;  // Не начинать с пробела
    if (text.endsWith(' ')) return;  // Не более 1 пробела подряд
    if ((text.match(/ /g) || []).length >= MAX_SPACES) return;  // Макс 5 пробелов
  }

  ThresholdState.inputData.push({ char });
}

// === DRAG-AND-DROP ===

function handleDragStart(e) {
  const row = e.target.closest('.kb-row');
  ThresholdState.draggedRowIndex = parseInt(row.dataset.visual);
  row.classList.add('dragging');
}

function handleDragEnd(e) {
  const row = e.target.closest('.kb-row');
  row.classList.remove('dragging');
  ThresholdState.draggedRowIndex = null;
  document.querySelectorAll('.kb-row').forEach(r => r.classList.remove('drag-over'));
}

function handleDragOver(e) {
  e.preventDefault();
  const row = e.target.closest('.kb-row');
  if (row) row.classList.add('drag-over');
}

function handleDragLeave(e) {
  const row = e.target.closest('.kb-row');
  if (row) row.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  const targetRow = e.target.closest('.kb-row');
  if (!targetRow) return;

  const targetIdx = parseInt(targetRow.dataset.visual);

  if (ThresholdState.draggedRowIndex !== null && ThresholdState.draggedRowIndex !== targetIdx) {
    const newOrder = [...ThresholdState.rowsOrder];
    const draggedRow = newOrder[ThresholdState.draggedRowIndex];
    newOrder.splice(ThresholdState.draggedRowIndex, 1);
    newOrder.splice(targetIdx, 0, draggedRow);
    ThresholdState.rowsOrder = newOrder;

    renderKeyboard();
  }
}

// === ПОДТВЕРЖДЕНИЕ О.К. ===

function confirmOK() {
  const text = ThresholdState.inputData.map(i => i.char).join('').trim();
  const length = getCorrectLength(text);

  if (length < OK_MIN_LENGTH || length > OK_MAX_LENGTH) {
    alert(`О.К. должен быть от ${OK_MIN_LENGTH} до ${OK_MAX_LENGTH} символов`);
    return;
  }

  // Сохранение О.К.
  localStorage.setItem('pygmalion_ok_key', text);
  localStorage.setItem('pygmalion_ok_created', new Date().toISOString());

  ThresholdState.okKey = text;
  ThresholdState.isComplete = true;

  console.log(`[Порог] О.К. создан: ${text.substring(0, 3)}... (${length} символов)`);

  // Перенаправление в песочницу (replace — не создаёт запись в истории,
  // исключает петлю при нажатии "назад")
  showToast('О.К. принят! Переход в песочницу...', 'success');
  setTimeout(() => {
    window.location.replace('index.html');
  }, 1500);
}

// === УВЕДОМЛЕНИЯ ===

function showToast(message, type = 'info') {
  // Удаляем старые тосты если есть
  const existingToast = document.getElementById('toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

  // Создаём элемент тоста
  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span class="toast-message">${message}</span>
  `;

  // Добавляем стили если ещё нет
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      #toast-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: toastSlideIn 0.3s ease-out;
      }
      .toast-success { background: #22c55e; }
      .toast-error { background: #ef4444; }
      .toast-info { background: #3b82f6; }
      @keyframes toastSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Автоматическое удаление через 3 секунды
  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);

  console.log(`[${type.toUpperCase()}] ${message}`);
}

// === ПУТЕВОЙ КАМЕНЬ ===

function initWaystone() {
  const overlay = document.getElementById('waystone-overlay');
  const enterBtn = document.getElementById('path-enter-btn');
  const returnBtn = document.getElementById('path-return-btn');
  const exitBtn = document.getElementById('path-exit-btn');
  const thresholdContainer = document.getElementById('threshold-container');

  // DEV-режим: threshold.html?dev — редирект не происходит, можно тестировать
  const isDevMode = new URLSearchParams(window.location.search).has('dev');

  // Проверка: если О.К. уже создан
  const savedOK = localStorage.getItem('pygmalion_ok_key');
  if (savedOK && getCorrectLength(savedOK) >= OK_MIN_LENGTH) {
    ThresholdState.okKey = savedOK;
    ThresholdState.isComplete = true;

    if (isDevMode) {
      // Dev-режим: остаёмся на странице, показываем плашку
      console.log('[Dev] О.К. существует:', savedOK, '— редирект пропущен');
      const devNotice = document.createElement('div');
      devNotice.style.cssText = 'position:fixed;top:12px;right:12px;background:#1d4ed8;color:#fff;padding:8px 14px;border-radius:8px;font-size:13px;z-index:9999;font-family:monospace;';
      devNotice.innerHTML = 'DEV &middot; О.К.: <b>' + savedOK.slice(0, 10) + '&hellip;</b>';
      document.body.appendChild(devNotice);
      // Продолжаем инициализацию как обычно (порог открывается)
    } else {
      // Обычный режим: один редирект, replace() не создаёт запись в истории
      window.location.replace('index.html');
      return;
    }
  }

  // Вход в ЧисСлоБукВ
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.style.display = 'none';
        thresholdContainer.style.display = 'flex';
        renderKeyboard();
        updateInputDisplay();
      }, 1000);
    });
  }

  // Выход (налево)
  const pathLeftExitBtn = document.getElementById('path-left-exit-btn');
  if (pathLeftExitBtn) {
    pathLeftExitBtn.addEventListener('click', () => {
      if (confirm('Вернуться в старый мир бытовых обязательств? Ваш след останется незавершённым.')) {
        window.close();  // Попытка закрыть окно
        // Если не закрылось — перенаправить на главную
        window.location.href = 'https://google.com';
      }
    });
  }

  // Выход (направо)
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      if (confirm('Здесь нет выгоды. Вы уверены, что хотите уйти?')) {
        window.close();  // Попытка закрыть окно
        // Если не закрылось — перенаправить на главную
        window.location.href = 'https://google.com';
      }
    });
  }
}

// === ИНИЦИАЛИЗАЦИЯ ===

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Порог] ЧисСлоБукВ инициализирован');
  initWaystone();

  // Кнопка подтверждения
  const confirmBtn = document.getElementById('confirm-ok-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', confirmOK);
  }

  // Кнопка копирования О.К.
  const copyBtn = document.getElementById('btn-copy-ok');
  const copyFeedback = document.getElementById('copy-feedback');
  if (copyBtn && copyFeedback) {
    copyBtn.addEventListener('click', async () => {
      const text = ThresholdState.inputData.map(i => i.char).join('');
      if (text.length === 0) {
        alert('Сначала введите О.К.');
        return;
      }

      // Копировать с :: границами
      const textWithBoundaries = `::${text}::`;

      try {
        await navigator.clipboard.writeText(textWithBoundaries);
        copyFeedback.classList.add('show');
        setTimeout(() => {
          copyFeedback.classList.remove('show');
        }, 2000);
      } catch (err) {
        // Fallback для старых браузеров
        const textarea = document.createElement('textarea');
        textarea.value = textWithBoundaries;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copyFeedback.classList.add('show');
        setTimeout(() => {
          copyFeedback.classList.remove('show');
        }, 2000);
      }
    });
  }

  // Экспорт для отладки (мультисброс О.К.)
  window.PygmalionThreshold = {
    state: ThresholdState,
    confirmOK,
    getCorrectLength,
    isValidOK,
    // Функция для мультисброса (тестовый режим)
    resetOKKey: () => {
      localStorage.removeItem('pygmalion_ok_key');
      ThresholdState.inputData = [];
      ThresholdState.isComplete = false;
      updateInputDisplay();
      console.log('[Dev] О.К. сброшен для нового ввода');
    }
  };
});
