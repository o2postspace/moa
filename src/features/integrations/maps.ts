import { Linking, Platform } from 'react-native';
import type { NaverPlace } from '../../domain/content';

export function naverPlaceUrl(name: string, address: string): string {
  return 'https://map.naver.com/p/search/' + encodeURIComponent([name, address].filter(Boolean).join(' '));
}
export async function openNaverPlace(name: string, address = '', place?: NaverPlace): Promise<void> {
  const webUrl = naverPlaceUrl(name, address);
  if (Platform.OS === 'web') { await Linking.openURL(webUrl); return; }
  const appname = encodeURIComponent('saved-companion.moa');
  const url = place
    ? `nmap://place?lat=${place.latitude}&lng=${place.longitude}&name=${encodeURIComponent(name)}&appname=${appname}`
    : `nmap://search?query=${encodeURIComponent([name, address].filter(Boolean).join(' '))}&appname=${appname}`;
  try { await Linking.openURL(url); } catch { await Linking.openURL(webUrl); }
}
