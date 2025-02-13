/* eslint-disable no-fallthrough */
import { createRange } from './range.js';
import { applyRuleEngine } from './rules/index.js';
import formData from './data/form-data.js';
import { pushToDataLayer } from '../../plugins/martech/src/index.js'

const validityKeyMsgMap = {
  typeMismatch: 'ErrorMessageInvalid',
  badInput: 'ErrorMessageRequired',
  patternMismatch: 'ErrorMessagePattern',
  rangeOverflow: 'ErrorMessageMax',
  rangeUnderflow: 'ErrorMessageMin',
  tooLong: 'ErrorMessageMax',
  tooShort: 'ErrorMessageMin',
  valueMissing: 'ErrorMessageRequired',
};

function setElementProps(element, key, value) {
  if (value) {
    element.setAttribute(key, value);
  }
}

function setConstraints(fd, element) {
  if (fd.Mandatory === 'true') {
    element.setAttribute('required', true);
  }
  setElementProps(element, 'pattern', fd.pattern);
  if (element.type === 'number' || element.type === 'range') {
    setElementProps(element, 'max', fd.Max);
    setElementProps(element, 'min', fd.Min);
    setElementProps(element, 'step', fd.Step);
  } else {
    setElementProps(element, 'maxlength', fd.Max);
    setElementProps(element, 'minlength', fd.Min);
  }
}

function setErrorMessage(fd, element) {
  Object.keys(fd).forEach((key) => {
    if (key?.startsWith('Error Message') && fd[key]) {
      element.dataset[key?.replaceAll(' ', '')] = fd[key];
    }
  });
}

function createSelect(fd) {
  const select = document.createElement('select');
  select.id = fd.Id;
  if (fd.Placeholder) {
    const ph = document.createElement('option');
    ph.textContent = fd.Placeholder;
    ph.value = '';
    ph.setAttribute('selected', '');
    ph.setAttribute('disabled', '');
    select.append(ph);
  }
  fd.Options.split(',').forEach((o) => {
    const option = document.createElement('option');
    option.textContent = o.trim();
    option.value = o.trim();
    select.append(option);
  });
  setConstraints(fd, select);
  setErrorMessage(fd, select);
  return select;
}

function valdiateElement(el) {
  const errorSpan = el.parentNode.querySelector('span.error');
  const valid = el?.checkValidity();
  if (valid) {
    el?.parentNode.removeAttribute('aria-invalid');
    el?.classList.remove('invalid');
    if (errorSpan) {
      errorSpan.textContent = '';
    }
  } else {
    el?.parentNode.setAttribute('aria-invalid', true);
    el?.classList.add('invalid');
    Object.keys(validityKeyMsgMap)?.every((key) => {
      if (el.validity[key] && errorSpan) {
        errorSpan.textContent = el?.dataset[validityKeyMsgMap[key]] || el.validationMessage;
        return false;
      }
      return true;
    });
  }
  return valid;
}

function validateAndConstructPayload(form) {
  let invalid = false;
  const payload = {};
  [...form.elements].forEach((fe) => {
    if (valdiateElement(fe)) {
      if (fe.type === 'checkbox') {
        if (fe.checked) payload[fe.id] = fe.value;
      } else if (fe.id) {
        payload[fe.id] = fe.value;
      }
    } else {
      invalid = true;
    }
  });
  return invalid ? false : payload;
}

async function submitForm(form, payload, redirectTo) {
  const resp = await fetch(form.dataset.action, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: payload }),
  });
  await resp.text();
  window.location.href = redirectTo;
}

function createButton(fd) {
  const button = document.createElement('button');
  button.textContent = fd.Label;
  button.type = fd.Type;
  button.classList.add('button');
  button.dataset.redirect = fd.redirect || '/';
  button.name = fd.Name;
  button.id = 'form-submit';
  return button;
}

function createHeading(fd) {
  const heading = document.createElement('h3');
  heading.textContent = fd.Label;
  return heading;
}

function createInput(fd) {
  const input = document.createElement('input');
  input.type = fd.Type;
  input.id = fd.Id;
  input.name = fd.Name;
  input.value = fd.Value;
  input.setAttribute('placeholder', fd.Placeholder);
  setConstraints(fd, input);
  setErrorMessage(fd, input);
  return input;
}

function createTextArea(fd) {
  const input = document.createElement('textarea');
  input.id = fd.Id;
  input.setAttribute('placeholder', fd.Placeholder);
  setConstraints(fd, input);
  setErrorMessage(fd, input);
  return input;
}

function createLabel(fd, tagName = 'label') {
  const label = document.createElement(tagName);
  label.setAttribute('for', fd.Id);
  label.textContent = fd.Label;
  if (fd.Mandatory === 'true') {
    label.classList.add('required');
  }
  return label;
}

