import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { runInNewContext } from 'node:vm';

const i18nUrl = new URL('../src/i18n/index.ts', import.meta.url);

// Exercise the real shared formatter without a browser.
function loadFormatDate() {
  const { outputText } = ts.transpileModule(readFileSync(i18nUrl, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require(id) {
      throw new Error(`unexpected require: ${id}`);
    },
  });
  assert.equal(typeof exports.formatDate, 'function', 'i18n must export formatDate');
  return exports.formatDate;
}

const formatDate = loadFormatDate();
const KO_DATE = /^\d{4}\. \d{2}\. \d{2}\.$/;

test('RFQ 등록일: ISO 일시는 ko-KR 날짜로 표시', () => {
  const out = formatDate('2026-11-06T12:00:00.000Z');
  assert.match(out, KO_DATE);
  assert.ok(out.startsWith('2026.'), out);
});

test('RFQ 등록일: epoch·무효값은 1969 대신 대시로 표시', () => {
  for (const v of [undefined, null, '', '   ', 0, -1, '0', '1970-01-01T00:00:00.000Z', 'not-a-date']) {
    assert.equal(formatDate(v), '-', JSON.stringify(v));
  }
});

test('RFQ 등록일: 초 단위 Unix 타임스탬프도 정상 표시', () => {
  const out = formatDate(1762310400); // 2025-11-05 UTC
  assert.match(out, KO_DATE);
  assert.ok(out.startsWith('2025.'), out);
});

test('RFQ 등록일: 밀리초 단위 타임스탬프도 정상 표시', () => {
  const out = formatDate(1762310400000);
  assert.match(out, KO_DATE);
  assert.ok(out.startsWith('2025.'), out);
});
