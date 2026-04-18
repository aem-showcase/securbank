import { LOG_LEVEL } from '../form/constant.js';
import { decodeAfState } from './util.js';

export function registerQuestionSync() {
  document.addEventListener('chatbot:question', async ({ detail: { fields, stateToken } }) => {
    if (!window.myForm?.importData) return;

    const afState = await decodeAfState(stateToken);
    const ruleEngine = await import('../form/rules/model/afb-runtime.js');
    const form = ruleEngine.restoreFormInstance(afState, null, { logLevel: LOG_LEVEL });

    // Skip fields currently being asked — importing them triggers an OOTB radio-wrapper
    // rebuild that strips card-choice enrichment.
    const asking = new Set((fields || []).map((f) => f.name));
    const data = Object.fromEntries(
      Object.entries(form.exportData()).filter(([key]) => !asking.has(key)),
    );
    window.myForm.importData(data);

    const firstField = fields?.[0]?.id && window.myForm.getElement(fields[0].id);
    if (firstField) window.myForm.setFocus(firstField);
  });
}
