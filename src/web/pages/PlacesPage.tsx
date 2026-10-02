import { Link } from 'react-router';
import { Icon, PageHeading } from '../components/Ui';

export function PlacesPage() {
  return <>
    <PageHeading kicker="PLACE CONNECTION" title="네이버 연동은 잠시 보류했어요." subtitle="지금은 YouTube·Instagram 링크와 파일에서 콘텐츠를 가져와 정리할 수 있어요." backTo="/" />
    <section className="panel">
      <p className="muted">직접 공유한 네이버 지도 링크는 링크 추가에서 저장할 수 있어요. 기존에 저장한 내용도 저장함에서 계속 확인할 수 있어요.</p>
      <div className="button-row"><Link to="/integrations" replace className="button button-primary"><Icon name="import" />콘텐츠 가져오기로 이동</Link><Link to="/add" className="button button-secondary"><Icon name="link" />지도 링크 직접 추가</Link></div>
    </section>
  </>;
}

export default PlacesPage;
