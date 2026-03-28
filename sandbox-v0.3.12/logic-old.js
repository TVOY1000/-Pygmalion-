/**
 * Pygmalion v0.3.0 «Песочница»
 * Логика 4 актов Кона
 * Canon v1.0 · Этический стоп-кран активен
 * 
 * Ключевые правила:
 * - У.М. не сгорают (в отличие от У.Е.)
 * - Стартовый баланс: 5 У.М.
 * - Формула веса: (Отдано × 3) + (Принято × 1) − (Сгорело × 0)
 */

// ==================== КОНСТАНТЫ ====================
const BURN_TIME_HOURS = 28;
const BURN_TIME_MS = BURN_TIME_HOURS * 60 * 60 * 1000;

// Стартовый баланс У.М. (не сгорают)
const INITIAL_UM_BALANCE = 5;

// Триады: 4 основные + 1 специальная
const TRIADS = [1, 2, 3, 4];
const SPECIAL_UE_NUMBER = 21;

// Период сброса триад — 24 часа
const RESET_PERIOD_MS = 24 * 60 * 60 * 1000;

// Время сброса — 20:00 (по местному времени)
const RESET_HOUR = 20;
const RESET_MINUTE = 0;

// Зона тишины — 5 минут до сброса (19:55–19:59:59)
const SILENCE_DURATION_MINUTES = 5;
const SILENCE_START_MS = (RESET_HOUR * 60 + (RESET_MINUTE - SILENCE_DURATION_MINUTES)) * 60 * 1000; // 19:55

// Состояние приложения
const AppState = {
  // Акт 1: Эмиссия У.Е. (сгорают в 0:00)
  ueBalance: 0,
  ueEmitted: 0,
  emissionTime: null, // Время эмиссии для расчёта сгорания
  triadsUnlocked: [], // Какие триады активированы
  triadsUsedToday: {}, // { 1: timestamp, 2: timestamp, 3: timestamp, 4: timestamp, 21: timestamp }

  // Акт 1: У.М. (не сгорают)
  umBalance: INITIAL_UM_BALANCE,
  umEmitted: 0,

  // Акт 2: Передача (ro.DAG)
  transactions: [],
  dagGraph: [],

  // Акт 3: Облик
  domains: {
    knowledge: 0,    // Знания
    care: 0,         // Забота
    creativity: 0,   // Творчество
    wisdom: 0,       // Мудрость
    trust: 0,        // Доверие
    participation: 0 // Участие
  },

  // Акт 4: Вес
  reputationWeight: 0,
  givenTotal: 0,
  receivedTotal: 0,
  burnedTotal: 0
};

// ==================== АКТ 1: ПЛАН (Эмиссия) ====================

// Проверка: доступна ли триада (1 раз в период 20:00–19:55)
function isTriadAvailable(number) {
  const lastUsed = AppState.triadsUsedToday[number];
  if (!lastUsed) return true; // Никогда не использовалась
  
  // Проверяем: был ли сброс в 20:00 после последнего использования
  const now = new Date();
  const lastUsedDate = new Date(lastUsed);
  
  // Если сейчас 20:00 или позже, а использовали сегодня до 20:00 — сброс был
  if (now.getHours() >= RESET_HOUR && lastUsedDate.getHours() < RESET_HOUR) {
    return true;
  }
  
  // Если использовали вчера — сброс был
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (lastUsedDate < yesterday) {
    return true;
  }
  
  return false; // Ещё не сбросилась
}

// Проверка: зона тишины (19:55–20:00)
function isSilenceZone() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const silenceStartMinutes = RESET_HOUR * 60 - SILENCE_DURATION_MINUTES; // 19:55 = 1195 минут
  const silenceEndMinutes = RESET_HOUR * 60 + RESET_MINUTE; // 20:00 = 1200 минут
  
  return currentMinutes >= silenceStartMinutes && currentMinutes < silenceEndMinutes;
}

// Получить время до полуночи (0:00)
function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

