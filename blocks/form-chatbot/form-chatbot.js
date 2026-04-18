/* global DecompressionStream */
import { readBlockConfig, loadCSS } from '../../scripts/aem.js';
import { LOG_LEVEL } from '../form/constant.js';

const BASE = 'http://localhost:8080';

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

export default async function decorate(block) {
  await loadCSS(`${BASE}/chatbot/chatbot.css`);

  const cfg = readBlockConfig(block);

  const DEFAULT_FORMS = [
    { name: 'Sign up', url: 'https://www.securbankdemo.com/accounts' },
    { name: 'Apply for a Credit Card', url: 'https://www.securbankdemo.com/content/forms/af/securebank/credit-card' },
  ];

  const urls = cfg.forms ? [cfg.forms].flat() : [];
  const names = cfg.formnames ? [cfg.formnames].flat() : [];
  const forms = urls.length
    ? urls.map((url, i) => ({ name: names[i] || url, url }))
    : DEFAULT_FORMS;

  const config = {
    variant: cfg.variant || 'chat',
    serverUrl: cfg['server-url'] || BASE,
    useAi: cfg.useai !== 'false',
    container: block,
    forms,
    title: 'SecurChat',
    ...(cfg.title && { title: cfg.title }),
    logo: `${window.hlx.codeBasePath}/icons/securbank_logo.svg`,
  };

  block.innerHTML = '';

  const { renderChat } = await import(`${BASE}/chatbot/core/main.js`);
  renderChat(config);

  document.addEventListener('chatbot:fields', async ({ detail: { stateToken } }) => {
    const afState = await decodeAfState(stateToken);
    const ruleEngine = await import('../form/rules/model/afb-runtime.js');
    const form = ruleEngine.restoreFormInstance(afState, null, { logLevel: LOG_LEVEL });
    if (window.myForm?.importData) {
      window.myForm.importData(form.exportData());
    }
  });
}
