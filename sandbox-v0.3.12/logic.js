/**
 * ========================================
 * ПИГМАЛИОН — Песочница v0.3.0
 * Логика эмиссии (на основе offline-mvp)
 * ========================================
 */

// === КОНСТАНТЫ ===
const RESET_HOUR = 20;
const SILENCE_START_MINUTES = 19 * 60 + 55; // 19:55
const SILENCE_END_MINUTES = 20 * 60; // 20:00
const SLEEP_START_MINUTES = 20 * 60; // 20:00
const SLEEP_END_MINUTES = 4 * 60; // 04:00

// Ключи localStorage
const STORAGE_KEYS = {
    STATE: 'crystal_state',
    OK_KEY: 'pygmalion_ok_key',
    OK_CREATED: 'pygmalion_ok_created',
    DAG: 'ro_dag',
    ACTS: 'acts_log'
};

// Триады У.Е.
const TRIADS = {
    T1: { name: 'Знания', color: '#ef4444', range: [1, 2, 3], ueCount: 3 },
    T2: { name: 'Практики', color: '#facc15', range: [4, 5, 6], ueCount: 3 },
    T3: { name: 'Творчество', color: '#22c55e', range: [7, 8, 9], ueCount: 3 },
    T4: { name: 'Досуг/ЗОЖ', color: '#3b82f6', range: [10, 11, 12], ueCount: 3 },
    T5: { name: '№21', color: '#a855f7', range: [21], ueCount: 1 }
};

// Максимум У.Е. в период (20:00–19:55)
// v0.3.6: 26 = 13 активных + 13 импульсных (в интервале 20:00-00:00)
const MAX_UE_PER_PERIOD = 26;

// Состояние приложения
const AppState = {
    // Эмиссия
    triadsUsed: {}, // { T1: timestamp, T2: timestamp, ... }
    lastEmissionTime: null,

    // У.Е. на балансе (индивидуальные единицы)
    // Структура: [{ id: 7, triad: 'T3', amount: 1, burnAt: timestamp, status: 'active'|'impulse', createdAt: timestamp }]
    ueUnits: [],

    // У.М. (не сгорают)
    umBalance: 5,

    // ro.DAG
    transactions: [],
    dagGraph: [],

    // Домены
    domains: {
        knowledge: 0, care: 0, creativity: 0,
        wisdom: 0, trust: 0, participation: 0
    },

    // Вес
    reputationWeight: 0,
    givenTotal: 0,
    receivedTotal: 0,
    burnedTotal: 0,

    // Для сброса счётчиков "сегодня"
    lastResetDate: null,

    // Для сброса триад в 20:00
    lastTriadsReset: null
};

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Получить текущее время (с учётом тестового смещения)
function getInternalTime() {
    try {
        const now = new Date();
        // Проверяем глобальное смещение (из Dev Panel)
        if (typeof window.__testTimeOffset === 'number') {
            return new Date(now.getTime() + window.__testTimeOffset);
        }
        return now;
    } catch (e) {
        console.error('[Ошибка] getInternalTime:', e);
        return new Date();
    }
}

// Проверка: зона тишины (19:55–20:00)
function isSilenceZone() {
    const now = getInternalTime();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes >= SILENCE_START_MINUTES && currentMinutes < SILENCE_END_MINUTES;
}

// Проверка: была ли эмиссия в этом периоде (20:00–19:55)
function hasEmittedThisPeriod() {
    if (!AppState.lastEmissionTime) return false;
    return !isNewPeriodSince(AppState.lastEmissionTime);
}

// Проверка: доступна ли триада (1 раз в период)
function isTriadAvailable(triadKey) {
    const lastUsed = AppState.triadsUsed[triadKey];
    if (!lastUsed) return true;
    return isNewPeriodSince(lastUsed);
}

// Проверка: наступил ли новый период (20:00) с момента timestamp
function isNewPeriodSince(timestamp) {
    const now = getInternalTime();
    const pastDate = new Date(timestamp);

    // Если сейчас 20:00 или позже, а событие было сегодня до 20:00 — период сменился
    if (now.getHours() >= RESET_HOUR && pastDate.getHours() < RESET_HOUR) {
        return true;
    }

    // Если событие было вчера или раньше — период сменился
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(RESET_HOUR, 0, 0, 0);
    if (pastDate < yesterday) {
        return true;
    }

    return false;
}

// Получить время до полуночи (0:00)
function getTimeUntilMidnight() {
    const now = getInternalTime();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    return midnight.getTime() - now.getTime();
}

// Рассчитать burn_at для новых У.Е.
// ИСПРАВЛЕНО v0.4.1: 24+4 = 28 часов жизненного цикла У.Е.
//
// Правила:
// - Окно заказа: 20:00–19:55 следующего дня
// - У.Е. после 20:00 "спят" до 04:00 (статус "Импульс")
// - Полный цикл: 28 часов максимум
//   * 20:00 День 1 → 00:00 День 3 (28 часов)
//   * 00:00-03:59 День 2 → 00:00 День 3 (20-24 часа)
//   * 04:00-19:55 День 2 → 00:00 День 2 (4.5-24 часа)
// - Зона тишины: 5 минут (19:55–20:00) для перезагрузки реестров

function calculateBurnAt() {
    const now = getInternalTime();
    const hour = now.getHours();

    // Создаём базовую дату (сегодня 00:00)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    // 20:00–23:59 — послезавтра 00:00 (28-32 часа, "предзаказ")
    if (hour >= 20) {
        const burnDate = new Date(today);
        burnDate.setDate(burnDate.getDate() + 2);
        console.log(`[calculateBurnAt] Ночная эмиссия (предзаказ): ${now.toLocaleString()} → сгорание ${burnDate.toLocaleString()} (28-32ч)`);
        return burnDate.getTime();
    }

    // 00:00–03:59 — послезавтра 00:00 (20-24 часа, "ночной хвост")
    if (hour < 4) {
        const burnDate = new Date(today);
        burnDate.setDate(burnDate.getDate() + 1);
        console.log(`[calculateBurnAt] Ночная эмиссия (хвост): ${now.toLocaleString()} → сгорание ${burnDate.toLocaleString()} (20-24ч)`);
        return burnDate.getTime();
    }

    // 04:00–19:55 — завтра 00:00 (4.5-24 часа, "дневная эмиссия")
    const burnDate = new Date(today);
    burnDate.setDate(burnDate.getDate() + 1);
    console.log(`[calculateBurnAt] Дневная эмиссия: ${now.toLocaleString()} → сгорание ${burnDate.toLocaleString()} (4.5-24ч)`);
    return burnDate.getTime();
}

// Получить время до сгорания для конкретной группы У.Е.
function getTimeToBurn(burnAt) {
    if (!burnAt) return 0;
    const now = getInternalTime();
    return burnAt - now.getTime();
}

// Определить текущую фазу
// ИСПРАВЛЕНО v0.4.1: Единая логика фаз с engine.js
function getCurrentPhase() {
    try {
        const now = getInternalTime();
        const minutes = now.getHours() * 60 + now.getMinutes();

        if (minutes >= SILENCE_START_MINUTES && minutes < SILENCE_END_MINUTES) {
            return 'silence'; // Зона тишины (19:55-20:00)
        }
        if (minutes >= SLEEP_START_MINUTES || minutes < SLEEP_END_MINUTES) {
            return 'sleep'; // Период сна (20:00-04:00)
        }
        return 'active'; // Период действия (04:00-19:55)
    } catch (e) {
        console.error('[Ошибка] getCurrentPhase:', e);
        return 'active'; // По умолчанию активная фаза
    }
}

// Проверка: можно ли передавать У.Е.
function isTransferAllowed() {
    const phase = getCurrentPhase();
    
    // В активной фазе (04:00-19:55) — можно передавать всё
    if (phase === 'active') {
        return true;
    }
    
    // В зоне тишины (19:55-20:00) — нельзя ничего
    if (phase === 'silence') {
        return false;
    }
    
    // В фазе сна (20:00-04:00) — проверяем наличие дневных У.Е. (сгорающих сегодня)
    if (phase === 'sleep') {
        const now = getInternalTime();
        const todayBurnAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();
        
        // Есть ли У.Е. которые сгорают сегодня в 00:00?
        const hasTodayUE = AppState.ueUnits.some(ue => 
            ue.burnAt === todayBurnAt && 
            ue.status === 'active' && 
            ue.amount > 0
        );
        
        // Если есть дневные У.Е. — можно передавать только их до 23:59
        return hasTodayUE;
    }
    
    return false;
}

// Получить доступные для передачи У.Е. (с учётом фазы)
// ИСПРАВЛЕНО v0.4.2f: Доступны ВСЕ active У.Е. (без проверки burn_at)
// Канон: Днём доступны все активные У.Е.

function getAvailableForTransfer() {
    const phase = getCurrentPhase();

    if (phase === 'active') {
        // Днём доступны ВСЕ активные У.Е. (burn_at не проверяем)
        return AppState.ueUnits
            .filter(ue => ue.status === 'active' && ue.amount > 0)
            .reduce((sum, ue) => sum + ue.amount, 0);
    }

    if (phase === 'sleep') {
        // Ночью только дневные (сгорающие сегодня в 00:00)
        const now = getInternalTime();
        const todayBurnAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();
        return AppState.ueUnits
            .filter(ue => ue.burnAt === todayBurnAt && ue.status === 'active' && ue.amount > 0)
            .reduce((sum, ue) => sum + ue.amount, 0);
    }

    return 0; // В зоне тишины
}

