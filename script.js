let pageData = null;
let peopleById = {};

const entranceList = document.getElementById('entrance-list');
const commonSection = document.getElementById('common-contacts');
const commonList = document.getElementById('common-list');
const modal = document.getElementById('contact-modal');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalContacts = document.getElementById('modal-contacts');
const debugError = document.getElementById('debug-error');

const importantSection = document.getElementById('important-section');
const importantToggle = document.getElementById('important-toggle');
const importantTitle = document.getElementById('important-title');
const importantSummary = document.getElementById('important-summary');
const importantContent = document.getElementById('important-content');

const socialMeta = {
  vk: { name: 'VK', icon: 'VK' },
  telegram: { name: 'Telegram', icon: 'TG' },
  max: { name: 'MAX', icon: 'MAX' },
  phone: { name: 'Телефон', icon: '☎' },
  email: { name: 'Email', icon: '@' },
  whatsapp: { name: 'WhatsApp', icon: 'WA' }
};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = text;
  return element;
}

function normalizeType(type) {
  return String(type || 'link').trim().toLowerCase();
}

function hasContacts(person) {
  return person && Array.isArray(person.contacts) && person.contacts.some(function (link) {
    return link && link.url;
  });
}

function shouldShowPerson(person) {
  return !!person && hasContacts(person);
}

function getInitials(fullName) {
  const cleanName = String(fullName || '').trim();

  if (!cleanName || cleanName === 'ФИО не указано' || cleanName === 'ФИО уточняется') {
    return '?';
  }

  return cleanName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(function (word) { return word.charAt(0).toUpperCase(); })
    .join('');
}

function createAvatar(person) {
  const avatar = createElement('div', 'person-avatar');
  avatar.appendChild(createElement('span', 'person-initials', getInitials(person.fullName)));
  return avatar;
}

function createContactLink(link) {
  const type = normalizeType(link.type);
  const meta = socialMeta[type] || { name: link.type || 'Ссылка', icon: '↗' };

  const a = document.createElement('a');
  a.className = 'contact-link contact-link-' + type;
  a.href = link.url;

  /*
    Важно для Android и WebView:
    не используем target="_blank", чтобы переход шел в текущем окне.
    Так браузер или WebView-клиент может передать ссылку системному обработчику:
    VK, Telegram, MAX или другому установленному приложению.
  */

  const logo = createElement('span', 'contact-logo', meta.icon);
  const textWrap = createElement('span', 'contact-link-text');
  const label = createElement('span', 'contact-link-label', link.label || meta.name);
  const hint = createElement('span', 'contact-link-hint', meta.name);

  textWrap.appendChild(label);
  textWrap.appendChild(hint);
  a.appendChild(logo);
  a.appendChild(textWrap);

  return a;
}

function createPersonCard(person) {
  const card = createElement('article', 'person-card');

  if (person.id === 'chairperson') {
    card.className += ' person-card-chairperson';
  }

  const header = createElement('div', 'person-header');
  const avatar = createAvatar(person);
  const text = createElement('div', 'person-text');
  const role = createElement('div', 'person-role', person.role || 'Контакт');
  const name = createElement('div', 'person-name', person.fullName || 'Без имени');

  text.appendChild(role);
  text.appendChild(name);

  if (person.note) {
    text.appendChild(createElement('div', 'person-note', person.note));
  }

  header.appendChild(avatar);
  header.appendChild(text);
  card.appendChild(header);

  const linksWrap = createElement('div', 'contact-links');

  if (hasContacts(person)) {
    person.contacts.forEach(function (link) {
      if (link && link.url) linksWrap.appendChild(createContactLink(link));
    });
    card.appendChild(linksWrap);
  }

  return card;
}

function renderImportant(data) {
  const important = data.important;

  if (!important || !important.html) {
    importantSection.hidden = true;
    return;
  }

  importantTitle.textContent = important.title || '';
  importantSummary.textContent = important.summary || '';
  importantContent.innerHTML = important.html;
  importantContent.hidden = true;
  importantToggle.setAttribute('aria-expanded', 'false');
  importantSection.hidden = false;
}

