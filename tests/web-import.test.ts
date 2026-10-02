import assert from 'node:assert/strict';
import test from 'node:test';
import { readImportFile } from '../src/web/lib/readImportFile.ts';

test('browser File adapter decodes Korean UTF-8 and BOM without changing JSON/TXT content', async () => {
  const text = '[{"title":"직접 확인한 링크","url":"https://naver.me/example"}]';
  const file = new File(['\ufeff', text], 'links.JSON', { type: '' });
  assert.deepEqual(await readImportFile(file), { text, format: 'json' });
  const txt = 'https://youtu.be/example\r\n';
  assert.deepEqual(await readImportFile(new File([txt], 'links.txt')), { text: txt, format: 'txt' });
});

test('browser File adapter accepts exactly 2MiB and rejects oversized files before reading', async () => {
  const limit = 2 * 1024 * 1024;
  const boundary = new File([' '.repeat(limit)], 'links.txt');
  assert.equal((await readImportFile(boundary)).text.length, limit);
  let read = false;
  const oversized = new File([new Uint8Array(limit + 1)], 'links.txt');
  oversized.arrayBuffer = async () => { read = true; throw new Error('must not read'); };
  await assert.rejects(readImportFile(oversized), /2MiB/);
  assert.equal(read, false);
});

test('invalid encoding, unsupported files and read failures return safe errors instead of partial text', async () => {
  const invalidUtf8 = new File([new Uint8Array([0xc3, 0x28])], 'links.txt');
  await assert.rejects(readImportFile(invalidUtf8), /UTF-8/);
  await assert.rejects(readImportFile(new File(['[]'], 'links.zip')), /JSON 또는 TXT/);
  const unreadable = new File(['[]'], 'private-export.json');
  unreadable.arrayBuffer = async () => { throw new Error('private-export.json: internal disk error'); };
  await assert.rejects(readImportFile(unreadable), error => {
    assert.ok(error instanceof Error);
    assert.match(error.message, /파일을 읽지 못/);
    assert.equal(error.message.includes('private-export'), false);
    assert.equal(error.message.includes('internal disk error'), false);
    return true;
  });
});
