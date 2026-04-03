/**
 * ========================================
 * ПИГМАЛИОН — Песочница v0.3.13
 * Логика эмиссии (интегрирован TimeRhythm)
 * ========================================
 */

// === КОНСТАНТЫ ===
const RESET_HOUR = 20;
const SILENCE_START_MINUTES = 19 * 60 + 55;
const SILENCE_END_MINUTES = 20 * 60;
const SLEEP_START_MINUTES = 20 * 60;
const SLEEP_END_MINUTES = 4 * 60;

const TRIADS = {
    T1: { name: 'Знания', color: '#ef4444', range: [1, 2, 3], ueCount: 3 },
    T2: { name: 'Практики', color: '#facc15', range: [4, 5, 6], ueCount: 3 },
    T3: { name: 'Творчество', color: '#22c55e', range: [7, 8, 9], ueCount: 3 },
    T4: { name: 'Досуг/ЗОЖ', color: '#3b82f6', range: [10, 11, 12], ueCount: 3 },
    T5: { name: '№21', color: '#a855f7', range: [21], ueCount: 1 }
};

// === DOMAIN MAP (связь триад с доменами Облика) ===
const DOMAIN_MAP = {
    T1: ['knowledge'],
    T2: ['care', 'wisdom'],
    T3: ['creativity'],
    T4: ['participation', 'trust'],
    T5: ['core']
};

// Получить триаду по номеру У.Е.
function getTriadByUE(id) {
    return Object.keys(TRIADS).find(key => 
        TRIADS[key].range.includes(id)
    );
}

// Получить вес У.М. для У.Е. (канон: все = 1)
function getUEWeight(ueId) {
    return 1;
}

const MAX_UE_PER_PERIOD = 26;

// 12 тестовых О.К. для выбора получателя
const TEST_OK_LIST = [
    '::01::', '::02::', '::03::', '::04::',
    '::05::', '::06::', '::07::', '::08::',
    '::09::', '::10::', '::11::', '::12::'
];

// Флаг блокировки повторного нажатия кнопки подтверждения
let isConfirming = false;

const AppState = {
    triadsUsed: {},
    lastEmissionTime: null,
    ueUnits: [],
    umBalance: 5,
    transactions: [],
    domains: { knowledge: 0, care: 0, creativity: 0, wisdom: 0, trust: 0, participation: 0 },
    reputationWeight: 0,
    givenTotal: 0,
    receivedTotal: 0,
    burnedTotal: 0,
    todayGiven: 0,
    todayReceived: 0,
    todayBurned: 0,
    lastResetDate: null,
    lastTriadsReset: null,
    normUsedToday: { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 },  // Статистика использования триад
    lastNormReset: null  // Дата последнего сброса статистики
};

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function getInternalTime() {
    try {
        const now = new Date();
        if (typeof window.__testTimeOffset === 'number') {
            return new Date(now.getTime() + window.__testTimeOffset);
        }
        return now;
    } catch (e) {
        console.error('[Ошибка] getInternalTime:', e);
        return new Date();
    }
}

// === МОСТЫ К TIMERHYTHM ===

function isSilenceZone() {
    try {
        return TimeRhythm.getSystemPhase(getInternalTime().getTime()) === 'silence';
    } catch (e) {
        const now = getInternalTime();
        const minutes = now.getHours() * 60 + now.getMinutes();
        return minutes >= SILENCE_START_MINUTES && minutes < SILENCE_END_MINUTES;
    }
}

function getCurrentPhase() {
    try {
        const phase = TimeRhythm.getSystemPhase(getInternalTime().getTime());
        if (phase === 'impulse') return 'sleep';
        return phase;
    } catch (e) {
        const now = getInternalTime();
        const minutes = now.getHours() * 60 + now.getMinutes();
        if (minutes >= SILENCE_START_MINUTES && minutes < SILENCE_END_MINUTES) return 'silence';
        if (minutes >= SLEEP_START_MINUTES || minutes < SLEEP_END_MINUTES) return 'sleep';
        return 'active';
    }
}

function hasEmittedThisPeriod() {
    if (!AppState.lastEmissionTime) return false;
    return !isNewPeriodSince(AppState.lastEmissionTime);
}

function isTriadAvailable(triadKey) {
    const lastUsed = AppState.triadsUsed[triadKey];
    if (!lastUsed) return true;
    return isNewPeriodSince(lastUsed);
}

function isNewPeriodSince(timestamp) {
    const now = getInternalTime();
    const pastDate = new Date(timestamp);
    if (now.getHours() >= RESET_HOUR && pastDate.getHours() < RESET_HOUR) return true;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(RESET_HOUR, 0, 0, 0);
    if (pastDate < yesterday) return true;
    return false;
}

/**
 * Расчёт времени сгорания У.Е.
 * @param {number} createdAt - timestamp создания У.Е.
 * @returns {number} timestamp сгорания (00:00 следующих суток от даты эмиссии)
 * 
 * === ПО КАНОНУ: все У.Е. сгорают в полночь следующих суток от даты эмиссии ===
 * Эмиссия в 20:00-03:59 → burnAt = послезавтра 00:00 (28 часов)
 * Эмиссия в 04:00-19:55 → burnAt = завтра 00:00 (4.5-24 часа)
 */
function calculateBurnAt(createdAt) {
    const emissionTime = new Date(createdAt || getInternalTime().getTime());
    const emissionHour = emissionTime.getHours();
    const emissionMinute = emissionTime.getMinutes();
    const emissionMinutes = emissionHour * 60 + emissionMinute;

    // Определяем дату сгорания: всегда +1 день от даты эмиссии
    const burnDate = new Date(emissionTime.getFullYear(), emissionTime.getMonth(), emissionTime.getDate() + 1, 0, 0, 0, 0);
    
    return burnDate.getTime();
}

// === ПРАВИЛО ПЕРЕДАЧИ (канон) ===
// У.Е. важнее фазы, кроме тишины

function canTransferBySystem(ue, nowMs) {
    const ueState = typeof TimeRhythm !== 'undefined' 
        ? TimeRhythm.calculateUEState(ue, nowMs)
        : ue.status;
    const systemPhase = typeof TimeRhythm !== 'undefined'
        ? TimeRhythm.getSystemPhase(nowMs)
        : getCurrentPhase();
    
    // У.Е. должна быть в active
    if (ueState !== 'active') return false;
    
    // Система не должна быть в тишине
    if (systemPhase === 'silence') return false;
    
    return true;
}

function isTransferAllowed() {
    const phase = getCurrentPhase();
    if (phase === 'silence') return false;
    if (phase === 'active') return true;
    if (phase === 'sleep') {
        const now = getInternalTime();
        const todayBurnAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();
        return AppState.ueUnits.some(ue => ue.burnAt === todayBurnAt && ue.status === 'active' && ue.amount > 0);
    }
    return false;
}

function isEmissionAllowed() {
    return getCurrentPhase() !== 'silence';
}

function getUEEmittedThisPeriod() {
    const now = getInternalTime();
    // === ПО КАНОНУ: период = текущие сутки + 1 день (до ближайшей полночи) ===
    const targetBurnAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();
    
    return AppState.ueUnits
        .filter(ue => ue.burnAt === targetBurnAt && ue.amount > 0)
        .reduce((sum, ue) => sum + ue.amount, 0);
}

// === ОБНОВЛЕНИЕ UI ===

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
    }
}

function updateBurnTimerDisplay() {
    const timerEl = $('#burn-timer');
    if (!timerEl) return;

    const balance = getUEBalance();
    if (balance === 0) {
        timerEl.textContent = '--:--:--';
        return;
    }

    const now = getInternalTime();
    const nowMs = now.getTime();

    // Берём ВСЕ живые У.Е. (active + impulse) — обе имеют реальный burnAt
    const livingUnits = AppState.ueUnits.filter(ue =>
        ue.amount > 0 &&
        (ue.status === 'active' || ue.status === 'impulse')
    );

    if (livingUnits.length === 0) {
        timerEl.textContent = '--:--:--';
        return;
    }

    // Ближайший burnAt среди всех живых У.Е.
    const nearestBurnAt = Math.min(...livingUnits.map(ue => ue.burnAt));
    const msUntilBurn = nearestBurnAt - nowMs;

    if (msUntilBurn <= 0) {
        timerEl.textContent = '00:00:00';
        return;
    }

    const hours   = Math.floor(msUntilBurn / 3_600_000);
    const minutes = Math.floor((msUntilBurn % 3_600_000) / 60_000);
    const seconds = Math.floor((msUntilBurn % 60_000) / 1000);
    timerEl.textContent = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
}

function updateUEBalance() {
    const balanceEl = $('#ue-balance');
    if (balanceEl) {
        balanceEl.textContent = getUEBalance();
        updateUEStatusIndicator();
    }
}

