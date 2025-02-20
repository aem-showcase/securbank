// eslint-disable-next-line no-unused-vars
async function updateBubble(input, element, values) {
  const step = input.step || 1;
  const max = input.max || 0;
  const min = input.min || 0;
  const value = input.value || 0;
  const steps = {
    '--total-steps': Math.ceil((max - min) / step),
    '--current-steps': Math.ceil((value - min) / step),
  };
  const style = Object.entries(steps).map(([varName, varValue]) => `${varName}:${varValue}`).join(';');
  element.setAttribute('style', style);
  const bubble = element.querySelector('.range-bubble');
  bubble.innerText = (value);
}

// eslint-disable-next-line import/prefer-default-export
export function createRange(input) {
  const clonedInput = input.cloneNode();

  const div = document.createElement('div');
  div.className = 'range-widget-wrapper';

  clonedInput.addEventListener('input', (e) => {
    updateBubble(e.target, div);
  });

  const hover = document.createElement('output');
  hover.className = 'range-bubble';
  const rangeMinEl = document.createElement('span');
  rangeMinEl.className = 'range-min';
  const rangeMaxEl = document.createElement('span');
  rangeMaxEl.className = 'range-max';
  div.appendChild(hover);
  div.appendChild(clonedInput);
  div.appendChild(rangeMinEl);
  div.appendChild(rangeMaxEl);
  rangeMinEl.innerText = clonedInput.min;
  rangeMaxEl.innerText = clonedInput.max;
  updateBubble(input, div);
  return div;
}
