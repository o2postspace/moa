# 모아 개발 인수인계 · Codex 시작 문서

2026-10-01, 앱 0.1.0의 실제 소스를 기준으로 작성했다. 개발자와 개발자의 Codex가 같은 맥락에서 작업을 이어가기 위한 문서다. 저장소는 [o2postspace/moa](https://github.com/o2postspace/moa)이며 공개 저장소다. 실제 사용자의 저장함 데이터와 인증정보는 저장소에 넣지 않는다.

## 먼저 읽을 순서

1. [AGENTS.md](../AGENTS.md): 저장소 작업 지침. Expo·React Native API를 바꾸기 전 해당 SDK 공식 문서를 확인하고 Expo Router를 사용한다.
2. [README.md](../README.md): 실행 방법과 현재 기능.
3. 이 문서: 제품 의도, 구현 경계, 데이터 규칙, 다음 작업.
4. [로드맵](roadmap.md), [검증 기록](verification.md): 단계별 범위와 실제 확인한 결과.
5. [디자인 전달 기준](design-handoff.md), [Figma manifest](../design/figma-manifest.json), [컴포넌트 매핑](../design/component-map.json): 실제 node·코드 연결과 미완료 디자인.
6. [도메인 규칙](../src/domain/content.ts), [저장소 상태](../src/features/library/LibraryProvider.tsx), [현재 테스트](../tests/content.test.ts), 작업할 화면·컴포넌트.

문서와 코드가 다르면 현재 코드·검사 결과로 차이를 확인하고 문서를 함께 수정한다. 이전 검증 기록을 새 변경의 검증으로 대신하지 않는다.

## 제품 의도와 사용자 우선사항

**모아는 저장한 콘텐츠를 정리하고, 실제로 쓸 수 있는 장소와 시기에 다시 발견하게 하는 모바일 앱이다.** 새로운 링크를 받는 기능과 이미 많이 쌓인 저장함을 정리하는 기능이 모두 중요하다.

- 인스타그램·유튜브 등에 **이미 저장한 콘텐츠**를 가져와 분류·검색·정리하는 경험을 우선한다. 실제 가져오기 지원 범위는 확인이 필요하다.
- **네이버 지도에 저장한 맛집**을 다른 콘텐츠와 함께 목록·지도에서 보고 싶다. 현재의 네이버 링크 저장을 네이버 저장함 연동으로 설명하지 않는다.
- 근처에 간 경우 저장한 장소를 다시 알려주고, 축제·전시·팝업은 **근처 조건과 실제 행사 기간을 함께** 확인한다. 노들섬 빛 축제는 사용자가 든 예시이며 확정된 행사 정보가 아니다.
- 한 기능씩 만들고 확인하며 확장한다. UI/UX 팀이 Figma로 검토하고 개발자는 SCR/CMP ID로 코드를 연결한다.
- 개인화 비서는 이후 단계다. 먼저 저장·정리·장소·기간 정보의 정확성과 사용 흐름을 만든다.

현재 콘텐츠는 링크 단위다. 향후 원본과 장소를 분리해 한 원본에 여러 장소, 한 장소에 여러 원본을 연결한다는 것은 **설계 방향이며 아직 구현된 관계 모델이 아니다.** 같은 장소 묶기와 같은 URL 중복 차단도 별도 기능이다.

## 구현된 것과 남은 것

| 범위 | 현재 상태 |
| --- | --- |
| 링크 저장 | 제목·링크 필수, 분류·장소 이름·메모 입력, URL 정규화·출처 판별·중복 안내 구현 |
| 저장함 정리의 기본 | 제목·장소·메모 검색, 출처·분류 필터, 최근 추가순 목록 구현 |
| 상세 | 원본 열기, 내용 수정, 방문 완료 표시·취소 구현 |
| 기기 저장 | AsyncStorage에 저장, 재실행 시 불러오기, 읽기 오류 안내·재시도, 저장 실패 시 기존 목록 유지 구현 |
| 기존 저장함 가져오기 | 미구현. 계정 연동·내보내기 파일·공유 리스트의 지원과 실제 형식부터 검증 필요 |
| 정리 확장 | 삭제·되돌리기·폴더·보관·일괄 수정 미구현 |
| 장소·행사 | 장소 이름 문자열만 있음. 좌표·Place 엔터티·행사 기간·정보 출처 확인 상태 미구현 |
| 지도·알림 | 지도 SDK, 길찾기 연계, 위치 권한·근처 알림·기간 조건·백그라운드 알림 미구현 |
| 개인화·서버 | AI 분석·추천, 로그인·클라우드 동기화·서버 미구현 |
| 배포·네이티브 검증 | 스토어 배포·설치 파일 없음. 실제 iOS·Android 기기 검증 전 |

처음 실행하면 저장함은 비어 있다. 예시 항목을 자동으로 삽입하지 않는다. 현재 링크 내용을 서버에서 읽거나 분석하지 않으며 원본 보기에서 외부 앱·웹을 연다. 로컬 저장 데이터는 앱 삭제나 브라우저 저장소 초기화로 사라질 수 있다. 백업·내보내기·자동 복구 기능은 없다.

## 가져와서 실행하기

개발자의 작업 폴더에서 다음 명령으로 시작한다. 특정 컴퓨터의 경로나 서버 포트에 의존하지 않는다.

```sh
git clone https://github.com/o2postspace/moa.git
cd moa
npm ci
npm start
```

Node.js 24와 npm을 사용한다. `package-lock.json`을 유지한다. 웹 검토는 `npm run web`, Android 개발 환경 검토는 `npm run android`, iOS 환경 검토는 `npm run ios`를 사용한다. 이 스크립트들은 Expo 개발 서버를 시작하며 스토어 설치 파일을 만드는 명령이 아니다. 접속 주소와 포트는 실행 결과를 따른다.

현재는 Expo SDK 57이다. Expo·React Native API나 네이티브 모듈을 수정할 때 [SDK 57 문서](https://docs.expo.dev/versions/v57.0.0/)와 `AGENTS.md`의 확인 절차를 따른다. SDK 호환 패키지는 `npx expo install <패키지>`로 추가한다. 생성되는 `ios/`, `android/` 디렉터리를 임의로 만들지 않고 네이티브 설정은 `app.json`과 config plugin으로 관리한다.

## 실행할 검사

```sh
npm run typecheck
npm run lint
npm test
npm run tokens:check
npm run build:web
```

의존성·Expo 설정을 바꾼 경우 `npx expo-doctor`도 확인한다. CI는 `.github/workflows/ci.yml`의 `quality` 작업이며 Node 24에서 `npm ci`와 위 검사를 실행한다. 최신 원격 검사 결과는 [GitHub Actions](https://github.com/o2postspace/moa/actions)에서 확인한다. CI 파일 존재는 원격 실행·브랜치 보호 규칙 설정 완료를 뜻하지 않는다.

초기 검증에서 위 검사와 expo-doctor가 통과했고, 웹에서 추가·유지·수정·방문 상태·검색·필터·중복·내비게이션을 확인했다. 자세한 범위는 [검증 기록](verification.md)을 따른다. 현재 자동 테스트는 도메인 8개다. **Provider의 실제 쓰기 실패를 검증하는 자동 테스트는 아직 없고**, 웹 빌드·도메인 테스트 통과는 네이티브 기기·접근성·저장 실패 검증을 대신하지 않는다.

## 구조와 변경 책임

| 파일·영역 | 책임과 변경 시 확인할 것 |
| --- | --- |
| `src/app/_layout.tsx` | Expo Router Stack, 폰트 로드, safe area, LibraryProvider 연결 |
| `src/app/index.tsx` | SCR-001 Library: 목록·검색·출처/분류 필터·빈 화면·읽기 오류 |
| `src/app/add.tsx` | SCR-002 AddLink: 추가와 수정 공용 폼. `id`가 있으면 수정, 필드 오류·중복 안내·저장 중 상태 |
| `src/app/content/[id].tsx` | SCR-003 ContentDetail: 원본 열기·수정 이동·방문 상태·없는 항목 |
| `src/components/` | CMP-001 ContentCard, CMP-002 FilterChip, CMP-003 PrimaryButton, CMP-004 SourceBadge, CMP-005 EmptyState 및 Screen/UiText. 공통 상태·터치 영역·화면 읽기 정보 |
| `src/domain/content.ts` | 타입, 필수 입력, URL·출처·중복, 검색, 저장 데이터 런타임 검증. 플랫폼 UI와 분리된 순수 규칙 |
| `src/features/library/LibraryProvider.tsx` | AsyncStorage 읽기·쓰기, 동시 변경 차단, 추가·수정·방문 상태. 모든 목록 변경은 이 저장 경로를 사용 |
| `design/tokens.json` | 앱 토큰의 원본 |
| `scripts/tokens.mjs`, `src/theme/tokens.ts` | 원본에서 코드 생성·일치 검사. 생성 코드만 직접 수정하지 않음 |
| `design/figma-manifest.json`, `design/component-map.json` | Figma 파일·node·매핑·검증 시점과 남은 작업 |
| `tests/content.test.ts` | 도메인 규칙 회귀 검사. 저장 기능 확장 시 필요한 실패·복구 검사는 별도로 추가 |
| `.github/`, `docs/` | 기능 이슈·PR·CI와 범위·디자인·검증 기록. 기능 변경과 함께 갱신 |

화면 파일은 `src/app/`에 두고 공통 UI·상태·도메인 코드는 라우트 밖에 둔다. 원격 가져오기는 향후 플랫폼별 어댑터로 추가하며 화면 안에 API·저장 정책을 섞지 않는다.

## 실제 데이터·URL·실패 규칙

현재 `SavedContent`는 다음 필드만 가진다.

```ts
id: string
title: string
url: string
source: 'instagram' | 'youtube' | 'naver' | 'web'
category: 'food' | 'cafe' | 'event' | 'other'
placeName: string
note: string
visited: boolean
createdAt: string
```

- 제목과 링크는 필수이고 장소·메모는 선택이다. 저장 시 사용자 문자열을 trim한다. 폼은 제목·장소 120자, 메모 2,000자로 제한하지만 도메인 함수에는 같은 길이 제한이 아직 없다.
- 저장 URL은 HTTPS만 허용한다. 스킴 생략은 HTTPS로 보정하며 상대주소·사용자정보 포함 URL·공백·단일 단어 호스트는 거부한다. 출처는 URL 문자열의 일부가 아니라 파싱한 hostname 경계로 판별한다.
- 추적 파라미터를 제거하고 query를 정렬하며 YouTube 공유·watch·shorts 주소를 통합한다. `t`, `list`, 장소 정보 query와 hash 등 의미 있는 값을 보존한다. 따라서 같은 영상도 재생 시점·재생목록 등이 다르면 별도 저장될 수 있다.
- 중복 판별은 **전체 정규화 URL 일치**다. `DomainError`의 `duplicateId`로 기존 콘텐츠를 열 수 있다. 네이버 단축주소는 펼치지 않고 URL로 저장한다. 정규화 전의 정확한 입력 URL은 별도 필드에 보관하지 않는다.
- 새 콘텐츠는 목록 맨 앞에 추가한다. 수정은 `id`, `visited`, `createdAt`과 기존 순서를 유지한다. 검색은 제목·장소·메모를 NFKC·소문자로 정규화하고 모든 검색어와 분류·출처 조건을 함께 적용한다.
- 저장 키는 `moa.library.v1`, 값은 **version 필드 없는 `SavedContent[]` JSON 배열**이다. 키 이름에 v1이 있어도 명시적인 schema version·마이그레이션·백업이 구현된 것은 아니다.
- 저장값이 없으면 빈 목록이다. 읽기·파싱 중 항목 하나라도 잘못되면 전체 읽기가 실패하고 쓰기를 차단한다. 중복 ID·출처 불일치도 거부한다. 파서는 저장 배열 안의 중복 URL까지 거부하지는 않는다.
- Provider는 읽기 준비 전·이전 변경 처리 중에는 다음 변경을 차단한다. `AsyncStorage.setItem` 성공 후에만 화면의 목록을 갱신한다. 쓰기 실패 시 기존 목록을 유지하고 폼 입력을 남긴다. 읽기 실패를 빈 배열로 덮어쓰거나 조용히 일부 항목을 버리지 않는다.
- 폴더·보관 등 저장 필드를 확장하기 전에 schema version과 기존 배열의 마이그레이션을 설계한다. 손상 데이터 보존·미지원 버전·중간 실패 처리를 포함한다. 향후 장소·기간을 추정만으로 확정하지 않고 확인 상태와 정보 근거를 별도로 둔다.

## Figma와 코드 연결

[모아 · 앱 디자인 & 개발](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt)은 편집 가능한 첫 디자인 파일이다. 화면 SCR-001~003과 컴포넌트 CMP-001~005의 실제 node 링크는 [디자인 전달 표](design-handoff.md#디자인-id--코드)에 있다. 매핑과 검증 상태의 원본은 `design/figma-manifest.json`이다.

토큰 변경은 `design/tokens.json`을 수정한 뒤 `npm run tokens:generate`로 `src/theme/tokens.ts`를 생성하고 `npm run tokens:check`로 확인한다. 영향받는 SCR/CMP ID와 전후 화면을 PR에 기록하며 UI/UX 팀과 Figma 변수를 맞춘다. 검사 명령은 로컬 파일 일치만 확인한다. **양방향 자동 동기화와 네이티브 Code Connect 게시 작업은 수행하지 않았다.**

Starter 플랜의 3페이지 구조는 `00 Brief`, `01 Flows`, `02 Design & Handoff`이며 마지막 페이지 안에 Foundations/Components/Screens/Handoff 섹션이 있다. 기본 3개 화면은 캡처로 검증했지만 다음은 남아 있다.

- Brief·Flows 페이지와 Handoff 섹션의 내용 작성
- Foundations·컴포넌트 상태 보드의 시각 검증
- 검증 캡처 이후 수정한 ContentCard의 최종 시각 확인
- 화면 간 클릭 이동 프로토타입 연결

컴포넌트 상태 보드를 만든 후 도구 호출 한도에 도달했다. 앞선 3개 화면에는 ContentCard 인스턴스가 없어 해당 수정의 영향을 받지 않았다. 전체 상태·프로토타입이 검증 완료된 것으로 설명하지 않는다. 협업 상태는 `ready → approved → inprogress → verified`로 기록하며 [전달 기준](design-handoff.md)을 따른다.

## 브랜치와 PR로 이어가기

기존 작업이 있는지 확인하고 최신 `main`에서 기능 브랜치를 만든다. 아래 이름은 다음 삭제 흐름의 예시다.

```sh
git status --short
git switch main
git pull --ff-only origin main
git switch -c feat/library-delete-undo
```

기존 변경이 있으면 보존하며 작업 범위를 먼저 확인한다. 다른 사람의 변경을 reset·force push로 없애지 않는다. 기능 구현과 검사 후 작업한 파일을 지정해 stage하고 다음처럼 올린다.

```sh
git diff --cached --stat
git commit -m "feat: add content deletion and undo"
git push -u origin feat/library-delete-undo
```

GitHub에서 `main`을 대상으로 PR을 만든다. 준비된 템플릿에 사용자 행동의 변화, 이슈, SCR/CMP ID·Figma 링크, 실제 검사 결과·화면, 남은 제한을 기록한다. 하나의 사용자 흐름을 리뷰 가능한 단위로 올리고 디자인 비교와 CI 결과를 확인한다. 원격의 실제 리뷰어·보호 규칙은 저장소 설정을 확인한다.

## 다음 작업과 완료 조건

| 작업 | 완료 조건 |
| --- | --- |
| **권장 후속 구현: 개별 삭제 + 되돌리기** | 항목 하나를 삭제하고 정해진 UX 안에서 되돌린다. 되돌리면 ID·방문 상태·생성일·메모가 유지된다. 삭제 결과가 재실행 후 유지되고 삭제/복구 쓰기 실패 시 이전 목록과 오류 안내가 일치한다. 연속 작업·이미 없는 항목을 확인하고 실제 저장 실패 검사를 추가한다. |
| 병행 조사: 기존 저장함 가져오기 | 네이버 지도·유튜브·인스타의 공식 지원과 사용자 제공 내보내기/공유 샘플을 확인한다. 링크·폴더·메모·복수 항목·비공개/삭제 항목·페이지 나눔을 다룰 수 있는지 재현 결과와 제약을 기록한다. 전체 자동 가져오기를 조사 전 약속하지 않는다. |
| 폴더·보관·일괄 정리 준비 | schema version·기존 v1 배열 마이그레이션이 먼저 동작한다. 기존 데이터·손상 데이터·미지원 버전·실패 시 원본 보존을 검증한다. 이후 기능 하나씩 수정·취소·복구와 검색/필터를 확인한다. |
| 장소 모델·통합 지도 | 원본/장소/연결 관계를 분리하고 장소 미확인 항목을 보존한다. 다른 지점·동명 장소·복수 장소를 확인한다. 목록·지도 일치, 좌표 근거, 권한 거절·지도 오류·길찾기를 검증한다. 네이버 저장함 지원 여부와 지도 표시 기능을 분리한다. |
| 행사 기간·근처 알림 | 행사 연도·기간·시간대·정보 근거를 확인하고 거리와 기간 조건을 함께 평가한다. 기간 미확인·종료된 행사는 제외한다. 먼저 전경 흐름, 이후 실제 iOS/Android에서 배경 상태·권한·배터리 제약·중복/빈도·방문 완료 제외를 검증한다. |
| 개인화 비서 | 위 정보가 쌓인 뒤 저장 이유·방문 기록에 근거한 제안을 만든다. 추천 이유·수정·무시·빈도 제어와 실제 방문까지의 흐름을 평가한다. AI·서버 도입 여부와 비용·데이터 범위는 해당 단계에서 구체화한다. |
| 디자인 후속 | 비어 있는 Brief/Flows/Handoff 작성, 남은 보드 시각 확인, 클릭 프로토타입 연결 후 manifest와 검증 기록을 갱신한다. |

가져오기 조사는 공식 문서와 실제 제공 샘플을 근거로 한다. 플랫폼 지원이 제한되어도 이미 동작하는 로컬 저장 흐름은 유지한다.

## 그대로 붙여 넣을 Codex 시작 프롬프트

아래는 권장 후속 기능인 ‘개별 삭제 + 되돌리기’를 맡길 때의 예시다. 다른 작업을 맡길 때는 ‘이번 작업’ 단락과 해당 완료 조건을 실제 범위로 바꾼다.

```text
이 저장소는 https://github.com/o2postspace/moa 의 ‘모아’ 앱이다.
AGENTS.md, README.md, docs/codex-handoff.md, docs/roadmap.md,
docs/verification.md, docs/design-handoff.md, design/figma-manifest.json을
먼저 읽고 실제 src/domain/content.ts와 src/features/library/LibraryProvider.tsx를 확인해 줘.

사용자는 이미 저장한 콘텐츠를 정리하고 네이버 저장 맛집까지 한곳에 보고,
근처에 갔을 때 장소와 실제 축제 기간에 맞춰 다시 발견하길 원한다.
단계적으로 개발하며 UI/UX 팀은 Figma, 개발팀은 SCR/CMP ID와 PR로 협업한다.
현재는 로컬 링크 저장·검색·분류·상세·수정·방문 상태만 구현되어 있다.
자동 가져오기·장소 좌표·지도·기간 알림·개인화·서버는 아직 없다.

이번 작업은 최신 main에서 별도 기능 브랜치를 만들고 ‘개별 삭제 + 되돌리기’ 흐름 하나를 구현하는 것이다.
기존 변경을 보존하고 URL 정규화·중복·출처 규칙, 저장 준비/동시쓰기 차단,
쓰기 성공 후 목록 갱신과 손상 데이터 보존을 유지해 줘.
되돌리면 ID·방문 상태·생성일·메모를 유지하고 재실행·연속 작업·쓰기 실패를 검증해 줘.
폴더·보관 등 저장 형식을 바꾸려면 schema version과 기존 v1 배열 마이그레이션을 먼저 다뤄 줘.
외부 계정 연동이나 AI 기능을 이 작업에 추가하지 말고,
필요한 Expo/React Native API는 package.json의 SDK 57 공식 문서와 AGENTS.md를 확인해 줘.

Figma의 현재 코드 매핑을 유지하고 변경된 SCR/CMP ID와 상태별 UX를 기록해 줘.
토큰을 바꿨다면 npm run tokens:generate로 생성물을 갱신해 줘.
npm run typecheck, npm run lint, npm test, npm run tokens:check,
npm run build:web를 실행하고 변경에 필요한 의미 있는 실패·복구 검사도 해 줘.
수행한 결과와 미검증 범위를 docs/verification.md에 갱신하고
작업 범위·디자인 연결·검사 결과를 포함한 리뷰 가능한 PR을 준비해 줘.
Figma의 미완료 페이지·시각 미검증 보드·클릭 프로토타입을 완료로 보고하지 말아 줘.
```