// === ОБНОВЛЕНИЕ ФАЗЫ (Действие/Сон/Тишина) ===
function updatePhaseDisplay(phase, hour, minutes) {
    const phaseIconEl = document.getElementById('phase-icon');
    const phaseNameEl = document.getElementById('phase-name');
    const phaseDescEl = document.getElementById('phase-desc');
    
    if (phaseIconEl && phaseNameEl && phaseDescEl) {
        if (phase === 'silence') {
            phaseIconEl.textContent = '🔇';
            phaseNameEl.textContent = 'Тишина';
            phaseDescEl.textContent = '19:55 – 20:00';
        } else if (phase === 'sleep' || phase === 'impulse') {
            phaseIconEl.textContent = '🌙';
            phaseNameEl.textContent = 'Сон/Предзаказ';
            phaseDescEl.textContent = '20:00 – 04:00';
        } else {
            phaseIconEl.textContent = '🌞';
            phaseNameEl.textContent = 'Действие';
            phaseDescEl.textContent = '04:00 – 19:55';
        }
    }
}

function updateUEStatusIndicator() {
    const now = getInternalTime();
    const activeUE = AppState.ueUnits.filter(ue => ue.status === 'active' && ue.amount > 0).reduce((sum, ue) => sum + ue.amount, 0);
    const impulseUE = AppState.ueUnits.filter(ue => ue.status === 'impulse' && ue.amount > 0).reduce((sum, ue) => sum + ue.amount, 0);
    const todayBurnAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();
    const todayUE = AppState.ueUnits.filter(ue => ue.status === 'active' && ue.burnAt === todayBurnAt && ue.amount > 0).reduce((sum, ue) => sum + ue.amount, 0);

    const ueActiveEl = document.getElementById('ue-active');
    const ueImpulseEl = document.getElementById('ue-impulse');
    const ueGivenEl = document.getElementById('ue-given');

    if (ueActiveEl) ueActiveEl.textContent = activeUE;
    if (ueImpulseEl) ueImpulseEl.textContent = impulseUE;
    if (ueGivenEl) ueGivenEl.textContent = AppState.todayGiven;
}

function updateUMBalance() {
    const balanceEl = $('#um-balance');
    if (balanceEl) balanceEl.textContent = AppState.umBalance;
}

function updateUEIndicatorsFromState() {
    try {
        const impulseUE = [];
        const activeUE = [];
        AppState.ueUnits.forEach(ue => {
            if (ue.amount > 0 && ue.status !== 'burned' && ue.status !== 'transferred') {
                if (ue.status === 'impulse') impulseUE.push(ue.id);
                else if (ue.status === 'active') activeUE.push(ue.id);
            }
        });
        updateIndicatorRow('impulse-indicators', impulseUE);
        updateIndicatorRow('active-indicators', activeUE);
    } catch (e) {
        console.error('[Ошибка] updateUEIndicatorsFromState:', e);
    }
}

function updateIndicatorRow(containerId, activeUE) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.ue-indicator').forEach(indicator => {
        const ueNumber = parseInt(indicator.dataset.ue);
        if (activeUE.includes(ueNumber)) {
            indicator.classList.add('active');
            indicator.textContent = ueNumber;
        } else {
            indicator.classList.remove('active', 'selected');
            indicator.textContent = '—';
        }
    });
}

function getUENumbersByTriad(triadKey) {
    const map = { 'T1': [1, 2, 3], 'T2': [4, 5, 6], 'T3': [7, 8, 9], 'T4': [10, 11, 12], 'T5': [21] };
    return map[triadKey] || [];
}

