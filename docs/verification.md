# 모아 검증 기록

## React DOM 웹앱 전환 · 2026-10-03

사용자의 웹앱 구현 요청에 따라 기본 실행을 Vite·React DOM·React Router로 전환했다. 기존 Expo 코드와 전환 전 검증 기록은 보관한다. `npm run dev`로 API8787과 웹8081을 함께 실행했고 브라우저는 같은 origin의 `/api`를 사용했다. 기존 `.env.local`을 수정·초기화하지 않았다.

| 검사 | 결과 |
| --- | --- |
| typecheck / lint / tokens:check / build:web | 모두 통과. 기본 검사는 웹·공유 도메인·서버 대상 |
| npm test | 84개 통과. 기존62개 + 프로세스 종료2개 + 웹 API/File7개 + 브라우저 저장13개 |
| 실제 저장함 이관 | 같은 localhost:8081 브라우저의 기존5개·순서·제목·메모·방문1개를 유지. 데이터 시드·초기화 없이 확인 |
| 데스크톱 / 모바일 | 1440×1000에서3열, 390×844/320×844에서1열. 저장함·입력/상세의 확인한 너비에서 페이지 가로 overflow 없음 |
| 검색·분류·방문 | 방문1개 필터, ‘성수’ 검색1개, 맛집 분류와 함께 적용 시0개·빈 결과와 초기화 확인 |
| 실제 쓰기 / 새로고침 | 공개 재생목록으로 저장된 기존 영상의 방문 표시 저장→상세 새로고침 후 유지→원래 상태 복원. 수정 폼에서 메모 펼침/접힘 입력 보존 후 원래 빈 값으로 돌려 수정 저장. 생성일·원본·2026-11-02 보관 기한 유지 |
| 입력 오류·중복 | 빈 입력 오류가 URL 필드에 초점 이동. 이미 있는 URL 저장은 중복 안내·기존 상세 링크 제공, 새 항목 없음 |
| 실제 YouTube API | 같은 origin proxy로 공개 Google I/O 재생목록17개 조회. 이미 저장된1개 비활성·16개 후보 선택 확인. 새 DOM에서 추가로 API 항목을 저장하지 않음 |
| 실제 Instagram | 기존 공식 공개 예시의 사용자 요청 후 원문이 sandbox srcDoc/공식 내부 iframe에 표시됨. 원문 접기 확인. 제목·장소·작성자 정보를 추출/저장하지 않음 |
| 브라우저 저장 실패·두 탭 | 가상 저장소/배타 runner의 실제 repository 검사. 두 repository 최신 읽기·교차 변경 보존·quota/잘못된 값/지원하지 않는 Web Locks의 쓰기 거부·이동 원본 보존 확인. 실제 두 브라우저 탭의 동시 편집은 별도 검증 |
| 파일/API 경계 | 실제 웹 어댑터를 가상 File/fetch로 검사. UTF-8/BOM·2MiB 경계·읽기 실패, 같은 origin/cookie/no-store/15초 timeout·안전 OAuth 주소 확인 |
| 번들 비밀값 | 실제 빌드의 JS/CSS/HTML/manifest 텍스트4개에서 등록된 비밀값1개 문자열이 없는 것을 확인. .env.local Git 제외 유지 |

내장 브라우저의 파일 선택 자동화는 filechooser 이벤트를 받지 못해 취소했다. OS 파일 선택→후보 검토의 새 DOM 전체 흐름은 수동 브라우저/실기기 검증으로 남긴다. File 어댑터/parser의 지속 검사와 전환 전 Expo 웹의 파일 후보 저장 기록을 이 검사와 구분한다. 클립보드 권한, 외부 지도 웹/앱 열기, 큰 글자/스크린 리더·실기기, 50개 초과 페이지, 실제 Google OAuth 계정 가져오기/해제는 남아 있다.

새 브라우저는 빈 저장함으로 시작한다. NAVER API는 제외했고 위치·행사 기간·근처 알림·AI·운영 호스팅을 추가하지 않았다. Web Locks는 지원 브라우저의 동일 origin 웹 탭 사이 변경을 조정하며 Expo 보관본·다른 앱의 비협조적 쓰기까지 보호하지 않는다. HTTPS 운영 설정과 사용자별 인증/세션 격리는 [웹앱 시작점](web-app.md)을 따른다.

