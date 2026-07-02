const { buildIssuerResponse } = require('../lib/issuers');
const { buildTickerResponse } = require('../lib/tickers');
const { buildTickersIndexResponse } = require('../lib/tickers_index');
const { buildDetailsResponse } = require('../lib/details');
const { buildCertsGrowthResponse } = require('../lib/certs_growth');
const path = require('node:path');
const fs = require('node:fs');

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const baseDir = path.resolve(__dirname, '..');
const dataDir = path.join(baseDir, 'data');
const ISSUERS_CSV_PATH = path.join(dataDir, 'issuers.csv');
const TICKERS_CSV_PATH = path.join(dataDir, 'tickers.csv');
const TICKERS_INDEX_CSV_PATH = path.join(dataDir, 'tickers_index.csv');
const DETAILS_CSV_PATH = path.join(dataDir, 'details.csv');
const CERTS_GROWTH_CSV_PATH = path.join(dataDir, 'certs_growth.csv');

function getPathSegments(url) {
  return url.pathname.split('/').filter(Boolean);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json;charset=UTF-8' }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const segments = getPathSegments(url);

    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok', service: 'icwebsvc' });
    }

    if (segments[0] === 'issuers') {
      const prefix = segments[1] || '';
      const rows = buildIssuerResponse(ISSUERS_CSV_PATH, prefix);
      return jsonResponse(rows);
    }

    if (segments[0] === 'tickers') {
      const isinList = segments[1] || '';
      const rows = buildTickerResponse(TICKERS_CSV_PATH, isinList, {
        tickers: url.searchParams.get('tickers') || undefined,
        industries: url.searchParams.get('industries') || undefined
      });
      return jsonResponse(rows);
    }

    if (segments[0] === 'tickers_index') {
      const prefix = segments[1] || '';
      const rows = buildTickersIndexResponse(TICKERS_INDEX_CSV_PATH, prefix, url.searchParams.get('full'));
      return jsonResponse(rows);
    }

    if (segments[0] === 'details') {
      const isinList = segments[1] || '';
      const rows = buildDetailsResponse(DETAILS_CSV_PATH, isinList, {
        issuer: url.searchParams.get('issuer') || undefined,
        tickers: url.searchParams.get('tickers') || undefined,
        industries: url.searchParams.get('industries') || undefined
      });
      return jsonResponse(rows);
    }

    if (segments[0] === 'certs_growth') {
      const rows = buildCertsGrowthResponse(CERTS_GROWTH_CSV_PATH, {
        growth1d: url.searchParams.get('growth1d'),
        parvalue: url.searchParams.get('parvalue')
      });
      return jsonResponse(rows);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  }
};