// Получить время сгорания для данной эмиссии
function getBurnTime(emissionTime) {
  const emissionDate = new Date(emissionTime);
  const emissionHour = emissionDate.getHours();
  const emissionMinute = emissionDate.getMinutes();
  
  // Если эмиссия была до 19:55 — сгорает в 0:00 сегодня (ночью)
  // Если эмиссия была после 20:00 — сгорает в 0:00 завтра (ночью)
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  
  return midnight.getTime() - emissionTime;
}

// Получить время следующего сброса для данной триады
function getNextResetTime(lastUsed) {
  const now = new Date();
  const resetToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), RESET_HOUR, RESET_MINUTE, 0);
  
  // Если сброс уже был сегодня, следующий в 20:00 завтра
  if (lastUsed < resetToday.getTime()) {
    return resetToday.getTime();
  } else {
    // Сброс завтра в 20:00
    const resetTomorrow = new Date(resetToday);
    resetTomorrow.setDate(resetTomorrow.getDate() + 1);
    return resetTomorrow.getTime();
  }
}

// Получить время до следующего сброса (для таймера)
function getTimeUntilReset() {
  const now = new Date();
  const resetToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), RESET_HOUR, RESET_MINUTE, 0);
  
  if (now < resetToday) {
    // Сброс сегодня в 20:00
    return resetToday.getTime() - now.getTime();
  } else {
    // Сброс завтра в 20:00
    const resetTomorrow = new Date(resetToday);
    resetTomorrow.setDate(resetTomorrow.getDate() + 1);
    return resetTomorrow.getTime() - now.getTime();
  }
}

// Обновить состояние кнопок триад
function updateTriadButtons() {
  const triadButtons = document.querySelectorAll('.triad-btn');
  const specialBtn = document.querySelector('.special-btn');
  const emitBtn = document.querySelector('.emit-btn');
  
  // Проверка: была ли эмиссия в этом периоде (20:00–19:55)
  const hasEmitted = AppState.emissionTime && !isResetAfterLastEmission();
  
  // Проверка зоны тишины (19:55–20:00)
  const inSilenceZone = isSilenceZone();
  
  // Обновляем текущее время
  updateCurrentDateTime();
  
  // Обновляем таймер сгорания У.Е.
  updateBurnTimerDisplay();
  
  // Блокируем ВСЕ кнопки если была эмиссия ИЛИ зона тишины
  if (hasEmitted || inSilenceZone) {
    const blockReason = hasEmitted 
      ? 'Уже заказано в этом периоде (сброс в 20:00)' 
      : 'Зона тишины (19:55–20:00)';
    
    triadButtons.forEach(btn => {
      btn.disabled = true;
      btn.classList.add('used');
      btn.title = blockReason;
    });
    
    if (specialBtn) {
      specialBtn.disabled = true;
      specialBtn.classList.add('used');
      specialBtn.title = blockReason;
    }
    
    if (emitBtn) {
      emitBtn.disabled = true;
      emitBtn.title = blockReason;
    }
    
    return;
  }
  
  // Вне зоны тишины и не было эмиссии — разблокируем кнопку эмиссии
  if (emitBtn) {
    emitBtn.disabled = false;
    emitBtn.title = '';
  }
  
  // Проверяем доступность триад (1 раз в период)
  triadButtons.forEach(btn => {
    const number = parseInt(btn.dataset.triad);
    const available = isTriadAvailable(number);
    
    if (!available) {
      btn.classList.add('used');
      btn.disabled = true;
      btn.title = 'Использована в этом периоде, сброс в 20:00';
    } else {
      btn.classList.remove('used');
      btn.disabled = false;
      btn.title = '';
    }
  });
  
  // Проверка кнопки №21 — ТОЛЬКО после активации ≥1 триады
  if (specialBtn) {
    const triadsActivated = AppState.triadsUnlocked.length > 0;
    
    if (!triadsActivated) {
      // №21 заблокирована, пока не активирована хотя бы одна триада
      specialBtn.disabled = true;
      specialBtn.classList.remove('used');
      specialBtn.title = 'Доступно после активации ≥1 триады';
    } else {
      // №21 доступна (после выбора триады)
      specialBtn.classList.remove('used');
      specialBtn.disabled = false;
      specialBtn.title = '';
    }
  }
}