화면 증거: [데스크톱 저장함](../design/web-library-desktop.png), [모바일 저장함](../design/web-library-mobile.png). Figma 데스크톱 초안·Handoff의 실제 node와 구조/시각 검사는 최신 [manifest](../design/figma-manifest.json), [Figma 기록](figma-sync.md)을 따른다. 기존 모바일 baseline 해시를 전체 웹 자동 동기화 결과로 해석하지 않는다.

수동 파일 선택 검토에 사용할 공개 테스트 입력은 [TXT](../tests/fixtures/browser-import.txt)와 [잘못된 JSON](../tests/fixtures/browser-invalid.json)에 있다. TXT는 공개 YouTube 링크2개이며 실제 계정 export가 아니다. 기존 저장 URL은 후보에서 비활성, 새 URL은 선택 가능, 잘못된 JSON 재선택 실패 때 이전 후보 보존을 확인한다. 검토 파일을 선택한 것만으로 저장하지 않는다.

## 현재 NAVER 제외 MVP · 2026-10-03

사용자가 NAVER를 보류하도록 요청했다. 서비스 화면의 NAVER 카드·장소 검색 진입과 홈의 장소 검색 문구를 제거하고 화면 이름을 ‘콘텐츠 가져오기’로 바꿨다. 미설정 Google 계정 버튼과 반복 준비 안내는 숨겼으며 공개 재생목록 키가 설정된 경우 입력/가져오기를 표시한다. OAuth 설정 시 기존 계정 흐름은 유지하지만 현재 실제 계정 검증은 후속이다. `/places`는 안내와 가져오기 이동만 렌더링하며 API를 요청하지 않는다. 이전 검색 구현은 `src/features/integrations/NaverPlacesScreen.tsx`에 보관한다. NAVER 발급·정기결제 등록은 이번 범위에서 진행하지 않았고 결제 창을 닫았다.

웹의 실제 공개 재생목록 조회에서 영상 17개를 확인했다. 선택을 모두 해제하면 ‘0개 저장하기’가 비활성화되고 첫 영상 하나만 고르면 ‘1개 저장하기’가 활성화됐다. 실제 저장 후 ‘1개를 저장했어요. 중복 0개는 제외했어요.’를 확인했다. 새로고침한 저장함에서 기존 검토 항목 4개와 새 영상 1개, 방문 완료 1개를 확인하고 새 영상의 상세를 열었다. 원본 YouTube 링크, 제공 제목과 2026-11-02까지 보관 안내를 확인했다. 다시 같은 재생목록을 가져오면 저장한 영상은 ‘이미 저장됨’ 비활성 후보이고 나머지 16개만 선택된다. 추가 영상을 저장하거나 기존 항목을 삭제하지 않았다. 공개 검증 영상은 이 로컬 검토 저장함에 남아 있으며 새 설치의 기본 데이터가 아니다.

[가져오기 상단](../design/integration-without-naver-top.png), [하단](../design/integration-without-naver.png), [저장 후 재실행한 영상 상세](../design/integration-youtube-saved-detail.png)를 남겼다. `/places` 직접 접근의 [검색 없는 보류 안내](../design/integration-naver-deferred.png)와 가져오기 이동도 실제 확인했다. 공개 YouTube 제목·Instagram 원문·파일 후보 저장의 기존 실제 검증은 아래 기록을 따른다. 이번 변경은 제공자 어댑터나 저장 계약을 수정하지 않았다. 인스타 개인 저장함·YouTube 나중에 볼 동영상 자동 동기화, 위치·기간 알림은 현재 기능이 아니다.