function updateTriadButtons() {
    try {
        const triadButtons = $$('.triad-btn');
        const specialBtn = $('.special-btn');
        const emitBtn = $('.emit-btn');
        const phase = getCurrentPhase();

        if (phase === 'silence') {
            const reason = 'Зона тишины (19:55–20:00)';
            triadButtons.forEach(btn => { btn.disabled = true; btn.classList.add('used'); btn.title = reason; });
            if (specialBtn) { specialBtn.disabled = true; specialBtn.classList.add('used'); specialBtn.title = reason; }
            if (emitBtn) { emitBtn.disabled = true; emitBtn.title = reason; }
            return;
        }

        if (emitBtn) { emitBtn.disabled = false; emitBtn.title = ''; }

        triadButtons.forEach(btn => {
            const triadKey = btn.dataset.triad;
            const used = AppState.triadsUsed[triadKey];
            const hasEmitted = AppState.ueUnits.some(ue => ue.triad === triadKey && ue.status === 'impulse' && ue.amount > 0);
            if (used || hasEmitted) {
                btn.classList.add('used');
                btn.disabled = true;
                btn.title = 'Использована в этом периоде, сброс в 20:00';
            } else {
                btn.classList.remove('used');
                btn.disabled = false;
                btn.title = '';
            }
        });

        if (specialBtn) {
            const triadsActivated = Object.keys(AppState.triadsUsed).filter(k => k !== 'T5').length > 0;
            if (!triadsActivated) {
                specialBtn.disabled = true;
                specialBtn.classList.remove('used');
                specialBtn.title = 'Доступно после активации ≥1 триады';
            } else {
                const specialUsed = AppState.triadsUsed['T5'];
                const hasEmittedSpecial = AppState.ueUnits.some(ue => ue.triad === 'T5' && ue.status === 'impulse' && ue.amount > 0);
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

        window.__selectedTriads = [];
        let selectedTriads = window.__selectedTriads;

        triadButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const triadKey = btn.dataset.triad;
                const used = AppState.triadsUsed[triadKey];
                const hasEmitted = AppState.ueUnits.some(ue => ue.triad === triadKey && ue.status === 'impulse' && ue.amount > 0);
                if (used || hasEmitted) {
                    console.log(`[Игнор] Триада ${triadKey} уже использована или заказана`);
                    return;
                }
                if (selectedTriads.includes(triadKey)) {
                    selectedTriads = selectedTriads.filter(t => t !== triadKey);
                    btn.classList.remove('selected');
                } else {
                    selectedTriads.push(triadKey);
                    btn.classList.add('selected');
                }
                let totalUE = 0;
                selectedTriads.forEach(key => { totalUE += TRIADS[key].ueCount; });
                console.log(`[Выбор] ${selectedTriads.length} триад(ы), всего ${totalUE} У.Е.`);
            });
        });

        if (specialBtn) {
            specialBtn.addEventListener('click', () => {
                if (!specialBtn.disabled) {
                    const hasEmittedSpecial = AppState.ueUnits.some(ue => ue.triad === 'T5' && ue.status === 'impulse' && ue.amount > 0);
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

        // === ГЛАВНЫЙ ОБРАБОТЧИК КНОПКИ "ЭМИТИРОВАТЬ" ===
        emitBtn.addEventListener('click', () => {
            console.log('[Эмитировать] Клик на кнопку');
            
            if (selectedTriads.length === 0) {
                alert('Выберите хотя бы одну триаду или У.Е. №21');
                return;
            }

            if (selectedTriads.includes('T5')) {
                const hasEmittedAnyTriad = ['T1', 'T2', 'T3', 'T4'].some(t => {
                    const used = AppState.triadsUsed[t];
                    const hasEmitted = AppState.ueUnits.some(ue => ue.triad === t && ue.status === 'impulse' && ue.amount > 0);
                    return used || hasEmitted;
                });
                if (!selectedTriads.some(t => t !== 'T5') && !hasEmittedAnyTriad) {
                    alert('⚠️ У.Е. №21 доступна только ПОСЛЕ активации хотя бы одной триады (1-4).');
                    return;
                }
            }

            const filteredTriads = selectedTriads.filter(key => {
                const used = AppState.triadsUsed[key];
                const hasEmitted = AppState.ueUnits.some(ue => ue.triad === key && ue.status === 'impulse' && ue.amount > 0);
                return !used && !hasEmitted;
            });

            if (filteredTriads.length === 0) {
                alert('Все выбранные триады уже использованы или заказаны!');
                return;
            }

            let totalUE = 0;
            filteredTriads.forEach(key => { totalUE += TRIADS[key].ueCount; });

            emitUE(filteredTriads, totalUE);

            window.__selectedTriads = [];
            selectedTriads = window.__selectedTriads;
            console.log('[Эмитировать] Выбор сброшен после эмиссии');
        });

        if (specialBtn && Object.keys(AppState.triadsUsed).filter(k => k !== 'T5').length > 0) {
            specialBtn.disabled = false;
        }
    } catch (e) {
        console.error('[Ошибка] initEmission:', e);
    }
}

function emitUE(selectedTriads, totalUE) {
    const phase = getCurrentPhase();

    if (!isEmissionAllowed()) {
        alert('⚠️ Зона тишины (19:55–20:00).\n\nЭмиссия временно недоступна. Подождите 20:00.');
        return;
    }

    console.log(`[Эмиссия] Заказано: ${totalUE} У.Е. (${selectedTriads.join(', ')})`);

    const newTriads = selectedTriads.filter(key => !AppState.triadsUsed[key]);
    if (newTriads.length === 0) {
        alert('Все выбранные триады уже использованы!');
        return;
    }

    let actualTotalUE = 0;
    newTriads.forEach(key => { actualTotalUE += TRIADS[key].ueCount; });

    const emittedThisPeriod = getUEEmittedThisPeriod();
    const nowDebug = getInternalTime();
    console.log(`[Эмиссия] Проверка лимита: сейчас=${nowDebug.getHours()}:${nowDebug.getMinutes()}, burnAt=${new Date(calculateBurnAt()).toLocaleTimeString()}, уже заказано=${emittedThisPeriod}, хотим=${actualTotalUE}, лимит=${MAX_UE_PER_PERIOD}`);
    
    if (emittedThisPeriod + actualTotalUE > MAX_UE_PER_PERIOD) {
        alert(`⚠️ Превышен лимит У.Е. на период.\n\nЗаказано: ${emittedThisPeriod} У.Е.\nДоступно: ${MAX_UE_PER_PERIOD - emittedThisPeriod} У.Е.\nВы выбрали: ${actualTotalUE} У.Е.`);
        return;
    }

    const now = getInternalTime().getTime();  // ИСПРАВЛЕНО: тестовое время вместо реального
    const burnAt = calculateBurnAt(now);  // Передаём createdAt для расчёта burnAt
    const status = phase === 'sleep' ? 'impulse' : 'active';

    const txId = generateTxId();
    const createdUEs = [];

    newTriads.forEach(triadKey => {
        const ueNumbers = getUENumbersByTriad(triadKey);
        ueNumbers.forEach(ueId => {
            const ue = {
                id: ueId,
                triad: triadKey,
                amount: 1,
                burnAt: burnAt,
                status: status,
                createdAt: now
            };
            AppState.ueUnits.push(ue);
            createdUEs.push(ue);
            console.log(`[Эмиссия] У.Е. №${ueId} (${triadKey}) добавлена`);
        });
        AppState.triadsUsed[triadKey] = now;
    });

    // Запись следа через Storage
    Storage.recordEmission({
        triads: newTriads,
        totalAmount: actualTotalUE,
        createdUEs: createdUEs,
        txId: txId
    });

    updateUEBalance();
    updateTriadButtons();
    updateUEStatusIndicator();
    updateUEIndicatorsFromState();
    $$('.triad-btn, .special-btn').forEach(btn => btn.classList.remove('selected'));
    saveState();
    triggerOKBadgeGlow();

    console.log(`[После эмиссии] Баланс: ${getUEBalance()} У.Е.`);
}

function getUEBalance() {
    const activeUE = AppState.ueUnits.filter(ue => ue.status === 'active' && ue.amount > 0).reduce((sum, ue) => sum + ue.amount, 0);
    const impulseUE = AppState.ueUnits.filter(ue => ue.status === 'impulse' && ue.amount > 0).reduce((sum, ue) => sum + ue.amount, 0);
    const total = activeUE + impulseUE;
    window.__ueBalanceLast = { active: activeUE, impulse: impulseUE, total: total };
    return total;
}

// === ПЕРЕДАЧА ===

let selectedUEForTransfer = [];
let currentModal = null;  // Только одно активное модальное окно

function initTransfer() {
    try {
        const recipientLabel = document.getElementById('recipient-label');
        const uzModal = document.getElementById('uz-registry-modal');
        const uzContent = document.getElementById('uz-registry-content');
        if (recipientLabel && uzModal && uzContent) {
            recipientLabel.addEventListener('click', () => {
                renderUzRegistry(uzContent);
                uzModal.style.display = 'flex';
            });
        }

        $$('#active-indicators .ue-indicator').forEach(indicator => {
            indicator.addEventListener('click', () => {
                const ueNumber = parseInt(indicator.dataset.ue);
                if (!indicator.classList.contains('active')) return;
                const ue = AppState.ueUnits.find(u => u.id === ueNumber && u.status === 'active' && u.amount > 0);
                if (!ue) return;
                if (selectedUEForTransfer.includes(ueNumber)) {
                    selectedUEForTransfer = selectedUEForTransfer.filter(id => id !== ueNumber);
                    indicator.classList.remove('selected');
                } else {
                    selectedUEForTransfer.push(ueNumber);
                    indicator.classList.add('selected');
                }
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

// === ПЕРЕМЕННЫЕ ДЛЯ МОДАЛЬНОГО ОКНА ПОДТВЕРЖДЕНИЯ ===
let pendingTransferData = null;

function transferSelectedUE() {
    const now = getInternalTime().getTime();

    // Проверка через TimeRhythm (если доступен)
    if (selectedUEForTransfer.length > 0 && typeof TimeRhythm !== 'undefined') {
        const firstUE = AppState.ueUnits.find(u => u.id === selectedUEForTransfer[0]);
        if (firstUE && !TimeRhythm.canTransfer(firstUE, now)) {
            alert('⚠️ Передача невозможна.\n\nУбедитесь, что система находится в фазе "Действие" (04:00-19:55), а У.Е. имеют статус "active".');
            return;
        }
    }

    if (selectedUEForTransfer.length === 0) {
        alert('⚠️ Выберите У.Е. для передачи.');
        return;
    }

    if (!isTransferAllowed()) {
        const phase = getCurrentPhase();
        if (phase === 'silence') alert('⚠️ Зона тишины (19:55–20:00).\n\nПередача временно недоступна.');
        else if (phase === 'sleep') alert('⚠️ Время для сна (20:00 - 04:00).\n\nУ.Е. в статусе "импульс" недоступны для передачи.');
        return;
    }

    const recipient = $('#recipient').value.trim();
    if (!recipient) {
        alert('Введите получателя');
        return;
    }

    // === ЗАПРЕТ САМОБЛАГОДАРНОСТИ (этика) ===
    if (isSelfGratitude(recipient)) {
        showToast('Невозможно поблагодарить самого себя. Согласно канону, акт признания требует наличия Получателя.', 'error');
        console.error('[Этика] Попытка самоблагодарности:', recipient);
        return;
    }

    const unavailableUE = [];
    selectedUEForTransfer.forEach(id => {
        if (!AppState.ueUnits.find(u => u.id === id && u.status === 'active' && u.amount > 0)) {
            unavailableUE.push(id);
        }
    });

    if (unavailableUE.length > 0) {
        alert(`⚠️ У.Е. ${unavailableUE.join(', ')} больше недоступны.`);
        selectedUEForTransfer = selectedUEForTransfer.filter(id => !unavailableUE.includes(id));
        updateUEIndicatorsFromState();
        updateTransferButton();
        return;
    }

    const message = $('#gratitude-message')?.value.trim() ?? '';

    // === ПРАВИЛО НОРМЫ (фильтр с учётом истории) ===
    const alreadySentTriads = getAlreadySentTo(recipient);
    const filteredUEIds = filterByNormRule(selectedUEForTransfer, alreadySentTriads);
    const returnedCount = selectedUEForTransfer.length - filteredUEIds.length;

    // Возврат «избыточных» У.Е. в active
    selectedUEForTransfer.forEach(id => {
        if (!filteredUEIds.includes(id)) {
            const ue = AppState.ueUnits.find(u => u.id === id);
            if (ue) {
                ue.status = 'active';
                ue.amount = 1;
                console.log(`[Правило Нормы] У.Е. №${id} возвращена в актив`);
            }
        }
    });

    // === ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ПОДТВЕРЖДЕНИЯ (v0.3.19) ===
    const isMember = recipient.includes('::');
    
    // Сохраняем данные для последующей передачи
    pendingTransferData = {
        recipient: recipient,
        ueIds: [...filteredUEIds],
        message: message,
        isMember: isMember,
        returnedCount: returnedCount,
        alreadySentTriads: alreadySentTriads
    };

    // Заполняем модальное окно
    openTransferConfirmModal(pendingTransferData);
}

/**
 * Открытие модального окна подтверждения передачи
 * @param {Object} data - Данные передачи
 */
function openTransferConfirmModal(data) {
    const modal = document.getElementById('transfer-confirm-modal');
    const guestFields = document.getElementById('guest-fields');

    // Заполняем информацию
    $('#confirm-recipient').textContent = data.isMember ? `::${data.recipient.replace(/::/g, '')}::` : `@${data.recipient}`;
    $('#confirm-ue-count').textContent = data.ueIds.length;

    // Показываем поля для гостей если нужно
    if (!data.isMember) {
        guestFields.style.display = 'block';
        $('#temporary-key').value = '';
        $('#temporary-key').focus();
    } else {
        guestFields.style.display = 'none';
    }

    // Очищаем опциональные поля
    $('#gratitude-reason').value = '';
    $('#custom-message-group').style.display = 'none';
    $('#custom-message').value = '';
    $('#delivery-term').value = '';
    $('#valuation').value = '';
    $('#buyout-date').value = '';
    $('#ok3').value = '';

    // Показываем модальное окно
    modal.style.display = 'flex';
}

/**
 * Закрытие модального окна подтверждения
 */
function closeTransferConfirmModal() {
    const modal = document.getElementById('transfer-confirm-modal');
    modal.style.display = 'none';
    pendingTransferData = null;

    // Сбрасываем флаг блокировки и восстанавливаем обе кнопки
    isConfirming = false;
    const confirmBtn = document.getElementById('confirm-transfer-btn');
    const headerConfirmBtn = document.getElementById('header-confirm-transfer-btn');
    
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = '✓ Подтвердить передачу';
    }
    if (headerConfirmBtn) {
        headerConfirmBtn.disabled = false;
        headerConfirmBtn.textContent = '✦ Подтвердить';
    }
}

/**
 * Обработка выбора причины благодарности (показ поля для ручного ввода)
 */
function initGratitudeReasonHandler() {
    const reasonSelect = document.getElementById('gratitude-reason');
    const customGroup = document.getElementById('custom-message-group');
    
    if (reasonSelect && customGroup) {
        reasonSelect.addEventListener('change', () => {
            if (reasonSelect.value === 'custom') {
                customGroup.style.display = 'block';
                $('#custom-message').focus();
            } else {
                customGroup.style.display = 'none';
            }
        });
    }
}

/**
 * Подтверждение и выполнение передачи
 */
function confirmTransfer() {
    // Защита от повторного нажатия
    if (isConfirming) {
        console.log('[Передача] Уже выполняется подтверждение, игнорируем повторное нажатие');
        return;
    }

    if (!pendingTransferData) return;

    // Блокируем повторные нажатия
    isConfirming = true;
    const confirmBtn = document.getElementById('confirm-transfer-btn');
    const headerConfirmBtn = document.getElementById('header-confirm-transfer-btn');
    
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Обработка...';
    }
    if (headerConfirmBtn) {
        headerConfirmBtn.disabled = true;
        headerConfirmBtn.textContent = 'Обработка...';
    }

    const data = pendingTransferData;
    const isMember = data.isMember;

    // Проверка temporaryKey для гостей
    const temporaryKey = $('#temporary-key').value.trim();
    if (!isMember && !temporaryKey) {
        alert('⚠️ Для отправки гостю необходим временный ключ (в.К.)\n\nУкажите телефон или e-mail в формате:\n+7900-000-00-00 или name@example.com');
        isConfirming = false;
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = '✓ Подтвердить передачу';
        }
        if (headerConfirmBtn) {
            headerConfirmBtn.disabled = false;
            headerConfirmBtn.textContent = '✦ Подтвердить';
        }
        return;
    }

    // Получаем сообщение благодарности (из select или custom)
    const gratitudeReason = $('#gratitude-reason').value;
    let message = '';

    if (gratitudeReason === 'custom') {
        message = $('#custom-message').value.trim();
    } else if (gratitudeReason) {
        message = gratitudeReason;
    } else {
        message = data.message || '';  // Старое сообщение из основного поля (если есть)
    }

    // Получаем опциональные поля
    const deliveryTerm = $('#delivery-term').value || '';
    const valuation = $('#valuation').value.trim() || '';
    const buyoutDate = $('#buyout-date').value || '';
    const ok3 = $('#ok3').value.trim() || '';

    // Создаём транзакцию
    const transaction = {
        id: generateTxId(),
        type: 'transfer',
        from: 'current_user',
        to: data.recipient,
        amount: data.ueIds.length,
        ueIds: [...data.ueIds],
        message: message,
        timestamp: getInternalTime().getTime(),
        // Новые поля (v0.3.19)
        temporaryKey: temporaryKey || null,
        deliveryTerm: deliveryTerm || null,
        valuation: valuation || null,
        buyoutDate: buyoutDate || null,
        ok3: ok3 || null
    };

    AppState.transactions.push(transaction);

    // Обновляем У.Е.
    const triadStats = {};
    data.ueIds.forEach(id => {
        const ue = AppState.ueUnits.find(u => u.id === id);
        if (ue) {
            ue.amount = 0;
            ue.status = 'transferred';

            if (!triadStats[ue.triad]) triadStats[ue.triad] = [];
            triadStats[ue.triad].push(ue.id);
            AppState.normUsedToday[ue.triad]++;
        }
    });

    AppState.todayGiven += data.ueIds.length;
    AppState.givenTotal += data.ueIds.length;

    // Лог статистики
    const triadLog = Object.entries(triadStats)
        .map(([triad, ids]) => `${triad}: №${ids.join(', №')}`)
        .join(', ');
    console.log(`[Статистика] Использовано триад: ${triadLog}`);

    // Запись следа через Storage
    Storage.recordTransfer({
        to: data.recipient,
        amount: data.ueIds.length,
        ueIds: [...data.ueIds],
        message: message,
        txId: transaction.id
    });

    // Обновление UI
    updateDomainsFromDAR();
    calculateWeight();
    calculateSpiritualDynamics();
    updateUEBalance();
    updateUEIndicatorsFromState();
    updateUEStatusIndicator();

    $('#recipient').value = '';
    selectedUEForTransfer = [];
    updateUEIndicatorsFromState();  // v0.3.21: снимаем выделение с оставшихся У.Е.
    updateTransferButton();
    triggerOKBadgeGlow();

    // Уведомление
    if (data.returnedCount > 0) {
        const sentList = data.ueIds.map(id => `№${id}`).join(', ');
        showToast(`Передано: ${data.ueIds.length} У.Е. (${sentList}). Возвращено в актив: ${data.returnedCount} У.Е.`, 'success');
    } else {
        showToast(`Передано: ${data.ueIds.length} У.Е.`, 'success');
    }

    console.log(`[Передача] ${data.ueIds.length} У.Е. → ${data.recipient}`);

    // Сохраняем состояние ПЕРЕД закрытием модального окна
    saveState();

    // Закрываем модальное окно ПОСЛЕ сохранения
    closeTransferConfirmModal();
    
    // Показываем финальный toast
    showToast('✦ Отправлено!', 'success');
}

// === ВЕС ===

function calculateWeight() {
    const today = getInternalTime().toDateString();
    if (AppState.lastResetDate !== today) {
        AppState.todayGiven = 0;
        AppState.todayReceived = 0;
        AppState.todayBurned = 0;
        AppState.lastResetDate = today;
        console.log(`[ВЕС] Сброс показателей на ${today}`);
    }

    // Производные числа (сразу ×2, ×1, −1)
    const todayGivenX2 = AppState.todayGiven * 2;
    const totalGivenX2 = AppState.givenTotal * 2;
    const todayReceivedX1 = AppState.todayReceived;
    const totalReceivedX1 = AppState.receivedTotal;
    const todayBurnedX1 = AppState.todayBurned;
    const totalBurnedX1 = AppState.burnedTotal;

    // ВЕС
    const todayWeight = todayGivenX2 + todayReceivedX1 - todayBurnedX1;
    const totalWeight = totalGivenX2 + totalReceivedX1 - totalBurnedX1;
    const daysActive = 1;
    const avgWeight = totalWeight / daysActive;

    AppState.reputationWeight = totalWeight;

    // === ОБНОВЛЕНИЕ НОВОЙ ТАБЛИЦЫ (4 строки) ===
    if ($('#today-given-x2')) $('#today-given-x2').textContent = todayGivenX2;
    if ($('#total-given-x2')) $('#total-given-x2').textContent = totalGivenX2;
    if ($('#today-received-x1')) $('#today-received-x1').textContent = todayReceivedX1;
    if ($('#total-received-x1')) $('#total-received-x1').textContent = totalReceivedX1;
    if ($('#today-burned-x1')) $('#today-burned-x1').textContent = todayBurnedX1;
    if ($('#total-burned-x1')) $('#total-burned-x1').textContent = totalBurnedX1;
    if ($('#today-weight')) $('#today-weight').textContent = todayWeight;
    if ($('#total-weight')) $('#total-weight').textContent = totalWeight;
    if ($('#avg-weight')) $('#avg-weight').textContent = avgWeight.toFixed(1);

    // === ЦВЕТОВАЯ ПОДСВЕТКА ВЕСА ===
    const weightEl = $('#today-weight');
    if (weightEl) {
        if (todayWeight > 0) {
            weightEl.style.color = 'var(--accent-green)';
        } else if (todayWeight < 0) {
            weightEl.style.color = 'var(--accent-red)';
        } else {
            weightEl.style.color = 'var(--text-primary)';
        }
    }
}

// === ШКАЛА ДУХОВНОСТИ (Зеркало присутствия) ===
// Формула: (Отдано × 2%) + (Принято × 1%) − (Сгорело × 1%)
// Обнуление в 04:00 (синхронно с активацией У.Е.)

function calculateSpiritualDynamics() {
    const now = getInternalTime();
    const hour = now.getHours();

    let spiritualPercent = 0;

    // === ВРЕМЕННОЙ КОНТУР ===
    // 00:00–04:00 — показываем итоги вчерашнего дня (включая сгоревшие У.Е.)
    // 04:00–00:00 — показываем текущий день

    if (hour >= 0 && hour < 4) {
        // Ночь: учитываем сгоревшие У.Е. для отображения отрицательного следа
        const burnedCount = AppState.ueUnits
            .filter(ue => ue.status === 'burned')
            .reduce((sum, ue) => sum + ue.amount, 0);

        spiritualPercent = (AppState.todayGiven * 2) + 
                          (AppState.todayReceived * 1) - 
                          burnedCount;
    } else {
        // День: обычный расчёт
        spiritualPercent = (AppState.todayGiven * 2) + 
                          (AppState.todayReceived * 1) - 
                          AppState.todayBurned;
    }

    // Ограничение минуса (максимум -13% при потере всех базовых У.Е.)
    if (spiritualPercent < -13) spiritualPercent = -13;

    // === ОБНОВЛЕНИЕ UI ===
    const fillEl = $('#spiritual-fill');
    const valueEl = $('#spiritual-value');

    if (fillEl && valueEl) {
        // Убираем все классы
        fillEl.classList.remove('negative', 'positive', 'neutral');
        valueEl.classList.remove('negative', 'positive', 'neutral');

        // Определяем зону и устанавливаем ширину
        let absPercent = Math.abs(spiritualPercent);

        if (spiritualPercent > 0) {
            // Зелёная зона (Positive): +1% до +33%
            fillEl.classList.add('positive');
            valueEl.classList.add('positive');
            fillEl.style.width = Math.min(absPercent, 50) + '%';
        } else if (spiritualPercent < 0) {
            // Красная зона (Negative): -13% до -1%
            fillEl.classList.add('negative');
            valueEl.classList.add('negative');
            fillEl.style.width = Math.min(absPercent * 3, 50) + '%';
        } else {
            // Точка покоя (Zero): 0%
            fillEl.classList.add('neutral');
            valueEl.classList.add('neutral');
            fillEl.style.width = '0%';
        }

        valueEl.textContent = (spiritualPercent > 0 ? '+' : '') + spiritualPercent + '%';
    }

    // Лог для отладки
    if (window.__lastSpiritualPercent !== spiritualPercent) {
        console.log(`[Шкала] ${spiritualPercent > 0 ? '+' : ''}${spiritualPercent}%`);
        window.__lastSpiritualPercent = spiritualPercent;
    }
}

// === СГОРАНИЕ (устаревшие функции - оставлены для совместимости) ===

function checkBurn() {
    console.warn('[checkBurn] DEPRECATED — используется TimeRhythm в метрономе');
}

function updateUEStatuses() {
    console.warn('[updateUEStatuses] DEPRECATED — используется TimeRhythm в метрономе');
}

function resetTriadsForNewPeriod() {
    const now = getInternalTime();
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes >= 20 * 60 && minutes < 20 * 60 + 5) {
        AppState.triadsUsed = {};
        console.log('[20:00] Triads reset');
    }
}

// === УТИЛИТЫ ===

function generateTxId() {
    return 'tx_' + Math.random().toString(36).substring(2, 10) + getInternalTime().getTime().toString(36);
}

// === О.К. БЕЙДЖ ===

function getCorrectLength(str) {
    return [...str].length;
}

function updateOKBadge() {
    try {
        const okKey = localStorage.getItem('pygmalion_ok_key');
        const okCreated = localStorage.getItem('pygmalion_ok_created');
        const badgeContainer = document.getElementById('ok-badge-container');
        const badge = document.getElementById('ok-badge');
        const okValue = document.getElementById('ok-value');
        const okDate = document.getElementById('ok-date');
        const noOkWarning = document.getElementById('no-ok-warning');

        if (okKey && getCorrectLength(okKey) >= 3) {
            if (badgeContainer) badgeContainer.style.display = 'flex';
            if (okValue) okValue.textContent = `::${okKey}::`;
            if (okCreated) {
                const date = new Date(okCreated);
                if (okDate) okDate.textContent = !isNaN(date.getTime()) ? date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }) : '—';
            }
            document.title = `Pygmalion — ${okKey.replace(/::/g, '')}`;
            if (noOkWarning) noOkWarning.style.display = 'none';
        } else {
            if (badgeContainer) badgeContainer.style.display = 'none';
            if (noOkWarning) noOkWarning.style.display = 'block';
            document.title = 'Pygmalion — Личный комбайн';
        }
    } catch (e) {
        console.error('[Ошибка] updateOKBadge:', e);
    }
}

function triggerOKBadgeGlow() {
    const badge = document.getElementById('ok-badge');
    if (badge) {
        badge.classList.add('emission-active');
        setTimeout(() => badge.classList.remove('emission-active'), 3000);
    }
}

// === СОХРАНЕНИЕ (через Storage) ===

function saveState() {
    try {
        return Storage.saveCrystalState({
            umBalance: AppState.umBalance,
            lastEmissionTime: AppState.lastEmissionTime,
            triadsUsed: AppState.triadsUsed,
            givenTotal: AppState.givenTotal,
            todayGiven: AppState.todayGiven,
            receivedTotal: AppState.receivedTotal,
            todayReceived: AppState.todayReceived,
            burnedTotal: AppState.burnedTotal,
            todayBurned: AppState.todayBurned,
            reputationWeight: AppState.reputationWeight,
            lastResetDate: AppState.lastResetDate,
            lastTriadsReset: AppState.lastTriadsReset,
            ueUnits: AppState.ueUnits,
            transactions: AppState.transactions,
            temporaries: AppState.temporaries || [],
            normUsedToday: AppState.normUsedToday,
            lastNormReset: AppState.lastNormReset
        });
    } catch (e) {
        console.error('[Ошибка] saveState:', e);
        return false;
    }
}

function loadState() {
    try {
        const data = Storage.loadCrystalState();

        AppState.umBalance = data.umBalance || 5;
        AppState.lastEmissionTime = data.lastEmissionTime || null;
        AppState.triadsUsed = data.triadsUsed || {};
        AppState.givenTotal = data.givenTotal || 0;
        AppState.todayGiven = data.todayGiven || 0;
        AppState.receivedTotal = data.receivedTotal || 0;
        AppState.todayReceived = data.todayReceived || 0;
        AppState.burnedTotal = data.burnedTotal || 0;
        AppState.todayBurned = data.todayBurned || 0;
        AppState.reputationWeight = data.reputationWeight || 0;
        AppState.lastResetDate = data.lastResetDate || null;
        AppState.lastTriadsReset = data.lastTriadsReset || null;
        AppState.ueUnits = data.ueUnits || [];
        AppState.transactions = data.transactions || [];
        AppState.temporaries = data.temporaries || [];
        AppState.normUsedToday = data.normUsedToday || { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 };
        AppState.lastNormReset = data.lastNormReset || null;

        console.log('[loadState] Загружено через Storage, У.Е.:', getUEBalance());
        console.log(`[Статистика] T1=${AppState.normUsedToday.T1}, T2=${AppState.normUsedToday.T2}, T3=${AppState.normUsedToday.T3}, T4=${AppState.normUsedToday.T4}, T5=${AppState.normUsedToday.T5}`);
    } catch (e) {
        console.error('[Ошибка] loadState:', e);
    }
}

// === ОБЛИК (КОЛ-ЛИЦО-ОБЛИК) — мост от ro.DAG к Цветку ===

function updateDomainsFromDAR() {
    // Получаем последнее сгорание (граница цикла)
    const lastBurn = Storage.getLastBurnTimestamp();
    
    // Сброс доменов
    AppState.domains = {
        knowledge: 0,
        care: 0,
        creativity: 0,
        wisdom: 0,
        trust: 0,
        participation: 0
    };
    
    // Получаем все транзакции из ro.DAG
    const transfers = Storage.getDAGNodesByType('transfer');
    
    transfers.forEach(node => {
        // Граница: только после последнего сгорания
        if (lastBurn && node.timestamp < lastBurn) {
            return;  // Пропускаем старые акты
        }
        
        // Считаем вес для каждого домена
        node.data.ueIds.forEach(ueId => {
            const triad = getTriadByUE(ueId);
            if (triad && DOMAIN_MAP[triad]) {
                const weight = getUEWeight(ueId);
                DOMAIN_MAP[triad].forEach(domain => {
                    AppState.domains[domain] += weight;
                });
            }
        });
    });
    
    console.log(`[Облик] domains: ${JSON.stringify(AppState.domains)}`);
    
    // Обновляем визуал
    renderFlowerVisual();
}

// Визуализация Цветка с Human Design эффектами
function renderFlowerVisual() {
    Object.entries(AppState.domains).forEach(([domain, value]) => {
        const petal = document.querySelector(`[data-domain="${domain}"]`);
        if (!petal) return;
        
        // Clamp интенсивности для визуала (0.4 - 1.0)
        const intensity = Math.min(value / 13, 1);
        
        // Базовая видимость
        petal.style.opacity = 0.4 + (intensity * 0.6);
        
        // Пульсация для активных доменов
        if (value > 0) {
            petal.classList.add('active');
        } else {
            petal.classList.remove('active');
        }
        
        // Центр (T5) — только свечение, не размер
        if (domain === 'core') {
            const center = document.getElementById('flower-center');
            if (center) {
                if (value > 0) {
                    center.classList.add('core-active');
                    center.style.filter = `drop-shadow(0 0 ${15 + (intensity * 10)}px rgba(168, 85, 247, ${0.5 + (intensity * 0.5)}))`;
                } else {
                    center.classList.remove('core-active');
                    center.style.filter = '';
                }
            }
        }
    });
    
    // Обновляем следы актов (hover)
    updatePetalHoverEffects();
}

// Обновление hover-эффектов со следами актов
function updatePetalHoverEffects() {
    ['knowledge', 'care', 'creativity', 'wisdom', 'trust', 'participation'].forEach(domain => {
        const petal = document.querySelector(`[data-domain="${domain}"]`);
        if (!petal) return;
        
        const lastActs = getLastActsForDomain(domain);
        if (lastActs.length > 0) {
            petal.setAttribute('data-last', lastActs.join(' | '));
        } else {
            petal.removeAttribute('data-last');
        }
    });
}

// Получить последние акты для домена (все У.Е. в акте)
function getLastActsForDomain(domain) {
    const allActs = Storage.getAllActs();
    
    const acts = allActs
        .filter(a => {
            if (a.type !== 'transfer') return false;
            
            // Проверяем ВСЕ У.Е. в акте
            const matches = a.data.ueIds.some(ueId => {
                const triad = getTriadByUE(ueId);
                return DOMAIN_MAP[triad]?.includes(domain);
            });
            
            return matches;
        })
        .slice(-3);  // Последние 3 акта
    
    return acts.map(a => a.data.message || 'акт признания');
}

// === РЕЕСТРЫ ===

// === ЗАПРЕТ САМОБЛАГОДАРНОСТИ (этика) ===

function isSelfGratitude(recipientOK) {
    const currentOK = localStorage.getItem('pygmalion_ok_key');
    return currentOK && currentOK === recipientOK;
}

// === ПРАВИЛО НОРМЫ (этика) ===
// Макс 5 У.Е. к отправке: по 1 из каждой триады + №21
// Учёт всех транзакций за текущий кон (накопительная норма)

function getAlreadySentTo(recipientOK) {
    const today = getInternalTime().toDateString();

    // Фильтруем транзакции за сегодня этому получателю
    const todayTxs = AppState.transactions.filter(tx =>
        tx.to === recipientOK &&
        new Date(tx.timestamp).toDateString() === today
    );

    // Извлекаем триады из переданных У.Е.
    const sentTriads = { T1: false, T2: false, T3: false, T4: false, T5: false };

    todayTxs.forEach(tx => {
        tx.ueIds.forEach(ueId => {
            const ue = AppState.ueUnits.find(u => u.id === ueId);
            if (ue) {
                sentTriads[ue.triad] = true;
                console.log(`[Норма] ${recipientOK}: уже получена триада ${ue.triad} (У.Е. №${ueId})`);
            }
        });
    });

    return sentTriads;
}

function filterByNormRule(selectedUEIds, alreadySentTriads) {
    const result = [];
    const triads = { T1: [], T2: [], T3: [], T4: [], T5: [] };
    
    // 1. Группировка по триадам
    selectedUEIds.forEach(id => {
        const ue = AppState.ueUnits.find(u => u.id === id);
        if (ue && triads[ue.triad]) {
            triads[ue.triad].push(id);
        }
    });
    
    // 2. Выбор min из каждой триады (T1-T4)
    //    НО: если триада уже была отправлена → пропускаем
    ['T1', 'T2', 'T3', 'T4'].forEach(triad => {
        if (triads[triad].length > 0 && !alreadySentTriads[triad]) {
            result.push(Math.min(...triads[triad]));
        } else if (triads[triad].length > 0 && alreadySentTriads[triad]) {
            console.log(`[Норма] Триада ${triad} уже была отправлена, пропускаем`);
        }
    });
    
    // 3. Добавить №21 если выбран (T5)
    if (triads.T5.length > 0 && !alreadySentTriads.T5) {
        result.push(21);
    } else if (triads.T5.length > 0 && alreadySentTriads.T5) {
        console.log(`[Норма] №21 уже был отправлен, пропускаем`);
    }
    
    return result; // Макс 5 У.Е.
}

function renderOKList(container) {
    if (!container) return;

    // Получаем текущий О.К.
    const currentOK = localStorage.getItem('pygmalion_ok_key');
    const okCreated = localStorage.getItem('pygmalion_ok_created');

    // Формируем дату для текущего О.К.
    let currentDate = '—';
    if (okCreated) {
        const date = new Date(okCreated);
        const month = date.toLocaleString('ru-RU', { month: 'long' });
        const year = date.getFullYear();
        currentDate = `${month} ${year} г.`;
    }

    // Создаём список: текущий О.К. + 12 тестовых
    const okList = [];
    if (currentOK && currentOK.length >= 3) {
        okList.push({ key: currentOK, date: currentDate, isCurrent: true });
    }
    TEST_OK_LIST.forEach(key => {
        okList.push({ key: key, date: 'тестовый', isCurrent: false });
    });

    // Рендерим список
    const rows = okList.map(ok => {
        const isSelf = isSelfGratitude(ok.key);
        return `
        <div class="ok-list-item ${ok.isCurrent ? 'ok-list-current' : ''} ${isSelf ? 'ok-list-self' : ''}" 
             data-ok="${ok.key}" 
             style="padding: 10px; border-bottom: 1px solid var(--border-color); ${isSelf ? 'cursor: not-allowed; opacity: 0.5;' : 'cursor: pointer;'} display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: ${ok.isCurrent ? '700' : '400'}; font-size: 1rem;">${ok.key}</span>
                ${isSelf ? '<span style="color: var(--accent-red); font-size: 0.75rem;">⚠️ Нельзя себе</span>' : ''}
            </div>
            <span style="color: var(--text-muted); font-size: 0.85rem;">${ok.date}</span>
        </div>
    `}).join('');

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0;">
            ${rows}
        </div>
        <p class="registry-placeholder" style="margin-top: 1rem; font-size: 0.85rem;">
            Нажмите на О.К. чтобы выбрать получателя
        </p>
    `;

    // Обработчики кликов
    container.querySelectorAll('.ok-list-item').forEach(item => {
        item.addEventListener('click', () => {
            const okKey = item.dataset.ok;
            
            // Проверка на самоблагодарность
            if (isSelfGratitude(okKey)) {
                showToast('Невозможно поблагодарить самого себя. Согласно канону, акт признания требует наличия Получателя.', 'error');
                return;  // Не закрывать окно, не выбирать
            }
            
            $('#recipient').value = okKey;
            closeOKListModal();
            console.log(`[Выбор О.К.] Получатель: ${okKey}`);
        });
    });
}

function closeOKListModal() {
    const okModal = document.getElementById('ok-list-modal');
    if (okModal) okModal.style.display = 'none';
}

function renderUzRegistry(container) {
    if (!container) return;
    const units = AppState.ueUnits;
    if (units.length === 0) {
        container.innerHTML = '<p class="registry-placeholder">Реестр пуст — У.З. ещё не создавались.</p>';
        return;
    }
    const rows = units.map(ue => {
        const statusLabel = { active: 'Активна', impulse: 'Импульс', burned: 'Сгорела', transferred: 'Передана' }[ue.status] || ue.status;
        const triadName = TRIADS[ue.triad]?.name || ue.triad;
        
        // Для переданных и сгоревших У.Е. показываем прочерк
        let burnDate = '—';
        if (ue.status === 'active' || ue.status === 'impulse') {
            burnDate = ue.burnAt ? new Date(ue.burnAt).toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—';
        }
        
        return `<tr>
            <td>№${ue.id}</td>
            <td>${triadName}</td>
            <td>${statusLabel}</td>
            <td>${burnDate}</td>
        </tr>`;
    }).join('');
    container.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
            <thead><tr style="border-bottom:1px solid var(--border-color)">
                <th style="padding:6px;text-align:left">У.Е.</th>
                <th style="padding:6px;text-align:left">Триада</th>
                <th style="padding:6px;text-align:left">Статус</th>
                <th style="padding:6px;text-align:left">Сгорает</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
}

// === ЛЕТОПИСЬ СВЕТОГОГО СЛЕДА (v0.3.19 «Канон Записи») ===

/**
 * Получение текущего О.К. пользователя
 * @returns {string} О.К. или '::—::' если не найден
 */
function getCurrentOK() {
    return (
        localStorage.getItem('pygmalion_ok_key') ||
        AppState?.currentOK ||
        '::—::'
    );
}

/**
 * Нормализация О.К. — оборачивание в ::...::
 * @param {string} okValue - значение О.К.
 * @returns {string} Нормализованный О.К. в формате ::О.К.::
 */
function normalizeOK(okValue) {
    if (!okValue || okValue === 'current_user') {
        okValue = getCurrentOK();
    }
    // Удаляем существующие :: и оборачиваем
    const clean = okValue.replace(/::/g, '').trim();
    return clean ? `::${clean}::` : '::—::';
}

/**
 * Сборка канонической строки транзакции (v0.3.19)
 * Формат: #трек.время.дата.::О.К.::.№У.Е.::получатель.сообщение.поля...
 * @param {Object} tx - Объект транзакции из AppState
 * @param {number} trackNum - Номер трека (1,2,3...)
 * @returns {string} Каноническая строка
 */
function buildCanonicalRecord(tx, trackNum) {
    const time = new Date(tx.timestamp);
    const hhmm = time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const ddmmyy = time.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const track = `#${trackNum}`;

    // === НОРМАЛИЗАЦИЯ У.Е. ===
    const ueList = (tx.ueIds || [])
        .map(id => String(id).replace('№', '').trim())
        .filter(Boolean)
        .join(',');
    const ueFormatted = ueList ? `№${ueList}` : '№—';

    // === НОРМАЛИЗАЦИЯ СООБЩЕНИЯ ===
    const message = tx.message && tx.message.trim()
        ? `"${tx.message.trim()}"`
        : '"—"';

    // === О.К. ОТПРАВИТЕЛЯ (всегда ::О.К.::) ===
    const sender = normalizeOK(tx.from);

    // === ПОЛУЧАТЕЛЬ: ::О.К.:: для участника ИЛИ @ник для гостя ===
    const isMember = tx.to && tx.to.includes('::');
    let recipient;
    if (isMember) {
        // Участник: очищаем и оборачиваем в ::
        const cleanOK = tx.to.replace(/::/g, '').trim();
        recipient = `::${cleanOK}::`;
    } else {
        // Гость: @ник
        recipient = tx.to ? `@${tx.to}` : '@—';
    }

    // === ПОДСКАЗКИ ВМЕСТО — (опциональные поля) ===
    const delivery = tx.deliveryTerm || '(срок доставки)';
    const valuation = tx.valuation || '(оценка ресурса)';
    const buyout = tx.buyoutDate || '(дата выкупа У.М.)';
    const ok3 = tx.ok3 || '(О.К.-3)';

    // === ВРЕМЕННЫЙ КЛЮЧ (только для гостей) ===
    let vkey = '';
    if (!isMember) {
        vkey = tx.temporaryKey ? `[${tx.temporaryKey}]` : '(в.К.)';
    }

    // === СБОРКА СТРОКИ БЕЗ ПРОБЕЛОВ ===
    const parts = [
        track,
        hhmm,
        ddmmyy,
        sender,
        ueFormatted,
        recipient,
        message
    ];

    // Добавляем vkey только для гостей
    if (!isMember) {
        parts.push(vkey);
    }

    // Добавляем опциональные поля (всегда, как подсказки)
    parts.push(delivery, valuation, buyout, ok3);

    return parts.join('.');
}

/**
 * Форматирует транзакцию в каноническую строку "Летописи" (устаревшая, v0.3.18)
 * @deprecated Использовать buildCanonicalRecord()
 * @param {Object} tx - Объект транзакции из AppState
 * @param {number} trackNum - Номер трека (1,2,3...)
 * @returns {string} Форматированная строка
 */
function formatTransactionRecord(tx, trackNum) {
    const time = new Date(tx.timestamp);
    const hhmm = time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const ddmmyy = time.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const track = `#${trackNum}`;
    
    // === НОРМАЛИЗАЦИЯ У.Е. (пункт 5) ===
    const ueList = (tx.ueIds || [])
        .map(id => String(id).replace('№', '').trim())
        .filter(Boolean)
        .join(',');
    const ueFormatted = ueList ? `№${ueList}` : '—';
    
    // === НОРМАЛИЗАЦИЯ СООБЩЕНИЯ (пункт 6) ===
    const message = tx.message && tx.message.trim()
        ? `"${tx.message.trim()}"`
        : '"—"';
    
    // === О.К. ОТПРАВИТЕЛЯ (пункты 1,2) ===
    const sender = tx.from && tx.from !== 'current_user' 
        ? tx.from 
        : getCurrentOK();
    
    // === ПУСТЫЕ БЛОКИ (пункт 7) ===
    const delivery = tx.deliveryTerm || '—';
    const valuation = tx.valuation || '—';
    const buyout = tx.buyoutDate || '—';
    
    // === ВРЕМЕННЫЙ КЛЮЧ (для гостей) ===
    const vkey = tx.temporaryKey ? `[${tx.temporaryKey}]` : '—';
    
    // Определение формата: Участник (Б) или Гость (А)
    const isMember = tx.to && tx.to.includes('::');
    
    if (isMember) {
        // Формат Б (участник): #трек . время . дата . sender . №UE . recipient . сообщение . срок . оценка . дата
        return `<div class="transaction-record format-b">
            ${track} . ${hhmm} . ${ddmmyy} . ${sender} . ${ueFormatted} . ${tx.to} . ${message} . ${delivery} . ${valuation} . ${buyout}
        </div>`;
    } else {
        // Формат А (гость): #трек . время . дата . sender . №UE . @ник . сообщение . [в.К.] . срок . оценка . дата
        const recipient = tx.to ? `@${tx.to}` : '@—';
        return `<div class="transaction-record format-a">
            ${track} . ${hhmm} . ${ddmmyy} . ${sender} . ${ueFormatted} . ${recipient} . ${message} . ${vkey} . ${delivery} . ${valuation} . ${buyout}
        </div>`;
    }
}

function renderTransactionsRegistry(container) {
    if (!container) return;
    const txs = AppState.transactions;

    if (txs.length === 0) {
        container.innerHTML = '<p class="registry-placeholder">Летопись пуста — следов ещё не было.</p>';
        return;
    }

    // Сортировка по убыванию timestamp (новые сверху)
    const sortedTxs = txs.slice().reverse();

    // === ПОРЯДОК ТРЕКОВ: 1,2,3... (пункт 3) ===
    const total = sortedTxs.length;

    // Генерация цепочки записей (v0.3.19 — канонический формат + .chronicle-row)
    const chain = sortedTxs.map((tx, idx) => {
        const trackNum = total - idx;  // 1 внизу, N наверху
        const record = buildCanonicalRecord(tx, trackNum);
        return `<div class="chronicle-row">${record}</div>`;
    }).join('');

    container.innerHTML = `
        <div class="transaction-chain">
            ${chain}
        </div>
        <p class="registry-note" style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted);">
            Показаны все транзакции в хронологическом порядке (новые сверху)
        </p>
    `;
}

// === РЕЕСТРЫ (устаревшие функции) ===

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.style.display = 'none';
    });
    currentModal = null;
    console.log('[Модальные окна] Все закрыты');
}

