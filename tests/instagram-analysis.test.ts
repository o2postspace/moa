import assert from 'node:assert/strict';
import test from 'node:test';
import { analysisQuestions, MAX_PREPARED_CHARACTERS, parseAnyJevDecisions, prepareInstagramEvidence } from '../src/domain/instagramAnalysis.ts';

function response(): { decisions: { answer: string; index: number; probs: Record<string, number>; margin: number; route: string; reasoning_tokens?: number }[] } {
  return { decisions: [
    { answer: 'cafe', index: 1, probs: { food: 0.03, cafe: 0.9, event: 0.02, other: 0.05 }, margin: 2.9, route: 'one_forward' },
    { answer: 'enough', index: 0, probs: { enough: 0.9, needs_more: 0.1 }, margin: 2.1, route: 'one_forward', reasoning_tokens: 0 },
  ] };
}

test('evidence only accepts bounded explicitly supplied nonempty text', () => {
  for (const input of [null, [], {}, { caption: ' \n\t' }, { caption: 1 }, { ocr: null }, { caption: 'a'.repeat(8001) }, { caption: 'a'.repeat(5000), transcript: 'b'.repeat(3001) }]) assert.throws(() => prepareInstagramEvidence(input));
  assert.equal(prepareInstagramEvidence({ caption: 'a'.repeat(8000) }).inputCharacters, 8000);
});

test('repeated lines and equivalent Unicode evidence share one text while preserving source accounting', () => {
  const caption = '  성수 카페\t \r\n성수 카페\n2026.10.12–10.15\n#성수 #카페';
  const ocr = '성수 카페\n2026.10.12–10.15';
  const prepared = prepareInstagramEvidence({ caption, ocr });
  assert.equal(prepared.inputCharacters, caption.length + ocr.length);
  assert.deepEqual(prepared.sources, ['caption', 'ocr']);
  assert.equal(prepared.text.split('성수 카페').length - 1, 1);
  assert.match(prepared.text, /2026\.10\.12–10\.15/);
  assert.match(prepared.text, /#성수 #카페/);
  assert.equal(prepared.truncated, false);
  assert.equal(prepareInstagramEvidence({ caption: '가', ocr: '\u1100\u1161' }).text, '[캡션]\n가');
});

test('length budget keeps all evidence channels and both ends, with explicit omission', () => {
  const input = { caption: 'START_CAPTION' + '가'.repeat(2600) + 'END_CAPTION', ocr: 'START_IMAGE' + '나'.repeat(2500) + 'END_IMAGE', transcript: 'START_TRANSCRIPT' + '다'.repeat(2400) + 'END_TRANSCRIPT' };
  const prepared = prepareInstagramEvidence(input);
  assert.ok(prepared.preparedCharacters <= MAX_PREPARED_CHARACTERS);
  assert.equal(prepared.truncated, true);
  for (const marker of ['START_CAPTION', 'END_CAPTION', 'START_IMAGE', 'END_IMAGE', 'START_TRANSCRIPT', 'END_TRANSCRIPT', '[일부 생략]']) assert.ok(prepared.text.includes(marker));
  assert.deepEqual(prepared.sources, ['caption', 'ocr', 'transcript']);
});

test('surrogate pairs are never broken by snippet boundaries', () => {
  const prepared = prepareInstagramEvidence({ caption: '😀'.repeat(3000) });
  assert.ok(prepared.text.length <= MAX_PREPARED_CHARACTERS);
  assert.doesNotThrow(() => encodeURIComponent(prepared.text));
  assert.equal(prepared.truncated, true);
});

test('typed classification asks two closed choices and never extracts free-form place facts', () => {
  const prepared = prepareInstagramEvidence({ caption: '성수 카페에서 쉬었어요' });
  const questions = analysisQuestions(prepared.text);
  assert.deepEqual(questions.map(x => x.options), [['food', 'cafe', 'event', 'other'], ['enough', 'needs_more']]);
  assert.ok(questions.every(x => x.kind === 'choice' && x.state.includes(prepared.text)));
  assert.throws(() => analysisQuestions('a'.repeat(2401)));
});

test('model scores are read with strict answer/index/sum checks and not labeled calibrated accuracy', () => {
  const parsed = parseAnyJevDecisions(response());
  assert.equal(parsed.category.value, 'cafe');
  assert.equal(parsed.category.reasoningTokens, null);
  assert.equal(parsed.evidence.reasoningTokens, 0);
  assert.equal(parsed.reviewRequired, false);
  for (const mutate of [
    (r: ReturnType<typeof response>) => { r.decisions[0].answer = 'event'; },
    (r: ReturnType<typeof response>) => { r.decisions[0].index = 99; },
    (r: ReturnType<typeof response>) => { r.decisions[0].probs.cafe = 0.6; },
    (r: ReturnType<typeof response>) => { r.decisions[0].probs.food = -1; },
    (r: ReturnType<typeof response>) => { r.decisions[0].margin = Infinity; },
    (r: ReturnType<typeof response>) => { r.decisions[0].reasoning_tokens = 12; },
  ]) { const value = response(); mutate(value); assert.throws(() => parseAnyJevDecisions(value)); }
  assert.throws(() => parseAnyJevDecisions({ decisions: [response().decisions[0]] }));
});

test('ambiguous category and inadequate evidence require review', () => {
  const unclear = response();
  unclear.decisions[0].probs = { food: 0.25, cafe: 0.4, event: 0.2, other: 0.15 };
  assert.equal(parseAnyJevDecisions(unclear).reviewRequired, true);
  const missing = response();
  missing.decisions[1] = { ...missing.decisions[1], answer: 'needs_more', index: 1, probs: { enough: 0.1, needs_more: 0.9 } };
  assert.equal(parseAnyJevDecisions(missing).reviewRequired, true);
});

test('worker can explicitly omit a nonfinite margin without inventing a score', () => {
  const value = response();
  const missingMargin = { ...value.decisions[0], margin: null };
  const parsed = parseAnyJevDecisions({ decisions: [missingMargin, value.decisions[1]] });
  assert.equal(parsed.category.value, 'cafe');
  assert.equal(parsed.category.scores.cafe, 0.9);
  assert.equal(parsed.reviewRequired, false);
});
