const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildSunburstResponse } = require('../lib/sunburst');
const { loadCsvContent } = require('../lib/csv');

function buildSunburstEntries(rootPath) {
  return fs.readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((datetime) => ({
      datetime,
      csvContent: loadCsvContent(path.join(rootPath, datetime, 'ALL.csv'))
    }));
}

test('buildSunburstResponse lists available sunburst datetimes', () => {
  const rootPath = path.join(__dirname, '..', 'data', 'sunburst');
  const response = buildSunburstResponse(buildSunburstEntries(rootPath), '');

  assert.deepEqual(response, ['2026-07-15T11-00-00', '2026-07-19T11-00-46']);
});

test('buildSunburstResponse returns a specific sunburst CSV as strings', () => {
  const rootPath = path.join(__dirname, '..', 'data', 'sunburst');
  const response = buildSunburstResponse(buildSunburstEntries(rootPath), '2026-07-19T11-00-46');

  assert.equal(response[0], 'ids;labels;parents;values;counts;avgs');
  assert.ok(response.includes('NYSE;NYSE;;0.64;24;0.03'));
});

test('buildSunburstResponse returns the latest sunburst CSV', () => {
  const rootPath = path.join(__dirname, '..', 'data', 'sunburst');
  const response = buildSunburstResponse(buildSunburstEntries(rootPath), 'latest');

  assert.equal(response[0], 'ids;labels;parents;values;counts;avgs');
  assert.ok(response.includes('BIT;BIT;;-16.29;23;-0.71'));
});
