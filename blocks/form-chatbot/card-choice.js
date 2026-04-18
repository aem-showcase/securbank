import { createOptimizedPicture } from '../../scripts/aem.js';

function buildCard(opt, index, field, onSelect) {
  const card = document.createElement('div');
  card.className = 'chatbot-card';
  card.setAttribute('role', 'radio');
  card.setAttribute('aria-checked', 'false');
  card.tabIndex = 0;

  if (opt.image) {
    const picture = createOptimizedPicture(opt.image, opt.title || '');
    picture.classList.add('chatbot-card-image');
    card.append(picture);
  }

  const body = document.createElement('div');
  body.className = 'chatbot-card-body';

  const title = document.createElement('strong');
  title.className = 'chatbot-card-title';
  title.textContent = opt.title || field.enumNames?.[index] || '';
  body.append(title);

  if (opt.desc) {
    const desc = document.createElement('p');
    desc.className = 'chatbot-card-desc';
    desc.textContent = opt.desc;
    body.append(desc);
  }

  card.append(body);

  const check = document.createElement('span');
  check.className = 'chatbot-card-check';
  check.setAttribute('aria-hidden', 'true');
  card.append(check);

  card.addEventListener('click', onSelect);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); }
  });

  return card;
}

export default function renderCardChoice(field, container, setValue, submit) {
  const grid = document.createElement('div');
  grid.className = 'chatbot-card-grid';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.textContent = 'Continue';
  submitBtn.className = 'card-choice-submit';
  submitBtn.disabled = true;

  field.enumObjects.forEach((opt, index) => {
    const enumKey = field.enum[index];
    const card = buildCard(opt, index, field, () => {
      grid.querySelectorAll('.chatbot-card').forEach((c) => {
        c.classList.remove('selected');
        c.setAttribute('aria-checked', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');
      setValue(enumKey);
      submitBtn.disabled = false;
    });
    grid.append(card);
  });

  submitBtn.addEventListener('click', () => submit());

  container.replaceChildren(grid, submitBtn);
}
