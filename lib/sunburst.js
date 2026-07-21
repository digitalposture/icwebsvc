const { loadCsvContent } = require('./csv');

function buildSunburstResponse(sunburstEntries, datetimeOrLatest = '', options = {}) {
  const entries = Array.isArray(sunburstEntries)
    ? sunburstEntries
    : sunburstEntries && typeof sunburstEntries === 'object'
      ? [sunburstEntries]
      : [];

  const availableDatetimes = entries
    .map((entry) => (entry && typeof entry === 'object' ? entry.datetime : entry))
    .filter(Boolean)
    .sort();

  if (!datetimeOrLatest || datetimeOrLatest === '') {
    return availableDatetimes;
  }

  const selectedDatetime = datetimeOrLatest === 'latest'
    ? availableDatetimes[availableDatetimes.length - 1] || ''
    : datetimeOrLatest;

  if (!selectedDatetime) {
    return [];
  }

  const matchedEntry = entries.find((entry) => {
    const datetime = entry && typeof entry === 'object' ? entry.datetime : entry;
    return datetime === selectedDatetime;
  });

  if (!matchedEntry) {
    return [];
  }

  const stockList = (options.stock_list || options.stockList || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (stockList.length > 0) {
    // Reserved for future filtering; currently ignored and the full CSV is returned.
  }

  const csvContent = matchedEntry.csvContent || matchedEntry.content || '';
  return loadCsvContent(csvContent).trim().split(/\r?\n/).filter(Boolean);
}

module.exports = {
  buildSunburstResponse
};
