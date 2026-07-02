const fs = require('node:fs');

function buildTickersIndexResponse(csvPath, namePrefix, full = false) {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.trim().split(/\r?\n/);

  if (lines.length === 0) {
    return [];
  }

  const [header, ...rows] = lines;
  const normalizedPrefix = (namePrefix || '').toLowerCase();
  const shouldReturnAll = normalizedPrefix === '*' || normalizedPrefix === '';
  const returnFullColumns = full === true || full === 'true';

  const matchedRows = (shouldReturnAll
    ? rows
    : rows.filter((row) => {
        const columns = row.split(';');
        const stockName = columns[1] || '';
        const ticker = columns[0] || '';

        if (normalizedPrefix.includes(':')) {
          return ticker.toLowerCase() === normalizedPrefix;
        }

        return stockName.toLowerCase().startsWith(normalizedPrefix);
      })
  );

  if (returnFullColumns) {
    return [header, ...matchedRows];
  }

  return ['stock_google_finance_ticker;stock_name', ...matchedRows.map((row) => {
    const columns = row.split(';');
    return `${columns[0] || ''};${columns[1] || ''}`;
  })];
}

module.exports = {
  buildTickersIndexResponse
};
