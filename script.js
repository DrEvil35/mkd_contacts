let pageData = null;
let peopleById = {};

const entranceList = document.getElementById('entrance-list');
const modal = document.getElementById('contact-modal');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalContacts = document.getElementById('modal-contacts');

const linkIcons = {
  "vk": "VK",
  "telegram": "TG",
  "max": "MAX",
  "phone": "☎",
  "email": "@",
  "whatsapp": "WA"
};

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
}

function getContactIcon(type) {
  const key = String(type || '').toLowerCase();
  return linkIcons[key] || '↗';
}

function getInitials(fullName) {
  const words = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length || fullName === 'ФИО не указано') {
    return '?';
  }

  return words
    .slice(0, 2)
    .map(function (word) {
      return word.charAt(0).toUpperCase();
    })
    .join('');
}

function createContactLink(link) {
  const a = document.createElement('a');
  const type = String(link.type || 'link').toLowerCase();

  a.className = 'contact-link contact-link-' + type;
  a.href = link.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';

  const logo = createElement('span', 'contact-logo', getContactIcon(link.type));
  const label = createElement('span', 'contact-link-label', link.label || link.type || 'Ссылка');

  a.appendChild(logo);
  a.appendChild(label);

  return a;
}

function createPersonCard(person) {
  const card = createElement('article', 'person-card');

  const header = createElement('div', 'person-header');
  const avatar = createElement('div', 'person-avatar', getInitials(person.fullName));
  const text = createElement('div', 'person-text');
  const name = createElement('div', 'person-name', person.fullName || 'Без имени');

  text.appendChild(name);

  if (person.comment) {
    const comment = createElement('div', 'person-comment', person.comment);
    text.appendChild(comment);
  }

  header.appendChild(avatar);
  header.appendChild(text);
  card.appendChild(header);

  const linksWrap = createElement('div', 'contact-links');

  if (person.contacts && person.contacts.length) {
    person.contacts.forEach(function (link) {
      if (link.url) {
        linksWrap.appendChild(createContactLink(link));
      }
    });
  } else {
    linksWrap.appendChild(createElement('div', 'empty-links', 'Контакты будут добавлены позже'));
  }

  card.appendChild(linksWrap);
  return card;
}

function openModal(entrance) {
  modalTitle.textContent = entrance.label;
  modalSubtitle.textContent = 'Выберите человека и удобный способ связи.';

  modalContacts.innerHTML = '';

  entrance.personIds.forEach(function (personId) {
    const person = peopleById[personId];

    if (person) {
      modalContacts.appendChild(createPersonCard(person));
    } else {
      const missing = createElement('div', 'error', 'Контакт с id "' + personId + '" не найден в people.');
      modalContacts.appendChild(missing);
    }
  });

  modal.hidden = false;
  document.body.classList.add('modal-open');

  const closeButton = modal.querySelector('.modal-close');
  closeButton.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function renderPage(data) {
  document.title = data.title || document.title;
  document.getElementById('page-title').textContent = data.title || 'Старшие по подъездам';
  document.getElementById('description').textContent = data.description || '';
  document.getElementById('footer').textContent = data.footer || '';

  peopleById = {};
  (data.people || []).forEach(function (person) {
    peopleById[person.id] = person;
  });

  entranceList.innerHTML = '';

  (data.entrances || []).forEach(function (entrance) {
    const button = document.createElement('button');
    button.className = 'link-button';
    button.type = 'button';
    button.textContent = entrance.label;
    button.addEventListener('click', function () {
      openModal(entrance);
    });

    entranceList.appendChild(button);
  });
}

async function loadContacts() {
  try {
    const response = await fetch('contacts.json', { cache: 'no-store' });

    if (!response.ok) {
      throw new Error('Не удалось загрузить contacts.json');
    }

    pageData = await response.json();
    renderPage(pageData);
  } catch (error) {
    entranceList.innerHTML = '<p class="error">Не удалось загрузить список контактов. Попробуйте открыть страницу позже.</p>';
  }
}

modal.addEventListener('click', function (event) {
  if (event.target.hasAttribute('data-close-modal')) {
    closeModal();
  }
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && !modal.hidden) {
    closeModal();
  }
});

loadContacts();
