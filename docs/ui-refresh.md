# 모아 UI 리디자인 · 디자인/개발 전달

흰 배경, 짧고 진한 제목, 따뜻한 회색 카드, 둥근 필터와 원형 뒤로가기 버튼을 사용하고 모아의 주황색을 유지했다. 참고 화면은 [MMM / WWIT](https://wwit.design/2025/03/04/mmm/)다.

2026-10-03에 연결 계정에서 [모아 · 저장 콘텐츠 & 서비스 연동](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ)을 새로 만들었다. UI/UX 팀은 이 파일의 네이티브 텍스트·Auto Layout·컴포넌트·변수를 수정하며 작업한다. 소스 `59205e5` 초안은 baseline으로 보존하고 최신 부분 갱신은 현재 manifest를 따른다. 사용자 요청에 따라 현재 MVP에서 NAVER 서비스 카드·검색 진입을 제외하고 공개 YouTube 재생목록·Instagram 링크·파일 정리에 집중한다. 픽셀 단위 앱 동기화나 실제 API 연결 성공을 뜻하지 않는다.

## 전달 파일과 기준

| 파일 / 링크 | 역할 |
| --- | --- |
| [5화면 리뷰 보드](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-256) | 저장함·링크 추가·상세·서비스 연결·NAVER 보류 안내. 최신 실제 node는 manifest 참조 |
| [상태 보드](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-577) | 빈 저장함·필수 입력 오류·가져오기 후보와 보류 범위의 최신 상태. 이전 장소 결과 예시는 현재 검색 기능으로 표시하지 않음 |
| [컴포넌트 상태 보드](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=2-929) | CMP-001–007의 variant와 공통 상태 |
| [서비스 연결 전체 구성](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-797) | 모바일 첫 뷰포트 아래의 서비스·설명·파일 가져오기 |
| [Handoff 보드](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=4-902) | 토큰·코드 연결·미구현 범위와 협업 기준 |
| `design/tokens.json` / `src/theme/tokens.ts` | 토큰 원본 / 앱 생성 코드 |
| `design/figma-manifest.json` / `design/component-map.json` | 현재 실제 node·검증 기록 / SCR/CMP와 코드의 로컬 매핑 |
| `design/moa-ui-refresh.svg`, `design/ui-refresh-preview.png` | 이전 정적 3화면 벡터 초안과 로컬 렌더링 기록 |
| `design/figma-preview.png`, `design/history/figma-manifest-2026-10-01.json` | 이전 Figma 파일의 기록 |

## 화면과 동작

| 화면 | 현재 Figma 초안 | 앱의 실제 동작과 코드 |
| --- | --- | --- |
| SCR-001 저장함 | 예시 저장 항목·전체/방문 탭·검색/분류/출처, 별도 빈 상태 | `src/app/index.tsx`: 기기 저장함·필터·링크 추가·서비스 연결 진입. 첫 실행은 비어 있음 |
| SCR-002 링크 추가 | YouTube 링크·제목 예시·선택 정보·저장, 별도 필수 입력 오류 | `src/app/add.tsx`: 붙여넣기·YouTube 제목 요청·추가/수정·오류 초점·고정 저장 액션 |
| SCR-003 콘텐츠 상세 | 가상 콘텐츠·원본/방문 액션·요청 전 Instagram 원문 영역 | `src/app/content/[id].tsx`: 원본·확인된 장소·지도 열기·수정·방문. 공개 원문은 사용자 요청 시 표시 |
| SCR-004 서비스 연결 | 현재 범위는 YouTube·Instagram·파일 가져오기이며 NAVER 카드를 제외. 서비스 전체 스크롤과 별도 후보 확인 | `src/app/integrations.tsx`: 공개 재생목록·파일 후보·중복 제외·선택 저장. OAuth·해제 코드는 있으나 실제 계정 검증은 후속. 등록된 API key로 공개 목록 17개 조회·웹 후보 선택 확인 |
| SCR-005 NAVER 보류 안내 | 현재 범위는 검색 입력·결과 없는 보류 안내. 최신 원본·리뷰 갱신 여부는 manifest 참조 | `src/app/places.tsx`: API 요청 없는 안내·링크 저장으로 돌아가기. 이전 검색 구현은 `src/features/integrations/NaverPlacesScreen.tsx`에 보관하며 현재 route에서 사용하지 않음 |

저장 수와 탭 제목, 목록 제목과 결과 개수는 8px 간격으로 분리한다. 콘텐츠 카드의 `CategoryStamp`는 오른쪽에 두고 방문 상태는 초록색과 텍스트로 표현한다. 저장/원본 보기에는 주황색 버튼을, 선택 정보와 보조 행동에는 회색 표면을 사용한다. 저장 실패 시 입력을 유지하고 중복 항목을 열 수 있게 한다.

새 파일에는 공통 7종 외에 입력·서비스 설명·아이콘 컴포넌트도 있다. 페이지 최상위 SCR/STATE 프레임은 프로토타입 원본이고 리뷰 보드에는 네이티브 복제본을 둔다. 화면 수정 시 두 구성을 함께 관리한다. 연결 상태 재확인 버튼을 유지하며 NAVER 제외에 따른 서비스 구성·보류 안내·이동 연결의 최신 부분 갱신 여부는 [현재 manifest](../design/figma-manifest.json)를 따른다. node·reaction 수를 이전 캡처에서 가져와 고정하지 않는다. 디자인 흐름은 로그인·검색·저장을 실제로 실행하지 않으며 재생 검증은 별도 기록을 따른다.

NAVER API 검색·키 발급은 보류했으며 결제수단 등록을 요구하는 흐름을 현재 MVP에 넣지 않는다. 직접 공유한 지도 링크·기존 데이터는 보존한다. NAVER 개인 저장 목록 자동 조회, 근처 알림, 실제 축제 기간, 앱 내 지도 SDK·AI는 미구현이다. 예시 제목·주소·행사를 실제 API 응답이나 확인된 운영 정보로 표시하지 않는다. Instagram 개인 저장함 API와 YouTube Watch Later 가져오기도 제공하지 않는다.

## 현재 스타일

| 토큰 | 값 | 적용 |
| --- | --- | --- |
| `color.background`, `color.surface` | `#FFFFFF` | 화면, 고정 하단 영역 |
| `color.surfaceMuted` | `#F5F5F1` | 카드, 입력, 보조 버튼 |
| `color.ink` | `#20231F` | 제목, 본문 |
| `color.secondary` | `#62685F` | 설명, 보조 정보 |
| `color.accent` | `#C94C2B` | 주 행동, 아이콘, 선택 탭 밑줄 |
| `color.accentInk` | `#A83A20` | 연한 주황색 위 작은 글자 |
| `color.accentSoft` | `#FCEBE3` | 선택 칩, 상단 링크 추가 |
| `color.border` | `#E9EBE5` | 구분선, 종이 아이콘 테두리 |
| `color.green`, `color.greenSoft` | `#3A654C`, `#E9F1EA` | 방문 완료 상태 |
| `color.error` | `#A92D25` | 오류 |

Figma에는 primitive 31개와 semantic alias 31개를 만들었다. 폰트는 Noto Sans KR Regular 400 / Medium 500 / Bold 700이며 텍스트 스타일 8개를 사용한다. 앱 폰트는 `NotoSansKR_400Regular`, `NotoSansKR_500Medium`, `NotoSansKR_700Bold`다. 기본 본문 14/23, 설명 12/20, 소제목 16/26, 큰 제목 28/39, 상세 제목 25/36을 따른다.

앱의 화면 좌우 여백은 24px, 주요 입력/버튼 최소 높이는 56px, 칩/아이콘 터치 영역 목표는 48px다. 여백은 4/8/12/16/24/32/48px, 모서리는 12/20/28px와 pill이다. `CategoryStamp`는 겹친 종이와 분류별 선 아이콘으로 구성한다. 새 Figma의 14개 아이콘은 [Ionicons 원본 SVG](https://github.com/ionic-team/ionicons/tree/main/src/svg)를 네이티브 벡터 컴포넌트로 구성했다.

## UI/UX 팀의 다음 수정

1. 현재 Figma 파일과 [디자인 ID ↔ 코드](design-handoff.md#디자인-id--코드)를 확인한다. 이전 파일의 node ID는 새 파일에 적용하지 않는다.
2. 토큰 → 공통 메인 컴포넌트 → SCR 원본·리뷰 복제본 순서로 수정한다. 전체 화면을 평면 이미지로 대체하지 않는다.
3. 현재 NAVER 제외 범위에 맞춰 서비스 카드·홈 진입·보류 안내와 원본/리뷰 구성을 함께 수정한다. 공개 목록·파일의 정상·빈·오류·로딩·후보 선택 상태를 추가한다. 모든 앱 상태가 Figma에 구현되었다고 가정하지 않는다.
4. 390×844 기준을 실제 앱과 비교하고 320px·글자 확대·키보드·safe area·고정 액션은 별도 검증한다. 기본 프레임 크기는 기기 지원 검증이 아니다.
5. 원격 node·새 캡처·검증 범위·남은 항목을 manifest와 PR에 남긴다. Code Connect·팀 라이브러리 게시는 별도 작업이며 현재 수행하지 않았다.

## 검증 기록을 읽는 기준

이전 SVG의 XML·벡터·폰트 렌더링과 이전 앱의 390px/320px 검사는 [검증 기록](verification.md)에 보존한다. 새 Figma 작업의 최신 구조·시각 확인 범위는 [manifest](../design/figma-manifest.json)를 따른다. 이전 SVG·Figma 캡처를 새 파일 검증 증거로 사용하지 않는다. 픽셀 일치·네이티브 기기·접근성·실제 Google/NAVER 요청·프로토타입 재생은 각 검사에서 확인한 경우에만 완료로 기록한다.
