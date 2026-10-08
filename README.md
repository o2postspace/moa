# 핀맵 · 저장 콘텐츠 비서

여러 서비스에서 저장한 콘텐츠를 한곳에 정리하고, 이후 장소와 시기에 맞춰 다시 발견하도록 확장하는 웹앱입니다. 2026-10-08 사용자 요청으로 이름을 **핀맵**으로 바꿨습니다. 기존 저장소 주소와 브라우저 저장 키는 유지합니다. 기본 화면은 React DOM·Vite·React Router로 구현하며 데스크톱과 모바일 브라우저에서 사용합니다. 기존 Expo·React Native 소스와 의존성은 후속 네이티브 작업용으로 보관합니다.

현재 AnyJev 작업 브랜치는 **codex/anyjev-instagram-analysis**이며 웹 전환 브랜치 codex/content-integrations의 **03d73fd**에서 시작했습니다. 기존 웹·API·Figma 구현은 [draft PR #2](https://github.com/o2postspace/moa/pull/2), 그 기반 UI는 [PR #1](https://github.com/o2postspace/moa/pull/1)에서 검토합니다. main에는 아직 병합되지 않았습니다.

Instagram 상세에 **간단 분석**을 추가했습니다. 사용자가 제공한 캡션·화면 글자·릴스 자막을 정리하고, 연결된 AnyJev 서버로 분류·추가 근거 필요 여부를 판단합니다. 동일 입력의 결과를 잠시 재사용하며 추천을 자동 저장하지 않습니다. 현재 모델 서버는 없어서 텍스트 정리 미리보기와 연결 코드까지 사용할 수 있습니다. 영상 자동 읽기·OCR/STT·실제 모델 추론·토큰 절감률은 미검증입니다. [분석 계약과 실행](docs/instagram-analysis.md)

2026-10-03 React DOM 웹 전환을 완료했습니다. 기존 브라우저 저장 5건·방문 표시 보존, 1440/390/320px 레이아웃, 새로고침·검색/분류·방문 저장·수정·중복 방지와 실제 공개 재생목록 17개 조회·Instagram 원문 표시를 확인했습니다. 타입·린트·84개 테스트·토큰·웹 빌드가 통과했습니다. 확인 범위와 남은 파일 선택/계정 검증은 [검증 기록](docs/verification.md)을 따릅니다.

## 현재 사용할 수 있는 기능

| 흐름 | 구현과 검증 범위 |
| --- | --- |
| 링크 저장·정리 | 제목·분류·장소 이름·메모, 전체/방문 완료 탭, 검색·출처 필터, 상세·수정·방문 상태, 중복 안내와 기기 저장 |
| YouTube 영상 링크 | 웹에서 붙여넣기 후 공식 oEmbed로 제목 불러오기. API 키 없이 실제 응답 성공 확인 |
| Instagram 공개 원문 | 웹 상세에서 사용자 요청 시 공식 tokenless oEmbed 표시. 실제 API 응답 성공 확인; 개인 저장함 조회·제목/장소 추출과는 다름 |
| Instagram 간단 분석 | 사용자 캡션·OCR·자막 텍스트를 2,400자 이하로 정리 → 선택형 분류·근거 판단 → 수동 확인. AnyJev 모델 서버 미연결이며 실제 추론·절감 효과 검증은 남음 |
| YouTube 재생목록 | 실제 API 키로 공개 재생목록 17개 조회·웹 후보 선택 확인. 계정 연결·중복 제외·선택 저장 구현; 실제 Google OAuth·50개 이상 페이지 이동·계정 가져오기는 검증이 남음 |
| 직접 공유한 지도 링크 | 링크·사용자가 작성한 제목을 수동 저장. NAVER API 검색·키 발급은 보류했으며 서비스 연결에 검색 진입을 제공하지 않음 |
| JSON/TXT 가져오기 | 기기에서 파일 선택 → 링크 후보 검토·선택·일괄 저장. UTF-8 2MiB·최대 200건. 실제 계정 export 호환성 미검증 |
| API 정보 보존 | 기존 배열을 v2 저장값으로 이동, YouTube 30일 정리와 계정 가져오기 삭제 경로 구현. 신규 NAVER API 항목 저장은 도메인에서 거부하며 기존 v2 읽기·정리는 호환성 유지 |

첫 실행의 저장함은 비어 있습니다. 예시 데이터를 자동 삽입하지 않습니다. **Instagram 개인 저장함, YouTube ‘나중에 볼 동영상’, NAVER 지도 개인 저장 목록의 자동 동기화는 제공하지 않습니다.** YouTube 좋아요 영상 가져오기도 이번 범위 밖입니다. 파일·공유 링크·이름 있는 재생목록으로 사용자가 가져올 대상을 확인합니다.

API 기능은 현재 localhost의 **웹 개발 미리보기**를 대상으로 합니다. 운영 로그인·HTTPS 배포·클라우드 저장, 앱 내 지도 SDK, 행사 날짜·근처 알림, 자유 생성 AI·개인화는 남아 있습니다. AnyJev 텍스트 분류 연결과 영상·음성 자체 분석을 구분합니다. 모바일 브라우저의 파일 선택·클립보드·외부 지도 열기와 보관한 네이티브 소스의 동작은 별도 검증 대상입니다.

현재는 **공개 YouTube 재생목록·Instagram 링크·JSON/TXT 후보 가져오기**로 저장함을 정리합니다. 공개 재생목록은 등록된 API 키를 사용하며 Google 로그인 없이 시작할 수 있습니다. Google Cloud 프로젝트 생성과 YouTube Data API 활성화는 완료했지만 OAuth client 발급·서버 등록·실제 계정 동의는 후속 검증입니다. 사용자 요청에 따라 NAVER API 검색·발급은 보류했고 결제수단 등록을 요구하지 않습니다. 최신 범위는 [키·계정 설정 기록](docs/api-setup.md)을 확인합니다.

## 실행

Node.js 24와 npm을 사용합니다. 의존성은 package-lock.json을 기준으로 설치합니다.

~~~sh
npm ci
~~~

[.env.example](.env.example)을 복사해 .env.local을 만들고 필요한 값만 채웁니다. 기존 .env.local과 등록한 키는 그대로 사용하며 덮어쓰지 않습니다. 공개 재생목록은 서버의 `YOUTUBE_API_KEY`를 사용하며 Google OAuth·NAVER 키는 현재 기본 흐름의 필수값이 아닙니다. **서버 비밀값에는 `VITE_` 또는 `EXPO_PUBLIC_` 접두사를 붙이지 않습니다.** 실제 값을 채운 파일은 Git에 넣지 않습니다. 변수·callback 설정은 [API 서버 문서](docs/api-server.md)를 따릅니다.

NAVER backend 어댑터와 이전 검색 화면 코드는 후속 작업용으로 보존합니다. 앱의 `/places` 주소는 API 요청 없이 보류 안내를 표시합니다. 현재 실행을 위해 NAVER 키를 발급하거나 결제수단을 등록할 필요는 없습니다. [보류 기록](docs/api-setup.md#네이버-연동-보류)

한 터미널에서 API와 웹을 함께 실행합니다.

~~~sh
npm run dev    # API 8787 + React DOM 웹 8081
~~~

`npm start`도 같은 명령입니다. 브라우저에서 **http://localhost:8081**을 열고 Ctrl+C로 두 자식 서버를 함께 종료합니다. 한 서버가 실패하면 다른 서버도 정리합니다. 8081이 사용 중이면 다른 포트로 자동 이동하지 않고 실패하므로 기존 개발 서버를 먼저 종료합니다. 별도 실행이 필요할 때 `npm run api`는 API만, `npm run web`은 Vite만 시작합니다.

웹은 같은 origin의 `/api`에 요청하고 Vite가 loopback의 API8787로 전달합니다. browser Origin·HttpOnly cookie와 기존 Google callback을 유지합니다. API는 Node의 기본 환경 파일 loader를 사용하고 비밀값·OAuth 토큰을 앱으로 보내지 않습니다. 앱 접속은 `localhost`로 유지하며 `127.0.0.1`이나 다른 포트로 바꾸면 저장소 origin과 계정 cookie가 달라집니다. 키가 없어도 수동 링크·파일 정리와 공개 YouTube 제목·Instagram embed를 사용할 수 있습니다.

`npm run build` 또는 `npm run build:web`은 `dist/`를 생성합니다. 빌드 검토는 개발 서버를 종료한 후 별도 API와 `npm run preview`를 사용합니다. dev·preview의 API proxy와 SPA 경로 fallback은 로컬 검토용이며 운영 배포 설정이 아닙니다. 실제 배포에는 `/api` reverse proxy·HTTPS·사용자별 인증과 `/add`, `/content/:id`, `/integrations`의 HTML fallback을 별도로 구성해야 합니다.

보관한 네이티브 소스는 `npm run native:start`, `npm run android`, `npm run ios`에서 이어갈 수 있습니다. 기본 웹 실행·빌드·검사는 Expo를 사용하지 않습니다. 네이티브 API·OAuth callback·실기기 검증은 후속 단계이며 스토어 설치 파일은 배포하지 않았습니다.

```text
src/web/main.tsx        React DOM 진입점
src/web/App.tsx         React Router·웹 레이아웃
src/web/pages/          저장함·추가·상세·서비스 연결·보류 안내
src/web/components/     DOM UI·공개 Instagram 표시
src/web/library/        브라우저 저장 어댑터·상태
src/web/lib/            같은 origin API·파일·외부 링크
src/domain/             공유 콘텐츠·파일·보존 규칙
server/                 서버 전용 공식 API·OAuth
src/app/, src/features/ 보관한 Expo·React Native 구현
```

## 저장과 연결 해제

저장 키 moa.library.v1을 유지하고 값은 { version: 2, items: [...] }로 바꿉니다. 기존 ID·제목·메모·방문 상태·순서를 유지하며 이동 쓰기가 성공한 뒤에만 사용 준비 상태가 됩니다. 손상된 데이터나 쓰기 실패를 빈 저장함으로 바꾸지 않습니다. [저장 형식·실패 계약](docs/storage-v2.md)

수동 링크의 YouTube 제목 캐시는 30일 뒤 기본 제목으로 돌아갑니다. YouTube API 재생목록으로 가져온 항목은 30일 뒤 앱 사용 시 **항목 전체와 그 메모·분류·방문 상태가 정리**됩니다. 자동 갱신은 아직 없습니다. 단일 YouTube 연결 MVP의 연결 해제는 이 기기의 모든 account-playlist 항목 삭제를 먼저 저장한 뒤 Google 토큰 해제를 요청합니다. 원격 해제가 실패하면 연결 상태를 유지하여 재시도합니다. 공개 재생목록·수동 링크는 계정 해제로 삭제하지 않습니다.

NAVER 검색은 현재 앱 흐름에서 제외했습니다. 사용자가 직접 공유한 지도 링크와 작성한 제목은 수동으로 저장할 수 있습니다. 보류한 검색 코드를 다시 활성화할 때도 API 결과의 이름·주소·좌표를 저장함에 넣지 않는 계약을 유지해야 합니다. 기존 검색 코드의 메모리 만료·정책 근거는 [API 서버](docs/api-server.md)와 [설정 기록](docs/api-setup.md#네이버-연동-보류)에 남겼습니다.

기존 v2 NAVER API 항목의 읽기·방문 변경·30일 정리는 호환성을 위해 유지합니다. 해당 항목 수정과 신규 API 저장은 거부하며 사용자 데이터를 앞당겨 삭제하지 않습니다. 이 호환성 동작을 약관 준수 완료로 설명하지 않습니다. [기존 데이터 계약과 남은 검토](docs/storage-v2.md)

웹은 기존 Expo 웹과 같은 `http://localhost:8081`의 `localStorage`와 `moa.library.v1` 키를 사용합니다. 저장 형식·키를 초기화하지 않고 기존 브라우저의 5건이 이어지는 것을 확인했습니다. 같은 origin의 웹 탭은 Web Locks 안에서 최신 저장값을 읽고 변경을 저장합니다. Web Locks 미지원 환경은 기존 유효 v2 읽기를 허용하고 쓰기를 차단합니다. 데이터는 이 브라우저에만 저장하며 백업·여러 기기 동기화는 아직 없습니다. 웹 manifest와 아이콘을 준비했으며 service worker·오프라인 API 기능은 구현하지 않았습니다.

## 팀 협업과 디자인

- 저장소: [o2postspace/moa](https://github.com/o2postspace/moa)
- 개발자·Codex 시작점: [AGENTS.md](AGENTS.md) → [Codex 인수인계](docs/codex-handoff.md)
- 연동 설정: [실제 키·계정 설정](docs/api-setup.md), [API 서버](docs/api-server.md), [파일 가져오기](docs/import-files.md), [저장 형식 v2](docs/storage-v2.md)
- 다음 작업: [로드맵](docs/roadmap.md), [검증 기록](docs/verification.md)
- UI/UX 전달: [디자인 기준](docs/design-handoff.md), [UI 리디자인](docs/ui-refresh.md), [Figma 연결 상태](docs/figma-sync.md), [컴포넌트 매핑](design/component-map.json)
- [GitHub 협업 절차](docs/github-setup.md)와 .github/의 이슈·PR 템플릿·CI

앱은 핀맵 주황색 #C94C2B, 흰 배경·회색 카드·둥근 컨트롤을 사용합니다. 연결된 계정의 새 [Figma 작업 파일](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-256)에 편집 가능한 화면·상태·공통 컴포넌트·변수를 구성했습니다. UI/UX 팀이 직접 수정할 수 있으며 원본 화면과 리뷰 보드 복제본을 함께 관리합니다. 소스 59205e5의 초안은 [baseline 기록](design/history/figma-manifest-2026-10-03-baseline.json)으로 보존합니다. NAVER 제외 범위에 맞춘 서비스 연결·보류 화면의 최신 부분 갱신, 실제 node·reaction 수·시각 확인 범위는 [현재 manifest](design/figma-manifest.json)를 따릅니다. 디자인 등록은 실제 API 성공·자동 픽셀 동기화·프로토타입 재생 검증을 뜻하지 않습니다. 팀 초대·라이브러리/Code Connect 게시는 수행하지 않았고 [이전 SVG](design/moa-ui-refresh.svg)와 이전 파일 기록은 보존합니다.

## 검사

~~~sh
npm run typecheck
npm run lint
npm test
npm run tokens:check
npm run build:web
~~~

npm test는 링크·파일·저장 실패/이동·보존 기한·서버/OAuth 경계와 개발 자식 프로세스 정리를 검사합니다. 기본 typecheck·lint는 `src/web`, 공유 domain, server, tests, 실행 설정을 대상으로 하며 보관한 Expo 화면은 제외합니다. 모의 OAuth·NAVER 응답과 빌드 성공은 실제 계정 로그인·유효 API 키·브라우저 동작·네이티브 검증을 대신하지 않습니다. API 제목 수동 변경의 출처·보존 정책 최종 검증도 남아 있습니다. 현재 head의 실제 결과는 [검증 기록](docs/verification.md)과 [GitHub Actions](https://github.com/o2postspace/moa/actions)에서 확인합니다.
