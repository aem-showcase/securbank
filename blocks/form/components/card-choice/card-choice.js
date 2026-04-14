import { createOptimizedPicture } from '../../../../scripts/aem.js';
import { subscribe } from '../../rules/index.js';

/**
 * Extends existing OOTB .radio-wrapper elements with custom card content.
 * Does NOT remove/replace wrappers — only injects content into them.
 * Deleting OOTB wrappers triggers AEM's own MutationObserver which calls
 * createRadioOrCheckboxUsingEnum again, causing an infinite re-render loop.
 */
function applyCardContent(element, enums) {
  if (!enums?.length || typeof enums[0] !== 'object' || !enums[0]?.title) return;

  const wrappers = element.querySelectorAll('.radio-wrapper');
  // Wait until OOTB has rendered the correct number of wrappers
  if (!wrappers.length || wrappers.length !== enums.length) return;

  wrappers.forEach((radioWrapper, index) => {
    const enumItem = enums[index];
    if (!enumItem) return;

    // Clear any previously injected custom content before re-applying
    radioWrapper.querySelector('.card-choice-desc')?.remove();
    radioWrapper.querySelector('.card-choice-image')?.remove();
    radioWrapper.querySelector('.card-choice-benefits-list')?.remove();

    // Fix the OOTB input value ("[object Object]" → card title)
    const input = radioWrapper.querySelector('input');
    if (input) {
      input.value = enumItem.title;
      input.dataset.index = index;
    }

    // Update existing label or create one if OOTB didn't add it
    let label = radioWrapper.querySelector('label');
    if (label) {
      label.textContent = enumItem.title;
    } else {
      label = document.createElement('label');
      label.textContent = enumItem.title;
      if (input) label.setAttribute('for', input.id);
      if (input) { input.after(label); } else { radioWrapper.prepend(label); }
    }

    const desc = document.createElement('p');
    desc.className = 'card-choice-desc';
    desc.textContent = enumItem.desc;

    const image = createOptimizedPicture(enumItem.image, enumItem.title);
    image.classList.add('card-choice-image');

    const featuresUl = document.createElement('ul');
    featuresUl.className = 'card-choice-benefits-list';
    (Array.isArray(enumItem.features) ? enumItem.features : []).forEach((feature) => {
      const li = document.createElement('li');
      li.textContent = feature;
      featuresUl.appendChild(li);
    });

    radioWrapper.appendChild(desc);
    radioWrapper.appendChild(image);
    radioWrapper.appendChild(featuresUl);
  });
}

export default function decorate(element, fieldJson, container, formId) {
  element.classList.add('card');
  let currentEnums = null;

  subscribe(element, formId, (fieldDiv, fieldModel, eventType, payload) => {
    if (eventType === 'register') {
      currentEnums = fieldModel.enum;

      // Watch for OOTB radio-wrapper rebuilds (triggered by enum changes).
      // When OOTB calls createRadioOrCheckboxUsingEnum it replaces the wrappers;
      // the MutationObserver detects this and re-applies our rich content.
      const observer = new MutationObserver(() => {
        // RAF ensures OOTB has finished its synchronous DOM work before we run
        requestAnimationFrame(() => applyCardContent(element, currentEnums));
      });
      observer.observe(element, { childList: true });

      // Initial decoration pass
      requestAnimationFrame(() => applyCardContent(element, currentEnums));

      // Use capture phase (3rd arg = true) so this fires as the event descends,
      // before it reaches OOTB's bubble-phase listener on the ancestor <form>.
      // stopImmediatePropagation then prevents OOTB from running at all.
      element.addEventListener('change', (e) => {
        e.stopImmediatePropagation();
        const index = parseInt(e.target.dataset.index, 10);
        if (!Number.isNaN(index) && currentEnums?.[index]) {
          const { target } = e;
          fieldModel.value = currentEnums[index];
          // Safety net: AEM's model subscription may sync radio state after the
          // value change and uncheck the input (object !== string comparison).
          // Re-check it in the next frame before the browser paints.
          requestAnimationFrame(() => { target.checked = true; });
        }
      }, true);
    } else if (eventType === 'change') {
      payload?.changes?.forEach((change) => {
        if (change?.propertyName === 'enum') {
          // Update currentEnums so the MutationObserver callback picks up the
          // latest data when it fires (RAF closure reads currentEnums by reference)
          currentEnums = change.currentValue;
          requestAnimationFrame(() => applyCardContent(element, currentEnums));
        }
      });
    }
  }, { listenChanges: true });
  return element;
}
