# 실제 계정으로 API 연결하기

현재 검증 환경은 Windows의 웹 미리보기 `http://localhost:8081`과 로컬 서버 `http://localhost:8787`이다. 새 비밀값을 채팅이나 GitHub에 붙여 넣지 않는다. 아래 설정을 `.env.local`에 입력한 다음 서버를 다시 실행한다. 설정값 존재와 실제 제공자 응답 성공은 서로 다른 상태다.

## 먼저 실행

```powershell
Copy-Item .env.example .env.local  # 기존 .env.local이 없을 때만
npm run api
# 별도 터미널
npm run web -- --port 8081
```

서버 설정을 바꾸면 `npm run api`를 종료하고 다시 시작한 뒤 앱의 **연결 상태 다시 확인**을 누른다. 앱 공개 주소를 바꿨다면 Expo도 다시 시작한다. `localhost`와 `127.0.0.1`을 섞으면 계정 cookie가 일치하지 않는다. 서버는 loopback으로만 열리므로 휴대폰에서 이 주소로 연결되는 운영 서비스가 아니다.

자격 증명 없이도 링크 추가 → YouTube 제목 불러오기와 Instagram 공개 원문 표시를 시험할 수 있다. 두 경로는 실제 공개 API 응답을 확인했다. 개인 저장함 로그인 없이 모든 저장 콘텐츠를 조회하는 기능은 아니다.

## YouTube 계정과 재생목록

