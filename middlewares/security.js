const mongoSanitize = require('express-mongo-sanitize');

const sanitizePayloads = () => {
  return mongoSanitize({
    replaceWith: '_',
    dryRun: false
  });
};

module.exports = { sanitizePayloads };