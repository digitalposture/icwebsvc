const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildCertsGrowthResponse } = require('../lib/certs_growth');

test('buildCertsGrowthResponse returns empty when no filter is passed', () => {
  const csvPath = path.join(__dirname, '..', 'data', 'certs_growth.csv');
  const response = buildCertsGrowthResponse(csvPath, {});

  assert.deepEqual(response, []);
});

test('buildCertsGrowthResponse filters by growth direction and par value comparison', () => {
  const csvPath = path.join(__dirname, '..', 'data', 'certs_growth.csv');
  const response = buildCertsGrowthResponse(csvPath, {
    growth1d: 'up',
    parvalue: 'below'
  });

  assert.ok(response.length > 1);
  assert.equal(response[0], 'isin;issuer;name;coupon;next_ex_date;ask;bid;Growth_1D;Growth_3Ds;Growth_1W;Growth_2W;Growth_4W;Growth_1D_Pct;Growth_3Ds_Pct;Growth_1W_Pct;Growth_2W_Pct;Growth_4W_Pct;Last_Update_DT;Par_Value');
  const matchingRows = response.slice(1).filter((row) => row.trim());
  assert.ok(matchingRows.length > 0);
  const firstRow = matchingRows[0].split(';');
  assert.ok(Number(firstRow[7]) > 0);
  assert.ok(Number(firstRow[5]) < Number(firstRow[18]));
});
