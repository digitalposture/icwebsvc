const { buildIssuerResponse } = require('../lib/issuers');
const { buildTickerResponse } = require('../lib/tickers');
const { buildTickersIndexResponse } = require('../lib/tickers_index');
const { buildDetailsResponse } = require('../lib/details');
const { buildCertsGrowthResponse } = require('../lib/certs_growth');
const { buildSunburstResponse } = require('../lib/sunburst');
const { capValue } = require('../lib/utils');

import { env } from "cloudflare:workers";

// Access environment variables at the top level
const isTestMode = env.TEST_MODE === 'true';
const SECRET_KEYS = (env.SECRET_KEYS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

console.log(`TEST MODE ${isTestMode ? 'ENABLED' : 'DISABLED'}`);
console.log(`SECRET KEYS ${SECRET_KEYS.length > 0 ? 'CONFIGURED' : 'NOT CONFIGURED'}`);

function getPathSegments(url) {
  return url.pathname.split('/').filter(Boolean);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  });
}

function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const segments = getPathSegments(url);

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return corsPreflight();
    }

    const R2_DATA_PREFIX = 'ws/';

    function isAuthorized(request) {
      if (isTestMode) {
        return true;
      }

      const authHeader = request.headers.get('authorization') || '';
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      const token = match ? match[1].trim() : '';
      return SECRET_KEYS.includes(token);
    }

    if (!isAuthorized(request)) {
      console.warn(`${new Date().toISOString()} ${request.method} ${url.pathname} missing_or_invalid_bearer`);
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    async function getR2CsvContent(env, key) {
      if (!env?.RWS) return '';
      const object = await env.RWS.get(`${R2_DATA_PREFIX}${key}`);
      return object ? await object.text() : '';
    }

    async function getFolders(env, topN = 5) {
      if (!env?.RWS) return [];

      const prefix = `${R2_DATA_PREFIX}sunburst/`;

      const list = await env.RWS.list({
        prefix,
        delimiter: '/',   // <-- this prevents recursion
      });

      // delimitedPrefixes contains folder names like:
      // "sunburst/2026-07-19T15-00-46/"
      console.log('R2 list delimitedPrefixes:', list.delimitedPrefixes);
      const folders = list.delimitedPrefixes.map(p => {
        const parts = p.split('/');
        return parts[2];  // "2026-07-19T15-00-46"
      });

      return folders.sort((a, b) => b.localeCompare(a)).slice(0, topN); // ISO timestamps sort descending
    }


    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok', service: 'icwebsvc' });
    }

    if (segments[0] === 'issuers') {
      const prefix = segments[1] || '';
      const csvContent = await getR2CsvContent(env, 'issuers.csv');
      const rows = buildIssuerResponse(csvContent, prefix);
      return jsonResponse(rows);
    }

    if (segments[0] === 'tickers') {
      const isinList = segments[1] || '';
      const csvContent = await getR2CsvContent(env, 'tickers.csv');
      const rows = buildTickerResponse(csvContent, isinList, {
        tickers: url.searchParams.get('tickers') || undefined,
        industries: url.searchParams.get('industries') || undefined
      });
      return jsonResponse(rows);
    }

    if (segments[0] === 'tickers_index') {
      const prefix = segments[1] || '';
      const csvContent = await getR2CsvContent(env, 'tickers_index.csv');
      const rows = buildTickersIndexResponse(csvContent, prefix, url.searchParams.get('full'));
      return jsonResponse(rows);
    }

    if (segments[0] === 'details') {
      const isinList = segments[1] || '';
      const csvContent = await getR2CsvContent(env, 'details.csv');
      const rows = buildDetailsResponse(csvContent, isinList, {
        issuer: url.searchParams.get('issuer') || undefined,
        tickers: url.searchParams.get('tickers') || undefined,
        industries: url.searchParams.get('industries') || undefined
      });
      return jsonResponse(rows);
    }

    if (segments[0] === 'certs_growth') {
      const csvContent = await getR2CsvContent(env, 'certs_growth.csv');
      const rows = buildCertsGrowthResponse(csvContent, {
        growth1d: url.searchParams.get('growth1d'),
        parvalue: url.searchParams.get('parvalue')
      });
      return jsonResponse(rows);
    }

    if (segments[0] === 'sunburst') {
      const requestedDatetime = segments[1] || '';
      const exchange = segments[2] || '';
      const topN = capValue(url.searchParams.get('topn'), 5, 10);
      const sunburstEntries = await getFolders(env, topN);
      console.log('Requested sunburst datetime:', requestedDatetime, 'exchange:', exchange, 'available datetimes:', sunburstEntries);
      if (requestedDatetime === '' || sunburstEntries.length === 0) {
        return jsonResponse(sunburstEntries);
      }
      const datetime = requestedDatetime === 'latest'
        ? sunburstEntries[sunburstEntries.length - 1]
        : requestedDatetime;
      if (!sunburstEntries.includes(datetime)) return jsonResponse([]);
      const fileName = exchange === '*' || exchange === '' ? 'ALL.csv' : `${exchange}.csv`;
      const csvContent = await getR2CsvContent(env, `sunburst/${datetime}/${fileName}`);
      const rows = buildSunburstResponse(csvContent, {
        stock_list: url.searchParams.get('stock_list') || url.searchParams.get('stockList') || ''
      });
      return jsonResponse(rows);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  }
};