function renderCommonContacts(data) {
  const commonIds = Array.isArray(data.commonPersonIds) ? data.commonPersonIds : [];

  commonList.innerHTML = '';

  commonIds.forEach(function (personId) {
    const person = peopleById[personId];

    if (shouldShowPerson(person)) {
      commonList.appendChild(createPersonCard(person));
    }
  });

  commonSection.hidden = !commonList.children.length;
}

function openModal(entrance) {
  modalTitle.textContent = entrance.label;
  modalSubtitle.textContent = 'Контакт ответственного по вашему подъезду.';
  modalContacts.innerHTML = '';

  const personIds = Array.isArray(entrance.personIds) ? entrance.personIds : [];
  let visibleCount = 0;

  personIds.forEach(function (personId) {
    const person = peopleById[personId];

    if (!person) {
      modalContacts.appendChild(createElement('div', 'error', 'Контакт с id «' + personId + '» не найден в people.'));
      visibleCount += 1;
      return;
    }

    if (!shouldShowPerson(person)) {
      return;
    }

    modalContacts.appendChild(createPersonCard(person));
    visibleCount += 1;
  });

  if (!visibleCount) {
    modalContacts.appendChild(createElement('div', 'empty-links', 'Для этого подъезда контакт пока не указан.'));
  }

  modal.hidden = false;
  document.body.classList.add('modal-open');
  modal.querySelector('.modal-close').focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function validateData(data) {
  if (!data || typeof data !== 'object') throw new Error('contacts.json должен содержать объект.');
  if (!Array.isArray(data.people)) throw new Error('В contacts.json нет массива people.');
  if (!Array.isArray(data.entrances)) throw new Error('В contacts.json нет массива entrances.');
}

function renderPage(data) {
  validateData(data);

  document.title = data.title || '';
  document.getElementById('page-title').textContent = data.title || '';
  document.getElementById('top-line').textContent = data.topLine || '';
  document.getElementById('description').textContent = data.description || '';
  document.getElementById('footer').textContent = data.footer || '';

  peopleById = {};
  data.people.forEach(function (person) {
    if (person && person.id) peopleById[person.id] = person;
  });

  renderImportant(data);

  entranceList.innerHTML = '';

  data.entrances.forEach(function (entrance) {
    const button = document.createElement('button');
    button.className = 'entrance-button';
    button.type = 'button';

    const number = String(entrance.label || '').replace(/[^0-9]/g, '') || '?';

    button.appendChild(createElement('span', 'entrance-number', number));
    button.appendChild(createElement('span', 'entrance-text', 'подъезд'));
    button.appendChild(createElement('span', 'entrance-chevron', '›'));

    button.addEventListener('click', function () { openModal(entrance); });
    entranceList.appendChild(button);
  });

  renderCommonContacts(data);
}

async function loadContacts() {
  try {
    const response = await fetch('contacts.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('contacts.json не загружен: HTTP ' + response.status);

    pageData = await response.json();
    renderPage(pageData);
  } catch (error) {
    console.error('Не удалось загрузить contacts.json.', error);
    entranceList.innerHTML = '<p class="error">Не удалось загрузить список контактов. Проверьте файл contacts.json.</p>';
    debugError.hidden = false;
    debugError.textContent = 'Ошибка загрузки contacts.json: ' + error.message;
  }
}

importantToggle.addEventListener('click', function () {
  const isOpen = importantToggle.getAttribute('aria-expanded') === 'true';
  importantToggle.setAttribute('aria-expanded', String(!isOpen));
  importantContent.hidden = isOpen;
  importantSection.className = isOpen ? 'important-section' : 'important-section important-section-open';
});

modal.addEventListener('click', function (event) {
  if (event.target.hasAttribute('data-close-modal')) closeModal();
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && !modal.hidden) closeModal();
});

loadContacts();
