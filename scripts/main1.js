
// ==== CABINET_MODULES и динамический импорт ====
const CABINET_MODULES = {
  payments: "./payments.js",
  stats: "./stats.js",
  documents: "./documents.js",
  rates: "./rates.js",
  templates: "./templates.js",
  adminPanel: "./adminPanel.js",
  userCabinet: "./userCabinet.js",
  userCabinet1: "./First.js",
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

window.loadPage = async function (pageKey) {
  const ok = await tryRenderRealPage(pageKey);
  if (!ok) console.warn(`⚠️ Модуль ${pageKey} не отрендерился`);
};

console.log('🔥 main1.js ЗАПУЩЕН');

// ===== renderErrorPage =====
function renderErrorPage(err) {
  document.body.innerHTML = `
    <div class="error-container" style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:1rem;font-family:Inter,sans-serif;">
      <h1 style="font-size:2rem;color:#EF4444;">Произошла ошибка</h1>
      <p>${err.message}</p>
      <button style="padding:.75rem 1.5rem;border:none;border-radius:6px;background:#2563EB;color:#fff;font-weight:600;cursor:pointer;" onclick="location.reload()">Перезагрузить страницу</button>
    </div>`;
}

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

window.handleLoginForm = async function (e) {
  e.preventDefault();
  const email = document.getElementById('modalEmail')?.value.trim();
  const password = document.getElementById('modalPassword')?.value.trim();

  try {
    const res = await fetch('https://macapp.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ошибка входа');

    localStorage.setItem('token', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    document.body.classList.add('logged-in');

    closeModal(document.getElementById('loginModal'));
    showToast('🎉 Вход выполнен', 'success');
    window.dispatchEvent(new CustomEvent('authChanged'));
  } catch (err) {
    alert('❌ Ошибка входа: ' + err.message);
  }
};

// ===== updateAuthUI =====
function updateAuthUI() {
  const userRaw = localStorage.getItem('currentUser');
  const user = userRaw ? JSON.parse(userRaw) : null;

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
  

window.debugLoginFlow = async () => {
  console.log('🧪 Тест: старт');

  const user = {
    email: 'admin@mail.ru',
    role: 'admin',
    feePercent: 0,
    currentBalance: 0,
    directorName: '',
    agreementNo: '',
    agreementDate: ''
  };

  try {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));

    console.log('📍 [4] добавляем logged-in и рендерим');
    document.body.classList.add('logged-in');
    renderMainSiteContent();

    console.log('📍 [5] загружаем adminPanel');
    window.loadPage?.('adminPanel');
  } catch (err) {
    console.error('❌ Ошибка в debugLoginFlow:', err);
  }
};


// Показывает основной кабинет (отлаженная версия)
function renderMainSiteContent() {
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

    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user?.role === 'admin') {
      window.loadPage?.('adminPanel');
    } else {
      window.loadPage?.('payments'); // ✅ для обычных пользователей
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

// Выход из кабинета
window.handleLogout = function () {
  console.log('🔓 Выход из кабинета');
  document.body.classList.remove('logged-in');
  document.getElementById('content')?.style.setProperty('display', 'none');
  document.getElementById('cabinetCss')?.setAttribute('disabled', 'true');
  localStorage.removeItem('isLoggedIn');
  renderLandingPageContent();
};

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

  // Icons в кабинете
  document.querySelectorAll(".sidebar .icon").forEach((icon) => {
    icon.addEventListener("click", () => window.loadPage?.(icon.dataset.page));
  });
}

// Привязка кнопок выхода и инициализация навигации
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('currentUser');

  if (token && userRaw) {
    const user = JSON.parse(userRaw);
    document.body.classList.add('logged-in');

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        document.body.classList.remove('logged-in');
        location.reload();
      });
    }

    // опционально: приветствие
    const header = document.querySelector('.header');
    if (header && user.email) {
      const hello = document.createElement('div');
      hello.textContent = `Привет, ${user.email}`;
      hello.style.marginLeft = '1rem';
      hello.style.color = 'white';
      header.appendChild(hello);
    }
  }
  initNavigation();
  initThemeSwitcher();
  initMobileMenu();
  initCounters();
});



// Автозапуск сессии при загрузке страницы
if (localStorage.getItem('isLoggedIn') === 'true') {
  document.body.classList.add('logged-in');
  renderMainSiteContent();

 try {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (user?.role === 'admin') {
        window.loadPage?.('adminPanel');
      } else {
        window.loadPage?.('payments'); // 👉 сюда попадёт обычный пользователь
      }
    } catch (e) {
      console.warn('⚠️ Ошибка чтения currentUser при рендере');
    }
}
document.addEventListener('DOMContentLoaded', () => {
  const descriptions = {
    transfers: "Быстрые и безопасные международные переводы с прозрачными тарифами, отслеживанием статуса и персональной поддержкой.",
    business: "Решения для юридических лиц: экспорт, импорт, расчёты с зарубежными партнёрами. Персональный менеджер и выгодные условия.",
    payment: "Комплексное сопровождение сделок. Контроль каждого этапа перевода и уведомления о статусах.",
    currency: "Конвертация валют с фиксированным курсом. Защита от волатильности и лучшие предложения по рынку.",
    consulting: "Финансовые консультации по международным операциям, валютному контролю и налоговым вопросам.",
    mobile: "Удобные переводы с мобильного — Telegram, WhatsApp, мобильное приложение AgentAPP."
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
