# 로컬 저장 형식 v2와 API 정보 보존

2026-10-01. 저장 키는 기존 `moa.library.v1`을 유지하며, 값은 `{ "version": 2, "items": [...] }`이다. 키 이름과 값의 schema version은 별개다. 현재 기기의 저장함이며 클라우드 동기화·백업을 제공하지 않는다. AsyncStorage는 암호화되지 않은 저장소이므로 OAuth token·비밀값을 여기에 넣지 않는다. [Expo SDK 57 AsyncStorage 안내](https://docs.expo.dev/versions/v57.0.0/sdk/async-storage/)

## 기존 배열에서 이동

`readStoredLibrary`는 기존 JSON 배열과 v2 envelope를 읽고 모든 항목을 검증한다. 기존 배열이면 `needsMigration: true`를 반환한다. ID·사용자 제목·메모·장소 문자열·방문 상태·생성일·목록 순서를 유지한다. `parseStoredContent`는 기존 호출부용 읽기 wrapper이며 저장 형식의 검증만 수행한다.

Provider는 `loadStoredLibrary`로 읽은 뒤 필요한 migration과 기한 정리를 하나의 `setItem` 교체 쓰기로 저장한다. 쓰기가 성공한 뒤에만 목록을 공개하고 변경 작업을 허용한다. 지원하지 않는 version, 잘못된 JSON, 항목 하나의 스키마 오류·위험 URL·중복 ID·출처 불일치는 전체 로드 실패로 처리하며 저장값을 덮어쓰지 않는다. migration 쓰기 실패 때도 준비 상태로 전환하지 않고 재시도를 제공한다. 저장 라이브러리의 내부 복구나 백업 기능을 추가한 것은 아니며 `setItem` 성공/실패를 경계로 동작한다.

변경도 `saveStoredLibrary`의 쓰기 성공 후 화면 상태를 갱신한다. 실패하면 이전 메모리 목록과 입력을 유지한다. 다른 변경 처리 중에는 다음 변경을 차단한다. 여러 프로세스·브라우저 탭의 동시 편집을 병합하는 기능은 없다.

## 사용자 정보와 API 정보

- `title`, `url`, `category`, `placeName`, `note`, `visited`, `createdAt`은 기본 필드다. 수동 링크 추가 시 사용자 제목이 필요하다.
- `external?: { provider: 'youtube', title, authorName?, fetchedAt }`은 공개 YouTube 제목 정보의 캐시다. `titleMode: 'external'`이면 유효 기간 안의 캐시 제목을 표시하고, 미지정 또는 `'manual'`이면 기본 `title`을 표시한다. 자동 제목을 사용하는 수동 링크의 기본 제목은 UI가 일반 제목으로 보관한다. 사용자 제목을 고치면 `titleMode: 'manual'`로 저장한다.
- `importedFrom?: { provider, method, fetchedAt, connectionId? }`는 항목 전체가 API에서 왔다는 근거다. YouTube는 `public-playlist` 또는 `account-playlist`, 네이버는 `place-search`만 허용한다. URL의 실제 출처와 일치해야 한다. `account-playlist`에는 연결마다 발급된 `connectionId`가 필요하며 다른 방법에는 이 값을 넣지 않는다. 연결 ID는 credential이 아니다.
- `place?: { provider: 'naver', name, address, latitude, longitude, fetchedAt }`는 네이버 장소 검색에서 선택한 결과다. 해당 항목은 네이버 URL과 `place-search` origin이 필요하다. 좌표는 유한한 숫자로 위도 −90~90, 경도 −180~180이어야 한다. 직접 입력한 `placeName` 문자열과 좌표의 근거는 별개다.

`fetchedAt`은 timezone을 포함한 ISO 날짜이며 잘못된 달력 날짜나 현재보다 5분을 넘겨 미래인 값을 거부한다. 기기 시계가 잘못되면 가져오기와 읽기가 실패할 수 있다. UI가 메타데이터·origin·좌표를 임의로 확정하지 않고 API 응답에서 전달해야 한다.

## 30일 기한과 연결 해제

`fetchedAt`부터 정확히 30일이 되는 시점에 API 정보가 만료된다. 자동 갱신은 구현하지 않았다. 로드·성공적인 저장 변경, 앱의 전경 복귀, 전경에서 1시간 주기의 확인 때 기한 정리를 저장하며, 표시/검색 helper는 만료된 외부 제목을 즉시 기본 제목으로 대체한다. 만료 항목이 없으면 정리를 위한 쓰기를 하지 않는다. 다른 저장 작업 중에 전경 정리 요청이 오면 해당 작업 뒤에 다시 확인한다. 정리 쓰기 실패 시 원본 저장값과 현재 목록을 유지하고 변경을 차단한 뒤 다시 불러오기를 안내한다. 앱이 닫혀 있는 동안 저장소를 정리하는 백그라운드 서비스는 없으며 전경 타이머도 운영체제의 실행 제약을 받는다. [React Native 0.86 AppState 안내](https://reactnative.dev/docs/0.86/appstate)

- 수동으로 추가한 URL의 `external`만 만료되면 캐시를 지우고 기본 제목·URL·사용자 메모·방문 상태를 남긴다.
- `importedFrom`이 있는 항목은 30일 뒤 **전체 항목을 삭제**한다. 그 항목에 사용자가 덧붙인 메모·분류·방문 표시도 함께 삭제된다. 네이버 장소 좌표의 기한이 먼저 끝나도 전체 항목을 제거한다. 가져오기 전에 UI가 이 동작을 설명한다.
- 수정해도 기존 `importedFrom.fetchedAt`과 origin을 보존하여 기한을 연장하지 않는다. 같은 URL 중복은 새 API 정보로 기존 항목을 덮어쓰거나 기한을 갱신하지 않는다. 갱신 기능은 별도 구현이 필요하다.
- 명시적인 계정 연결 해제에서 `removeAccountImports(connectionId)`를 호출하면 그 연결의 `account-playlist` 항목 전체를 삭제한다. 인자를 생략하면 모든 계정 가져오기 항목을 삭제한다. 공개 재생목록·네이버 장소·수동 링크는 유지한다. API 연결 확인 실패·서버 재시작·일시적인 offline만으로 삭제하지 않는다.

## 배치와 수정 계약

`importMany`는 최대 200개의 draft를 받는다. 사용자 제공 파일에서 직접 확인한 링크는 origin 없이 수동 링크로 저장할 수 있으며 API 항목 전체 삭제 기한을 적용하지 않는다. API 응답으로 생성한 항목에는 UI가 해당 `importedFrom`을 반드시 전달해야 한다. 전체 입력을 먼저 검증하여 잘못된 항목이 있으면 배치 전체를 거부한다. 검증 후 기존 목록과 배치 안의 정규화 URL 중복을 건너뛰며 `{ added, duplicates }`를 반환한다. 새 항목은 응답 순서대로 목록 앞에 넣고, 기존 ID·방문 상태·메모·목록 순서를 보존한다. 저장 쓰기는 한 번 수행한다.

URL 중복 기준은 장소 동일성이나 video ID만의 일치가 아니다. 추적 query는 제거하지만 `t`, `list`, 일반 사이트의 의미 있는 query와 fragment는 유지한다. YouTube watch/shorts/youtu.be의 같은 주소 형태를 정규화하며 의미 있는 query가 다르면 별도 항목이 될 수 있다. 정확한 입력 원본 URL은 별도 보관하지 않는다.

수정 화면은 제목 편집 시 `titleMode: 'manual'`을 전달한다. 기존 외부 제목을 유지하면 `external`과 `titleMode`를 그대로 전달한다. URL 변경 시 Provider가 기본적으로 외부 캐시를 제거하며 다른 URL의 새 캐시를 전달하려면 새 응답이 필요하다. `DraftInput.external: null`은 캐시 삭제, `place: null`은 좌표 삭제이며 `undefined`는 수정 시 기존 정보 보존이다. 장소 이름을 바꾸면 UI가 `place: null`을 전달해 이전 좌표를 새 이름의 확정된 위치처럼 표시하지 않는다. 기본 `placeName`·메모 문자열은 유지된다.

검증은 `tests/content-integrations.test.ts`, `tests/library-storage.test.ts`의 v1/v2·잘못된 version·실패 보존·배치 중복·기한 경계·origin·좌표 사례를 따른다. 실제 iOS/Android의 저장소 장애와 앱 수명주기 확인은 별도다.
