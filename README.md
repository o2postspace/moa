# 모아 · 저장 콘텐츠 비서

여러 서비스에서 저장한 콘텐츠를 한곳에 정리하고, 이후 장소와 시기에 맞춰 다시 발견하도록 확장하는 모바일 앱입니다. 이름은 임시 작업명입니다.

현재 개발 브랜치는 **codex/content-integrations**입니다. [UI PR #1](https://github.com/o2postspace/moa/pull/1)의 codex/mmm-ui-refresh head **835dd81**에서 시작한 기능 브랜치이며 main에는 아직 병합되지 않았습니다. API·Figma 협업 작업은 UI 브랜치를 base로 한 [draft PR #2](https://github.com/o2postspace/moa/pull/2)에서 검토합니다.

## 현재 사용할 수 있는 기능

| 흐름 | 구현과 검증 범위 |
| --- | --- |
| 링크 저장·정리 | 제목·분류·장소 이름·메모, 전체/방문 완료 탭, 검색·출처 필터, 상세·수정·방문 상태, 중복 안내와 기기 저장 |
| YouTube 영상 링크 | 웹에서 붙여넣기 후 공식 oEmbed로 제목 불러오기. API 키 없이 실제 응답 성공 확인 |
| Instagram 공개 원문 | 웹 상세에서 사용자 요청 시 공식 tokenless oEmbed 표시. 실제 API 응답 성공 확인; 개인 저장함 조회·제목/장소 추출과는 다름 |
| YouTube 재생목록 | 실제 API 키로 공개 재생목록 17개 조회·웹 후보 선택 확인. 계정 연결·중복 제외·선택 저장 구현; 실제 Google OAuth·50개 이상 페이지 이동·계정 가져오기는 검증이 남음 |
| NAVER 장소 검색 | 검색 → 주소 확인 → 장소 선택·좌표 저장 → 네이버 지도 열기 구현. NAVER 키가 없어 실제 검색 응답과 실기기 지도 앱 실행 미검증 |
| JSON/TXT 가져오기 | 기기에서 파일 선택 → 링크 후보 검토·선택·일괄 저장. UTF-8 2MiB·최대 200건. 실제 계정 export 호환성 미검증 |
| API 정보 보존 | 기존 배열을 v2 저장값으로 이동, 출처·확인 시각 기록, 30일 정리와 계정 가져오기 삭제 경로 구현 |

첫 실행의 저장함은 비어 있습니다. 예시 데이터를 자동 삽입하지 않습니다. **Instagram 개인 저장함, YouTube ‘나중에 볼 동영상’, NAVER 지도 개인 저장 목록의 자동 동기화는 제공하지 않습니다.** YouTube 좋아요 영상 가져오기도 이번 범위 밖입니다. 파일·공유 링크·이름 있는 재생목록으로 사용자가 가져올 대상을 확인합니다.

API 기능은 현재 localhost의 **웹 개발 미리보기**를 대상으로 합니다. 운영 로그인·HTTPS 배포·클라우드 저장, 앱 내 지도 SDK, 행사 날짜·근처 알림, AI·개인화는 남아 있습니다. 모바일 파일 선택·지도 앱 연계 코드는 실제 iOS/Android 기기에서 별도로 확인해야 합니다.

## 실행

Node.js 24와 npm을 사용합니다. 의존성은 package-lock.json을 기준으로 설치합니다.

~~~sh
npm ci
~~~

[.env.example](.env.example)을 복사해 .env.local을 만들고 필요한 값만 채웁니다. Google/NAVER 비밀값은 서버용 변수이며 EXPO_PUBLIC_ 접두사를 붙이지 않습니다. 실제 값을 채운 파일은 Git에 넣지 않습니다. 변수·발급·callback 설정은 [API 서버 문서](docs/api-server.md)를 따릅니다.

터미널 두 개에서 실행합니다.

~~~sh
npm run api    # 로컬 API, http://localhost:8787
~~~

~~~sh
npm run web    # Expo 웹, http://localhost:8081
~~~

기본 포트가 사용 중이면 APP_ORIGIN, 앱 API 주소와 Google callback 등록값을 함께 맞춥니다. 앱과 API 접속 호스트는 모두 localhost로 통일합니다. API는 Node의 기본 환경 파일 loader를 사용하고 비밀값·OAuth 토큰을 앱으로 보내지 않습니다. 키가 없어도 수동 링크·파일 정리와 공개 YouTube 제목·Instagram embed 경로를 사용할 수 있습니다.

모바일 기본 저장 흐름은 npm start, npm run android, npm run ios로 검토합니다. iOS 로컬 빌드에는 macOS/Xcode가 필요합니다. 네이티브 OAuth callback과 실기기 검증은 development build 단계에서 진행하며 현재 스토어 설치 파일은 배포하지 않았습니다.

## 저장과 연결 해제

저장 키 moa.library.v1을 유지하고 값은 { version: 2, items: [...] }로 바꿉니다. 기존 ID·제목·메모·방문 상태·순서를 유지하며 이동 쓰기가 성공한 뒤에만 사용 준비 상태가 됩니다. 손상된 데이터나 쓰기 실패를 빈 저장함으로 바꾸지 않습니다. [저장 형식·실패 계약](docs/storage-v2.md)

수동 링크의 YouTube 제목 캐시는 30일 뒤 기본 제목으로 돌아갑니다. API 재생목록·NAVER 검색으로 가져온 항목은 30일 뒤 앱 사용 시 **항목 전체와 그 메모·분류·방문 상태가 정리**됩니다. 자동 갱신은 아직 없습니다. 단일 YouTube 연결 MVP의 연결 해제는 이 기기의 모든 account-playlist 항목 삭제를 먼저 저장한 뒤 Google 토큰 해제를 요청합니다. 원격 해제가 실패하면 연결 상태를 유지하여 재시도합니다. 공개 재생목록·수동 링크는 계정 해제로 삭제하지 않습니다.

데이터는 이 기기에만 저장합니다. 앱 삭제·브라우저 저장소 초기화로 사라질 수 있으며 백업·자동 복구·여러 기기 동기화는 아직 없습니다.

## 팀 협업과 디자인

- 저장소: [o2postspace/moa](https://github.com/o2postspace/moa)
- 개발자·Codex 시작점: [AGENTS.md](AGENTS.md) → [Codex 인수인계](docs/codex-handoff.md)
- 연동 설정: [실제 키·계정 설정](docs/api-setup.md), [API 서버](docs/api-server.md), [파일 가져오기](docs/import-files.md), [저장 형식 v2](docs/storage-v2.md)
- 다음 작업: [로드맵](docs/roadmap.md), [검증 기록](docs/verification.md)
- UI/UX 전달: [디자인 기준](docs/design-handoff.md), [UI 리디자인](docs/ui-refresh.md), [Figma 연결 상태](docs/figma-sync.md), [컴포넌트 매핑](design/component-map.json)
- [GitHub 협업 절차](docs/github-setup.md)와 .github/의 이슈·PR 템플릿·CI

앱은 모아 주황색 #C94C2B, 흰 배경·회색 카드·둥근 컨트롤을 사용합니다. 연결된 계정에 새 [Figma 작업 파일](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-256)을 만들어 핵심 5화면, 4가지 상태, 공통 컴포넌트 7종과 변수 62개를 네이티브 요소로 구성했습니다. UI/UX 팀이 직접 수정할 수 있으며 원본 화면과 리뷰 보드 복제본을 함께 관리합니다. 소스 59205e5 기준의 디자인 초안이고 실제 API 성공이나 픽셀 단위 자동 동기화를 뜻하지 않습니다. 화면 이동 reaction 22개는 등록·읽기 확인했으며 재생 검증은 별도입니다. 현재 node와 확인 범위는 [manifest](design/figma-manifest.json)를 따릅니다. 팀 초대·라이브러리/Code Connect 게시는 수행하지 않았고 [이전 SVG](design/moa-ui-refresh.svg)와 이전 파일 기록은 보존합니다.

## 검사

~~~sh
npm run typecheck
npm run lint
npm test
npm run tokens:check
npm run build:web
~~~

npm test는 링크·파일·저장 실패/이동·보존 기한·서버/OAuth 경계의 자동 검사를 실행합니다. 모의 OAuth·NAVER 응답과 빌드 성공은 실제 계정 로그인·유효 API 키·네이티브 검증을 대신하지 않습니다. API 제목 수동 변경의 출처·보존 정책 최종 검증도 남아 있습니다. 현재 head의 실제 결과는 [검증 기록](docs/verification.md)과 [GitHub Actions](https://github.com/o2postspace/moa/actions)에서 확인합니다.
