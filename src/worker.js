const { buildIssuerResponse } = require('../lib/issuers');
const { buildTickerResponse } = require('../lib/tickers');
const { buildTickersIndexResponse } = require('../lib/tickers_index');
const { buildDetailsResponse } = require('../lib/details');
const { buildCertsGrowthResponse } = require('../lib/certs_growth');

import { env } from "cloudflare:workers";

// Access environment variables at the top level
const isTestMode = env.TEST_MODE === 'true';

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
    const R2_DATA_PREFIX = 'ws/';

    const SECRET_KEYS = (env.SECRET_KEYS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    function isAuthorized(request) {
      console.log(`TEST MODE ${isTestMode ? 'ENABLED' : 'DISABLED'}`);
      console.log(`SECRET KEYS ${SECRET_KEYS.length > 0 ? 'CONFIGURED' : 'NOT CONFIGURED'}`);

      if (isTestMode) {
        return true;
      }

      const authHeader = request.headers.get('authorization') || '';
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      const token = match ? match[1].trim() : '';
      return SECRET_KEYS.includes(token);
    }

    if (!isAuthorized(request)) {
      console.warn(`${new Date().toISOString()} ${request.method} ${url.pathname} missing_or_invalid_bearer, ${token}`);
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return corsPreflight();
    }

    async function getR2CsvContent(env, key) {
      if (!env?.RWS) return '';
      const object = await env.RWS.get(`${R2_DATA_PREFIX}${key}`);
      return object ? await object.text() : '';
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

    return jsonResponse({ error: 'Not found' }, 404);
  }
};
