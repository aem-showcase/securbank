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
 * Sends an analytics event to alloy
 * @param xdmData - the xdm data object
 * @returns {Promise<*>}
 */
function sendAnalyticsEvent(xdmData) {
  window.adobeDatalayer.push(xdmData);
}

/**
 * Basic tracking for page views with alloy
 * @param document
 * @param additionalXdmFields
 * @returns {Promise<*>}
 */
function analyticsTrackPageViews(document, additionalXdmFields = {}) {
  const xdmData = {
    eventType: 'web.webinteraction.linkClicks',
    web: {
      webPageDetails: {
        pageViews: {
          value: 1,
        },
        name: `${document.title}`,
        URL: `${document.URL}`,
      },
    },
  };

  return sendAnalyticsEvent(xdmData);
}

function analyticsTrackButtonClick(payload, formData, formContext, linkType = 'button', additionalXdmFields = {}) {
  const jsonString = JSON.stringify(payload || {});
  let action = '';
  if (formContext) {
    action = formContext.action;
  }
  console.log(formData);

  const xdmData = {
    eventType: 'web.webinteraction.linkClicks',
    web: {
      webInteraction: {
        // eslint-disable-next-line no-nested-ternary
        name: action,
        linkClicks: {
          value: 1,
        },
        type: linkType,
      },
    },
  };

  // return sendAnalyticsEvent(xdmData);
}

/**
   * Filters out all defined values from the form data using the globals object.
   * @param {object} globaObj- Globals variables object containing form configurations.
   * @returns {object} -Object containing only defined values.
   */
function santizedFormData(globaObj) {
  JSON.parse(JSON.stringify(globaObj.functions.exportData()));
}

/**
   * Removes all undefined keys from the form datand reduces overall size of the object.
   * @param {object} jsonObj
   */
function removeUndefinedKeys(jsonObj) {
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(jsonObj)) {
    if (value === null || value === undefined) delete jsonObj[key];
  }
}

function santizedFormDataWithContext(globals, currentFormContext) {
  try {
    const formData = (Object.prototype.hasOwnProperty.call(globals, 'form') && Object.prototype.hasOwnProperty.call(globals, 'functions')) ? globals.functions.exportData() : globals;
    formData.currentFormContext = currentFormContext;
    if (formData.form) {
      const {
        data, analytics, queryParams, ...formDataPayload
      } = formData;
      removeUndefinedKeys(formDataPayload);
      if (formDataPayload) {
        removeUndefinedKeys(formDataPayload.form);
      }
      return JSON.parse(JSON.stringify(formDataPayload));
    }
    return formData;
  } catch (ex) {
    return null;
  }
}

/**
 * sends data to rum server.
 * @param {object} payload
 * @param {object} globals
 */
function sendDataToRum(payload, globals) {
  // sampleRUM('buttonClick', { source: 'click', target: { payload, globals } });
  // eslint-disable-next-line max-len
  analyticsTrackButtonClick(payload, santizedFormData(globals), santizedFormDataWithContext(globals));
}

// eslint-disable-next-line import/prefer-default-export
export { getFullName, days, sendDataToRum };
