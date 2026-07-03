const { loadCsvContent } = require('./csv');

function buildDetailsResponse(csvPath, isinList, options = {}) {
  const content = loadCsvContent(csvPath);
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

  const issuerPrefix = (options.issuer || '').trim().toLowerCase();
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
    const isin = columns[0] || '';
    const issuer = columns[1] || '';
    const name = columns[2] || '';
    const industry = columns[7] || '';

    const matchesIsin = shouldReturnAll || normalizedIsins.includes(isin);
    const matchesIssuer = issuerPrefix === '' || issuer.toLowerCase().startsWith(issuerPrefix);
    const rowText = `${name} ${issuer} ${industry}`.toLowerCase();
    const matchesTickers =
      tickers.length === 0 ||
      tickers.some((ticker) => {
        const normalizedTicker = ticker.toLowerCase();
        const symbol = normalizedTicker.includes(':') ? normalizedTicker.split(':').pop() : normalizedTicker;
        return rowText.includes(normalizedTicker) || rowText.includes(symbol);
      });
    const matchesIndustries =
      industries.length === 0 ||
      industries.some((industryValue) => {
        const normalizedIndustry = industryValue.toLowerCase();
        return (
          industry.toLowerCase().includes(normalizedIndustry) ||
          name.toLowerCase().includes(normalizedIndustry)
        );
      });

    return matchesIsin && matchesIssuer && matchesTickers && matchesIndustries;
  });

  return [header, ...matchedRows];
}

module.exports = {
  buildDetailsResponse
};
