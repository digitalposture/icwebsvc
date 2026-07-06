function loadCsvContent(csvSource) {
  if (typeof csvSource !== 'string') {
    return '';
  }

  if (csvSource.includes('\n') || csvSource.includes('\r')) {
    return csvSource;
  }

  const fs = require('node:fs');
  return fs.readFileSync(csvSource, 'utf8');
}

module.exports = {
  loadCsvContent
};
