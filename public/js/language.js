const translations = {
  en: { addProduct: 'Add Product', price: 'Price', quantity: 'Quantity' },
  hi: { addProduct: 'उत्पाद जोड़ें', price: 'कीमत', quantity: 'मात्रा' }
};

function applyLanguage(lang) {
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) el.textContent = translations[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang][key]) el.setAttribute('placeholder', translations[lang][key]);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('languageSelect');
  if (!select) return;
  const saved = localStorage.getItem('lang') || 'en';
  select.value = saved;
  applyLanguage(saved);
  select.addEventListener('change', (e) => applyLanguage(e.target.value));
});







