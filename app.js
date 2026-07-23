const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { buildIssuerResponse } = require('./lib/issuers');
const { buildTickerResponse } = require('./lib/tickers');
const { buildTickersIndexResponse } = require('./lib/tickers_index');
const { buildDetailsResponse } = require('./lib/details');
const { buildCertsGrowthResponse } = require('./lib/certs_growth');
const { buildSunburstResponse } = require('./lib/sunburst');
const { loadCsvContent } = require('./lib/csv');
const { capValue } = require('./lib/utils');

const app = express();
const PORT = process.env.PORT || 3000;

// AUTHENTICATION CONFIGURATION
const SECRET_KEYS = (process.env.SECRET_KEYS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const TEST_MODE = (process.env.TEST_MODE || '').toLowerCase() === 'true';
const AUTH_LOG_PATH = path.join(__dirname, 'auth.log');

// DATA CSV FILE PATHS
const ISSUERS_CSV_PATH = path.join(__dirname, 'data', 'issuers.csv');
const TICKERS_CSV_PATH = path.join(__dirname, 'data', 'tickers.csv');
const TICKERS_INDEX_CSV_PATH = path.join(__dirname, 'data', 'tickers_index.csv');
const DETAILS_CSV_PATH = path.join(__dirname, 'data', 'details.csv');
const CERTS_GROWTH_CSV_PATH = path.join(__dirname, 'data', 'certs_growth.csv');
const SUNBURST_ROOT_PATH = path.join(__dirname, 'data', 'sunburst');

app.use(express.json());

app.use((req, res, next) => {
  console.log('TEST MODE:', TEST_MODE);
  if (TEST_MODE) {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : '';
  console.log('TOKEN:', token, SECRET_KEYS.includes(token) ? 'VALID' : 'INVALID');

  if (SECRET_KEYS.includes(token)) {
    return next();
  }

  const logEntry = `${new Date().toISOString()} ${req.method} ${req.originalUrl} missing_or_invalid_bearer, ${token}\n`;
  fs.appendFileSync(AUTH_LOG_PATH, logEntry, 'utf8');
  return res.status(401).json({ error: 'Unauthorized' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'icwebsvc' });
});

app.get(['/issuers/:namePrefix', '/issuers/*'], (req, res) => {
  const prefix = req.params.namePrefix ?? req.params[0] ?? '';
  const rows = buildIssuerResponse(ISSUERS_CSV_PATH, prefix);
  res.json(rows);
});

app.get(['/tickers/:isin_list', '/tickers/*'], (req, res) => {
  const isinList = req.params.isin_list ?? req.params[0] ?? '';
  const rows = buildTickerResponse(TICKERS_CSV_PATH, isinList, {
    tickers: req.query.tickers,
    industries: req.query.industries
  });
  res.json(rows);
});

/*
    parameters:
      - name: namePrefix
        in: path
        description: The prefix to filter the tickers by. Use '*' to return all tickers. If in format 'stock_google_finance_ticker', it will match the exact ticker. Otherwise, it will match the stock name starting with the prefix.
        required: true
        schema:
          type: string
      - name: full
        in: query
        description: If set to 'true', returns the full columns of the tickers index. Otherwise, returns only the stock_google_finance_ticker and stock_name columns.
        required: false
        schema:
          type: boolean
    responses:
      200:
        description: A list of tickers matching the specified prefix.
        content:
          application/json:
            schema:
              type: array
              items:
                type: string    
*/
app.get(['/tickers_index/:namePrefix', '/tickers_index/*'], (req, res) => {
  const prefix = req.params.namePrefix ?? req.params[0] ?? '';
  const rows = buildTickersIndexResponse(TICKERS_INDEX_CSV_PATH, prefix, req.query.full);
  res.json(rows);
});

app.get(['/details/:isin_list', '/details/*'], (req, res) => {
  const isinList = req.params.isin_list ?? req.params[0] ?? '';
  const rows = buildDetailsResponse(DETAILS_CSV_PATH, isinList, {
    issuer: req.query.issuer,
    tickers: req.query.tickers,
    industries: req.query.industries
  });
  res.json(rows);
});

app.get('/certs_growth', (req, res) => {
  const rows = buildCertsGrowthResponse(CERTS_GROWTH_CSV_PATH, {
    growth1d: req.query.growth1d,
    parvalue: req.query.parvalue
  });
  res.json(rows);
});

app.get(['/sunburst', '/sunburst/latest/:exchange', '/sunburst/:datetime/:exchange'], (req, res) => {
  const requestedDatetime = req.params.datetime || '';
  const exchange = req.params.exchange || '';
  const isLatest =  req.path.startsWith('/sunburst/latest');
  const topN = capValue(req.query.topn, 5, 10);
  // console.log('Requested sunburst datetime:', requestedDatetime, 'exchange:', exchange, 'isLatest:', isLatest);
  const sunburstEntries = fs.existsSync(SUNBURST_ROOT_PATH)
      ? fs.readdirSync(SUNBURST_ROOT_PATH, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
          .sort((a, b) => b.localeCompare(a)).slice(0, topN)
      : [];
  if ( (requestedDatetime === '' && !isLatest) || sunburstEntries.length === 0 ) return res.json(sunburstEntries);
  const datetime = isLatest? sunburstEntries[sunburstEntries.length - 1] : requestedDatetime;
  
  if (!sunburstEntries.includes(datetime)) return res.json([]);

  const fileName = exchange === '*' || exchange === ''
    ? 'ALL.csv'
    : `${exchange}.csv`;
  const rows = buildSunburstResponse(path.join(SUNBURST_ROOT_PATH, datetime, fileName), {
    stock_list: req.query.stock_list || req.query.stockList || ''
  });
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`TEST MODE ${TEST_MODE ? 'ENABLED' : 'DISABLED'}`);
  console.log(`SECRET KEYS ${SECRET_KEYS.length > 0 ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  console.log(`REST API listening on port ${PORT}`);
});
