'use strict';

const parser = require('./parser');

// A valid output which means nothing has been parsed.
// Used as error return / invalid output
const nothingHappened = {
  prop: {},
  eaten: '',
};

const defaultConfig = {
  defaultValue: () => undefined, // Its a function
};

function parse(value, indexNext, userConfig) {
  const config = {...defaultConfig, ...userConfig};

  // Make defaultValue a function if it isn't
  if (typeof (config.defaultValue) !== 'function') {
    const {defaultValue} = config;
    config.defaultValue = () => defaultValue;
  }

  const prefix = (indexNext > 0) ? value.substr(0, indexNext) : '';
  value = value.substr(indexNext);

  try {
    const parsed = parser.parse(value, config);
    parsed.eaten = prefix + parsed.eaten;
    return parsed;
  } catch (_) {
    return nothingHappened;
  }
}

module.exports = parse;
