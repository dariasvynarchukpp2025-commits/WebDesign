/* Tidyly — js/validation.js
   Клієнтська валідація форми зворотного зв’язку (#feedbackForm) + модальне вікно успіху.
   Підключати ПІСЛЯ js/script.js (обидва з defer). */
(() => {
  'use strict';

  const form = document.getElementById('feedbackForm');
  if (!form) return; // скрипт безпечний на сторінках без цієї форми

  /* ---------- 1. RegEx та константи ---------- */
  const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const REGEX_PHONE = /^\+380\d{9}$/; // +380 і рівно 9 цифр
  const MIN_NAME = 2;
  const MIN_MESSAGE = 10;

  // Важливо: "!" (important) потрібен, бо style.css задає border для input[type="text"]
  // із більшою специфічністю, ніж звичайні Tailwind-класи.
  const CLASS_ERROR = '!border-red-500';
  const CLASS_SUCCESS = '!border-green-500';

  /* ---------- 2. Елементи форми ---------- */
  const $ = (id) => document.getElementById(id);
  const fields = {
    name:      { input: $('name'),      error: $('nameError') },
    email:     { input: $('email'),     error: $('emailError') },
    phone:     { input: $('phone'),     error: $('phoneError') },
    message:   { input: $('message'),   error: $('messageError') },
    agreement: { input: $('agreement'), error: $('agreementError') },
  };
  const submitBtn = form.querySelector('button[type="submit"]');
  const modal = $('successModal');
  const closeModalBtn = $('closeModalBtn');

  /* ---------- 3. UI-стани: помилка / успіх / скидання ---------- */
  function showError(input, errorEl, message) {
    input.classList.remove(CLASS_SUCCESS);
    input.classList.add(CLASS_ERROR);
    input.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }

  function showSuccess(input, errorEl) {
    input.classList.remove(CLASS_ERROR);
    // Для чекбокса зелена рамка не має сенсу
    if (input.type !== 'checkbox') input.classList.add(CLASS_SUCCESS);
    input.setAttribute('aria-invalid', 'false');
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }

  function clearState(input, errorEl) {
    input.classList.remove(CLASS_ERROR, CLASS_SUCCESS);
    input.setAttribute('aria-invalid', 'false');
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }

  // Спільна логіка: порожній рядок = помилки немає
  function applyResult(field, message) {
    if (message) {
      showError(field.input, field.error, message);
      return false;
    }
    showSuccess(field.input, field.error);
    return true;
  }

  /* ---------- 4. Функції валідації (по одній на поле) ---------- */
  function validateName() {
    const ok = fields.name.input.value.trim().length >= MIN_NAME;
    return applyResult(fields.name, ok ? '' : `Ім’я повинно містити не менше ${MIN_NAME} символів.`);
  }

  function validateEmail() {
    const ok = REGEX_EMAIL.test(fields.email.input.value.trim());
    return applyResult(fields.email, ok ? '' : 'Введіть коректну електронну адресу, наприклад user@mail.com.');
  }

  function validatePhone() {
    const ok = REGEX_PHONE.test(fields.phone.input.value);
    return applyResult(fields.phone, ok ? '' : 'Введіть номер у форматі +380XXXXXXXXX (12 цифр після плюса).');
  }

  function validateMessage() {
    const ok = fields.message.input.value.trim().length >= MIN_MESSAGE;
    return applyResult(fields.message, ok ? '' : `Повідомлення повинно містити не менше ${MIN_MESSAGE} символів.`);
  }

  function validateAgreement() {
    const ok = fields.agreement.input.checked;
    return applyResult(fields.agreement, ok ? '' : 'Щоб надіслати заявку, потрібна згода з політикою конфіденційності.');
  }

  const validators = {
    name: validateName,
    email: validateEmail,
    phone: validatePhone,
    message: validateMessage,
    agreement: validateAgreement,
  };

  /* ---------- 5. Телефон: безпечна нормалізація (edge cases) ---------- */
  // 0501234567        -> +380501234567
  // 380501234567      -> +380501234567
  // 50 123 45 67      -> +380501234567
  // +380 (50) 123-45-67 -> +380501234567
  // літери та зайві символи видаляються, довжина обмежується 13 символами
  function normalizePhone(raw) {
    const digits = raw.replace(/\D/g, '');
    if (digits === '') return raw.includes('+') ? '+' : '';

    let result;
    if (digits.startsWith('0')) result = '+38' + digits;        // 0XX... -> +380XX...
    else if (digits.startsWith('3')) result = '+' + digits;     // 38..., 380...
    else result = '+380' + digits;                              // вставили 9 цифр без коду

    return result.slice(0, 13); // +380 + 9 цифр
  }

  fields.phone.input.addEventListener('input', () => {
    const input = fields.phone.input;
    const normalized = normalizePhone(input.value);
    if (normalized !== input.value) input.value = normalized;
  });

  /* ---------- 6. Динамічна валідація ---------- */
  // Помилки не показуємо, доки користувач не залишив поле (blur).
  // Після першого blur поле перевіряється вже на кожен input.
  const touched = new Set();

  ['name', 'email', 'phone', 'message'].forEach((key) => {
    const { input } = fields[key];
    input.addEventListener('blur', () => {
      touched.add(key);
      validators[key]();
    });
    input.addEventListener('input', () => {
      if (touched.has(key)) validators[key]();
    });
  });

  fields.agreement.input.addEventListener('change', () => {
    touched.add('agreement');
    validateAgreement();
  });

  /* ---------- 7. Модальне вікно успіху ---------- */
  let lastFocused = null;
  const isModalOpen = () => !modal.classList.contains('hidden');

  function openModal() {
    lastFocused = document.activeElement;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden'; // блокуємо прокрутку сторінки під модалкою
    closeModalBtn.focus();
  }

  function closeModal() {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  closeModalBtn.addEventListener('click', closeModal);

  // Закриття по кліку на затемнений фон. Клік всередині білої картки ігноруємо:
  // e.target === modal лише тоді, коли клікнули саме по оверлею.
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (!isModalOpen()) return;
    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'Tab') {
      // У модалці одна кнопка: тримаємо фокус усередині вікна
      e.preventDefault();
      closeModalBtn.focus();
    }
  });

  /* ---------- 8. Надсилання форми ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // без перезавантаження сторінки
    if (isModalOpen()) return; // захист від повторного натискання

    // Перевіряємо ВСІ поля (не зупиняємось на першій помилці)
    const results = Object.keys(validators).map((key) => {
      touched.add(key);
      return { key, ok: validators[key]() };
    });

    const firstInvalid = results.find((r) => !r.ok);
    if (firstInvalid) {
      fields[firstInvalid.key].input.focus(); // переносимо фокус на перше невалідне поле
      return;
    }

    // Імітація успішного надсилання (реального бекенду немає)
    form.reset();
    Object.values(fields).forEach((f) => clearState(f.input, f.error));
    touched.clear();
    openModal();
  });
})();