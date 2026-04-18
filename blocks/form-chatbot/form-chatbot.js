/* global DecompressionStream */
import { readBlockConfig, loadCSS, createOptimizedPicture } from '../../scripts/aem.js';
import { LOG_LEVEL } from '../form/constant.js';

const PROD_SERVER = 'https://adobe-aem-forms-formfillling-service-deploy-ethos0-b43054.cloud.adobe.io';
const DEV_SERVER = 'http://localhost:8080';

async function decodeAfState(stateToken) {
  const b64 = stateToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(atob(b64));
  const compressed = Uint8Array.from(atob(payload.afStateGz), (c) => c.charCodeAt(0));

  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(compressed);
  writer.close();

  const buffer = await new Response(ds.readable).arrayBuffer();
  return JSON.parse(new TextDecoder().decode(buffer));
}

// Renders a card-choice field inside the chatbot.
// Shows image + title + short description only; features are omitted to keep cards compact.
// Uses setValue() / submit() from the chatbot:render-field event detail.
function renderCardChoice(field, container, setValue, submit) {
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'chatbot-card-grid';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.textContent = 'Continue';
  submitBtn.className = 'card-choice-submit';
  submitBtn.disabled = true;

  field.enumObjects.forEach((opt, index) => {
    const enumKey = field.enum[index]; // primitive key — used for setValue()
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

    const select = () => {
      grid.querySelectorAll('.chatbot-card').forEach((c) => {
        c.classList.remove('selected');
        c.setAttribute('aria-checked', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');
      setValue(enumKey); // submit the primitive key, not the rich object
      submitBtn.disabled = false;
    };

    card.addEventListener('click', select);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
    });

    grid.append(card);
  });

  submitBtn.addEventListener('click', () => submit());

  container.append(grid, submitBtn);
}

export default async function decorate(block) {
  const cfg = readBlockConfig(block);

  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const serverUrl = cfg['server-url'] || (isLocal ? DEV_SERVER : PROD_SERVER);

  await loadCSS(`${serverUrl}/chatbot/chatbot.css`);

  const DEFAULT_FORMS = [
    { name: 'Sign up', url: 'https://www.securbankdemo.com/accounts' },
    { name: 'Continue Credit Card Application', url: 'https://www.securbankdemo.com/content/forms/af/securebank/credit-card' },
  ];

  const urls = cfg.forms ? [cfg.forms].flat() : [];
  const names = cfg.formnames ? [cfg.formnames].flat() : [];
  const forms = urls.length
    ? urls.map((url, i) => ({ name: names[i] || url, url }))
    : DEFAULT_FORMS;

  const config = {
    variant: cfg.variant || 'chat',
    serverUrl,
    useAi: cfg.useai !== 'false',
    container: block,
    forms,
    title: 'SecurChat',
    ...(cfg.title && { title: cfg.title }),
    logo: `${window.hlx.codeBasePath}/icons/securbank_logo.svg`,
  };

  block.innerHTML = '';

  const { renderChat } = await import(`${serverUrl}/chatbot/core/main.js`);
  renderChat(config);

  document.addEventListener('chatbot:before-start', (e) => {
    e.detail.context = {
      url: window.location.href,
      queryParams: Object.fromEntries(new URLSearchParams(window.location.search)),
    };
    if (window.myForm?.exportData) {
      e.detail.initialData = window.myForm.exportData();
    }
  });

  document.addEventListener('chatbot:render-field', (e) => {
    const {
      field, container, setValue, submit,
    } = e.detail;
    if (!Array.isArray(field.enumObjects) || !field.enumObjects[0]?.title) return;
    e.preventDefault();
    renderCardChoice(field, container, setValue, submit);
  });

  document.addEventListener('chatbot:question', async ({ detail: { fields, stateToken } }) => {
    const afState = await decodeAfState(stateToken);
    const ruleEngine = await import('../form/rules/model/afb-runtime.js');
    const form = ruleEngine.restoreFormInstance(afState, null, { logLevel: LOG_LEVEL });
    if (window.myForm?.importData) {
      // Exclude fields currently being asked by the chatbot — importing their value
      // would trigger an OOTB radio-wrapper rebuild that strips card-choice enrichment.
      const asking = new Set((fields || []).map((f) => f.name));
      const data = Object.fromEntries(
        Object.entries(form.exportData()).filter(([key]) => !asking.has(key)),
      );
      window.myForm.importData(data);
      const firstField = fields?.[0]?.id && window.myForm.getElement(fields[0].id);
      if (firstField) window.myForm.setFocus(firstField);
    }
  });
}