// Проверка: можно ли эмитировать
function isEmissionAllowed() {
    const phase = getCurrentPhase();
    return phase !== 'silence'; // Эмиссия запрещена только в зоне тишины
}

// Получить статус У.Е. (для группы)
function getUEStatus(burnAt) {
    const phase = getCurrentPhase();
    if (phase === 'sleep') {
        return 'impulse'; // В период сна все У.Е. в статусе "импульс"
    }
    return 'active'; // В период действия все У.Е. активны
}

// Сумма У.Е. эмитированных в текущем периоде (20:00-19:55)
// v0.3.8: Считаем ВСЕ У.Е. с данным burn_at (не только impulse)
function getUEEmittedThisPeriod() {
    const now = getInternalTime();
    const hour = now.getHours();

    // Определяем target burn_at для текущего периода
    let targetBurnAt;
    if (hour >= 20) {
        // 20:00-23:59 — предзаказ, burn_at = послезавтра 00:00
        targetBurnAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0).getTime();
    } else {
        // 00:00-19:55 — burn_at = завтра 00:00
        targetBurnAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();
    }

    // v0.3.8: Считаем ВСЕ У.Е. с этим burn_at (предзаказ текущего периода)
    // Статус не важен (impulse или active — всё ещё У.Е. этого периода)
    const count = AppState.ueUnits
        .filter(ue => ue.burnAt === targetBurnAt && ue.amount > 0)
        .reduce((sum, ue) => sum + ue.amount, 0);

    console.log(`[getUEEmittedThisPeriod] targetBurnAt: ${new Date(targetBurnAt).toLocaleString()}, всего: ${count}`);
    return count;
}

// Сумма активных У.Е. (дневные, сгорающие сегодня в 00:00)
function getActiveUEEmittedToday() {
    const now = getInternalTime();
    const todayBurnAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();

    return AppState.ueUnits
        .filter(ue => ue.burnAt === todayBurnAt && ue.status === 'active' && ue.amount > 0)
        .reduce((sum, ue) => sum + ue.amount, 0);
}

// === ОБНОВЛЕНИЕ UI ===

// Обновить текущую дату и время
function updateCurrentDateTime() {
    try {
        const datetimeEl = $('#current-datetime');
        if (!datetimeEl) return;

        const now = getInternalTime();
        datetimeEl.textContent = now.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    } catch (e) {
        console.error('[Ошибка] updateCurrentDateTime:', e);
        const datetimeEl = $('#current-datetime');
        if (datetimeEl) datetimeEl.textContent = 'Invalid Date';
    }
}