function createFieldWrapper(fd, tagName = 'div') {
  const fieldWrapper = document.createElement(tagName);
  const style = fd.Style ? ` form-${fd.Style}` : '';
  const nameStyle = fd.Name ? ` form-${fd.Name}` : '';
  const fieldId = `form-${fd.Type}-wrapper${style}${nameStyle}`;
  fieldWrapper.className = fieldId;
  fieldWrapper.classList.add('field-wrapper');
  fieldWrapper.append(createLabel(fd));
  return fieldWrapper;
}

function createLegend(fd) {
  return createLabel(fd, 'legend');
}

function createFieldset(fd) {
  const wrapper = createFieldWrapper(fd, 'fieldset');
  wrapper.name = fd.Name;
  wrapper.replaceChildren(createLegend(fd));
  return wrapper;
}

function createErrorWrapper() {
  const span = document.createElement('span');
  span.classList = 'error';
  return span;
}

const createOutput = (fd) => {
  const output = document.createElement('output');
  output.name = fd.Name;
  output.id = fd.Id;
  output.value = ((+fd.Value)?.toLocaleString());
  output.dataset.value = fd.Value;
  return output;
};

function idGenerator(duplicateNameMap, name) {
  const num = duplicateNameMap?.get(name) || 0;
  const id = num ? `${name}-${num}` : name;
  duplicateNameMap.set(name, num + 1);
  return id;
}

async function createForm(formURL) {
  const { pathname } = new URL(formURL);
  const resp = await fetch(formURL);
  const json = await resp.json();
  // const json = formData;
  const form = document.createElement('form');
  const pageDir = window.location.pathname !== '/' ? window.location.pathname.replace(/\//g, '') : 'home';
  
  const randId = Date.now();

  const dataObj = {};
  dataObj['simple-form'] = {
    '@type': 'blocks/simple-form',
    id: +randId,
    name: 'simple-form'+randId,
    parentId: pageDir
  };
  window.adobeDataLayer.push({
    component: dataObj
  })
  form.setAttribute('novalidate', 'true');
  form.id = 'simple-form'+randId;
  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = formURL.split('.json')[0];
  const duplicateNameMap = new Map();
  let container = form;
  json.data.forEach((fd) => {
    fd.Type = fd.Type || 'text';
    fd.Id = idGenerator(duplicateNameMap, fd.Name);
    let fieldWrapper = createFieldWrapper(fd);
    let tmp;
    switch (fd.Type) {
      case 'hidden':
        fieldWrapper = createInput(fd);
      case 'output':
        fieldWrapper.append(createOutput(fd));
        break;
      case 'fieldset':
        fieldWrapper = createFieldset(fd);
        break;
      case 'select':
        fieldWrapper.append(createSelect(fd));
        fieldWrapper.append(createErrorWrapper());
        break;
      case 'label':
        break;
      case 'heading':
        fieldWrapper.replaceChildren(createHeading(fd));
        break;
      case 'radio':
      case 'checkbox':
        fieldWrapper.insertAdjacentElement('afterbegin', createInput(fd));
        fieldWrapper.append(createErrorWrapper());
        break;
      case 'text-area':
        fieldWrapper.append(createTextArea(fd));
        fieldWrapper.append(createErrorWrapper());
        break;
      case 'submit':
        tmp = createButton(fd);
        tmp.type = 'submit';
        fieldWrapper.replaceChildren(tmp);
        break;
      case 'range':
        fieldWrapper.append(createRange(createInput(fd)));
        break;
      default:
        fieldWrapper.append(createInput(fd));
        fieldWrapper.append(createErrorWrapper());
    }

    if (fd.Type === 'fieldset') {
      form.append(fieldWrapper);
      container = fieldWrapper;
    } else {
      container.append(fieldWrapper);
    }
    form.addEventListener('change', (event) => {
      valdiateElement(event.target); 
    });
    const inputField = fieldWrapper.getElementsByTagName("input").length > 0 ? fieldWrapper.getElementsByTagName("input")[0] : null;

    inputField && inputField.addEventListener('blur', (event) => {

      window.adobeDataLayer = window.adobeDataLayer || [];
      const compObj = {};
      compObj['simple-form' + '.' + event.target.id] = {
        parentId: form.id,
        value: event.target.value
      }
      window.adobeDataLayer.push({
        component: compObj
      });
      console.log(event.target.value)
    });
  });

  applyRuleEngine(json.data, {}, form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = validateAndConstructPayload(form);
    if (payload) {
      e.submitter?.setAttribute('disabled', '');
      submitForm(form, payload, e.submitter.dataset?.redirect);
    }
  });
  return form;
}

export default async function decorate(block) {
  const form = block.querySelector("a[href$='.json']");
  if (form) {
    form.replaceWith(await createForm(form.innerText));
  }
}