// Проверка: был ли сброс после последней эмиссии
function isResetAfterLastEmission() {
  if (!AppState.emissionTime) return true;
  
  const now = new Date();
  const emissionDate = new Date(AppState.emissionTime);
  
  // Если сейчас 20:00 или позже, а эмиссия была сегодня до 20:00 — сброс был
  if (now.getHours() >= RESET_HOUR && emissionDate.getHours() < RESET_HOUR) {
    return true;
  }
  
  // Если эмиссия была вчера — сброс был
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return emissionDate < yesterday;
}

// Обновить текущую дату и время
function updateCurrentDateTime() {
  const datetimeEl = document.getElementById('current-datetime');
  if (!datetimeEl) return;
  
  const now = new Date();
  const formatted = now.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  datetimeEl.textContent = formatted;
}

// Обновить таймер сгорания У.Е.
function updateBurnTimerDisplay() {
  const timerEl = document.getElementById('burn-timer');
  if (!timerEl) return;
  
  if (!AppState.emissionTime || AppState.ueBalance === 0) {
    timerEl.textContent = '--:--:--';
    return;
  }
  
  const msUntilBurn = getBurnTime(AppState.emissionTime);
  
  if (msUntilBurn <= 0) {
    // Уже сгорело
    timerEl.textContent = '00:00:00';
  } else {
    const hours = Math.floor(msUntilBurn / (1000 * 60 * 60));
    const minutes = Math.floor((msUntilBurn % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((msUntilBurn % (1000 * 60)) / 1000);
    
    timerEl.textContent = 
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}

function initEmission() {
  const triadButtons = document.querySelectorAll('.triad-btn');
  const specialBtn = document.querySelector('.special-btn');
  const emitBtn = document.querySelector('.emit-btn');
  let selectedTriad = null;

  // Обработка кнопок триад
  triadButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      triadButtons.forEach(b => b.classList.remove('selected'));
      specialBtn?.classList.remove('selected');
      btn.classList.add('selected');
      selectedTriad = { type: 'triad', number: parseInt(btn.dataset.triad), amount: parseInt(btn.dataset.ue) };
    });
  });

  // Обработка специальной кнопки №21
  if (specialBtn) {
    specialBtn.addEventListener('click', () => {
      if (!specialBtn.disabled) {
        triadButtons.forEach(b => b.classList.remove('selected'));
        specialBtn.classList.add('selected');
        selectedTriad = { type: 'special', number: SPECIAL_UE_NUMBER, amount: 1 };
      }
    });
  }

  emitBtn.addEventListener('click', () => {
    if (!selectedTriad) {
      alert('Выберите триаду (1-4) или специальную У.Е. №21');
      return;
    }

    // Проверка: №21 доступна только после ≥1 триады
    if (selectedTriad.type === 'special' && AppState.triadsUnlocked.length === 0) {
      alert('У.Е. №21 доступна только после активации хотя бы одной триады');
      return;
    }

    emitUE(selectedTriad.amount, selectedTriad.type, selectedTriad.number);
  });
  
  // Разблокируем №21 если уже есть активированные триады (после загрузки)
  if (specialBtn && AppState.triadsUnlocked.length > 0) {
    specialBtn.disabled = false;
  }
}

function emitUE(amount, type = 'triad', number = null) {
  AppState.ueBalance += amount;
  AppState.ueEmitted += amount;
  AppState.emissionTime = Date.now();

  // Если это триада, добавляем в список активированных и записываем время использования
  if (type === 'triad' && number) {
    if (!AppState.triadsUnlocked.includes(number)) {
      AppState.triadsUnlocked.push(number);
    }
    // Записываем время использования
    AppState.triadsUsedToday[number] = Date.now();
  }
  
  // Если это специальная У.Е. №21, записываем время использования
  if (type === 'special' && number === SPECIAL_UE_NUMBER) {
    AppState.triadsUsedToday[SPECIAL_UE_NUMBER] = Date.now();
  }

  // Обновляем UI
  updateUEBalance();
  updateUMBalance();
  updateTriadButtons(); // Обновляем состояние кнопок
  addDAGNode({
    type: 'emission',
    emissionType: type,
    number: number,
    amount: amount,
    timestamp: AppState.emissionTime,
    id: generateTxId()
  });

  // Сохраняем состояние
  saveState();

  console.log(`[Акт 1] Эмиссия: ${amount} У.Е. (${type === 'triad' ? 'Триада ' + number : 'Спец. №' + number})`);
  console.log(`[Сгорание] У.Е. сгорят в 0:00 ${new Date(Date.now() + getTimeUntilMidnight()).toLocaleDateString()}`);
}

