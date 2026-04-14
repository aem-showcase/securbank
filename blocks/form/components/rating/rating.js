/**
 * Decorates a number-input field as an NPS-style rating widget.
 *
 * Max is read from the input's `max` attribute (set via the Validation tab's
 * "Maximum" field), defaulting to 10.  Zone thresholds scale proportionally:
 *   0 – round(max × 0.6) → detractors  (red,    low label)
 *   …  – round(max × 0.8) → passives    (orange, mid label)
 *   …  – max              → promoters   (green,  high label)
 * For max=10 this gives the standard NPS split: 0–6 / 7–8 / 9–10.
 *
 * @param {HTMLElement} fieldDiv  - the field wrapper element
 * @param {Object}      fieldJson - the field model from the form definition
 */
function decorateNPS(fieldDiv, fieldJson) {
  // displayFormat causes form.js to change input type to "text", so fall back
  // to any input if the number input is not found.
  const input = fieldDiv.querySelector('input[type="number"]') || fieldDiv.querySelector('input');
  const enabled = fieldJson?.enabled !== false;
  const readOnly = fieldJson?.readOnly === true;
  const props = fieldJson?.properties || {};
  const labelLow = props.npsLabelLow || 'Not likely';
  const labelMid = props.npsLabelMid || 'May be';
  const labelHigh = props.npsLabelHigh || 'Very likely';

  // Reuse the existing maximum validation field — no separate authoring knob needed.
  const max = parseInt(input?.getAttribute('max'), 10) || 10;
  const lowEnd = Math.round(max * 0.6); // last value in the low (red) zone
  const midEnd = Math.round(max * 0.8); // last value in the mid (orange) zone

  input.style.display = 'none';

  const npsDiv = document.createElement('div');
  npsDiv.className = 'nps-rating';
  if (!enabled || readOnly) npsDiv.classList.add('disabled');

  // ── Number buttons row (0 – max) ────────────────────────────────
  const numberRow = document.createElement('div');
  numberRow.className = 'nps-number-row';
  numberRow.style.gridTemplateColumns = `repeat(${max + 1}, 1fr)`;

  for (let i = 0; i <= max; i += 1) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nps-btn';
    // eslint-disable-next-line no-nested-ternary
    btn.classList.add(i <= lowEnd ? 'zone-low' : i <= midEnd ? 'zone-mid' : 'zone-high');
    btn.textContent = i;

    if (!enabled || readOnly) {
      btn.disabled = true;
    } else {
      btn.addEventListener('click', () => {
        numberRow.querySelectorAll('.nps-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        input.value = i;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    numberRow.append(btn);
  }

  // ── Coloured zone bar ────────────────────────────────────────────
  // flex values match the button count in each zone so bar segments align
  // exactly with the button boundaries.
  const lowCount = lowEnd + 1;
  const midCount = midEnd - lowEnd;
  const highCount = max - midEnd;

  const zoneBar = document.createElement('div');
  zoneBar.className = 'nps-zone-bar';
  [
    { cls: 'zone-low', flex: lowCount },
    { cls: 'zone-mid', flex: midCount },
    { cls: 'zone-high', flex: highCount },
  ].forEach(({ cls, flex }) => {
    const seg = document.createElement('div');
    seg.className = `nps-zone-seg ${cls}`;
    seg.style.flex = flex;
    zoneBar.append(seg);
  });

  // ── Labels row ───────────────────────────────────────────────────
  // Each label span gets the same flex value as its zone bar segment so the
  // text aligns with the coloured zone regardless of max.
  const labelsRow = document.createElement('div');
  labelsRow.className = 'nps-labels-row';
  [
    { cls: 'zone-low', text: labelLow, flex: lowCount },
    { cls: 'zone-mid', text: labelMid, flex: midCount },
    { cls: 'zone-high', text: labelHigh, flex: highCount },
  ].forEach(({ cls, text, flex }) => {
    const lbl = document.createElement('span');
    lbl.className = `nps-label ${cls}`;
    lbl.style.flex = flex;
    lbl.textContent = text;
    labelsRow.append(lbl);
  });

  npsDiv.append(numberRow, zoneBar, labelsRow);
  fieldDiv.append(npsDiv);
  return fieldDiv;
}

// create a function to create a rating component
// the function will take a fieldDiv that contains a input type number element
// the function will convert the input element to a rating component
// the rating component will have max value of max attribute set in the input element
// and the value of the input element will be set to the value of the component
// the rating component will have a star element for each value from 1 to max
// the function will return the fieldDiv with the rating component
// the function will also hide the input element
// when a star element is clicked, the value of the input element will be set to the
// index of the star element
// and the selected class will be added to the star elements till the index
// of the clicked star element
// and the selected class will be removed from the star elements after the
// index of the clicked star element
// the function will also add a mouseover event listener to the star element
// when a star element is hovered, a css hover class will be added to the star
// elements till the index of the hovered star element
export default function decorate(fieldDiv, fieldJson) {
  if (fieldJson?.properties?.variant === 'nps') {
    return decorateNPS(fieldDiv, fieldJson);
  }

  // get the input element from the fieldDiv
  const input = fieldDiv.querySelector('input[type="number"]');
  const enabled = fieldJson?.enabled;
  const readOnly = fieldJson?.readOnly;

  // get the max attribute from the input element
  let max = input.getAttribute('max');
  if (!max) {
    max = 5;
  }
  // create a div element to contain the rating component
  const ratingDiv = document.createElement('div');
  // add the rating class to the rating div
  ratingDiv.classList.add('rating');
  ratingDiv.classList.add('hover');

  // Add disabled class if the component is not enabled or is readonly
  if (enabled === false || readOnly === true) {
    ratingDiv.classList.add('disabled');
  }

  // create a star element for each value from 1 to max
  for (let i = 1; i <= max; i += 1) {
    // create a star element
    const star = document.createElement('span');
    // add the star class to the star element
    star.classList.add('star');
    // add the text content to star element
    star.textContent = '★';
    // add the star element to the rating div
    ratingDiv.appendChild(star);

    // add a click event listener to the star element
    star.addEventListener('click', () => {
      // Only process click if the component is not disabled
      if (!ratingDiv.classList.contains('disabled')) {
        // set the value of the input element to the index of the star element
        input.value = i;
        // trigger a change event that bubbles on the input element
        input.dispatchEvent(new Event('change', { bubbles: true }));
        // add the selected class to the star elements till the index of the clicked star element
        for (let j = 0; j < i; j += 1) {
          ratingDiv.children[j].classList.add('selected');
        }
        // remove the selected class from the star elements after the index of the
        // clicked star element
        for (let j = i; j < max; j += 1) {
          ratingDiv.children[j].classList.remove('selected');
        }
      }
    });

    // add a mouseover event listener to the star element
    star.addEventListener('mouseover', () => {
      // Only process hover if the component is not disabled
      if (!ratingDiv.classList.contains('disabled')) {
        // add the css hover class to the star
        // elements till the index of the hovered star element
        // and remove the css hover class from the star
        // elements after the index of the hovered star element
        for (let j = 0; j < i; j += 1) {
          ratingDiv.children[j].classList.add('hover');
        }
        for (let j = i; j < max; j += 1) {
          ratingDiv.children[j].classList.remove('hover');
        }

        // show an emoji in the emoji element when the star element is hovered
        // if the index of star element is less than or equal to 3 show sad emoji
        // if the index of star element is greater than 3 show happy emoji
        const emojiElement = ratingDiv.querySelector('.emoji');
        if (i <= 3) {
          emojiElement.textContent = '😢';
        } else {
          emojiElement.textContent = '😊';
        }
      }
    });
  }

  // add the emoji element next to the last star element
  const emoji = document.createElement('span');
  emoji.classList.add('emoji');
  ratingDiv.appendChild(emoji);

  // add a mouseleave event listener to the rating div
  ratingDiv.addEventListener('mouseleave', () => {
    // Only process mouseleave if the component is not disabled
    if (!ratingDiv.classList.contains('disabled')) {
      // check if no star is selected
      if (!ratingDiv.querySelector('.selected')) {
        // remove the hover class from the star elements
        for (let j = 0; j < max; j += 1) {
          ratingDiv.children[j].classList.remove('hover');
        }
        // remove the emoji from the emoji element
        const emojiElement = ratingDiv.querySelector('.emoji');
        emojiElement.textContent = '';
      }
    }
  });

  // add the rating div to the fieldDiv
  fieldDiv.appendChild(ratingDiv);
  // hide the input element
  input.style.display = 'none';
  // return the fieldDiv with the rating component
  const helpText = fieldDiv.querySelector('.field-description');
  if (helpText) {
    fieldDiv.append(helpText);
  }
  return fieldDiv;
}
