# 디자인 · 개발 협업

2026-10-03 기준. 앱 작업명은 **모아**. React DOM + Vite + React Router + TypeScript 웹앱을 작은 기능 단위씩 만든다. 기존 Expo 코드는 보관한다. 현재 UI/UX 작업 파일과 실제 코드 연결을 아래에 기록한다.

- 현재 Figma: [모아 · 저장 콘텐츠 & 서비스 연동](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ) — 연결 계정의 새 draft 파일
- GitHub: [o2postspace/moa](https://github.com/o2postspace/moa), [API·디자인 draft PR #2](https://github.com/o2postspace/moa/pull/2)
- 개발 시작점: [Codex 인수인계](codex-handoff.md), 제품 / 디자인 / 개발 담당자는 팀 지정 후 기록

## 현재 디자인 전달 상태

기본 제품은 `src/web`의 DOM 웹앱이다. PC에서 사이드 메뉴와 3열(중간 폭 2열), 700px 이하에서는 상단 메뉴와 1열을 사용한다. 기존 Figma 모바일 원본은 브랜드/흐름 기준으로 보존하며 새 웹 데스크톱 초안과 갱신 범위는 manifest를 따른다. 아래 코드 표는 활성 웹 경로이고 보관한 Expo 매핑은 component-map의 legacyExpo 필드에 남긴다. 공개 Code Connect 게시가 아니다.

웹 협업의 새 진입점은 [PC 저장함 25:774](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=25-774)와 [웹 Handoff 28:877](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=28-877)이다. PC 저장함은 1440×1100, 편집 가능한170개 하위 노드와 가상3카드로 구성했다. Noto Sans KR·기존 토큰/CMP를 재사용하며 전체 UI 이미지가 없다. 새 WEB-CMP-001 카드26:902와 WEB-CMP-006 스탬프26:897은 `src/web/components/Ui.tsx`의 ContentCard/CategoryStamp에 대응한다. 실행과 웹 검토 증거는 [웹앱 시작점](web-app.md), [검증 기록](verification.md)을 따른다.

흰 배경·따뜻한 회색 카드·둥근 컨트롤을 사용하고 모아의 브랜드색 `#C94C2B`를 유지한다. 보조색은 `#62685F`, 연한 주황색 위 강조 글자는 `#A83A20`이다. 전체/방문 탭, 출처·분류, CategoryStamp, 선택 정보와 하단 주요 액션을 공통 기준으로 관리한다.

새 파일에는 편집 가능한 텍스트·Auto Layout·컴포넌트 인스턴스로 현재 MVP 4화면과 NAVER 보류 안내, 상태·가져오기 전체 구성·컴포넌트·Handoff 보드를 유지한다. 앱 소스 `59205e5`를 전체 구성의 기준으로 만든 디자인 초안에 NAVER 제외 MVP를 부분 반영했다. SCR-004는 공개 재생목록 설정됨/OAuth 미설정 상태이며 NAVER 카드와 미설정 계정 버튼은 숨겼다. 이전 장소 결과 상태는 향후 검토용이다. 기준 해시를 전체 최신 동기화로 해석하지 않는다. 모든 코드 상태나 반응형·키보드·safe area를 구현한 파일 또는 앱과 픽셀 단위로 일치하는 동기화 결과로 보지 않는다.

이전 파일은 현재 연결 계정에서 편집 권한이 없어 사용자 요청에 따라 새 파일을 만들었다. [이전 파일](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt)과 기존 기록은 보존한다. [Figma 작업 상태](figma-sync.md), [UI 전달](ui-refresh.md), [현재 manifest](../design/figma-manifest.json)를 따른다.

## Figma 파일 구조

| 페이지 / 보드 | 역할 | 실제 node |
| --- | --- | --- |
| 모아 · 화면 & 디자인 시스템 | 현재 단일 페이지 | [0:1](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=0-1) |
| 현재 화면 리뷰 | 저장함·추가·상세·콘텐츠 가져오기 + NAVER 보류 안내 | [4:256](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-256) |
| 상태 리뷰 | 빈 저장함·입력 오류·후보 선택·보류된 향후 장소 예시 | [4:577](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-577) |
| 공통 컴포넌트 상태 | CMP-001–007 variant·보조 입력·아이콘 | [2:929](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=2-929) |
| 서비스 연결 전체 스크롤 | 첫 뷰포트 아래 내용 확인 | [4:797](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-797) |
| Handoff | 토큰·코드·검증 범위·협업 안내 | [4:902](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-902) |

페이지 최상위의 SCR/STATE 프레임은 프로토타입 원본이다. 리뷰 보드에는 편집 가능한 복제본을 배치했으며 컴포넌트 인스턴스는 메인 컴포넌트를 참조한다. 원본과 리뷰 복제본을 함께 갱신한다. 원본 화면의 실제 node를 아래 코드 표에 연결한다.

## 현재 확인 범위

원격 생성·구조 읽기로 실제 SCR/CMP node와 primitive 31개·semantic alias 31개, Noto Sans KR 텍스트 스타일 8개, Ionicons SVG 컴포넌트 14개를 확인했다. NAVER 보류 반영 후 기본 이동 18개, 복제본을 포함한 reaction node 36개를 읽기 확인했다. 변경한 원본·리뷰 4쌍과 가져오기 전체 구성의 문구가 일치한다. 프로토타입 재생 검증은 별도이며 로그인·검색·저장은 디자인에서 실제로 실행되지 않는다. 최신 시각 검증과 캡처 범위는 manifest에 기록한다.

현재 연결 계정의 draft 파일이며 팀원 초대·공유 권한 변경·팀 라이브러리 게시·Code Connect 게시는 하지 않았다. 기본 화면은 390×844 기준이다. 320px·큰 글자·safe area·키보드·스크린 리더·실기기 동작은 별도 검증한다. Figma의 설정 전·가상 결과 상태를 실제 Google/NAVER 계정 OAuth·검색 성공으로 주장하지 않는다. 실제 발급·응답 여부는 API 검증 기록에서 별도로 확인한다.

## 디자인 ID ↔ 코드

| ID | 이름 | Figma node | 코드 위치 |
| --- | --- | --- | --- |
| SCR-001 | Library | [4:262](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-262) | `src/web/pages/LibraryPage.tsx` |
| SCR-002 | AddLink | [4:343](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-343) | `src/web/pages/AddPage.tsx` |
| SCR-003 | ContentDetail | [4:416](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-416) | `src/web/pages/DetailPage.tsx` |
| SCR-004 | 콘텐츠 가져오기 | [4:480](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-480) | `src/web/pages/IntegrationsPage.tsx` |
| SCR-005 | NAVER 보류 안내 | [4:533](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-533) | `src/web/pages/PlacesPage.tsx` |
| CMP-001 | ContentCard | [2:864](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=2-864) | `src/web/components/Ui.tsx · ContentCard` |
| CMP-002 | FilterChip | [2:664](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=2-664) | `src/web/pages/LibraryPage.tsx · DOM filter buttons` |
| CMP-003 | PrimaryButton | [2:659](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=2-659) | `src/web/components/Ui.tsx · Button` |
| CMP-004 | SourceBadge | [2:691](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=2-691) | `src/web/components/Ui.tsx · SourceBadge` |
| CMP-005 | EmptyState | [2:888](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=2-888) | `src/web/components/Ui.tsx · EmptyState` |
| CMP-006 | CategoryStamp | [2:820](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=2-820) | `src/web/components/Ui.tsx · CategoryStamp` |
| CMP-007 | InstagramEmbed | [2:928](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=2-928) | `src/web/components/InstagramEmbed.tsx` |

원격 node ID는 새 파일에서 확인한 값이다. 같은 SCR/CMP 제품 ID를 유지하되 이전 파일의 node와 혼용하지 않는다. 코드 이동·원본 교체 시 이 표와 manifest·component-map을 함께 갱신한다. 로컬 매핑은 게시된 Code Connect가 아니다.

## 첫 기능의 상태별 UX

| 화면 | 준비할 상태와 동작 |
| --- | --- |
| Library | 전체 저장/방문 완료 탭·개수, 출처 메뉴 접힘/펼침, 분류·검색 조건, 첫 빈 저장함, 방문 항목 없음, 검색 결과 없음, 불러오는 중·실패·재시도 |
| AddLink | 추가/수정, 선택 장소·메모 접힘/펼침·입력 유지, 필수 입력 오류·초점 이동, 중복·기존 항목 열기, 고정 저장 액션의 저장 중·실패·완료 |
| ContentDetail | 항목 있음, 상단 수정 액션, 방문 전·완료, 원본·방문 처리 고정 액션과 오류, 없는 항목 |

저장 실패 시 입력을 유지한다. 중복은 기존 항목을 열 수 있게 한다. 필터 결과가 없을 때는 필터 해제를 제안한다. 장소·기간이 없는 링크도 저장하고, 미확인 정보를 확정된 사실처럼 표시하지 않는다. 현재 API 연결은 로컬 웹 개발 미리보기 범위다. 계정 설정 상태와 실제 로그인 완료를 구분한다. 인스타·네이버 개인 저장 목록 전체 동기화와 위치·기간 알림을 사용 가능한 기능처럼 표시하지 않는다.

## API 연결 디자인 추가분

아래는 앱 코드의 UX 계약이다. 현재 Figma 초안에 모든 상태가 반영되었다는 뜻은 아니며 보드와 manifest에서 실제 생성 범위를 확인한다.

SCR-004는 서비스 설정 전·연결됨·실패·재시도, 공개/계정 재생목록 선택, 페이지 추가, 후보 전체/개별 선택, 이미 저장된 링크 제외, 일괄 저장 실패·성공, 연결 해제 확인을 제공한다. 계정 연결로 가져온 모든 로컬 항목·메모를 먼저 삭제하고 Google 토큰 revoke를 요청한다. 원격 해제 실패는 실제 연결 상태를 유지하며 재시도한다. 파일 후보는 사용자 확인 후 저장하며 실제 내보내기 파일 규격 검증 완료를 뜻하지 않는다.

SCR-002에는 사용자가 누를 때만 클립보드를 읽는 붙여넣기와 YouTube 제목 요청을 추가했다. API 제목과 사용자가 적은 제목을 구분하며 URL/제목 수정 중 오래된 요청 응답으로 덮어쓰지 않는다. SCR-003은 요청 시 공개 Instagram 원문을 화면에서만 표시하고 장소가 있으면 네이버 지도 열기를 제공한다. CMP-007의 HTML은 저장하거나 제목·장소 추출에 사용하지 않는다.

현재 SCR-005는 NAVER 보류 안내와 콘텐츠 가져오기 이동만 제공하며 API를 요청하지 않는다. 기존 검색은 `src/features/integrations/NaverPlacesScreen.tsx`에 보관했고 활성 route에서 사용하지 않는다. 향후 검색을 다시 제공하면 분류/영구 저장 없이 주소·원문·지도 확인, 새 검색·화면 이탈·최대 24시간 결과 정리 계약을 재검토한다. 기존 저장 데이터와 직접 공유한 지도 링크는 유지하며 근처 거리나 행사 기간을 추정하지 않는다.

SCR-004–005와 CMP-007은 새 파일에 실제 node를 만들었다. 설정 전·후보 선택·결과 예시는 디자인 상태이며 실제 계정 응답을 뜻하지 않는다. 앱의 모든 실패·해제·로딩 상태가 Figma에 추가되었다고 가정하지 말고 이번 변경 범위의 상태를 원본·리뷰 보드와 함께 관리한다. [작업 상태](figma-sync.md)와 manifest의 검증 범위를 따른다.

2026-10-03 첫 부분 반영은 NAVER 임시 검색 결과 계약이었다. 이후 사용자 요청에 따라 NAVER 카드를 숨기고 SCR-005를 보류 안내로 바꿨다. 결과 예시는 보류로 표시하며 활성 프로토타입 진입을 제거했다. 기존 native 컴포넌트·토큰·Auto Layout을 유지하고 Screens·States·FullScroll·Handoff 캡처를 시각 확인했다. 전체 구성은 440×1362다. 이전 기준 자료는 history, 두 변경 이력은 현재 manifest의 `manualPatches`에서 확인한다.

## 리뷰에서 검증까지

1. **리뷰 준비 `ready` · 디자이너:** 정상·빈 화면·오류·로딩 프레임, 카피, 상호작용, 접근성 설명을 현재 Handoff 보드에 묶고 이슈와 연결한다.
2. **승인 `approved` · 제품 담당 + 디자이너 + 개발자:** 기능 범위와 구현 가능성을 확인하고 프레임 버전·node URL·승인자를 기록한다. 팀에 Dev Mode가 있으면 확정 프레임을 Ready for dev로 표시한다.
3. **구현 `inprogress` · 개발자:** 하나의 사용자 흐름을 PR로 만들고 SCR/CMP ID, 확정 디자인 링크, 실제 화면을 첨부한다. 확정 이후 변경은 이슈와 변경 기록에 남긴다.
4. **검증 `verified` · 디자이너 + 개발자:** 디자인 비교, 저장·재실행·실패 흐름, 접근성을 확인한다. 불일치는 캡처와 ID로 남기고 해결 후 병합한다.

이 네 단계는 팀 작업 상태다. Figma의 기본 상태와 동일하다고 가정하지 않는다. [Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode)는 플랜·좌석에 따라 사용 범위가 다르므로 없으면 Handoff 표와 PR로 같은 흐름을 운영한다.

## 토큰 변경

토큰 원본 `design/tokens.json`과 생성 코드 `src/theme/tokens.ts`를 함께 관리한다. Figma Foundations의 변수 이름은 코드 토큰 이름과 대응시킨다. 디자이너의 토큰 변경은 값·이유·영향받는 CMP/SCR ID·이전/이후 캡처를 포함한 PR로 반영한다. `npm run tokens:check`가 원본과 생성물의 일치를 확인한다. 디자이너와 개발자가 검토하고, 병합 후 Figma 변수와 Handoff 변경 기록을 갱신한다. 색상을 화면 코드에 임의로 추가하지 않는다.

## 접근성 완료 기준

- 터치 영역은 공통 기준 48×48 이상을 목표로 한다. Apple은 44×44pt, Android는 48×48dp를 권장한다. [Apple](https://developer.apple.com/design/tips/), [Android](https://developer.android.com/guide/topics/ui/accessibility/views/apps-views)
- 일반 텍스트 대비는 4.5:1 이상을 팀 기준으로 삼고, 상태를 색상만으로 구분하지 않는다.
- 화면 읽기 도구에 버튼 이름·선택·비활성 상태를 제공한다. 오류는 원인과 다음 행동을 함께 읽을 수 있게 한다.
- 글자 크기 확대 시 본문·입력·핵심 버튼이 잘리지 않는다. 카드 제목과 주소는 긴 한국어도 확인한다.
- iOS VoiceOver와 Android TalkBack, 실제 키보드·뒤로 가기·safe area 검증을 기록한다. 웹 검증만 통과한 상태는 네이티브 검증 완료로 처리하지 않는다.
