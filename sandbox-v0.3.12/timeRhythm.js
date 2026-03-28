/**
 * @file timeRhythm.js
 * @description Архитектура ритма времени и жизненного цикла У.Е. (Канон v1.0)
 * Слой 1: Глобальный ритм (Среда)
 * Слой 2: Индивидуальная траектория У.Е. (След)
 */

(function(global) {
  // Точные миллисекундные границы внутри суток
  const RHYTHM = {
    T0400: 4 * 3600000,
    T1955: 19 * 3600000 + 55 * 60000,
    T2000: 20 * 3600000
  };

  // --- СЛОЙ 1: ГЛОБАЛЬНЫЙ РИТМ СИСТЕМЫ ---
  function getSystemPhase(nowMs) {
    const d = new Date(nowMs);
    const msFromMidnight = d.getHours() * 3600000 + d.getMinutes() * 60000 + d.getSeconds() * 1000 + d.getMilliseconds();

    if (msFromMidnight >= RHYTHM.T0400 && msFromMidnight <= RHYTHM.T1955) return 'active';
    if (msFromMidnight > RHYTHM.T1955 && msFromMidnight <= RHYTHM.T2000) return 'silence';
    return 'impulse'; // 20:00:00.001 -> 03:59:59.999
  }

  // Внутренняя чистая функция: вычисляет точки перехода для конкретной У.Е.
  function getUETriggers(emissionTime) {
    const em = new Date(emissionTime);
    const msFromMidnight = em.getHours() * 3600000 + em.getMinutes() * 60000 + em.getSeconds() * 1000 + em.getMilliseconds();

    let activation = new Date(em.getTime());
    let burn = new Date(em.getTime());

    // Если эмиссия в фазу ИМПУЛЬС (20:00 - 04:00)
    if (msFromMidnight > RHYTHM.T2000 || msFromMidnight < RHYTHM.T0400) {
      if (msFromMidnight > RHYTHM.T2000) {
        activation.setDate(activation.getDate() + 1); // Активация наступит завтра
      }
      activation.setHours(4, 0, 0, 0);
    } 
    // Если эмиссия в фазу АКТИВ или ТИШИНА, активация мгновенная (activation остается равной em)

    // Сгорание: Ближайшая полночь СТРОГО ПОСЛЕ активации
    burn = new Date(activation.getTime());
    burn.setDate(burn.getDate() + 1);
    burn.setHours(0, 0, 0, 0);

    return { activationTime: activation, burnTime: burn };
  }

  // --- СЛОЙ 2: СОСТОЯНИЕ У.Е. ---
  function calculateUEState(ue, nowMs) {
    // Жесткие статусы, которые уже завершили цикл
    if (ue.status === 'burned') return 'burned';
    if (ue.status === 'transferred') return 'transferred';

    const triggers = getUETriggers(ue.createdAt);
    const current = new Date(nowMs);

    // Проверка сгорания
    if (current >= triggers.burnTime) return 'burned';
    
    // Проверка импульса (еще не наступило 04:00 после эмиссии)
    if (current < triggers.activationTime) return 'impulse';

    return 'active';
  }

  // --- СЛОЙ 3: ВАЛИДАЦИЯ ДЕЙСТВИЙ ---
  function canTransfer(ue, nowMs) {
    const systemPhase = getSystemPhase(nowMs);
    const ueState = calculateUEState(ue, nowMs);
    
    // Передача возможна только если СИСТЕМА в активе, и сама У.Е. в активе
    return systemPhase === 'active' && ueState === 'active';
  }

  // Экспорт в глобальную область видимости
  global.TimeRhythm = {
    getSystemPhase,
    calculateUEState,
    canTransfer
  };

})(window);