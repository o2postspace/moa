# Figma 작업 파일과 동기화 상태

2026-10-03, 연결된 `23010843의 팀` 계정에서 **새 편집 가능한 Design 파일**을 만들었다. 현재 작업 파일은 [모아 · 저장 콘텐츠 & 서비스 연동](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ)이며 file key는 `ejriXVtLOBDSwZ336vDKlZ`다. `모아 · 화면 & 디자인 시스템` 페이지(`0:1`)에 네이티브 텍스트, Auto Layout, 컴포넌트 인스턴스, 변수와 스타일을 구성했다.

앱 소스 `59205e5`를 기준으로 MMM 참고 UI와 서비스 연결 흐름을 정리한 **디자인 초안**이다. 실제 앱과 픽셀 단위로 일치하는 자동 동기화 결과가 아니며 Figma의 결과 예시는 실제 계정 요청 결과를 뜻하지 않는다. Google/NAVER 키와 실제 OAuth·지역 검색 검증은 여전히 남아 있다.

## 현재 파일의 실제 구성

| 대상 | 실제 node / 상태 |
| --- | --- |
| 핵심 5화면 리뷰 보드 | [4:256](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-256) |
| 빈 저장함·필수 입력 오류·가져오기 후보·장소 결과 예시 | [4:577](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-577) |
| 공통 컴포넌트 상태 보드 | [2:929](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=2-929) |
| 서비스 연결 전체 스크롤 구성 | [4:797](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-797) |
| 디자인·개발 Handoff | [4:902](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-902) |
| SCR-001~005 / CMP-001~007 | 실제 원격 node 생성. [매핑](design-handoff.md#디자인-id--코드)과 [manifest](../design/figma-manifest.json) 참고 |
| 변수·글자·아이콘 | primitive 31개 + semantic alias 31개, Noto Sans KR 텍스트 스타일 8개, Ionicons SVG 컴포넌트 14개 |
| 프로토타입 | 화면 이동 reaction 22개 등록·읽기 확인. 재생 검증은 별도 |

원본 화면은 페이지의 최상위 프레임으로 두었고 리뷰 보드 안에는 편집 가능한 복제본을 배치했다. 컴포넌트 인스턴스는 공통 메인 컴포넌트를 참조한다. **화면 내부를 수정할 때는 원본과 리뷰 복제본을 함께 관리**한다. 리뷰 보드만 수정하면 프로토타입 원본과 차이가 생긴다.

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
