const MAX_FILE_BYTES = 2 * 1024 * 1024;

export async function readImportFile(file: File): Promise<{ text: string; format: 'txt' | 'json' }> {
  if (file.size > MAX_FILE_BYTES) throw new Error('2MiB 이하의 JSON 또는 TXT 파일을 선택해 주세요.');
  const format = file.name.split('.').pop()?.toLowerCase();
  if (format !== 'txt' && format !== 'json') throw new Error('JSON 또는 TXT 파일을 선택해 주세요. ZIP 파일은 먼저 압축을 풀어 주세요.');
  let bytes: ArrayBuffer;
  try { bytes = await file.arrayBuffer(); }
  catch { throw new Error('파일을 읽지 못했어요. 파일을 다시 선택해 주세요.'); }
  if (bytes.byteLength > MAX_FILE_BYTES) throw new Error('2MiB 이하의 JSON 또는 TXT 파일을 선택해 주세요.');
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error('UTF-8로 저장된 JSON 또는 TXT 파일을 선택해 주세요.'); }
  return { text, format };
}
