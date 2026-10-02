# 웹앱 개발 시작점

모아의 기본 진입점은 React DOM 웹앱이다. 데스크톱에서는 사이드 메뉴와 다열 저장함, 모바일 브라우저에서는 상단 메뉴와 한 열 카드로 전환한다. 기존 브랜드 토큰을 CSS 변수로 사용하며 텍스트·버튼·폼은 실제 HTML이다. `src/app`의 Expo 화면은 별도로 보관한다.

## 실행

Node.js 24와 npm을 사용한다.

~~~sh
npm ci
npm run dev
~~~

브라우저에서 http://localhost:8081/을 연다. 한 명령이 Node API8787과 Vite8081을 함께 관리한다. 어느 서버가 종료되거나 실행에 실패하면 다른 서버도 종료한다. Ctrl+C로 둘 다 정리한다. `npm run web`은 Vite만, `npm run api`는 API만 실행하므로 별도로 실행할 때는 두 터미널이 필요하다.

~~~sh
npm run typecheck
npm run lint
npm test
npm run tokens:check
npm run build:web
npm run preview
~~~

`preview`는 만들어진 dist를 localhost:8081에서 확인한다. API가 필요하면 별도 터미널에서 `npm run api`도 실행한다. 개발 서버와 동시에 8081을 사용할 수 없다. `native:start`, `android`, `ios`는 보관한 Expo 코드 전용이다.

## 파일과 경로

| 파일 | 책임 |
| --- | --- |
| src/web/main.tsx, App.tsx | DOM 진입점·공통 메뉴·BrowserRouter·라우트 전환 초점 |
| src/web/pages/LibraryPage.tsx · / | 저장함·검색·분류·출처·방문 |
| src/web/pages/AddPage.tsx · /add | 링크 추가/수정·제목 확인·선택 장소/메모·중복 |
| src/web/pages/DetailPage.tsx · /content/:id | 원본·지도 링크·방문·보관 설명·Instagram 원문 |
| src/web/pages/IntegrationsPage.tsx · /integrations | 공개/계정 재생목록·파일 후보·선택·해제 |
| src/web/pages/PlacesPage.tsx · /places | NAVER 보류 안내. API 요청 없음 |
| src/web/components/Ui.tsx, styles.css | 공통 DOM UI·반응형 레이아웃·초점·reduced motion |
| src/web/library/ | 브라우저 저장 adapter와 기존 도메인 규칙을 사용하는 provider |
| src/web/lib/ | 상대 API·UTF-8 File 읽기·안전한 지도 링크 |
| src/domain/, server/ | 기존 공유 모델·parser·공식 API/OAuth 경계 |
| vite.config.ts, scripts/dev.mjs | 개발/preview proxy·서버 종료 관리 |

## 저장 데이터와 API

브라우저 저장소는 원래 AsyncStorage의 웹 구현과 동일한 localStorage 키 `moa.library.v1`을 사용한다. v2 JSON 포맷과 기존 배열 이동·검증·쓰기 후 상태 공개 계약을 유지한다. 같은 localhost:8081 브라우저에서 기존 항목이 이어진다. localhost와 127.0.0.1, 다른 포트·다른 브라우저는 별도 저장소다. 실제 데이터를 검사하려고 초기값·예시 목록을 강제로 쓰지 않는다. 새 브라우저의 저장함은 비어 있다.

로드·변경·브라우저 focus/visible 복귀·표시 중 1시간 간격에서 기한을 정리한다. 저장·정리 실패는 원본을 보존하며 재시도한다. 같은 origin의 웹 탭은 Web Locks 배타 범위에서 최신 저장값을 읽고 변경을 저장하며 storage 이벤트/전경 복귀에서 목록을 다시 확인한다. Web Locks 미지원 브라우저는 안전한 쓰기를 차단하고 기존 유효 v2 데이터 읽기만 허용한다. 이동·기한 정리에 쓰기가 필요하면 원본을 보존하며 지원 브라우저 안내를 제공한다. 닫힌 브라우저의 백그라운드 작업·클라우드 동기화는 제공하지 않는다. API 항목 기한과 명시적 계정 해제 정책은 [저장 계약](storage-v2.md)을 유지한다.

브라우저는 `/api/...`로만 요청한다. 개발/preview proxy는 127.0.0.1:8787로 전달하며 원래 Origin을 보존한다. Google callback은 현재 `.env.local`의 localhost:8787 경로다. API 키·OAuth 토큰은 서버에만 둔다. VITE_ 변수는 브라우저 번들에 공개되므로 비밀값을 넣지 않는다.

YouTube 공개 재생목록은 서버 API key로 사용한다. Google 계정 연결은 Web OAuth client 발급·등록 후 검증할 별도 단계다. Instagram은 사용자가 요청한 공개 원문 표시와 원본 링크를 제공한다. 파일은 브라우저에서만 읽으며 원본 전체를 서버에 올리지 않는다. NAVER API는 보류했고 사용자 공유 지도 링크 열기만 유지한다.

## 이후 운영 배포

현재는 loopback 로컬 개발/검토 환경이다. Vite proxy는 정적 사이트 배포 설정이 아니다. 실제 호스팅에는 SPA 경로 fallback, HTTPS의 같은 origin API reverse proxy, 사용자별 인증·세션/저장소 격리, 서버 토큰 보호와 정확한 OAuth redirect를 구성해야 한다. 브라우저 설치 manifest는 포함하지만 service worker·offline 기능은 없다. 운영 배포·PWA 오프라인·모바일 네이티브 완료로 설명하지 않는다.

디자인 협업은 [Figma 기록](figma-sync.md), 실제 코드 매핑은 [component map](../design/component-map.json), 검사 증거는 [검증 기록](verification.md)을 확인한다.