function openModal(modalId) {
    closeAllModals();
    currentModal = modalId;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        console.log(`[Модальные окна] Открыто: ${modalId}`);
    }
}

// === ИНИЦИАЛИЗАЦИЯ РЕЕСТРОВ И МОДАЛОК ===

function initRegistries() {
    // Кнопка "Список всех О.К." (Получатель)
    const openOk = document.getElementById('recipient-label');
    const okModal = document.getElementById('ok-list-modal');
    const okContent = document.getElementById('ok-list-content');
    const closeOk = document.getElementById('close-ok-list');

    if (openOk && okModal && okContent) {
        openOk.addEventListener('click', () => {
            renderOKList(okContent);
            openModal('ok-list-modal');
        });
    }
    if (closeOk && okModal) {
        closeOk.addEventListener('click', () => { okModal.style.display = 'none'; currentModal = null; });
    }
    if (okModal) {
        okModal.addEventListener('click', (e) => {
            if (e.target === okModal) { okModal.style.display = 'none'; currentModal = null; }
        });
    }

    // Кнопка "Все твои У.Е. на сегодня"
    const openUz = document.getElementById('open-uz-registry');
    const uzModal = document.getElementById('uz-registry-modal');
    const uzContent = document.getElementById('uz-registry-content');
    const closeUz = document.getElementById('close-uz-registry');

    if (openUz && uzModal && uzContent) {
        openUz.addEventListener('click', () => {
            renderUzRegistry(uzContent);
            openModal('uz-registry-modal');
        });
    }
    if (closeUz && uzModal) {
        closeUz.addEventListener('click', () => { uzModal.style.display = 'none'; currentModal = null; });
    }
    if (uzModal) {
        uzModal.addEventListener('click', (e) => {
            if (e.target === uzModal) { uzModal.style.display = 'none'; currentModal = null; }
        });
    }

    // Кнопка "Реестр всех транзакций"
    const openTx = document.getElementById('open-transactions-registry');
    const txModal = document.getElementById('transactions-registry-modal');
    const txContent = document.getElementById('transactions-registry-content');
    const closeTx = document.getElementById('close-transactions-registry');

    if (openTx && txModal && txContent) {
        openTx.addEventListener('click', () => {
            renderTransactionsRegistry(txContent);
            openModal('transactions-registry-modal');
        });
    }
    if (closeTx && txModal) {
        closeTx.addEventListener('click', () => { txModal.style.display = 'none'; currentModal = null; });
    }
    if (txModal) {
        txModal.addEventListener('click', (e) => {
            if (e.target === txModal) { txModal.style.display = 'none'; currentModal = null; }
        });
    }

    // === МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ ПЕРЕДАЧИ (v0.3.19) ===
    const closeTransferConfirm = document.getElementById('close-transfer-confirm');
    const cancelTransfer = document.getElementById('cancel-transfer');
    const confirmTransferBtn = document.getElementById('confirm-transfer-btn');
    const headerConfirmTransferBtn = document.getElementById('header-confirm-transfer-btn');  // v0.3.21
    const transferConfirmModal = document.getElementById('transfer-confirm-modal');

    if (closeTransferConfirm) {
        closeTransferConfirm.addEventListener('click', closeTransferConfirmModal);
    }
    if (cancelTransfer) {
        cancelTransfer.addEventListener('click', closeTransferConfirmModal);
    }
    if (confirmTransferBtn) {
        confirmTransferBtn.addEventListener('click', confirmTransfer);
    }
    // v0.3.21: Кнопка подтверждения в шапке
    if (headerConfirmTransferBtn) {
        headerConfirmTransferBtn.addEventListener('click', confirmTransfer);
    }
    if (transferConfirmModal) {
        transferConfirmModal.addEventListener('click', (e) => {
            if (e.target === transferConfirmModal) { closeTransferConfirmModal(); }
        });
    }

    // Инициализация обработчика выбора причины благодарности
    initGratitudeReasonHandler();
}

