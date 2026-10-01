# 모아 개발 인수인계 · Codex 시작 문서

2026-10-01, 앱 0.1.0의 실제 소스를 기준으로 작성했다. 개발자와 개발자의 Codex가 같은 맥락에서 작업을 이어가기 위한 문서다. 저장소는 [o2postspace/moa](https://github.com/o2postspace/moa)이며 공개 저장소다. 실제 사용자의 저장함 데이터와 인증정보는 저장소에 넣지 않는다.

## 먼저 읽을 순서

1. [AGENTS.md](../AGENTS.md): 저장소 작업 지침. Expo·React Native API를 바꾸기 전 해당 SDK 공식 문서를 확인하고 Expo Router를 사용한다.
2. [README.md](../README.md): 실행 방법과 현재 기능.
3. 이 문서: 제품 의도, 구현 경계, 데이터 규칙, 다음 작업.
4. [로드맵](roadmap.md), [검증 기록](verification.md): 단계별 범위와 실제 확인한 결과.
5. [UI 리디자인 전달](ui-refresh.md), [디자인 전달 기준](design-handoff.md), [Figma manifest](../design/figma-manifest.json), [컴포넌트 매핑](../design/component-map.json): 현재 코드 UI, 이전 원격 node·코드 연결과 미완료 디자인.
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
| 저장함 정리의 기본 | 전체 저장/방문 완료 탭, 제목·장소·메모 검색, 펼쳐지는 출처 필터·분류 필터, 최근 추가순 목록 구현 |
| 상세 | 원본 열기, 내용 수정, 방문 완료 표시·취소 구현 |
| 기기 저장 | AsyncStorage에 저장, 재실행 시 불러오기, 읽기 오류 안내·재시도, 저장 실패 시 기존 목록 유지 구현 |
| 기존 저장함 가져오기 | 미구현. 계정 연동·내보내기 파일·공유 리스트의 지원과 실제 형식부터 검증 필요 |
| 정리 확장 | 삭제·되돌리기·폴더·보관·일괄 수정 미구현 |
| 장소·행사 | 장소 이름 문자열만 있음. 좌표·Place 엔터티·행사 기간·정보 출처 확인 상태 미구현 |
| 지도·알림 | 지도 SDK, 길찾기 연계, 위치 권한·근처 알림·기간 조건·백그라운드 알림 미구현 |
| 개인화·서버 | AI 분석·추천, 로그인·클라우드 동기화·서버 미구현 |
| 배포·네이티브 검증 | 스토어 배포·설치 파일 없음. 실제 iOS·Android 기기 검증 전 |

처음 실행하면 저장함은 비어 있다. 예시 항목을 자동으로 삽입하지 않는다. 현재 링크 내용을 서버에서 읽거나 분석하지 않으며 원본 보기에서 외부 앱·웹을 연다. 로컬 저장 데이터는 앱 삭제나 브라우저 저장소 초기화로 사라질 수 있다. 백업·내보내기·자동 복구 기능은 없다.

## 현재 UI와 사용 흐름

이번 UI 리디자인은 흰 배경, 따뜻한 회색 카드·입력, 주황색 주 행동, 둥근 칩과 원형 뒤로가기 버튼으로 구성한다. 화면 좌우 여백은 24px, 주요 입력·버튼 최소 높이는 56px, 칩·아이콘 터치 영역은 최소 48px이며 `Screen`은 최대 폭 520px과 위·아래 safe area를 적용한다. 현재 토큰과 디자인 전달 범위는 [UI 리디자인 전달](ui-refresh.md)을 따른다.

- **SCR-001 저장함:** 전체 저장과 방문 완료 탭의 개수는 전체 목록 기준이며 결과 개수는 검색·분류·출처·방문 조건을 적용한 목록 기준이다. 출처 버튼을 누르면 가로 선택 칩이 펼쳐지고 선택 후 닫힌다. 방문 조건은 화면의 `visitedOnly` 상태에서 적용하며 저장 데이터나 도메인 검색 계약을 변경하지 않았다. 검색/방문 결과가 없을 때의 초기화는 검색어·분류·출처·방문 탭을 함께 전체 상태로 돌린다.
- **카드와 빈 상태:** `ContentCard`는 회색 표면의 카드이며 오른쪽에 겹친 종이와 분류 아이콘을 그리는 `CategoryStamp`가 있다. 방문 완료는 초록색과 체크 표시로 표현한다. 장식인 CategoryStamp는 화면 읽기 대상에서 제외하고 카드의 접근성 이름에 제목·분류·장소·출처·방문 상태를 담는다.
- **SCR-002 추가/수정:** 링크 다음 제목 순서로 필수 입력을 배치한다. 장소·메모는 접기/펼치기 영역이며 기존 값이 있는 수정 화면에서는 처음부터 열린다. 접어도 폼 상태의 값은 유지된다. 필수 입력 오류가 있으면 위로 스크롤하고 링크 오류를 우선하여 초점을 이동하며, 링크에 오류가 없으면 제목에 초점을 이동한다. 저장 버튼과 중복/쓰기 오류·기존 콘텐츠 이동 링크는 스크롤 밖의 하단 저장 바에 있다. iOS에는 `KeyboardAvoidingView`의 padding 처리가 있다.
- **SCR-003 상세:** 중앙 제목·출처·분류·방문 상태, 사용자가 적은 장소와 메모, 원본 URL·저장일을 표시한다. 헤더에서 내용 수정으로 이동하고 원본 보기·방문 토글·동작 오류는 스크롤 밖의 고정 하단 영역에 있다. 장소에는 직접 입력한 정보이며 지도 연결 전이라는 안내가 있다.

장소/메모 접기, 탭, 출처 메뉴, 고정 동작과 오류 초점은 실제 앱 코드에 구현됐다. 네이티브 키보드·safe area·VoiceOver/TalkBack·큰 글꼴 동작은 아직 실제 기기에서 검증하지 않았다. 저장 도메인·Provider·URL 규칙·기존 데이터 형식은 이번 UI 변경에서 유지했다.

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

의존성·Expo 설정을 바꾼 경우 `npx expo-doctor`도 확인한다. CI는 `.github/workflows/ci.yml`의 `quality` 작업이며 Node 24에서 `npm ci`와 위 검사를 실행한다. 인수인계 시점의 원격 `main` 기준 커밋 `f8504d246f601aae8ebb50a691ea9383cabd1a46`의 CI 통과를 확인했다. 최신 원격 검사 결과는 [GitHub Actions](https://github.com/o2postspace/moa/actions)에서 확인한다. 이 `main`의 검증은 현재 UI 작업 브랜치의 원격 CI나 브랜치 보호 규칙 설정 완료를 뜻하지 않는다.

초기 검증에서 위 검사와 expo-doctor가 통과했고, 웹에서 추가·유지·수정·방문 상태·검색·필터·중복·내비게이션을 확인했다. 자세한 범위는 [검증 기록](verification.md)을 따른다. 현재 자동 테스트는 도메인 8개다. **Provider의 실제 쓰기 실패를 검증하는 자동 테스트는 아직 없고**, 웹 빌드·도메인 테스트 통과는 네이티브 기기·접근성·저장 실패 검증을 대신하지 않는다.

UI 작업 브랜치 `codex/mmm-ui-refresh`에서는 typecheck·lint·도메인 테스트 8개·토큰 일치·웹 export가 통과했다. 웹 390 × 844에서 저장함·추가·상세를 확인했고 현재 캡처는 `design/app-preview.png`, `design/app-add-preview.png`, `design/app-detail-preview.png`다. 320 × 800에서는 긴 한글 제목 상세의 줄바꿈과 가로 넘침 없음(콘텐츠 폭/화면 폭 320/320)을 확인했다. 웹 동작 QA에서는 선택 입력을 접은 수정 저장 후 장소·메모 유지, 방문 토글·재실행 유지·취소, 방문 완료 탭/출처 필터의 결과 없음과 전체 초기화, 중복 오류/기존 콘텐츠 이동을 확인했다. 빈 필수 입력의 링크 초점도 웹에서 확인했다. 네이티브 키보드·safe area·화면 읽기·큰 글꼴은 미검증이다. 이 브랜치의 원격 PR·CI는 GitHub에서 현재 head를 확인한다. PR·원격 CI의 최신 결과와 자세한 QA 범위는 [검증 기록](verification.md)에서 다시 확인한다. 이전 웹 검증이나 이전 Figma 캡처를 이번 UI 검증으로 간주하지 않는다.

## 구조와 변경 책임

| 파일·영역 | 책임과 변경 시 확인할 것 |
| --- | --- |
| `src/app/_layout.tsx` | Expo Router Stack, 폰트 로드, safe area, LibraryProvider 연결 |
| `src/app/index.tsx` | SCR-001 Library: 전체/방문 완료 탭·개수, 목록·검색·분류 칩·펼쳐지는 출처 필터·빈 화면·읽기 오류. 방문 필터는 이 화면의 상태 |
| `src/app/add.tsx` | SCR-002 AddLink: 추가와 수정 공용 폼. `id`가 있으면 수정. 선택 장소/메모 접기, 첫 필수 오류 초점, 고정 저장 바·중복 이동·저장 중 상태 |
| `src/app/content/[id].tsx` | SCR-003 ContentDetail: 제목·장소·메모·원본 정보, 원본 열기·방문 토글의 고정 하단 영역과 오류, 헤더 수정 이동·없는 항목 |
| `src/components/ContentCard.tsx`, `FilterChip.tsx`, `PrimaryButton.tsx`, `SourceBadge.tsx`, `EmptyState.tsx` | 기존 CMP-001~005. 현재 앱에는 새 카드·칩·버튼·빈 상태 UI가 적용되어 있지만 원격 Figma 메인 컴포넌트는 이전 상태 |
| `src/components/CategoryStamp.tsx` | CMP-006의 코드 매핑. 분류별 종이 아이콘, 방문 완료 초록색/체크, 기본·큰 크기. 카드·상세·빈 상태가 사용. 장식 접근성 제외. 실제 원격 Figma 컴포넌트는 미생성이며 `figmaNodeId: null`, node 매핑 대기 |
| `src/components/Screen.tsx`, `UiText.tsx` | 공통 safe area·최대 폭·헤더/원형 뒤로가기, 텍스트 변형·폰트. 키보드·스크롤·고정 동작은 각 화면에서 구성 |
| `src/domain/content.ts` | 타입, 필수 입력, URL·출처·중복, 검색, 저장 데이터 런타임 검증. 플랫폼 UI와 분리된 순수 규칙 |
| `src/features/library/LibraryProvider.tsx` | AsyncStorage 읽기·쓰기, 동시 변경 차단, 추가·수정·방문 상태. 모든 목록 변경은 이 저장 경로를 사용 |
| `design/tokens.json` | 앱 토큰의 원본 |
| `scripts/tokens.mjs`, `src/theme/tokens.ts` | 원본에서 코드 생성·일치 검사. 생성 코드만 직접 수정하지 않음 |
| `design/figma-manifest.json`, `design/component-map.json` | 이전 원격 Figma 파일·node·검증 기록과 현재 앱의 차이, SCR/CMP 코드 매핑. CMP-006은 코드만 매핑되어 원격 node가 없음. 현재 UI 반영 상태는 `docs/ui-refresh.md`와 함께 판단 |
| `design/moa-ui-refresh.svg`, `docs/ui-refresh.md` | 새 UI의 벡터/텍스트 초안과 실제 코드 흐름·토큰·Figma 반영 절차. 실제 원격 편집·검증 결과가 아님 |
| `design/app-preview.png`, `app-add-preview.png`, `app-detail-preview.png`, `ui-refresh-preview.png` | 현재 앱 웹 390 × 844 캡처 3개와 SVG의 브라우저 시각 확인 이미지. 라이브 Figma 검증 이미지와 구분 |
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

[모아 · 앱 디자인 & 개발](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt)은 편집 가능한 첫 디자인 파일이다. 화면 SCR-001~003과 컴포넌트 CMP-001~005의 기존 node 링크는 [디자인 전달 표](design-handoff.md#디자인-id--코드)에 있다. 매핑과 이전 원격 검증 기록, 현재 앱과의 차이는 `design/figma-manifest.json`에 있다. CMP-006 CategoryStamp는 `design/component-map.json`에 코드 경로가 있으며 실제 Figma 컴포넌트·node는 아직 없다. **Starter MCP 호출 한도로 이번 UI 리디자인을 라이브 Figma에 반영하지 못해 현재 코드와 원격 디자인이 다르다.** 기존 node를 이번 UI의 동기화된 디자인으로 설명하지 않는다.

`design/moa-ui-refresh.svg`는 기본 상태 3개의 벡터/텍스트 초안이며 [UI 리디자인 전달](ui-refresh.md)의 절차에 따라 UI/UX 팀이 가져와 재구성할 수 있다. SVG의 상세 예시는 가상 콘텐츠다. XML 검사와 Noto Sans KR을 적용한 브라우저 1282 × 948 시각 확인에서 잘림·겹침이 없음을 확인했고 이미지는 `design/ui-refresh-preview.png`다. 이 결과는 라이브 Figma 편집, Auto Layout·변수·컴포넌트 생성, 클릭 프로토타입 또는 Figma 가져오기 결과 검증을 뜻하지 않는다. 이전 `design/figma-preview.png`는 첫 버전의 캡처다.

토큰 변경은 `design/tokens.json`을 수정한 뒤 `npm run tokens:generate`로 `src/theme/tokens.ts`를 생성하고 `npm run tokens:check`로 확인한다. 영향받는 SCR/CMP ID와 전후 화면을 PR에 기록하며 UI/UX 팀과 Figma 변수를 맞춘다. 검사 명령은 로컬 파일 일치만 확인한다. **양방향 자동 동기화와 네이티브 Code Connect 게시 작업은 수행하지 않았다.**

Starter 플랜의 3페이지 구조는 `00 Brief`, `01 Flows`, `02 Design & Handoff`이며 마지막 페이지 안에 Foundations/Components/Screens/Handoff 섹션이 있다. 첫 버전의 기본 3개 화면은 캡처로 검증했지만 다음은 남아 있다.

- 새 토큰·카드·CategoryStamp·탭·출처 메뉴·선택 정보 접기·고정 동작의 라이브 Figma 반영과 시각 검증
- Brief·Flows 페이지와 Handoff 섹션의 내용 작성
- Foundations·컴포넌트 상태 보드의 시각 검증
- 검증 캡처 이후 수정한 ContentCard의 최종 시각 확인
- 화면 간 클릭 이동 프로토타입 연결

첫 버전에서는 컴포넌트 상태 보드를 만든 후 도구 호출 한도에 도달했다. 당시 3개 화면에는 ContentCard 인스턴스가 없어 해당 수정의 영향을 받지 않았다. 이번에도 원격 접근 제한이 있어 기존 node와 변수 컬렉션을 다시 읽거나 수정하지 못했다. 접근이 가능해지면 실제 node 종류·상태를 읽고 기존 화면 루트·메인 컴포넌트·변수 컬렉션 ID를 유지하며 새 UI를 반영한다. 출처 펼침·선택 정보 펼침·방문 완료·입력 오류·중복·저장 중·쓰기 오류를 추가하고 구조와 화면을 확인한 뒤 manifest·매핑·검증 이미지를 갱신한다. 전체 상태·프로토타입이 검증 완료된 것으로 설명하지 않는다. 협업 상태는 `ready → approved → inprogress → verified`로 기록하며 [전달 기준](design-handoff.md)을 따른다.

## 브랜치와 PR로 이어가기

인수인계 시점에는 UI 변경이 `codex/mmm-ui-refresh`에서 진행 중이고 PR 번호는 아직 없다. 기존 작업 상태와 PR 반영 여부를 먼저 확인한다. UI 작업을 이어갈 때는 이 브랜치의 변경을 보존한다. 다음 기능은 UI 변경이 `main`에 반영된 뒤 최신 `main`에서 기능 브랜치를 만든다. 아래 이름은 다음 삭제 흐름의 예시다.

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
| **진행 중 UI 리디자인 마무리** | 확인한 390px/320px 웹 QA의 실제 범위와 현재 캡처를 유지하며 리뷰 가능한 PR·원격 CI를 검증한다. 추가 변경이 있으면 영향받는 상태를 다시 확인한다. 실제 iOS/Android의 키보드·safe area·뒤로가기·화면 읽기·큰 글꼴 검증은 별도로 수행한다. |
| **권장 후속 구현: 개별 삭제 + 되돌리기** | 항목 하나를 삭제하고 정해진 UX 안에서 되돌린다. 되돌리면 ID·방문 상태·생성일·메모가 유지된다. 삭제 결과가 재실행 후 유지되고 삭제/복구 쓰기 실패 시 이전 목록과 오류 안내가 일치한다. 연속 작업·이미 없는 항목을 확인하고 실제 저장 실패 검사를 추가한다. |
| 병행 조사: 기존 저장함 가져오기 | 네이버 지도·유튜브·인스타의 공식 지원과 사용자 제공 내보내기/공유 샘플을 확인한다. 링크·폴더·메모·복수 항목·비공개/삭제 항목·페이지 나눔을 다룰 수 있는지 재현 결과와 제약을 기록한다. 전체 자동 가져오기를 조사 전 약속하지 않는다. |
| 폴더·보관·일괄 정리 준비 | schema version·기존 v1 배열 마이그레이션이 먼저 동작한다. 기존 데이터·손상 데이터·미지원 버전·실패 시 원본 보존을 검증한다. 이후 기능 하나씩 수정·취소·복구와 검색/필터를 확인한다. |
| 장소 모델·통합 지도 | 원본/장소/연결 관계를 분리하고 장소 미확인 항목을 보존한다. 다른 지점·동명 장소·복수 장소를 확인한다. 목록·지도 일치, 좌표 근거, 권한 거절·지도 오류·길찾기를 검증한다. 네이버 저장함 지원 여부와 지도 표시 기능을 분리한다. |
| 행사 기간·근처 알림 | 행사 연도·기간·시간대·정보 근거를 확인하고 거리와 기간 조건을 함께 평가한다. 기간 미확인·종료된 행사는 제외한다. 먼저 전경 흐름, 이후 실제 iOS/Android에서 배경 상태·권한·배터리 제약·중복/빈도·방문 완료 제외를 검증한다. |
| 개인화 비서 | 위 정보가 쌓인 뒤 저장 이유·방문 기록에 근거한 제안을 만든다. 추천 이유·수정·무시·빈도 제어와 실제 방문까지의 흐름을 평가한다. AI·서버 도입 여부와 비용·데이터 범위는 해당 단계에서 구체화한다. |
| 디자인 후속 | 원격 접근 후 실제 기존 node와 컬렉션을 읽고 새 UI 토큰·컴포넌트·화면·상태를 반영한다. CategoryStamp를 네이티브 Figma 컴포넌트로 만들고 CMP-006의 실제 node를 연결한다. SVG를 편집 가능한 Auto Layout·텍스트·변수·인스턴스로 재구성하고 390px/320px·긴 제목·오류/키보드 상태를 검증한다. 비어 있는 Brief/Flows/Handoff 작성, 남은 보드 시각 확인, 클릭 프로토타입 연결 후 manifest와 검증 기록을 갱신한다. |

가져오기 조사는 공식 문서와 실제 제공 샘플을 근거로 한다. 플랫폼 지원이 제한되어도 이미 동작하는 로컬 저장 흐름은 유지한다.

## 그대로 붙여 넣을 Codex 시작 프롬프트

아래는 UI 변경이 `main`에 반영된 뒤 권장 후속 기능인 ‘개별 삭제 + 되돌리기’를 맡길 때의 예시다. 진행 중인 UI 작업을 이어갈 경우 `codex/mmm-ui-refresh` 상태를 확인하고 ‘이번 작업’ 단락과 해당 완료 조건을 실제 범위로 바꾼다.

```text
이 저장소는 https://github.com/o2postspace/moa 의 ‘모아’ 앱이다.
AGENTS.md, README.md, docs/codex-handoff.md, docs/roadmap.md,
docs/verification.md, docs/ui-refresh.md, docs/design-handoff.md, design/figma-manifest.json을
먼저 읽고 실제 src/domain/content.ts와 src/features/library/LibraryProvider.tsx를 확인해 줘.

사용자는 이미 저장한 콘텐츠를 정리하고 네이버 저장 맛집까지 한곳에 보고,
근처에 갔을 때 장소와 실제 축제 기간에 맞춰 다시 발견하길 원한다.
단계적으로 개발하며 UI/UX 팀은 Figma, 개발팀은 SCR/CMP ID와 PR로 협업한다.
현재는 로컬 링크 저장·검색·분류·상세·수정·방문 상태만 구현되어 있다.
자동 가져오기·장소 좌표·지도·기간 알림·개인화·서버는 아직 없다.
UI는 전체/방문 완료 탭, 펼치는 출처 필터, CategoryStamp 카드,
선택 장소/메모 접기, 고정 저장/상세 동작과 필수 입력 오류 초점을 사용한다.

이번 작업은 진행 중인 UI 브랜치의 main 반영 여부와 기존 변경을 먼저 확인하고,
반영된 최신 main에서 별도 기능 브랜치를 만들어 ‘개별 삭제 + 되돌리기’ 흐름 하나를 구현하는 것이다.
기존 변경을 보존하고 URL 정규화·중복·출처 규칙, 저장 준비/동시쓰기 차단,
쓰기 성공 후 목록 갱신과 손상 데이터 보존을 유지해 줘.
되돌리면 ID·방문 상태·생성일·메모를 유지하고 재실행·연속 작업·쓰기 실패를 검증해 줘.
폴더·보관 등 저장 형식을 바꾸려면 schema version과 기존 v1 배열 마이그레이션을 먼저 다뤄 줘.
외부 계정 연동이나 AI 기능을 이 작업에 추가하지 말고,
필요한 Expo/React Native API는 package.json의 SDK 57 공식 문서와 AGENTS.md를 확인해 줘.

Figma의 현재 코드 매핑을 유지하고 변경된 SCR/CMP ID와 상태별 UX를 기록해 줘.
현재 원격 Figma는 이전 UI이며 호출 한도로 새 UI를 반영하지 못했다.
SVG/UI-refresh 문서는 새 UI 전달 초안이고 라이브 디자인 검증 결과가 아니다.
기존 node를 먼저 읽고 새 UI 반영·검증을 완료한 뒤에만 manifest를 갱신해 줘.
토큰을 바꿨다면 npm run tokens:generate로 생성물을 갱신해 줘.
npm run typecheck, npm run lint, npm test, npm run tokens:check,
npm run build:web를 실행하고 변경에 필요한 의미 있는 실패·복구 검사도 해 줘.
수행한 결과와 미검증 범위를 docs/verification.md에 갱신하고
작업 범위·디자인 연결·검사 결과를 포함한 리뷰 가능한 PR을 준비해 줘.
Figma의 미완료 페이지·시각 미검증 보드·클릭 프로토타입을 완료로 보고하지 말아 줘.
웹 검증과 네이티브 키보드·safe area·화면 읽기 검증을 구분해 기록해 줘.
```
