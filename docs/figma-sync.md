# Figma 작업 파일과 동기화 상태

2026-10-03, 연결된 `23010843의 팀` 계정에서 **새 편집 가능한 Design 파일**을 만들었다. 현재 작업 파일은 [모아 · 저장 콘텐츠 & 서비스 연동](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ)이며 file key는 `ejriXVtLOBDSwZ336vDKlZ`다. `모아 · 화면 & 디자인 시스템` 페이지(`0:1`)에 네이티브 텍스트, Auto Layout, 컴포넌트 인스턴스, 변수와 스타일을 구성했다.

앱 소스 `59205e5`를 전체 구성의 기준으로 만든 **디자인 초안**이다. 이후 두 차례 부분 갱신했고 현재는 **NAVER 제외 MVP**다. 저장함·추가·상세·콘텐츠 가져오기 4화면을 사용하며 SCR-005는 NAVER 보류 안내다. 공개 YouTube 재생목록 준비됨·OAuth 미설정 상태를 표시하고 NAVER 카드와 미설정 계정 버튼은 숨겼다. 기준 소스 해시는 전체 최신 동기화를 뜻하지 않는다. 실제 앱과 픽셀 단위로 일치하는 자동 동기화 결과가 아니며 디자인 예시는 실제 계정 응답을 뜻하지 않는다.

## 현재 파일의 실제 구성

| 대상 | 실제 node / 상태 |
| --- | --- |
| 현재 4화면 + NAVER 보류 안내 리뷰 | [4:256](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-256) |
| 빈 저장함·입력 오류·후보 선택·보류된 향후 장소 예시 | [4:577](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-577) |
| 공통 컴포넌트 상태 보드 | [2:929](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=2-929) |
| 서비스 연결 전체 스크롤 구성 | [4:797](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-797) |
| 디자인·개발 Handoff | [4:902](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-902) |
| SCR-001–005 / CMP-001–007 | 실제 원격 node 생성. [매핑](design-handoff.md#디자인-id--코드)과 [manifest](../design/figma-manifest.json) 참고 |
| 변수·글자·아이콘 | primitive 31개 + semantic alias 31개, Noto Sans KR 텍스트 스타일 8개, Ionicons SVG 컴포넌트 14개 |
| 프로토타입 | 현재 기본 이동 18개, 복제본 포함 reaction node 36개 읽기 확인. 재생 검증은 별도 |

원본 화면은 페이지의 최상위 프레임으로 두었고 리뷰 보드 안에는 편집 가능한 복제본을 배치했다. 컴포넌트 인스턴스는 공통 메인 컴포넌트를 참조한다. **화면 내부를 수정할 때는 원본과 리뷰 복제본을 함께 관리**한다. 리뷰 보드만 수정하면 프로토타입 원본과 차이가 생긴다.

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

이 파일은 연결 계정의 draft 작업 파일이다. 팀원 초대·공유 권한 변경·팀 라이브러리 게시·Code Connect 게시는 수행하지 않았다. `design/component-map.json`은 로컬 코드 매핑이며 게시된 Code Connect가 아니다. Figma WEB code syntax는 토큰 대응을 돕는 표기이고 실제 CSS 변수 구현을 보장하지 않는다.

## 이전 파일 기록

[이전 모아 파일](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt)은 현재 연결 계정에서 편집 권한 부족으로 조회가 거부됐다. 그 이전 UI 갱신 시의 호출 한도 오류와 구분한다. 사용자가 새 계정에서 새로 만들도록 요청하여 현재 파일을 만들었으며 기존 파일의 소유권 이전·변경·삭제는 하지 않았다.

이전 node·검증 기록은 `design/history/figma-manifest-2026-10-01.json`에 보존한다. `design/figma-preview.png`와 `design/moa-ui-refresh.svg`는 이전 전달 자료이고 새 5화면 작업 파일의 완료 증거로 사용하지 않는다.
