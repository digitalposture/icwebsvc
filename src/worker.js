const { buildIssuerResponse } = require('../lib/issuers');
const { buildTickerResponse } = require('../lib/tickers');
const { buildTickersIndexResponse } = require('../lib/tickers_index');
const { buildDetailsResponse } = require('../lib/details');
const { buildCertsGrowthResponse } = require('../lib/certs_growth');

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
    const R2_DATA_PREFIX = 'ws/';

    async function getR2CsvContent(env, key) {
      if (!env?.RWS) {
        return '';
      }

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
