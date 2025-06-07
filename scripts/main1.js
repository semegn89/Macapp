// ==== CABINET_MODULES и динамический импорт ====
const CABINET_MODULES = {
// === Валидация формы регистрации ===

  payments: "./payments.js",
  stats: "./stats.js",
  documents: "./documents.js",
  rates: "./rates.js",
  templates: "./templates.js",
  adminPanel: "./adminPanel.js",
  userCabinet: "./First.js",
  userChat: "./userChat.js",
};

async function importCabinetPage(pageKey) {
  const path = CABINET_MODULES[pageKey];
  if (!path) return null;
  try {
    return await import(path);
  } catch (err) {
    console.warn(`Не удалось загрузить модуль ${pageKey}:`, err);
    return null;
  }
}

async function tryRenderRealPage(pageKey) {
  const mod = await importCabinetPage(pageKey);
  if (!mod) return false;
  console.log('🔁 Загружаем модуль:', pageKey, mod);
  const fnName = pageKey === 'adminPanel'
  ? 'renderAdminPanel'
  : 'render' + pageKey[0].toUpperCase() + pageKey.slice(1) + 'Page';
  if (typeof mod[fnName] === 'function') {
    await mod[fnName]();
    return true;
  }
  return false;
}

// === ДОБАВЬ В loadPage такую логику ===
window.loadPage = async function (pageKey) {
  let ok = false;
  // 1. Попытаться загрузить через import (если используешь динамический импорт)
  if (typeof importCabinetPage === 'function') {
    const mod = await importCabinetPage(pageKey);
    const fnName = pageKey === 'adminPanel'
      ? 'renderAdminPanel'
      : 'render' + pageKey[0].toUpperCase() + pageKey.slice(1) + 'Page';
    if (mod && typeof mod[fnName] === 'function') {
      await mod[fnName]();
      ok = true;
    }
    // FALLBACK на window, если не сработало
    if (!ok && typeof window[fnName] === 'function') {
      await window[fnName]();
      ok = true;
    }
  } else {
    // Если динамического импорта нет — всегда ищи на window
    const fnName = pageKey === 'adminPanel'
      ? 'renderAdminPanel'
      : 'render' + pageKey[0].toUpperCase() + pageKey.slice(1) + 'Page';
    if (typeof window[fnName] === 'function') {
      await window[fnName]();
      ok = true;
    }
  }

  if (!ok) {
    console.warn(`⚠️ Модуль ${pageKey} не отрендерился`);
  }
};

console.log('🔥 main1.js ЗАПУЩЕН');

// (dev-автовход удалён)

// ===== renderErrorPage =====
function renderErrorPage(err) {
  document.body.innerHTML = `
    <div class="error-container" style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:1rem;font-family:Inter,sans-serif;">
      <h1 style="font-size:2rem;color:#EF4444;">Произошла ошибка</h1>
      <p>${err.message}</p>
      <button style="padding:.75rem 1.5rem;border:none;border-radius:6px;background:#2563EB;color:#fff;font-weight:600;cursor:pointer;" onclick="location.reload()">Перезагрузить страницу</button>
    </div>`;
}

// ===== Курсы валют =====
// Курсы валют и выбранная дата теперь получаются через API
async function getRatesSelectedDate() {
  // Запрос к API для получения выбранной даты
  const resp = await fetch('/api/rates/selected-date');
  if (!resp.ok) return new Date().toISOString().slice(0, 10);
  const data = await resp.json();
  return data.selectedDate || new Date().toISOString().slice(0, 10);
}
async function setRatesSelectedDate(date) {
  await fetch('/api/rates/selected-date', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date })
  });
}
async function getRatesByDate(date) {
  const resp = await fetch(`/api/rates?date=${encodeURIComponent(date)}`);
  if (!resp.ok) return {};
  return await resp.json();
}
async function setRatesByDate(date, ratesObj) {
  await fetch('/api/rates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, rates: ratesObj })
  });
}