1. [Google Cloud Console](https://console.cloud.google.com/)에서 사용할 프로젝트를 선택하거나 새 프로젝트를 만든다. YouTube Data API v3를 활성화한다.
2. OAuth 동의 화면에 앱 이름과 담당자 정보를 입력한다. 외부 앱 Testing 상태라면 실제 검증할 Google 계정을 테스트 사용자로 등록한다. 요청 권한은 `https://www.googleapis.com/auth/youtube.readonly`다.
3. OAuth 클라이언트 종류는 **Web application**으로 만든다. 승인된 redirect URI에 **`http://localhost:8787/api/youtube/callback`**을 정확하게 추가한다. 서버에서 authorization code를 교환하므로 native client ID를 대신 사용하지 않는다.
4. 발급된 클라이언트 ID와 secret을 `.env.local`의 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`에 입력한다. 공개 재생목록용 API key는 `YOUTUBE_API_KEY`에 입력하고 YouTube Data API v3로 API 사용 범위를 제한한다.
5. 서버 재시작 → 서비스 연결 → YouTube 계정 연결 → 사용자가 Google에서 직접 로그인·동의 → 내 재생목록 보기 → 가져올 재생목록 선택 → 후보 확인 → 저장한다.
6. 50개 이상 목록에서 ‘더 불러오기’, 중복 제외, 비공개/삭제 영상, 연결 해제와 재연결을 실제 계정으로 확인한다. 연결 해제는 이 기기의 **모든 계정 재생목록 가져오기 항목과 메모**를 먼저 삭제한 뒤 Google 토큰을 revoke한다. 로컬 쓰기 실패는 해제를 중단하고, 원격 revoke 실패는 연결을 유지해 재시도한다.

나중에 볼 동영상은 공식 API에서 조회할 수 없다. 좋아요 영상은 별도 API가 있지만 현재 화면에 포함하지 않았다. Testing의 refresh token/동의는 7일 제한이며 실제 공개 출시는 Google OAuth 검증·홈페이지·개인정보처리방침과 운영 인증 서버를 별도 준비해야 한다. 토큰은 현재 서버 메모리에만 있고 서버를 다시 시작하면 재연결이 필요하다.

공개 재생목록은 `YOUTUBE_API_KEY`만으로 사용할 수 있다. 서버 재시작 → 연결 상태 다시 확인 → 공개 재생목록 URL 입력 → 불러오기 → 후보 확인 → 가져올 영상 선택 → 저장 순서다. Google 계정 로그인은 필요하지 않다. 서버에서 요청하므로 브라우저 HTTP referrer 제한을 적용한 키는 사용할 수 없다. [Google API 키 설정](https://docs.cloud.google.com/docs/authentication/api-keys)을 참고해 YouTube Data API v3로 사용 범위를 제한한다.

2026-10-03에는 실제 키로 Google 공식 공개 재생목록 17개를 조회하고 웹 후보 목록·전체 선택 해제·개별 선택을 확인했다. 이 검토에서는 영상을 저장하지 않았다. 실제 Google 계정 OAuth와 50개 이상 목록의 페이지 이동은 별도 검증이다. 자세한 범위는 [검증 기록](verification.md)을 따른다.

같은 날 모아 전용 `moa-local` 프로젝트를 새로 만들고 YouTube Data API v3 활성화를 확인했다. 앱 이름·담당자 정보와 `youtube.readonly` 범위를 등록하고 `moa-local-web` 웹 클라이언트의 위 callback 양식을 준비했다. 최종 인증정보 생성은 계정 소유자의 실행 시점 확인 대기이며 `GOOGLE_CLIENT_ID`·`GOOGLE_CLIENT_SECRET`은 아직 미등록이다. 기존 공개 재생목록 API 키는 유지했다. 프로젝트 식별값·담당자 연락처·비밀값은 이 문서에 기록하지 않는다.

공식 기준: [Google Web Server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [OAuth 테스트 사용자](https://support.google.com/cloud/answer/15549945), [YouTube 재생목록](https://developers.google.com/youtube/v3/docs/playlists/list), [YouTube 보존 정책](https://developers.google.com/youtube/terms/developer-policies).

## 네이버 장소 검색과 지도

2026-07-31부터 개발자센터 검색 API 신규 신청이 중단되어 **새 키는 NAVER API HUB**에서 발급한다. 기존 검색 권한은 이관 유예 기간에 legacy 경로로 사용할 수 있다. HUB와 기존 키는 인증 방식이 달라 서로 바꿔 넣지 않는다. [이관 공지](https://developers.naver.com/notice/article/32530), [HUB 이관 가이드](https://guide.ncloud-docs.com/docs/apihub-migration)

1. [NAVER API HUB](https://www.ncloud.com/product/applicationService/naverApiHub)의 신청하기로 이동한다. NAVER Cloud 계정으로 한국 리전 콘솔의 서비스 신청·Application 등록을 진행한다. 이름은 `moa-local`, API는 **NAVER 검색 / 지역**을 선택한다. Maps SDK 키와는 다르다.
2. `.env.local`에 `NAVER_API_PROVIDER=hub`와 서버용 `NAVER_HUB_CLIENT_ID`, `NAVER_HUB_CLIENT_SECRET`을 입력한다. `EXPO_PUBLIC_` 접두사를 붙이지 않는다. 기존 검색 키를 사용할 때만 `NAVER_API_PROVIDER=legacy`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`을 사용한다. 선택한 경로가 실패해도 다른 키로 자동 재요청하지 않는다.
3. 서버 재시작 → 연결 상태 다시 확인 → 장소 검색하고 확인 → 동네와 장소 이름 검색 → 주소·원문 확인 → 네이버 지도 열기를 검증한다. API 결과를 저장함에 복사하는 버튼은 제공하지 않는다.
4. 동명 장소, 다른 지점, 결과 없음, quota/인증 오류, 좌표 없는 응답을 확인한다. 검색당 최대 5개를 제공한다. 브라우저의 지도 웹과 native 지도 앱/미설치 fallback은 별도 검증이다.

HUB는 현재 한시적 무료이며 유료 전환 시 별도 공지가 예정되어 있다. 결제 수단 등록이나 유료 서비스 신청이 필요한 화면에서는 계정 소유자가 직접 결정한다. 현재 한도·요금은 [HUB 개요](https://guide.ncloud-docs.com/docs/apihub-overview)에서 확인한다.

2026-10-03 신규 발급 작업은 NAVER Cloud 간편 로그인에서 ID·이름·휴대전화번호의 제3자 제공 동의 확인 대기다. HUB Application·키는 아직 생성하지 않았다. 로컬 환경에는 `hub` 제공자와 빈 HUB 변수만 준비했고, 실제 검색 성공으로 표시하지 않는다.

검색 결과의 장기 저장은 지원하지 않는다. [2026-09-20 시행 HUB 약관 공지](https://www.ncloud.com/support/notice/all/2243)의 기기 개인화 캐시 조건에 따라 결과는 메모리에서만 표시하며 새 질의·화면 이탈·최대 24시간 만료에 정리한다. 결과에서 파생된 이름·주소·좌표를 사용자 선택만으로 영구 저장하지 않는다. 서버 응답은 `no-store`이며 원문 링크와 네이버 지도 확인을 제공한다. 기존 개발 버전의 NAVER API 항목은 호환 읽기만 유지하고 새 생성·재저장은 거부한다. 기존 데이터의 조기 삭제는 자동 수행하지 않았다. [저장 계약](storage-v2.md)

개인 계정의 지도 저장 목록을 읽는 공개 API는 제공되지 않는다. 사용자가 직접 공유한 지도 링크는 수동으로 추가할 수 있으며, 공유 목록의 개별 장소를 일괄 수집했다고 표시하지 않는다.

공식 기준: [지역 검색 API](https://developers.naver.com/docs/serviceapi/search/local/local.md), [WGS84 좌표 변경](https://developers.naver.com/notice/article/12567), [지도 URL Scheme](https://guide-gov.ncloud-docs.com/docs/naveropenapiv3-maps-url-scheme-url-scheme).

## Instagram

현재 공개 게시물·Reel 원문 표시는 2026-06-15 변경 이후 토큰 없이 가능하다. API에서 받은 HTML은 사용자가 요청한 상세 화면에서만 표시하며 파일/기기 저장소에 남기거나 제목·장소 분석에 사용하지 않는다. 소비자 개인 저장함 읽기는 공개 Instagram Platform에서 지원하지 않는다.

링크 추가 또는 JSON/TXT의 후보 확인 가져오기를 사용한다. 특정 Instagram 내보내기 파일이 현재 지원되는 구조인지는 실제 파일로 확인해야 한다. 전체 압축 파일이나 메시지·프로필 데이터를 재귀 탐색하지 않는다. [지원 파일 형식](import-files.md)을 참고한다. 실제 계정의 내보내기 샘플은 저장소에 커밋하지 않는다.

공식 기준: [Instagram oEmbed](https://developers.facebook.com/documentation/instagram-platform/oembed.md?locale=en_US).

## 출시 전에 이어갈 일

현재 서버는 로컬 웹 검증용이다. 운영 사용자 인증·기기별 계정 연결, HTTPS 서버, 암호화 토큰 저장·권한 철회 처리, native OAuth callback, 제공자 정책에 맞는 데이터 갱신·삭제·개인정보 화면이 필요하다. OS가 앱을 종료한 동안 로컬 데이터를 30일 정각에 삭제할 수는 없다. 실제 계정 검증과 정책 검토 전에는 전체 연동·정책 준수·모바일 출시 완료로 설명하지 않는다.
