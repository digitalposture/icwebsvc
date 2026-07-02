const fs = require('node:fs');

function buildTickerResponse(csvPath, isinList, options = {}) {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.trim().split(/\r?\n/);

  if (lines.length === 0) {
    return [];
  }

  const [header, ...rows] = lines;
  const normalizedIsins = (isinList || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const shouldReturnAll = normalizedIsins.length === 0 || normalizedIsins.includes('*');

  const tickers = (options.tickers || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const industries = (options.industries || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const matchedRows = rows.filter((row) => {
    const columns = row.split(';');
    const certificateIsin = columns[0] || '';
    const ticker = columns[3] || '';
    const stockIndustry = columns[6] || '';
    const stockSector = columns[7] || '';

    const matchesIsin = shouldReturnAll || normalizedIsins.includes(certificateIsin);
    const matchesTickers = tickers.length === 0 || tickers.includes(ticker);
    const matchesIndustries =
      industries.length === 0 ||
      industries.some((industry) => {
        const normalizedIndustry = industry.toLowerCase();
        return (
          stockIndustry.toLowerCase().includes(normalizedIndustry) ||
          stockSector.toLowerCase().includes(normalizedIndustry)
        );
      });

    return matchesIsin && matchesTickers && matchesIndustries;
  });

  return [header, ...matchedRows];
}

module.exports = {
  buildTickerResponse
};
