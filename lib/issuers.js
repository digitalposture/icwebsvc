const { loadCsvContent } = require('./csv');

function buildIssuerResponse(csvPath, namePrefix) {
  const content = loadCsvContent(csvPath);
  const lines = content.trim().split(/\r?\n/);

  if (lines.length === 0) {
    return [];
  }

  const [header, ...rows] = lines;
  const normalizedPrefix = (namePrefix || '').toLowerCase();
  const shouldReturnAll = normalizedPrefix === '*';

  const matchedRows = shouldReturnAll
    ? rows
    : rows.filter((row) => {
        const [issuerName] = row.split(';');
        return issuerName.toLowerCase().startsWith(normalizedPrefix);
      });

  return [header, ...matchedRows];
}

module.exports = {
  buildIssuerResponse
};
