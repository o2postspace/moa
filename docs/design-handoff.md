# 디자인 · 개발 협업

2026-10-01 기준. 앱 작업명은 **모아**. React Native + Expo + TypeScript로 작은 기능 단위씩 만든다. Figma 파일과 GitHub 저장소를 생성했다. 업로드·CI 확인 상태는 `docs/github-setup.md`에 기록한다.

- Figma 파일: [모아 · 앱 디자인 & 개발](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt)
- GitHub 저장소: [o2postspace/moa](https://github.com/o2postspace/moa). 기능별 브랜치·PR로 협업하며 [Codex 인수인계](codex-handoff.md)를 시작점으로 사용
- 제품 / 디자인 / 개발 담당자: 팀 지정 후 기록

## Figma 파일 구조

| 페이지 | 역할 | 현재 상태 |
| --- | --- | --- |
| `00 Brief` | 사용자 문제, 이번 버전 범위, 완료 기준, 미확정 사항 | 페이지 생성, 내용은 비어 있음 |
| `01 Flows` | 링크 추가 → 저장함 → 상세, 오류·취소·복구 흐름 | 페이지 생성, 내용은 비어 있음 |
| `02 Design & Handoff` | Foundations / Components / Screens / Handoff 섹션 | 토큰·컴포넌트·3개 화면 생성. Handoff 섹션은 비어 있음 |

현재 Figma Starter의 3페이지 제한에 맞춘 실제 구조다. 페이지를 추가할 수 있는 플랜으로 옮기면 네 섹션을 별도 페이지로 분리한다. 아래의 `05 Handoff`는 현재 세 번째 페이지 안의 `Handoff` 섹션을 뜻한다.

## 현재 Figma 검증 상태

[3개 화면 리뷰 보드](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt?node-id=4-26)는 시각 검증을 통과했다. 검증 캡처와 범위는 `design/figma-manifest.json`에 기록되어 있다. 이 검증은 첫 실행의 빈 저장함, 링크 추가, 예시 콘텐츠 상세를 포함한다.

[컴포넌트 상태 보드](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt?node-id=9-116)와 이후 ContentCard 가로 배치 수정은 생성 응답으로 구조를 확인했지만 최종 시각 재검증 전이다. Figma Starter의 도구 호출 한도로 다음 캡처가 막혔다. Foundations도 시각 캡처 검증 전이다. 앞서 검증한 3개 화면에는 ContentCard 인스턴스가 없어 이 수정으로 화면 내용은 바뀌지 않았다.

`00 Brief`, `01 Flows`, `Handoff` 내용과 클릭 이동 프로토타입 연결은 아직 작성하지 않았다. 기획·흐름·협업 기준은 현재 로컬 문서로 제공한다. 팀 리뷰 후 이 내용을 Figma에 옮기고 미검증 보드를 다시 확인해야 한다. 파일 생성이나 화면 검증을 전체 인수인계·프로토타입 완료로 처리하지 않는다.

프레임 이름은 `SCR-001 / Library / Empty / iOS`처럼 쓴다. 컴포넌트는 `CMP-001 / ContentCard`로 이름을 고정한다. 모바일 크기는 팀의 작업 기준이며 특정 기기의 지원 보장은 아니다: iOS 390×844, Android 360×800. 320 폭, 큰 글자, safe area, 키보드 표시 상태도 별도로 확인한다.

## 디자인 ID ↔ 코드

| ID | 이름 | Figma node | 코드 위치 |
| --- | --- | --- | --- |
| SCR-001 | Library | [4:32](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt?node-id=4-32) | `src/app/index.tsx` |
| SCR-002 | AddLink | [4:35](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt?node-id=4-35) | `src/app/add.tsx` |
| SCR-003 | ContentDetail | [4:38](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt?node-id=4-38) | `src/app/content/[id].tsx` |
| CMP-001 | ContentCard | [4:18](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt?node-id=4-18) | `src/components/ContentCard.tsx` |
| CMP-002 | FilterChip | [3:63](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt?node-id=3-63) | `src/components/FilterChip.tsx` |
| CMP-003 | PrimaryButton | [3:76](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt?node-id=3-76) | `src/components/PrimaryButton.tsx` |
| CMP-004 | SourceBadge | [3:58](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt?node-id=3-58) | `src/components/SourceBadge.tsx` |
| CMP-005 | EmptyState | [4:19](https://www.figma.com/design/sNrklbLn8Fd9HXMU3GLQUt?node-id=4-19) | `src/components/EmptyState.tsx` |

위 링크와 코드 매핑은 실제 `design/figma-manifest.json`을 기준으로 기록했다. ID는 유지하고 코드 이동 시 표와 manifest를 함께 갱신한다. 네이티브 Code Connect 게시 작업은 아직 수행하지 않았다.

## 첫 기능의 상태별 UX

| 화면 | 준비할 상태와 동작 |
| --- | --- |
| Library | 처음 불러오는 중, 저장 항목 있음, 저장함 비어 있음, 검색 결과 없음, 불러오기 실패·재시도 |
| AddLink | 입력 전, 입력 중, 잘못된 URL, 이미 저장한 링크, 저장 중, 저장 실패·재시도, 저장 완료 |
| ContentDetail | 항목 있음, 방문 전·완료, 상태 변경 실패, 원본 열기 실패, 없는 항목 |

저장 실패 시 입력을 유지한다. 중복은 기존 항목을 열 수 있게 한다. 필터 결과가 없을 때는 필터 해제를 제안한다. 장소·기간이 없는 링크도 저장하고, 미확인 정보를 확정된 사실처럼 표시하지 않는다. 현재는 로컬 저장 단계이므로 자동 추출·계정 연동·근처 알림을 사용 가능한 기능처럼 표시하지 않는다. 삭제·보관·일괄 정리는 다음 정리 기능 단계에서 추가한다.

## 리뷰에서 검증까지

1. **리뷰 준비 `ready` · 디자이너:** 정상·빈 화면·오류·로딩 프레임, 카피, 상호작용, 접근성 설명을 `05 Handoff`에 묶고 이슈와 연결한다.
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