// ===== Рендер страницы курсов валют =====
window.renderRatesPage = async function() {
  const details = document.querySelector('.details');
  // Получаем информацию о пользователе через API
  let user = null;
  try {
    const resp = await fetch('/api/auth/me');
    if (resp.ok) user = await resp.json();
  } catch (e) {}
  const isAdmin = user && user.role && user.role.toLowerCase() === 'admin';
  // Валюты по умолчанию
  const currencyList = ['USD', 'EUR', 'CNY', 'GBP', 'AED', 'RUB'];

  async function rerender() {
    let selectedDate = await getRatesSelectedDate();
    let rates = await getRatesByDate(selectedDate);
    let dateSelector = '';
    if (isAdmin) {
      dateSelector = `<input type="date" id="ratesDateInput" value="${selectedDate}" style="font-size:1.1rem;padding:4px 8px;border-radius:6px;border:1px solid #c5dcf7;margin-left:10px;">`;
    } else {
      dateSelector = `<span style="margin-left:10px;font-size:1.1rem;color:#0057ff;">${selectedDate}</span>`;
    }
    let ratesRows = currencyList.map(cur => {
      const val = rates[cur] !== undefined ? rates[cur] : '';
      if (isAdmin) {
        return `<tr>
          <td style="padding:8px 14px;">${cur}</td>
          <td style="padding:8px 14px;">
            <input type="number" step="0.01" min="0" class="rate-input" data-cur="${cur}" value="${val}" style="width:90px;padding:5px 8px;border-radius:6px;border:1px solid #c5dcf7;">
          </td>
        </tr>`;
      } else {
        return `<tr>
          <td style="padding:8px 14px;">${cur}</td>
          <td style="padding:8px 14px;">
            <span>${val !== '' ? val : '-'}</span>
          </td>
        </tr>`;
      }
    }).join('');
    let saveBtn = isAdmin
      ? `<button id="saveRatesBtn" class="button" style="margin-top:14px;">Сохранить курсы</button>`
      : '';
    details.innerHTML = `
      <div style="margin-bottom:18px;text-align:center;">
        <h2 style="font-size:1.5rem;font-weight:700;">Курсы валют на ${selectedDate}</h2>
        <div style="margin-bottom:18px;">
          ${isAdmin ? 'Выберите дату:' : 'Дата установлена администратором:'}
          ${dateSelector}
        </div>
      </div>
      <div style="display:flex;justify-content:center;">
        <table style="border-collapse:separate;border-spacing:0 7px;background:#f6faff;padding:18px 28px;border-radius:15px;">
          <thead>
            <tr style="font-weight:700;">
              <th style="padding:8px 14px;">Валюта</th>
              <th style="padding:8px 14px;">Курс</th>
            </tr>
          </thead>
          <tbody>
            ${ratesRows}
          </tbody>
        </table>
      </div>
      <div style="text-align:center;">
        ${saveBtn}
      </div>
      <div style="text-align:center;color:#aaa;font-size:0.96rem;margin-top:18px;">
        Курсы валют устанавливаются администратором и доступны всем пользователям.
      </div>
    `;
    // Слушатели (только для админа)
    if (isAdmin) {
      details.querySelector('#ratesDateInput').addEventListener('change', async e => {
        await setRatesSelectedDate(e.target.value);
        await rerender();
      });
      details.querySelector('#saveRatesBtn').onclick = async () => {
        const newRates = {};
        details.querySelectorAll('.rate-input').forEach(inp => {
          const cur = inp.dataset.cur;
          const val = inp.value;
          if (val !== '') newRates[cur] = parseFloat(val);
        });
        await setRatesByDate(selectedDate, newRates);
        showToast('Курсы валют сохранены!', 'success');
        await rerender();
      };
    }
  }
  rerender();
};

// ===== hidePreloader =====
function hidePreloader() {
  const preloader = document.querySelector('.preloader');
  if (!preloader) return;

  preloader.classList.add('fade-out');

  preloader.addEventListener('transitionend', () => preloader.remove(), { once: true });

  setTimeout(() => {
    if (document.body.contains(preloader)) preloader.remove();
  }, 1000);
}
// ===== initCounters =====
function initCounters() {
  const counters = document.querySelectorAll(".counter");
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          observer.unobserve(e.target);
        }
      }),
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

