import { useEffect, useRef } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router';
import { LibraryProvider, useLibrary } from './library/LibraryProvider';
import { EmptyState, Icon } from './components/Ui';
import { LibraryPage } from './pages/LibraryPage';
import { AddPage } from './pages/AddPage';
import { DetailPage } from './pages/DetailPage';
import IntegrationsPage from './pages/IntegrationsPage';
import PlacesPage from './pages/PlacesPage';

function Shell() {
  const { items, loading } = useLibrary();
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  const initial = useRef(true);
  useEffect(() => {
    if (initial.current) { initial.current = false; return; }
    window.scrollTo({ top: 0 });
    main.current?.focus({ preventScroll: true });
  }, [location.pathname, location.search]);
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
    <aside className="sidebar">
      <Link className="brand" to="/" aria-label="모아 저장함"><span className="brand-symbol"><Icon name="bookmark" size={27} /></span><span>모아<span className="brand-dot">.</span></span></Link>
      <p className="brand-description">좋아한 순간을 모아,<br />필요할 때 다시 꺼내요.</p>
      <nav className="main-nav" aria-label="주요 메뉴"><NavLink to="/" end><Icon name="grid" />내 저장함<span className="nav-count">{loading ? '·' : items.length}</span></NavLink><NavLink to="/integrations"><Icon name="sparkles" />콘텐츠 가져오기</NavLink><NavLink to="/add"><Icon name="plus" />링크 추가</NavLink></nav>
      <div className="sidebar-bottom"><div className="personal-label"><span className="status-dot" />나만의 작은 컬렉션</div><p>이 브라우저에 저장돼요.</p></div>
    </aside>
    <div className="workspace"><div className="topbar"><span className="topbar-label"><Icon name="bookmark" size={16} /> MY COLLECTION</span><Link to="/add" className="button button-secondary topbar-add"><Icon name="plus" size={18} />링크 추가</Link></div>
      <main id="main-content" tabIndex={-1} ref={main} className="main-content">
        <Routes><Route path="/" element={<LibraryPage />} /><Route path="/add" element={<AddPage />} /><Route path="/content/:id" element={<DetailPage />} /><Route path="/integrations" element={<IntegrationsPage />} /><Route path="/places" element={<PlacesPage />} /><Route path="*" element={<EmptyState title="페이지를 찾을 수 없어요" description="저장함에서 다시 시작해 주세요." action={<Link className="button button-primary" to="/">저장함으로</Link>} />} /></Routes>
      </main>
      <footer className="site-footer"><span>모아 · 좋아했던 것들을, 나답게.</span><span>링크 · 메모 · 작은 발견</span></footer>
    </div>
  </div>;
}

export function App() { return <BrowserRouter><LibraryProvider><Shell /></LibraryProvider></BrowserRouter>; }
