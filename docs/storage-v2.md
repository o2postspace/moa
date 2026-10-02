# 로컬 저장 형식 v2와 API 정보 보존

웹의 읽기·이동·기한 정리·변경은 `createBrowserLibraryRepository`를 사용한다. Web Locks의 origin 공통 배타 이름 `moa.library.v1` 안에서 최신 저장값 읽기→기존 도메인 검증/정리/변경→동기 쓰기를 수행한다. 오래된 탭의 메모리 목록 전체로 최신 항목을 덮어쓰지 않는다. storage 이벤트·전경 복귀에서 최신 목록을 다시 확인한다. Web Locks 미지원 환경은 유효 v2 읽기만 허용하고 변경·이동·정리에 필요한 쓰기를 거부하며 원본을 보존한다. [Web Locks 공식 설명](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)

2026-10-03. 기본 React DOM 웹앱은 브라우저 `localStorage`의 기존 키 `moa.library.v1`을 유지하며, 값은 `{ "version": 2, "items": [...] }`이다. 키 이름과 값의 schema version은 별개다. 보관한 Expo 웹에서 쓰던 같은 `http://localhost:8081` origin과 키를 읽으며 새 키·저장 schema를 만들거나 초기화하지 않는다. 클라우드 동기화·백업을 제공하지 않으며 OAuth token·비밀값을 브라우저 저장소에 넣지 않는다. [브라우저 localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

웹 어댑터는 `src/web/library/storage.ts`, 상태는 `src/web/library/LibraryProvider.tsx`다. 기존 Expo·React Native 구현은 `src/features/library/LibraryProvider.tsx`와 AsyncStorage 의존성으로 보관한다. 기본 웹 번들은 이를 사용하지 않는다. 전환 전 브라우저 저장5건·표시 제목·방문·순서가 새 DOM 저장함과 재실행에서 유지되는 것을 확인했다. 자세한 범위는 [검증 기록](verification.md)을 따른다.

신규 NAVER 검색 결과는 이 저장 형식에 추가하지 않는다. 기존 NAVER 필드는 읽기 호환성을 위해 유지하며 신규 생성 허용을 뜻하지 않는다. YouTube의 30일 정리와 NAVER 결과 화면의 최대 24시간 메모리 수명은 서로 다른 계약이다.

## 기존 배열에서 이동

`readStoredLibrary`는 기존 JSON 배열과 v2 envelope를 읽고 모든 항목을 검증한다. 기존 배열이면 `needsMigration: true`를 반환한다. ID·사용자 제목·메모·장소 문자열·방문 상태·생성일·목록 순서를 유지한다. `parseStoredContent`는 기존 호출부용 읽기 wrapper이며 저장 형식의 검증만 수행한다.

웹 Provider는 repository.load로 읽고 `readStoredLibrary`·`pruneExpiredContent`·`serializeStoredLibrary` 도메인 규칙을 사용한다. 필요한 migration과 기한 정리는 배타 범위에서 하나의 `setItem` 교체 쓰기로 저장한다. 쓰기가 성공한 뒤에만 목록을 공개하고 변경 작업을 허용한다. 지원하지 않는 version, 잘못된 JSON, 항목 하나의 스키마 오류·위험 URL·중복 ID·출처 불일치는 전체 로드 실패로 처리하며 저장값을 덮어쓰지 않는다. migration 쓰기 실패 때도 준비 상태로 전환하지 않고 재시도를 제공한다. 저장 라이브러리의 내부 복구나 백업 기능을 추가한 것은 아니며 `setItem` 성공/실패를 경계로 동작한다. 보관한 Expo Provider는 기존 loadStoredLibrary/saveStoredLibrary를 사용한다.

웹 변경은 repository.transact의 쓰기 성공 후 화면 상태를 갱신한다. 실패하면 이전 메모리 목록과 입력을 유지한다. 브라우저의 quota·개인정보 설정 등으로 localStorage 접근이 거부되어도 실패를 빈 저장함으로 바꾸지 않는다. 같은 화면에서 다른 변경 처리 중에는 다음 변경을 차단한다. 같은 origin의 웹 탭은 공통 Web Lock 안에서 최신 값을 읽고 변경하며, 비협조적인 다른 앱·보관한 Expo의 쓰기나 기기 간 충돌 병합까지 보장하지 않는다. URL origin이 달라지면 같은 저장 키도 다른 저장소이므로 `localhost:8081` 접속을 유지한다. 브라우저 데이터 초기화·삭제에 대한 복구 기능은 없다.

## 사용자 정보와 API 정보

- `title`, `url`, `category`, `placeName`, `note`, `visited`, `createdAt`은 기본 필드다. 수동 링크 추가 시 사용자 제목이 필요하다.
- `external?: { provider: 'youtube', title, authorName?, fetchedAt }`은 공개 YouTube 제목 정보의 캐시다. `titleMode: 'external'`이면 유효 기간 안의 캐시 제목을 표시하고, 미지정 또는 `'manual'`이면 기본 `title`을 표시한다. 자동 제목을 사용하는 수동 링크의 기본 제목은 UI가 일반 제목으로 보관한다. 사용자 제목을 고치면 `titleMode: 'manual'`로 저장한다.
- `importedFrom?: { provider, method, fetchedAt, connectionId? }`는 항목 전체가 API에서 왔다는 근거다. 신규 YouTube 항목은 `public-playlist` 또는 `account-playlist`를 사용한다. 네이버 `place-search`는 기존 v2 읽기에만 허용하고 `createContent`에서는 거부한다. URL의 실제 출처와 일치해야 한다. `account-playlist`에는 연결마다 발급된 `connectionId`가 필요하며 다른 방법에는 이 값을 넣지 않는다. 연결 ID는 credential이 아니다.
- `place?: { provider: 'naver', name, address, latitude, longitude, fetchedAt }`는 기존 네이버 검색 결과의 주소·좌표다. 읽기 검증에서 네이버 URL과 `place-search` origin을 요구하며 신규 생성에서는 거부한다. 좌표는 유한한 숫자로 위도 −90~90, 경도 −180~180이어야 한다. 직접 입력한 `placeName` 문자열과 좌표의 근거는 별개다.

`fetchedAt`은 timezone을 포함한 ISO 날짜이며 잘못된 달력 날짜나 현재보다 5분을 넘겨 미래인 값을 거부한다. 기기 시계가 잘못되면 가져오기와 읽기가 실패할 수 있다. UI가 메타데이터·origin·좌표를 임의로 확정하지 않는다. YouTube 가져오기는 해당 API 응답의 근거를 전달하고 NAVER 응답은 저장함으로 전달하지 않는다.

## NAVER 검색 결과와 기존 데이터 경계

[HUB 2026-09-20 시행 약관](https://www.ncloud.com/support/notice/all/2243) 제2.3·2.4조는 API 결과의 복사·저장·캐싱을 예외 범위로 제한한다. 기기 개인화 캐시는 **24시간 또는 새 질의까지 중 짧은 기간**이며, 사용자가 결과를 선택했다는 이유로 장기 저장할 수 있는 예외는 확인되지 않았다. [2026-10-07 개정](https://www.ncloud.com/support/notice/all/2271)은 약관 명칭·책임·통지 조항을 변경하며 이 저장 기간을 늘리지 않는다.

- 현재 `/places`와 웹 `PlacesPage`는 API 요청 없는 보류 안내다. 아래 임시 결과 계약은 보관한 `src/features/integrations/NaverPlacesScreen.tsx`의 후속 검색 흐름에 적용한다. 검색 구현을 다시 활성화할 때 새 검색 시작 시 이전 결과를 지우고, 화면 이탈 때 결과·타이머·진행 중 응답을 무효화한다.
- 응답 `fetchedAt`과 수신 시각을 기준으로 최대 24시간 만료를 설정하며 타이머와 전경 복귀 시 만료를 확인한다. 결과를 AsyncStorage·파일·서버의 장기 캐시에 쓰지 않는다.
- 결과에서는 원문·네이버 지도 확인만 제공하고 저장·분류 CTA는 제공하지 않는다. 사용자가 직접 공유한 지도 링크와 작성한 제목은 API provenance·좌표 없이 수동 저장할 수 있다. API 결과를 사용자 작성값으로 위장해 보존하는 경로는 만들지 않는다.
- `createContent`는 NAVER `importedFrom` 또는 `place`가 있는 입력을 거부한다. `buildContentImport`는 전체 입력을 먼저 검증하므로 NAVER가 포함된 mixed batch 전체를 거부하며 이미 저장된 URL이라도 중복 처리로 우회하지 못한다.
- 기존 v2 NAVER 항목의 읽기·방문 toggle·기존 30일 prune는 호환성을 위해 유지한다. `LibraryProvider.update`는 기존 `importedFrom`을 보존해 `createContent`를 거치므로 기존 NAVER API 항목 수정도 거부한다. 사용자 데이터를 앞당겨 삭제하지 않는다.

**기존 NAVER 항목의 30일 보관은 호환성 동작이며 약관 준수 완료를 뜻하지 않는다.** 배포 전에 기존 API 데이터와 사용자 작성 메모의 처리 방법을 별도로 검토해야 한다. 신규 저장 차단만으로 기존 데이터 문제를 해결했다고 표시하지 않는다.

## YouTube 30일 기한과 기존 정리·연결 해제

YouTube 캐시·가져오기 항목은 `fetchedAt`부터 정확히 30일이 되는 시점에 만료된다. 기존 NAVER 항목도 같은 prune를 호환성을 위해 유지한다. 자동 갱신은 구현하지 않았다. 로드·성공적인 저장 변경, 웹 창의 focus·문서 visibility 복귀, 표시 중 1시간 주기 확인 때 기한 정리를 저장하며, 표시/검색 helper는 만료된 외부 제목을 즉시 기본 제목으로 대체한다. 만료 항목이 없으면 정리를 위한 쓰기를 하지 않는다. 다른 저장 작업 중에 정리 요청이 오면 해당 작업 뒤에 다시 확인한다. 정리 쓰기 실패 시 원본 저장값과 현재 목록을 유지하고 변경을 차단한 뒤 다시 불러오기를 안내한다. 브라우저·탭이 닫힌 동안 정리하는 백그라운드 서비스는 없으며 숨겨진 탭의 타이머는 브라우저 실행 제약을 받는다. 보관한 네이티브 Provider는 기존 AppState 계약을 유지한다. [문서 visibility 이벤트](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event)

- 수동으로 추가한 URL의 `external`만 만료되면 캐시를 지우고 기본 제목·URL·사용자 메모·방문 상태를 남긴다.
- YouTube `importedFrom`이 있는 항목은 30일 뒤 **전체 항목을 삭제**한다. 그 항목에 사용자가 덧붙인 메모·분류·방문 표시도 함께 삭제된다. 가져오기 전에 UI가 이 동작을 설명한다. 기존 NAVER 항목·좌표도 이전 30일 정리 경로를 유지하지만 신규 NAVER 입력에는 이를 저장 허용 근거로 적용하지 않는다.
- 수정해도 기존 `importedFrom.fetchedAt`과 origin을 보존하여 기한을 연장하지 않는다. 같은 URL 중복은 새 API 정보로 기존 항목을 덮어쓰거나 기한을 갱신하지 않는다. 갱신 기능은 별도 구현이 필요하다.
- 명시적인 계정 연결 해제에서 `removeAccountImports(connectionId)`를 호출하면 그 연결의 `account-playlist` 항목 전체를 삭제한다. 인자를 생략하면 모든 계정 가져오기 항목을 삭제한다. 공개 재생목록·네이버 장소·수동 링크는 유지한다. API 연결 확인 실패·서버 재시작·일시적인 offline만으로 삭제하지 않는다.

## 배치와 수정 계약

`importMany`는 최대 200개의 draft를 받는다. 사용자 제공 파일에서 직접 확인한 링크는 origin 없이 수동 링크로 저장할 수 있으며 API 항목 전체 삭제 기한을 적용하지 않는다. YouTube API 응답으로 생성한 항목에는 UI가 해당 `importedFrom`을 반드시 전달해야 한다. NAVER API 입력은 생성 자체를 거부한다. 전체 입력을 먼저 검증하여 잘못된 항목이 있으면 배치 전체를 거부한다. 검증 후 기존 목록과 배치 안의 정규화 URL 중복을 건너뛰며 `{ added, duplicates }`를 반환한다. 새 항목은 응답 순서대로 목록 앞에 넣고, 기존 ID·방문 상태·메모·목록 순서를 보존한다. 저장 쓰기는 한 번 수행한다.

URL 중복 기준은 장소 동일성이나 video ID만의 일치가 아니다. 추적 query는 제거하지만 `t`, `list`, 일반 사이트의 의미 있는 query와 fragment는 유지한다. YouTube watch/shorts/youtu.be의 같은 주소 형태를 정규화하며 의미 있는 query가 다르면 별도 항목이 될 수 있다. 정확한 입력 원본 URL은 별도 보관하지 않는다.

수정 화면은 제목 편집 시 `titleMode: 'manual'`을 전달한다. 기존 외부 제목을 유지하면 `external`과 `titleMode`를 그대로 전달한다. URL 변경 시 Provider가 기본적으로 외부 캐시를 제거하며 다른 URL의 새 캐시를 전달하려면 새 응답이 필요하다. `DraftInput.external: null`은 캐시 삭제, `place: null`은 좌표 삭제이며 `undefined`는 수정 시 기존 정보 보존이다. 장소 이름을 바꾸면 UI가 `place: null`을 전달해 이전 좌표를 새 이름의 확정된 위치처럼 표시하지 않는다. 기본 `placeName`·메모 문자열은 유지된다.

검증은 `tests/content-integrations.test.ts`, `tests/library-storage.test.ts`의 v1/v2·잘못된 version·실패 보존·배치 중복·기한 경계·origin·좌표 사례를 따른다. 새 DOM 웹의 브라우저 저장 어댑터·기존 데이터·quota 실패·재실행·숨김/복귀 동작과 보관한 iOS/Android의 저장소 장애·수명주기 확인은 각각 별도다.

NAVER 신규 저장·기존 API 항목 수정·mixed batch·중복 URL 거부와 기존 읽기·방문 변경·30일 prune 보존을 함께 확인한다. 화면의 새 검색/이탈·늦은 응답·만료는 저장 도메인 검사와 별도로 검증한다. 모의 응답 검사는 실제 HUB 키·검색 성공이나 기존 데이터 보존 정책의 출시 승인을 대신하지 않는다.
