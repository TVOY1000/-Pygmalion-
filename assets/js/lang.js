const supportedLangs = ['en', 'ru'];

function getLang() {
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang');
  const storedLang = localStorage.getItem('lang');

  if (supportedLangs.includes(urlLang)) {
    localStorage.setItem('lang', urlLang);
    return urlLang;
  }

  if (supportedLangs.includes(storedLang)) {
    return storedLang;
  }

  return 'en';
}

let currentLang = getLang();

async function loadTranslations() {
  const response = await fetch(`../assets/i18n/${currentLang}.json`);
  const dict = await response.json();

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const keys = el.dataset.i18n.split('.');
    let value = dict;
    keys.forEach(k => value = value?.[k]);
    if (value) el.textContent = value;
  });
}

document.querySelectorAll('[data-set-lang]').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.setLang;
    localStorage.setItem('lang', lang);

    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.location.href = url.toString();
  });
});

loadTranslations();
