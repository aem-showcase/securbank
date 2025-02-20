export function getRules(fd) {
  const entries = [
    ['Value', fd?.['Value Expression']],
    ['Hidden', fd?.['Hidden Expression']],
    ['Label', fd?.['Label Expression']],
  ];
  return entries.filter((e) => e[1]).map(([prop, expression]) => ({
    prop,
    expression,
  }));
}

function extractRules(data) {
  return data
    .reduce(({ fieldIdMap, rules }, fd, index) => {
      const currentRules = getRules(fd);
      return {
        fieldIdMap: {
          ...fieldIdMap,
          [index + 2]: fd.Id,
        },
        rules: currentRules.length ? rules.concat([[fd.Id, currentRules]]) : rules,
      };
    }, { fieldIdMap: {}, rules: [] });
}

export async function applyRuleEngine(form, fragments, formTag) {
  try {
    const RuleEngine = (await import('./RuleEngine.js')).default;
    const fragmentData = Object.entries(fragments).reduce((finalData, [fragmentName, data]) => {
      const { fieldIdMap, rules: fragmentRules } = extractRules(data);
      finalData.fieldIdMap[fragmentName] = fieldIdMap;
      finalData.rules[fragmentName] = fragmentRules;
      return finalData;
    }, { fieldIdMap: {}, rules: {} });

    const formData = extractRules(form);
    const fieldIdMap = {
      'helix-default': formData.fieldIdMap,
      ...fragmentData.fieldIdMap,
    };
    const rules = {
      'helix-default': formData.rules,
      ...fragmentData.rules,
    };

    const ruleEngine = new RuleEngine(rules, fieldIdMap, formTag);
    ruleEngine.enable();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('unable to apply rules ', e);
  }
}
