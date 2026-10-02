# 모아 · 개발 에이전트 지침

사용자가 저장한 콘텐츠를 정리하고 장소·시기에 맞춰 다시 발견하게 하는 앱이다. React Native + Expo + TypeScript로 작은 사용자 흐름씩 추가하며 설명·인수인계는 한국어로 쓴다.

## 작업 시작

1. README.md와 docs/codex-handoff.md를 읽고 구현 범위·실행·브랜치/base를 확인한다.
2. git status와 현재 브랜치를 확인하고 다른 개발자의 변경을 보존한다. 현재 codex/content-integrations는 열린 UI draft PR #1의 head 835dd81에서 시작한 기능 브랜치이며 main에는 미병합이다.
3. API 작업은 docs/api-server.md, docs/storage-v2.md, docs/import-files.md와 관련 어댑터·도메인·테스트를 읽는다.
4. 화면 변경은 docs/design-handoff.md, docs/ui-refresh.md, docs/figma-sync.md와 디자인 manifest·컴포넌트 매핑을 읽는다. 기능 순서는 docs/roadmap.md를 따른다.

## 현재 제품·API 범위

- 새 설치의 저장함은 비어 있다. 예시·모의 응답·실제 가져온 결과를 구분한다.
- 기본 수동 링크 저장·정리와 웹 개발 API 코드가 있다. 공개 YouTube 제목·Instagram tokenless oEmbed 실제 응답 성공을 확인했으며 OAuth·재생목록·NAVER 검색은 키 설정과 실제 계정 검증이 남았다.
- Instagram 소비자 저장함·NAVER 지도 개인 저장 목록·YouTube Watch Later를 공식 API로 읽는 기능을 제공한다고 설명하지 않는다. 좋아요 영상은 이번 재생목록 흐름 밖이다.
- 파일은 확인 전 후보이며 공식 export 규격으로 단정하지 않는다. JSON/TXT UTF-8 2MiB·200건 제한과 비재귀 탐색·검토·선택을 유지한다.
- NAVER 지역 검색은 주소·좌표 후보다. 사용자가 지점을 확인하며 같은 장소 합치기와 같은 URL 중복을 구분한다. 지도 앱/웹 열기를 앱 내 지도 SDK 완료로 설명하지 않는다.
- 근처 알림·행사 기간·지도 SDK·AI·클라우드·운영 로그인/배포는 미구현이다. 실기기 파일 선택·지도 앱·OAuth·접근성은 웹 검사와 구분한다.

## 비밀값·서버 경계

- Node.js 24의 npm run api와 기본 환경 파일 loader를 사용한다. .env.example은 변수 설명만, 실제 .env.local과 토큰·사용자 export는 Git에 넣지 않는다. 비밀값을 출력하지 않는다.
- 서버 비밀값에 EXPO_PUBLIC_를 붙이지 않는다. OAuth 토큰은 앱 코드·URL·AsyncStorage·브라우저 응답·로그에 보내지 않는다.
- 현재 서버는 localhost 웹 개발용이며 기본 앱8081/API8787이다. Origin·cookie·Google callback과 호스트를 함께 맞춘다. 설정됨·연결됨·실제 응답 성공을 구분한다.
- OAuth state·PKCE·cookie·단회 callback·refresh/revoke와 고정 제공자 endpoint, 입력/응답/시간/페이지 제한을 유지한다.
- Instagram HTML은 사용자 요청의 원문 표시 전용이다. 제목·장소·썸네일·작성자를 추출·저장·분석하지 않는다. 실패 시 원본 열기를 제공한다.
- 운영 배포는 HTTPS·사용자별 인증/격리·토큰 보호·취소 감지·네이티브 callback·출시 검증을 따로 마련한다. 개발 서버를 그대로 외부에 노출하지 않는다.

## 데이터·실패 규칙

