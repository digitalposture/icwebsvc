const fs = require('node:fs');

function buildCertsGrowthResponse(csvPath, options = {}) {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.trim().split(/\r?\n/);

  if (lines.length === 0) {
    return [];
  }

  const [header, ...rows] = lines;
  const growth1d = (options.growth1d || '').toLowerCase();
  const parValue = (options.parvalue || '').toLowerCase();

  if (!growth1d && !parValue) {
    return [];
  }

  const matchedRows = rows.filter((row) => {
    const columns = row.split(';');
    const growth1d = Number(columns[7] || 0);
    const ask = Number(columns[5] || 0);
    const parValueColumn = Number(columns[18] || 0);

    const matchesGrowth =
      growth1d === '' ||
      (growth1d === 'up' && growth1d > 0.0) ||
      (growth1d === 'down' && growth1d < 0.0);

    const matchesParValue =
      parValue === '' ||
      (parValue === 'over' && ask > parValueColumn) ||
      (parValue === 'below' && ask < parValueColumn);

    return matchesGrowth && matchesParValue;
  });

  return [header, ...matchedRows];
}

module.exports = {
  buildCertsGrowthResponse
};