// Проверка сгорания У.Е. (в 0:00)
function checkBurn() {
  if (!AppState.emissionTime || AppState.ueBalance === 0) return;
  
  const msUntilBurn = getBurnTime(AppState.emissionTime);
  
  if (msUntilBurn <= 0) {
    // У.Е. сгорели
    const burned = AppState.ueBalance;
    AppState.ueBalance = 0;
    AppState.burnedTotal += burned;
    
    updateUEBalance();
    calculateWeight();
    updateBurnTimerDisplay();
    
    console.log(`[Сгорание] У.Е. сгорели: ${burned}`);
    alert(`У.Е. сгорели в 0:00. Сгорело: ${burned}`);
  }
}

function updateUEBalance() {
  const balanceEl = document.getElementById('ue-balance');
  if (balanceEl) {
    balanceEl.textContent = AppState.ueBalance;
  }
}

function updateUMBalance() {
  const balanceEl = document.getElementById('um-balance');
  if (balanceEl) {
    balanceEl.textContent = AppState.umBalance;
  }
}

// ==================== АКТ 2: ТОК-ОРАКУЛ-С (Передача) ====================

function initTransfer() {
  const transferBtn = document.querySelector('.transfer-btn');

  transferBtn.addEventListener('click', () => {
    transferUM();
  });
}

function transferUM() {
  const recipient = document.getElementById('recipient').value.trim();
  const amount = parseInt(document.getElementById('transfer-amount').value);
  const refInputs = document.querySelectorAll('.ref-input');
  const message = document.getElementById('gratitude-message').value.trim();

  // Валидация
  if (!recipient) {
    alert('Введите получателя');
    return;
  }

  if (amount < 1) {
    alert('Количество должно быть от 1');
    return;
  }

  // Проверка баланса У.М. (не У.Е.)
  if (amount > AppState.umBalance) {
    alert(`Недостаточно У.М. на балансе. Доступно: ${AppState.umBalance}`);
    return;
  }

  // Собираем ссылки на предыдущие транзакции (ro.DAG валидация)
  const refs = Array.from(refInputs)
    .map(input => input.value.trim())
    .filter(ref => ref !== '');

  // Создаём транзакцию
  const transaction = {
    id: generateTxId(),
    type: 'transfer',
    from: 'current_user',
    to: recipient,
    amount: amount,
    refs: refs,
    message: message,
    timestamp: Date.now(),
    domain: selectDomain()
  };

  // Сохраняем транзакцию
  AppState.transactions.push(transaction);
  
  // У.М. списываются с баланса, но создают след ×3
  AppState.umBalance -= amount;
  AppState.givenTotal += amount;

  // Обновляем ro.DAG граф
  addDAGNode(transaction);

  // Обновляем домены (Акт 3)
  if (transaction.domain) {
    AppState.domains[transaction.domain] += amount;
  }

  // Пересчитываем вес (Акт 4) — формула: (Отдано × 3) + ...
  calculateWeight();

  // Обновляем UI
  updateUEBalance();
  updateUMBalance();
  updateDAGVisual();
  updateFlowerVisual();

  // Очищаем форму
  document.getElementById('recipient').value = '';
  document.getElementById('transfer-amount').value = '1';
  document.getElementById('gratitude-message').value = '';
  refInputs.forEach(input => input.value = '');

  console.log(`[Акт 2] Передача: ${amount} У.М. → ${recipient} (след ×3)`);
}

function selectDomain() {
  // Простая эвристика для выбора домена
  const domains = Object.keys(AppState.domains);
  const randomIndex = Math.floor(Math.random() * domains.length);
  return domains[randomIndex];
}