function animateCounter(el) {
  const target = +el.getAttribute("data-count");
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      clearInterval(timer);
      current = target;
    }
    el.textContent = Math.floor(current).toString();
  }, 16);
}
// ===== initThemeSwitcher =====
function initThemeSwitcher() {
  const btn = document.getElementById("toggleDarkMode");
  if (!btn) return;

  const icon = btn.querySelector("i");

  const updateIcon = () => {
    if (icon) icon.className = document.body.classList.contains('dark-mode')
      ? "fas fa-sun" : "fas fa-moon";
  };

  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    updateIcon();
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
  });

  // При загрузке страницы — инициализируем тему
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }

  updateIcon();
}

// ===== initMobileMenu =====
function initMobileMenu() {
  const btn = document.getElementById("hamburgerBtn");
  const nav = document.getElementById("mobileNav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    btn.classList.toggle("active");
    nav.classList.toggle("active");
    const isOpen = nav.classList.contains("active");
    if (isOpen) {
      nav.removeAttribute("hidden");
      document.body.classList.add("no-scroll");
    } else {
      nav.setAttribute("hidden", "");
      document.body.classList.remove("no-scroll");
    }
  });
}

// ===== toggleLoggedInUI =====
function toggleLoggedInUI(loggedIn) {
  document.querySelectorAll('.auth-link').forEach(link => {
    const isLogout = link.id?.toLowerCase().includes('logout');
    link.style.display = loggedIn ? (isLogout ? 'block' : 'none') : (!isLogout ? 'block' : 'none');
  });
}

// ===== showToast =====
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.getElementById('toastContainer')?.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ====== ЛОГИН через API ======
window.handleLoginForm = async function (e) {
  e.preventDefault();
  const email = document.getElementById('modalEmail')?.value.trim();
  const password = document.getElementById('modalPassword')?.value.trim();
  try {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!resp.ok) {
      showToast('Ошибка входа!', 'error');
      return;
    }
    // предполагается, что сервер выставляет cookie/session
    document.body.classList.add('logged-in');
    closeModal(document.getElementById('loginModal'));
    showToast('🎉 Вход выполнен', 'success');
    window.dispatchEvent(new CustomEvent('authChanged'));
  } catch (e) {
    showToast('Ошибка входа!', 'error');
  }
};

// ===== updateAuthUI =====
async function updateAuthUI() {
  let user = null;
  try {
    const resp = await fetch('/api/auth/me');
    if (resp.ok) user = await resp.json();
  } catch (e) {}
  toggleLoggedInUI(!!user);
  if (user?.role === 'admin') {
    document.querySelector('[data-page="adminPanel"]')?.classList.remove('hidden');
    window.loadPage?.('adminPanel');
  } else {
    document.querySelector('[data-page="adminPanel"]')?.classList.add('hidden');
  }
}

window.addEventListener('authChanged', () => {
  updateAuthUI?.();
});
  

// dev autologin/autoadmin удалён


// Показывает основной кабинет (отлаженная версия)
async function renderMainSiteContent() {
  console.log('🧩 renderMainSiteContent ВЫЗВАН (внутри)');
  try {
    const content = document.getElementById('content');
    if (content) {
      content.style.display = '';
      console.log('✅ content включен');
    }

    const cabinetCss = document.getElementById('cabinetCss');
    if (cabinetCss) {
      cabinetCss.removeAttribute('disabled');
      console.log('✅ cabinetCss включен');
    }

    document.querySelector('footer.footer')?.style.setProperty('display', 'none');
    hidePreloader();

    let user = null;
    try {
      const resp = await fetch('/api/auth/me');
      if (resp.ok) user = await resp.json();
    } catch (e) {}
    if (user?.role === 'admin') {
      window.loadPage?.('adminPanel');
    } else {
      window.loadPage?.('userCabinet');
    }
  } catch (err) {
    console.error('❌ Ошибка в renderMainSiteContent:', err);
  }
}

