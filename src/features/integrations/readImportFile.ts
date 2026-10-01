import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

export async function readImportFile(): Promise<{ text: string; format: 'txt' | 'json' } | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size !== undefined && asset.size > 2 * 1024 * 1024) throw new Error('2MB 이하의 JSON 또는 TXT 파일을 선택해 주세요.');
  const extension = asset.name.split('.').pop()?.toLowerCase();
  if (extension !== 'txt' && extension !== 'json') throw new Error('JSON 또는 TXT 파일을 선택해 주세요. ZIP 파일은 먼저 압축을 풀어 주세요.');
  const text = Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
  return { text, format: extension };
}
