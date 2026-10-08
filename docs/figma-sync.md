# Figma 작업 파일과 동기화 상태

2026-10-03, 연결된 `23010843의 팀` 계정에서 **새 편집 가능한 Design 파일**을 만들었다. 현재 작업 파일은 [모아 · 저장 콘텐츠 & 서비스 연동](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ)이며 file key는 `ejriXVtLOBDSwZ336vDKlZ`다. `모아 · 화면 & 디자인 시스템` 페이지(`0:1`)에 네이티브 텍스트, Auto Layout, 컴포넌트 인스턴스, 변수와 스타일을 구성했다.

현재 기본 앱은 **React DOM · Vite · React Router 웹앱**이며 활성 코드는 `src/web/`에 있다. 같은 Figma 파일에 1440px 웹 저장함 초안과 웹 Handoff를 추가했다. 앱 소스 `59205e5`를 기준으로 만든 기존 390px 모바일 디자인은 참조 이력으로 보존했다. NAVER 제외 MVP는 유지하며 공개 YouTube·Instagram 링크·파일 정리부터 사용한다. SCR-005는 API 없는 보류 안내다. 기준 해시는 모바일 baseline이며 현재 웹 파일은 이 부분 갱신 시점에 미커밋 작업 트리였다. 픽셀 단위로 일치하는 자동 동기화 결과가 아니며 디자인 예시는 실제 계정 응답을 뜻하지 않는다.

## 핀맵 이름과 AnyJev 협업 메모 · 2026-10-08

사용자 요청으로 페이지 이름을 `핀맵 · 화면 & 디자인 시스템`으로 바꾸고 저장함의 브랜드·제목을 갱신했다. 웹 스탬프는 `PINMAP COLLECTION` / `핀`을 표시한다. 파일 자체의 기존 제목은 유지하며 과거 모바일·토큰·스타일의 내부 Moa 식별자를 일괄 교체하지 않았다. 원격 node ID와 기존 저장 데이터 계약은 유지한다.

[웹 Handoff 28:877](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=28-877)은 1440×372이며 [AnyJev 코드 계약](instagram-analysis.md)을 기록했다. 사용자 캡션·이미 추출한 글자·자막을 2,400자 근거로 정리하고 두 선택형 판단에 전달하는 범위다. 실제 모델 서버는 없으며 영상·OCR·STT 자동 추출과 실토큰 절감은 검증하지 않았다. **CMP-008 분석 패널의 새 Figma 화면·컴포넌트는 아직 없다.** 코드와 디자인의 미반영 범위를 manifest에 명시했다.

[핀맵 저장함 캡처](../design/pinmap-figma-library-2026-10-08.png)와 [핀맵 Handoff 캡처](../design/pinmap-figma-handoff-2026-10-08.png)를 확인했다. 변경 전 [manifest](../design/history/figma-manifest-2026-10-08-before-pinmap.json)를 보존하고 `manualPatches.pinmap-brand-and-anyjev-handoff-2026-10-08`에 부분 변경을 기록한다.

## 현재 파일의 실제 구성