function addDAGNode(transaction) {
  AppState.dagGraph.push(transaction);
}

function updateDAGVisual() {
  const nodesContainer = document.getElementById('dag-nodes');
  if (!nodesContainer) return;
  
  nodesContainer.innerHTML = '';
  
  AppState.dagGraph.slice(-10).forEach(node => {
    const nodeEl = document.createElement('div');
    nodeEl.className = 'dag-node';
    nodeEl.textContent = `${node.id.substring(0, 8)}... (${node.amount} У.Е.)`;
    nodesContainer.appendChild(nodeEl);
  });
}

// ==================== АКТ 3: КОЛ-ЛИЦО-ОБЛИК (Отражение) ====================

function initReflection() {
  updateFlowerVisual();
}

function updateFlowerVisual() {
  const petals = document.querySelectorAll('.flower-petal');
  
  petals.forEach(petal => {
    const domain = petal.dataset.domain;
    const value = AppState.domains[domain];
    
    if (value > 0) {
      petal.classList.add('active');
      // Интенсивность цвета зависит от активности
      const intensity = Math.min(value / 10, 1);
      petal.style.fill = `rgba(59, 130, 246, ${0.2 + intensity * 0.6})`;
    } else {
      petal.classList.remove('active');
      petal.style.fill = 'rgba(148, 163, 184, 0.1)';
    }
  });
}

// ==================== АКТ 4: ВЕС (Итоги) ====================

function initWeight() {
  calculateWeight();
}

function calculateWeight() {
  // Формула: (У.М. Отдано × 3) + (У.М. Принято × 1) − (Сгорело × 0)
  // У.М. не сгорают, поэтому сгоревшие = 0
  const givenWeight = AppState.givenTotal * 3;  // ×3 за каждое отданное У.М.
  const receivedWeight = AppState.receivedTotal * 1;
  const burnedWeight = AppState.burnedTotal * 0;  // У.М. не сгорают!

  AppState.reputationWeight = givenWeight + receivedWeight - burnedWeight;

  // Обновляем UI
  document.getElementById('weight-given').textContent = AppState.givenTotal;
  document.getElementById('weight-given-total').textContent = givenWeight;

  document.getElementById('weight-received').textContent = AppState.receivedTotal;
  document.getElementById('weight-received-total').textContent = receivedWeight;

  document.getElementById('weight-burned').textContent = AppState.burnedTotal;
  document.getElementById('weight-burned-total').textContent = burnedWeight;

  document.getElementById('reputation-weight').textContent = AppState.reputationWeight;

  console.log(`[Акт 4] Репутационный вес: ${AppState.reputationWeight} (формула: ${givenWeight} + ${receivedWeight} - ${burnedWeight})`);
}

// ==================== УТИЛИТЫ ====================

