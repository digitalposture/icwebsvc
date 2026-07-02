const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildTickerResponse } = require('../lib/tickers');

test('buildTickerResponse filters ticker rows by exact ISIN list', () => {
  const csvPath = path.join(__dirname, '..', 'data', 'tickers.csv');
  const response = buildTickerResponse(csvPath, 'IT0006772583,IT0006770512');

  assert.equal(response[0], 'certificate_isin;certificate_name;stock_name;stock_google_finance_ticker;stock_exchange;stock_isin;stock_industry;stock_sector');
  assert.equal(response[1].split(';')[0], 'IT0006772583');
  assert.equal(response[2].split(';')[0], 'IT0006770512');
});

test('buildTickerResponse supports ticker and industry filters with AND semantics', () => {
  const csvPath = path.join(__dirname, '..', 'data', 'tickers.csv');
  const response = buildTickerResponse(csvPath, '*', {
    tickers: 'NASDAQ:MU',
    industries: 'Semiconductors'
  });

  assert.equal(response[0], 'certificate_isin;certificate_name;stock_name;stock_google_finance_ticker;stock_exchange;stock_isin;stock_industry;stock_sector');
  assert.equal(response[1].split(';')[3], 'NASDAQ:MU');
  assert.equal(response[1].split(';')[6].toLowerCase(), 'semiconductors');
});
