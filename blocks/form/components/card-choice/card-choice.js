import { createOptimizedPicture } from '../../../../scripts/aem.js';
import { createRadioOrCheckboxUsingEnum } from '../../util.js';
import { subscribe } from '../../rules/index.js';

function decorateCards(element, fieldModel) {
  const enums = fieldModel.enum;
  if (!enums?.length || typeof enums[0] !== 'object' || !enums[0]?.title) return;

  // element IS the fieldset (createFieldSet returns a fieldset with field-wrapper class).
  // When enum is resolved via API after the initial render, OOTB won't rebuild
  // automatically — sync wrapper count here before decorating.
  if (element.querySelectorAll('.radio-wrapper').length !== enums.length) {
    createRadioOrCheckboxUsingEnum(fieldModel, element);
  }

  element.querySelectorAll('.radio-wrapper').forEach((radioWrapper, index) => {
    const enumItem = enums[index];
    if (!enumItem) return;

    // Fix OOTB input value ("[object Object]" → card title)
    const input = radioWrapper.querySelector('input');
    if (input) {
      input.value = enumItem.title;
      input.dataset.index = index;
    }

    // createRadioOrCheckboxUsingEnum skips label creation when enum items are
    // complex objects (labelValues[index].value is undefined). Create it here.
    let label = radioWrapper.querySelector('label');
    if (!label) {
      label = document.createElement('label');
      label.className = 'field-label';
      if (input) label.setAttribute('for', input.id);
      radioWrapper.insertAdjacentElement('afterbegin', label);
    }
    label.textContent = enumItem.title;

    // Remove previously injected content before re-applying
    radioWrapper.querySelector('.card-choice-desc')?.remove();
    radioWrapper.querySelector('.card-choice-image')?.remove();
    radioWrapper.querySelector('.card-choice-benefits-list')?.remove();

    const picture = createOptimizedPicture(enumItem.image, enumItem.title);
    picture.classList.add('card-choice-image');

    const desc = document.createElement('p');
    desc.className = 'card-choice-desc';
    desc.textContent = enumItem.desc;

    const featuresUl = document.createElement('ul');
    featuresUl.className = 'card-choice-benefits-list';
    (Array.isArray(enumItem.features) ? enumItem.features : []).forEach((feature) => {
      const li = document.createElement('li');
      li.textContent = feature;
      featuresUl.append(li);
    });

    radioWrapper.append(desc, picture, featuresUl);
  });
}

export default function decorate(element, fieldJson, container, formId) {
  element.classList.add('card');
  let fieldModelRef = null;

  // Capture phase: intercept before OOTB's bubble-phase listener on the form.
  // Sets model value to the full complex object (input.value can't store objects).
  element.addEventListener('change', (e) => {
    e.stopImmediatePropagation();
    if (!fieldModelRef) return;
    const index = parseInt(e.target.dataset.index, 10);
    if (!Number.isNaN(index) && fieldModelRef.enum?.[index]) {
      const { target } = e;
      fieldModelRef.value = fieldModelRef.enum[index];
      // Re-check in next frame: AEM model sync may uncheck after object value assignment.
      requestAnimationFrame(() => { target.checked = true; });
    }
  }, true);

  subscribe(element, formId, (fieldDiv, fieldModel, eventType, payload) => {
    if (eventType === 'register') {
      fieldModelRef = fieldModel;
      decorateCards(element, fieldModel);
    } else if (eventType === 'change') {
      // subscribe 'change' fires after OOTB fieldChanged has already rebuilt wrappers,
      // so decorateCards sees the correct wrapper count here.
      payload?.changes?.forEach((change) => {
        if (change?.propertyName === 'enum') {
          decorateCards(element, fieldModel);
        }
      });
    }
  }, { listenChanges: true });
}