// Обновить таймер сгорания
// v0.3.12: Исправление для окна 00:00-04:00 — отсчёт до 23:59:59 текущего дня
function updateBurnTimerDisplay() {
    const timerEl = $('#burn-timer');
    if (!timerEl) return;

    // v0.3.5: Используем getUEBalance() вместо AppState.ueBalance
    const balance = getUEBalance();
    if (balance === 0) {
        timerEl.textContent = '--:--:--';
        return;
    }

    // v0.3.6: Находим ближайшее время сгорания только среди active У.Е.
    // impulse У.Е. не сгорают сегодня, их burn_at на послезавтра
    const now = getInternalTime();
    const activeUnits = AppState.ueUnits.filter(ue =>
        ue.amount > 0 &&
        ue.status === 'active' &&  // v0.3.6: Только active
        ue.status !== 'burned'
    );

    if (activeUnits.length === 0) {
        // Нет active У.Е. — показываем время до 04:00 (когда impulse станет active)
        const phase = getCurrentPhase();
        if (phase === 'sleep') {
            // До 04:00
            const fourAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0);
            if (fourAM <= now) {
                fourAM.setDate(fourAM.getDate() + 1);
            }
            const msUntilFour = fourAM.getTime() - now.getTime();
            const hours = Math.floor(msUntilFour / (1000 * 60 * 60));
            const minutes = Math.floor((msUntilFour % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((msUntilFour % (1000 * 60)) / 1000);
            timerEl.textContent = `~${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } else {
            timerEl.textContent = '--:--:--';
        }
        return;
    }

    const nearestBurnAt = Math.min(...activeUnits.map(ue => ue.burnAt));
    let msUntilBurn = nearestBurnAt - now.getTime();

    // v0.3.12: Исправление для окна 00:00-04:00
    // Если сейчас между 00:00 и 04:00, а burnAt = сегодня 00:00 — сгорание уже было
    // Если burnAt = завтра 00:00 — отсчитываем до 23:59:59 текущего дня
    const hour = now.getHours();
    if (hour >= 0 && hour < 4) {
        // Между полуночью и 04:00 — проверяем burnAt
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
        const tomorrowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();
        
        // Если burnAt = сегодня 00:00 — уже сгорело, ищем следующее
        if (nearestBurnAt === todayMidnight) {
            // Ищем следующее сгорание (завтра 00:00)
            const nextBurnAt = tomorrowMidnight;
            msUntilBurn = nextBurnAt - now.getTime();
        }
        // Если burnAt = завтра 00:00 — отсчитываем до конца текущего дня
        else if (nearestBurnAt === tomorrowMidnight) {
            // Отсчёт до 23:59:59 текущего дня
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();
            msUntilBurn = endOfDay - now.getTime();
        }
    }

    if (msUntilBurn <= 0) {
        timerEl.textContent = '00:00:00';
    } else {
        const hours = Math.floor(msUntilBurn / (1000 * 60 * 60));
        const minutes = Math.floor((msUntilBurn % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((msUntilBurn % (1000 * 60)) / 1000);
        timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

// Обновить баланс У.Е. с разделением по статусам
function updateUEBalance() {
    const balanceEl = $('#ue-balance');
    if (balanceEl) {
        // v0.3.5: Вычисляем баланс из массива ueUnits
        const balance = getUEBalance();
        balanceEl.textContent = balance;

        // Обновляем индикатор статусов
        updateUEStatusIndicator();
    }
}

// Обновить индикатор статусов У.Е.
// ИСПРАВЛЕНО v0.4.2f: Считаем ВСЕ active/impulse У.Е. (без проверки burn_at)
// ИСПРАВЛЕНО v0.4.2: Обновление обоих UI-блоков (.phase-indicator и .phase-status)
// Канон: 13 активных + 13 импульсных = 26 максимум, НИКОГДА не 26 активных!

function updateUEStatusIndicator() {
    const now = getInternalTime();

    // Активные: ВСЕ У.Е. со status = 'active' (burn_at не проверяем)
    const activeUE = AppState.ueUnits
        .filter(ue => ue.status === 'active' && ue.amount > 0)
        .reduce((sum, ue) => sum + ue.amount, 0);

    // Импульс: ВСЕ У.Е. со status = 'impulse' (burn_at не проверяем)
    const impulseUE = AppState.ueUnits
        .filter(ue => ue.status === 'impulse' && ue.amount > 0)
        .reduce((sum, ue) => sum + ue.amount, 0);

    // Дневные (сгорающие сегодня) — для предупреждения в фазе сна
    const todayBurnAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();
    const todayUE = AppState.ueUnits
        .filter(ue => ue.status === 'active' && ue.burnAt === todayBurnAt && ue.amount > 0)
        .reduce((sum, ue) => sum + ue.amount, 0);

    // Проверка на ошибку "26 активных"
    if (activeUE > 13) {
        console.error(`[КРИТИЧЕСКАЯ ОШИБКА v0.4.2f] Активных У.Е.: ${activeUE} (максимум 13)!`);
        console.error('[КРИТИЧЕСКАЯ ОШИБКА] Проверьте updateUEStatuses() и getUEBalance()');
    }

    // === ОБНОВЛЕНИЕ .phase-indicator ===
    const ueActiveEl = document.getElementById('ue-active');
    const ueImpulseEl = document.getElementById('ue-impulse');
    const phaseIconEl = document.getElementById('phase-icon');
    const phaseNameEl = document.getElementById('phase-name');
    const phaseDescEl = document.getElementById('phase-desc');

    if (ueActiveEl) ueActiveEl.textContent = activeUE;
    if (ueImpulseEl) ueImpulseEl.textContent = impulseUE;

    // Обновляем индикатор фазы (.phase-indicator)
    const phase = getCurrentPhase();
    if (phaseIconEl && phaseNameEl && phaseDescEl) {
        if (phase === 'silence') {
            phaseIconEl.textContent = '🔇';
            phaseNameEl.textContent = 'Тишина';
            phaseDescEl.textContent = '19:55 – 20:00';
        } else if (phase === 'sleep') {
            phaseIconEl.textContent = '🌙';
            phaseNameEl.textContent = 'Сон/Предзаказ';
            phaseDescEl.textContent = '20:00 – 04:00';

            // Если есть дневные У.Е. (остатки) — добавляем предупреждение
            if (todayUE > 0) {
                phaseNameEl.textContent += ` (остатки: ${todayUE})`;
            }
        } else {
            phaseIconEl.textContent = '🌞';
            phaseNameEl.textContent = 'Действие';
            phaseDescEl.textContent = '04:00 – 19:55';
        }
    }

    // === ОБНОВЛЕНИЕ .phase-status (нижний блок) ===
    const phaseStatusEl = document.querySelector('.phase-status');
    const phaseRemainderEl = document.getElementById('phase-remainder');

    if (phaseStatusEl && phaseRemainderEl) {
        // Обновляем текст статуса
        if (phase === 'sleep') {
            phaseStatusEl.style.display = ''; // Показать
            phaseRemainderEl.textContent = todayUE; // Остатки дневных У.Е.
        } else {
            // Скрыть в других фазах (нет остатков)
            phaseStatusEl.style.display = 'none';
        }
    }

    console.log(`[Статус У.Е. v0.4.2f] Активные: ${activeUE}, Импульс: ${impulseUE}, Всего: ${activeUE + impulseUE}, Фаза: ${phase}`);
}

// Обновить баланс У.М.
function updateUMBalance() {
    const balanceEl = $('#um-balance');
    if (balanceEl) balanceEl.textContent = AppState.umBalance;
}

// Обновить индикаторы У.Е. (13 кругов) на основе AppState.ueUnits
// v0.3.5: Две строки — Импульс (Акт 1) и Активные (Акт 2)
// v0.3.8: Исключаем transferred и burned
function updateUEIndicatorsFromState() {
    try {
        // v0.3.5: Разделяем У.Е. по статусам
        const impulseUE = [];  // status: 'impulse'
        const activeUE = [];   // status: 'active'

        AppState.ueUnits.forEach(ue => {
            // v0.3.8: Пропускаем переданные и сгоревшие
            if (ue.amount > 0 && ue.status !== 'burned' && ue.status !== 'transferred') {
                if (ue.status === 'impulse') {
                    impulseUE.push(ue.id);
                } else if (ue.status === 'active') {
                    activeUE.push(ue.id);
                }
            }
        });

        console.log(`[updateUEIndicatorsFromState] Импульс: ${impulseUE.length} У.Е. (${impulseUE.join(', ')}), Активные: ${activeUE.length} У.Е. (${activeUE.join(', ')})`);

        // Обновляем индикаторы в Акте 1 (Импульс)
        updateIndicatorRow('impulse-indicators', impulseUE);

        // Обновляем индикаторы в Акте 2 (Активные)
        updateIndicatorRow('active-indicators', activeUE);
    } catch (e) {
        console.error('[Ошибка] updateUEIndicatorsFromState:', e);
    }
}

// v0.3.5: Обновление одной строки индикаторов
function updateIndicatorRow(containerId, activeUE) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`[updateIndicatorRow] Контейнер ${containerId} не найден`);
        return;
    }

    const indicators = container.querySelectorAll('.ue-indicator');
    indicators.forEach(indicator => {
        const ueNumber = parseInt(indicator.dataset.ue);
        if (activeUE.includes(ueNumber)) {
            indicator.classList.add('active');
            indicator.textContent = ueNumber;
        } else {
            indicator.classList.remove('active');
            indicator.classList.remove('selected');
            indicator.textContent = '—';
        }
    });
}

// Получить номера У.Е. по ключу триады
function getUENumbersByTriad(triadKey) {
    const triadToUE = {
        'T1': [1, 2, 3],
        'T2': [4, 5, 6],
        'T3': [7, 8, 9],
        'T4': [10, 11, 12],
        'T5': [21]
    };
    return triadToUE[triadKey] || [];
}

// Обновить состояние кнопок
// v0.3.6: Проверка не только triadsUsed, но и заказанных impulse У.Е.
function updateTriadButtons() {
    try {
        const triadButtons = $$('.triad-btn');
        const specialBtn = $('.special-btn');
        const emitBtn = $('.emit-btn');

        const phase = getCurrentPhase();

        // Блокировка ВСЕХ кнопок если зона тишины
        if (phase === 'silence') {
            const reason = 'Зона тишины (19:55–20:00)';

            triadButtons.forEach(btn => {
                btn.disabled = true;
                btn.classList.add('used');
                btn.title = reason;
            });

            if (specialBtn) {
                specialBtn.disabled = true;
                specialBtn.classList.add('used');
                specialBtn.title = reason;
            }

            if (emitBtn) {
                emitBtn.disabled = true;
                emitBtn.title = reason;
            }
            return;
        }

        // Разблокировка кнопки эмиссии
        if (emitBtn) {
            emitBtn.disabled = false;
            emitBtn.title = '';
        }

        // v0.3.6: Проверка доступности триад
        // Блокируем если: 1) использована (triadsUsed) ИЛИ 2) заказана в текущем периоде (impulse)
        triadButtons.forEach(btn => {
            const triadKey = btn.dataset.triad;
            const used = AppState.triadsUsed[triadKey];
            
            // v0.3.6: Проверка есть ли уже заказанные У.Е. этой триады в текущем периоде
            const hasEmittedThisTriad = AppState.ueUnits.some(ue => 
                ue.triad === triadKey && 
                ue.status === 'impulse' && 
                ue.amount > 0
            );

            if (used || hasEmittedThisTriad) {
                // Блокируем ТОЛЬКО если использована или заказана
                btn.classList.add('used');
                btn.disabled = true;
                btn.title = 'Использована в этом периоде, сброс в 20:00';
            } else {
                // Доступна (не использована)
                btn.classList.remove('used');
                btn.disabled = false;
                btn.title = '';
            }
        });

        // Проверка №21 — ТОЛЬКО после ≥1 триады
        if (specialBtn) {
            const triadsActivated = Object.keys(AppState.triadsUsed).filter(k => k !== 'T5').length > 0;

            if (!triadsActivated) {
                // №21 заблокирована, пока нет ни одной триады
                specialBtn.disabled = true;
                specialBtn.classList.remove('used');
                specialBtn.title = 'Доступно после активации ≥1 триады';
            } else {
                // Проверяем, использована ли №21
                const specialUsed = AppState.triadsUsed['T5'];
                
                // v0.3.6: Проверка заказана ли №21 в текущем периоде
                const hasEmittedSpecial = AppState.ueUnits.some(ue => 
                    ue.triad === 'T5' && 
                    ue.status === 'impulse' && 
                    ue.amount > 0
                );

                if (specialUsed || hasEmittedSpecial) {
                    specialBtn.classList.add('used');
                    specialBtn.disabled = true;
                    specialBtn.title = 'Использована в этом периоде';
                } else {
                    specialBtn.classList.remove('used');
                    specialBtn.disabled = false;
                    specialBtn.title = '';
                }
            }
        }
    } catch (e) {
        console.error('[Ошибка] updateTriadButtons:', e);
    }
}

// === ЭМИССИЯ ===

function initEmission() {
    try {
        const triadButtons = $$('.triad-btn');
        const specialBtn = $('.special-btn');
        const emitBtn = $('.emit-btn');

        if (!emitBtn) {
            console.error('[Ошибка] Кнопка эмиссии не найдена');
            return;
        }

        // v0.4.2i: Глобальная переменная для сброса через Dev Panel
        window.__selectedTriads = [];
        let selectedTriads = window.__selectedTriads; // Мультивыбор!

        // Обработка кнопок триад (мультивыбор — просто выбор, без эмиссии!)
        triadButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const triadKey = btn.dataset.triad;

                // v0.3.6: Проверка если триада уже использована ИЛИ заказана в этом периоде
                const used = AppState.triadsUsed[triadKey];
                const hasEmittedThisTriad = AppState.ueUnits.some(ue => 
                    ue.triad === triadKey && 
                    ue.status === 'impulse' && 
                    ue.amount > 0
                );

                if (used || hasEmittedThisTriad) {
                    console.log(`[Игнор] Триада ${triadKey} уже использована или заказана`);
                    return;
                }

                // Переключение: если выбрана — убрать, если нет — добавить
                if (selectedTriads.includes(triadKey)) {
                    selectedTriads = selectedTriads.filter(t => t !== triadKey);
                    btn.classList.remove('selected');
                } else {
                    selectedTriads.push(triadKey);
                    btn.classList.add('selected');
                }

                // Подсчёт для отображения
                let totalUE = 0;
                selectedTriads.forEach(key => {
                    totalUE += TRIADS[key].ueCount;
                });
                console.log(`[Выбор] ${selectedTriads.length} триад(ы), всего ${totalUE} У.Е.`);
            });
        });

        // Обработка №21 (мультивыбор)
        if (specialBtn) {
            specialBtn.addEventListener('click', () => {
                if (!specialBtn.disabled) {
                    // v0.3.6: Проверка заказана ли №21 в этом периоде
                    const hasEmittedSpecial = AppState.ueUnits.some(ue => 
                        ue.triad === 'T5' && 
                        ue.status === 'impulse' && 
                        ue.amount > 0
                    );
                    const specialUsed = AppState.triadsUsed['T5'];

                    if (specialUsed || hasEmittedSpecial) {
                        console.log('[Игнор] №21 уже использована или заказана');
                        return;
                    }

                    if (selectedTriads.includes('T5')) {
                        selectedTriads = selectedTriads.filter(t => t !== 'T5');
                        specialBtn.classList.remove('selected');
                    } else {
                        selectedTriads.push('T5');
                        specialBtn.classList.add('selected');
                    }
                }
            });
        }

        // Обработка «Эмитировать» — можно заказывать частями!
        emitBtn.addEventListener('click', () => {
            if (selectedTriads.length === 0) {
                alert('Выберите хотя бы одну триаду или У.Е. №21');
                return;
            }

            // Проверка: №21 только ПОСЛЕ ≥1 эмитированной триады (не обязательно в этом заказе!)
            if (selectedTriads.includes('T5')) {
                // Проверяем есть ли уже эмитированные триады (T1-T4) в этом периоде
                const hasEmittedAnyTriad = ['T1', 'T2', 'T3', 'T4'].some(t => {
                    const used = AppState.triadsUsed[t];
                    const hasEmittedThisTriad = AppState.ueUnits.some(ue =>
                        ue.triad === t &&
                        ue.status === 'impulse' &&
                        ue.amount > 0
                    );
                    return used || hasEmittedThisTriad;
                });

                // Если №21 выбрана БЕЗ других триад в этом заказе И нет эмитированных триад
                if (!selectedTriads.some(t => t !== 'T5') && !hasEmittedAnyTriad) {
                    alert('⚠️ У.Е. №21 доступна только ПОСЛЕ активации хотя бы одной триады (1-4).\n\nСначала эмитируйте триаду (Знания/Практики/Творчество/ЗОЖ), затем сможете выбрать №21.');
                    return;
                }
            }

            // v0.3.6: Фильтрация — убрать уже заказанные в этом периоде
            const filteredTriads = selectedTriads.filter(key => {
                const used = AppState.triadsUsed[key];
                const hasEmittedThisTriad = AppState.ueUnits.some(ue =>
                    ue.triad === key &&
                    ue.status === 'impulse' &&
                    ue.amount > 0
                );
                return !used && !hasEmittedThisTriad;
            });

            if (filteredTriads.length === 0) {
                alert('Все выбранные триады уже использованы или заказаны!');
                return;
            }

            // Подсчёт общего количества У.Е. (только для выбранных)
            let totalUE = 0;
            filteredTriads.forEach(key => {
                totalUE += TRIADS[key].ueCount;
            });

            // ЭМИССИЯ — добавляем к уже заказанным!
            emitUE(filteredTriads, totalUE);
            
            // v0.4.2g: СБРОС выбора после эмиссии (для тестов и изоляции)
            window.__selectedTriads = []; // Глобальная
            selectedTriads = window.__selectedTriads; // Локальная ссылка
            console.log('[v0.4.2g] selectedTriads сброшен после эмиссии');
        });

        // Разблокировка №21 если уже есть триады (после загрузки)
        if (specialBtn && Object.keys(AppState.triadsUsed).filter(k => k !== 'T5').length > 0) {
            specialBtn.disabled = false;
        }
    } catch (e) {
        console.error('[Ошибка] initEmission:', e);
    }
}

function emitUE(selectedTriads, totalUE) {
    const phase = getCurrentPhase();

    // Проверка: можно ли эмитировать
    if (!isEmissionAllowed()) {
        alert('⚠️ Зона тишины (19:55–20:00).\n\nЭмиссия временно недоступна. Подождите 20:00.');
        return;
    }

    console.log(`[Эмиссия] Заказано: ${totalUE} У.Е. (${selectedTriads.join(', ')})`);
    console.log(`[Фаза] ${phase}`);

    // Фильтрация: убрать уже использованные триады
    const newTriads = selectedTriads.filter(key => !AppState.triadsUsed[key]);

    if (newTriads.length === 0) {
        alert('Все выбранные триады уже использованы!');
        return;
    }

    // Пересчёт У.Е. только для новых триад
    let actualTotalUE = 0;
    newTriads.forEach(key => {
        actualTotalUE += TRIADS[key].ueCount;
    });

    // Проверка лимита 13 У.Е. за период
    const emittedThisPeriod = getUEEmittedThisPeriod();
    if (emittedThisPeriod + actualTotalUE > MAX_UE_PER_PERIOD) {
        alert(`⚠️ Превышен лимит У.Е. на период.\n\nЗаказано в этом периоде: ${emittedThisPeriod} У.Е.\nДоступно: ${MAX_UE_PER_PERIOD - emittedThisPeriod} У.Е.\nВы выбрали: ${actualTotalUE} У.Е.`);
        return;
    }

    console.log(`[Новые триады] ${newTriads.join(', ')} = ${actualTotalUE} У.Е.`);

    // Рассчитываем burn_at
    const burnAt = calculateBurnAt();
    const now = Date.now();

    // Определяем статус У.Е.
    const status = phase === 'sleep' ? 'impulse' : 'active';

    // === ЭТАП 1: v0.3.5 — Каждая У.Е. отдельный объект ===
    // Добавляем каждую У.Е. индивидуально в массив ueUnits
    newTriads.forEach(triadKey => {
        const ueNumbers = getUENumbersByTriad(triadKey);
        ueNumbers.forEach(ueId => {
            AppState.ueUnits.push({
                id: ueId,           // Номер У.Е. (1-12, 21)
                triad: triadKey,    // Принадлежность к триаде (T1-T5)
                amount: 1,          // Всегда 1 (индивидуальная единица)
                burnAt: burnAt,     // Время сгорания
                status: status,     // 'active' или 'impulse'
                createdAt: now      // Время создания
            });
            console.log(`[Эмиссия] У.Е. №${ueId} (${triadKey}) добавлена, сгорание: ${new Date(burnAt).toLocaleString()}`);
        });

        // Записываем время использования триады
        AppState.triadsUsed[triadKey] = now;
        console.log(`[Триада] ${triadKey} использована`);
    });

    // === v0.3.5: Баланс вычисляется из массива ===
    const newBalance = getUEBalance();

    // Добавляем в ro.DAG (запись об эмиссии)
    addDAGNode({
        type: 'emission',
        triads: newTriads,
        totalAmount: actualTotalUE,
        timestamp: now,
        id: generateTxId()
    });

    // Обновляем UI
    updateUEBalance();
    updateTriadButtons();
    updateUEStatusIndicator();
    updateUEIndicatorsFromState();  // v0.3.5: используем новую функцию

    // Снимаем выделение
    $$('.triad-btn, .special-btn').forEach(btn => btn.classList.remove('selected'));

    // Сохраняем
    saveState();

    // Свечение бейджа О.К.
    triggerOKBadgeGlow();

    console.log(`[После эмиссии] Баланс: ${newBalance} У.Е. (из ${MAX_UE_PER_PERIOD})`);
    console.log(`[Сгорание] У.Е. сгорят в 0:00 ${new Date(burnAt).toLocaleString()}`);
}

// === v0.3.5: Вычисление баланса из массива ueUnits ===
// ИСПРАВЛЕНО v0.4.2f: Считаем ВСЕ active У.Е. (без проверки burn_at)
// Канон: 13 активных + 13 импульсных = 26 максимум, НИКОГДА не 26 активных!

function getUEBalance() {
    const now = getInternalTime();
    const todayBurnAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();
    const tomorrowBurnAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0).getTime();

    // Активные: ВСЕ У.Е. со status = 'active' (burn_at не проверяем)
    const activeUE = AppState.ueUnits
        .filter(ue => ue.status === 'active' && ue.amount > 0)
        .reduce((sum, ue) => sum + ue.amount, 0);

    // Импульсные: ВСЕ У.Е. со status = 'impulse' (burn_at не проверяем)
    const impulseUE = AppState.ueUnits
        .filter(ue => ue.status === 'impulse' && ue.amount > 0)
        .reduce((sum, ue) => sum + ue.amount, 0);

    // Для обратной совместимости возвращаем число, но с дополнительными свойствами
    const total = activeUE + impulseUE;

    // Сохраняем для UI
    window.__ueBalanceLast = { active: activeUE, impulse: impulseUE, total: total };

    return total;
}

// Получить детальный баланс (для UI)
function getUEBalanceDetail() {
    return window.__ueBalanceLast || { active: 0, impulse: 0, total: 0 };
}

// === ro.DAG ===

function addDAGNode(transaction) {
    AppState.dagGraph.push(transaction);
    updateDAGVisual();
}

function updateDAGVisual() {
    const container = $('#dag-nodes');
    if (!container) return;

    container.innerHTML = '';
    AppState.dagGraph.slice(-10).forEach(node => {
        const el = document.createElement('div');
        el.className = 'dag-node';
        
        // v0.3.6: Отображение типа транзакции
        const amount = node.totalAmount || node.amount || 0;
        const txId = node.id.substring(0, 8);
        
        if (node.type === 'emission') {
            el.textContent = `${txId}... (Эмиссия ${amount} У.Е.)`;
            el.style.borderColor = 'var(--accent-blue)';
        } else if (node.type === 'transfer') {
            el.textContent = `${txId}... (${amount} У.Е.)`;
            el.style.borderColor = 'var(--accent-green)';
        } else if (node.type === 'burned') {
            el.textContent = `${txId}... (Сгорание ${amount} У.Е.)`;
            el.style.borderColor = 'var(--accent-red)';
            el.style.opacity = '0.6';
        } else {
            el.textContent = `${txId}... (${amount} У.Е.)`;
        }
        
        container.appendChild(el);
    });
}

// === ПЕРЕДАЧА ===

// v0.3.5: Выбранные У.Е. для передачи
let selectedUEForTransfer = [];

function initTransfer() {
    try {
        // Синхронизация inline-поля с основным textarea
        const inlineMessage = $('#gratitude-message-inline');
        const mainMessage = $('#gratitude-message');

        if (inlineMessage && mainMessage) {
            inlineMessage.addEventListener('input', () => {
                mainMessage.value = inlineMessage.value;
            });

            mainMessage.addEventListener('input', () => {
                inlineMessage.value = mainMessage.value;
            });
        }

        // v0.3.11: Клик на label «Получатель:» открывает реестр У.З.
        const recipientLabel = document.getElementById('recipient-label');
        const uzModal = document.getElementById('uz-registry-modal');
        const uzContent = document.getElementById('uz-registry-content');

        if (recipientLabel && uzModal && uzContent) {
            recipientLabel.addEventListener('click', () => {
                renderUzRegistry(uzContent);
                uzModal.style.display = 'flex';
            });
        }

        // v0.3.5: Обработчик кликов по индикаторам (выбор У.Е.)
        const activeIndicators = $$('#active-indicators .ue-indicator');
        activeIndicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                const ueNumber = parseInt(indicator.dataset.ue);
                
                // v0.3.6: Проверка что индикатор активен (не "—")
                const isActive = indicator.classList.contains('active');
                if (!isActive) {
                    console.log(`[Клик] Пропущено: индикатор №${ueNumber} не активен`);
                    return;  // Запрет клика по пустому индикатору
                }

                // Проверяем что У.Е. активна
                const ue = AppState.ueUnits.find(u => u.id === ueNumber && u.status === 'active' && u.amount > 0);
                if (!ue) {
                    console.log(`[Клик] У.Е. №${ueNumber} недоступна для выбора`);
                    return;
                }

                // Переключение выбора
                if (selectedUEForTransfer.includes(ueNumber)) {
                    selectedUEForTransfer = selectedUEForTransfer.filter(id => id !== ueNumber);
                    indicator.classList.remove('selected');
                    console.log(`[Выбор] У.Е. №${ueNumber} снята с выбора`);
                } else {
                    selectedUEForTransfer.push(ueNumber);
                    indicator.classList.add('selected');
                    console.log(`[Выбор] У.Е. №${ueNumber} выбрана для передачи`);
                }

                // Обновляем кнопку передачи
                updateTransferButton();
            });
        });

        const transferBtn = $('.transfer-btn');
        if (transferBtn) {
            transferBtn.addEventListener('click', transferSelectedUE);
        }
    } catch (e) {
        console.error('[Ошибка] initTransfer:', e);
    }
}

// v0.3.5: Обновление состояния кнопки передачи
function updateTransferButton() {
    const transferBtn = $('.transfer-btn');
    if (transferBtn) {
        if (selectedUEForTransfer.length > 0) {
            transferBtn.disabled = false;
            transferBtn.textContent = `Передать ${selectedUEForTransfer.length} У.Е.`;
        } else {
            transferBtn.disabled = true;
            transferBtn.textContent = 'Передать';
        }
    }
}

// v0.3.5: Передача выбранных У.Е.
function transferSelectedUE() {
    const recipient = $('#recipient').value.trim();
    const message = $('#gratitude-message').value.trim();

    // Проверка: выбраны ли У.Е.
    if (selectedUEForTransfer.length === 0) {
        alert('⚠️ Выберите У.Е. для передачи.\n\nКликните на индикаторы в разделе "Активные" чтобы выбрать.');
        return;
    }

    // Проверка: можно ли передавать
    if (!isTransferAllowed()) {
        const phase = getCurrentPhase();
        if (phase === 'silence') {
            alert('⚠️ Зона тишины (19:55–20:00).\n\nПередача временно недоступна. Подождите 20:00.');
        } else if (phase === 'sleep') {
            alert('⚠️ Время для сна (20:00 - 04:00).\n\nУ.Е. в статусе "импульс" недоступны для передачи.\n\nЭто правило Кона:\n• 20:00 - 03:59:59 — можно выбрать У.Е. и эмитировать\n• 04:00 - можно отправлять У.Е. (передача)\n• До 04:00 — передача заблокирована');
        }
        return;
    }

    if (!recipient) {
        alert('Введите получателя');
        return;
    }

    // Проверка: все ли выбранные У.Е. ещё доступны
    const unavailableUE = [];
    selectedUEForTransfer.forEach(id => {
        const ue = AppState.ueUnits.find(u => u.id === id && u.status === 'active' && u.amount > 0);
        if (!ue) {
            unavailableUE.push(id);
        }
    });

    if (unavailableUE.length > 0) {
        alert(`⚠️ У.Е. ${unavailableUE.join(', ')} больше недоступны.\n\nПожалуйста, выберите другие.`);
        selectedUEForTransfer = selectedUEForTransfer.filter(id => !unavailableUE.includes(id));
        updateUEIndicatorsFromState();
        updateTransferButton();
        return;
    }

    const amount = selectedUEForTransfer.length;

    // Создаём транзакцию
    const transaction = {
        id: generateTxId(),
        type: 'transfer',
        from: 'current_user',
        to: recipient,
        amount: amount,
        ueIds: [...selectedUEForTransfer],  // v0.3.5: Записываем ID переданных У.Е.
        message: message,
        timestamp: Date.now()
    };

    // Сохраняем
    AppState.transactions.push(transaction);

    // Списываем выбранные У.Е.
    selectedUEForTransfer.forEach(id => {
        const ue = AppState.ueUnits.find(u => u.id === id);
        if (ue) {
            ue.amount = 0;
            ue.status = 'transferred';  // v0.3.5: Статус "передана"
            console.log(`[Передача] У.Е. №${id} (${ue.triad}) передана → ${recipient}`);
        }
    });

    // Обновляем счётчики "сегодня" и "всего"
    AppState.todayGiven += amount;
    AppState.givenTotal += amount;

    // Обновляем ro.DAG
    addDAGNode(transaction);

    // Пересчитываем вес (У.Е. × 2 при передаче)
    calculateWeight();

    // Обновляем UI
    updateUEBalance();
    updateDAGVisual();
    updateUEIndicatorsFromState();  // Обновляем индикаторы после передачи

    // Очищаем форму и выбор
    $('#recipient').value = '';
    $('#gratitude-message').value = '';
    selectedUEForTransfer = [];
    updateTransferButton();

    // Свечение бейджа О.К.
    triggerOKBadgeGlow();

    console.log(`[Передача] ${amount} У.Е. → ${recipient} (сегодня: ${AppState.todayGiven}, всего: ${AppState.givenTotal})`);
}

// === СТАРАЯ ФУНКЦИЯ transferUE() — для обратной совместимости ===
function transferUE() {
    // v0.3.5: Эта функция больше не используется, но оставлена для совместимости
    console.warn('[transferUE] Устаревшая функция. Используйте transferSelectedUE()');
}

// === ВЕС ===

function calculateWeight() {
    // Определяем текущую дату
    const today = new Date().toDateString();
    
    // Проверка: новый день? Сбрасываем "сегодня"
    if (AppState.lastResetDate !== today) {
        // Сохраняем "сегодня" в "всего"
        AppState.todayGiven = 0;
        AppState.todayReceived = 0;
        AppState.todayBurned = 0;
        AppState.lastResetDate = today;
        console.log('[Новый день] Счётчики "сегодня" сброшены');
    }
    
    // Формула: (У.Е. Отдано × 2) + (У.Е. Принято × 1) − (Сгорело × 1)
    const todayGivenWeight = AppState.todayGiven * 2;
    const todayReceivedWeight = AppState.todayReceived * 1;
    const todayBurnedWeight = AppState.todayBurned * 1;
    const todayWeight = todayGivenWeight + todayReceivedWeight - todayBurnedWeight;
    
    const totalGivenWeight = AppState.givenTotal * 2;
    const totalReceivedWeight = AppState.receivedTotal * 1;
    const totalBurnedWeight = AppState.burnedTotal * 1;
    const totalWeight = totalGivenWeight + totalReceivedWeight - totalBurnedWeight;
    
    // Средний вес (по количеству дней с активностью)
    const daysActive = Math.max(1, AppState.givenTotal + AppState.receivedTotal + AppState.burnedTotal > 0 ? 1 : 1);
    const avgWeight = totalWeight / daysActive;
    
    AppState.reputationWeight = totalWeight;
    
    // Обновляем таблицу
    $('#today-given').textContent = AppState.todayGiven;
    $('#today-given-total').textContent = todayGivenWeight;
    $('#total-given').textContent = AppState.givenTotal;
    $('#total-given-total').textContent = totalGivenWeight;
    $('#avg-given').textContent = (AppState.givenTotal / daysActive).toFixed(1);
    
    $('#today-received').textContent = AppState.todayReceived;
    $('#today-received-total').textContent = todayReceivedWeight;
    $('#total-received').textContent = AppState.receivedTotal;
    $('#total-received-total').textContent = totalReceivedWeight;
    $('#avg-received').textContent = (AppState.receivedTotal / daysActive).toFixed(1);
    
    $('#today-burned').textContent = AppState.todayBurned;
    $('#today-burned-total').textContent = todayBurnedWeight;
    $('#total-burned').textContent = AppState.burnedTotal;
    $('#total-burned-total').textContent = totalBurnedWeight;
    $('#avg-burned').textContent = (AppState.burnedTotal / daysActive).toFixed(1);
    
    $('#today-weight').textContent = todayWeight;
    $('#total-weight').textContent = totalWeight;
    $('#avg-weight').textContent = avgWeight.toFixed(1);
    
    console.log(`[Вес] Сегодня: ${todayWeight}, Всего: ${totalWeight}, Средний: ${avgWeight.toFixed(1)}`);
}

// === СГОРАНИЕ ===

// v0.3.6: Сжигает ТОЛЬКО active У.Е. (impulse не сгорает!)
// v0.4.2b: ИСПРАВЛЕНО — СНАЧАЛА updateUEStatuses() в 04:00, ПОТОМ checkBurn()
function checkBurn() {
    const now = getInternalTime();
    const nowMs = now.getTime();
    const hour = now.getHours();
    let totalBurned = 0;

    // v0.4.2b: В 04:00 СНАЧАЛА переводим impulse → active, ПОТОМ сжигаем
    if (hour === 4) {
        updateUEStatuses();
    }

    // v0.3.6: Проходим с конца чтобы избежать проблем с индексами
    // Сжигаем ТОЛЬКО active У.Е. (impulse сгорят в другой день)
    for (let i = AppState.ueUnits.length - 1; i >= 0; i--) {
        const ueUnit = AppState.ueUnits[i];
        // v0.3.6: Проверка status === 'active' — impulse не сгорает!
        if (ueUnit.amount > 0 && ueUnit.status === 'active' && ueUnit.burnAt <= nowMs) {
            // У.Е. сгорела
            totalBurned += ueUnit.amount;
            ueUnit.amount = 0;
            ueUnit.status = 'burned';
        }
    }

    // v0.3.5: Баланс пересчитывается автоматически из массива

    if (totalBurned > 0) {
        AppState.burnedTotal += totalBurned;

        updateUEBalance();
        calculateWeight();
        updateBurnTimerDisplay();
        updateUEIndicatorsFromState();  // Обновляем индикаторы после сгорания

        // v0.3.6: Добавляем запись в ro.DAG о сгорании
        addDAGNode({
            type: 'burned',
            amount: totalBurned,
            timestamp: nowMs,
            id: generateTxId()
        });
    }

    // v0.4.2b: updateUEStatuses() вызывается выше в 04:00
    // updateUEStatuses(); // <-- ПЕРЕНЕСЕНО ВЫШЕ

    // Сброс triadsUsed в 20:00 (разделение линии заказа)
    resetTriadsForNewPeriod();
}

// Сброс triadsUsed в 20:00 (разделение линии заказа)
function resetTriadsForNewPeriod() {
    const now = getInternalTime();
    const hour = now.getHours();
    const minutes = hour * 60 + now.getMinutes();

    // Проверяем наступление 20:00 (начало нового периода)
    const TWENTY_HOUR_START = 20 * 60; // 20:00
    const TWENTY_HOUR_END = 20 * 60 + 5; // 20:05 (даём 5 минут на сброс)

    if (minutes >= TWENTY_HOUR_START && minutes < TWENTY_HOUR_END) {
        // Полный сброс триад (без проверки lastTriadsReset)
        AppState.triadsUsed = {};
        console.log('[20:00] Triads reset for new period:', AppState.triadsUsed);
    }
}

// Обновление статусов У.Е. (импульс → активные)
// ИСПРАВЛЕНО v0.4.2d: Перевод ВСЕХ impulse → active в 04:00 (без проверки burn_at)
// Канон: 13 активных + 13 импульсных = 26 максимум, НИКОГДА не 26 активных!

function updateUEStatuses() {
    const now = getInternalTime();
    const hour = now.getHours();
    let moved = 0;

    // Переводить impulse → active ТОЛЬКО в 04:00 (начало активной фазы)
    if (hour !== 4) {
        return; // Не время для перевода
    }

    for (const ueUnit of AppState.ueUnits) {
        // Переводить ВСЕ impulse → active в 04:00
        // burn_at не проверяем — все У.Е. должны стать активными в 04:00
        if (ueUnit.status === 'impulse' && ueUnit.amount > 0) {
            ueUnit.status = 'active';
            moved++;
            console.log(`[Статус v0.4.2d] У.Е. №${ueUnit.id} (${ueUnit.triad}) переведена в "активные" (burn_at=${new Date(ueUnit.burnAt).toLocaleString()})`);
        }
    }

    if (moved > 0) {
        console.log(`[updateUEStatuses v0.4.2d] Переведено impulse → active: ${moved} У.Е.`);
    }
}

// === УТИЛИТЫ ===

function generateTxId() {
    return 'tx_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// === О.К. БЕЙДЖ ===

function getCorrectLength(str) {
    return [...str].length;
}

function updateOKBadge() {
    try {
        const okKey = localStorage.getItem(STORAGE_KEYS.OK_KEY);
        const okCreated = localStorage.getItem(STORAGE_KEYS.OK_CREATED);

        console.log('[О.К. Бейдж] okKey:', okKey, 'okCreated:', okCreated);

        const badgeContainer = document.getElementById('ok-badge-container');
        const badge = document.getElementById('ok-badge');
        const okValue = document.getElementById('ok-value');
        const okDate = document.getElementById('ok-date');
        const noOkWarning = document.getElementById('no-ok-warning');

        if (okKey && getCorrectLength(okKey) >= 3) {
            // О.К. существует — показываем бейдж
            if (badgeContainer) badgeContainer.style.display = 'flex';
            if (okValue) okValue.textContent = `::${okKey}::`;

            if (okCreated) {
                const date = new Date(okCreated);
                if (!isNaN(date.getTime())) {
                    const monthYear = date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
                    if (okDate) okDate.textContent = monthYear;
                } else {
                    if (okDate) okDate.textContent = '—';
                }
            } else {
                // Нет даты создания
                if (okDate) okDate.textContent = '';
            }

            // v0.3.11: Обновляем заголовок страницы с О.К.
            const cleanOK = okKey.replace(/::/g, '');
            document.title = `Pygmalion v0.3.11 — ${cleanOK}`;

            // Скрываем предупреждение
            if (noOkWarning) noOkWarning.style.display = 'none';
        } else {
            // О.К. нет — скрываем бейдж, показываем предупреждение
            if (badgeContainer) badgeContainer.style.display = 'none';
            if (noOkWarning) noOkWarning.style.display = 'block';
            
            // Возвращаем стандартный заголовок
            document.title = 'Pygmalion v0.3.11 — Личный комбайн';
        }
    } catch (e) {
        console.error('[Ошибка] updateOKBadge:', e);
    }
}

function triggerOKBadgeGlow() {
    const badge = document.getElementById('ok-badge');
    if (badge) {
        badge.classList.add('emission-active');
        setTimeout(() => {
            badge.classList.remove('emission-active');
        }, 3000);
    }
}

// === СОХРАНЕНИЕ ===

function saveState() {
    try {
        // v0.3.5: Сохраняем только ueUnits (баланс вычисляется)
        localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify({
            umBalance: AppState.umBalance,
            emissionTime: AppState.emissionTime,
            lastEmissionTime: AppState.lastEmissionTime,
            triadsUsed: AppState.triadsUsed,
            givenTotal: AppState.givenTotal,
            todayGiven: AppState.todayGiven,
            receivedTotal: AppState.receivedTotal,
            todayReceived: AppState.todayReceived,
            burnedTotal: AppState.burnedTotal,
            todayBurned: AppState.todayBurned,
            lastResetDate: AppState.lastResetDate,
            lastTriadsReset: AppState.lastTriadsReset,
            ueUnits: AppState.ueUnits  // v0.3.5: Индивидуальные У.Е.
        }));
        localStorage.setItem(STORAGE_KEYS.DAG, JSON.stringify(AppState.dagGraph));
        localStorage.setItem(STORAGE_KEYS.ACTS, JSON.stringify(AppState.transactions));
        console.log('[Сохранение] Состояние сохранено');
    } catch (e) {
        console.error('[Ошибка] Не удалось сохранить:', e);
    }
}

function loadState() {
    try {
        const crystalState = localStorage.getItem(STORAGE_KEYS.STATE);
        const roDag = localStorage.getItem(STORAGE_KEYS.DAG);
        const actsLog = localStorage.getItem(STORAGE_KEYS.ACTS);
        const okKey = localStorage.getItem(STORAGE_KEYS.OK_KEY);

        console.log('[Загрузка] crystal_state:', crystalState ? 'найдено' : 'не найдено');
        console.log('[Загрузка] pygmalion_ok_key:', okKey);

        if (crystalState) {
            const state = JSON.parse(crystalState);
            // v0.3.5: Загружаем состояние (баланс вычисляется из ueUnits)
            AppState.umBalance = state.umBalance || 5;
            AppState.emissionTime = state.emissionTime || null;
            AppState.lastEmissionTime = state.lastEmissionTime || null;
            AppState.triadsUsed = state.triadsUsed || {};
            AppState.givenTotal = state.givenTotal || 0;
            AppState.todayGiven = state.todayGiven || 0;
            AppState.receivedTotal = state.receivedTotal || 0;
            AppState.todayReceived = state.todayReceived || 0;
            AppState.burnedTotal = state.burnedTotal || 0;
            AppState.todayBurned = state.todayBurned || 0;
            AppState.lastResetDate = state.lastResetDate || null;
            AppState.lastTriadsReset = state.lastTriadsReset || null;
            AppState.ueUnits = state.ueUnits || [];  // v0.3.5: Индивидуальные У.Е.
            
            // v0.3.5: Миграция старого формата (если есть groups)
            if (state.ueBalance !== undefined) {
                console.log('[Миграция] Обнаружен старый формат, пересчитываем баланс');
            }
            
            const balance = getUEBalance();
            console.log('[Загрузка] Баланс:', balance, 'У.Е., У.М.:', AppState.umBalance);
            console.log('[Загрузка] У.Е. в массиве:', AppState.ueUnits.length);
            console.log('[Загрузка] triadsUsed:', AppState.triadsUsed);
        }

        if (roDag) {
            AppState.dagGraph = JSON.parse(roDag);
        }

        if (actsLog) {
            AppState.transactions = JSON.parse(actsLog);
        }

        console.log('[Загрузка] Состояние загружено');
    } catch (e) {
        console.error('[Ошибка] Не удалось загрузить:', e);
    }
}

// ========================================
// РЕЕСТРЫ (модальные окна)
// ========================================

/**
 * Рендер реестра всех У.З. (Учётных Записей / О.К.)
 */
function renderUzRegistry(container) {
    if (!container) return;

    const okKey = localStorage.getItem(STORAGE_KEYS.OK_KEY);
    const okCreated = localStorage.getItem(STORAGE_KEYS.OK_CREATED);

    let html = '<div class="registry-list">';

    // v0.3.11: Тестовые О.К. для верификации Акта 2 (12 записей)
    const testMode = localStorage.getItem('pygmalion_test_mode') === 'true';
    
    if (testMode) {
        html += '<h4 style="margin-bottom: 1rem; color: var(--accent-blue);">🧪 Тестовые О.К. (12)</h4>';
        for (let i = 1; i <= 12; i++) {
            const testOK = `::${String(i).padStart(2, '0')}::`;
            const daysAgo = i * 2;
            const createdTime = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
            const createdDate = new Date(createdTime).toLocaleDateString('ru-RU', { 
                day: '2-digit', month: 'short', year: 'numeric' 
            });
            
            html += `
                <div class="registry-item registry-item-clickable" data-ok="${testOK}">
                    <div class="registry-item-header">
                        <span class="registry-item-icon">🔑</span>
                        <span class="registry-item-title">Тестовый О.К. #${i}</span>
                    </div>
                    <div class="registry-item-value">${testOK}</div>
                    <div class="registry-item-meta">
                        <span class="status-active">Активен</span>
                        <span>Создан: ${createdDate}</span>
                    </div>
                </div>
            `;
        }
        html += '<hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--border-color);">';
    }

    if (okKey) {
        html += `
            <div class="registry-item">
                <div class="registry-item-header">
                    <span class="registry-item-icon">🔑</span>
                    <span class="registry-item-title">Основной О.К.</span>
                </div>
                <div class="registry-item-value">${okKey}</div>
                <div class="registry-item-meta">
                    <span class="status-active">Активен</span>
                    ${okCreated ? `<span>Создан: ${new Date(parseInt(okCreated)).toLocaleString('ru-RU')}</span>` : ''}
                </div>
            </div>
        `;
    } else if (!testMode) {
        html += '<p class="registry-empty">О.К. не создан. Пройдите Порог для создания.</p>';
    }

    // Временные У.З. (если есть)
    const tempUz = AppState.transactions
        .filter(t => t.type === 'temporary' && t.recipient)
        .map(t => t.recipient);

    if (tempUz.length > 0) {
        html += '<h4 style="margin-top: 1.5rem; color: var(--accent-purple);">Временные У.З. (Вр.У.З.)</h4>';
        const uniqueUz = [...new Set(tempUz)];
        uniqueUz.forEach(uz => {
            html += `
                <div class="registry-item">
                    <div class="registry-item-header">
                        <span class="registry-item-icon">⏳</span>
                        <span class="registry-item-title">${uz}</span>
                    </div>
                    <div class="registry-item-meta">
                        <span class="status-pending">Ожидание</span>
                    </div>
                </div>
            `;
        });
    }

    html += '</div>';
    container.innerHTML = html;
    
    // v0.3.11: Обработчики кликов для тестовых О.К.
    if (testMode) {
        container.querySelectorAll('.registry-item-clickable').forEach(item => {
            item.addEventListener('click', () => {
                const okValue = item.dataset.ok;
                const recipientInput = document.getElementById('recipient');
                if (recipientInput) {
                    recipientInput.value = okValue.replace(/::/g, '');
                    // Закрываем модальное окно
                    const uzModal = document.getElementById('uz-registry-modal');
                    if (uzModal) uzModal.style.display = 'none';
                }
            });
        });
    }
}

/**
 * Рендер реестра всех транзакций
 */
function renderTransactionsRegistry(container) {
    if (!container) return;

    const transactions = AppState.transactions || [];

    let html = '<div class="registry-list">';

    if (transactions.length === 0) {
        html += '<p class="registry-empty">Транзакций пока нет. Совершите первую передачу в Акте 2.</p>';
    } else {
        // Сортируем: новые сверху
        const sorted = [...transactions].reverse();

        sorted.forEach((tx, index) => {
            const date = tx.timestamp ? new Date(tx.timestamp).toLocaleString('ru-RU') : '—';
            const typeIcon = tx.type === 'temporary' ? '⏳' : '✅';
            const typeClass = tx.type === 'temporary' ? 'type-temporary' : 'type-permanent';

            html += `
                <div class="registry-item">
                    <div class="registry-item-header">
                        <span class="registry-item-icon">${typeIcon}</span>
                        <span class="registry-item-title">#${sorted.length - index} ${tx.message || 'Без сообщения'}</span>
                        <span class="registry-item-type ${typeClass}">${tx.type === 'temporary' ? 'Временная' : 'Постоянная'}</span>
                    </div>
                    <div class="registry-item-details">
                        <div class="registry-row">
                            <span class="label">От:</span>
                            <span class="value">${tx.sender || 'Я'}</span>
                        </div>
                        <div class="registry-row">
                            <span class="label">Кому:</span>
                            <span class="value">${tx.recipient || '—'}</span>
                        </div>
                        <div class="registry-row">
                            <span class="label">У.Е.:</span>
                            <span class="value">${tx.ueNumbers ? tx.ueNumbers.join(', ') : '—'}</span>
                        </div>
                        <div class="registry-row">
                            <span class="label">Дата:</span>
                            <span class="value">${date}</span>
                        </div>
                        ${tx.refs && tx.refs.length > 0 ? `
                            <div class="registry-row">
                                <span class="label">Ссылки:</span>
                                <span class="value">${tx.refs.join(', ')}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
    }

    html += '</div>';
    container.innerHTML = html;
}

// === ИНИЦИАЛИЗАЦИЯ ===

document.addEventListener('DOMContentLoaded', () => {
    console.log('[v0.3.0] Песочница инициализирована');
    console.log('[Dev] window.__testTimeOffset:', window.__testTimeOffset);

    try {
        // Кнопка очистки localStorage
        const clearBtn = $('#clear-storage');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Очистить ВСЁ состояние? (балансы, триады, история)')) {
                    localStorage.clear();
                    // v0.3.5: Сброс состояния
                    AppState.umBalance = 5;
                    AppState.emissionTime = null;
                    AppState.lastEmissionTime = null;
                    AppState.triadsUsed = {};
                    AppState.givenTotal = 0;
                    AppState.receivedTotal = 0;
                    AppState.burnedTotal = 0;
                    AppState.dagGraph = [];
                    AppState.transactions = [];
                    AppState.ueUnits = [];  // v0.3.5: Очищаем массив У.Е.
                    location.reload();
                }
            });
        }

        // Загружаем состояние
        loadState();
    } catch (e) {
        console.error('[Ошибка] инициализация:', e);
    }

    // Обновляем бейдж О.К.
    updateOKBadge();

    // Обновляем дату и время (первый вызов)
    updateCurrentDateTime();

    try {
        // Инициализация
        initEmission();
        initTransfer();

        // Обновление UI
        updateUEBalance();
        updateUMBalance();
        updateTriadButtons();

        // v0.4.2d: ПРИНУДИТЕЛЬНАЯ ПРОВЕРКА impulse → active при загрузке
        // Если страница открыта после 04:00 и есть impulse — переводим
        const now = getInternalTime();
        const hour = now.getHours();
        if (hour >= 4) {
            const hasImpulse = AppState.ueUnits.some(ue => ue.status === 'impulse' && ue.amount > 0);
            if (hasImpulse) {
                console.log(`[v0.4.2d] Загрузка после 04:00 (${hour}:00) — проверка impulse`);
                updateUEStatuses();
                updateUEStatusIndicator();
                updateUEIndicatorsFromState();
            }
        }
        updateUEStatusIndicator();  // Обновляем индикатор фазы и статусов
        calculateWeight(); // Рассчитываем вес при загрузке

        // === ПАНЕЛЬ РАЗРАБОТЧИКА ===

        // Переключатель панели
        const toggleDevPanel = document.getElementById('toggle-dev-panel');
        const devPanelContent = document.getElementById('dev-panel-content');
        if (toggleDevPanel && devPanelContent) {
          toggleDevPanel.addEventListener('click', () => {
            const isHidden = devPanelContent.style.display === 'none';
            devPanelContent.style.display = isHidden ? 'block' : 'none';
          });
        }

        // Сброс О.К.
        const resetOkKey = document.getElementById('reset-ok-key');
        if (resetOkKey) {
          resetOkKey.addEventListener('click', () => {
            if (confirm('Сбросить О.К.? Вам придётся создать новый на Пороге.')) {
              localStorage.removeItem(STORAGE_KEYS.OK_KEY);
              localStorage.removeItem(STORAGE_KEYS.OK_CREATED);
              updateOKBadge();
              alert('О.К. сброшен. Обновите страницу для применения.');
            }
          });
        }
    } catch (e) {
        console.error('[Ошибка] инициализация UI:', e);
    }

    // Мультисброс О.К. (для тестов)
    const resetOkMulti = document.getElementById('reset-ok-multi');
    if (resetOkMulti) {
      resetOkMulti.addEventListener('click', () => {
        if (typeof window.PygmalionThreshold !== 'undefined' && window.PygmalionThreshold.resetOKKey) {
          window.PygmalionThreshold.resetOKKey();
          updateOKBadge();
          console.log('[Dev Panel] Мультисброс выполнен');
        } else {
          // Fallback
          localStorage.removeItem(STORAGE_KEYS.OK_KEY);
          updateOKBadge();
        }
      });
    }

    // v0.4.2g: Сброс выбора триад (для тестов)
    const resetTriadSelection = document.getElementById('reset-triad-selection');
    if (resetTriadSelection) {
      resetTriadSelection.addEventListener('click', () => {
        // Сбросить selectedTriads в initEmission()
        // Для этого найдём все кнопки триад и снимем выделение
        $$('.triad-btn, .special-btn').forEach(btn => {
          btn.classList.remove('selected');
        });
        // Сбросить глобальную переменную (если есть)
        if (typeof window.__selectedTriads !== 'undefined') {
          window.__selectedTriads = [];
        }
        console.log('[v0.4.2g] Выбор триад сброшен (Dev Panel)');
      });
    }

    // === МОДАЛЬНЫЕ ОКНА РЕЕСТРОВ ===
    
    // Открытие реестра У.З.
    const openUzRegistry = document.getElementById('open-uz-registry');
    const uzModal = document.getElementById('uz-registry-modal');
    const closeUzRegistry = document.getElementById('close-uz-registry');
    const uzContent = document.getElementById('uz-registry-content');

    if (openUzRegistry && uzModal && closeUzRegistry) {
      openUzRegistry.addEventListener('click', () => {
        uzModal.style.display = 'flex';
        renderUzRegistry(uzContent);
      });

      closeUzRegistry.addEventListener('click', () => {
        uzModal.style.display = 'none';
      });

      uzModal.addEventListener('click', (e) => {
        if (e.target === uzModal) {
          uzModal.style.display = 'none';
        }
      });
    }

    // Открытие реестра транзакций
    const openTransactionsRegistry = document.getElementById('open-transactions-registry');
    const transactionsModal = document.getElementById('transactions-registry-modal');
    const closeTransactionsRegistry = document.getElementById('close-transactions-registry');
    const transactionsContent = document.getElementById('transactions-registry-content');

    if (openTransactionsRegistry && transactionsModal && closeTransactionsRegistry) {
      openTransactionsRegistry.addEventListener('click', () => {
        transactionsModal.style.display = 'flex';
        renderTransactionsRegistry(transactionsContent);
      });

      closeTransactionsRegistry.addEventListener('click', () => {
        transactionsModal.style.display = 'none';
      });

      transactionsModal.addEventListener('click', (e) => {
        if (e.target === transactionsModal) {
          transactionsModal.style.display = 'none';
        }
      });
    }

    // Закрытие модальных окон по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (uzModal) uzModal.style.display = 'none';
        if (transactionsModal) transactionsModal.style.display = 'none';
      }
    });

    // Тест времени v0.3.12 — поддержка абсолютного и относительного смещения
    const devTimeButtons = document.querySelectorAll('.btn-dev-time');
    const devTimeStatus = document.getElementById('dev-time-status');

    // Карта смещений в миллисекундах
    const timeOffsetMap = {
        '+5min': 5 * 60 * 1000,      // + 5 минут
        '+4h': 4 * 60 * 60 * 1000,   // + 4 часа
        '+8h': 8 * 60 * 60 * 1000    // + 8 часов
    };

    devTimeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // v0.3.12: Поддержка обоих типов кнопок
        const timeValue = btn.dataset.time;         // Абсолютное время (19:54)
        const offsetKey = btn.dataset.timeOffset;   // Относительное смещение (+5min, +4h, +8h)

        if (timeValue) {
          // Абсолютное время (например, 19:54)
          const [hours, minutes] = timeValue.split(':').map(Number);
          const now = new Date();
          const testTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
          
          // Сбрасываем предыдущее смещение и устанавливаем новое
          window.__testTimeOffset = testTime.getTime() - now.getTime();
          
          if (devTimeStatus) {
            devTimeStatus.textContent = `Тестовое время: ${timeValue}`;
            devTimeStatus.style.color = 'var(--accent-yellow)';
          }
          
          console.log(`[Dev Panel] Установлено время: ${timeValue}`);
        }
        else if (offsetKey && timeOffsetMap[offsetKey]) {
          // Относительное смещение
          const offset = timeOffsetMap[offsetKey];
          
          // Добавляем смещение к текущему (или устанавливаем если нет)
          window.__testTimeOffset = (window.__testTimeOffset || 0) + offset;

          // Вычисляем общее смещение в минутах/часах
          const totalMinutes = Math.round(window.__testTimeOffset / 60000);
          const hours = Math.floor(Math.abs(totalMinutes) / 60);
          const mins = Math.abs(totalMinutes) % 60;
          const sign = totalMinutes >= 0 ? '+' : '-';

          // Обновляем статус
          if (devTimeStatus) {
            devTimeStatus.textContent = `Смещение: ${sign}${hours}ч ${mins}мин`;
            devTimeStatus.style.color = 'var(--accent-yellow)';
          }

          console.log(`[Dev Panel] Добавлено смещение: ${offsetKey} (${offset / 60000} мин)`);
        }
      });
    });

    // Сброс времени
    const resetTimeBtn = document.getElementById('reset-time');
    if (resetTimeBtn) {
      resetTimeBtn.addEventListener('click', () => {
        window.__testTimeOffset = null;
        if (devTimeStatus) {
          devTimeStatus.textContent = 'Реальное время';
          devTimeStatus.style.color = 'var(--text-muted)';
        }
        console.log('[Dev Panel] Время сброшено на реальное');
      });
    }

    // === Цикл обновления: быстрый (каждую секунду) ===
    // Только критичные по времени: часы, таймер сгорания, проверка сгорания
    let lastFourAMCheck = null;
    let lastUEStatusUpdate = null;
    setInterval(() => {
      updateCurrentDateTime();
      updateBurnTimerDisplay();
      checkBurn(); // v0.4.2b: checkBurn() теперь вызывает updateUEStatuses() в 04:00

      // v0.3.11/v0.3.12: Принудительное обновление в 04:00:00 (переход из сна в действие)
      const now = getInternalTime();
      const hour = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const nowTime = now.getTime();

      // Точное попадание в 04:00:00 — обновляем UI
      if (hour === 4 && minutes === 0 && seconds === 0 && lastFourAMCheck !== nowTime) {
        lastFourAMCheck = nowTime;
        // updateUEStatuses(); // <-- Вызывается в checkBurn()
        updateUEStatusIndicator();
        updateUEIndicatorsFromState();
        updateTriadButtons();
        console.log('[04:00:00] Принудительное обновление UI (сон → действие)');
      }

      // v0.4.2d: ПРОВЕРКА для ВСЕХ часов >= 04:00 — если есть impulse, переводим в active
      // Это нужно если страница была открыта ПОСЛЕ 04:00
      if (hour >= 4 && lastUEStatusUpdate !== nowTime) {
        const hasImpulse = AppState.ueUnits.some(ue => ue.status === 'impulse' && ue.amount > 0);
        if (hasImpulse) {
          updateUEStatuses(); // Принудительно переводим impulse → active
          lastUEStatusUpdate = nowTime;
          updateUEStatusIndicator();
          updateUEIndicatorsFromState();
          updateTriadButtons();
          console.log(`[v0.4.2d] Обнаружены impulse после 04:00 — принудительный перевод (${hour}:00)`);
        }
      }

      // v0.3.12: Дополнительная проверка для 04:00-05:00 (на случай пропуска)
      if (hour >= 4 && hour < 5 && minutes === 0 && seconds === 0) {
        const phase = getCurrentPhase();
        if (phase === 'active') {
          // updateUEStatuses(); // <-- Вызывается в checkBurn()
          updateUEStatusIndicator();
          updateUEIndicatorsFromState();
          updateTriadButtons();
          console.log('[04:xx:00] Проверка фазы: активное обновление UI');
        }
      }
    }, 1000);

    // === Цикл обновления: медленный (каждую минуту) ===
    // UI-обновления, не требующие высокой частоты
    setInterval(() => {
      updateTriadButtons();
      // updateUEStatuses(); // <-- Вызывается только в 04:00 через checkBurn()
      updateUEStatusIndicator();
      updateUEIndicatorsFromState();
    }, 60000);

    // Автосохранение
    setInterval(saveState, 5000);
    
    // Экспорт для отладки
    window.PygmalionSandbox = {
        state: AppState,
        emitUE,
        transferSelectedUE,  // v0.3.5: Передача выбранных У.Е.
        getUEBalance,  // v0.3.5: Вычисление баланса
        isTriadAvailable,
        hasEmittedThisPeriod,
        isSilenceZone,
        saveState,
        loadState,
        clearStorage: () => { localStorage.clear(); location.reload(); },
        TRIADS,
        selectedUEForTransfer  // v0.3.5: Выбранные У.Е.
    };

    console.log('[Отладка] PygmalionSandbox v0.3.5 «Суверенный выбор» доступен в консоли');
    console.log('[Инфо] Зона тишины: 19:55–20:00');
    console.log('[Инфо] Сброс триад: 20:00 ежедневно');
    console.log('[Инфо] v0.3.5: Каждая У.Е. — отдельный объект с ID');
    console.log('[Инфо] v0.3.5: Ручной выбор У.Е. по клику');
    console.log('[Инфо] Для очистки: PygmalionSandbox.clearStorage()');
});