// Показывает лендинг (заменяет renderLandingPageContent)
function renderLandingPageContent() {
  document.querySelectorAll(".landing-section, .hero, header.header, footer.footer")
          .forEach((el) => (el.style.display = "block"));
  document.body.classList.remove("logged-in");
  document.getElementById("content")?.style.setProperty("display", "none");
  document.body.style.overflow = "";
  // Показать футер, как в старой версии
  document.querySelector('footer.footer')?.style.setProperty('display', 'block');
}

// Простейшие версии open/close модалок для совместимости
window.openModal = function(modal) {
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('active');
  modal.removeAttribute('hidden');
  document.body.classList.add('no-scroll');
};

window.closeModal = function(modal) {
  if (!modal) return;
  modal.style.display = 'none';
  modal.classList.remove('active');
  document.body.classList.remove('no-scroll');
  modal.setAttribute('hidden', '');
};

window.closeAllModals = function() {
  document.querySelectorAll(".modal.active").forEach((m) => closeModal(m));
};

console.log('🧪 main1.js готов. handleLoginForm зарегистрирован');

// ====== Важно: обработчики всех кнопок "Выход" ======
async function logoutHandler() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {}
  sessionStorage.clear();
  // Не трогаем localStorage! Только sessionStorage для сброса временных UI-данных.
  location.reload();
}
document.getElementById('logoutBtn')?.addEventListener('click', logoutHandler);
document.getElementById('logoutBtnMobile')?.addEventListener('click', logoutHandler);
document.getElementById('logoutSidebar')?.addEventListener('click', logoutHandler);

// ===== initNavigation =====
function initNavigation() {
  // Smooth scroll
  document
    .querySelectorAll('header .nav-item[href^="#"]')
    .forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (href && href !== "#") {
          e.preventDefault();
          const tgt = document.querySelector(href);
          if (tgt) {
            tgt.scrollIntoView({ behavior: "smooth" });
            const nav = document.getElementById("mobileNav");
            if (nav?.classList.contains("active"))
              document.getElementById("hamburgerBtn")?.click();
          }
        }
      });
    });
  }
  // Icons в кабинете

// Привязка кнопок выхода и инициализация навигации
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initThemeSwitcher();
  initMobileMenu();
  initCounters();

  // ====== Перенесённый обработчик DOMContentLoaded ======
  const descriptions = {
    transfers: "Быстрые и безопасные международные переводы с прозрачными тарифами, отслеживанием статуса и персональной поддержкой.",
    business: "Решения для юридических лиц: экспорт, импорт, расчёты с зарубежными партнёрами. Персональный менеджер и выгодные условия.",
    payment: "Комплексное сопровождение сделок. Контроль каждого этапа перевода и уведомления о статусах.",
    currency: "Конвертация валют с фиксированным курсом. Защита от волатильности и лучшие предложения по рынку.",
    consulting: "Финансовые консультации по международным операциям, валютному контролю и налоговым вопросам.",
    mobile: "Удобные переводы с мобильного — Telegram, WhatsApp, мобильное приложение EUROPAY."
  };

  document.querySelectorAll('.service-link[data-service]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const key = btn.dataset.service;
      const modal = document.getElementById('serviceModal');
      const content = document.getElementById('serviceModalContent');
      content.textContent = descriptions[key] || "Описание услуги временно недоступно.";
      modal.style.display = 'flex';
      modal.removeAttribute('hidden');
    });
  });

  document.querySelector('#serviceModal .modal-close')?.addEventListener('click', () => {
    const modal = document.getElementById('serviceModal');
    modal.style.display = 'none';
    modal.setAttribute('hidden', '');
  });

  document.getElementById('serviceModal')?.addEventListener('click', e => {
    if (e.target.id === 'serviceModal') {
      e.currentTarget.style.display = 'none';
      e.currentTarget.setAttribute('hidden', '');
    }
  });
});

// ======= Проверка активной сессии через API =======
(async function () {
  try {
    const resp = await fetch('/api/auth/me');
    if (resp.ok) {
      document.body.classList.add('logged-in');
      await renderMainSiteContent();
    }
  } catch (e) {}
})();

