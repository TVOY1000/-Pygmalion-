/**
 * ПИГМАЛИОН v0.3.2 "Песочница" — CANONICAL EDITION
 * Исправлено согласно аудиту Хранителя карты
 * 
 * Canon v1.0 · Этический стоп-кран активен
 * 
 * ИСПРАВЛЕНИЯ:
 * 1. О.К.: 3-50 символов (было 70)
 * 2. ЧисСлоБукВ: 48 букв (11 общих + 15 EN + 22 RU) + 10 цифр
 * 3. Буквы только в верхнем регистре
 * 4. Эмиссия: свободный выбор триад (не линейно)
 * 5. У.Е. №21: только после активации ≥1 триады
 * 6. Таймер: привязка к 19:56, мин. 4 часа
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield, Zap, Send, Activity, User,
  Clock, Save, RefreshCw, AlertCircle,
  Share2, History, BookOpen, Palette, Coffee, Check,
  Key, Flame, X, Calendar
} from 'lucide-react';

// ==================== КАНОН: ЧисСлоБукВ ====================
// 48 букв: 11 общих + 15 английских + 22 русских
// 10 цифр: 0-9
// Только верхний регистр

const CHISLOBUKV_CONFIG = {
  // Общие буквы (кириллица и латиница совпадают по начертанию)
  common: ['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'Х'],
  // Только русские (22 буквы)
  russian: ['Б', 'Г', 'Д', 'Ж', 'З', 'И', 'Й', 'Л', 'П', 'У', 'Ф', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я', 'Ё'],
  // Только английские (15 букв)
  english: ['B', 'D', 'F', 'G', 'H', 'I', 'J', 'L', 'P', 'Q', 'R', 'U', 'W', 'Y', 'Z'],
  // Цифры (0-9)
  numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  // Символы
  symbols: ['_', '-', '.', '@', '#', '№']
};

// ==================== КАНОН: Эмиссия ====================
const CANON_EMISSIONS = [3, 4, 6, 7, 9, 10, 12, 13];

// Триады (4 основные + У.Е. №21)
const TRIADS = {
  T1: { id: 'T1', name: 'Знания', color: 'bg-red-500', text: 'text-red-500', icon: BookOpen },
  T2: { id: 'T2', name: 'Практики', color: 'bg-yellow-400', text: 'text-yellow-400', icon: Activity },
  T3: { id: 'T3', name: 'Творчество', color: 'bg-green-500', text: 'text-green-500', icon: Palette },
  T4: { id: 'T4', name: 'Досуг/ЗОЖ', color: 'bg-blue-500', text: 'text-blue-500', icon: Coffee },
  T21: { id: 'T21', name: 'У.Е. №21 (Воля/Бартер)', color: 'bg-purple-500', text: 'text-purple-500', icon: Shield }
};

// ==================== КАНОН: Таймер ====================
// Точка отсчёта: 19:56 (начало периода заказа на завтра)
// Минимальный срок: 4 часа (если открыты в конце периода)
// Максимальный срок: 28 часов

const BURN_REFERENCE_HOUR = 19;
const BURN_REFERENCE_MINUTE = 56;
const MIN_BURN_HOURS = 4;
const MAX_BURN_HOURS = 28;

// ==================== i18n ====================
const TRANSLATIONS = {
  ru: {
    threshold_title: "ПОРОГ СИСТЕМЫ",
    threshold_subtitle: "Рождение О.К. через «ЧисСлоБукВ»",
    threshold_ethics: "⚠️ Вы входите в пространство нематериальной ценности.\nВаш О.К. — это акт самоопределения, а не регистрация.\nДлина: от 3 до 50 символов.",
    ok_label: "Ваш Открытый Ключик (О.К.)",
    ok_confirm: "УЧРЕДИТЬ ПРИСУТСТВИЕ",
    kb_numbers: "Цифры:",
    kb_common: "Общие (RU+EN):",
    kb_russian: "Только RU:",
    kb_english: "Только EN:",
    kb_symbols: "Символы:",
    kb_clear: "✕ Очистить",
    kb_backspace: "← Стереть",
    threshold_info: "О.К. сохраняется только в вашем браузере.\nЭто не пароль — это ваш «числовой след» в системе.",
    
    act1_title: "Акт 1: ПЛАН (Эмиссия)",
    act2_title: "Акт 2: ТОК (Передача)",
    act3_title: "Акт 3: ОБЛИК (Отражение)",
    act4_title: "Акт 4: ВЕС (Итоги)",
    
    select_triads: "Выберите области (Триады):",
    triad_t1: "Знания",
    triad_t2: "Практики",
    triad_t3: "Творчество",
    triad_t4: "Досуг/ЗОЖ",
    triad_t21: "У.Е. №21 (Воля/Бартер)",
    triad_t21_locked: "Требуется хотя бы 1 триада",
    
    order_btn: "Заказать",
    ue_burn_warn: "Сгорают через 28 часов",
    burn_timer: "Время до сгорания",
    
    send_btn: "Передать Благодарность",
    reputation_score: "Репутационный Вес",
    history_label: "Реестр ro.DAG",
    empty_history: "Транзакций пока нет",
    
    total_received: "Получено (У.М.)",
    total_sent: "Отдано (У.Е.)",
    total_burned: "Сгорело",
    archive_status: "Публичный архив: Активен",
    
    formula_note: "Формула веса: (Отдано × 2) + (Принято × 1) − (Сгорело × 1)"
  },
  en: {
    threshold_title: "SYSTEM THRESHOLD",
    threshold_subtitle: "O.K. Creation via «ChisSloBukV»",
    threshold_ethics: "⚠️ You are entering a space of non-material value.\nYour O.K. is an act of self-determination, not registration.\nLength: 3 to 50 characters.",
    ok_label: "Your Open Key (O.K.)",
    ok_confirm: "ESTABLISH PRESENCE",
    kb_numbers: "Numbers:",
    kb_common: "Common (RU+EN):",
    kb_russian: "RU Only:",
    kb_english: "EN Only:",
    kb_symbols: "Symbols:",
    kb_clear: "✕ Clear",
    kb_backspace: "← Backspace",
    threshold_info: "O.K. is stored only in your browser.\nThis is not a password — it's your «numeric trace» in the system.",
    
    act1_title: "Act 1: PLAN (Emission)",
    act2_title: "Act 2: FLOW (Transfer)",
    act3_title: "Act 3: IMAGE (Reflection)",
    act4_title: "Act 4: WEIGHT (Results)",
    
    select_triads: "Select Domains (Triads):",
    triad_t1: "Knowledge",
    triad_t2: "Practice",
    triad_t3: "Creativity",
    triad_t4: "Leisure/Health",
    triad_t21: "U.E. №21 (Will/Barter)",
    triad_t21_locked: "Requires at least 1 triad",
    
    order_btn: "Order",
    ue_burn_warn: "Expires in 28 hours",
    burn_timer: "Time to burn",
    
    send_btn: "Send Gratitude",
    reputation_score: "Reputation Weight",
    history_label: "ro.DAG Ledger",
    empty_history: "No transactions yet",
    
    total_received: "Received (U.M.)",
    total_sent: "Sent (U.U.)",
    total_burned: "Burned",
    archive_status: "Public Archive: Active",
    
    formula_note: "Weight formula: (Given × 2) + (Received × 1) − (Burned × 1)"
  }
};

// ==================== ПОРОГ: ЧисСлоБукВ ====================

const ThresholdScreen = ({ onAccessGranted }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [lang, setLang] = useState('ru');
  
  const t = (key) => TRANSLATIONS[lang][key];

  const OK_MIN_LENGTH = 3;
  const OK_MAX_LENGTH = 50; // ИСПРАВЛЕНО: было 70

  const handleKeyPress = (char) => {
    if (inputKey.length >= OK_MAX_LENGTH) return;
    setInputKey(prev => prev + char);
    setError('');
  };

  const handleBackspace = () => {
    setInputKey(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setInputKey('');
    setError('');
  };

  const handleSubmit = () => {
    if (inputKey.length < OK_MIN_LENGTH) {
      setError(`О.К. должен содержать не менее ${OK_MIN_LENGTH} символов.`);
      return;
    }
    onAccessGranted(inputKey);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-mono text-slate-200">
      <div className="max-w-3xl w-full space-y-6">
        
        {/* Заголовок */}
        <div className="text-center space-y-3">
          <Shield className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
          <h1 className="text-3xl font-bold tracking-widest text-emerald-400">{t('threshold_title')}</h1>
          <p className="text-slate-400">{t('threshold_subtitle')}</p>
        </div>

        {/* Этическое предупреждение */}
        <div className="bg-orange-900/20 border border-orange-700/50 p-4 rounded-xl">
          <p className="text-orange-300 text-sm whitespace-pre-line text-center">{t('threshold_ethics')}</p>
        </div>

        {/* Отображение О.К. */}
        <div className="bg-slate-900 border border-emerald-900/50 p-6 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <div className="mb-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
              <span>{t('ok_label')}</span>
              <span className={inputKey.length >= OK_MIN_LENGTH ? 'text-emerald-400' : 'text-orange-400'}>
                {inputKey.length} / {OK_MAX_LENGTH}
              </span>
            </div>
            <div className={`w-full bg-slate-950 border-2 p-4 rounded-xl min-h-[64px] text-xl tracking-widest break-all flex items-center justify-between ${
              inputKey.length >= OK_MIN_LENGTH ? 'border-emerald-600 text-emerald-300' : 'border-slate-700 text-slate-400'
            }`}>
              <span>{inputKey || <span className="text-slate-700 animate-pulse">...</span>}</span>
              {inputKey.length > 0 && (
                <button onClick={handleBackspace} className="ml-4 text-slate-500 hover:text-red-400 p-2">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          {/* Клавиатура ЧисСлоБукВ */}
          <div className="space-y-3">
            
            {/* Цифры */}
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-2">{t('kb_numbers')}</span>
              <div className="grid grid-cols-10 gap-1.5">
                {CHISLOBUKV_CONFIG.numbers.map(n => (
                  <button key={n} onClick={() => handleKeyPress(n)} 
                    className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-lg font-bold text-emerald-100 transition-colors text-sm">
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Общие буквы */}
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-2">{t('kb_common')}</span>
              <div className="grid grid-cols-11 gap-1.5">
                {CHISLOBUKV_CONFIG.common.map(l => (
                  <button key={l} onClick={() => handleKeyPress(l)} 
                    className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-sm font-medium transition-colors">
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Только русские */}
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-2">{t('kb_russian')}</span>
              <div className="grid grid-cols-11 gap-1.5">
                {CHISLOBUKV_CONFIG.russian.map(l => (
                  <button key={l} onClick={() => handleKeyPress(l)} 
                    className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-sm font-medium transition-colors">
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Только английские */}
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-2">{t('kb_english')}</span>
              <div className="grid grid-cols-8 gap-1.5">
                {CHISLOBUKV_CONFIG.english.map(l => (
                  <button key={l} onClick={() => handleKeyPress(l)} 
                    className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-sm font-medium transition-colors">
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Символы */}
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-2">{t('kb_symbols')}</span>
              <div className="grid grid-cols-6 gap-1.5">
                {CHISLOBUKV_CONFIG.symbols.map(s => (
                  <button key={s} onClick={() => handleKeyPress(s)} 
                    className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-sm font-medium transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Управление */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleClear} 
                className="flex-1 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 py-3 rounded-xl font-bold transition-colors text-red-300">
                {t('kb_clear')}
              </button>
              <button onClick={handleBackspace} 
                className="flex-1 bg-orange-900/30 hover:bg-orange-900/50 border border-orange-700/50 py-3 rounded-xl font-bold transition-colors text-orange-300">
                {t('kb_backspace')}
              </button>
            </div>
          </div>

          {/* Кнопка подтверждения */}
          <button
            onClick={handleSubmit}
            disabled={inputKey.length < OK_MIN_LENGTH}
            className={`w-full mt-6 py-4 rounded-xl font-bold tracking-widest transition-all flex items-center justify-center gap-2 ${
              inputKey.length >= OK_MIN_LENGTH 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Key className="w-5 h-5" />
            {t('ok_confirm')}
          </button>
        </div>

        {/* Информация */}
        <div className="text-center text-xs text-slate-500 whitespace-pre-line">
          {t('threshold_info')}
        </div>

      </div>
    </div>
  );
};

// ==================== КОМБАЙН: про.1.ПЛАН ====================

const CombineScreen = ({ openKey, onLogout }) => {
  const [lang, setLang] = useState('ru');
  const t = (key) => TRANSLATIONS[lang][key];

  // Состояние системы
  const [emitted, setEmitted] = useState(false);
  const [selectedTriads, setSelectedTriads] = useState([]);
  const [selectedExtra, setSelectedExtra] = useState(false);
  const [activeUnits, setActiveUnits] = useState([]);
  const [ueBalance, setUeBalance] = useState(0);
  const [burnTime, setBurnTime] = useState(null);
  
  // Восстановление из localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`pygmalion_state_${openKey}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (new Date().getTime() - parsed.timestamp < MAX_BURN_HOURS * 60 * 60 * 1000) {
        setEmitted(parsed.emitted);
        setSelectedTriads(parsed.selectedTriads);
        setSelectedExtra(parsed.selectedExtra);
        setActiveUnits(parsed.activeUnits);
        setUeBalance(parsed.ueBalance);
        setBurnTime(parsed.burnTime);
      }
    }
  }, [openKey]);

  // Сохранение состояния
  const saveState = (newState) => {
    localStorage.setItem(`pygmalion_state_${openKey}`, JSON.stringify({
      ...newState,
      timestamp: new Date().getTime()
    }));
  };

  const updateStateAndSave = (updates) => {
    const newState = { emitted, selectedTriads, selectedExtra, activeUnits, ueBalance, burnTime, ...updates };
    setEmitted(newState.emitted);
    setSelectedTriads(newState.selectedTriads);
    setSelectedExtra(newState.selectedExtra);
    setActiveUnits(newState.activeUnits);
    setUeBalance(newState.ueBalance);
    setBurnTime(newState.burnTime);
    saveState(newState);
  };

  // Toggle триады (СВОБОДНЫЙ ВЫБОР - не линейно!)
  const toggleTriad = (id) => {
    setSelectedTriads(prev => {
      const newTriads = prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id];
      // Если отключили все триады, отключаем У.Е. №21
      if (newTriads.length === 0 && selectedExtra) {
        setSelectedExtra(false);
      }
      return newTriads;
    });
  };

  // Toggle У.Е. №21 (ТОЛЬКО после ≥1 триады)
  const toggleExtra = () => {
    if (selectedTriads.length === 0) return;
    setSelectedExtra(prev => !prev);
  };

  // Расчёт количества У.Е.
  const pendingAmount = useMemo(() => {
    return (selectedTriads.length * 3) + (selectedExtra ? 1 : 0);
  }, [selectedTriads, selectedExtra]);

  // Эмиссия У.Е.
  const handleEmission = () => {
    if (pendingAmount === 0) return;

    let units = [];
    let idCounter = 1;

    const addUnits = (triad, count) => {
      for(let i = 0; i < count; i++) {
        units.push({ id: `U${idCounter++}`, triadId: triad.id, ...triad, isUsed: false });
      }
    };

    // Добавляем по 3 У.Е. за каждую выбранную триаду
    selectedTriads.forEach(triadId => {
      addUnits(TRIADS[triadId], 3);
    });

    // Добавляем У.Е. №21 если выбрана
    if (selectedExtra) {
      addUnits(TRIADS.T21, 1);
    }

    // Вычисляем время сгорания (привязка к 19:56)
    const now = new Date();
    const burnRef = new Date();
    burnRef.setHours(BURN_REFERENCE_HOUR, BURN_REFERENCE_MINUTE, 0, 0);
    
    // Если уже после 19:56, следующий период завтра
    if (now > burnRef) {
      burnRef.setDate(burnRef.getDate() + 1);
    }
    
    // Минимальный срок 4 часа
    const minBurnTime = new Date(now.getTime() + MIN_BURN_HOURS * 60 * 60 * 1000);
    const actualBurnTime = burnRef > minBurnTime ? burnRef : minBurnTime;

    updateStateAndSave({ 
      emitted: true, 
      activeUnits: units, 
      ueBalance: pendingAmount,
      burnTime: actualBurnTime.getTime()
    });
  };

  // Таймер обратного отсчёта
  const [timeRemaining, setTimeRemaining] = useState('');
  
  useEffect(() => {
    if (!burnTime) return;
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = burnTime - now;
      
      if (diff <= 0) {
        // Сгорание
        const burned = ueBalance;
        updateStateAndSave({ ueBalance: 0, burnTime: null });
        setTimeRemaining('СГОРЕЛО');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [burnTime, ueBalance]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 lg:p-8">

      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between mb-8 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="bg-emerald-900/30 p-3 rounded-xl">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-slate-100">про.1.ПЛАН</h1>
            <p className="text-sm text-slate-400">Личный комбайн времени</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Switch */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button onClick={() => setLang('ru')} className={`px-3 py-1 rounded text-xs font-bold transition ${lang === 'ru' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}>RU</button>
            <button onClick={() => setLang('en')} className={`px-3 py-1 rounded text-xs font-bold transition ${lang === 'en' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}>EN</button>
          </div>

          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 font-mono text-emerald-400 flex items-center gap-2">
            <Key className="w-4 h-4 opacity-50" />
            <span className="truncate max-w-[150px]" title={openKey}>{openKey}</span>
          </div>
          <button onClick={onLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Выйти">
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* LEFT: Эмиссия */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Панель эмиссии */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              {t('act1_title')}
            </h2>

            {!emitted ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">{t('select_triads')}</p>

                {/* Выбор триад (СВОБОДНЫЙ, не линейный!) */}
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(TRIADS).filter(triad => triad.id !== 'T21').map(triad => {
                    const isSelected = selectedTriads.includes(triad.id);
                    const Icon = triad.icon;
                    return (
                      <button
                        key={triad.id}
                        onClick={() => toggleTriad(triad.id)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                          isSelected 
                            ? `${triad.bg} ${triad.border} shadow-[0_0_15px_rgba(0,0,0,0.2)]` 
                            : 'bg-slate-800 border-slate-700 hover:bg-slate-700/80'
                        }`}
                      >
                        <Icon size={20} className={isSelected ? triad.text : 'text-slate-500'} />
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                          {t(`triad_${triad.id.toLowerCase()}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* У.Е. №21 (ТОЛЬКО после ≥1 триады) */}
                <div className="pt-2">
                  <button
                    onClick={toggleExtra}
                    disabled={selectedTriads.length === 0}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                      selectedTriads.length === 0 
                        ? 'opacity-50 cursor-not-allowed bg-slate-800/50 border-slate-800' 
                        : selectedExtra 
                          ? 'bg-purple-500/10 border-purple-500/50' 
                          : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield size={16} className={selectedExtra ? 'text-purple-400' : 'text-slate-500'} />
                      <span className={`text-xs font-bold ${selectedExtra ? 'text-purple-300' : 'text-slate-400'}`}>
                        {t('triad_t21')}
                      </span>
                    </div>
                    {selectedExtra ? <Check size={16} className="text-purple-400"/> : <span className="text-[10px] text-slate-500">{t('triad_t21_locked')}</span>}
                  </button>
                </div>

                {/* Итого и кнопка */}
                <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-3xl font-black text-white">{pendingAmount}</span>
                    <span className="text-sm font-normal text-slate-500 ml-2">У.Е.</span>
                  </div>
                  <button
                    onClick={handleEmission}
                    disabled={pendingAmount === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 px-6 py-2 rounded-lg font-bold text-sm transition-all"
                  >
                    {t('order_btn')} {pendingAmount > 0 && pendingAmount}
                  </button>
                </div>
              </div>
            ) : (
              // После эмиссии
              <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-6 h-6" />
                  <p className="font-bold">{t('order_btn')} произведён</p>
                </div>
                <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg">
                  <span className="text-slate-400 text-sm">{t('burn_timer')}:</span>
                  <span className={`font-mono font-bold ${timeRemaining === 'СГОРЕЛО' ? 'text-red-500' : 'text-orange-400'}`}>
                    {timeRemaining}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{t('ue_burn_warn')}</p>
              </div>
            )}
          </div>

          {/* Активные У.Е. */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[200px]">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Активные У.Е. ({activeUnits.filter(u => !u.isUsed).length})
            </h2>
            
            {emitted ? (
              activeUnits.filter(u => !u.isUsed).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activeUnits.filter(u => !u.isUsed).map(unit => (
                    <div key={unit.id} className={`${unit.color} w-10 h-10 rounded-full flex items-center justify-center shadow-lg`}>
                      <unit.icon className="w-4 h-4 text-white" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Все У.Е. распределены</p>
              )
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Закажите У.Е. для начала</p>
            )}
          </div>

        </div>

        {/* RIGHT: Реестр и Итоги */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Акт 4: ВЕС */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-6 text-purple-400">{t('act4_title')}</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 uppercase">{t('total_sent')}</p>
                <p className="text-2xl font-black text-blue-400">0</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 uppercase">{t('total_received')}</p>
                <p className="text-2xl font-black text-emerald-400">0</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 uppercase">{t('total_burned')}</p>
                <p className="text-2xl font-black text-red-400">0</p>
              </div>
            </div>

            <div className="p-4 bg-blue-950/30 border border-blue-900/30 rounded-xl">
              <p className="text-xs text-blue-300/80 italic">{t('formula_note')}</p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

// ==================== MAIN APP ====================

export default function App() {
  const [openKey, setOpenKey] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const savedKey = localStorage.getItem('pygmalion_ok');
    if (savedKey) {
      setOpenKey(savedKey);
    }
    setIsInitializing(false);
  }, []);

  const handleAccessGranted = (key) => {
    localStorage.setItem('pygmalion_ok', key);
    setOpenKey(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('pygmalion_ok');
    setOpenKey(null);
  };

  if (isInitializing) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 animate-pulse font-mono">Инициализация среды...</div>;
  }

  return (
    <>
      {!openKey ? (
        <ThresholdScreen onAccessGranted={handleAccessGranted} />
      ) : (
        <CombineScreen openKey={openKey} onLogout={handleLogout} />
      )}
    </>
  );
};
