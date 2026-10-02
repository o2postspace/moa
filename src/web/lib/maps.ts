import type { NaverPlace } from '../../domain/content';

export function naverMapUrl(placeName: string, address = '', place?: NaverPlace): string {
  const name = placeName.trim() || place?.name.trim() || '';
  const location = address.trim() || place?.address.trim() || '';
  const query = [name, location].filter(Boolean).join(' ');
  return query ? 'https://map.naver.com/p/search/' + encodeURIComponent(query) : 'https://map.naver.com/';
}