// (ВТОРОЙ document.addEventListener('DOMContentLoaded') удалён, код перенесён в первый)
// --- Локальный чат поддержки и устаревшие фрагменты, связанные с localStorage, удалены ---
// --- Временный заглушка для renderAdminChats, логика работы с чатом должна быть через API ---
window.renderAdminChats = function () {
  const details = document.querySelector('.details');
  details.innerHTML = `
    <div style="padding:32px;text-align:center;">
      <h2>Чат поддержки (админ)</h2>
      <div style="margin:24px 0;color:#888;">
        История чатов пользователей временно недоступна.<br>
        Функционал будет реализован через backend API.
      </div>
    </div>
  `;
};
window.renderTutorialsPage = function() {
  const details = document.querySelector('.details');
  details.innerHTML = `
    <h1 style="margin-bottom:22px;">Обучающие материалы</h1>
    <div style="display: flex; flex-wrap: wrap; gap: 20px;">
      <div style="background:#f6faff;border-radius:13px;padding:18px;flex:1 1 260px;min-width:260px;">
        <b>Видео: Как заполнить платёж</b><br>
        <iframe width="100%" height="180" src="https://www.youtube.com/embed/ВидеоID1" frameborder="0" allowfullscreen style="border-radius:10px;margin-top:7px;"></iframe>
      </div>
      <div style="background:#f6faff;border-radius:13px;padding:18px;flex:1 1 260px;min-width:260px;">
        <b>Видео: Проверка и экспорт документов</b><br>
        <iframe width="100%" height="180" src="https://www.youtube.com/embed/ВидеоID2" frameborder="0" allowfullscreen style="border-radius:10px;margin-top:7px;"></iframe>
      </div>
      <div style="background:#f6faff;border-radius:13px;padding:18px;flex:1 1 260px;min-width:260px;">
        <b>PDF: Пошаговая инструкция по регистрации</b><br>
        <a href="/pdfs/registration-guide.pdf" class="button button-sm" target="_blank" style="margin-top:12px;">Скачать PDF</a>
      </div>
    </div>
    <div style="margin-top:34px;">
      <h3>FAQ (Часто задаваемые вопросы)</h3>
      <ul style="margin-top:13px;">
        <li><b>Как быстро проходят переводы?</b> — Обычно в течение 1–3 рабочих дней.</li>
        <li><b>Какие документы нужны для регистрации?</b> — Паспорт или учредительные документы компании.</li>
        <li><b>Куда обратиться, если возникли вопросы?</b> — Через чат поддержки или форму обратной связи.</li>
      </ul>
    </div>
  `;
};