function generateTxId() {
  return 'tx_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function simulateReceive(amount, from) {
  // Симуляция получения У.М. от другого участника
  AppState.receivedTotal += amount;
  AppState.umBalance += amount;  // У.М. получены

  const transaction = {
    id: generateTxId(),
    type: 'receive',
    from: from,
    to: 'current_user',
    amount: amount,
    refs: [],
    timestamp: Date.now()
  };

  AppState.transactions.push(transaction);
  addDAGNode(transaction);

  updateUMBalance();
  updateDAGVisual();
  calculateWeight();
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

// Сохранение состояния в localStorage
function saveState() {
  try {
    localStorage.setItem('crystal_state', JSON.stringify({
      ueBalance: AppState.ueBalance,
      ueEmitted: AppState.ueEmitted,
      umBalance: AppState.umBalance,
      umEmitted: AppState.umEmitted,
      emissionTime: AppState.emissionTime,
      triadsUnlocked: AppState.triadsUnlocked,
      triadsUsedToday: AppState.triadsUsedToday,
      givenTotal: AppState.givenTotal,
      receivedTotal: AppState.receivedTotal,
      burnedTotal: AppState.burnedTotal
    }));
    localStorage.setItem('ro_dag', JSON.stringify(AppState.dagGraph));
    localStorage.setItem('acts_log', JSON.stringify(AppState.transactions));
    console.log('[Сохранение] Состояние сохранено в localStorage');
  } catch (e) {
    console.error('[Ошибка] Не удалось сохранить в localStorage:', e);
  }
}

// Загрузка состояния из localStorage
function loadState() {
  try {
    const crystalState = localStorage.getItem('crystal_state');
    const roDag = localStorage.getItem('ro_dag');
    const actsLog = localStorage.getItem('acts_log');

    if (crystalState) {
      const state = JSON.parse(crystalState);
      AppState.ueBalance = state.ueBalance || 0;
      AppState.ueEmitted = state.ueEmitted || 0;
      AppState.umBalance = state.umBalance || INITIAL_UM_BALANCE;
      AppState.umEmitted = state.umEmitted || 0;
      AppState.emissionTime = state.emissionTime || null;
      AppState.triadsUnlocked = state.triadsUnlocked || [];
      AppState.triadsUsedToday = state.triadsUsedToday || {};
      AppState.givenTotal = state.givenTotal || 0;
      AppState.receivedTotal = state.receivedTotal || 0;
      AppState.burnedTotal = state.burnedTotal || 0;
      console.log('[Загрузка] Состояние загружено из localStorage');
    }

    if (roDag) {
      AppState.dagGraph = JSON.parse(roDag);
      console.log('[Загрузка] ro.DAG граф загружен');
    }

    if (actsLog) {
      AppState.transactions = JSON.parse(actsLog);
      console.log('[Загрузка] Журнал актов загружен');
    }

    // Обновляем UI после загрузки
    updateUEBalance();
    updateUMBalance();
    
    // Разблокируем кнопку №21 если есть активированные триады
    if (AppState.triadsUnlocked.length > 0) {
      const specialBtn = document.querySelector('.special-btn');
      if (specialBtn) specialBtn.disabled = false;
    }

  } catch (e) {
    console.error('[Ошибка] Не удалось загрузить из localStorage:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[v0.3.0] Песочница инициализирована');
  console.log('[Canon] Этический стоп-кран активен');
  console.log(`[Старт] Баланс У.М.: ${INITIAL_UM_BALANCE} (не сгорают)`);
  console.log(`[Сброс] Триады сбрасываются ежедневно в ${RESET_HOUR}:00`);
  console.log(`[Сгорание] У.Е. сгорают в 0:00 (после 20:00 — следующей ночью)`);

  // Загружаем сохранённое состояние
  loadState();

  // Инициализация
  initEmission();
  initTransfer();
  initReflection();
  initWeight();

  // Обновляем состояние кнопок после загрузки
  updateTriadButtons();

  // Обновление времени и проверка сгорания каждую секунду
  updateCurrentDateTime();
  updateBurnTimerDisplay();
  setInterval(() => {
    updateCurrentDateTime();
    updateBurnTimerDisplay();
    checkBurn();
  }, 1000);

  // Автосохранение при изменениях
  setInterval(saveState, 5000); // Каждые 5 секунд

  // Демонстрационные данные (можно удалить)
  setTimeout(() => {
    console.log('[Demo] Симуляция получения 5 У.М. от участника Alice');
    simulateReceive(5, 'Alice');
    saveState();
  }, 2000);
});

// Экспорт для отладки
window.PygmalionSandbox = {
  state: AppState,
  emitUE,
  transferUM,
  simulateReceive,
  calculateWeight,
  saveState,
  loadState,
  // Для тестирования
  isSilenceZone,
  getTimeUntilMidnight,
  getBurnTime,
  checkBurn,
  isTriadAvailable,
  getNextResetTime,
  updateTriadButtons,
  INITIAL_UM_BALANCE,
  SPECIAL_UE_NUMBER,
  RESET_HOUR,
  SILENCE_DURATION_MINUTES
};

console.log('[Отладка] PygmalionSandbox доступен в консоли');
console.log('[Инфо] Используйте PygmalionSandbox.checkBurn() для проверки сгорания');
console.log('[Инфо] Зона тишины: 19:55–20:00 (эмиссия заблокирована)');
