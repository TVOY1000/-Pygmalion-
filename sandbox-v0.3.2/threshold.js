/**
 * Pygmalion v0.3.0 — Порог «ЧисСлоБукВ»
 * Создание Открытого Ключика (О.К.)
 * Canon v1.0 · Этический фильтр
 * 
 * Интеграция кода Gemini
 */

// ==================== КОНСТАНТЫ ====================
const OK_MIN_LENGTH = 3;
const OK_MAX_LENGTH = 70;

// Виртуальная клавиатура ЧисСлоБукВ
const CHISLOBUKV_KEYBOARD = {
  // Числа (канонические)
  numbers: ['3', '4', '6', '7', '9', '10', '12', '13'],
  // Буквы (кириллица + латиница)
  letters: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ',
  // Символы
  symbols: ['_', '-', '.', '@', '#', '№']
};

// ==================== СОСТОЯНИЕ ====================
const ThresholdState = {
  okKey: '',           // Текущий О.К.
  isComplete: false,   // Завершён ли ввод
  isValid: false,      // Валиден ли (длина 3-70)
  history: []          // История ввода
};

// ==================== ПОРОГ: ЧисСлоБукВ ====================

function initThreshold() {
  // Проверка сохранённого О.К.
  const savedOK = localStorage.getItem('pygmalion_ok_key');
  if (savedOK && savedOK.length >= OK_MIN_LENGTH) {
    ThresholdState.okKey = savedOK;
    ThresholdState.isComplete = true;
    ThresholdState.isValid = true;
    showCombineInterface();
    return;
  }
  
  // Показываем интерфейс Порога
  showThresholdInterface();
}

function showThresholdInterface() {
  const container = document.getElementById('threshold-container');
  if (!container) return;
  
  container.style.display = 'block';
  renderThreshold();
}

function renderThreshold() {
  const container = document.getElementById('threshold-container');
  const okKey = ThresholdState.okKey;
  const length = okKey.length;
  const isValid = length >= OK_MIN_LENGTH && length <= OK_MAX_LENGTH;
  
  // Обновляем отображение О.К.
  const okDisplay = document.getElementById('ok-display');
  if (okDisplay) {
    okDisplay.textContent = okKey || '_';
    okDisplay.className = isValid ? 'ok-valid' : 'ok-pending';
  }
  
  // Обновляем счётчик длины
  const lengthCounter = document.getElementById('ok-length');
  if (lengthCounter) {
    lengthCounter.textContent = `${length} / ${OK_MAX_LENGTH}`;
    lengthCounter.className = isValid ? 'length-valid' : 'length-warning';
  }
  
  // Блокировка кнопки подтверждения
  const confirmBtn = document.getElementById('confirm-ok-btn');
  if (confirmBtn) {
    confirmBtn.disabled = !isValid;
    confirmBtn.classList.toggle('btn-disabled', !isValid);
  }
}

// ==================== ВИРТУАЛЬНАЯ КЛАВИАТУРА ====================

function handleCharInput(char) {
  if (ThresholdState.okKey.length >= OK_MAX_LENGTH) return;
  
  ThresholdState.okKey += char;
  ThresholdState.history.push({ type: 'char', value: char, time: Date.now() });
  
  localStorage.setItem('pygmalion_ok_temp', ThresholdState.okKey);
  
  renderThreshold();
}

function handleBackspace() {
  if (ThresholdState.okKey.length === 0) return;
  
  ThresholdState.okKey = ThresholdState.okKey.slice(0, -1);
  ThresholdState.history.push({ type: 'backspace', time: Date.now() });
  
  localStorage.setItem('pygmalion_ok_temp', ThresholdState.okKey);
  
  renderThreshold();
}

function handleClear() {
  ThresholdState.okKey = '';
  ThresholdState.history.push({ type: 'clear', time: Date.now() });
  
  localStorage.removeItem('pygmalion_ok_temp');
  
  renderThreshold();
}

// ==================== ПОДТВЕРЖДЕНИЕ О.К. ====================

function confirmOKKey() {
  const okKey = ThresholdState.okKey;
  const length = okKey.length;
  
  if (length < OK_MIN_LENGTH || length > OK_MAX_LENGTH) {
    alert(`О.К. должен быть от ${OK_MIN_LENGTH} до ${OK_MAX_LENGTH} символов`);
    return;
  }
  
  // Сохраняем О.К.
  localStorage.setItem('pygmalion_ok_key', okKey);
  localStorage.setItem('pygmalion_ok_created', new Date().toISOString());
  
  ThresholdState.isComplete = true;
  ThresholdState.isValid = true;
  
  console.log(`[Порог] О.К. создан: ${okKey.substring(0, 3)}... (${length} символов)`);
  
  // Переход к Комбайну
  showCombineInterface();
}

// ==================== ПЕРЕХОД К КОМБАЙНУ ====================

function showCombineInterface() {
  const thresholdContainer = document.getElementById('threshold-container');
  const combineContainer = document.getElementById('combine-container');
  
  if (thresholdContainer) {
    thresholdContainer.style.display = 'none';
  }
  
  if (combineContainer) {
    combineContainer.style.display = 'block';
    initCombine(ThresholdState.okKey);
  }
}

// ==================== УТИЛИТЫ ====================

function getOKKey() {
  return localStorage.getItem('pygmalion_ok_key') || '';
}

function clearOKKey() {
  localStorage.removeItem('pygmalion_ok_key');
  localStorage.removeItem('pygmalion_ok_created');
  localStorage.removeItem('pygmalion_ok_temp');
  ThresholdState.okKey = '';
  ThresholdState.isComplete = false;
  location.reload();
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Порог] ЧисСлоБукВ инициализирован');
  initThreshold();
});

// Экспорт для отладки
window.PygmalionThreshold = {
  state: ThresholdState,
  handleCharInput,
  handleBackspace,
  handleClear,
  confirmOKKey,
  getOKKey,
  clearOKKey
};
