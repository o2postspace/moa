# 핀맵 개발 인수인계 · Codex 시작 문서

2026-10-08, 사용자 요청으로 제품명을 모아에서 핀맵으로 바꾸고 Instagram 텍스트 근거의 AnyJev 분류 경로를 추가했다. 저장소는 기존 [o2postspace/moa](https://github.com/o2postspace/moa)를 유지한다. 2026-10-03 웹 전환·NAVER 연동 보류와 기존 데이터 계약은 이어지며, 실제 모델 추론은 아직 수행하지 않았다. Figma 소스 59205e5 초안은 baseline 기록이며 최신 부분 갱신은 현재 manifest를 따른다. 공개 저장소에 사용자 원본 저장 파일·로그인 정보·OAuth 토큰·환경 파일·계정 이메일·비공개 프로젝트 식별자를 넣지 않는다. 다른 개발자의 변경과 기존 사용자 데이터를 보존하며 기능별로 이어간다.

## 먼저 읽을 순서

1. [AGENTS.md](../AGENTS.md), [README.md](../README.md): 작업 규칙·실행·현재 범위.
2. 이 문서와 [API 서버](api-server.md): 연동 경계·설정·응답 계약.
3. [저장 v2](storage-v2.md), [파일 가져오기](import-files.md): 이동·보존·실패·후보 검토 계약.
4. [검증 기록](verification.md), [로드맵](roadmap.md): 실제 확인과 다음 작업.
5. 화면 변경 시 [디자인 기준](design-handoff.md), [UI 리디자인](ui-refresh.md), [Figma 연결](figma-sync.md), [manifest](../design/figma-manifest.json), [컴포넌트 매핑](../design/component-map.json).

문서와 코드가 다르면 현재 코드·현재 head의 검사 결과를 확인하고 함께 수정한다. 이전 CI·캡처·모의 응답을 새 기능의 실제 검증으로 대신하지 않는다.

Instagram 분석을 이어갈 때는 [분석 계약](instagram-analysis.md)과 [선택 사항인 AnyJev 실행 서비스](../services/anyjev/README.md)를 함께 읽는다. 모델 설치·실행을 기본 웹앱의 필수 조건으로 만들지 않는다.

## 웹앱 전환 · 현재 기본 구현

사용자의 “웹앱으로 구현해” 요청에 따라 기본 실행은 React DOM + Vite + React Router로 전환했다. `src/web`를 수정하며 `src/app`의 Expo 구현은 별도로 보관한다. [웹앱 시작점](web-app.md)에 실행·파일 책임·브라우저 저장소·proxy·운영 한계를 정리했다. 기존 origin localhost:8081과 저장 키를 유지하므로 같은 브라우저의 저장 데이터가 이어진다. 현재 검증 기록은 전환 전 Expo 웹 검사와 새 DOM 웹 검사를 구분한다.

기본 DOM UI는 데스크톱 사이드 메뉴/다열 카드와 모바일 상단 메뉴/한 열 카드로 반응한다. 공통 `Ui.tsx`의 named exports와 DOM 필터 버튼이 기존 CMP의 역할을 이어받는다. Figma 모바일 원본은 흐름·브랜드 기준이며 새 데스크톱 초안의 실제 node/검증 범위는 최신 manifest를 따른다. 모든 웹 화면이 기존 모바일 디자인과 자동 동기화됐다고 설명하지 않는다.

## 제품 의도와 브랜치

**핀맵은 이미 저장한 콘텐츠를 정리하고 실제로 쓸 수 있는 장소와 시기에 다시 발견하게 하는 앱이다.** 새 링크를 쉽게 받는 기능과 많이 쌓인 기존 저장함을 정리하는 기능이 모두 중요하다. Instagram·YouTube·NAVER 지도 자료를 함께 보되 제공하지 않는 개인 저장함 API가 있는 것처럼 설명하지 않는다.

사용자는 이후 근처에 가면 저장한 맛집을 보고, 축제·팝업은 근처 조건과 실제 기간을 함께 확인하고 싶다. ‘노들섬 빛 축제’는 제품 예시이며 확인된 행사·날짜가 아니다. 개인화 비서는 저장·장소·일정 정확성이 확보된 다음 단계다. UI/UX 팀은 Figma, 개발자는 SCR/CMP ID와 기능별 PR로 협업한다.

- main은 초기 앱이며 UI/API 작업은 아직 병합하지 않았다.
- [PR #1](https://github.com/o2postspace/moa/pull/1)은 codex/mmm-ui-refresh의 열린 draft다.
- 기반 브랜치 **codex/content-integrations**는 UI 브랜치 head **835dd81**에서 시작했다. [draft PR #2](https://github.com/o2postspace/moa/pull/2)는 UI 브랜치를 base로 웹·API·Figma 협업 작업을 검토한다. 최종 head·검사는 해당 PR과 [Actions](https://github.com/o2postspace/moa/actions)에서 확인한다.
- 현재 **codex/anyjev-instagram-analysis**는 codex/content-integrations의 웹 전환 commit **03d73fd**에서 시작했다. 핀맵 표기·AnyJev 텍스트 분류 작업이며 이 문서 갱신 시 새 PR은 아직 생성하지 않았다. 이후 PR을 만들 때 실제 URL과 base를 기록한다.
- 리뷰어 초대·필수 리뷰·보호 규칙은 [GitHub 협업 절차](github-setup.md)를 따른다. CI 파일만으로 원격 권한·규칙이 적용되지는 않는다.

## 현재 구현과 검증 경계

| 기능 | 현재 상태 |
| --- | --- |
| 기본 저장함 | 수동 링크·제목·분류·장소 문자열·메모, 중복·검색·출처 필터, 전체/방문 완료, 상세·수정·원본 열기 |
| YouTube 영상 | 웹 붙여넣기·제목 불러오기. 키 없는 공식 oEmbed 실제 응답 성공 확인 |
| Instagram 공개 원문 | 사용자 요청 시 웹 상세에서 tokenless oEmbed 표시. 공식 공개 예시로 API 응답 성공 확인; 저장함·제목·장소 추출 아님 |
| Instagram 간단 분석 | 캡션·이미지 글자·릴스 자막을 수동 입력하고 2,400자 이하로 정리한 뒤 AnyJev의 분류·근거 충분 여부 두 선택형 결정 요청. UI·모의 gateway·실행 도구 구현, 현재 모델 미구성·실제 추론 미검증 |
| YouTube 가져오기 | 실제 API 키로 공개 재생목록 17개 조회·웹 후보 선택 확인. Web OAuth·페이지·중복·배치 저장 구현; 실제 계정 연결·50개 이상 페이지 이동·계정 가져오기 미검증 |
| NAVER 보류 | 서비스 카드·검색 진입 제거. /places는 API 요청 없는 보류 안내. 검색 화면·HUB/legacy backend는 후속 작업용으로 보존. 직접 공유 지도 링크와 기존 데이터 유지 |
| 파일 가져오기 | JSON/TXT 기기 선택·제한된 parser·후보 검토 후 저장. 실제 export·네이티브 파일 선택 미검증 |
| 데이터 보존 | v1 배열→v2 envelope, YouTube provenance·30일 정리·단일 계정 연결 해제 삭제. 신규 NAVER API 입력 거부, 기존 v2 NAVER 읽기·방문 변경·기존 정리는 호환성 유지 |
| 아직 없음 | 영상·게시물 미디어 자동 수집·OCR·STT, 자유로운 장소/주소/날짜 추출, 지도 SDK·장소 통합 엔터티, 행사 기간·위치 권한·근처 알림, 운영 로그인/배포·클라우드·스토어 배포 |

새 저장함은 비어 있다. 수동 링크·파일 저장은 기기 기능이며 API 요청은 서버를 거친다. 키 설정 상태, 계정 연결 상태, 실제 제공자 요청 성공을 구분한다.

Google Cloud 프로젝트 생성과 YouTube Data API 활성화는 실제 완료했다. OAuth client 발급·서버 등록·사용자 계정 동의는 후속 작업이며 공개 재생목록 사용을 막지 않는다. 공개 재생목록의 실제 17개 조회 성공을 OAuth 검증으로 설명하지 않는다. NAVER 발급·결제수단 등록은 사용자 요청으로 더 진행하지 않는다. 최신 상태는 [API 설정 기록](api-setup.md)을 확인한다.

## AnyJev 텍스트 분석 · 2026-10-08

Instagram 상세의 ‘간단 분석’에 사용자가 캡션·화면 글자·자막을 붙여넣는다. 공식 `instagram.com`·`www.instagram.com`의 `/p/`·`/reel/` URL만 요청 식별자로 받으며 링크·미디어·oEmbed HTML을 분석 자료로 가져오지 않는다. 세 입력 합계 8,000자 이하를 받아 공백·중복 줄을 정리하고, 모달리티 표시·생략 표시를 포함해 최대 2,400자로 묶는다. 긴 입력의 중간 내용이 빠질 수 있으므로 정리 미리보기를 확인한다.

서버는 한 HTTP 배치에 `food/cafe/event/other` 분류와 `enough/needs_more` 근거 판단 두 결정을 요청한다. `one_forward`만 허용하고 `cot` 결과는 오류로 보류한다. 낮은 점수·모호한 분포·근거 부족·생략은 검토 대상이며, 높은 점수도 정확도를 보장하지 않는다. 추천은 화면에만 표시하며 기존 수정 화면에서 사용자가 분류를 선택하고 저장한다. 분석 입력·결과를 저장함에 자동 기록하거나 기존 제목·메모·방문 상태를 바꾸지 않는다.

서버 전용 `ANYJEV_BASE_URL`이 비어 있으면 `configured:false`, `reachable:false`이며 외부 요청이 없다. 연결은 credential·경로·query 없는 loopback HTTP origin만 허용한다. `/health`는 최대 2초·4KiB 이하의 HTTP 200 JSON `{ok:true}`로 확인한다. 추론 요청과 본문 읽기는 기본 45초, 설정 범위 1–60초이며 브라우저는 65초 뒤 요청을 중단한다. 브라우저 취소·Node timeout은 이미 시작한 모델 연산을 종료한다고 보장하지 않는다.

같은 정규화 URL·정리 텍스트·질문 버전의 동시 요청은 모델 요청 하나로 합친다. 고유 분석은 한 번에 하나이며 추가 요청은 429다. 성공 결정만 서버 메모리에 15분·최대 100개 보관하고, 원문은 캐시에 저장하지 않는다. 실패는 캐시하지 않고 재시도할 수 있다. 입력·모델 원문·추론 trace·비밀값은 HTTP 응답이나 로그에 남기지 않는다. SDK가 반환한 추론 토큰 수가 없으면 `null`이며, 문자 수를 전체 처리 토큰이나 비용 절감률로 표시하지 않는다. 제공한 worker는 비유한 margin만 `null`로 표현하고 확률을 꾸미지 않는다.

2026-10-08 검사에서 Node 테스트 **117개**, Python 테스트 **22개**가 통과했다. 이는 전처리·웹 API 계약·모의 SDK·실제 loopback HTTP 경계를 확인한 결과다. 현재 모델 endpoint가 없고 PC의 여유 메모리가 부족해 torch·모델을 설치하거나 추론하지 않았다. 실제 한국어 품질·지연·token usage·비용 절감은 별도 샘플 평가가 필요하다. 상세 제한과 연결 방법은 [분석 계약](instagram-analysis.md), [CPU worker·GPU 연결 예시](../services/anyjev/README.md)를 따른다.

## 실행과 키 설정

Node.js 24, npm, React DOM·Vite·React Router를 사용한다. 기본 웹 코드와 보관한 Expo 코드를 구분한다.

~~~sh
git clone https://github.com/o2postspace/moa.git
cd moa
npm ci
~~~

현재 구현을 이어갈 때 작업 브랜치·PR base를 먼저 확인한다. 환경 파일이 없는 새 설치에서만 [.env.example](../.env.example)을 .env.local로 복사하고 필요한 값을 설정한다. 기존 환경 파일·키는 덮어쓰지 않는다. npm run dev 한 명령으로 API와 웹을 함께 실행한다. 독립 실행과 빌드는 docs/web-app.md를 따른다. 기본 API는 http://localhost:8787, 앱은 http://localhost:8081이다. Node의 기본 --env-file-if-exists가 서버 설정을 읽는다. 비밀값에 VITE_ 또는 EXPO_PUBLIC_를 붙이지 않고 값을 출력하여 확인하지 않는다.

공개 YouTube 재생목록은 API key, 본인 재생목록은 Web OAuth client와 정확한 http://localhost:8787/api/youtube/callback 등록·consent screen 테스트 사용자·youtube.readonly 동의가 필요하다. 사용자가 실제 계정 화면에서 직접 로그인한다. [Google 공식 Web OAuth 안내](https://developers.google.com/identity/protocols/oauth2/web-server)

현재 MVP에는 NAVER 키가 필요하지 않다. HUB/legacy backend 설정을 보존하지만 새 키 발급·카드 등록·실제 검색은 보류한다. 사용자 요청으로 연동을 재개할 때만 [API 설정의 보류 기록](api-setup.md#네이버-연동-보류)과 [API 서버](api-server.md)를 확인한다. HUB와 legacy의 키·endpoint·인증 헤더는 호환되지 않는다.

AnyJev는 선택 사항이며 새 OpenAI 키나 유료 API 발급이 필요하지 않다. `ANYJEV_BASE_URL`, `ANYJEV_TIMEOUT_MS`는 서버 설정이고 기존 `.env.local`을 덮어쓰지 않는다. 충분한 메모리가 있는 환경의 [별도 worker](../services/anyjev/README.md)를 먼저 실행한 뒤 연결한다. CPU worker는 SDK 0.3.0·Tacit-1.7B·CPU/float32·adaptive=False로 고정하고 여유 RAM 8GiB 미만이면 SDK import 전에 멈춘다.

서버·클라이언트는 로컬 주소만 허용하며 운영 배포용이 아니다. localhost와 127.0.0.1을 접속 주소에서 섞으면 OAuth cookie가 공유되지 않는다. 모바일 localhost는 개발 PC를 가리키지 않으므로 웹 경로를 실기기 API 연결로 설명하지 않는다.

## 화면·파일 책임

| ID / 파일 | 책임 |
| --- | --- |
| SCR-001 · src/web/pages/LibraryPage.tsx | 전체/방문 완료·검색·분류·출처, 서비스 연결 진입 |
| SCR-002 · src/web/pages/AddPage.tsx | 추가/수정·붙여넣기·YouTube 제목, 수동 제목·선택 장소/메모, 데스크톱 저장 패널·모바일 저장 액션·오류 초점 |
| SCR-003 · src/web/pages/DetailPage.tsx | 표시 제목·원본·확인된 장소, 지도 열기·Instagram 원문, 수정·방문 |
| SCR-004 · src/web/pages/IntegrationsPage.tsx | 설정/연결 상태, OAuth·재생목록/파일 후보·선택, 페이지·중복·해제 |
| SCR-005 · src/web/pages/PlacesPage.tsx | NAVER 보류 안내·기본 링크 저장으로 돌아가기. 검색 UI·API 요청 없음 |
| src/features/integrations/NaverPlacesScreen.tsx | 보류한 검색 UI 코드. 현재 route에서 사용하지 않음. 새 검색/화면 이탈·최대 24시간 메모리 만료·API 저장 금지 계약 보존 |
| CMP-001–006 · src/web/components/Ui.tsx 및 페이지 DOM 필터 | 카드·버튼·출처·빈 상태·CategoryStamp와 Library/Add의 필터 버튼. 토큰·접근성 유지 |
| CMP-007 · src/web/components/InstagramEmbed.tsx | 요청·오류·접기. sandbox iframe으로 격리한 원문 표시 |
| src/web/components/InstagramAnalysis.tsx | 수동 증거 입력·접기·미리보기·취소·연결 상태·추천 검토. 다른 상세 이동 시 이전 응답 제외, 자동 저장 없음 |
| src/web/lib/instagramAnalysisApi.ts | 같은 origin 분석 route·결과 검증·65초 요청 제한·브라우저 취소 |
| src/web/lib/api.ts | 같은 origin /api·cookie·timeout·오류·타입 계약 |
| readImportFile.ts, maps.ts · 같은 폴더 | HTML File 읽기·엄격한 UTF-8, 안전한 HTTPS 지도 링크 |
| server/ | 공식 고정 endpoint·OAuth state/PKCE/cookie·토큰·요청 제한. 메모리 세션, 운영 사용자 인증 없음 |
| src/domain/content.ts | URL·입력·중복·v2 저장 검증, 출처/기한·배치·연결 항목 삭제 |
| src/domain/imports.ts | JSON/TXT 후보. 네트워크·저장·재귀 개인정보 탐색 없음 |
| src/domain/instagramAnalysis.ts, server/anyjev.ts | 증거 전처리·두 choice 질문·검토 기준, 고정 loopback 요청·시간/크기 제한·성공 결정 캐시·동시 요청 합치기 |
| services/anyjev/ | 선택 사항인 Python worker·SDK 0.3.0 설정·모델 없는 검사. 이미지/영상 분석·사용자 인증·실제 추론 완료를 제공하지 않음 |
| src/web/library/LibraryProvider.tsx | ready·이동·쓰기 후 공개·변경 잠금·기한 정리·배치 |
| tests/ | 링크·parser·v2/실패·provenance·서버/OAuth 경계 검사 |
| design/tokens.json | 토큰 원본. tokens:generate 후 생성 코드 함께 검토 |
| design/component-map.json, figma-manifest.json | 코드 연결과 실제 원격 node/권한 상태. 자동 동기화 아님 |

기본 UI의 브랜드색·회색 카드, 24px 여백·56px 컨트롤·48px 터치 영역을 유지한다. 선택 입력을 접어도 값을 보존하고 탭·검색·출처·분류를 함께 적용한다. API 연결을 기본 저장 기능의 필수 조건으로 만들지 않는다.

## 플랫폼별 규칙

**YouTube:** 일반 이름 있는 재생목록을 대상으로 한다. WL은 공식 조회 제한, LL 좋아요는 이번 경로에서 거부한다. 별도 videos.list?myRating=like는 후속 작업이다. 페이지당 최대 50개, 사용자가 요청한 페이지만 조회하고 화면/배치 최대 200건이다. 반환되지 않는 삭제·비공개 영상을 재구성하지 않는다. OAuth Testing은 최대 100명·7일 동의/refresh token 만료 제약이 있다.

**Instagram:** 2026-06-15부터 공개 oEmbed는 토큰·App Review가 필요하지 않다. HTML은 원문 표시용이며 제목·장소·작성자·썸네일 추출·저장·분석에 쓰지 않는다. 별도 간단 분석은 사용자가 직접 입력한 텍스트만 대상으로 하며 oEmbed 권한을 미디어 수집·OCR·STT·개인 저장함 분석 권한으로 해석하지 않는다. private·비활성·연령 제한·embed 금지 계정·Stories는 지원되지 않는다. 실패해도 원본 열기를 제공한다. 소비자 저장함 endpoint나 작동하지 않는 로그인 버튼을 만들지 않는다.

**NAVER:** API 검색·발급은 보류했고 활성 화면에서 API 요청을 하지 않는다. 사용자가 직접 제공한 지도 공유 링크는 API provenance·좌표 없이 수동 저장할 수 있으나, 공유 리스트의 모든 장소를 가져왔다고 설명하지 않는다. 보존한 검색 코드의 지역 검색은 개인 즐겨찾기 조회가 아니며 최대 5개 결과의 원문·지도 확인용이다. 재개 시 WGS84 공지 예시의 longitude=mapx/10^7, latitude=mapy/10^7과 유효 범위를 유지하고 오래된 KATECH XML을 새 좌표 fixture로 쓰지 않는다. [HUB 지역 검색 계약](https://api.ncloud-docs.com/docs/naver-api-hub-search-local)

[HUB 약관 2026-09-20 시행 공지](https://www.ncloud.com/support/notice/all/2243) 제2.3·2.4조에 따라 API 결과의 복사·저장·캐싱은 예외 범위로 제한된다. 기기 개인화 캐시는 24시간 또는 새 질의까지 중 짧은 기간이며, 사용자 선택을 장기 저장 허용으로 해석하지 않는다. [2026-10-07 개정](https://www.ncloud.com/support/notice/all/2271)도 저장 기간을 늘리지 않는다. 보류한 검색 코드는 새 검색·화면 이탈 때 결과를 즉시 지우며 최대 24시간만 메모리에 유지한다. 현재 보류 안내에는 결과·저장·분류 CTA가 없다.

**파일:** UTF-8 2MiB·최대 200개. 한 줄당 HTTPS 하나인 TXT, 최상위 [{url,title?}], 제한된 saved_saved_media의 직접 string_map_data.*.href만 읽는다. 호환 입력이며 검증된 공식 export 규격이 아니다. unknown JSON은 오류를 내고 개인정보 전체를 재귀 탐색하지 않는다. 공식 도메인·안전 URL 후보를 사용자가 확인·선택한다. [파일 계약](import-files.md)

## 저장·제목·기한·해제 계약

핀맵 리브랜딩 이후에도 키는 moa.library.v1, 값은 { version: 2, items: [...] }다. 기존 배열은 모든 항목을 검증한 뒤 한 번의 교체 쓰기로 이동한다. ID·사용자 텍스트·방문 상태·생성일·순서를 유지한다. 잘못된 JSON·unknown version·항목 오류는 전체 실패로 처리하고 원본을 보존한다. 이동/정리 쓰기 실패는 ready가 되지 않으며 재시도 전 변경을 막는다.

title과 사용자 메모는 기본 정보다. external은 YouTube 제목·작성자·fetchedAt 캐시이고 titleMode가 표시를 결정한다. importedFrom은 API 항목 전체의 provider·method·fetchedAt·connectionId 근거다. 기존 place는 NAVER 주소·좌표·시각이며 v2 읽기 호환성만 유지한다. API 응답 아닌 값으로 근거를 꾸미지 않는다. 사용자 제공 파일·지도 공유 링크는 API origin·좌표 없이 일반 링크로 저장한다.

- 로드·변경 저장·전경 복귀·전경에서 1시간 주기 확인 때 정리한다. 종료 중 백그라운드 정리·자동 갱신을 보장하지 않는다.
- 수동 링크의 외부 제목만 30일 만료되면 캐시를 지우고 기본 제목·URL·메모·방문 상태를 남긴다.
- YouTube API 재생목록은 30일 뒤 전체 항목과 메모·분류·방문 상태를 삭제한다. 가져오기 전에 사용자에게 설명한다.
- createContent는 신규 NAVER importedFrom 또는 place 입력을 거부한다. mixed batch도 전체 실패이며 중복 URL도 검증을 우회하지 못한다. 기존 NAVER API 항목 수정은 같은 경로에서 거부한다.
- 기존 v2 NAVER 항목의 읽기·방문 toggle·기존 30일 prune는 호환성을 위해 유지한다. 사용자 데이터를 조기 삭제하지 않으며 이 경로의 보존 기간을 NAVER 약관 준수 완료로 설명하지 않는다. 배포 전 기존 데이터 처리 방법을 별도로 검토한다.
- 수정·중복 재가져오기는 기존 API 시각을 늘리지 않는다. 장소 이름 수정 시 이전 좌표를 지우고 URL 변경 시 제목을 다시 확인한다.
- 변경은 쓰기 성공 후 상태를 갱신한다. 배치는 전체 검증·중복 제외 후 한 번 저장하며 실패 시 목록·입력을 보존한다.
- 단일 YouTube 연결 MVP의 명시적 해제는 removeAccountImports()로 **이 기기의 모든 account-playlist 항목** 삭제를 먼저 저장한 뒤 remote revoke한다. 서버의 현재 connectionId만 대상으로 삼지 않는다.
- 로컬 삭제 실패 시 remote 요청을 하지 않는다. 원격 실패 시 연결 상태를 유지하고 재시도한다. 이전 항목이 이미 삭제됐더라도 해제 재시도가 가능해야 한다. 공개 재생목록·수동 링크는 유지한다.
- 일시적 offline·상태 실패·서버 재시작만으로 가져온 목록을 즉시 삭제하지 않는다. 외부 취소/만료의 운영 감지·정기 확인은 별도로 검증한다.

API 제목 수동 변경 시 외부 데이터와 사용자 작성 데이터가 구분되는지, 기한/해제 정책을 우회하는 복사본이 남지 않는지 최종 검증이 남아 있다. 이 확인 전 운영 정책이 완성됐다고 설명하지 않는다. 함수·실패 계약은 [저장 v2](storage-v2.md)를 따른다.

## Figma 상태

현재 작업 파일은 연결된 팀 계정에서 새로 만든 [Figma 작업 파일](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ)이다. 편집 가능한 텍스트·Auto Layout·컴포넌트·변수를 구성했다. 2026-10-08 기존 저장함의 핀맵 표기와 웹 Handoff를 갱신했으며 새 분석 패널의 Figma 화면은 아직 작성하지 않았다. 소스 59205e5 기준 초안은 [baseline manifest](../design/history/figma-manifest-2026-10-03-baseline.json)와 캡처로 보존한다. NAVER 카드 제외·보류 안내에 맞춘 서비스 연결 흐름의 최신 부분 갱신은 [현재 manifest](../design/figma-manifest.json)를 따른다. 픽셀 단위 동기화 결과가 아니다. 이전 sNrklbLn8Fd9HXMU3GLQUt 파일은 현재 계정에 편집 권한이 없어 변경하지 않았고 기록을 보존한다.

SCR-001–005/CMP-001–007의 실제 node, 화면·상태·서비스 전체 구성·컴포넌트·Handoff와 변수·스타일은 manifest를 기준으로 찾는다. 화면 이동 reaction의 현재 수와 읽기 확인 범위도 manifest를 따르며 프로토타입 재생 검증과 구분한다. 원본 화면은 페이지 최상위이며 리뷰 보드 복제본과 함께 관리한다.

현재 draft 파일이며 팀원 초대·공유 권한 변경·라이브러리/Code Connect 게시는 수행하지 않았다. 로컬 매핑과 API/검색 결과 예시를 실제 게시·실제 제공자 응답으로 설명하지 않는다. [디자인 node/코드 표](design-handoff.md#디자인-id--코드), [Figma 작업 기록](figma-sync.md), [manifest](../design/figma-manifest.json)의 최신 구조·시각 확인 범위를 따른다.

## 다음 작업과 검사

AnyJev 후속 작업은 허가된 한국어 텍스트 샘플과 실제 모델 환경을 확보한 뒤 시작한다. 먼저 모델 없는 설정 검사를 실행하고, 실제 환경에서는 분류 정답·근거 부족·생략 손실·prefill/생성 토큰·지연·캐시 효과를 같은 baseline과 비교한다. 자동 OCR/STT·미디어 수집은 현재 구현에 추가된 것으로 취급하지 않는다. [분석 평가 범위](instagram-analysis.md#측정과-남은-검증)

1. 브랜치/base·작업 파일을 확인하고 공개 재생목록·수동 링크·파일 정리부터 이어간다. 필요한 API key만 .env.local에 설정하며 NAVER 발급·결제 등록을 요구하지 않는다. 값 출력 없이 설정 여부·실제 성공을 구분한다.
2. 공개 재생목록 후보 → 선택 저장·중복 제외 → 재실행과 50개 이상 목록의 페이지 이동을 검증한다. 저장 실패·네트워크·제한과 제목/메모·30일 경계를 확인한다.
3. 동의받은 익명화 export 샘플로 필요한 링크만 읽는지 확인한다. 검증된 형태만 추가한다. 네이티브 파일 선택·키보드·지도 링크 열기·접근성은 실기기에서 따로 확인한다.
4. Google OAuth는 후속 범위다. client가 등록되면 사용자 로그인·일반 재생목록·거절·만료·연결 해제 원격 실패/재시도·로컬 쓰기 실패를 검증한다. 공개 API 성공을 계정 연동 완료로 설명하지 않는다.
5. NAVER 검색·키 발급은 사용자 요청으로 보류한다. 기존 저장 데이터·직접 공유 링크·신규 API 입력 거부 계약을 유지한다. 재개 시 검색 메모리 만료·HUB 실제 응답·기존 v2 데이터 처리 방법을 별도 검토한다.
6. 운영 배포 전 HTTPS·사용자별 세션·토큰 보호·취소 감지·네이티브 callback·개인정보처리방침·OAuth 검증을 마련한다.
7. 새 Figma 파일의 실제 node·컴포넌트·변수를 보존하며 NAVER 제외 MVP에 맞춰 원본·리뷰 복제본을 함께 갱신한다. 변경에 영향받는 상태를 추가하고 시각·프로토타입 재생·320px/접근성의 별도 검증 범위를 기록한다.

~~~sh
npm run typecheck
npm run lint
npm test
npm run tokens:check
npm run build:web
python services/anyjev/worker.py --dry-run
python -m unittest discover -s services/anyjev -p test_worker.py -v
~~~

모의 OAuth/NAVER·AnyJev와 빌드가 실제 계정·키·모델·실기기 검증을 대신하지 않는다. 공개 YouTube/Instagram API 응답 성공과 웹 iframe 최종 표시도 구분한다. 현재 head의 수행 결과는 [검증 기록](verification.md)에 남긴다.

다른 개발자의 Codex에 전달할 시작 프롬프트:

> AGENTS.md, README.md, docs/codex-handoff.md, docs/web-app.md, docs/api-server.md, docs/storage-v2.md, docs/instagram-analysis.md와 services/anyjev/README.md를 읽고 브랜치·PR base·git status를 확인해 주세요. 제품명은 핀맵이며 저장소와 저장 키 moa.library.v1은 유지합니다. 현재 브랜치 codex/anyjev-instagram-analysis는 codex/content-integrations의 03d73fd에서 시작했습니다. 기본 제품은 src/web의 React DOM/Vite/React Router 웹앱이며 Expo 코드는 보관본입니다. npm run dev 한 명령으로 API와 웹을 실행합니다. 새 분석은 사용자가 입력한 캡션·OCR 텍스트·자막의 전처리와 두 선택형 AnyJev 결정입니다. 모델 endpoint는 현재 미구성이며 영상 수집·OCR·STT 자동 실행·실제 추론·비용 절감 검증은 하지 않았습니다. 입력과 결과를 자동 저장하지 않고 추천 분류는 사용자가 기존 수정 화면에서 확인합니다. 실제 모델을 연결할 때는 별도 환경·메모리 조건·adaptive=False·시간/응답/캐시 제한과 nullable reasoningTokens 계약을 지켜 주세요. MVP의 공개 YouTube·Instagram 원문·JSON/TXT 후보와 기본 저장함을 보존합니다. 사용자 요청으로 NAVER API 검색·발급·결제수단 등록은 보류했고 /places는 API 없는 안내입니다. Google OAuth client·실제 계정 연동은 후속 범위이며 공개 재생목록 17개 성공을 OAuth 성공으로 설명하지 마세요. 기존 데이터와 신규 NAVER provenance/place 거부, 기한·해제·쓰기 실패 보존 계약을 유지해 주세요. 화면 작업은 docs/design-handoff.md, docs/figma-sync.md와 실제 manifest를 읽고 원본·리뷰 복제본을 함께 관리합니다. 새 분석 패널의 Figma 화면은 아직 없습니다. 비밀값과 사용자 원문·export·추론 trace를 출력·커밋하지 않고 다른 개발자의 변경을 보존해 주세요. 수행 검사·실제/모의 검증·남은 범위와 실제 PR URL·base를 전달해 주세요.