window.renderHomePage = async function() {
  console.log('renderHomePage вызвана!');
  const details = document.querySelector('.details');
  // Получаем пользователя через API
  let user = {};
  let isAdmin = false;
  try {
    const resp = await fetch('/api/auth/me');
    if (resp.ok) user = await resp.json();
    isAdmin = user.role && user.role.toLowerCase() === 'admin';
  } catch (e) {}

  document.querySelectorAll('.icon[data-page="adminPanel"]').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  document.querySelectorAll('.icon[data-page="userCabinet"]').forEach(el => {
    el.style.display = !isAdmin ? '' : 'none';
  });

  // Получаем данные через API
  let myPayments = [];
  let myDocs = [];
  let unreadChats = [];
  try {
    const paymentsResp = await fetch('/api/payments');
    if (paymentsResp.ok) {
      const payments = await paymentsResp.json();
      myPayments = user ? (isAdmin ? payments : payments.filter(p => p.ownerEmail === user.email)) : [];
    }
    const docsResp = await fetch('/api/documents');
    if (docsResp.ok) {
      const docs = await docsResp.json();
      myDocs = user ? (isAdmin ? docs : docs.filter(d => d.ownerEmail === user.email)) : [];
    }
    if (isAdmin) {
      const chatsResp = await fetch('/api/admin/chats/unread');
      if (chatsResp.ok) {
        unreadChats = await chatsResp.json();
      }
    }
  } catch(e){}

  details.innerHTML = `
    <div style="margin-bottom:18px;text-align:center;">
      <h1 style="font-size:2.1rem;font-weight:700;">EUROPAY — Финансовый кабинет</h1>
      <div style="font-size:1.15rem;color:#0057ff;font-weight:500;margin-bottom:8px;">
        Добро пожаловать${user?.email ? ', ' + user.email : ''}!
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;margin-bottom:32px;">
      <div class="home-card" style="background:#f6faff;border-radius:16px;padding:20px;text-align:center;">
        <div style="font-size:2.3rem;margin-bottom:7px;"><i class="fas fa-wallet"></i></div>
        <div style="font-weight:600;">Платежи</div>
        <div style="margin:7px 0;color:#0057ff;font-size:1.25rem;">${myPayments.length}</div>
        <button class="button button-sm homeNavBtn" data-go="payments">Перейти</button>
      </div>
      <div class="home-card" style="background:#f6faff;border-radius:16px;padding:20px;text-align:center;">
        <div style="font-size:2.3rem;margin-bottom:7px;"><i class="fas fa-file-alt"></i></div>
        <div style="font-weight:600;">Документы</div>
        <div style="margin:7px 0;color:#0057ff;font-size:1.25rem;">${myDocs.length}</div>
        <button class="button button-sm homeNavBtn" data-go="documents">Перейти</button>
      </div>
      <div class="home-card" style="background:#f6faff;border-radius:16px;padding:20px;text-align:center;">
        <div style="font-size:2.3rem;margin-bottom:7px;"><i class="fas fa-chart-bar"></i></div>
        <div style="font-weight:600;">Статистика</div>
        <button class="button button-sm homeNavBtn" data-go="stats">Открыть</button>
      </div>
      <div class="home-card" style="background:#f6faff;border-radius:16px;padding:20px;text-align:center;">
        <div style="font-size:2.3rem;margin-bottom:7px;"><i class="fas fa-list"></i></div>
        <div style="font-weight:600;">Шаблоны</div>
        <button class="button button-sm homeNavBtn" data-go="templates">Посмотреть</button>
      </div>
      <div class="home-card" style="background:#f6faff;border-radius:16px;padding:20px;text-align:center;">
        <div style="font-size:2.3rem;margin-bottom:7px;"><i class="fas fa-coins"></i></div>
        <div style="font-weight:600;">Курсы валют</div>
        <button class="button button-sm homeNavBtn" data-go="rates">Посмотреть</button>
      </div>
      <div class="home-card" style="background:#eaf9f6;border-radius:16px;padding:20px;text-align:center;">
        <div style="font-size:2.3rem;margin-bottom:7px;"><i class="fas fa-graduation-cap"></i></div>
        <div style="font-weight:600;">Обучающие материалы</div>
        <button class="button button-sm homeNavBtn" data-go="tutorials">Смотреть</button>
      </div>
      <div class="home-card" style="background:#f6faff;border-radius:16px;padding:20px;text-align:center;">
        <div style="font-size:2.3rem;margin-bottom:7px;"><i class="fas fa-comments"></i></div>
        <div style="font-weight:600;">Чат поддержки</div>
        <button class="button button-sm homeNavBtn" data-go="adminChats">Открыть</button>
        ${isAdmin && unreadChats.length ? `<div style="color:#f44;margin-top:7px;">${unreadChats.length} новых обращений</div>` : ''}
      </div>
      ${isAdmin ? `
        <div class="home-card" style="background:#fff7e6;border-radius:16px;padding:20px;text-align:center;">
          <div style="font-size:2.3rem;margin-bottom:7px;"><i class="fas fa-tools"></i></div>
          <div style="font-weight:600;">Админ-панель</div>
          <button class="button button-sm homeNavBtn" data-go="adminPanel">Открыть</button>
        </div>
      ` : ''}
    </div>
    <div style="text-align:center;color:#aaa;font-size:0.98rem;margin-top:20px;">
      Ваш личный кабинет &copy; 2025 — EUROPAY
    </div>
  `;

  // Навигация по кнопкам дашборда
  details.querySelectorAll('.homeNavBtn').forEach(btn => {
    btn.onclick = () => {
      const go = btn.dataset.go;
      if (go === 'adminChats') {
        window.renderAdminChats();
      } else if (go === 'tutorials') {
        window.renderTutorialsPage();
      } else if (window.loadPage) {
        window.loadPage(go);
      }
    };
  });
}

