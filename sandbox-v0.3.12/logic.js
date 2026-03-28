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

const STORAGE_KEYS = {
    STATE: 'crystal_state',
    OK_KEY: 'pygmalion_ok_key',
    OK_CREATED: 'pygmalion_ok_created',
    DAG: 'ro_dag',
    ACTS: 'acts_log'
};

const TRIADS = {
    T1: { name: 'Знания', color: '#ef4444', range: [1, 2, 3], ueCount: 3 },
    T2: { name: 'Практики', color: '#facc15', range: [4, 5, 6], ueCount: 3 },
    T3: { name: 'Творчество', color: '#22c55e', range: [7, 8, 9], ueCount: 3 },
    T4: { name: 'Досуг/ЗОЖ', color: '#3b82f6', range: [10, 11, 12], ueCount: 3 },
    T5: { name: '№21', color: '#a855f7', range: [21], ueCount: 1 }
};

const MAX_UE_PER_PERIOD = 26;

const AppState = {
    triadsUsed: {},
    lastEmissionTime: null,
    ueUnits: [],
    umBalance: 5,
    transactions: [],
    dagGraph: [],
    domains: { knowledge: 0, care: 0, creativity: 0, wisdom: 0, trust: 0, participation: 0 },
    reputationWeight: 0,
    givenTotal: 0,
    receivedTotal: 0,
    burnedTotal: 0,
    todayGiven: 0,
    todayReceived: 0,
    todayBurned: 0,
    lastResetDate: null,
    lastTriadsReset: null
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

function calculateBurnAt() {
    const now = getInternalTime();
    const hour = now.getHours();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    if (hour >= 20) {
        const burnDate = new Date(today);
        burnDate.setDate(burnDate.getDate() + 2);
        return burnDate.getTime();
    }
    if (hour < 4) {
        const burnDate = new Date(today);
        burnDate.setDate(burnDate.getDate() + 1);
        return burnDate.getTime();
    }
    const burnDate = new Date(today);
    burnDate.setDate(burnDate.getDate() + 1);
    return burnDate.getTime();
}

function isTransferAllowed() {
    const phase = getCurrentPhase();
    if (phase === 'active') return true;
    if (phase === 'silence') return false;
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
    const hour = now.getHours();
    let targetBurnAt;
    if (hour >= 20) {
        targetBurnAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0).getTime();
    } else {
        targetBurnAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();
    }
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
    const activeUnits = AppState.ueUnits.filter(ue =>
        ue.amount > 0 && ue.status === 'active' && ue.status !== 'burned'
    );

    if (activeUnits.length === 0) {
        const phase = getCurrentPhase();
        if (phase === 'sleep') {
            const fourAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0);
            if (fourAM <= now) fourAM.setDate(fourAM.getDate() + 1);
            const msUntilFour = fourAM.getTime() - now.getTime();
            const hours = Math.floor(msUntilFour / (1000 * 60 * 60));
            const minutes = Math.floor((msUntilFour % (1000 * 60 * 60)) / (1000 * 60));
            timerEl.textContent = `~${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } else {
            timerEl.textContent = '--:--:--';
        }
        return;
    }

    const nearestBurnAt = Math.min(...activeUnits.map(ue => ue.burnAt));
    let msUntilBurn = nearestBurnAt - now.getTime();

    const hour = now.getHours();
    if (hour >= 0 && hour < 4) {
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
        const tomorrowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();
        if (nearestBurnAt === todayMidnight) {
            msUntilBurn = tomorrowMidnight - now.getTime();
        } else if (nearestBurnAt === tomorrowMidnight) {
            msUntilBurn = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime() - now.getTime();
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

function updateUEBalance() {
    const balanceEl = $('#ue-balance');
    if (balanceEl) {
        balanceEl.textContent = getUEBalance();
        updateUEStatusIndicator();
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
    const phaseIconEl = document.getElementById('phase-icon');
    const phaseNameEl = document.getElementById('phase-name');
    const phaseDescEl = document.getElementById('phase-desc');

    if (ueActiveEl) ueActiveEl.textContent = activeUE;
    if (ueImpulseEl) ueImpulseEl.textContent = impulseUE;

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
            if (todayUE > 0) phaseNameEl.textContent += ` (остатки: ${todayUE})`;
        } else {
            phaseIconEl.textContent = '🌞';
            phaseNameEl.textContent = 'Действие';
            phaseDescEl.textContent = '04:00 – 19:55';
        }
    }

    const phaseStatusEl = document.querySelector('.phase-status');
    const phaseRemainderEl = document.getElementById('phase-remainder');
    if (phaseStatusEl && phaseRemainderEl) {
        phaseStatusEl.style.display = phase === 'sleep' ? '' : 'none';
        if (phase === 'sleep') phaseRemainderEl.textContent = todayUE;
    }
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
    if (emittedThisPeriod + actualTotalUE > MAX_UE_PER_PERIOD) {
        alert(`⚠️ Превышен лимит У.Е. на период.\n\nЗаказано: ${emittedThisPeriod} У.Е.\nДоступно: ${MAX_UE_PER_PERIOD - emittedThisPeriod} У.Е.\nВы выбрали: ${actualTotalUE} У.Е.`);
        return;
    }

    const burnAt = calculateBurnAt();
    const now = Date.now();
    const status = phase === 'sleep' ? 'impulse' : 'active';

    newTriads.forEach(triadKey => {
        const ueNumbers = getUENumbersByTriad(triadKey);
        ueNumbers.forEach(ueId => {
            AppState.ueUnits.push({
                id: ueId,
                triad: triadKey,
                amount: 1,
                burnAt: burnAt,
                status: status,
                createdAt: now
            });
            console.log(`[Эмиссия] У.Е. №${ueId} (${triadKey}) добавлена`);
        });
        AppState.triadsUsed[triadKey] = now;
    });

    addDAGNode({
        type: 'emission',
        triads: newTriads,
        totalAmount: actualTotalUE,
        timestamp: now,
        id: generateTxId()
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

let selectedUEForTransfer = [];

function initTransfer() {
    try {
        const inlineMessage = $('#gratitude-message-inline');
        const mainMessage = $('#gratitude-message');
        if (inlineMessage && mainMessage) {
            inlineMessage.addEventListener('input', () => { mainMessage.value = inlineMessage.value; });
            mainMessage.addEventListener('input', () => { inlineMessage.value = mainMessage.value; });
        }

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

    const amount = selectedUEForTransfer.length;
    const message = $('#gratitude-message').value.trim();

    const transaction = {
        id: generateTxId(),
        type: 'transfer',
        from: 'current_user',
        to: recipient,
        amount: amount,
        ueIds: [...selectedUEForTransfer],
        message: message,
        timestamp: Date.now()
    };

    AppState.transactions.push(transaction);

    selectedUEForTransfer.forEach(id => {
        const ue = AppState.ueUnits.find(u => u.id === id);
        if (ue) {
            ue.amount = 0;
            ue.status = 'transferred';
        }
    });

    AppState.todayGiven += amount;
    AppState.givenTotal += amount;
    addDAGNode(transaction);
    calculateWeight();

    updateUEBalance();
    updateDAGVisual();
    updateUEIndicatorsFromState();

    $('#recipient').value = '';
    $('#gratitude-message').value = '';
    selectedUEForTransfer = [];
    updateTransferButton();
    triggerOKBadgeGlow();

    console.log(`[Передача] ${amount} У.Е. → ${recipient}`);
}

// === ВЕС ===

function calculateWeight() {
    const today = new Date().toDateString();
    if (AppState.lastResetDate !== today) {
        AppState.todayGiven = 0;
        AppState.todayReceived = 0;
        AppState.todayBurned = 0;
        AppState.lastResetDate = today;
    }

    const todayWeight = AppState.todayGiven * 2 + AppState.todayReceived - AppState.todayBurned;
    const totalWeight = AppState.givenTotal * 2 + AppState.receivedTotal - AppState.burnedTotal;
    const daysActive = 1;
    const avgWeight = totalWeight / daysActive;

    AppState.reputationWeight = totalWeight;

    if ($('#today-given')) $('#today-given').textContent = AppState.todayGiven;
    if ($('#today-given-total')) $('#today-given-total').textContent = AppState.todayGiven * 2;
    if ($('#total-given')) $('#total-given').textContent = AppState.givenTotal;
    if ($('#total-given-total')) $('#total-given-total').textContent = AppState.givenTotal * 2;
    if ($('#today-weight')) $('#today-weight').textContent = todayWeight;
    if ($('#total-weight')) $('#total-weight').textContent = totalWeight;
    if ($('#avg-weight')) $('#avg-weight').textContent = avgWeight.toFixed(1);
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

// === СОХРАНЕНИЕ ===

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify({
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
            dagGraph: AppState.dagGraph
        }));
    } catch (e) {
        console.error('[Ошибка] saveState:', e);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.STATE);
        if (saved) {
            const data = JSON.parse(saved);
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
            AppState.dagGraph = data.dagGraph || [];
            console.log('[loadState] Загружено, У.Е.:', getUEBalance());
        }
    } catch (e) {
        console.error('[Ошибка] loadState:', e);
    }
}

// === ИНИЦИАЛИЗАЦИЯ ===

function init() {
    console.log('[init] Запуск ПИГМАЛИОН v0.3.13...');
    
    loadState();
    updateOKBadge();
    updateCurrentDateTime();
    updateUEBalance();
    updateUMBalance();
    updateTriadButtons();
    updateUEIndicatorsFromState();
    updateDAGVisual();
    calculateWeight();
    
    initEmission();
    initTransfer();
    
    startMetronome();
    
    console.log('[init] ПИГМАЛИОН запущен');
}

// === ЕДИНЫЙ ЦИКЛ ОБНОВЛЕНИЯ (МЕТРОНОМ) ===
let lastPhaseUpdate = null;

function startMetronome() {
    setInterval(() => {
        const now = getInternalTime().getTime();
        const phase = TimeRhythm ? TimeRhythm.getSystemPhase(now) : getCurrentPhase();

        updateCurrentDateTime();
        updateBurnTimerDisplay();

        // Управление состояниями У.Е. через TimeRhythm
        if (typeof TimeRhythm !== 'undefined') {
            let stateChanged = false;
            let totalBurned = 0;

            AppState.ueUnits.forEach(ue => {
                if (ue.status !== 'transferred' && ue.status !== 'burned') {
                    const exactState = TimeRhythm.calculateUEState(ue, now);
                    if (ue.status !== exactState) {
                        if (exactState === 'burned' && ue.amount > 0) {
                            totalBurned += ue.amount;
                            ue.amount = 0;
                        }
                        ue.status = exactState;
                        stateChanged = true;
                    }
                }
            });

            if (totalBurned > 0) {
                AppState.burnedTotal += totalBurned;
                AppState.todayBurned += totalBurned;
                addDAGNode({ type: 'burned', amount: totalBurned, timestamp: now, id: generateTxId() });
                calculateWeight();
            }

            if (stateChanged) {
                updateUEBalance();
                updateUEStatusIndicator();
                updateUEIndicatorsFromState();
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
        }

        // Сброс триад в 20:00
        const d = new Date(now);
        if (d.getHours() === 20 && d.getMinutes() < 5) {
            resetTriadsForNewPeriod();
            updateTriadButtons();
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
    TimeRhythm
};

// Запуск
document.addEventListener('DOMContentLoaded', init);