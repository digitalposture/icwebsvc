const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildDetailsResponse } = require('../lib/details');

test('buildDetailsResponse filters by ISIN list and optional issuer/ticker/industry filters', () => {
  const csvPath = path.join(__dirname, '..', 'data', 'details.csv');
  const response = buildDetailsResponse(csvPath, 'CH1525083577', {
    issuer: 'Leonteq',
    tickers: 'NASDAQ:MU',
    industries: 'Financials'
  });

  assert.equal(response[0], 'isin;issuer;name;certificate_type_tags;memory_effect;phase;currency;industry;callable;strike_date;issue_date;rembursement_date;autocallable_date;capital_barrier;airbag;risk_level;coupon_amount;coupon_recurrence;coupon_next_ex_date;coupon_type;coupon_barrier;leverage;exchange_risk');
  assert.equal(response.length, 1);
});
