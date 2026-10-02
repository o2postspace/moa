# 모아 개발 인수인계 · Codex 시작 문서

2026-10-03, API 소스 59205e5와 새 Figma 작업 기준. 공개 저장소 [o2postspace/moa](https://github.com/o2postspace/moa)에 사용자 원본 저장 파일·로그인 정보·OAuth 토큰·환경 파일을 넣지 않는다. 다른 개발자의 변경과 기존 사용자 데이터를 보존하며 기능별로 이어간다.

## 먼저 읽을 순서

1. [AGENTS.md](../AGENTS.md), [README.md](../README.md): 작업 규칙·실행·현재 범위.
2. 이 문서와 [API 서버](api-server.md): 연동 경계·설정·응답 계약.
3. [저장 v2](storage-v2.md), [파일 가져오기](import-files.md): 이동·보존·실패·후보 검토 계약.
4. [검증 기록](verification.md), [로드맵](roadmap.md): 실제 확인과 다음 작업.
5. 화면 변경 시 [디자인 기준](design-handoff.md), [UI 리디자인](ui-refresh.md), [Figma 연결](figma-sync.md), [manifest](../design/figma-manifest.json), [컴포넌트 매핑](../design/component-map.json).

문서와 코드가 다르면 현재 코드·현재 head의 검사 결과를 확인하고 함께 수정한다. 이전 CI·캡처·모의 응답을 새 기능의 실제 검증으로 대신하지 않는다.

## 제품 의도와 브랜치

**모아는 이미 저장한 콘텐츠를 정리하고 실제로 쓸 수 있는 장소와 시기에 다시 발견하게 하는 앱이다.** 새 링크를 쉽게 받는 기능과 많이 쌓인 기존 저장함을 정리하는 기능이 모두 중요하다. Instagram·YouTube·NAVER 지도 자료를 함께 보되 제공하지 않는 개인 저장함 API가 있는 것처럼 설명하지 않는다.

사용자는 이후 근처에 가면 저장한 맛집을 보고, 축제·팝업은 근처 조건과 실제 기간을 함께 확인하고 싶다. ‘노들섬 빛 축제’는 제품 예시이며 확인된 행사·날짜가 아니다. 개인화 비서는 저장·장소·일정 정확성이 확보된 다음 단계다. UI/UX 팀은 Figma, 개발자는 SCR/CMP ID와 기능별 PR로 협업한다.

- main은 초기 앱이며 UI/API 작업은 아직 병합하지 않았다.
- [PR #1](https://github.com/o2postspace/moa/pull/1)은 codex/mmm-ui-refresh의 열린 draft다.
- 현재 **codex/content-integrations**는 UI 브랜치 head **835dd81**에서 시작했다. [draft PR #2](https://github.com/o2postspace/moa/pull/2)는 UI 브랜치를 base로 API·Figma 협업 작업을 검토한다. 최종 head·검사는 [PR](https://github.com/o2postspace/moa/pull/2)과 [Actions](https://github.com/o2postspace/moa/actions)에서 확인한다.
- 리뷰어 초대·필수 리뷰·보호 규칙은 [GitHub 협업 절차](github-setup.md)를 따른다. CI 파일만으로 원격 권한·규칙이 적용되지는 않는다.

## 현재 구현과 검증 경계

| 기능 | 현재 상태 |
| --- | --- |
| 기본 저장함 | 수동 링크·제목·분류·장소 문자열·메모, 중복·검색·출처 필터, 전체/방문 완료, 상세·수정·원본 열기 |
| YouTube 영상 | 웹 붙여넣기·제목 불러오기. 키 없는 공식 oEmbed 실제 응답 성공 확인 |
| Instagram 공개 원문 | 사용자 요청 시 웹 상세에서 tokenless oEmbed 표시. 공식 공개 예시로 API 응답 성공 확인; 저장함·제목·장소 추출 아님 |
| YouTube 가져오기 | Web OAuth 본인 일반 재생목록, API 키 공개 재생목록, 페이지·후보 선택·중복·배치 저장 구현. 자격 증명·실제 계정 검증 전 |
| NAVER 장소 | 지역 검색 후보·주소 선택·WGS84 좌표 저장·지도 웹/앱 열기 구현. 키 없는 상태로 실제 검색·실기기 앱 실행 미검증 |
| 파일 가져오기 | JSON/TXT 기기 선택·제한된 parser·후보 검토 후 저장. 실제 export·네이티브 파일 선택 미검증 |
| 데이터 보존 | v1 배열→v2 envelope, provenance·시각·캐시·30일 정리, 단일 계정 연결 해제 삭제 구현 |
| 아직 없음 | 지도 SDK·장소 통합 엔터티, 행사 기간·위치 권한·근처 알림, 운영 로그인/배포·클라우드·AI·스토어 배포 |

새 저장함은 비어 있다. 수동 링크·파일 저장은 기기 기능이며 API 요청은 서버를 거친다. 키 설정 상태, 계정 연결 상태, 실제 제공자 요청 성공을 구분한다.

## 실행과 키 설정

Node.js 24, npm, Expo SDK 57을 사용한다.

~~~sh
git clone https://github.com/o2postspace/moa.git
cd moa
npm ci
~~~

현재 구현을 이어갈 때 작업 브랜치·PR base를 먼저 확인한다. [.env.example](../.env.example)을 .env.local로 복사해 필요한 값을 설정한다. 두 터미널에서 npm run api와 npm run web을 실행한다. 기본 API는 http://localhost:8787, 앱은 http://localhost:8081이다. Node의 기본 --env-file-if-exists가 서버 설정을 읽는다. 비밀값에 EXPO_PUBLIC_를 붙이지 않고 값을 출력하여 확인하지 않는다.

Google Cloud에서 YouTube Data API v3를 활성화한다. 공개 재생목록은 API key, 본인 재생목록은 Web OAuth client와 정확한 http://localhost:8787/api/youtube/callback 등록·consent screen 테스트 사용자·youtube.readonly 동의가 필요하다. 사용자가 실제 계정 화면에서 직접 로그인한다. NAVER 개발자센터에서는 검색 API가 설정된 Client ID/Secret이 필요하다. 상세 변수는 [API 문서](api-server.md)를 따른다.

서버·클라이언트는 로컬 주소만 허용하며 운영 배포용이 아니다. localhost와 127.0.0.1을 접속 주소에서 섞으면 OAuth cookie가 공유되지 않는다. 모바일 localhost는 개발 PC를 가리키지 않으므로 웹 경로를 실기기 API 연결로 설명하지 않는다.

## 화면·파일 책임

| ID / 파일 | 책임 |
| --- | --- |
| SCR-001 · src/app/index.tsx | 전체/방문 완료·검색·분류·출처, 서비스 연결 진입 |
| SCR-002 · src/app/add.tsx | 추가/수정·붙여넣기·YouTube 제목, 수동 제목·선택 장소/메모, 고정 저장 바·오류 초점 |
| SCR-003 · src/app/content/[id].tsx | 표시 제목·원본·확인된 장소, 지도 열기·Instagram 원문, 수정·방문 |
| SCR-004 · src/app/integrations.tsx | 설정/연결 상태, OAuth·재생목록/파일 후보·선택, 페이지·중복·해제 |
| SCR-005 · src/app/places.tsx | 네이버 검색·주소 확인·분류·좌표 있는 결과 저장 |
| CMP-001~006 · src/components/ | 카드·칩·버튼·출처·빈 상태·CategoryStamp. 토큰·접근성 유지 |
| CMP-007 · src/components/InstagramEmbed.tsx | 요청·오류·접기. InstagramFrame.web.tsx로 격리한 원문 표시; 현재 웹에서 활성화 |
| src/features/integrations/api.ts | 로컬 주소·cookie·timeout·오류·타입 계약 |
| readImportFile.ts, maps.ts · 같은 폴더 | 파일 선택/읽기, 지도 URL Scheme·웹 대체 |
| server/ | 공식 고정 endpoint·OAuth state/PKCE/cookie·토큰·요청 제한. 메모리 세션, 운영 사용자 인증 없음 |
| src/domain/content.ts | URL·입력·중복·v2 저장 검증, 출처/기한·배치·연결 항목 삭제 |
| src/domain/imports.ts | JSON/TXT 후보. 네트워크·저장·재귀 개인정보 탐색 없음 |
| src/features/library/LibraryProvider.tsx | ready·이동·쓰기 후 공개·변경 잠금·기한 정리·배치 |
| tests/ | 링크·parser·v2/실패·provenance·서버/OAuth 경계 검사 |
| design/tokens.json | 토큰 원본. tokens:generate 후 생성 코드 함께 검토 |
| design/component-map.json, figma-manifest.json | 코드 연결과 실제 원격 node/권한 상태. 자동 동기화 아님 |

기본 UI의 브랜드색·회색 카드, 24px 여백·56px 컨트롤·48px 터치 영역을 유지한다. 선택 입력을 접어도 값을 보존하고 탭·검색·출처·분류를 함께 적용한다. API 연결을 기본 저장 기능의 필수 조건으로 만들지 않는다.

## 플랫폼별 규칙

**YouTube:** 일반 이름 있는 재생목록을 대상으로 한다. WL은 공식 조회 제한, LL 좋아요는 이번 경로에서 거부한다. 별도 videos.list?myRating=like는 후속 작업이다. 페이지당 최대 50개, 사용자가 요청한 페이지만 조회하고 화면/배치 최대 200건이다. 반환되지 않는 삭제·비공개 영상을 재구성하지 않는다. OAuth Testing은 최대 100명·7일 동의/refresh token 만료 제약이 있다.

**Instagram:** 2026-06-15부터 공개 oEmbed는 토큰·App Review가 필요하지 않다. HTML은 원문 표시용이며 제목·장소·작성자·썸네일 추출·저장·분석에 쓰지 않는다. private·비활성·연령 제한·embed 금지 계정·Stories는 지원되지 않는다. 실패해도 원본 열기를 제공한다. 소비자 저장함 endpoint나 작동하지 않는 로그인 버튼을 만들지 않는다.

**NAVER:** 지역 검색은 개인 즐겨찾기 조회가 아니다. 최대 5개 후보이며 사용자가 주소를 확인한다. WGS84 공지 예시를 기준으로 longitude=mapx/10^7, latitude=mapy/10^7과 유효 범위를 검사한다. 오래된 KATECH XML 예시를 새 좌표 fixture로 쓰지 않는다. 공유 리스트 링크에서 모든 장소를 가져왔다고 설명하지 않는다.

**파일:** UTF-8 2MiB·최대 200개. 한 줄당 HTTPS 하나인 TXT, 최상위 [{url,title?}], 제한된 saved_saved_media의 직접 string_map_data.*.href만 읽는다. 호환 입력이며 검증된 공식 export 규격이 아니다. unknown JSON은 오류를 내고 개인정보 전체를 재귀 탐색하지 않는다. 공식 도메인·안전 URL 후보를 사용자가 확인·선택한다. [파일 계약](import-files.md)

## 저장·제목·기한·해제 계약

키는 moa.library.v1, 값은 { version: 2, items: [...] }다. 기존 배열은 모든 항목을 검증한 뒤 한 번의 교체 쓰기로 이동한다. ID·사용자 텍스트·방문 상태·생성일·순서를 유지한다. 잘못된 JSON·unknown version·항목 오류는 전체 실패로 처리하고 원본을 보존한다. 이동/정리 쓰기 실패는 ready가 되지 않으며 재시도 전 변경을 막는다.

title과 사용자 메모는 기본 정보다. external은 YouTube 제목·작성자·fetchedAt 캐시이고 titleMode가 표시를 결정한다. importedFrom은 API 항목 전체의 provider·method·fetchedAt·connectionId 근거다. place는 선택한 NAVER 주소·좌표·시각이다. API 응답 아닌 값으로 근거를 꾸미지 않는다. 파일 후보는 origin 없이 일반 링크로 저장한다.

- 로드·변경 저장·전경 복귀·전경에서 1시간 주기 확인 때 정리한다. 종료 중 백그라운드 정리·자동 갱신을 보장하지 않는다.
- 수동 링크의 외부 제목만 30일 만료되면 캐시를 지우고 기본 제목·URL·메모·방문 상태를 남긴다.
- API 재생목록·장소는 30일 뒤 전체 항목과 메모·분류·방문 상태를 삭제한다. 가져오기 전에 사용자에게 설명한다.
- 수정·중복 재가져오기는 기존 API 시각을 늘리지 않는다. 장소 이름 수정 시 이전 좌표를 지우고 URL 변경 시 제목을 다시 확인한다.
- 변경은 쓰기 성공 후 상태를 갱신한다. 배치는 전체 검증·중복 제외 후 한 번 저장하며 실패 시 목록·입력을 보존한다.
- 단일 YouTube 연결 MVP의 명시적 해제는 removeAccountImports()로 **이 기기의 모든 account-playlist 항목** 삭제를 먼저 저장한 뒤 remote revoke한다. 서버의 현재 connectionId만 대상으로 삼지 않는다.
- 로컬 삭제 실패 시 remote 요청을 하지 않는다. 원격 실패 시 연결 상태를 유지하고 재시도한다. 이전 항목이 이미 삭제됐더라도 해제 재시도가 가능해야 한다. 공개 재생목록·수동 링크는 유지한다.
- 일시적 offline·상태 실패·서버 재시작만으로 가져온 목록을 즉시 삭제하지 않는다. 외부 취소/만료의 운영 감지·정기 확인은 별도로 검증한다.

API 제목 수동 변경 시 외부 데이터와 사용자 작성 데이터가 구분되는지, 기한/해제 정책을 우회하는 복사본이 남지 않는지 최종 검증이 남아 있다. 이 확인 전 운영 정책이 완성됐다고 설명하지 않는다. 함수·실패 계약은 [저장 v2](storage-v2.md)를 따른다.

## Figma 상태

현재 작업 파일은 새로 만든 [모아 · 저장 콘텐츠 & 서비스 연동](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ)이다. 연결된 23010843의 팀 계정에서 생성했고 페이지 0:1에 편집 가능한 텍스트·Auto Layout·컴포넌트·변수를 구성했다. 소스 59205e5 기준 디자인 초안이며 픽셀 단위 동기화 결과가 아니다. 이전 sNrklbLn8Fd9HXMU3GLQUt 파일은 현재 계정에 편집 권한이 없어 변경하지 않았고 기록을 보존한다.

SCR-001~005/CMP-001~007은 실제 node를 기록했다. 핵심 5화면·4상태·서비스 전체 구성·컴포넌트 상태·Handoff가 있고 primitive 31개+alias 31개, Noto Sans KR 스타일 8개, Ionicons SVG 컴포넌트 14개를 사용한다. 화면 이동 reaction 22개 등록·읽기 확인과 재생 검증을 구분한다. 원본 화면은 페이지 최상위이며 리뷰 보드 복제본과 함께 관리한다.

현재 draft 파일이며 팀원 초대·공유 권한 변경·라이브러리/Code Connect 게시는 수행하지 않았다. 로컬 매핑과 API/검색 결과 예시를 실제 게시·실제 제공자 응답으로 설명하지 않는다. [디자인 node/코드 표](design-handoff.md#디자인-id--코드), [Figma 작업 기록](figma-sync.md), [manifest](../design/figma-manifest.json)의 최신 구조·시각 확인 범위를 따른다.

## 다음 작업과 검사

1. 브랜치/base·작업 파일을 확인하고 필요한 자격 증명을 .env.local에 설정한다. 값 출력 없이 설정 여부·실제 성공을 구분한다.
2. 사용자 로그인으로 OAuth → 일반 재생목록 → 2페이지·중복·선택 저장 → 재실행을 검증한다. 거절·만료·해제 원격 실패/재시도·로컬 쓰기 실패를 함께 확인한다.
3. 유효 NAVER 키로 검색·다른 지점·주소·좌표·저장·원문 열기를 확인한다. 실기기 지도 앱 설치/미설치도 분리한다.
4. 동의받은 익명화 export 샘플로 필요한 링크만 읽는지 확인한다. 검증된 형태만 추가한다.
5. API 제목 수동 편집·메모·30일 경계·해제 후 남는 데이터를 최종 확인하고 정책·UI·테스트를 맞춘다.
6. 운영 배포 전 HTTPS·사용자별 세션·토큰 보호·취소 감지·네이티브 callback·개인정보처리방침·OAuth 검증을 마련한다.
7. 새 Figma 파일의 실제 node·컴포넌트·변수를 보존하며 원본·리뷰 복제본을 함께 갱신한다. 변경에 영향받는 상태를 추가하고 시각·프로토타입 재생·320px/접근성의 별도 검증 범위를 기록한다.

~~~sh
npm run typecheck
npm run lint
npm test
npm run tokens:check
npm run build:web
~~~

모의 OAuth/NAVER와 빌드가 실제 계정·키·실기기 검증을 대신하지 않는다. 공개 YouTube/Instagram API 응답 성공과 웹 iframe 최종 표시도 구분한다. 현재 head의 수행 결과는 [검증 기록](verification.md)에 남긴다.

다른 개발자의 Codex에 전달할 시작 프롬프트:

> AGENTS.md, README.md, docs/codex-handoff.md, docs/api-server.md, docs/storage-v2.md를 읽고 브랜치·PR base·git status를 확인해 주세요. 화면 작업은 docs/design-handoff.md, docs/figma-sync.md와 현재 manifest도 읽고 새 Figma 파일의 SCR/CMP 원본·리뷰 복제본을 함께 관리해 주세요. API는 localhost 웹 미리보기이며 공개 YouTube 제목·Instagram oEmbed만 실제 성공을 확인했습니다. 기존 데이터와 다른 개발자의 변경을 보존하고 Google/NAVER 설정 여부를 값 출력 없이 확인한 뒤 실제 계정 재생목록·NAVER 검색·해제/저장 실패를 검증해 주세요. 지원하지 않는 개인 저장함 API나 미검증 export 규격을 만들지 마세요. 수행 검사·남은 범위와 SCR/CMP ID를 기능별 PR로 전달해 주세요.