| 대상 | 실제 node / 상태 |
| --- | --- |
| 웹 저장함 · 1440×1100 편집 초안 | [25:774](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=25-774) · 사이드바 / 검색·필터 / 3열 가상 카드 |
| 웹 개발 Handoff · 1440×372 | [28:877](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=28-877) · 현재 웹 파일·협업 범위 |
| 기존 390px 모바일 4화면 + NAVER 보류 참조 | [4:256](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-256) · 원본/리뷰 보존 |
| 빈 저장함·입력 오류·후보 선택·보류된 향후 장소 예시 | [4:577](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-577) |
| 공통 컴포넌트 상태 보드 | [2:929](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=2-929) |
| 서비스 연결 전체 스크롤 구성 | [4:797](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-797) |
| 기존 디자인·개발 Handoff | [4:902](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-902) · 현재 웹 매핑으로 텍스트 갱신 |
| 웹 카드·스탬프 / 기존 CMP-001–007 | 별도 웹 main `26:902`/`26:897` 추가, 기존 7종 보존·버튼/필터/출처 재사용. [매핑](design-handoff.md#디자인-id--코드)과 [manifest](../design/figma-manifest.json) 참고 |
| 변수·글자·아이콘 | primitive 31개 + semantic alias 31개, Noto Sans KR 텍스트 스타일 8개, Ionicons SVG 컴포넌트 14개 |
| 프로토타입 | 현재 기본 이동 18개, 복제본 포함 reaction node 36개 읽기 확인. 재생 검증은 별도 |

원본 화면은 페이지의 최상위 프레임으로 두었고 리뷰 보드 안에는 편집 가능한 복제본을 배치했다. 컴포넌트 인스턴스는 공통 메인 컴포넌트를 참조한다. **화면 내부를 수정할 때는 원본과 리뷰 복제본을 함께 관리**한다. 리뷰 보드만 수정하면 프로토타입 원본과 차이가 생긴다.

## 웹 저장함과 Handoff 부분 반영 · 2026-10-03

`WEB-001 Desktop Library · UI 예시`(`25:774`)를 기존 캔버스 오른쪽에 별도로 추가했다. 1440×1100, 사이드바 244px·본문 1196px, 3열 세로 카드 구성이다. 제목·검색·출처·분류·전체/방문 탭·가져오기 배너·카드를 편집 가능한 텍스트·Auto Layout·컴포넌트·벡터로 만들었다. 제목·메모 3개는 모두 가상 예시이며 사용자 저장 5개나 실제 제공자 데이터를 복사하지 않았다.

기존 모바일 ContentCard는 가로형이므로 별도 웹 main `WEB-CMP-001 ContentCard`(`26:902`)와 텍스트 스탬프 `WEB-CMP-006 CategoryStamp · Other`(`26:897`)를 추가했다. 카드의 Title/Note 텍스트와 SourceBadge instance swap을 노출했다. 기존 Primary/Secondary 버튼·필터·SourceBadge와 62개 변수·8개 텍스트 스타일을 재사용했다. 원래 CMP 7종·Ionicons 14개는 변경하지 않았고 현재 코드의 lucide-react 1.50.0 SVG에서 웹 grid/filter 아이콘 2개(`29:880`/`29:885`)만 추가했다. 새 메인 컴포넌트는 저장함 프레임 밖에 배치했다.

첫 웹 캡처는 `use_figma` 탐색과 `generate_figma_design` 준비를 병렬로 진행했다. 사용자 `localhost` 저장소와 분리한 `127.0.0.1:8082` 빈 저장함을 임시 참조 `27:877`로 캡처했다. 전체 캡처 이미지를 결과에 넣지 않고 레이아웃 기준으로만 비교했으며, 비교 후 정확한 capture root를 삭제했다. 별도 검토 서버·캡처 스크립트·브라우저 탭도 제거했다.

Brief `4:252–255`, 기존 Handoff `4:904–906`과 별도 웹 Handoff `28:877`에 현재 구현을 기록했다. 활성 화면은 `src/web/pages/`의 `LibraryPage`, `AddPage`, `DetailPage`, `IntegrationsPage`, `PlacesPage`다. CMP-001/003/004/005/006은 `src/web/components/Ui.tsx`, CMP-002는 LibraryPage/AddPage 내부 DOM 버튼으로 독립 컴포넌트가 없으며, CMP-007은 `src/web/components/InstagramEmbed.tsx`다. 로컬 코드 대응은 [component-map](../design/component-map.json), 실제 원격 node는 [manifest](../design/figma-manifest.json)를 따른다.

웹 저장함은 자손 186개(TEXT 57 · INSTANCE 30 · FRAME 56 · VECTOR 36 · RECTANGLE 7), Noto Sans KR만 사용, IMAGE fill 0·프레임 폭 초과 0을 읽기 확인했다. 원래 원본/리뷰 10개 프레임이 390×844로 유지되는 것도 확인했다. 실제 웹 참조와 비교해 사이드바 간격·활성 탭·버튼·필터를 보정하고 최종 저장함·두 Handoff를 캡처하여 시각 검토했다. [웹 저장함 캡처](../design/figma-web-desktop.png), [웹 Handoff](../design/figma-web-handoff.png), [기존 Handoff 갱신](../design/figma-web-existing-handoff.png)이 증거다.

이 변경은 저장함 웹 초안 하나와 협업 매핑만 포함한다. 추가·상세·연동·보류 웹 화면 전체, 반응형 모바일·키보드·접근성·프로토타입 재생·실제 저장/API 동작은 이 Figma 검증 밖이다. SourceBadge·스탬프·여백 일부는 기존 디자인 자산을 재사용한 초안이므로 브라우저 CSS와 완전히 동일하지 않다. `sourceAppCommit: 59205e5`는 유지하며 `manualPatches.web-desktop-handoff-2026-10-03`에 웹 작업 트리 범위를 별도로 남겼다. [변경 전 manifest](../design/history/figma-manifest-2026-10-03-before-web.json)와 이전 모바일 baseline을 보존한다.

## 현재 NAVER 제외 MVP 부분 반영 · 2026-10-03

SCR-004 원본 `4:480`/리뷰 `4:1056`/전체 구성 `4:800`에서 NAVER 서비스 카드와 미설정 OAuth 버튼·준비 안내를 숨겼다. YouTube 링크·공개 재생목록, Instagram 공개 원문 링크, JSON/TXT 파일 선택을 표시한다. 전체 구성에 기존 native 입력/버튼의 복제본 `20:830`/`20:832`를 추가했고 빈 링크의 재생목록 버튼은 비활성 상태다. 홈 진입 부제와 brief/Handoff도 현재 범위에 맞췄다.

SCR-005 원본 `4:533`/리뷰 `4:1071`은 API 없는 보류 안내와 콘텐츠 가져오기 이동으로 바꿨다. 이전 결과 상태 `4:741`/`4:1132`는 향후 검토용으로 표시하고 검색 화면으로 향하는 이전 이동과 결과 상태의 이동을 제거했다. 기존 native 노드와 수동 지도 링크 예시는 보존했다.

변경한 원본·리뷰 4쌍 및 서비스 전체 구성의 텍스트 일치, 모바일 원본/리뷰 390×844, Noto Sans KR, IMAGE fill 0을 읽기 확인했다. Screens·States·FullScroll·Handoff를 캡처하고 오래된 캡션과 소개 줄바꿈을 보정한 뒤 해당 합성 화면을 시각 확인했다. 전체 구성 보드는 440×1362다. [변경 전 manifest](../design/history/figma-manifest-2026-10-03-before-naver-defer.json)와 `design/history/figma-before-naver-defer-*-2026-10-03.png` 4개를 보존했다. 현재 `manualPatches`의 `naver-deferred-mvp-2026-10-03`을 따른다. 프로토타입 재생·API 호출·파일 선택·저장은 Figma 검증 범위에 포함하지 않는다.

## 이전 NAVER 검색 UX 반영 이력 · 현재 보류

`src/app/places.tsx`, `src/app/integrations.tsx`의 변경 중 NAVER 결과 보관·동작과 상태 재확인만 반영했다. SCR-005 원본 `4:533`/리뷰 `4:1071`, 결과 예시 원본 `4:741`/리뷰 `4:1132`에서 분류·영구 저장을 제거하고 원문 보기·네이버 지도 확인과 화면 이탈/새 검색/최대 24시간 메모리 안내를 표시한다. SCR-004 원본 `4:480`/리뷰 `4:1056`/전체 구성 `4:800`에는 기존 Secondary 버튼을 이용한 ‘연결 상태 다시 확인’을 추가하고 NAVER 검색 CTA를 ‘장소 검색하고 확인’으로 바꿨다.

원본·리뷰의 텍스트 일치와 390×844 크기를 읽기 확인했다. Screens·States·FullScroll을 새로 캡처해 시각 확인했으며 전체 구성 보드 `4:797`은 현재 440×1650이다. 새 버튼은 디자인 요소로, Figma에서 API 요청·검색 결과 저장·가상 주소 링크 실행을 하지 않는다. 이전 전체 구성 manifest와 해당 캡처는 `design/history/figma-manifest-2026-10-03-baseline.json`과 `design/history/figma-baseline-*-2026-10-03.png`에 보존하고 최신 변경은 현재 manifest의 `manualPatches`에 기록한다.

## 협업 시 갱신 순서

1. 현재 file key와 `design/figma-manifest.json`의 실제 node를 확인한다. 예전 파일의 ID를 새 파일에 적용하지 않는다.
2. 토큰 원본 `design/tokens.json`과 Figma primitive·alias를 함께 비교한다. 앱 토큰 변경은 `npm run tokens:generate`와 `npm run tokens:check`를 따른다.
3. CMP 메인 컴포넌트의 variant·text·instance swap 속성을 갱신한 뒤 상태 보드에서 확인한다.
4. SCR 원본과 리뷰 복제본을 함께 갱신하고 정상·빈·오류·설정 전 상태를 분리한다. 사용자 예시·모의 결과·실제 API 결과를 구분한다.
5. 구조 읽기와 새 캡처로 수정 범위를 확인한다. 현재 검증 범위·미확인 항목·증거 파일은 manifest에 기록한다.
6. 변경 이유·SCR/CMP ID·node 링크·캡처를 기능별 PR에 남긴다. 파일 생성이나 reaction 등록만으로 앱 구현·접근성·프로토타입 재생 검증을 완료 처리하지 않는다.

이 파일은 연결 계정의 draft 작업 파일이다. 팀원 초대·공유 권한 변경·팀 라이브러리 게시·Code Connect 게시는 수행하지 않았다. `design/component-map.json`은 로컬 코드 매핑이며 게시된 Code Connect가 아니다. 현재 웹 `main.tsx`는 생성된 `src/theme/tokens.ts`를 읽어 `--color-accent` 같은 CSS 변수를 설정한다. 기존 Figma WEB `var(--moa-...)` syntax는 역사적 대응 표기이며 현재 CSS 변수명을 그대로 보장하지 않는다.

## 이전 파일 기록

[이전 모아 파일](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt)은 현재 연결 계정에서 편집 권한 부족으로 조회가 거부됐다. 그 이전 UI 갱신 시의 호출 한도 오류와 구분한다. 사용자가 새 계정에서 새로 만들도록 요청하여 현재 파일을 만들었으며 기존 파일의 소유권 이전·변경·삭제는 하지 않았다.

이전 node·검증 기록은 `design/history/figma-manifest-2026-10-01.json`에 보존한다. `design/figma-preview.png`와 `design/moa-ui-refresh.svg`는 이전 전달 자료이고 새 5화면 작업 파일의 완료 증거로 사용하지 않는다.
