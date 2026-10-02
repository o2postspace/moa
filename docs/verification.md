# 모아 검증 기록

## 새 Figma 파일 · 2026-10-03

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

팀 초대·공유 권한 변경·팀 라이브러리/Code Connect 게시는 수행하지 않았다. 픽셀 단위 앱 비교·320px/큰 글자·키보드·safe area·실기기 접근성은 별도 검증이다. Google/NAVER 키가 없어 실제 OAuth·재생목록·NAVER 검색 검증은 남아 있다. 공개 YouTube/Instagram의 이전 성공과 새 디자인 검증을 구분한다.

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