- URL 검증·출처·중복은 src/domain/content.ts에 유지한다. 실제 hostname 경계를 사용하고 의미 있는 query·fragment를 제거하지 않는다.
- 키 moa.library.v1을 유지하며 값은 { version: 2, items: [...] }다. 기존 배열 이동은 모든 항목 검증·교체 쓰기 성공 뒤에만 ready로 전환한다. ID·사용자 텍스트·방문·생성일·순서를 유지한다.
- unknown version·손상·항목 오류·이동/정리 쓰기 실패를 빈 저장함으로 바꾸거나 덮어쓰지 않는다. ready 전 변경은 막고 재시도한다.
- 모든 변경은 저장 성공 후 상태를 갱신한다. 배치는 전체 검증·중복 제외 후 한 번 저장하며 실패 시 목록·입력을 유지한다. 동시 변경 잠금을 보존한다.
- 사용자 기본 제목과 external 캐시·titleMode, importedFrom provenance, 확인된 place 좌표를 구분한다. API 응답 아닌 값으로 출처·시각을 확정하지 않는다.
- API 캐시는 30일 뒤 제거한다. 수동 링크는 기본 제목·메모를 유지하고 API 가져오기 항목은 전체 항목·메모·분류·방문 표시를 삭제한다. 자동 갱신은 없다. UI에 이 의미를 설명한다.
- 기한 정리는 로드·성공한 변경 저장·전경 복귀·전경 주기 확인에 적용한다. 수정·중복 재가져오기로 기한을 늘리지 않는다. 종료 중 백그라운드 정리를 보장하지 않는다.
- 단일 YouTube 연결 MVP의 명시적 해제는 이 기기의 모든 account-playlist 항목 삭제를 먼저 저장한 뒤 remote revoke한다. 현재 서버 connectionId 하나만 대상으로 삼지 않는다.
- 로컬 삭제 실패 시 remote 해제를 요청하지 않는다. remote 실패 시 연결 상태를 유지하고 재시도한다. 공개 재생목록·수동 링크는 유지하며 일시적 offline·서버 재시작만으로 즉시 삭제하지 않는다.
- 제목 수동 변경·URL/장소 변경·API 데이터 복사본의 기한/삭제 정책 최종 검증을 남긴다. 입력과 API 정보의 경계를 바꾸면 UI·모델·테스트·문서를 함께 수정한다.

## 디자인·협업

- 기능별 브랜치와 리뷰 가능한 PR을 사용한다. 기존 UI PR을 base로 한 API PR의 의존관계를 기록하고 main에 강제 푸시하지 않는다.
- 토큰 원본은 design/tokens.json이다. 변경 후 npm run tokens:generate로 생성 코드를 함께 갱신한다.
- SCR-001~003을 보존하고 SCR-004 서비스 연결, SCR-005 장소 검색, CMP-007 InstagramEmbed를 현재 코드 매핑에 기록한다. 실제 node가 없는 매핑은 Figma 완료로 표시하지 않는다.
- 현재 Figma는 연결 계정에 새로 만든 [모아 · 저장 콘텐츠 & 서비스 연동](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ)이다. docs/figma-sync.md와 현재 manifest의 실제 node를 따른다. 기존 sNrklbLn8Fd9HXMU3GLQUt 파일은 권한 부족으로 변경하지 않았으며 역사 기록을 보존한다.
- 새 파일의 SCR/CMP node·스타일·변수·인스턴스를 보존하며 갱신한다. 최상위 원본 화면과 리뷰 보드 복제본을 함께 관리한다. 5화면·4상태·7종 컴포넌트·62변수와 화면 이동 reaction 22개를 구성했으나 자동 픽셀 동기화·프로토타입 재생 검증·팀 라이브러리/Code Connect 게시 완료를 주장하지 않는다. SVG·이전 Figma 캡처는 새 파일의 검증 증거가 아니다.
- 전체/방문 탭과 검색·분류·출처 조건을 함께 적용하고 선택 입력을 접어도 값을 보존한다. 상태·설정 전 안내·로딩·오류·고정 액션·초점을 검증한다.

## 완료·인수인계

- typecheck·lint와 변경에 맞는 의미 있는 검사, 화면/토큰 변경의 tokens:check·build:web를 수행한다.
- 정상·빈·오류·로딩·재실행·중복·페이지·보존 기한·삭제·읽기/쓰기 실패를 변경 범위에 맞춰 확인한다. 모의 응답·웹·실제 계정·실기기를 구분한다.
- 공개 API 성공은 OAuth/키 기능 성공을 뜻하지 않는다. 실제 export·Google 계정·NAVER 키·네이티브·API 제목 수동 변경 정책의 남은 검증을 명시한다.
- README·Codex 인수인계·로드맵·검증 기록·SCR/CMP와 관련 계약을 함께 갱신한다. PR에 문제·결과·검사·남은 한계·브랜치/base를 적는다.

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
