# GitHub에서 함께 개발하기

저장소는 [o2postspace/moa](https://github.com/o2postspace/moa)이다. 2026-10-01 사용자가 생성한 공개 저장소임을 확인했고, 로컬 `origin`을 `https://github.com/o2postspace/moa.git`으로 연결했다. 앱 소스·인수인계 문서·PR·이슈 양식과 `quality` CI 작업을 이 저장소에서 관리한다. 최신 원격 커밋과 검사 결과는 GitHub에서 확인한다.

## 새 개발자와 Codex의 시작

아래 명령으로 시작한다. 작업 폴더는 각 개발자가 원하는 위치를 쓴다. Node.js 24와 npm이 필요하다.

```sh
git clone https://github.com/o2postspace/moa.git
cd moa
npm ci
npm run web
```

[`AGENTS.md`](../AGENTS.md)와 [`docs/codex-handoff.md`](codex-handoff.md)를 읽고 현재 구현 범위를 확인한다. 프로젝트 실행 자체에는 GitHub 쓰기 권한이 필요하지 않으며, PR 브랜치를 원격에 올리려면 해당 계정의 쓰기 권한 또는 개인 fork가 필요하다. 계정별 개인 정보나 비밀값을 문서에 넣지 않는다.

## 기능별 브랜치와 PR

팀 저장소에 쓰기 권한이 있는 개발자의 예시다. 브랜치 이름은 실제 작업에 맞춰 바꾼다. 다른 사람의 로컬 변경이 있을 때 먼저 보존하고 깨끗한 checkout이나 별도 worktree에서 시작한다.

```sh
git switch main
git pull --ff-only origin main
git switch -c feat/content-delete-undo

# 요청된 기능을 구현하고 변경에 맞는 검사를 수행한다.
npm run typecheck
npm run lint
npm test
npm run tokens:check
npm run build:web

git status --short
git add <changed-files>
git commit -m "feat: add content deletion with undo"
git push -u origin feat/content-delete-undo
```

`<changed-files>`는 실제 변경 파일 경로로 바꾼다. GitHub에서 `main`을 대상으로 PR을 만들고 `.github/pull_request_template.md`를 채운다. 예시 브랜치를 만든 것만으로 삭제 기능이 구현된 것은 아니다. 최초 업로드 이후에는 기능 변경을 PR 단위로 검토한다. 다른 개발자의 브랜치에 임의로 푸시하거나 원격 이력을 강제로 바꾸지 않는다.

## 검증과 디자인 연결

- GitHub Actions `CI / quality`는 `npm ci`, typecheck, lint, domain 테스트, 토큰 일치, 웹 내보내기를 검사한다. 실제 실행 결과는 [Actions](https://github.com/o2postspace/moa/actions)에서 확인한다.
- 기능 이슈에는 사용자 문제·기대 행동·완료 조건·SCR/CMP ID·Figma node URL을 넣는다. 한 PR은 리뷰 가능한 하나의 사용자 흐름을 중심으로 한다.
- 디자인 팀의 확정 프레임·변경 이유·토큰 영향과 구현 화면을 함께 리뷰한다. Figma 작업 상태는 [디자인 인수인계](design-handoff.md)에 정의되어 있다.
- 커밋·PR·CI 통과와 실제 iOS/Android 검증을 구분한다. 테스트하지 않은 환경을 완료로 기록하지 않는다.

## 계정과 팀 설정

개발자는 자신의 checkout에 실제 작성자 이름과 GitHub 커밋 이메일을 설정한다. GitHub가 제공하는 noreply 이메일도 사용할 수 있다. 웹 로그인과 Git HTTPS 인증·커밋 작성자는 별도 설정이다. 토큰을 원격 URL·소스·채팅에 넣지 않는다. 첫 업로드 checkout의 작성자는 공개 계정 정보를 확인한 `o2postspace`와 그 계정의 GitHub noreply 주소를 사용한다. 전역 Git 설정은 변경하지 않았다.

팀 구성원의 GitHub 계정이 아직 제공되지 않아 초대하지 않았다. 저장소 관리자는 실제 계정을 확인한 뒤 필요한 팀원을 연결하고 `main`의 PR 리뷰 및 `quality` 검사 규칙을 설정한다. 로컬 CI 파일을 작성하거나 업로드하는 것만으로 원격 보호 규칙과 팀 권한이 적용되지는 않는다. 제품·디자인·개발 담당자는 [인수인계](design-handoff.md)에 기록한다.

공식 안내: [로컬 코드 업로드](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github), [Git 인증](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git).