// === ПАНЕЛЬ РАЗРАБОТЧИКА ===

function initDevPanel() {
    const toggle = document.getElementById('toggle-dev-panel');
    const content = document.getElementById('dev-panel-content');
    if (toggle && content) {
        toggle.addEventListener('click', () => {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        });
    }

    // Тестовое время
    document.querySelectorAll('.btn-dev-time').forEach(btn => {
        btn.addEventListener('click', () => {
            const timeValue = btn.dataset.time;
            const timeOffset = btn.dataset.timeOffset;
            const status = document.getElementById('dev-time-status');

            if (timeOffset) {
                const match = timeOffset.match(/([+-])(\d+)(min|h)/);
                if (match) {
                    const sign = match[1] === '+' ? 1 : -1;
                    const val = parseInt(match[2]);
                    const unit = match[3] === 'h' ? 3600000 : 60000;
                    window.__testTimeOffset = (window.__testTimeOffset || 0) + sign * val * unit;
                    
                    // Отображение смещения
                    const totalMin = Math.round(window.__testTimeOffset / 60000);
                    const hours = Math.floor(Math.abs(totalMin) / 60);
                    const mins = Math.abs(totalMin) % 60;
                    const signStr = totalMin >= 0 ? '+' : '-';
                    
                    if (status) {
                        if (hours > 0) {
                            status.textContent = `Смещение: ${signStr}${hours}ч ${mins}мин`;
                        } else {
                            status.textContent = `Смещение: ${signStr}${mins} мин`;
                        }
                        status.style.color = totalMin !== 0 ? 'var(--accent-yellow)' : '';
                    }
                }
                return;
            }

            if (timeValue) {
                const [hours, minutes] = timeValue.split(':').map(Number);
                const now = new Date();
                const testTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
                window.__testTimeOffset = testTime.getTime() - now.getTime();
                if (status) {
                    status.textContent = `Тестовое время: ${timeValue}`;
                    status.style.color = 'var(--accent-yellow)';
                }
            }
        });
    });

    const resetTime = document.getElementById('reset-time');
    if (resetTime) {
        resetTime.addEventListener('click', () => {
            window.__testTimeOffset = null;
            const status = document.getElementById('dev-time-status');
            if (status) { status.textContent = 'Реальное время'; status.style.color = ''; }
        });
    }

    const clearStorage = document.getElementById('clear-storage');
    if (clearStorage) {
        clearStorage.addEventListener('click', () => {
            if (confirm('Очистить ВСЁ состояние?')) { localStorage.clear(); location.reload(); }
        });
    }

    const resetOk = document.getElementById('reset-ok-key');
    if (resetOk) {
        resetOk.addEventListener('click', () => {
            if (confirm('Сбросить О.К.?')) {
                localStorage.removeItem('pygmalion_ok_key');
                localStorage.removeItem('pygmalion_ok_created');
                updateOKBadge();
            }
        });
    }

    const resetOkMulti = document.getElementById('reset-ok-multi');
    if (resetOkMulti) {
        resetOkMulti.addEventListener('click', () => {
            localStorage.removeItem('pygmalion_ok_key');
            updateOKBadge();
        });
    }

    const resetTriadSel = document.getElementById('reset-triad-selection');
    if (resetTriadSel) {
        resetTriadSel.addEventListener('click', () => {
            window.__selectedTriads = [];
            document.querySelectorAll('.triad-btn, .special-btn').forEach(b => b.classList.remove('selected'));
            console.log('[Dev] Выбор триад сброшен');
        });
    }
}