Figma 원본과 리뷰에도 NAVER 카드·미설정 OAuth 버튼을 숨기고 SCR-005를 보류 안내로 바꿨다. 장소 결과 예시는 향후 검토용으로 표시하고 이전 진입을 제거했다. 원본/리뷰 4쌍 및 서비스 전체 구성의 텍스트 일치, 390×844 모바일 원본/리뷰, Noto Sans KR, IMAGE fill 0을 읽기 확인했다. 현재 기본 이동은 18개, reaction node는 36개, 시작점은 3개다. Screens·States·FullScroll·Handoff 캡처를 시각 확인했으며 전체 보드는 440×1362다. 자동 픽셀 동기화·프로토타입 재생·실제 API 호출 완료를 뜻하지 않는다. 이전 manifest와 캡처 4개는 `design/history/`에 보존했다. [최신 manifest](../design/figma-manifest.json), [Figma 부분 갱신](figma-sync.md)을 따른다.

`npm test` 62개, `npm run typecheck`, `npm run lint`, `npm run tokens:check`, `npm run build:web`가 통과했다. 웹 내보내기의 JS/HTML/JSON 3개에서 현재 설정된 서버 비밀값의 문자열이 없음을 확인했다. 실제 Google OAuth, 비공개 재생목록, 50개 이상 페이지 이동·계정 해제, iOS/Android 실기기와 네이티브 공유는 아직 미검증이다. NAVER 발급·실제 검색과 기존 API 데이터 보존 정책 재검토는 보류된 별도 범위다.

## 신규 발급 준비와 NAVER API HUB · 2026-10-03

아래는 NAVER 보류 요청 **이전의 이력**이다. 결제 등록·키 발급을 현재 대기 중인 필수 작업으로 해석하지 않는다.

Google Cloud에서 모아 전용 `moa-local` 프로젝트 생성과 YouTube Data API v3의 ‘사용 설정됨’을 실제 확인했다. OAuth 앱 정보와 `youtube.readonly` 범위를 등록하고 웹 클라이언트 `moa-local-web` 및 `http://localhost:8787/api/youtube/callback` 양식을 준비했다. 최종 인증정보 생성은 계정 소유자 확인 대기이며 Google OAuth 값은 아직 로컬 미등록이다. NAVER Cloud 간편 로그인 동의는 이후 사용자가 완료했고 로그인 상태를 확인했다. API HUB 콘솔은 서비스 이용이 불가능한 계정 안내를 표시했으며 결제 정보 관리에서 등록된 결제수단이 없는 것을 확인했다. 정기결제 등록 창까지 열었고 휴대폰 본인인증·카드 입력·정기결제 동의는 사용자에게 넘겼다. HUB Application·키는 생성하지 않았고 실제 NAVER 성공 응답도 확인하지 않았다. 계정 연락처·프로젝트 식별값·결제 정보·비밀값은 기록하지 않는다.