// Контроль видимости админ- и пользовательских иконок теперь реализуется в renderHomePage

// Icons в кабинете (sidebar)
document.querySelectorAll(".sidebar .icon").forEach((icon) => {
  icon.addEventListener("click", () => {
    if (icon.dataset.page === 'adminChats' && isAdmin) {
      window.renderAdminChats();
    } else if (icon.dataset.page === 'userChat' && !isAdmin) {
      window.loadPage?.('userChat');
    } else if (icon.dataset.page === 'home') {
      window.renderHomePage();
    } else {
      window.loadPage?.(icon.dataset.page);
    }
  });
});

// --- (A) Функция showFieldError и clearFieldError (для инлайн-ошибок) ---
function showFieldError(field, message) {
  let msg = field?.parentElement?.querySelector('.error-msg');
  if (!msg) {
    msg = document.createElement('small');
    msg.className = 'error-msg';
    msg.style.color = '#e30000';
    msg.style.display = 'block';
    msg.style.marginTop = '2px';
    field?.parentElement?.appendChild(msg);
  }
  msg.textContent = message || '';
  msg.style.visibility = message ? 'visible' : 'hidden';
}
function clearFieldError(field) {
  let msg = field?.parentElement?.querySelector('.error-msg');
  if (msg) msg.textContent = '';
}

// --- (B) Обработчик регистрации (универсальный) ---
document.getElementById('registerForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  let isValid = true;
  const form = e.target;
  // Очистить все старые ошибки
  form.querySelectorAll('.error-msg').forEach(e => e.textContent = '');

  // Поля
  const email    = form.querySelector('#rEmail');
  const pass1    = form.querySelector('#rPassword');
  const pass2    = form.querySelector('#rPassword2');
  const inn      = form.querySelector('#inn');
  const bik      = form.querySelector('#bik');
  const phone    = form.querySelector('#contactPhone');

  // Email
  const emailVal = email.value.trim();
  if (!emailVal.match(/^[^@]+@[^@]+\.[^@]+$/)) {
    showFieldError(email, 'Введите корректный email');
    isValid = false;
  }

  // Пароль
  if (pass1.value.length < 6) {
    showFieldError(pass1, 'Пароль должен быть не менее 6 символов');
    isValid = false;
  }
  // Совпадение паролей
  if (pass1.value !== pass2.value) {
    showFieldError(pass2, 'Пароли не совпадают');
    isValid = false;
  }

  // ИНН: 10 или 12 цифр (если есть)
  if (inn && inn.value && !inn.value.match(/^\d{10}$|^\d{12}$/)) {
    showFieldError(inn, 'ИНН должен состоять из 10 или 12 цифр');
    isValid = false;
  }
  // БИК: 9 цифр (если есть)
  if (bik && bik.value && !bik.value.match(/^\d{9}$/)) {
    showFieldError(bik, 'БИК должен состоять из 9 цифр');
    isValid = false;
  }
  // Телефон: минимум 10 цифр (можно рус/межд. формат)
  if (phone && phone.value && phone.value.replace(/\D/g, '').length < 10) {
    showFieldError(phone, 'Введите корректный номер телефона');
    isValid = false;
  }

  // Если есть ошибка — прокрутить к первому ошибочному полю, показать toast, не отправлять
  if (!isValid) {
    const firstErr = form.querySelector('.error-msg:not(:empty)');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('Проверьте заполнение полей!', 'error');
    return;
  }

  // Всё валидно — ОТПРАВКА через POST fetch (убирает 405!)
  const formData = {};
  form.querySelectorAll('input,select').forEach(f => { if (f.name) formData[f.name]=f.value; });
  try {
    const resp = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await resp.json();
    if (!resp.ok) {
      if (data?.error) showToast(data.error, 'error');
      else showToast('Ошибка регистрации', 'error');
      return;
    }
    showToast(data.message || 'Регистрация прошла успешно!', 'success');
    // Можно закрыть модалку, сбросить форму, или обновить UI
  } catch (e) {
    showToast('Ошибка сервера при регистрации!', 'error');
  }
});
