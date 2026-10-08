# 웹앱 개발 시작점

핀맵의 기본 진입점은 React DOM 웹앱이다. 2026-10-08 사용자 요청으로 모아에서 핀맵으로 이름을 바꿨다. 브랜드색 `#C94C2B`와 기존 디자인 토큰은 유지하며 CSS 변수로 사용한다. 데스크톱에서는 사이드 메뉴와 다열 저장함, 모바일 브라우저에서는 상단 메뉴와 한 열 카드로 전환한다. 텍스트·버튼·폼은 실제 HTML이다. `src/app`의 Expo 화면은 별도로 보관한다.

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
| src/web/pages/DetailPage.tsx · /content/:id | 원본·지도 링크·방문·보관 설명·Instagram 원문·수동 텍스트 분류 검토 |
| src/web/pages/IntegrationsPage.tsx · /integrations | 공개/계정 재생목록·파일 후보·선택·해제 |
| src/web/pages/PlacesPage.tsx · /places | NAVER 보류 안내. API 요청 없음 |
| src/web/components/Ui.tsx, styles.css | 공통 DOM UI·반응형 레이아웃·초점·reduced motion |
| src/web/components/InstagramAnalysis.tsx · CMP-008 | Instagram 상세의 접힌 간단 분석·3종 텍스트 입력·미리보기·연결 상태·추천 검토 |
| src/web/lib/instagramAnalysisApi.ts | 같은 origin 분석 상태/요청·응답 검증·65초 제한·취소 |
| src/domain/instagramAnalysis.ts, server/anyjev.ts | 8,000자 입력 검증·2,400자 정리·AnyJev 선택 판단·결과 재사용 |
| src/web/library/ | 브라우저 저장 adapter와 기존 도메인 규칙을 사용하는 provider |
| src/web/lib/ | 상대 API·UTF-8 File 읽기·안전한 지도 링크 |
| src/domain/, server/ | 기존 공유 모델·parser·공식 API/OAuth 경계 |
| vite.config.ts, scripts/dev.mjs | 개발/preview proxy·서버 종료 관리 |

## 저장 데이터와 API

브라우저 저장소는 원래 AsyncStorage의 웹 구현과 동일한 localStorage 키 `moa.library.v1`을 사용한다. 핀맵으로 이름을 바꿔도 이 내부 키와 저장 origin을 변경하지 않는다. v2 JSON 포맷과 기존 배열 이동·검증·쓰기 후 상태 공개 계약을 유지한다. 같은 localhost:8081 브라우저에서 기존 항목이 이어진다. localhost와 127.0.0.1, 다른 포트·다른 브라우저는 별도 저장소다. 실제 데이터를 검사하려고 초기값·예시 목록을 강제로 쓰지 않는다. 새 브라우저의 저장함은 비어 있다.

로드·변경·브라우저 focus/visible 복귀·표시 중 1시간 간격에서 기한을 정리한다. 저장·정리 실패는 원본을 보존하며 재시도한다. 같은 origin의 웹 탭은 Web Locks 배타 범위에서 최신 저장값을 읽고 변경을 저장하며 storage 이벤트/전경 복귀에서 목록을 다시 확인한다. Web Locks 미지원 브라우저는 안전한 쓰기를 차단하고 기존 유효 v2 데이터 읽기만 허용한다. 이동·기한 정리에 쓰기가 필요하면 원본을 보존하며 지원 브라우저 안내를 제공한다. 닫힌 브라우저의 백그라운드 작업·클라우드 동기화는 제공하지 않는다. API 항목 기한과 명시적 계정 해제 정책은 [저장 계약](storage-v2.md)을 유지한다.

브라우저는 `/api/...`로만 요청한다. 개발/preview proxy는 127.0.0.1:8787로 전달하며 원래 Origin을 보존한다. Google callback은 현재 `.env.local`의 localhost:8787 경로다. API 키·OAuth 토큰은 서버에만 둔다. VITE_ 변수는 브라우저 번들에 공개되므로 비밀값을 넣지 않는다.