// === ИНИЦИАЛИЗАЦИЯ ===

function init() {
    console.log('[init] Запуск ПИГМАЛИОН v0.3.17 «Живое Зеркало»...');
    
    // Миграция хранилища
    if (typeof Storage !== 'undefined') {
        Storage.migrateState();
        
        // Очистка просроченных Вр.У.З.
        Storage.cleanupExpiredTemporaries();
    }
    
    loadState();
    updateOKBadge();
    updateCurrentDateTime();
    updateUEBalance();
    updateUMBalance();
    updateTriadButtons();
    updateUEIndicatorsFromState();
    calculateWeight();

    // === ОБНОВЛЕНИЕ ОБЛИКА (при запуске) ===
    updateDomainsFromDAR();

    initEmission();
    initTransfer();
    initRegistries();
    initDevPanel();

    // Инициализация lastPhaseUpdate перед запуском метронома
    const now = getInternalTime();
    const phase = TimeRhythm ? TimeRhythm.getSystemPhase(now.getTime()) : getCurrentPhase();
    lastPhaseUpdate = phase;
    updatePhaseDisplay(phase, now.getHours(), now.getMinutes());

    startMetronome();

    console.log('[init] ПИГМАЛИОН запущен');
}

// === ЕДИНЫЙ ЦИКЛ ОБНОВЛЕНИЯ (МЕТРОНОМ) ===
let lastPhaseUpdate = null;

