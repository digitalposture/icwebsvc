const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildIssuerResponse } = require('../lib/issuers');

test('buildIssuerResponse filters issuer rows by name prefix', () => {
  const csvPath = path.join(__dirname, '..', 'data', 'issuers.csv');
  const response = buildIssuerResponse(csvPath, 'bnp');

  assert.deepEqual(response, [
    'issuer_name;specialization;geo_region;issuer_rating_description;issuer_rating_class;website',
    'BNP Paribas S.A.;Banking and Financial Services;France;Investment Grade;High;https://www.test.com'
  ]);
});

test('buildIssuerResponse returns all rows for wildcard prefix', () => {
  const csvPath = path.join(__dirname, '..', 'data', 'issuers.csv');
  const response = buildIssuerResponse(csvPath, '*');

  assert.equal(response[0], 'issuer_name;specialization;geo_region;issuer_rating_description;issuer_rating_class;website');
  assert.equal(response.length, 7);
});
