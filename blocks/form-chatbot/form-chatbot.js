import { readBlockConfig, loadCSS } from '../../scripts/aem.js';
import renderCardChoice from './card-choice.js';
import registerSubmitHandler from './submit-handler.js';
import registerQuestionSync from './question-sync.js';

const PROD_SERVER = 'https://aemformfilling.adobe.io';
const DEV_SERVER = 'http://localhost:8080';

const DEFAULT_FORMS = [
  { name: 'Sign up', url: 'https://www.securbankdemo.com/accounts' },
  { name: 'Continue Credit Card Application', url: 'https://www.securbankdemo.com/content/forms/af/securebank/credit-card' },
];

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const serverUrl = cfg['server-url'] || (isLocal ? DEV_SERVER : PROD_SERVER);

  await loadCSS(`${serverUrl}/chatbot/chatbot.css`);

  const urls = cfg.forms ? [cfg.forms].flat() : [];
  const names = cfg.formnames ? [cfg.formnames].flat() : [];
  const forms = urls.length
    ? urls.map((url, i) => ({ name: names[i] || url, url }))
    : DEFAULT_FORMS;

  block.innerHTML = '';

  const { renderChat } = await import(`${serverUrl}/chatbot/core/main.js`);
  renderChat({
    variant: cfg.variant || 'chat',
    serverUrl,
    useAi: cfg.useai !== 'false',
    container: block,
    forms,
    title: cfg.title || 'SecurChat',
    logo: `${window.hlx.codeBasePath}/icons/securbank_logo.svg`,
  });

  registerSubmitHandler();
  registerQuestionSync();

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
}