YouTube 공개 재생목록은 서버 API key로 사용한다. Google 계정 연결은 Web OAuth client 발급·등록 후 검증할 별도 단계다. Instagram은 사용자가 요청한 공개 원문 표시와 원본 링크를 제공한다. 파일은 브라우저에서만 읽으며 원본 전체를 서버에 올리지 않는다. NAVER API는 보류했고 사용자 공유 지도 링크 열기만 유지한다.

## Instagram 간단 분석 · 2026-10-08

SCR-003 Instagram 상세에서 원문 표시 뒤의 **간단 분석**을 연다. CMP-008 `InstagramAnalysis.tsx`는 사용자가 직접 복사한 게시물 캡션, 이미 추출한 화면 글자, 릴스 자막을 받는다. 세 입력 중 하나 이상이 필요하고 합계 8,000자까지 허용한다. 중복 줄·공백 정리와 최대 2,400자의 앞뒤 내용 보존 미리보기는 브라우저에서 동작한다. 긴 입력은 생략 안내와 실제 정리 텍스트를 보여준다. 문자 수를 토큰 수나 비용 절감률로 표시하지 않는다.

패널을 열 때 `/api/instagram/analysis/status`를 확인하고 **연결 다시 확인**으로 재시도한다. 설정되지 않은 모델과 설정됐지만 응답하지 않는 서버를 구분한다. 연결되지 않아도 입력·정리 미리보기는 사용할 수 있으며 추천 요청은 비활성화한다. **분류 추천받기**를 누를 때만 입력을 같은 origin의 `/api/instagram/analysis`로 보낸다. AnyJev 로컬 설정과 응답·결과 재사용 계약은 [Instagram 분석 문서](instagram-analysis.md)를 따른다. 현재 실제 모델은 연결하지 않았고 실제 추론 성공이나 절감 효과를 검증하지 않았다.

입력을 접었다 펼치거나 요청이 실패해도 내용을 유지한다. 입력이 바뀌면 진행 중 요청과 이전 추천을 무효화하고, URL 변경·화면 이탈에서도 오래된 응답을 표시하지 않는다. 입력·추천은 화면 상태이며 저장함에 자동 저장하지 않는다. **입력 비우기**는 이 분석 패널의 입력과 결과만 지운다. 추천은 항상 검토용이다. 근거가 부족하거나 분류가 모호하면 원문 확인·텍스트 추가를 안내하고, **분류 확인·수정**으로 기존 `/add?id=…` 화면에서 사용자가 직접 분류를 선택하고 저장한다.

Instagram 원문 HTML을 읽거나 분석 입력으로 재사용하지 않는다. 릴스 다운로드·영상 이해·자동 OCR·자동 음성 자막 추출과 개인 저장함 조회는 구현하지 않았다. NAVER 연동 보류도 유지한다. 이 기능의 코드 계약과 모델 설정, 모의 응답 검사와 실제 UI 확인 범위는 [분석 문서](instagram-analysis.md)와 [검증 기록](verification.md)에서 구분한다.

Figma에는 현재 `핀맵 · 화면 & 디자인 시스템` 페이지와 높이 372px의 웹 Handoff `28:877`에 기능 범위 메모를 반영했다. 분석 패널의 새 화면·메인 컴포넌트는 아직 없으며 CMP-008의 Figma node는 `null`이다. 이전 모바일·웹 baseline은 보존하고 이 메모 갱신을 분석 화면의 디자인 완료로 설명하지 않는다.

## 이후 운영 배포

현재는 loopback 로컬 개발/검토 환경이다. Vite proxy는 정적 사이트 배포 설정이 아니다. 실제 호스팅에는 SPA 경로 fallback, HTTPS의 같은 origin API reverse proxy, 사용자별 인증·세션/저장소 격리, 서버 토큰 보호와 정확한 OAuth redirect를 구성해야 한다. 브라우저 설치 manifest는 포함하지만 service worker·offline 기능은 없다. 운영 배포·PWA 오프라인·모바일 네이티브 완료로 설명하지 않는다.

디자인 협업은 [Figma 기록](figma-sync.md), 실제 코드 매핑은 [component map](../design/component-map.json), 검사 증거는 [검증 기록](verification.md)을 확인한다.