신규 NAVER 발급 경로에 맞춰 `NAVER_API_PROVIDER=legacy|hub`와 별도 HUB 변수, 공식 endpoint·헤더·`format=json`을 추가했다. 선택한 경로의 키만 사용하며 다른 제공자로 자동 재시도하지 않는다. 인증·한도·장애 오류는 제공자의 원본 내용을 전달하지 않는 자체 안내로 바꾼다. [이관 안내](https://guide.ncloud-docs.com/docs/apihub-migration), [HUB 지역 API](https://api.ncloud-docs.com/docs/naver-api-hub-search-local)

[2026-09-20 시행 HUB 조건](https://www.ncloud.com/support/notice/all/2243)에 맞춰 장소 검색의 분류·영구 저장을 제거했다. 결과는 메모리에만 두고 새 질의·화면 이탈·최대 24시간에 정리하며 전경 복귀 때 기한을 다시 확인한다. 늦게 도착한 이전 응답은 재표시하지 않는다. 원문 URL과 네이버 지도 확인을 제공한다. 도메인은 신규 NAVER API 출처·장소 정보의 저장과 혼합 배치를 거부한다. 사용자가 직접 공유한 지도 링크의 수동 저장은 유지한다. 기존 개발 데이터의 읽기·이동·방문 표시·기존 30일 정리는 호환성을 위해 보존했고 조기 삭제하지 않았다. 기존 API 항목의 수정 저장은 차단되며 기존 보존 방식이 현재 약관을 충족한다는 주장은 하지 않는다.

실제 로컬 서버 재시작 후 `/api/status`는 공개 재생목록 설정 있음, OAuth·NAVER 검색 설정 없음으로 HTTP 200을 반환했다. HUB 미설정 검색은 HTTP 503 `setup_required`와 HUB 인증정보 안내를 반환했다. 웹의 빈 검색 버튼 비활성화·검색 후 같은 오류 표시·분류/저장 CTA 제거·24시간 안내를 확인했다. [웹 HUB 준비 안내](../design/integration-naver-hub-setup.png)를 남겼다. 저장함으로 돌아갔을 때 기존 검토 항목 4개가 유지됐으며 이번 검색으로 저장소를 변경하지 않았다. 서비스 화면의 새 NAVER 문구와 키 미설정 검색 버튼 비활성화도 확인했다. 실제 성공 결과·24시간 경과·실기기 AppState와 지도 앱 검증은 남아 있다.

| 이번 변경의 검사 | 결과 |
| --- | --- |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npm test` | 62개 통과. HUB 계약·오류/키 격리와 신규 NAVER 저장 거부·기존 읽기 호환 포함 |
| `npm run tokens:check` | 토큰 원본과 생성 코드 일치 |
| `npm run build:web` | 웹 내보내기 완료 |

새 Figma의 SCR-004/005·검색 결과 원본/리뷰·서비스 전체 구성을 부분 갱신했다. NAVER 저장/분류 대신 원문·지도와 임시 결과 안내를 표시하고 기존 Secondary 컴포넌트의 연결 상태 재확인을 추가했다. 영향받는 원본/리뷰 세 쌍 텍스트 일치, 390×844 유지, Noto Sans KR·IMAGE fill 0을 읽기 확인했다. 현재 기본 이동 20개·reaction이 있는 node 41개·시작점 3개이며 프로토타입 재생과 실제 API 요청은 미검증이다. 최신 screens/states/fullScroll PNG 세 개를 직접 시각 확인했고 전체 구성은 440×1650이다. 이전 59205e5 기준 manifest·세 PNG는 `design/history/`에 보존했다. [최신 manifest](../design/figma-manifest.json), [부분 갱신 기록](figma-sync.md)

## 실제 공개 재생목록 연결 · 2026-10-03

서버용 `YOUTUBE_API_KEY` 설정 후 로컬 API 서버를 다시 시작했다. `/api/status`에서 공개 재생목록 설정을 확인하고, [Google 공식 Chrome 문서](https://developer.chrome.com/blog/ai-io25)가 연결하는 [Google I/O 2025 공개 재생목록](https://www.youtube.com/playlist?list=PLNYkxOF6rcIDf2yTHfwShSCwVxaUuGk-v)을 `/api/youtube/playlist`로 조회했다. 실제 HTTP 200, 영상 17개, 다음 페이지 없음으로 응답했다. 비밀값은 출력·캡처·커밋하지 않았다.

웹 서비스 연결 화면에서 ‘연결 상태 다시 확인’을 누른 뒤 페이지 전체 새로고침 없이 공개 재생목록 버튼이 활성화됐다. 실제 영상 17개가 후보로 표시됐고, 전체 선택 해제 시 0개 저장 버튼이 비활성화됐다. 영상 1개를 선택하면 1개 저장 버튼이 활성화됐다. [선택 화면 캡처](../design/integration-youtube-playlist-preview.png)를 남겼다. 이 검토에서는 영상을 저장하지 않았다.

연결 상태 재확인 버튼을 항상 표시하고 요청 중 비활성화했다. OAuth 없이 공개 재생목록 키만 설정한 경우 서비스 상태는 ‘공개 재생목록으로 시작’으로 표시한다. 설정 여부를 실제 계정 연결 완료로 표시하지 않는다. 이 검사 당시 Figma는 아래 소스 `59205e5` 기준 초안이었다. 이후 부분 반영 범위는 위 최신 기록과 manifest를 따른다.

공개 YouTube 제목과 Instagram 원문 API도 다시 실제 HTTP 200 응답을 확인했다. Instagram HTML은 응답 확인에만 사용하고 저장하거나 내용을 분석하지 않았다. Google OAuth 클라이언트 두 값과 NAVER 검색 키 두 값은 이 확인 시점에 미설정이다. 실제 계정 로그인·선택 저장·재실행·50개 이상 페이지 이동·해제와 NAVER 실제 검색은 남아 있다. 네이티브 기기 검증 범위도 기존 기록과 같다.

이번 버튼·문구 변경 후 `npm run typecheck`, `npm run lint`, `npm run build:web`, `git diff --check`가 통과했다. 기존 서버 경계 테스트 11개도 통과했다. 실제 제공자 응답과 모의 서버 테스트의 검증 범위는 별도로 기록한다.

## 새 Figma 파일 · 2026-10-03

이 절은 새 파일 최초 구성의 기록이다. 이후 부분 갱신으로 바뀐 이동 수·보드 높이·세 캡처는 위 최신 기록과 `design/history/`의 초기 기준을 구분한다.

연결 계정에서 [모아 · 저장 콘텐츠 & 서비스 연동](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ)을 새로 만들고 편집 가능한 네이티브 화면·공통 컴포넌트·변수·Handoff를 구성했다. 앱 소스 `59205e5`의 흐름을 바탕으로 한 디자인 초안이다. 기존 파일을 변경하거나 자동 픽셀 동기화를 구현한 작업은 아니다. 이번 작업에서는 앱/API 동작을 수정하지 않았다.

| 보드 | 원격 보드 크기 | 새 캡처 · 시각 확인 |
| --- | --- | --- |
| [핵심 5화면 · 4:256](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-256) | 2250×1032 | [screens](../design/figma-current-screens.png) · 확인 완료 |
| [4가지 상태 · 4:577](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-577) | 2250×1032 | [states](../design/figma-current-states.png) · 확인 완료 |
| [컴포넌트 상태 · 2:929](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=2-929) | 2250×814 | [components](../design/figma-current-components.png) · 확인 완료 |
| [서비스 전체 구성 · 4:797](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-797) | 440×1547 | [fullScroll](../design/figma-current-fullScroll.png) · 확인 완료 |
| [Handoff · 4:902](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-902) | 1530×503 | [handoff](../design/figma-current-handoff.png) · 확인 완료 |

캡처에서 발견한 아이콘·종이 스탬프·카드·하단 동작·상태 행 레이아웃을 수정한 뒤 새 캡처로 다시 확인했다. SVG의 512px 원본을 24px 아이콘으로 줄일 때 strokeWeight를 함께 조정했고, 스탬프 종이 높이는 72/104px 고정으로 유지했다. 카드 텍스트는 FILL로 배치하고 출처 배지·분류 속성을 맞췄다. 가져오기 선택 저장 CTA를 하단에 고정하고 컴포넌트 상태 행의 폭 잘림을 수정했다.

구조 읽기에서 SCR/STATE 원본 9개가 390×844이며 텍스트 폰트는 Noto Sans KR, IMAGE fill은 0개임을 확인했다. 공통 CMP 7종과 입력 보조 컴포넌트, primitive 31개·semantic alias 31개, 텍스트 스타일 8개, Ionicons SVG 아이콘 컴포넌트 14개를 확인했다. 원본은 페이지 최상위 프레임이며 리뷰 보드 복제본과 함께 관리한다. 실제 node와 범위는 [현재 manifest](../design/figma-manifest.json)를 따른다.

기본 화면 이동 22개를 등록했다. 복제본·서비스 동작을 포함해 reaction이 있는 node 45개를 읽기 확인했고 시작점 3개(`4:262`, `4:583`, `4:646`)와 세로 스크롤을 설정했다. **프로토타입 재생은 아직 검증하지 않았다.** 연결·검색·저장 예시는 디자인 상태이며 실제 제공자 요청을 수행하지 않는다.

| 이번 작업의 로컬 검사 | 결과 |
| --- | --- |
| `npm run typecheck` | 통과 |
| `npm run tokens:check` | 토큰 원본과 생성 코드 일치 |
| `npm run lint` | 통과 |

팀 초대·공유 권한 변경·팀 라이브러리/Code Connect 게시는 수행하지 않았다. 픽셀 단위 앱 비교·320px/큰 글자·키보드·safe area·실기기 접근성은 별도 검증이다. Figma 작업 당시에는 Google/NAVER 키가 없어 실제 OAuth·재생목록·NAVER 검색 검증이 남아 있었다. 이후 공개 재생목록 확인은 위 기록을 따른다. 공개 YouTube/Instagram의 이전 성공과 새 디자인 검증을 구분한다.

## 이전 검사 기록 · 2026-10-01

이하 내용은 2026-10-01 당시의 검사와 남은 작업 기록이다. 이후 새 Figma 파일의 상태·캡처·검사는 위 기록을 따른다. 아래 기존 Figma 권한/호출 한도와 이전 캡처는 새 파일의 현재 상태가 아니다.

2026-10-01, Windows / Node.js 24.15.0. 앱 버전 0.1.0. 당시 실제 iOS·Android 기기 검증 전이며 스토어 설치 파일을 만들거나 배포하지 않았다.

## 자동 검사

| 검사 | 결과 |
| --- | --- |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npm test` | 콘텐츠·가져오기·저장소·서버 40개 통과 |
| `npm run tokens:check` | 토큰 원본과 생성 코드 일치 |
| `npm run build:web` | `dist/` 웹 내보내기 완료 |
| `npx expo-doctor` | 21개 검사 통과 |

테스트는 HTTPS·호스트 경계, URL 중복·쿼리 보존, 검색, v1/v2 마이그레이션, 손상·쓰기 실패 원본 보존, 배치 전체 실패·중복 제외, 보존 기한·계정 삭제, JSON/TXT 제한, 고정 API 주소·OAuth state/PKCE/replay·cookie·토큰 refresh/revoke 실패와 Naver 좌표를 다룬다. 모의 제공자 응답과 저장소로 검증한 항목은 실제 Google 계정·NAVER 키·네이티브 기기의 검증을 대신하지 않는다. 위 표는 Windows 로컬 검사 기록이며 원격 head 검사는 GitHub Actions에서 확인한다.

## API 연결 단계 · 2026-10-01

- 키 없이 로컬 서버에서 YouTube `dQw4w9WgXcQ`의 실제 oEmbed 제목·작성자 조회 성공. 앱에서 제목 불러오기 → 저장 → 목록의 실제 API 제목 표시 → 페이지 재실행 후 유지까지 확인했다. `design/integration-youtube-preview.png`는 390×844 웹 화면이다.
- Instagram 공식 문서의 공개 예시 `https://www.instagram.com/p/fA9uwTtkSN/`에 실제 tokenless oEmbed 요청이 성공했다. 앱 상세의 사용자가 누른 요청에서만 HTML을 받고 공식 게시물의 사진·제공자 UI가 표시되는 것을 확인했다. `design/integration-instagram-preview.png`는 현재 웹 원문 표시 증거다. HTML을 로컬 저장소나 파일에 보관하거나 제목·장소를 추출하지 않았다.
- opaque sandbox는 same-origin을 허용하지 않는다. 초기 시각 검증에서 제공자의 높이 handshake가 되지 않아 내부 frame 높이가 1px인 문제를 발견해, 내부 스크롤 표시 영역을 적용한 뒤 실제 게시물 표시를 재확인했다.
- 공개 링크 4줄의 TXT fixture에서 후보 2개·중복 1개·위장 도메인 제외 1개를 확인했다. 이미 저장한 YouTube 후보는 선택이 차단됐고, 전체 선택 해제 → Instagram 후보 개별 선택 → 1개 저장 성공을 확인했다. 재실행 후 총 4개가 유지되어 기존 2개도 보존됐다. fixture는 개발용 공개 샘플이며 실제 사용자 export가 아니다.
- 서비스 연결 화면 320×800에서 clientWidth/scrollWidth 모두 320으로 가로 넘침이 없었다. YouTube/Instagram 실제 흐름은 390×844에서 확인했다. `design/integration-preview.png`는 최종 390×844 연결 화면이다.
- 자격 증명이 없는 status에서 Google 계정·공개 재생목록·네이버 검색 버튼이 준비 전 상태로 표시됐다. API 설정 있음과 실제 계정 연결 완료는 별도의 상태다.
- Google 실제 OAuth·계정/공개 재생목록 paging/import/revoke, NAVER 실제 검색·quota·영업 장소 검증은 발급 키가 없어 미실행이다. iOS/Android의 파일 선택·클립보드 권한·지도 앱/미설치 fallback·OAuth callback·AppState와 장시간 기한 정리·화면 읽기는 미실행이다.
- 계정 해제 시 이 기기의 모든 계정 재생목록 항목을 먼저 저장소에서 삭제하고 remote revoke를 요청한다. 로컬 쓰기 실패는 revoke를 요청하지 않으며, 원격 실패는 실제 연결 상태를 유지하고 재시도한다. 모의 서버·저장소 테스트 범위와 실제 계정 미검증을 구분한다.
- 당시 새 Figma 계정 연결을 확인했지만 기존 파일 edit 권한 거부로 원격 갱신은 하지 않았다. 이번 권한 오류를 이전 Starter 호출 한도와 구분했으며 당시 매핑은 [이전 manifest](../design/history/figma-manifest-2026-10-01.json)에 보존했다. 이후 새 파일 생성은 위 기록을 따른다.

이하 기록은 이전 링크 저장·UI 리디자인 단계의 동작 검사다. 아래 과거 Figma 캡처나 CI를 현재 API 화면의 증거로 사용하지 않는다.

## 실제 브라우저 동작

Expo 웹 개발 서버에서 같은 앱 코드를 실행하고 아래 흐름을 확인했다.

- 빈 입력 저장 시 필수 입력 오류가 표시된다.
- 네이버 링크·제목·장소·메모를 추가하고 저장함에서 확인했다.
- 페이지를 새로 열어도 저장 내용이 유지된다.
- 상세에서 방문 완료를 표시한 뒤 제목·분류를 수정해도 방문 상태가 유지된다.
- 제목 검색, 출처·분류 필터, 결과 없음 안내와 필터 해제를 확인했다.
- 동일 링크를 다시 저장하면 중복 안내가 나오고 기존 콘텐츠를 열 수 있다. 저장 개수는 늘어나지 않았다.
- 추가·수정·상세의 ‘저장함으로 돌아가기’가 저장함으로 이동한다.

검토용 브라우저에만 ‘노들섬 산책 · 저장 예시’ 항목 1개를 입력했다. 실제 행사 일정이나 계정에서 가져온 데이터가 아니다. 새 기기·브라우저의 초기 저장함은 비어 있다. 위 흐름은 첫 기능 확인 당시의 기록이며, [앱 검토 이미지](../design/app-preview.png)는 아래 리디자인 검증에서 최신 390×844 화면으로 갱신했다.

## 디자인 검증 범위

편집 가능한 Figma 기본 화면 3개를 캡처해 글자·아이콘 수정 후 확인했다. [검토 이미지](../design/figma-preview.png)와 [이전 manifest](../design/history/figma-manifest-2026-10-01.json)에 확인 시점과 node ID를 기록했다. Starter 도구 한도에 도달해 이후 컴포넌트 상태 보드와 ContentCard 수정의 최종 시각 검증, Foundations 시각 검증, Brief·Flows·Handoff 작성, 클릭 프로토타입은 당시 남아 있었다. 로컬 [인수인계](design-handoff.md)와 [로드맵](roadmap.md)으로 이어갈 작업을 전달했다.

## 다음 검증

기존 저장함 가져오기는 실제 사용자 내보내기·공유 샘플로 가능 범위를 먼저 확인한다. 그 뒤 삭제·폴더 등 정리 기능, 장소 좌표, 지도, 행사 기간, 근처 알림을 단계별로 추가한다. 현재는 플랫폼 계정 연동과 위치·기간 알림을 제공하지 않는다.

## 두 번째 UI 리디자인 검증

2026-10-01, 작업 브랜치 `codex/mmm-ui-refresh`. 이 절의 결과는 새 앱 UI에 대한 기록이며 위 첫 기능·이전 Figma 검증 기록을 유지한다. 기존 `main`의 `f8504d…`와 확인된 CI 기록은 이번 브랜치의 검증 결과와 구분한다. 이 브랜치의 PR·원격 CI 상태는 [GitHub PR](https://github.com/o2postspace/moa/pulls)과 [Actions](https://github.com/o2postspace/moa/actions)에서 현재 head를 확인한다.

전체 저장/방문 완료 탭, 펼쳐지는 출처 필터, CategoryStamp를 사용하는 회색 카드, 선택 장소·메모 접기, 추가·상세의 고정 하단 액션, 입력 오류 초점 이동을 반영했다. 링크·저장 규칙과 LibraryProvider는 변경하지 않았다.

| 검사 | 이번 결과 |
| --- | --- |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npm test` | 기존 도메인 8개 통과 |
| `npm run tokens:check` | 새 토큰 원본·생성 코드 일치 |
| `npm run build:web` | 웹 내보내기 통과 |
| 웹 390×844 | 저장함·추가·상세 실제 화면과 캡처 확인 |
| 웹 320×800 | 긴 제목·가로 넘침·선택 입력 유지 확인 |
| 실제 iOS·Android | 미검증 |

텍스트 대비를 계산해 보조색 `#62685F`/회색 표면 `#F5F5F1` 5.24:1, 강조 글자 `#A83A20`/연한 주황 `#FCEBE3` 5.51:1, 흰 글자/브랜드색 `#C94C2B` 4.61:1을 확인했다. 코드 검토에서 선택 입력 값 보존, 오류 초점·스크롤 이동, 하단 오류 표시를 확인했다. 대비 계산과 코드 검토는 기기 화면 읽기·키보드 검증을 대신하지 않는다.

이번 웹 검토에서 확인한 흐름은 다음과 같다.

- 390×844의 [저장함](../design/app-preview.png), [링크 추가](../design/app-add-preview.png), [콘텐츠 상세](../design/app-detail-preview.png)를 실제 브라우저에서 확인했다.
- 320×800 상세의 긴 한국어 제목이 줄바꿈되고 가로 넘침이 없었다. `clientWidth = scrollWidth = 320`을 확인했다.
- 장소·메모 선택 입력을 접은 채 수정 저장해도 값이 유지되었다.
- 방문 완료 토글 후 새로 불러와도 상태가 유지되었고 방문 완료 취소가 동작했다.
- 방문 완료 1개 상태에 웹 출처 필터를 적용해 결과가 없을 때, ‘전체 저장 보기’가 탭·필터를 초기화하고 항목 2개를 표시했다.
- 동일 URL 저장 시 고정 하단 영역에 중복 오류와 기존 콘텐츠 보기 링크가 표시되고 상세로 이동했다.
- 필수 입력이 비어 있을 때 콘텐츠 링크 입력에 초점이 이동하는 웹 동작은 앞서 확인했다.

선택 입력 유지·토글·필터·중복 검토는 수동 웹 확인이다. 실제 네이티브 키보드, VoiceOver/TalkBack, 큰 글자 설정은 아직 확인하지 않았다.

Noto Sans KR을 적용한 로컬 브라우저에서 SVG 초안을 1282×948로 렌더해 3개 화면의 잘림·겹침이 없는 것을 확인했다. [SVG 검토 이미지](../design/ui-refresh-preview.png)를 남겼다. 이 결과는 Figma 가져오기 결과나 라이브 컴포넌트·프로토타입 검증이 아니다.

당시 실제 Figma는 Starter 도구 호출 한도로 이전 디자인을 유지했다. [리디자인 SVG](../design/moa-ui-refresh.svg)는 로컬 초안이며 라이브 파일 반영·프로토타입·Code Connect 완료가 아니었다. `design/figma-preview.png`는 그 이전 UI의 검증 이미지다. 기존 node ID를 유지하는 원격 갱신과 새 시각 검증은 당시 남아 있었다. 이후 연결 계정의 새 파일 작업과 현재 전달 상태는 위 2026-10-03 기록과 [전달 안내](ui-refresh.md)를 따른다.
