/**
 * ========================================
 * ПИГМАЛИОН — Онлайн версия v0.2.8 (Sber Update)
 * React + Tailwind CSS
 * ========================================
 * ИЗМЕНЕНИЯ:
 * - Добавлена система переводов (TRANSLATIONS + t())
 * - Добавлена история конов (gameHistory array)
 * - Сводная таблица появляется после 2-го кона
 * - Кнопка переключения языка (RU/EN)
 * - Ссылка на донат изменена на Сбербанк
 * ========================================
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, RotateCcw, Info, X, Heart, User, Activity, BookOpen, Coffee, 
  Palette, ArrowRight, CheckCircle, Shield, Target, UserCheck, ArrowLeft, 
  Sparkles, Send, Loader2, AlertTriangle, ThumbsUp, Save, Clock, List, 
  FileText, MoreVertical, Delete, Eraser, Copy, Check, MoveHorizontal,
  Volume2, VolumeX, Upload, RefreshCw, LogOut, Globe
} from 'lucide-react';

// =================================================================
// СИСТЕМА ПЕРЕВОДОВ
// =================================================================
const TRANSLATIONS = {
  ru: {
    // Общие
    languageRu: 'RU',
    languageEn: 'EN',
    close: 'Закрыть',
    understood: 'Понятно',
    yes: 'Да',
    no: 'Нет',
    
    // Заставка
    title: 'ПИГМАЛИОН',
    subtitle: 'Технология «ТУТумУЕ»',
    createOk: 'Придумайте свой "О.К."',
    enterKey: 'Введите ваш ключ...',
    acceptOk: 'Принять О.Ключик',
    keyActivated: 'Ключик активирован:',
    startDemo: 'Начать демонстрацию',
    cancel: 'Отмена',
    uploadMusic: 'Загрузить музыку',
    pause: 'Пауза',
    play: 'Играть',
    
    // Инфо модал
    infoTitle: '"i" Для ВСЕХ. Механика ежедневного поЛУЧения',
    info1: 'После получения своего "О.К." каждый участник вправе ежедневно выбирать от 3 до 13 У.Е.',
    info2: 'Все полученные У.Е. можно перераспределить среди собеседников.',
    info3: 'Невозможно поблагодарить себя. Непереданное сгорает.',
    info4: 'Итоги: "заКаз — уКаз — наКаз — отКаз — приКаз - поКаз".',
    
    // Акт 1: Заказ
    act1Title: 'АКТ №1: Заказ (Предзаказ)',
    organization: 'Организация',
    selectScenario: 'Select Scenario',
    chooseScenario: 'Выберите сценарий (Кол-во У.Е.):',
    orderFor: 'Заказ для:',
    choose: 'Выбрать',
    passTurn: 'ПЕРЕХОД ХОДА',
    
    // Триады
    triad1Title: 'Триада 1: Знания',
    triad2Title: 'Триада 2: Практики',
    triad3Title: 'Триада 3: Творчество',
    triad4Title: 'Триада 4: Досуг',
    securityZone: 'Доп. Область: Безопасность (№21)',
    
    // Акт 3: Перекидка
    act3Title: 'АКТ №3: ПЕРЕКИДКА',
    act35Title: 'АКТ №3.5: ВОЗВРАТ',
    organizer: 'Организатор',
    inventory: 'Инвентарь',
    nextTurn: 'Переход хода',
    finishCon: 'Завершить кон',
    forceToResults: 'Принудительно к итогам',
    
    // Передача
    transferTitle: 'Передача У.Е.',
    transferFrom: 'От',
    transferTo: 'Кому',
    transferConfirm: 'Вы передаете',
    sendBtn: 'Отправить',
    aiGratitude: 'С ИИ-благодарностью',
    aiWriting: 'ИИ пишет...',
    
    // Предупреждения
    warning: 'Предупреждение!',
    warningConfirm: 'Вы точно желаете завершить Акт и перейти к итогам?',
    warningUnspent: 'У участников осталось',
    warningUnspent2: 'нераспределённых У.Е.',
    warningBurn: 'Они сгорят с минусом!',
    refusalsLeft: 'Отказов осталось:',
    
    // Ошибки
    orderError: 'ОШИБКА ЗАКАЗА',
    normViolation: 'НАРУШЕНИЕ НОРМЫ!',
    only21Error: 'В этой версии платформы нельзя выбрать только одну У.Е. №21. Пожалуйста, добавьте другие типы У.Е.',
    
    // Акт 4: Итоги
    act4Title: 'ВЕЧЕР ДОБРЫЙ!',
    act4Subtitle: 'Итоги демонстрации и Шкала Духовности',
    burnTime: 'Время: 00:01 (Сгорание)',
    avgSpirituality: 'Средняя Духовность (Все Коны)',
    progressThisCon: 'Прогресс (Этот Кон)',
    
    // Таблица результатов
    participant: 'УЧАСТНИК',
    gave: 'ОТДАЛ (X2)',
    received: 'ПРИНЯЛ (X1)',
    burned: 'СГОРЕЛО (-1)',
    total: 'ИТОГО',
    
    // Сводная таблица
    summaryTitle: 'Сводная таблица (все коны)',
    summarySent: 'Отдал Σ',
    summaryReceived: 'Принял Σ',
    summaryBurned: 'Сгорело Σ',
    summaryScore: 'Баллы Σ',
    
    // Кнопки
    newDay: 'Новый день (Кон)',
    fullReset: 'Полный сброс',
    registry: 'Реестр',
    contacts: 'Контакты',
    
    // Реестр
    registryTitle: 'Реестр Транзакций',
    currentSession: 'Текущий сеанс:',
    noTransactions: 'Транзакций пока нет',
    colTime: 'Время',
    colFrom: 'От',
    colTo: 'Кому',
    colType: 'Тип',
    colStatus: 'Статус',
    colMessage: 'Сообщение',
    statusDone: 'Выполнено',
    statusBurned: 'Сгорело (Минус)',
    statusNormBurn: 'Сгорело (Норма)',
    notUsed: 'Не использовано',
    
    // Контакты
    contactsTitle: 'Об Авторе',
    authorName: '::OP𝕯EH 𝕯AP::',
    authorRealName: '(Олег Головатюк)',
    authorDesc: 'DevOps-архитектор, Автор концепции и визионер стартапа "Пигмалион".',
    authorPhone: 'Тел:',
    authorEmail: 'E-mail:',
    fundraising: 'Сбор средств на пилотную НОД.-Платформу «П./К.» (нагрузоустойчивость до 100 мил.пользователей каждый день)',
    donationRange: '(сумма от 50 руб. до 999 999 руб.)',
    
    // Toast уведомления
    newDayToast: 'Новый кон начался!',
    dataReset: 'Данные сброшены',
    
    // Участники
    participant1: 'Вы (Уч.1)',
    participant2: 'Уч.2 (Лев)',
    participant3: 'Уч.3 (Верх)',
    participant4: 'Уч.4 (Прав)',
    participant5: 'Уч.5 (Центр)',
    
    // Сценарии
    scenario1: 'Сценарий №1: 52 У.Е. (Максимум)',
    scenario1Desc: 'По 13 У.Е. (4 триады + №21)',
    scenario2: 'Сценарий №2: 48 У.Е.',
    scenario2Desc: 'По 12 У.Е. (4 триады)',
    scenario3: 'Сценарий №3: 40 У.Е.',
    scenario3Desc: 'По 10 У.Е. (3 триады + №21)',
    scenario4: 'Сценарий №4: 36 У.Е.',
    scenario4Desc: 'По 9 У.Е. (3 триады)',
    scenario5: 'Сценарий №5: 28 У.Е.',
    scenario5Desc: 'По 7 У.Е. (2 триады + №21)',
    scenario6: 'Сценарий №6: 24 У.Е.',
    scenario6Desc: 'По 6 У.Е. (2 триады)',
    scenario7: 'Сценарий №7: 16 У.Е.',
    scenario7Desc: 'По 4 У.Е. (1 триада + №21)',
    
    // Типы У.Е.
    knowledge: 'Знания (1-3)',
    practice: 'Практики (4-6)',
    leisure: 'Досуг/ЗОЖ (10-12)',
    creativity: 'Творчество (7-9)',
    ue21: 'Безопасность (№21)',
    
    // QR
    qrTitle: 'Благодарность',
    qrSubtitle: 'приветствуется',
    
    // Кон номер
    conNumber: 'Кон №{num}'
  },
  en: {
    // Common
    languageRu: 'RU',
    languageEn: 'EN',
    close: 'Close',
    understood: 'Got it',
    yes: 'Yes',
    no: 'No',
    
    // Intro
    title: 'PYGMALION',
    subtitle: 'Technology "TUTumUE"',
    createOk: 'Create your "O.K."',
    enterKey: 'Enter your key...',
    acceptOk: 'Accept O.Key',
    keyActivated: 'Key activated:',
    startDemo: 'Start demo',
    cancel: 'Cancel',
    uploadMusic: 'Upload music',
    pause: 'Pause',
    play: 'Play',
    
    // Info modal
    infoTitle: '"i" For EVERYONE. Daily receiving mechanics',
    info1: 'After receiving their "O.K." each participant can daily choose from 3 to 13 U.E.',
    info2: 'All received U.E. can be redistributed among interlocutors.',
    info3: 'Cannot thank yourself. Unsent burns.',
    info4: 'Results: "order — decree — punishment — refusal — command — show".',
    
    // Act 1: Order
    act1Title: 'ACT #1: Order (Pre-order)',
    organization: 'Organization',
    selectScenario: 'Select Scenario',
    chooseScenario: 'Choose scenario (U.E. amount):',
    orderFor: 'Order for:',
    choose: 'Choose',
    passTurn: 'PASS TURN',
    
    // Triads
    triad1Title: 'Triad 1: Knowledge',
    triad2Title: 'Triad 2: Practice',
    triad3Title: 'Triad 3: Creativity',
    triad4Title: 'Triad 4: Leisure',
    securityZone: 'Additional Zone: Security (#21)',
    
    // Act 3: Transfer
    act3Title: 'ACT #3: TRANSFER',
    act35Title: 'ACT #3.5: RETURN',
    organizer: 'Organizer',
    inventory: 'Inventory',
    nextTurn: 'Next turn',
    finishCon: 'Finish con',
    forceToResults: 'Force to results',
    
    // Transfer
    transferTitle: 'U.E. Transfer',
    transferFrom: 'From',
    transferTo: 'To',
    transferConfirm: 'You are transferring',
    sendBtn: 'Send',
    aiGratitude: 'With AI gratitude',
    aiWriting: 'AI writing...',
    
    // Warnings
    warning: 'Warning!',
    warningConfirm: 'Are you sure you want to finish the Act and proceed to results?',
    warningUnspent: 'Participants have',
    warningUnspent2: 'unspent U.E. left',
    warningBurn: 'They will burn with a minus!',
    refusalsLeft: 'Refusals left:',
    
    // Errors
    orderError: 'ORDER ERROR',
    normViolation: 'NORM VIOLATION!',
    only21Error: 'In this version you cannot select only U.E. #21. Please add other U.E. types.',
    
    // Act 4: Results
    act4Title: 'GOOD EVENING!',
    act4Subtitle: 'Demo results and Spirituality Scale',
    burnTime: 'Time: 00:01 (Burn)',
    avgSpirituality: 'Average Spirituality (All Cons)',
    progressThisCon: 'Progress (This Con)',
    
    // Results table
    participant: 'PARTICIPANT',
    gave: 'SENT (X2)',
    received: 'RECEIVED (X1)',
    burned: 'BURNED (-1)',
    total: 'TOTAL',
    
    // Summary table
    summaryTitle: 'Summary table (all cons)',
    summarySent: 'Sent Σ',
    summaryReceived: 'Received Σ',
    summaryBurned: 'Burned Σ',
    summaryScore: 'Score Σ',
    
    // Buttons
    newDay: 'New day (Con)',
    fullReset: 'Full reset',
    registry: 'Registry',
    contacts: 'Contacts',
    
    // Registry
    registryTitle: 'Transaction Registry',
    currentSession: 'Current session:',
    noTransactions: 'No transactions yet',
    colTime: 'Time',
    colFrom: 'From',
    colTo: 'To',
    colType: 'Type',
    colStatus: 'Status',
    colMessage: 'Message',
    statusDone: 'Completed',
    statusBurned: 'Burned (Minus)',
    statusNormBurn: 'Burned (Norm)',
    notUsed: 'Not used',
    
    // Contacts
    contactsTitle: 'About Author',
    authorName: '::OP𝕯EH 𝕯AP::',
    authorRealName: '(Oleg Golovatyuk)',
    authorDesc: 'DevOps architect, Concept author and visionary of "Pygmalion" startup.',
    authorPhone: 'Phone:',
    authorEmail: 'E-mail:',
    fundraising: 'Fundraising for pilot NOD Platform "P./K." (capacity up to 100 million users daily)',
    donationRange: '(amount from 50 RUB to 999,999 RUB)',
    
    // Toast notifications
    newDayToast: 'New con started!',
    dataReset: 'Data reset',
    
    // Participants
    participant1: 'You (P.1)',
    participant2: 'P.2 (Left)',
    participant3: 'P.3 (Top)',
    participant4: 'P.4 (Right)',
    participant5: 'P.5 (Center)',
    
    // Scenarios
    scenario1: 'Scenario #1: 52 U.E. (Maximum)',
    scenario1Desc: '13 U.E. each (4 triads + #21)',
    scenario2: 'Scenario #2: 48 U.E.',
    scenario2Desc: '12 U.E. each (4 triads)',
    scenario3: 'Scenario #3: 40 U.E.',
    scenario3Desc: '10 U.E. each (3 triads + #21)',
    scenario4: 'Scenario #4: 36 U.E.',
    scenario4Desc: '9 U.E. each (3 triads)',
    scenario5: 'Scenario #5: 28 U.E.',
    scenario5Desc: '7 U.E. each (2 triads + #21)',
    scenario6: 'Scenario #6: 24 U.E.',
    scenario6Desc: '6 U.E. each (2 triads)',
    scenario7: 'Scenario #7: 16 U.E.',
    scenario7Desc: '4 U.E. each (1 triad + #21)',
    
    // U.E. Types
    knowledge: 'Knowledge (1-3)',
    practice: 'Practice (4-6)',
    leisure: 'Leisure/Health (10-12)',
    creativity: 'Creativity (7-9)',
    ue21: 'Security (#21)',
    
    // QR
    qrTitle: 'Gratitude',
    qrSubtitle: 'welcomed',
    
    // Con number
    conNumber: 'Con #{num}'
  }
};

// Функция перевода с параметрами
function t(key, params = {}, lang = 'ru') {
  const langPack = TRANSLATIONS[lang] || TRANSLATIONS.ru;
  let value = langPack[key] || TRANSLATIONS.ru[key] || key;
  Object.entries(params).forEach(([paramKey, paramValue]) => {
    value = value.replace(`{${paramKey}}`, paramValue);
  });
  return value;
}

// =================================================================
// КОНСТАНТЫ ПРИЛОЖЕНИЯ
// =================================================================
const COLORS = {
  knowledge: { bg: 'bg-red-500', text: 'text-red-500', label: 'knowledge', labelRu: 'Знания (1-3)', labelEn: 'Knowledge (1-3)', icon: BookOpen, triadId: 'T1', hex: '#ef4444' },
  practice: { bg: 'bg-yellow-400', text: 'text-yellow-400', label: 'practice', labelRu: 'Практики (4-6)', labelEn: 'Practice (4-6)', icon: Activity, triadId: 'T2', hex: '#facc15' },
  leisure: { bg: 'bg-blue-500', text: 'text-blue-500', label: 'leisure', labelRu: 'Досуг/ЗОЖ (10-12)', labelEn: 'Leisure (10-12)', icon: Coffee, triadId: 'T3', hex: '#3b82f6' },
  creativity: { bg: 'bg-green-500', text: 'text-green-500', label: 'creativity', labelRu: 'Творчество (7-9)', labelEn: 'Creativity (7-9)', icon: Palette, triadId: 'T4', hex: '#22c55e' },
  ue21: { bg: 'bg-purple-500', text: 'text-purple-500', label: 'ue21', labelRu: 'Безопасность (№21)', labelEn: 'Security (#21)', icon: Shield, triadId: 'T5', hex: '#a855f7' },
};

const TRIADS_MAP = { knowledge: 'T1', practice: 'T2', leisure: 'T3', creativity: 'T4', ue21: 'T5' };

// Генератор сценариев с переводами
const getScenarioDefinitions = (lang) => [
    { id: 1, total: 52, perUser: 13, label: t('scenario1', {}, lang), desc: t('scenario1Desc', {}, lang) },
    { id: 2, total: 48, perUser: 12, label: t('scenario2', {}, lang), desc: t('scenario2Desc', {}, lang) },
    { id: 3, total: 40, perUser: 10, label: t('scenario3', {}, lang), desc: t('scenario3Desc', {}, lang) },
    { id: 4, total: 36, perUser: 9,  label: t('scenario4', {}, lang), desc: t('scenario4Desc', {}, lang) },
    { id: 5, total: 28, perUser: 7,  label: t('scenario5', {}, lang), desc: t('scenario5Desc', {}, lang) },
    { id: 6, total: 24, perUser: 6,  label: t('scenario6', {}, lang), desc: t('scenario6Desc', {}, lang) },
    { id: 7, total: 16, perUser: 4,  label: t('scenario7', {}, lang), desc: t('scenario7Desc', {}, lang) },
];

// Генератор групп эмиссии с переводами
const getEmissionGroups = (lang) => [
    { title: t('triad1Title', {}, lang), type: 'knowledge', color: 'border-red-500' },
    { title: t('triad2Title', {}, lang), type: 'practice', color: 'border-yellow-400' },
    { title: t('triad3Title', {}, lang), type: 'creativity', color: 'border-green-500' },
    { title: t('triad4Title', {}, lang), type: 'leisure', color: 'border-blue-500' },
];

// КЛАВИАТУРА
const MAX_KEY_LENGTH = 70;
const BASE_COLORS = {
    RED: 'RED', BLUE: 'BLUE', GREEN: 'GREEN', WHITE: 'WHITE', SPECIAL: 'SPECIAL'
};
const KEYBOARD_THEME = {
    bg: 'bg-[#0f172a]', keyBg: 'bg-[#1e293b]', inputBg: 'bg-[#1e293b]', digitBg: 'bg-[#334155]',
    textColor: 'text-white', digitColor: 'text-white',
    redColor: 'text-red-500', blueColor: 'text-blue-500', greenColor: 'text-green-500',
    borderColor: 'border-slate-700', placeholderColor: 'text-slate-600', splitLineColor: 'rgba(255, 255, 255, 0.15)', ringColor: 'ring-blue-500'
};
const KEYBOARD_ROWS_DATA = [
  [{ val: 'А', color: BASE_COLORS.RED }, { val: 'Й', color: BASE_COLORS.RED }, { val: '8', color: BASE_COLORS.WHITE, isDigit: true }, { val: '6', color: BASE_COLORS.WHITE, isDigit: true }, { val: '4', color: BASE_COLORS.WHITE, isDigit: true }, { val: '2', color: BASE_COLORS.WHITE, isDigit: true }, { val: '0', color: BASE_COLORS.WHITE, isDigit: true }, { val: '1', color: BASE_COLORS.WHITE, isDigit: true }, { val: '3', color: BASE_COLORS.WHITE, isDigit: true }, { val: '5', color: BASE_COLORS.WHITE, isDigit: true }, { val: '7', color: BASE_COLORS.WHITE, isDigit: true }, { val: '9', color: BASE_COLORS.WHITE, isDigit: true }, { val: 'Ы', color: BASE_COLORS.RED }, { val: 'Э', color: BASE_COLORS.RED }],
  [{ val: 'Q', color: BASE_COLORS.BLUE }, ...['X', 'C', 'T'].map(char => ({ val: char, color: BASE_COLORS.GREEN })), { val: '\u{1D56F}', color: BASE_COLORS.GREEN, isDouble: true }, ...['M', 'O', 'A', 'K', 'E', 'B', 'H', 'P'].map(char => ({ val: char, color: BASE_COLORS.GREEN })), { val: 'Ю', color: BASE_COLORS.RED }],
  [{ val: 'Z', color: BASE_COLORS.BLUE }, { val: 'Y', color: BASE_COLORS.BLUE }, { val: 'S', color: BASE_COLORS.BLUE }, { val: 'U', color: BASE_COLORS.BLUE }, { val: 'F', color: BASE_COLORS.BLUE }, { val: 'G', color: BASE_COLORS.BLUE }, { val: 'J', color: BASE_COLORS.BLUE }, { val: 'I', color: BASE_COLORS.BLUE }, { val: 'W', color: BASE_COLORS.BLUE }, { val: 'V', color: BASE_COLORS.BLUE }, { val: 'L', color: BASE_COLORS.BLUE }, { val: 'N', color: BASE_COLORS.BLUE }, { val: 'R', color: BASE_COLORS.BLUE }, { val: 'Я', color: BASE_COLORS.RED }],
  [{ val: 'З', color: BASE_COLORS.RED }, { val: 'Ч', color: BASE_COLORS.RED }, { val: 'Ц', color: BASE_COLORS.RED }, { val: 'У', color: BASE_COLORS.RED }, { val: 'Ф', color: BASE_COLORS.RED }, { val: 'Г', color: BASE_COLORS.RED }, { val: 'Ж', color: BASE_COLORS.RED }, { val: 'И', color: BASE_COLORS.RED }, { val: 'Ш', color: BASE_COLORS.RED }, { val: 'Щ', color: BASE_COLORS.RED }, { val: 'Л', color: BASE_COLORS.RED }, { val: 'В', color: BASE_COLORS.RED }, { val: 'П', color: BASE_COLORS.RED }, { type: 'split', tl: 'Ь', br: 'Ъ', color: BASE_COLORS.RED }],
  [{ type: 'func', val: 'delete', funcColor: 'bg-red-900', width: 'flex-[1]' }, { type: 'split', tl: '+', br: '-', color: BASE_COLORS.WHITE, width: 'flex-[1]' }, { type: 'split', tl: '|', br: '\\', color: BASE_COLORS.WHITE, width: 'flex-[1]' }, { type: 'split', tl: '(', br: '[', color: BASE_COLORS.WHITE, width: 'flex-[1]' }, { type: 'split', tl: ';', br: ':', color: BASE_COLORS.WHITE, width: 'flex-[1]' }, { type: 'split', tl: '!', br: '?', color: BASE_COLORS.WHITE, width: 'flex-[1]' }, { type: 'func', val: 'space', funcColor: 'DYNAMIC', width: 'flex-[2]' }, { type: 'split', tl: '@', br: '#', color: BASE_COLORS.WHITE, width: 'flex-[1]' }, { type: 'split', tl: '*', br: '/', color: BASE_COLORS.WHITE, width: 'flex-[1]' }, { type: 'split', tl: ')', br: ']', color: BASE_COLORS.WHITE, width: 'flex-[1]' }, { type: 'split', tl: '_', br: '=', color: BASE_COLORS.WHITE, width: 'flex-[1]' }, { type: 'split', tl: ',', br: '.', color: BASE_COLORS.WHITE, width: 'flex-[1]' }, { type: 'func', val: 'backspace', funcColor: 'bg-red-900', width: 'flex-[1]' }]
];

// API
async function callGeminiAPI(prompt) {
  const apiKey = ""; 
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: "Ты - помощник в демонстрации 'Экономика благодарности'. Генерируй короткие (10 слов) фразы благодарности." }] },
  };
  try {
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error('API Fail');
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "Благодарю!";
  } catch (error) {
    return "Спасибо!";
  }
}

// =================================================================
// КОМПОНЕНТЫ UI
// =================================================================
const FlowerOfLife = () => (
  <div className="relative w-64 h-64 animate-spin-slow opacity-80">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="absolute border-2 border-white/30 rounded-full w-32 h-32"
        style={{ top: '25%', left: '25%', transform: `rotate(${i * 60}deg) translate(50%)` }} />
    ))}
    <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full border-2 border-white/50 animate-pulse" />
  </div>
);

// Пигмалион MVP: QR-код для донатов
// Sberbank link: https://messenger.online.sberbank.ru/sl/VvHl8yfbJQhRQugcf
const FloatingQR = ({ lang }) => {
    // URL для Sberbank
    const sberLink = "https://messenger.online.sberbank.ru/sl/VvHl8yfbJQhRQugcf";
    // Кодируем ссылку для API QR-кода
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(sberLink)}`;
    
    return (
        <div className="fixed bottom-4 right-4 z-[999] opacity-50 hover:opacity-100 transition-opacity flex flex-col items-center">
            <div className="bg-white p-1 rounded-lg shadow-lg">
                <img 
                    src={qrApiUrl}
                    alt="Support project" 
                    className="w-16 h-16" 
                />
            </div>
            <p className="text-[10px] text-gray-500 mt-1 bg-black/50 px-1 rounded text-center">{t('qrTitle', {}, lang)}<br/>{t('qrSubtitle', {}, lang)}</p>
        </div>
    );
};

// Переключатель языка
const LanguageToggle = ({ lang, setLang }) => (
    <button 
        onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
        className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors flex items-center gap-1"
        title="Switch language"
    >
        <Globe size={16} />
        <span className="text-xs font-bold">{lang === 'ru' ? 'EN' : 'RU'}</span>
    </button>
);

const UeIcon = ({ type, onDragStart, isSelected, onClick }) => {
  if (!type || !COLORS[type]) {
    return <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center border-2 border-gray-500 text-xs">?</div>;
  }
  
  const Icon = COLORS[type]?.icon || CheckCircle;
  return (
    <div
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart && onDragStart(e, type)}
      onClick={onClick}
      className={`w-12 h-12 rounded-full ${COLORS[type]?.bg || 'bg-gray-500'} flex items-center justify-center text-black shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform border-2 ${isSelected ? 'border-white ring-2 ring-white' : 'border-white/20'}`}
    >
      <Icon size={24} />
    </div>
  );
};

// КЛАВИАТУРА
const SplitKey = ({ tl, br, color, onCharClick, theme, isRow5 }) => {
    let textColorClass;
    if (color === BASE_COLORS.WHITE) textColorClass = theme.digitColor;
    else if (color === BASE_COLORS.RED) textColorClass = theme.redColor;
    else if (color === BASE_COLORS.BLUE) textColorClass = theme.blueColor;
    else if (color === BASE_COLORS.GREEN) textColorClass = theme.greenColor;
    else textColorClass = theme.textColor;
    const bgClass = (isRow5 || color === BASE_COLORS.WHITE) ? theme.digitBg : theme.keyBg;
    return (
        <div className={`relative w-full h-full ${bgClass} rounded-lg overflow-hidden ${theme.borderColor} border shadow-sm group transition-colors duration-200`}>
            <div className="absolute inset-0 pointer-events-none z-10">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="0" y1="100" x2="100" y2="0" stroke={theme.splitLineColor} strokeWidth="2" />
                </svg>
            </div>
            <button onClick={() => onCharClick(tl, color)} className={`absolute top-0 left-0 w-full h-full text-left pl-1.5 pt-1 ${textColorClass} hover:opacity-80 active:opacity-60 transition-opacity`} style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}>
                <span className="absolute top-1 left-2 text-sm font-bold">{tl}</span>
            </button>
            <button onClick={() => onCharClick(br, color)} className={`absolute bottom-0 right-0 w-full h-full text-right pr-1.5 pb-1 ${textColorClass} hover:opacity-80 active:opacity-60 transition-opacity`} style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}>
                <span className="absolute bottom-1 right-2 text-sm font-bold">{br}</span>
            </button>
        </div>
    );
};

const VirtualKeyboard = ({ onKeyPress }) => {
    const [rowsOrder, setRowsOrder] = useState([0, 1, 2, 3]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const theme = KEYBOARD_THEME;

    const onDragStart = (e, index) => { setDraggedItem(index); e.dataTransfer.effectAllowed = 'move'; };
    const onDrop = (e, index) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === index) return;
        const newOrder = [...rowsOrder];
        const dragPos = newOrder.indexOf(draggedItem);
        const dropPos = newOrder.indexOf(index);
        newOrder.splice(dragPos, 1);
        newOrder.splice(dropPos, 0, draggedItem);
        setRowsOrder(newOrder);
        setDraggedItem(null); setDragOverIndex(null);
    };

    const combinedRows = rowsOrder.map(idx => KEYBOARD_ROWS_DATA[idx]);
    combinedRows.push(KEYBOARD_ROWS_DATA[4]);

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-1.5 p-2 select-none">
             <div className="mb-2 text-[10px] text-slate-500 font-mono flex gap-4 uppercase tracking-wider justify-center">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Double</span>
                <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full border border-slate-400 ${theme.keyBg}`}></span> Split</span>
                <span className="flex items-center gap-1"><MoveHorizontal size={10} /> Drag row</span>
            </div>
            {combinedRows.map((row, visualIdx) => {
                const isDraggable = visualIdx < 4;
                const originalIdx = isDraggable ? rowsOrder[visualIdx] : 4;
                const ringClass = (isDraggable && dragOverIndex === originalIdx) ? `ring-2 ${theme.ringColor}` : '';
                return (
                    <div key={originalIdx} draggable={isDraggable}
                        onDragStart={(e) => onDragStart(e, originalIdx)}
                        onDragOver={(e) => { e.preventDefault(); setDragOverIndex(originalIdx); }}
                        onDrop={(e) => onDrop(e, originalIdx)}
                        className={`flex gap-1.5 justify-center h-12 sm:h-14 max-w-[860px] mx-auto ${theme.keyBg} p-1.5 rounded-xl border ${theme.borderColor} shadow-lg transition-colors duration-200 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''} ${ringClass}`}>
                        {isDraggable && <div className="flex items-center text-slate-400 mr-1 cursor-grab"><MoveHorizontal size={16}/></div>}
                        {row.map((key, idx) => {
                            if (key.type === 'split') return <div key={idx} className={`${key.width || 'flex-1'} min-w-[2.5rem] relative`}><SplitKey tl={key.tl} br={key.br} color={key.color} onCharClick={(c, col) => onKeyPress({type:'char', val:c, color:col})} theme={theme} isRow5={visualIdx === 4} /></div>;
                            if (key.type === 'func') {
                                let label = key.val === 'delete' ? 'DEL' : key.val === 'backspace' ? <Delete size={20}/> : 'SPACE';
                                let bg = ['delete', 'backspace'].includes(key.val) ? 'bg-red-900' : key.val === 'space' ? theme.digitBg : theme.keyBg;
                                let txt = ['delete', 'backspace'].includes(key.val) ? 'text-white' : key.val === 'space' ? theme.digitColor : theme.textColor;
                                return <button key={idx} onClick={() => onKeyPress({type:'func', val:key.val})} className={`${key.width} ${bg} ${txt} rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center shadow-sm active:scale-95 transition-all border ${theme.borderColor}`}>{label}</button>;
                            }
                            const isDigit = key.isDigit;
                            const keyBg = isDigit ? theme.digitBg : theme.keyBg;
                            let txtColor;
                            if (isDigit) txtColor = theme.digitColor;
                            else if (key.color === BASE_COLORS.RED) txtColor = theme.redColor;
                            else if (key.color === BASE_COLORS.BLUE) txtColor = theme.blueColor;
                            else if (key.color === BASE_COLORS.GREEN) txtColor = theme.greenColor;
                            else txtColor = theme.textColor;
                            return <button key={idx} onClick={() => onKeyPress({type:'char', val:key.val, color:key.color, isDouble:key.isDouble})} className={`flex-1 min-w-[2rem] ${keyBg} rounded-lg border ${theme.borderColor} shadow-sm active:translate-y-[1px] transition-all relative overflow-hidden group`}>
                                <span className={`${txtColor} text-lg sm:text-xl font-bold group-hover:scale-110 transition-transform block`}>{key.val}</span>
                                {key.color === BASE_COLORS.GREEN && <span className="absolute bottom-0.5 right-1 w-1 h-1 bg-green-500 rounded-full opacity-50"></span>}
                            </button>;
                        })}
                    </div>
                );
            })}
        </div>
    );
};

// МОДАЛЬНЫЕ ОКНА
const ErrorInformer = ({ message, onClose, lang }) => {
  useEffect(() => { const timer = setTimeout(onClose, 8000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className="absolute top-24 left-4 z-50 w-64 h-64 bg-red-900/95 border-4 border-red-500 rounded-xl p-4 shadow-2xl flex flex-col justify-center items-center text-center animate-bounce-in">
        <AlertTriangle className="text-yellow-400 mb-4" size={48} />
        <h3 className="text-lg font-bold text-white mb-2">{t('orderError', {}, lang)}</h3>
        <p className="text-sm text-gray-200 leading-relaxed">{message}</p>
    </div>
  );
};

const WarningInformer = ({ message, onClose, lang }) => {
  useEffect(() => { const timer = setTimeout(onClose, 5000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 w-64 h-64 bg-red-900/95 border-4 border-red-500 rounded-xl p-4 shadow-2xl flex flex-col justify-center items-center text-center animate-bounce-in">
        <div className="absolute top-2 right-2"><button onClick={onClose} className="text-gray-300 hover:text-white"><X size={24}/></button></div>
        <AlertTriangle className="text-yellow-400 mb-4" size={48} />
        <h3 className="text-lg font-bold text-white mb-2">{t('normViolation', {}, lang)}</h3>
        <p className="text-sm text-gray-200 leading-relaxed">{message}</p>
    </div>
  );
};

const IntroInfoModal = ({ onClose, lang }) => (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 animate-fade-in">
        <div className="bg-slate-800 border border-blue-500 rounded-xl p-6 max-w-lg w-full relative shadow-2xl">
            <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white"><X/></button>
            <h3 className="text-xl font-bold text-blue-400 mb-4 text-center">{t('infoTitle', {}, lang)}</h3>
            <ul className="text-sm text-gray-300 space-y-3 list-decimal pl-4">
                <li>{t('info1', {}, lang)}</li>
                <li>{t('info2', {}, lang)}</li>
                <li>{t('info3', {}, lang)}</li>
                <li>{t('info4', {}, lang)}</li>
            </ul>
            <button onClick={onClose} className="mt-6 w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-bold">{t('understood', {}, lang)}</button>
        </div>
    </div>
);

const WarningModal = ({ unspentCount, onCancel, onConfirm, refusalCount, lang }) => {
    const attemptsLeft = 3 - refusalCount;
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
            <div className="bg-slate-900 border-2 border-yellow-500 rounded-xl p-8 max-w-md w-full text-center relative shadow-2xl">
                <h2 className="text-3xl font-bold text-yellow-400 mb-6">{t('warning', {}, lang)}</h2>
                <p className="text-gray-200 text-sm mb-4">{t('warningConfirm', {}, lang)}</p>
                <p className="text-gray-300 text-sm mb-8">{t('warningUnspent', {}, lang)} <span className="text-red-500 font-bold text-xl">{unspentCount}</span> {t('warningUnspent2', {}, lang)}<br/>{t('warningBurn', {}, lang)}</p>
                {refusalCount > 0 && <p className="text-orange-400 text-xs mb-4 font-mono">{t('refusalsLeft', {}, lang)} {attemptsLeft}</p>}
                <div className="flex justify-center gap-6">
                    <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition flex items-center gap-2"><X size={20} /> {t('no', {}, lang)}</button>
                    <button onClick={onConfirm} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition flex items-center gap-2"><CheckCircle size={20} /> {t('yes', {}, lang)}</button>
                </div>
            </div>
        </div>
    );
};

const GratitudeModal = ({ onClose, txInfo, onExecute, onAiExecute, isGenerating, lang }) => {
    if (!txInfo) return null;
    const ueLabel = COLORS[txInfo.ue.type] ? `${COLORS[txInfo.ue.type].labelRu} / ${COLORS[txInfo.ue.type].labelEn}` : txInfo.ue.type;
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-gray-800 border border-blue-500 rounded-xl p-6 w-full max-w-sm relative shadow-2xl">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white"><X/></button>
                <h3 className="text-xl font-bold text-center mb-4 text-white">{t('transferTitle', {}, lang)}</h3>
                <div className="flex items-center justify-center gap-4 mb-6 bg-gray-900/50 p-3 rounded-lg">
                      <div className="text-center"><div className="text-xs text-gray-400">{t('transferFrom', {}, lang)}</div><div className="font-bold text-blue-300">Уч.{txInfo.fromId}</div></div>
                      <ArrowRight className="text-gray-500"/>
                      <div className="text-center"><div className="text-xs text-gray-400">{t('transferTo', {}, lang)}</div><div className="font-bold text-green-300">Уч.{txInfo.toId}</div></div>
                </div>
                <p className="text-center mb-6 text-gray-300">{t('transferConfirm', {}, lang)} <b>{ueLabel}</b></p>
                {isGenerating ? <div className="text-center py-4"><Loader2 className="animate-spin mx-auto mb-2 text-blue-500"/><p className="text-gray-400">{t('aiWriting', {}, lang)}</p></div> : 
                <div className="space-y-3">
                    <button onClick={onExecute} className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold flex justify-center gap-2 transition"><Send size={18}/> {t('sendBtn', {}, lang)}</button>
                    <button onClick={onAiExecute} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white rounded-lg font-bold flex justify-center gap-2 transition"><Sparkles size={18}/> {t('aiGratitude', {}, lang)}</button>
                </div>}
            </div>
        </div>
    );
};

const ResultProgressBar = ({ value, label }) => {
    const isNegative = value < 0;
    const absVal = Math.abs(value);
    const percent = Math.min(100, (absVal / 20) * 100); 
    return (
        <div className="w-full mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{label}</span>
                <span className={`font-bold text-lg ${isNegative ? 'text-red-500' : 'text-green-500'}`}>{isNegative ? '' : '+'}{value}%</span>
            </div>
            <div className="w-full h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
                <div className={`h-full transition-all duration-1000 ${isNegative ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-green-600 to-green-400'}`} style={{ width: `${Math.max(5, percent)}%` }}></div>
            </div>
        </div>
    );
};

// Реестр Транзакций
const RegistryUI = ({ transactions, onBack, userOK, lang }) => {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2"><List /> {t('registryTitle', {}, lang)}</h2>
                <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition"><ArrowLeft /></button>
            </div>
             {userOK && <div className="text-xs text-gray-500 mb-2 font-mono">{t('currentSession', {}, lang)} {userOK}</div>}
            <div className="bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-gray-700 flex-1">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-slate-700">
                            <tr>
                                <th className="px-3 py-3">{t('colTime', {}, lang)}</th>
                                <th className="px-3 py-3">{t('colFrom', {}, lang)}</th>
                                <th className="px-3 py-3">{t('colTo', {}, lang)}</th>
                                <th className="px-3 py-3">{t('colType', {}, lang)}</th>
                                <th className="px-3 py-3">{t('colStatus', {}, lang)}</th>
                                <th className="px-3 py-3">{t('colMessage', {}, lang)}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {transactions.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-500">{t('noTransactions', {}, lang)}</td></tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className={`hover:bg-slate-700/50 ${tx.isMinus ? 'bg-red-900/20' : ''}`}>
                                        <td className="px-3 py-2 font-mono">{tx.time}</td>
                                        <td className="px-3 py-2 text-blue-300 flex flex-col">
                                            <span>{tx.from}</span>
                                            {tx.fromId === 1 && userOK && <span className="text-[9px] text-gray-500">{userOK}</span>}
                                        </td>
                                        <td className="px-3 py-2 text-green-300">{tx.to}</td>
                                        <td className="px-3 py-2">
                                            <span className="px-2 py-1 rounded-full text-[10px] font-bold border" style={{ borderColor: COLORS[Object.keys(COLORS).find(k => COLORS[k].label === tx.type) || 'knowledge']?.hex, color: COLORS[Object.keys(COLORS).find(k => COLORS[k].label === tx.type) || 'knowledge']?.hex }}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className={`px-3 py-2 ${tx.isMinus ? 'text-red-400 font-bold' : 'text-green-400'}`}>{tx.status}</td>
                                        <td className="px-3 py-2 text-gray-400 italic truncate max-w-[150px]">{tx.message || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// =================================================================
// ФИНАЛЬНЫЙ UI С ИСТОРИЕЙ КОНОВ
// =================================================================
function FinalUI({ participants, transactions, onNewDay, onGoToContacts, onGoToRegistry, userOK, onResetAll, gameHistory, lang }) {
  const sortedParticipants = [...participants].sort((a, b) => a.id - b.id);
  const calculateScore = (p) => (p.sent * 2) + (p.received * 1) - (p.burned * 1);
  
  // Текущий кон
  const currentTotalScore = sortedParticipants.reduce((sum, p) => sum + calculateScore(p), 0);
  
  // История: суммируем все предыдущие коны
  const historyTotalScore = gameHistory.reduce((sum, kon) => sum + kon.totalScore, 0);
  const historyCount = gameHistory.length;
  
  // Средняя духовность = (сумма всех конов + текущий) / (количество конов в истории + 1)
  const averageSpirituality = Math.round((historyTotalScore + currentTotalScore) / (historyCount + 1));
  
  // Сводная таблица появляется только после 2-го кона (история >= 1)
  const showSummaryTable = gameHistory.length >= 1;
  
  // Данные для сводной таблицы
  const getAggregatedSummaryRows = () => {
    if (!showSummaryTable) return [];
    
    // Суммируем по участникам все коны из истории + текущий
    const aggregated = {};
    
    // Из истории
    gameHistory.forEach(kon => {
      kon.participants.forEach(p => {
        if (!aggregated[p.id]) aggregated[p.id] = { sent: 0, received: 0, burned: 0, score: 0 };
        aggregated[p.id].sent += p.sent;
        aggregated[p.id].received += p.received;
        aggregated[p.id].burned += p.burned;
        aggregated[p.id].score += calculateScore(p);
      });
    });
    
    // Текущий кон
    sortedParticipants.forEach(p => {
      if (!aggregated[p.id]) aggregated[p.id] = { sent: 0, received: 0, burned: 0, score: 0 };
      aggregated[p.id].sent += p.sent;
      aggregated[p.id].received += p.received;
      aggregated[p.id].burned += p.burned;
      aggregated[p.id].score += calculateScore(p);
    });
    
    return Object.entries(aggregated).map(([id, data]) => ({
      id,
      name: sortedParticipants.find(p => p.id === parseInt(id))?.name || `Уч.${id}`,
      ...data
    }));
  };
  
  const summaryRows = getAggregatedSummaryRows();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white p-4 flex flex-col items-center w-full">
      <FloatingQR lang={lang} />
      <div className="w-full max-w-3xl flex flex-col items-center">
        <h1 className="text-3xl font-bold text-orange-500 mb-2">{t('act4Title', {}, lang)}</h1>
        <p className="text-gray-400 text-sm mb-1">{t('act4Subtitle', {}, lang)}</p>
        <p className="text-red-400 font-mono text-xs mb-6">{t('burnTime', {}, lang)}</p>
        
        {/* Статистика */}
        <div className="w-full bg-slate-800/80 p-4 rounded-xl mb-6 border border-blue-500 flex justify-around items-center">
            <div className="text-center">
                <div className="text-xs text-gray-400">{t('avgSpirituality', {}, lang)}</div>
                <div className="text-2xl font-bold text-purple-400">{averageSpirituality}%</div>
                {historyCount > 0 && <div className="text-xs text-gray-500">({historyCount + 1} {lang === 'ru' ? 'конов' : 'cons'})</div>}
            </div>
            <div className="text-center">
                <div className="text-xs text-gray-400">{t('progressThisCon', {}, lang)}</div>
                <div className="text-2xl font-bold text-green-400">+{currentTotalScore}</div>
            </div>
        </div>

        {/* Итоговая таблица текущего кона */}
        <div className="w-full bg-slate-800 rounded-lg p-1 overflow-hidden shadow-xl mb-6 border border-slate-700">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-slate-700">
                        <tr>
                            <th className="px-4 py-3">{t('participant', {}, lang)}</th>
                            <th className="px-4 py-3 text-center">{t('gave', {}, lang)}</th>
                            <th className="px-4 py-3 text-center">{t('received', {}, lang)}</th>
                            <th className="px-4 py-3 text-center text-red-400">{t('burned', {}, lang)}</th>
                            <th className="px-4 py-3 text-right text-yellow-500">{t('total', {}, lang)}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {sortedParticipants.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-700/50">
                                <td className="px-4 py-3 font-medium text-white">
                                    {p.name}
                                    {p.id === 1 && userOK && <div className="text-[10px] text-gray-500">{userOK}</div>}
                                </td>
                                <td className="px-4 py-3 text-center text-blue-400">{p.sent}</td>
                                <td className="px-4 py-3 text-center text-green-400">{p.received}</td>
                                <td className="px-4 py-3 text-center text-red-400 font-bold">{p.burned}</td>
                                <td className="px-4 py-3 text-right font-bold text-yellow-400 text-lg">{calculateScore(p)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        
        {/* СВОДНАЯ ТАБЛИЦА - только после 2-го кона */}
        {showSummaryTable && (
          <div className="w-full bg-slate-800/80 rounded-lg p-4 overflow-hidden shadow-xl mb-6 border border-purple-500">
              <h3 className="text-lg font-bold text-purple-400 mb-3 text-center">{t('summaryTitle', {}, lang)}</h3>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-300">
                      <thead className="text-xs text-gray-400 uppercase bg-slate-700">
                          <tr>
                              <th className="px-4 py-3">{t('participant', {}, lang)}</th>
                              <th className="px-4 py-3 text-center">{t('summarySent', {}, lang)}</th>
                              <th className="px-4 py-3 text-center">{t('summaryReceived', {}, lang)}</th>
                              <th className="px-4 py-3 text-center text-red-400">{t('summaryBurned', {}, lang)}</th>
                              <th className="px-4 py-3 text-right text-yellow-500">{t('summaryScore', {}, lang)}</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                          {summaryRows.map((row) => (
                              <tr key={row.id} className="hover:bg-slate-700/50">
                                  <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                                  <td className="px-4 py-3 text-center text-blue-400">{row.sent}</td>
                                  <td className="px-4 py-3 text-center text-green-400">{row.received}</td>
                                  <td className="px-4 py-3 text-center text-red-400 font-bold">{row.burned}</td>
                                  <td className="px-4 py-3 text-right font-bold text-yellow-400 text-lg">{row.score}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
        )}
        
        {/* Шкалы духовности */}
        <div className="w-full space-y-4 mb-8 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            {sortedParticipants.map(p => <ResultProgressBar key={p.id} value={calculateScore(p)} label={p.name} />)}
        </div>
        
        {/* Кнопки */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 w-full pb-10">
            <button onClick={onNewDay} className="bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-500 transition font-bold shadow-lg flex items-center gap-2"><RotateCcw size={18}/> {t('newDay', {}, lang)}</button>
            <button onClick={onResetAll} className="bg-red-600 px-6 py-3 rounded-lg hover:bg-red-500 transition font-bold shadow-lg flex items-center gap-2"><LogOut size={18}/> {t('fullReset', {}, lang)}</button>
            <button onClick={onGoToRegistry} className="bg-slate-600 px-6 py-3 rounded-lg hover:bg-slate-500 transition font-bold shadow-lg flex items-center gap-2"><FileText size={18}/> {t('registry', {}, lang)}</button>
            <button onClick={onGoToContacts} className="bg-gray-700 px-6 py-3 rounded-lg hover:bg-gray-600 transition font-bold shadow-lg flex items-center gap-2"><UserCheck size={18}/> {t('contacts', {}, lang)}</button>
        </div>
      </div>
    </div>
  );
}

const ParticipantNode = ({ participant, isActive, onSelect, isSelected, isCenter, userOK }) => (
    <div onClick={onSelect} className={`relative w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center transition-all bg-gray-800 cursor-pointer shadow-xl ${isActive ? 'border-yellow-400 ring-4 ring-yellow-400/30' : 'border-gray-600'} ${isSelected ? 'bg-green-900/50 border-green-400 scale-110' : ''} ${isCenter ? 'w-32 h-32 border-dashed border-purple-500' : ''}`}>
        <User size={isCenter?32:24} className={isCenter?"text-purple-400":"text-gray-400"} />
        <span className="text-xs mt-1 font-bold">{participant.name.split(' ')[0]}</span>
        {participant.id === 1 && userOK && <span className="text-[8px] text-gray-500 truncate max-w-[80px]">{userOK}</span>}
        <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-gray-900 shadow-md">+{participant.received}</div>
        {participant.inventory.length > 0 && !isCenter && (
            <div className="absolute -bottom-2 -left-2 bg-blue-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-gray-900 shadow-md">{participant.inventory.length}</div>
        )}
    </div>
);

// =================================================================
// ГЛАВНОЕ ПРИЛОЖЕНИЕ
// =================================================================
const getInitialParticipants = (lang) => [
    { id: 1, name: t('participant1', {}, lang), role: 'Me', received: 0, sent: 0, spirituality: 0, burned: 0, inventory: [], emissionSelections: [] },
    { id: 2, name: t('participant2', {}, lang), role: 'Bot', received: 0, sent: 0, spirituality: 0, burned: 0, inventory: [], emissionSelections: [] },
    { id: 3, name: t('participant3', {}, lang), role: 'Bot', received: 0, sent: 0, spirituality: 0, burned: 0, inventory: [], emissionSelections: [] },
    { id: 4, name: t('participant4', {}, lang), role: 'Bot', received: 0, sent: 0, spirituality: 0, burned: 0, inventory: [], emissionSelections: [] },
    { id: 5, name: t('participant5', {}, lang), role: 'Target', received: 0, sent: 0, spirituality: 0, burned: 0, inventory: [], emissionSelections: [] },
];

export default function App() {
  // Язык
  const [lang, setLang] = useState(() => sessionStorage.getItem('pigmalion_lang') || 'ru');
  
  const [screen, setScreen] = useState(0.1);
  const [userOK, setUserOK] = useState(() => localStorage.getItem('userOK') || null);
  const [showIntroInfo, setShowIntroInfo] = useState(false);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [keyboardInputData, setKeyboardInputData] = useState([]);

  const [participants, setParticipants] = useState(() => getInitialParticipants(lang));
  const [transactions, setTransactions] = useState([]);
  const [activeOrderingFor, setActiveOrderingFor] = useState(1);
  const [currentOrderSelections, setCurrentOrderSelections] = useState([]);
  const [activeDistributor, setActiveDistributor] = useState(1);
  const [selectedSourceUE, setSelectedSourceUE] = useState(null); 
  const [selectedReceiverId, setSelectedReceiverId] = useState(null);
  
  const [informerMessage, setInformerMessage] = useState(null);
  const [normViolationMessage, setNormViolationMessage] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [unspentUEs, setUnspentUEs] = useState(0);
  
  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("19:00:00");
  const [act3Time, setAct3Time] = useState("20:00:00");
  const [validationAttempts, setValidationAttempts] = useState(0);
  const [refusalCount, setRefusalCount] = useState(0);
  
  // ИСТОРИЯ КОНОВ - ключевой элемент!
  const [gameHistory, setGameHistory] = useState([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const audioRef = useRef(new Audio());
  const fileInputRef = useRef(null);

  // Сохранение языка
  useEffect(() => {
    sessionStorage.setItem('pigmalion_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (userOK) localStorage.setItem('userOK', userOK);
  }, [userOK]);

  useEffect(() => {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      return () => {
          audioRef.current.pause();
          if (audioFile) URL.revokeObjectURL(audioFile);
      };
  }, []);

  useEffect(() => {
      if (audioFile) {
          audioRef.current.src = audioFile;
          if (isPlaying) {
              audioRef.current.play().catch(e => console.log("Audio play failed:", e));
          }
      }
  }, [audioFile]);

  useEffect(() => {
      if (isPlaying && audioFile) {
          audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      } else {
          audioRef.current.pause();
      }
  }, [isPlaying, audioFile]);

  const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
          const fileUrl = URL.createObjectURL(file);
          setAudioFile(fileUrl);
          setIsPlaying(true);
      }
  };

  const toggleMusic = () => {
      if (!audioFile) {
          fileInputRef.current.click();
      } else {
          setIsPlaying(!isPlaying);
      }
  };

  useEffect(() => {
      let timer;
      if (screen === 1.0) {
          const start = new Date().setHours(19,0,0,0);
          timer = setInterval(() => {
              const now = Date.now();
              const elapsed = new Date(start + (now % 3300000)); 
              setElapsedTime(elapsed.toLocaleTimeString('ru-RU', { hour12: false }));
          }, 1000);
      } else if (screen === 3.0 || screen === 3.5) {
          let baseHour = 20;
          if (validationAttempts > 0) baseHour += validationAttempts;
          else baseHour += refusalCount;
          if (baseHour > 23) baseHour = 23; 
          setAct3Time(`${baseHour}:00:00`);
      }
      return () => clearInterval(timer);
  }, [screen, validationAttempts, refusalCount]);

  useEffect(() => {
      if ((screen === 3.0 || screen === 3.5) && !showConfirmation && !normViolationMessage && !showGratitudeModal) {
          const distributor = participants.find(p => p.id === activeDistributor);
          if (distributor && distributor.inventory.length === 0) {
              const timeout = setTimeout(() => handleTurnEnd(), 1000); 
              return () => clearTimeout(timeout);
          }
      }
  }, [participants, activeDistributor, screen, showConfirmation, normViolationMessage, showGratitudeModal]);

  const handleKeyboardPress = (keyEvent) => {
    if (keyEvent.type === 'func') {
        if (keyEvent.val === 'delete') setKeyboardInputData([]);
        else if (keyEvent.val === 'backspace') setKeyboardInputData(prev => prev.slice(0, -1));
        else if (keyEvent.val === 'space') {
            const rawText = keyboardInputData.map(i => i.char).join('');
            if (keyboardInputData.length === 0 || rawText.endsWith(' ') || (rawText.match(/ /g) || []).length >= 5) return;
            setKeyboardInputData(prev => [...prev, { char: ' ', baseColor: BASE_COLORS.SPECIAL, isSpace: true }]);
        }
    } else {
        if (keyboardInputData.length >= MAX_KEY_LENGTH) return;
        let charToAdd = keyEvent.val;
        if (keyEvent.isDouble && keyEvent.val === '\u{1D56F}') charToAdd = '\u{1D56F}';
        setKeyboardInputData(prev => [...prev, { char: charToAdd, baseColor: keyEvent.color, isSpace: false }]);
    }
  };

  const isKeyValid = () => {
      if (keyboardInputData.length < 3 || keyboardInputData.length > 70) return false;
      const text = keyboardInputData.map(k => k.char).join('');
      if (text.startsWith(' ')) return false;
      if (text.includes('  ')) return false;
      if (text.endsWith(' ')) return false;
      return true;
  };

  const confirmUserOK = () => {
    if (!isKeyValid()) return;
    const keyString = keyboardInputData.map(k => k.char).join('');
    setUserOK(keyString);
    setIsKeyboardMode(false);
    setScreen(1.0);
  };

  // =============================================================
  // ФУНКЦИЯ ПОЛУЧЕНИЯ СНАПШОТА ТЕКУЩЕГО КОНЦА
  // =============================================================
  const getCurrentKonSnapshot = useCallback(() => {
    const calculateScore = (p) => (p.sent * 2) + (p.received * 1) - (p.burned * 1);
    return {
      timestamp: Date.now(),
      userOK: userOK,
      totalScore: participants.reduce((sum, p) => sum + calculateScore(p), 0),
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        sent: p.sent,
        received: p.received,
        burned: p.burned
      })),
      transactionCount: transactions.length
    };
  }, [participants, transactions, userOK]);

  // =============================================================
  // ОБРАБОТЧИК "НОВЫЙ ДЕНЬ" С СОХРАНЕНИЕМ ИСТОРИИ
  // =============================================================
  const handleNewDay = () => {
    // 1. Сохраняем текущий кон в историю
    const snapshot = getCurrentKonSnapshot();
    setGameHistory(prev => [...prev, snapshot]);

    // 2. Сбрасываем состояние для нового кона
    setParticipants(getInitialParticipants(lang));
    setTransactions([]);
    setActiveOrderingFor(1);
    setCurrentOrderSelections([]);
    setActiveDistributor(1);
    setSelectedSourceUE(null);
    setSelectedReceiverId(null);
    setInformerMessage(null);
    setNormViolationMessage(null);
    setShowConfirmation(false);
    setUnspentUEs(0);
    setValidationAttempts(0);
    setRefusalCount(0);
    setElapsedTime("19:00:00");
    setAct3Time("20:00:00");
    setScreen(1.0);
  };

  const handleResetAll = () => {
      setUserOK(null);
      localStorage.removeItem('userOK');
      setGameHistory([]); // Сброс истории
      setParticipants(getInitialParticipants(lang));
      setTransactions([]);
      setScreen(0.1);
      setIsKeyboardMode(false);
      setKeyboardInputData([]);
  };

  const handleOrderSelection = (type) => {
      setInformerMessage(null); 
      if (currentOrderSelections.includes(type)) setCurrentOrderSelections(currentOrderSelections.filter(t => t !== type));
      else setCurrentOrderSelections([...currentOrderSelections, type]);
  };
  
  const handleOrderPassTurn = () => {
      if (currentOrderSelections.length === 1 && currentOrderSelections[0] === 'ue21') {
          setInformerMessage(t('only21Error', {}, lang));
          setTimeout(() => setInformerMessage(null), 8000);
          return;
      }
      const newParticipants = participants.map(p => p.id === activeOrderingFor ? { ...p, emissionSelections: [...currentOrderSelections] } : p);
      setParticipants(newParticipants);
      setCurrentOrderSelections([]);
      if (activeOrderingFor < 4) setActiveOrderingFor(activeOrderingFor + 1);
      else {
        generateInventories(newParticipants);
        setScreen(2.0); setTimeout(() => setScreen(3.0), 2000);
      }
  };
  
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const getRandomTriads = (count) => ['knowledge', 'practice', 'creativity', 'leisure'].sort(() => 0.5 - Math.random()).slice(0, count);
  const applyScenario = (scenario) => {
    const newParticipants = participants.map(p => {
      if (p.role === 'Target') return p;
      let selections = [];
      switch(scenario.id) {
          case 1: selections = ['knowledge', 'practice', 'creativity', 'leisure', 'ue21']; break;
          case 2: selections = ['knowledge', 'practice', 'creativity', 'leisure']; break;
          case 3: selections = [...getRandomTriads(3), 'ue21']; break;
          case 4: selections = getRandomTriads(3); break;
          case 5: selections = [...getRandomTriads(2), 'ue21']; break;
          case 6: selections = getRandomTriads(2); break;
          case 7: selections = [...getRandomTriads(1), 'ue21']; break;
          default: selections = ['knowledge', 'ue21'];
      }
      return { ...p, emissionSelections: selections };
    });
    generateInventories(newParticipants);
    setScreen(2.0); setTimeout(() => setScreen(3.0), 2000); setShowScenarioMenu(false);
  };
  
  const generateInventories = (currentParticipants) => {
      const newParticipants = currentParticipants.map(p => {
          if (p.role === 'Target') return p;
          const inventory = [];
          p.emissionSelections.forEach(type => {
              if (type === 'ue21') inventory.push({ id: `ue-${p.id}-21-${Math.random()}`, type, triadId: 'T5' });
              else {
                  const triadId = TRIADS_MAP[type];
                  for(let i=0; i<3; i++) inventory.push({ id: `ue-${p.id}-${type}-${i}-${Math.random()}`, type, triadId });
              }
          });
          return { ...p, inventory };
      });
      setParticipants(newParticipants);
  };
  
  const checkAndInitTransaction = (ue, receiverId) => {
      if (ue && receiverId) {
          if (activeDistributor === receiverId) return; 
          setPendingTx({ fromId: activeDistributor, toId: receiverId, ue: ue });
          setShowGratitudeModal(true);
      }
  };
  
  const handleSelectUE = (ue) => {
      if (selectedSourceUE?.id === ue.id) setSelectedSourceUE(null); 
      else {
          setSelectedSourceUE(ue);
          if (selectedReceiverId) checkAndInitTransaction(ue, selectedReceiverId);
      }
  };
  
  const handleSelectReceiver = (receiverId) => {
      if (activeDistributor === receiverId) return;
      if (selectedReceiverId === receiverId) setSelectedReceiverId(null);
      else {
          setSelectedReceiverId(receiverId);
          if (selectedSourceUE) checkAndInitTransaction(selectedSourceUE, receiverId);
      }
  };
  
  const executeTransaction = (txInfo, aiMessage = null) => {
      const { fromId, toId, ue } = txInfo;
      const newParticipants = participants.map(p => {
          if (p.id === fromId) return { ...p, inventory: p.inventory.filter(item => item.id !== ue.id), sent: p.sent + 1 };
          if (p.id === toId) return { ...p, received: p.received + 1 };
          return p;
      });
      setParticipants(newParticipants);
      const newTx = {
          id: Date.now().toString(), time: act3Time,
          from: participants.find(p => p.id === fromId).name,
          to: participants.find(p => p.id === toId).name,
          type: COLORS[ue.type].label, triadId: ue.triadId,
          status: t('statusDone', {}, lang), isMinus: false, message: aiMessage,
          fromId, toId, ueId: ue.id 
      };
      setTransactions(prev => [...prev, newTx]);
      setShowGratitudeModal(false); setPendingTx(null);
      setSelectedSourceUE(null); setSelectedReceiverId(null);
  };
  
  const executeAiTransaction = async () => {
      if (!pendingTx) return;
      setIsGenerating(true);
      const fromP = participants.find(p => p.id === pendingTx.fromId);
      const toP = participants.find(p => p.id === pendingTx.toId);
      const ueLabel = COLORS[pendingTx.ue.type].labelRu;
      const message = await callGeminiAPI(`Благодарность от ${fromP.name} к ${toP.name} за ${ueLabel}`);
      setIsGenerating(false);
      executeTransaction(pendingTx, message);
  };
  
  const detectNormViolations = (currentTxs) => {
      const receiverTriads = {};
      const activeTxs = currentTxs.filter(tx => !tx.isMinus);
      let violationCount = 0;
      activeTxs.forEach(tx => {
          if (tx.triadId === 'T5' || !tx.triadId) return;
          const key = `${tx.toId}-${tx.fromId}-${tx.triadId}`;
          if (!receiverTriads[key]) receiverTriads[key] = 0;
          receiverTriads[key]++;
          if (receiverTriads[key] > 1) violationCount++;
      });
      return { violationCount };
  };
  
  const handleTurnEnd = () => {
      if (activeDistributor < 4) {
          setActiveDistributor(activeDistributor + 1);
          setSelectedSourceUE(null); setSelectedReceiverId(null);
      } else {
          const { violationCount } = detectNormViolations(transactions);
          if (violationCount > 0) { validateNorms(); return; }
          const totalUnspent = participants.filter(p => p.role !== 'Target').reduce((sum, p) => sum + p.inventory.length, 0);
          setUnspentUEs(totalUnspent);
          if (totalUnspent > 0) setShowConfirmation(true);
          else validateNorms(); 
      }
  };
  
  const finishAct3WithBurn = () => {
      setShowConfirmation(false);
      const burnedTxs = [];
      const newParticipants = participants.map(p => {
          if (p.role === 'Target') return p;
          const burnedCount = p.inventory.length;
          if (burnedCount > 0) {
              p.inventory.forEach(item => {
                  burnedTxs.push({
                      id: `burn-${item.id}-${Date.now()}`, time: '00:00:01',
                      from: p.name, to: t('burned', {}, lang), type: COLORS[item.type].label,
                      triadId: item.triadId, status: t('statusBurned', {}, lang), isMinus: true, isBurned: true, message: t('notUsed', {}, lang), fromId: p.id
                  });
              });
          }
          return { ...p, burned: p.burned + burnedCount, inventory: [] };
      });
      const updatedTransactions = [...transactions, ...burnedTxs];
      setTransactions(updatedTransactions);
      setParticipants(newParticipants);
      validateNorms(newParticipants, updatedTransactions);
  };
  
  const handleCancelBurn = () => {
      if (refusalCount >= 2) {
          finishAct3WithBurn();
      } else {
          setRefusalCount(prev => prev + 1);
          setShowConfirmation(false);
          setActiveDistributor(1);
      }
  };
  
  const validateNorms = (currentParticipants = participants, currentTransactions = transactions) => {
      const receiverTriads = {};
      const returnedTxs = [];
      const validTxs = [];
      const activeTxs = currentTransactions.filter(tx => !tx.isMinus);
      activeTxs.forEach(tx => {
          if (tx.triadId === 'T5' || !tx.triadId) { validTxs.push(tx); return; }
          const key = `${tx.toId}-${tx.fromId}-${tx.triadId}`;
          if (!receiverTriads[key]) receiverTriads[key] = 0;
          if (receiverTriads[key] < 1) { receiverTriads[key]++; validTxs.push(tx); } 
          else returnedTxs.push(tx);
      });
      if (returnedTxs.length > 0) {
          if (validationAttempts >= 3) {
               const burnedViolations = returnedTxs.map(tx => ({ ...tx, status: t('statusNormBurn', {}, lang), isMinus: true, isBurned: true }));
               const allTxs = [...validTxs, ...burnedViolations, ...currentTransactions.filter(t=>t.isMinus)];
               setTransactions(allTxs);
               const penalizedParticipants = currentParticipants.map(p => {
                   const penalties = burnedViolations.filter(tx => tx.from === p.name).length;
                   return { ...p, burned: p.burned + penalties };
               });
               setParticipants(penalizedParticipants);
               setScreen(4.0);
          } else {
              const updatedParticipants = currentParticipants.map(p => {
                 const returns = returnedTxs.filter(tx => tx.fromId === p.id);
                 if (returns.length === 0) return p;
                 const returnedItems = returns.map(tx => {
                     const typeKey = Object.keys(COLORS).find(k => COLORS[k].label === tx.type);
                     return { id: tx.ueId, type: typeKey, triadId: tx.triadId };
                 });
                 return { ...p, sent: p.sent - returns.length, inventory: [...p.inventory, ...returnedItems] };
              });
              setParticipants(updatedParticipants);
              setTransactions([...validTxs, ...currentTransactions.filter(t=>t.isMinus)]); 
              setScreen(3.5);
              setValidationAttempts(prev => prev + 1);
              setActiveDistributor(1);
              setNormViolationMessage(`${t('normViolation', {}, lang)} ${returnedTxs.length} У.Е. возвращено.\nПереназначьте.`);
              setTimeout(() => setNormViolationMessage(null), 5000);
          }
      } else setScreen(4.0);
  };
  
  const activeInventory = participants.find(p => p.id === activeDistributor)?.inventory || [];
  const groupedInventory = activeInventory.reduce((acc, item) => { acc[item.type] = (acc[item.type] || 0) + 1; return acc; }, {});
  const getConsoleStyle = () => {
      const base = { position: 'absolute', padding: '1rem', backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid #4b5563', borderRadius: '0.75rem', zIndex: 40 };
      if (activeDistributor === 1) return { ...base, bottom: '1rem', left: '50%', transform: 'translateX(-50%)', width: '80%', maxWidth: '500px' };
      if (activeDistributor === 2) return { ...base, top: '50%', left: '-5rem', transform: 'translateY(-50%) rotate(90deg)', width: '40vh', transformOrigin: 'center' };
      if (activeDistributor === 3) return { ...base, top: '1rem', left: '50%', transform: 'translateX(-50%) rotate(180deg)', width: '80%', maxWidth: '500px' };
      if (activeDistributor === 4) return { ...base, top: '50%', right: '-5rem', transform: 'translateY(-50%) rotate(-90deg)', width: '40vh', transformOrigin: 'center' };
      return base;
  };

  // --- RENDERING ---
  if (screen === 0.1) {
      return (
           <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex flex-col items-center justify-center font-sans p-4 relative overflow-hidden">
              <FloatingQR lang={lang} />
              {/* Аудио контроллер + Переключатель языка */}
              <div className="fixed top-4 left-4 z-50 flex gap-2">
                  <input type="file" accept="audio/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                  <button onClick={toggleMusic} className={`p-2 rounded-full shadow-lg transition-colors ${isPlaying ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`} title={audioFile ? (isPlaying ? t('pause', {}, lang) : t('play', {}, lang)) : t('uploadMusic', {}, lang)}>
                      {!audioFile ? <Upload size={24} /> : (isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />)}
                  </button>
                  <LanguageToggle lang={lang} setLang={setLang} />
              </div>

              <button onClick={() => setShowIntroInfo(true)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full bg-gray-800"><Info size={24}/></button>
              {showIntroInfo && <IntroInfoModal onClose={() => setShowIntroInfo(false)} lang={lang} />}
              
              <FlowerOfLife />
              <h1 className="text-4xl font-bold mt-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{t('title', {}, lang)}</h1>
              <p className="text-sm mt-2 text-gray-400 mb-8">{t('subtitle', {}, lang)}</p>
              
              {!userOK && !isKeyboardMode && (
                  <div className="flex flex-col gap-4 animate-fade-in z-20">
                      <button onClick={() => setIsKeyboardMode(true)} className="px-8 py-3 bg-green-600 rounded-full shadow-lg hover:scale-105 transition-transform font-bold flex items-center justify-center gap-2">
                         <Play size={16}/> {t('createOk', {}, lang)}
                      </button>
                  </div>
              )}

              {isKeyboardMode && (
                  <div className="w-full flex flex-col items-center z-20 animate-fade-in-up">
                        {/* INPUT WINDOW */}
                        <div className={`relative w-full max-w-4xl h-24 sm:h-32 ${KEYBOARD_THEME.inputBg} rounded-2xl border-4 ${keyboardInputData.length > 0 ? 'border-green-500/50' : KEYBOARD_THEME.borderColor} flex items-center justify-center overflow-hidden transition-colors duration-300 mb-6`}>
                            <div className="px-4 sm:px-12 w-full overflow-x-auto flex items-center justify-center h-full scrollbar-hide">
                                <span className={`text-2xl sm:text-3xl font-mono font-bold mr-2 opacity-50 ${KEYBOARD_THEME.textColor}`}>::</span>
                                <div className="flex items-center whitespace-nowrap">
                                    {keyboardInputData.length === 0 && <span className={`text-sm sm:text-lg flex items-center gap-2 animate-pulse ${KEYBOARD_THEME.placeholderColor}`}><Sparkles size={16}/> {t('enterKey', {}, lang)}</span>}
                                    {keyboardInputData.map((item, idx) => {
                                        let dynamicColorClass;
                                        if (item.baseColor === BASE_COLORS.WHITE || item.baseColor === BASE_COLORS.SPECIAL) dynamicColorClass = KEYBOARD_THEME.digitColor;
                                        else if (item.baseColor === BASE_COLORS.RED) dynamicColorClass = KEYBOARD_THEME.redColor;
                                        else if (item.baseColor === BASE_COLORS.BLUE) dynamicColorClass = KEYBOARD_THEME.blueColor;
                                        else if (item.baseColor === BASE_COLORS.GREEN) dynamicColorClass = KEYBOARD_THEME.greenColor;
                                        else dynamicColorClass = KEYBOARD_THEME.textColor;
                                        return <span key={idx} className={`text-2xl sm:text-4xl font-bold font-mono tracking-wide ${dynamicColorClass} drop-shadow-sm`}>{item.isSpace ? <span className="opacity-20">_</span> : item.char}</span>
                                    })}
                                    <div className={`w-0.5 h-6 sm:h-8 bg-slate-400 animate-pulse ml-1`}></div>
                                </div>
                                <span className={`text-2xl sm:text-3xl font-mono font-bold ml-2 opacity-50 ${KEYBOARD_THEME.textColor}`}>::</span>
                            </div>
                        </div>

                        <div className="w-full mb-8 flex justify-center max-w-4xl mx-auto px-4">
                            <VirtualKeyboard onKeyPress={handleKeyboardPress} />
                        </div>
                        
                        <div className="flex gap-4">
                            <button onClick={() => setIsKeyboardMode(false)} className="px-8 py-3 rounded-full font-bold text-gray-400 hover:text-white transition-all">{t('cancel', {}, lang)}</button>
                            <button onClick={confirmUserOK} disabled={!isKeyValid()} className="px-10 py-3 bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-bold text-lg shadow-xl transition-all flex items-center gap-2 hover:scale-105">
                                <Sparkles size={20} /> {keyboardInputData.length > 0 ? t('acceptOk', {}, lang) : t('enterKey', {}, lang)}
                            </button>
                        </div>
                  </div>
              )}

              {userOK && !isKeyboardMode && (
                  <div className="mt-8 text-center animate-fade-in z-20">
                      <div className="text-green-400 mb-2">{t('keyActivated', {}, lang)}</div>
                      <div className="border border-green-500/30 bg-green-900/20 px-6 py-2 rounded font-mono text-lg">{userOK}</div>
                      <button onClick={() => setScreen(1.0)} className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold transition">{t('startDemo', {}, lang)}</button>
                  </div>
              )}
          </div>
      );
  }
  
  if (screen === 1.0) {
      const currentP = participants.find(p => p.id === activeOrderingFor);
      const SCENARIO_DEFINITIONS = getScenarioDefinitions(lang);
      const EMISSION_GROUPS = getEmissionGroups(lang);
      
      return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white p-4 flex flex-col items-center">
              <FloatingQR lang={lang} />
              {/* Аудио контроллер + Переключатель языка */}
              <div className="fixed top-4 left-4 z-50 flex gap-2">
                  <input type="file" accept="audio/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                  <button onClick={toggleMusic} className={`p-2 rounded-full shadow-lg transition-colors ${isPlaying ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}>
                      {!audioFile ? <Upload size={24} /> : (isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />)}
                  </button>
                  <LanguageToggle lang={lang} setLang={setLang} />
              </div>

              {informerMessage && <ErrorInformer message={informerMessage} onClose={() => setInformerMessage(null)} lang={lang} />}
              <div className="w-full max-w-2xl">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                      <div>
                          <h2 className="text-xl font-bold">{t('act1Title', {}, lang)}</h2>
                          <div className="text-xl font-mono">{elapsedTime}</div>
                          {activeOrderingFor === 1 && userOK && <div className="text-xs text-green-400 font-mono mt-1">{t('organization', {}, lang)} уч.1 ({userOK})</div>}
                      </div>
                      <div className="relative">
                          <button onClick={() => setShowScenarioMenu(!showScenarioMenu)} className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded hover:bg-green-500 transition font-bold shadow-lg"><List size={16}/> {t('selectScenario', {}, lang)}</button>
                          {showScenarioMenu && (
                              <div className="absolute top-full right-0 mt-2 w-72 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto">
                                  <div className="p-3 text-xs text-gray-400 border-b border-gray-700 bg-gray-900 font-bold uppercase">{t('chooseScenario', {}, lang)}</div>
                                  {SCENARIO_DEFINITIONS.map(scenario => (
                                      <button key={scenario.id} onClick={() => applyScenario(scenario)} className="w-full text-left px-4 py-3 hover:bg-gray-700 border-b border-gray-700 last:border-0 transition flex flex-col gap-1">
                                          <span className="text-sm font-bold text-white">{scenario.label}</span>
                                          <span className="text-xs text-gray-400">{scenario.desc}</span>
                                      </button>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
                  <div className="mb-6 text-center"><h3 className="text-2xl font-bold">{t('orderFor', {}, lang)} {currentP.name}</h3></div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                        {EMISSION_GROUPS.map(group => (
                            <div key={group.type} className={`p-4 border rounded-xl ${group.color} bg-gray-800/50 flex flex-col items-center`}>
                                <div className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">{group.title}</div>
                                <button 
                                    onClick={() => handleOrderSelection(group.type)} 
                                    className={`w-full py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${currentOrderSelections.includes(group.type) ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                >
                                    {currentOrderSelections.includes(group.type) && <CheckCircle size={16}/>}
                                    {t('choose', {}, lang)}
                                </button>
                            </div>
                        ))}
                  </div>
                  
                  <div className="p-4 border border-purple-500 rounded-xl bg-purple-900/20 mb-6 flex justify-between items-center">
                      <div className="text-sm text-purple-300 font-bold uppercase tracking-wider">{t('securityZone', {}, lang)}</div>
                      <button 
                          onClick={() => handleOrderSelection('ue21')} 
                          className={`py-2 px-6 rounded-lg font-bold transition-all flex items-center gap-2 ${currentOrderSelections.includes('ue21') ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      >
                          {currentOrderSelections.includes('ue21') && <Shield size={16}/>}
                          {t('choose', {}, lang)}
                      </button>
                  </div>

                  <button onClick={handleOrderPassTurn} className="w-full mt-2 bg-blue-600 hover:bg-blue-500 p-4 rounded-xl font-bold text-lg shadow-lg transition-transform hover:scale-[1.01]">{t('passTurn', {}, lang)}</button>
              </div>
          </div>
      );
  }

  if (screen === 2.0 || screen === 3.0 || screen === 3.5) {
      const isAct35 = screen === 3.5;
      return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex flex-col overflow-hidden relative">
              <FloatingQR lang={lang} />
              <div className="fixed top-4 left-4 z-50 flex gap-2">
                  <input type="file" accept="audio/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                  <button onClick={toggleMusic} className={`p-2 rounded-full shadow-lg transition-colors ${isPlaying ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}>
                      {!audioFile ? <Upload size={24} /> : (isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />)}
                  </button>
                  <LanguageToggle lang={lang} setLang={setLang} />
              </div>

              {showConfirmation && <WarningModal unspentCount={unspentUEs} onCancel={handleCancelBurn} onConfirm={finishAct3WithBurn} refusalCount={refusalCount} lang={lang}/>}
              {showGratitudeModal && <GratitudeModal onClose={() => setShowGratitudeModal(false)} txInfo={pendingTx} onExecute={() => executeTransaction({ ...pendingTx }, null)} onAiExecute={executeAiTransaction} isGenerating={isGenerating} lang={lang} />}
              {isAct35 && normViolationMessage && <WarningInformer message={normViolationMessage} onClose={() => setNormViolationMessage(null)} lang={lang} />}
              <div className="p-4 bg-gray-800 z-10 shadow-md text-center absolute top-0 left-0 right-0">
                  <h2 className={`text-xl font-bold ${isAct35 ? 'text-red-400' : 'text-blue-400'}`}>{isAct35 ? t('act35Title', {}, lang) : t('act3Title', {}, lang)}</h2>
                  {activeDistributor === 1 && userOK && <div className="text-xs text-green-400 font-mono mt-1">{t('organizer', {}, lang)}: уч.1 ({userOK})</div>}
                  <div className="absolute right-4 top-4 font-mono text-xl">{act3Time}</div>
              </div>
              <div className="flex-1 relative w-full h-full">
                  <div className="absolute top-20 left-1/2 -translate-x-1/2"><ParticipantNode participant={participants[2]} isActive={activeDistributor === 3} onSelect={() => handleSelectReceiver(3)} isSelected={selectedReceiverId === 3} userOK={userOK}/></div>
                  <div className="absolute top-1/2 left-4 -translate-y-1/2"><ParticipantNode participant={participants[1]} isActive={activeDistributor === 2} onSelect={() => handleSelectReceiver(2)} isSelected={selectedReceiverId === 2} userOK={userOK}/></div>
                  <div className="absolute top-1/2 right-4 -translate-y-1/2"><ParticipantNode participant={participants[3]} isActive={activeDistributor === 4} onSelect={() => handleSelectReceiver(4)} isSelected={selectedReceiverId === 4} userOK={userOK}/></div>
                  <div className="absolute bottom-32 left-1/2 -translate-x-1/2"><ParticipantNode participant={participants[0]} isActive={activeDistributor === 1} onSelect={() => handleSelectReceiver(1)} isSelected={selectedReceiverId === 1} userOK={userOK}/></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><ParticipantNode participant={participants[4]} isCenter onSelect={() => handleSelectReceiver(5)} isSelected={selectedReceiverId === 5} userOK={userOK}/></div>
              </div>
              {(screen === 3.0 || screen === 3.5) && (
                  <div style={getConsoleStyle()} className="flex flex-col transition-all duration-500">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-gray-400 whitespace-nowrap">{participants[activeDistributor-1].name}</span>
                          <span className="text-xs text-gray-500 whitespace-nowrap">{t('inventory', {}, lang)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                          {Object.entries(groupedInventory).map(([type, count]) => {
                                const ueItem = activeInventory.find(i => i.type === type);
                                if (!ueItem) return null;
                                return (
                                    <div key={type} className="relative cursor-pointer" onClick={() => handleSelectUE(ueItem)}>
                                        <UeIcon type={type} />
                                        <span className="absolute -top-2 -right-2 bg-blue-600 text-xs w-5 h-5 rounded-full flex items-center justify-center border border-gray-900">{count}</span>
                                        {selectedSourceUE?.type === type && <div className="absolute inset-0 border-2 border-white rounded-full animate-pulse"></div>}
                                    </div>
                                );
                          })}
                      </div>
                      <button 
                        onClick={handleTurnEnd} 
                        className="mt-4 w-full bg-green-600 py-2 rounded font-bold text-sm"
                      >
                        {activeDistributor < 4 ? t('nextTurn', {}, lang) : t('finishCon', {}, lang)}
                      </button>
        
                      <div className="flex justify-center mt-2 gap-4">
                          <button
                            onClick={() => setScreen(4.0)}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
                          >
                            {t('forceToResults', {}, lang)}
                          </button>
                      </div>
                  </div>
              )}
          </div>
      )
  }
  
  if (screen === 4.0) return <FinalUI participants={participants} transactions={transactions} onNewDay={handleNewDay} onGoToContacts={() => setScreen(7.0)} onGoToRegistry={() => setScreen(6.0)} userOK={userOK} onResetAll={handleResetAll} gameHistory={gameHistory} lang={lang} />;
  
  if (screen === 6.0) return <RegistryUI transactions={transactions} onBack={() => setScreen(4.0)} userOK={userOK} lang={lang} />;
  
  if (screen === 7.0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white p-4 flex flex-col">
            <header className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{t('contactsTitle', {}, lang)}</h2>
                <button onClick={() => setScreen(4.0)} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition"><ArrowLeft /></button>
            </header>
            <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl">
                <h3 className="text-xl font-bold mb-2 text-green-500 font-extrabold">{t('authorName', {}, lang)}</h3>
                <h4 className="text-lg text-blue-300 mb-4">{t('authorRealName', {}, lang)}</h4>
                <p className="text-sm text-gray-300 mb-4">{t('authorDesc', {}, lang)}</p>
                <div className="mb-6 space-y-1 text-sm text-gray-300">
                    <p><span className="font-bold text-gray-100">{t('authorPhone', {}, lang)}</span> +7 999-989-17-19</p>
                    <p><span className="font-bold text-gray-100">{t('authorEmail', {}, lang)}</span> ORDENp@gmail.com</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-t border-gray-700 pt-6">
                    <div className="flex-1">
                        <p className="font-bold text-yellow-400 mb-2 text-lg">{t('fundraising', {}, lang)}</p>
                        <a href="https://messenger.online.sberbank.ru/sl/VvHl8yfbJQhRQugcf" target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline break-all block mb-2">https://messenger.online.sberbank.ru/sl/VvHl8yfbJQhRQugcf</a>
                        <p className="text-xs text-gray-500">{t('donationRange', {}, lang)}</p>
                    </div>
                </div>
            </div>
        </div>
      );
  }
  
  return null;
}