function startMetronome() {
    setInterval(() => {
        const now = getInternalTime();
        const nowMs = now.getTime();
        const phase = TimeRhythm ? TimeRhythm.getSystemPhase(nowMs) : getCurrentPhase();
        const hour = now.getHours();
        const minutes = now.getMinutes();

        updateCurrentDateTime();
        updateBurnTimerDisplay();

        // === ОБНОВЛЕНИЕ ФАЗЫ (Действие/Сон/Тишина) ===
        updatePhaseDisplay(phase, hour, minutes);

        // === ШКАЛА ДУХОВНОСТИ: Обновление каждый тик ===
        calculateSpiritualDynamics();

        // === СБРОС ПОКАЗАТЕЛЕЙ В 04:00 (начало нового цикла) ===
        const today = now.toDateString();
        if (hour === 4 && minutes < 5 && AppState.lastResetDate !== today) {
            // Полный сброс всех ежедневных показателей
            AppState.todayGiven = 0;
            AppState.todayReceived = 0;
            AppState.todayBurned = 0;
            AppState.normUsedToday = { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 };
            AppState.lastResetDate = today;
            AppState.lastNormReset = today;
            
            console.log(`[04:00] Сброс всех показателей на ${today}`);
            
            // Обновление UI после сброса
            updateUEStatusIndicator();
            calculateWeight();
            
            // === ШКАЛА ДУХОВНОСТИ: Обнуление в 04:00 ===
            // «Зеркало чисто» — новый день начался
            const fillEl = $('#spiritual-fill');
            const valueEl = $('#spiritual-value');
            if (fillEl && valueEl) {
                fillEl.classList.remove('negative', 'positive', 'neutral');
                fillEl.classList.add('neutral');
                fillEl.style.width = '0%';
                valueEl.classList.remove('negative', 'positive', 'neutral');
                valueEl.classList.add('neutral');
                valueEl.textContent = '0%';
                console.log('[Шкала] Зеркало чисто — новый день начат');
            }
        }

        // === СБРОС ТРИАД В 20:00 ===
        if (hour === 20 && minutes < 5 && AppState.lastTriadsReset !== today) {
            AppState.triadsUsed = {};
            AppState.lastTriadsReset = today;
            console.log('[20:00] Triads reset');
            updateTriadButtons();
        }

        // Управление состояниями У.Е. через TimeRhythm
        if (typeof TimeRhythm !== 'undefined') {
            let stateChanged = false;
            let totalBurned = 0;

            AppState.ueUnits.forEach(ue => {
                if (ue.status === 'transferred' || ue.status === 'burned') return;

                // === СГОРАНИЕ: проверяем через TimeRhythm (по createdAt) ===
                const exactState = TimeRhythm.calculateUEState(ue, nowMs);
                if (exactState === 'burned' && ue.status !== 'burned') {
                    totalBurned += ue.amount;
                    ue.amount = 0;
                    ue.status = 'burned';
                    stateChanged = true;
                    return;
                }

                // === IMPULSE → ACTIVE: только по фазе системы, НЕ по createdAt ===
                // Это гарантирует переход ровно в 04:00 независимо от тестового времени
                if (ue.status === 'impulse' && phase === 'active') {
                    console.log(`[Метроном] У.Е. №${ue.id}: impulse → active (фаза ${phase})`);
                    ue.status = 'active';
                    stateChanged = true;
                }

                // === ACTIVE → IMPULSE: если вошли в фазу сна (на случай смены фазы) ===
                // Не нужно — У.Е. не возвращаются в impulse после активации
            });

            if (totalBurned > 0) {
                AppState.burnedTotal += totalBurned;
                AppState.todayBurned += totalBurned;

                const burnedUEIds = AppState.ueUnits
                    .filter(ue => ue.status === 'burned')
                    .map(ue => ue.id);

                Storage.recordBurn({
                    amount: totalBurned,
                    ueIds: burnedUEIds,
                    txId: generateTxId()
                });

                updateDomainsFromDAR();
                calculateWeight();
            }

            if (stateChanged) {
                updateUEBalance();
                updateUEStatusIndicator();
                updateUEIndicatorsFromState();
                updateTriadButtons();
                saveState();
            }

            // Блокировка UI в Зоне Тишины
            if (phase === 'silence' && lastPhaseUpdate !== 'silence') {
                document.querySelectorAll('.transfer-btn, .emit-btn').forEach(btn => btn.disabled = true);
                lastPhaseUpdate = 'silence';
            } else if (phase !== 'silence' && lastPhaseUpdate === 'silence') {
                updateTriadButtons();
                lastPhaseUpdate = phase;
            }
            
            // Смена фазы
            if (phase !== lastPhaseUpdate) {
                updateTriadButtons();
                updateUEIndicatorsFromState();
                lastPhaseUpdate = phase;
            }
        }

    }, 1000);
}

// Экспорт для отладки
window.PygmalionSandbox = {
    AppState,
    getInternalTime,
    getCurrentPhase,
    getUEBalance,
    saveState,
    loadState,
    TimeRhythm,
    Storage,
    getStorageStats: Storage.getStorageStats
};

// Запуск
document.addEventListener('DOMContentLoaded', init);