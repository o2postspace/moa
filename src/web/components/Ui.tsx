import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';
import { Bookmark, Plus, ArrowLeft, ArrowUpRight, Search, Check, MapPin, Video, Camera, FileText, Grid2X2, Sparkles, ChevronDown, X, Pencil, Link as LinkIcon, Copy, SlidersHorizontal, TriangleAlert, LoaderCircle, CircleCheck, Calendar, ShieldCheck, ExternalLink, Download } from 'lucide-react';
import { CATEGORIES, SOURCES, displayContentTitle, type Category, type SavedContent, type SourceType } from '../../domain/content';

const icons = { bookmark: Bookmark, plus: Plus, 'arrow-left': ArrowLeft, 'arrow-up-right': ArrowUpRight, search: Search, check: Check, 'map-pin': MapPin, youtube: Video, instagram: Camera, file: FileText, grid: Grid2X2, sparkles: Sparkles, 'chevron-down': ChevronDown, x: X, edit: Pencil, link: LinkIcon, copy: Copy, filter: SlidersHorizontal, alert: TriangleAlert, loader: LoaderCircle, 'check-circle': CircleCheck, calendar: Calendar, shield: ShieldCheck, 'external-link': ExternalLink, import: Download };
export type IconName = keyof typeof icons;
export function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  const Svg = icons[name];
  return <Svg size={size} strokeWidth={1.7} aria-hidden="true" className={className} />;
}

export function Button({ variant = 'primary', icon, loading, children, className = '', disabled, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; icon?: IconName; loading?: boolean }) {
  return <button {...props} type={type} className={`button button-${variant} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined}>
    {loading ? <Icon name="loader" className="spin" /> : icon ? <Icon name={icon} /> : null}{children}
  </button>;
}

export function PageHeading({ title, subtitle, kicker, backTo, action, className = '' }: { title: string; subtitle?: string; kicker?: string; backTo?: string; action?: ReactNode; className?: string }) {
  return <header className={`page-heading ${className}`}>
    <div>{backTo && <Link className="back-link" to={backTo}><Icon name="arrow-left" size={18} />저장함으로</Link>}{kicker && <p className="kicker">{kicker}</p>}<h1>{title}</h1>{subtitle && <p className="page-subtitle">{subtitle}</p>}</div>
    {action && <div className="heading-action">{action}</div>}
  </header>;
}

export function SourceBadge({ source }: { source: SourceType }) {
  const icon: IconName = source === 'youtube' || source === 'instagram' ? source : source === 'naver' ? 'map-pin' : 'link';
  return <span className={`source-badge source-${source}`}><Icon name={icon} size={15} />{SOURCES.find(item => item.id === source)?.label}</span>;
}

export function CategoryStamp({ category, visited = false, large = false }: { category: Category; visited?: boolean; large?: boolean }) {
  const label = CATEGORIES.find(item => item.id === category)?.label ?? '기타';
  return <div className={`category-stamp stamp-${category} ${large ? 'stamp-large' : ''}`} aria-hidden="true"><span className="stamp-caption">PINMAP COLLECTION</span><span className="stamp-symbol">{category === 'food' ? '밥' : category === 'cafe' ? '차' : category === 'event' ? '날' : '핀'}</span><span className="stamp-label">{label}</span>{visited && <span className="stamp-visited"><Icon name="check" size={15} />다녀왔어요</span>}</div>;
}

export function ContentCard({ item }: { item: SavedContent }) {
  return <Link to={`/content/${encodeURIComponent(item.id)}`} className="content-card">
    <CategoryStamp category={item.category} visited={item.visited} />
    <div className="content-card-body"><SourceBadge source={item.source} /><h2>{displayContentTitle(item)}</h2>{item.placeName ? <p className="card-place"><Icon name="map-pin" size={15} />{item.placeName}</p> : <p className="card-place muted">언젠가 꺼내볼 나의 저장</p>}{item.note && <p className="card-note">{item.note}</p>}<span className="card-open">다시 보기<Icon name="arrow-up-right" size={17} /></span></div>
  </Link>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <section className="empty-state"><div className="empty-mark"><Icon name="bookmark" size={32} /></div><h2>{title}</h2><p>{description}</p>{action && <div className="button-row">{action}</div>}</section>;
}

export function Notice({ kind = 'info', children }: { kind?: 'error' | 'success' | 'info'; children: ReactNode }) {
  return <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'} aria-live={kind === 'error' ? 'assertive' : 'polite'}><Icon name={kind === 'error' ? 'alert' : kind === 'success' ? 'check-circle' : 'sparkles'} size={18} /><div>{children}</div></div>;
}
