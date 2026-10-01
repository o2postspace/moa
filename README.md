# 모아 · 저장 콘텐츠 비서

인스타그램·유튜브·네이버 등에서 모아 둔 콘텐츠를 정리하고, 이후 장소와 시기에 맞춰 다시 발견하도록 확장하는 모바일 앱입니다. 이름은 임시 작업명입니다.

## 이번 단계에서 동작하는 기능

- HTTPS 링크 추가, 출처 판별, 제목·분류·장소 이름·메모 저장
- 전체 저장·방문 완료 탭, 제목·장소·메모 검색, 분류 필터와 펼쳐지는 출처 메뉴
- 따뜻한 회색 카드·분류 종이 아이콘, 장소·메모 선택 입력 접기·펼치기
- 콘텐츠 상세, 원본 열기, 내용 수정, 방문 완료 표시·취소
- 추가·상세의 고정 하단 액션, 필수 입력 오류 시 해당 입력으로 초점 이동
- 기기 내 영구 저장과 중복 링크 안내. 읽기 오류가 생기면 기존 데이터를 덮어쓰지 않고 재시도

처음 실행할 때 저장함은 비어 있습니다. 사용자가 직접 추가한 링크만 표시합니다. 네이버·인스타·유튜브 저장함 자동 가져오기, 영상 분석, 장소 좌표 매칭, 지도, 위치·기간 알림, 계정 로그인·클라우드 동기화는 다음 단계입니다. 이 단계의 데이터는 이 기기에만 보관되며 앱 삭제·브라우저 저장소 초기화로 사라질 수 있습니다.

## 실행

Node.js 24와 npm을 사용합니다. `package-lock.json`을 함께 커밋합니다.

```sh
npm ci
npm start          # Expo 개발 서버
npm run web       # 브라우저에서 같은 화면 검토
npm run android   # Android 개발 환경이 있을 때
```

iOS 로컬 네이티브 빌드는 macOS/Xcode가 필요합니다. 공유하기 확장·네이버 네이티브 지도·백그라운드 알림을 붙일 때에는 Expo development build와 실제 iOS/Android 기기 검증을 추가합니다. 현재는 스토어 설치 파일을 만들거나 배포하지 않았습니다. 개발 서버가 필요하지 않을 때는 Ctrl+C로 종료합니다.

## 팀 협업

- 저장소: [o2postspace/moa](https://github.com/o2postspace/moa)
- **개발자·Codex 시작점:** [AGENTS.md](AGENTS.md) → [Codex 인수인계](docs/codex-handoff.md). 새 개발자는 이 순서로 읽고 기능별 브랜치에서 작업합니다.
- [디자인 인수인계](docs/design-handoff.md): 피그마 파일, 화면/컴포넌트 ID, 작업 상태, 디자인 리뷰 규칙
- [UI 리디자인 전달](docs/ui-refresh.md)과 [3화면 SVG 초안](design/moa-ui-refresh.svg): 현재 앱 UI와 Figma 갱신 계획
- [단계별 로드맵](docs/roadmap.md): 기존 저장 데이터 가져오기 검증부터 개인화까지
- [GitHub 협업 절차](docs/github-setup.md): 복제·브랜치·PR·팀 연결과 현재 원격 상태
- [디자인 토큰](design/tokens.json): 피그마와 앱이 공유할 색상·간격·폰트 기준
- [컴포넌트 매핑](design/component-map.json): 피그마 ID와 코드 경로
- `.github/`에 기능 이슈·PR 템플릿과 CI를 준비했습니다. 원격 GitHub에 업로드하면 검사 작업이 실행됩니다.

피그마 디자인이 변경되면 `design/tokens.json`과 영향받는 SCR/CMP ID를 포함해 PR을 만들고, `npm run tokens:generate`로 앱 토큰을 갱신합니다. `tokens:check`는 파일 일치만 확인합니다. 피그마와의 양방향 자동 동기화는 별도 구축이 필요합니다.

현재 코드는 흰 배경·회색 카드·둥근 컨트롤을 사용한 두 번째 UI이며 모아의 주황색 `#C94C2B`를 유지했습니다. 실제 Figma 파일은 도구 호출 한도로 갱신하지 못해 이전 디자인입니다. SVG는 새 화면을 전달하기 위한 텍스트·벡터 초안이며, 가져오기만으로 자동 동기화·클릭 프로토타입·Code Connect가 생기지 않습니다. 기존 Figma 화면 캡처를 현재 코드의 검증 이미지로 사용하지 않습니다.

## 개발 구조

```text
src/app/                Expo Router 화면
src/components/         공통 UI
src/domain/             링크·콘텐츠 규칙 (플랫폼에 독립)
src/features/library/   로컬 저장소와 상태
src/theme/              생성한 디자인 토큰
design/                 토큰·디자인/코드 ID·피그마 manifest
docs/                   로드맵·협업 규칙
tests/                  콘텐츠 규칙 검증
```

현재 모델은 콘텐츠 1개에 장소 이름 문자열을 저장합니다. 외부 가져오기와 장소·행사 데이터는 다음 단계에서 별도 모델로 연결하고, 한 콘텐츠에 여러 장소·한 장소에 여러 콘텐츠를 연결하는 관계로 확장할 계획입니다. 동일 장소 합치기와 동일 URL 중복 차단은 다른 기능입니다.

## 검사

```sh
npm run typecheck
npm run lint
npm test
npm run tokens:check
npm run build:web
```

웹 빌드 통과는 네이티브 기기 검증을 대체하지 않습니다. 실제 수행한 검사와 남은 확인은 [검증 기록](docs/verification.md)에 기록했습니다. 저장 링크는 외부 앱·웹을 열 때만 사용하고 이 단계에서 서버로 전송하지 않습니다.
