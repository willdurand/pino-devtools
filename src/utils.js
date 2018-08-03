const minimist = require('minimist');

const parseOptions = (argv, defaultOptions) => {
  const keys = Object.keys(defaultOptions);
  const { _, ...options } = minimist(argv, {
    boolean: keys.filter((k) => typeof defaultOptions[k] === 'boolean'),
    default: defaultOptions,
    string: keys.filter((k) => typeof defaultOptions[k] === 'string'),
    unknown: () => false,
  });

  return options;
};

module.exports = { parseOptions };
