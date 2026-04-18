/**
 * Get Full Name
 * @name getFullName Concats first name and last name
 * @param {string} firstname in Stringformat
 * @param {string} lastname in Stringformat
 * @return {string}
 */
function getFullName(firstname, lastname) {
  return `${firstname} ${lastname}`.trim();
}

/**
 * Custom submit function
 * @param {scope} globals
 */
function submitFormArrayToString(globals) {
  const data = globals.functions.exportData();
  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) {
      data[key] = data[key].join(',');
    }
  });
  globals.functions.submitForm(data, true, 'application/json');
}

/**
 * Calculate the number of days between two dates.
 * @param {*} endDate
 * @param {*} startDate
 * @returns {number} returns the number of days between two dates
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // return zero if dates are valid
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * Handles the success response after a form submission.
 * @param {scope} globals - globals object with form instance and invoke method.
 * @returns {void}
 */
function customSubmitSuccessHandler(globals) {
  const { event } = globals;
  const submitSuccessResponse = event.payload.body;

  if (submitSuccessResponse) {
    if (submitSuccessResponse.redirectUrl) {
      window.location.href = encodeURI(submitSuccessResponse.redirectUrl);
    } else if (submitSuccessResponse.thankYouMessage) {
      // eslint-disable-next-line no-alert
      alert(submitSuccessResponse.thankYouMessage);
    }
  }
}

/**
 * Generates a unique ID using crypto.randomUUID when available, with a fallback.
 * @returns {string} A unique identifier string.
 */
function generateUniqueId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r % 4) + 8;
    return v.toString(16);
  });
}

const REST_ENDPOINT = 'https://simple-mock-api.adobe-aem-hackathon.workers.dev/api/data';

/**
 * Submits form data to a REST endpoint and writes the returned id into the hidden 'id' field.
 * @param {scope} globals - globals object with form instance and invoke method.
 * @returns {Promise<void>}
 */
function submitToRestEndpoint(globals) {
  const data = globals.functions.exportData();
  return fetch(REST_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((response) => response.json());
}

// eslint-disable-next-line import/prefer-default-export
export {
  getFullName,
  days,
  generateUniqueId,
  submitFormArrayToString,
  customSubmitSuccessHandler,
  submitToRestEndpoint,
};
