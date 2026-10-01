# 모아 · 개발 에이전트 지침

이 저장소는 사용자가 저장한 콘텐츠를 정리하고 장소·시기에 맞춰 다시 발견하게 하는 앱이다. React Native + Expo + TypeScript로 작은 사용자 흐름씩 추가한다. 작업 설명과 인수인계는 한국어로 쓴다.

## 작업을 시작할 때

1. `README.md`에서 실행 방법과 현재 구현 범위를 확인한다.
2. 첫 작업이나 인수인계 후에는 `docs/codex-handoff.md`를 읽는다. 여기에 제품 맥락, 파일 책임, 데이터 규칙, 다음 작업과 시작 프롬프트가 있다.
3. 화면 변경은 `docs/design-handoff.md`, `docs/ui-refresh.md`와 `design/figma-manifest.json`, 기능 범위는 `docs/roadmap.md`를 참고한다. 요청된 작업과 관련된 소스와 문서만 추가로 읽는다.
4. `git status`와 현재 브랜치를 확인하고 다른 사람의 변경을 보존한다. 이미 변경된 파일을 덮어쓰거나 unrelated 작업을 되돌리지 않는다.

## 제품과 데이터 규칙

- 현재는 사용자가 직접 입력한 링크를 로컬 기기에 저장한다. 새 설치의 저장함은 비어 있다. 샘플을 실제 가져온 데이터처럼 보이게 하지 않는다.
- 기존 저장 정리와 네이버 장소 통합이 제품의 우선 관심사다. 계정 연동·일괄 가져오기는 공식 지원과 실제 샘플로 가능 범위를 확인한 뒤 구현한다.
- 위치 좌표·지도·행사 날짜·근처 알림·AI 분석·클라우드 동기화는 미구현이다. UI와 문서에서 동작하는 기능처럼 설명하지 않는다.
- 링크 검증과 중복 판별은 `src/domain/content.ts`에서 유지한다. 의미 있는 URL 쿼리를 제거하거나, 같은 장소와 같은 URL을 같은 중복 기준으로 취급하지 않는다.
- 저장 키는 `moa.library.v1`이며 현재 JSON 배열이다. 저장 형식을 바꿀 때 기존 항목을 유지하는 마이그레이션을 마련한다. 읽기 오류를 빈 저장함으로 바꾸거나 손상된 값을 덮어쓰지 않는다.
- 저장 성공 후 화면 상태를 갱신하는 `LibraryProvider`의 순서를 유지한다. 저장 실패 시 입력과 기존 내용이 유지되어야 한다.
- 미확인 장소·기간은 나중에 별도 상태로 표현한다. 콘텐츠 원본과 장소·행사 관계를 분리하는 방향으로 확장한다.

## 디자인과 협업

- 사용자 요청이 별도 경로를 정하지 않았다면 기능별 브랜치에서 하나의 흐름을 PR로 만든다. 작업 중인 파일과 범위를 인수인계에 기록한다. 원격 `main`에 강제 푸시하지 않는다.
- 디자인 토큰 원본은 `design/tokens.json`이다. 변경 후 `npm run tokens:generate`로 `src/theme/tokens.ts`를 함께 갱신한다. 생성 파일을 단독 편집하지 않는다.
- SCR/CMP ID를 유지하고 파일 이동 시 `design/component-map.json`, Figma manifest와 인수인계 표를 갱신한다. 이 매핑은 양방향 자동 동기화나 Code Connect 게시를 뜻하지 않는다.
- 현재 앱은 두 번째 UI이며 실제 Figma는 호출 한도로 갱신하지 못한 이전 디자인이다. 이전 Figma 핵심 3개 화면의 검증을 현재 코드의 시각 검증으로 대신하지 않는다. `design/moa-ui-refresh.svg`와 `docs/ui-refresh.md`는 새 UI 전달 초안·갱신 계획이다. 자동 동기화·프로토타입·Code Connect 설정 완료를 뜻하지 않는다.
- 기존 SCR/CMP node ID를 보존해 원격 갱신할 계획이다. `CMP-006 CategoryStamp`는 앱의 공통 시각 helper이며 코드 매핑을 기록했지만 Figma node는 아직 없다. 비어 있는 Brief/Flows/Handoff와 미검증 보드는 manifest·전달 문서의 범위를 확인한다.
- 전체 저장/방문 완료 탭과 검색·분류·출처 조건을 함께 적용한다. 출처 메뉴·선택 입력의 펼침 상태를 접근성 정보로 제공하고, 선택 입력을 접어도 값을 유지한다. 고정 하단 액션·오류 초점 이동은 좁은 화면·키보드에서 검증한다.
- 새 외부 서비스나 AI 제공자 연결은 해당 작업이 필요할 때 결정한다. 비밀값은 커밋하지 않고 예시 설정에는 변수 이름과 설명만 둔다.

## 작업 완료와 인수인계

- 코드 작업은 typecheck·lint와 변경에 맞는 의미 있는 동작 검사를 통과시킨다. 관련 토큰과 웹 화면이 바뀌면 `tokens:check`, `build:web`도 확인한다.
- 정상·빈 화면·오류·로딩, 재실행 후 유지, 긴 한국어·큰 글자·키보드·접근성을 변경 범위에 맞춰 확인한다. 웹 검사와 실제 iOS/Android 검증을 구분한다.
- PR에는 문제와 결과, 관련 SCR/CMP ID·디자인 링크, 수행한 검사, 남은 한계를 적는다. 미실행 검사를 통과했다고 기록하지 않는다.
- 다른 개발자에게 넘길 때 이슈/브랜치/커밋, 변경 파일, 검증 결과, 남은 작업을 남긴다. 구현 상태가 바뀌면 관련 README·인수인계·로드맵을 함께 갱신한다.

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
