const { loadCsvContent } = require('./csv');


function buildSunburstResponse(csvPath, options = {}) {
  //console.log("buildSunburstResponse called with csvPath:", csvPath, "and options:", options);
  const content = loadCsvContent(csvPath);
  const lines = content.trim().split(/\r?\n/);

  if (lines.length === 0) {
    return [];
  }

  const stockList = (options.stock_list || options.stockList || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  if (stockList.length > 0) {
    // Reserved for future filtering
  }

  return lines;
}

module.exports = {
  buildSunburstResponse
};
