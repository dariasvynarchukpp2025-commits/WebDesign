/* Tidyly — js/script.js (чистий JavaScript) */
(() => {
  'use strict';

  // Орієнтовні ціни (замініть на реальні)
  const RATE_PER_M2 = { flat: 30, house: 40, office: 35 };
  const EXTRAS_PRICE = { windows: 400, fridge: 300, oven: 350, sofa: 800 };

  const money = (n) => n.toLocaleString('uk-UA') + ' ₴';
  const labelOf = (input) => input.closest('label').textContent.trim();
  const pad = (n) => String(n).padStart(2, '0');
  const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function showStatus(container, text) {
    let el = container.querySelector('.status');
    if (!el) {
      el = document.createElement('p');
      el.className = 'status';
      el.setAttribute('role', 'status');
      container.append(el);
    }
    el.textContent = text;
  }

  /* ---------- Темна / світла тема ---------- */
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    const root = document.documentElement;
    const apply = (dark) => {
      root.classList.toggle('dark', dark);
      themeBtn.setAttribute('aria-pressed', String(dark));
    };
    apply(root.classList.contains('dark'));
    themeBtn.addEventListener('click', () => {
      const dark = !root.classList.contains('dark');
      apply(dark);
      try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
    });
  }

  /* ---------- Мобільне меню (Tailwind: клас hidden) ---------- */
  const menuBtn = document.getElementById('menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (menuBtn && menu) {
    const setOpen = (open) => {
      menu.classList.toggle('hidden', !open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    };
    menuBtn.addEventListener('click', () =>
      setOpen(menuBtn.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
        setOpen(false);
        menuBtn.focus();
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', () => setOpen(false));
  }

  /* ---------- Калькулятор ---------- */
  const calc = document.querySelector('.calc');
  if (calc) {
    const area = calc.querySelector('#area');
    const date = calc.querySelector('#date');
    const time = calc.querySelector('#time');
    const summary = calc.querySelector('.summary');
    const setText = (sel, text) => { const el = calc.querySelector(sel); if (el) el.textContent = text; };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.min = toIso(today);

    const update = () => {
      const type = calc.querySelector('input[name="type"]:checked');
      const extras = [...calc.querySelectorAll('input[name="extras"]:checked')];
      const size = Number(area.value);
      const total = size * RATE_PER_M2[type.value] +
        extras.reduce((sum, el) => sum + EXTRAS_PRICE[el.value], 0);

      let when = 'Не обрано';
      if (date.value) {
        const [y, m, d] = date.value.split('-').map(Number);
        when = new Date(y, m - 1, d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
        if (time.value) when += ', ' + time.value;
      }

      setText('#area-out', size + ' м²');
      setText('#sum-type', labelOf(type));
      setText('#sum-area', size + ' м²');
      setText('#sum-extras', extras.length ? extras.map(labelOf).join(', ') : 'Не обрано');
      setText('#sum-when', when);
      setText('#total', money(total));
    };

    calc.addEventListener('input', update);
    calc.addEventListener('change', update);
    update();

    // Спочатку розрахунок, потім оформлення
    const calcBtn = calc.querySelector('#calc-btn');
    const confirmBtn = calc.querySelector('#confirm-btn');
    const totalRow = calc.querySelector('#total-row');
    const hint = calc.querySelector('#calc-hint');

    calcBtn.addEventListener('click', () => {
      if (!calc.reportValidity()) return; // підкаже, які поля ще не заповнено
      update();
      totalRow.hidden = false;
      hint.hidden = true;
      confirmBtn.disabled = false;
      totalRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });

    calc.addEventListener('submit', (e) => {
      e.preventDefault();
      if (confirmBtn.disabled) return;
      showStatus(summary, 'Дякуємо! Замовлення прийнято, ми скоро з вами зв’яжемось.');
    });

    /* ---------- Календар ---------- */
    const cal = document.getElementById('cal');
    if (cal) {
      const body = document.getElementById('cal-body');
      const monthEl = document.getElementById('cal-month');
      const prev = document.getElementById('cal-prev');
      const next = document.getElementById('cal-next');
      const firstMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      let view = new Date(firstMonth);

      cal.hidden = false; // без JS лишається звичайне поле дати

      const render = () => {
        monthEl.textContent = view.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
        prev.disabled = view <= firstMonth;
        body.replaceChildren();

        const offset = (view.getDay() + 6) % 7; // тиждень починається з понеділка
        const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
        let row = document.createElement('tr');

        for (let i = 0; i < offset; i++) row.append(document.createElement('td'));

        for (let day = 1; day <= days; day++) {
          const d = new Date(view.getFullYear(), view.getMonth(), day);
          const iso = toIso(d);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = day;
          btn.dataset.date = iso;
          btn.setAttribute('aria-label', d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }));
          btn.setAttribute('aria-pressed', String(iso === date.value));
          btn.disabled = d < today;
          if (d.getTime() === today.getTime()) btn.classList.add('is-today');

          const cell = document.createElement('td');
          cell.append(btn);
          row.append(cell);

          if (row.children.length === 7) {
            body.append(row);
            row = document.createElement('tr');
          }
        }

        if (row.children.length) {
          while (row.children.length < 7) row.append(document.createElement('td'));
          body.append(row);
        }
      };

      body.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-date]');
        if (!btn) return;
        date.value = btn.dataset.date;
        date.dispatchEvent(new Event('input', { bubbles: true })); // оновлює підсумок
        render();
        body.querySelector(`button[data-date="${btn.dataset.date}"]`).focus();
      });

      prev.addEventListener('click', () => { view.setMonth(view.getMonth() - 1); render(); });
      next.addEventListener('click', () => { view.setMonth(view.getMonth() + 1); render(); });

      // Якщо дату ввели вручну в полі — календар слідує за нею
      date.addEventListener('change', () => {
        if (date.value) {
          const [y, m] = date.value.split('-').map(Number);
          view = new Date(y, m - 1, 1);
          if (view < firstMonth) view = new Date(firstMonth);
        }
        render();
      });

      render();
    }
  }

  /* ---------- Інформер погоди у Львові (Open-Meteo API, без ключа) ---------- */
  const weatherOut = document.getElementById('weather-out');
  if (weatherOut) {
    // Коди погоди WMO → короткий опис українською
    const describe = (code) =>
      code === 0 ? 'Ясно' :
      code <= 3 ? 'Мінлива хмарність' :
      code <= 48 ? 'Туман' :
      code <= 57 ? 'Мряка' :
      code <= 67 ? 'Дощ' :
      code <= 77 ? 'Сніг' :
      code <= 82 ? 'Злива' :
      code <= 86 ? 'Снігопад' : 'Гроза';

    const url = 'https://api.open-meteo.com/v1/forecast' +
      '?latitude=49.84&longitude=24.03' +
      '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' +
      '&timezone=Europe%2FKyiv';

    // Edge case: сервіс не відповідає — не лишаємо «Завантаження…» назавжди
    const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout
      ? AbortSignal.timeout(8000)
      : undefined;

    fetch(url, { signal })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(({ current: c }) => {
        const temp = Math.round(c.temperature_2m);
        let text = `${temp} °C, ${describe(c.weather_code)}. ` +
          `Вологість ${c.relative_humidity_2m}%, вітер ${Math.round(c.wind_speed_10m)} км/год.`;
        // Невелика підказка в тему сервісу: сухо й тепло — доречно мити вікна
        if (c.weather_code <= 3 && temp >= 5) text += ' Гарний день для миття вікон.';
        weatherOut.textContent = text;
      })
      .catch(() => {
        weatherOut.textContent = 'Не вдалося завантажити погоду. Спробуйте пізніше.';
      });
  }

  /* ---------- Форма зворотного зв’язку ---------- */
  const contact = document.querySelector('.contact');
  if (contact) {
    contact.addEventListener('submit', (e) => {
      e.preventDefault();
      contact.reset();
      showStatus(contact, 'Заявку надіслано. Ми зателефонуємо вам найближчим часом.');
    });
  }
})();