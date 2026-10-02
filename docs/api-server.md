# 모아 개발 API 서버

2026-10-03 기준. 이 서버는 로컬 웹에서 공식 API 연결을 확인하는 개발용이다. 사용자 인증·HTTPS 배포·영구 토큰 저장·네이티브 OAuth callback을 구현한 운영 서버가 아니다. 비밀값과 Google 토큰을 앱 코드, URL, AsyncStorage, 저장소에 넣지 않는다.

현재 MVP는 YouTube 공개 제목·공개 재생목록, Instagram 공개 원문, 앱의 JSON/TXT 후보 선택 저장이다. Google OAuth는 후속이고 NAVER API는 사용자 요청으로 보류했다. `/places`는 API 없는 안내이며 기존 검색 화면은 `src/features/integrations/NaverPlacesScreen.tsx`에 보관한다. 아래 OAuth·NAVER endpoint/환경 변수 계약은 후속 개발용으로 유지하며 현재 사용자의 키 발급·결제 등록을 요구하지 않는다. 서버 어댑터를 제거하거나 기존 저장 데이터·직접 공유한 지도 링크를 삭제하지 않았다.

## 실행과 설정

Node.js 24 이상에서 추가 서버 의존성 없이 실행한다. 서버용 환경 파일 `.env.local`을 저장소 루트에 만들고 다음 명령을 사용한다. 환경 파일은 Git에 포함하지 않는다. `EXPO_PUBLIC_` 접두사가 있는 변수는 앱에 공개되므로 서버의 비밀값에 이 접두사를 붙이지 않는다.

```sh
node --env-file-if-exists=.env.local server/index.ts
```

설정 없이 YouTube 제목 조회와 공개 Instagram embed를 먼저 시험하려면 `node server/index.ts`를 실행한다. 앱과 API 주소의 호스트를 모두 `localhost`로 통일한다. `localhost`와 `127.0.0.1`을 섞으면 Google 연결 cookie가 공유되지 않는다.

| 서버 환경 변수 | 기본값 / 목적 |
| --- | --- |
| `API_HOST` | `127.0.0.1`. `localhost` 또는 `127.0.0.1`만 허용 |
| `API_PORT` | `8787` |
| `APP_ORIGIN` | `http://localhost:8081`. 경로 없는 로컬 HTTP origin |
| `GOOGLE_REDIRECT_URI` | `http://localhost:8787/api/youtube/callback`. Google Cloud Web OAuth client에 정확히 같은 URI 등록 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth Web client. 계정 재생목록을 읽을 때 필요 |
| `YOUTUBE_API_KEY` | 공개 재생목록 조회에 필요. Google Cloud에서 YouTube Data API v3 활성화 |
| `NAVER_API_PROVIDER` | `legacy` 기본값. 기존 키는 `legacy`, 새 API HUB 키는 `hub` |
| `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | 기존 NAVER 개발자센터 검색 API 키. legacy 경로에서만 사용 |
| `NAVER_HUB_CLIENT_ID`, `NAVER_HUB_CLIENT_SECRET` | NAVER API HUB의 지역 검색 Application 키. hub 경로에서만 사용 |

Instagram oEmbed는 현재 tokenless이다. Instagram 소비자 계정 로그인이나 저장함 읽기 설정을 요구하지 않는다. Google OAuth consent screen의 테스트 사용자를 설정하고 YouTube 읽기 권한에 동의해야 계정 목록을 확인할 수 있다. 자격 증명이 설정되었다는 상태는 로그인 완료나 제공자에서 설정을 검증했다는 뜻이 아니다. Google 계정 연결은 공식 토큰 교환 성공 뒤 별도의 상태로 표시한다.

## 응답 계약

모든 응답에 `Cache-Control: no-store`를 적용한다. 시간은 ISO 8601 UTC이며 오류는 다음 형식이다. 제공자 오류 원문·비밀값은 전달하지 않는다.

```json
{"error":{"code":"setup_required","message":"서버 설정이 필요해요."}}
```

| Endpoint | 요청 / 응답 |
| --- | --- |
| `GET /api/status` | `{youtube:{metadata,oauthConfigured,connected,playlistConfigured,connectionId?},instagram:{embed:true,metadata:false,savedImport:false},naver:{searchConfigured,savedImport:false}}` |
| `POST /api/metadata` | JSON `{url}`. YouTube 영상만 `{title,authorName,provider:"youtube",fetchedAt}`. Instagram은 제목 직접 입력 안내와 `unsupported` |
| `POST /api/instagram/embed` | JSON `{url}`. 공개 게시물·릴스만 `{html,provider:"instagram",fetchedAt}`. HTML은 공식 embed를 즉시 표시하는 용도로만 사용하며 저장·분석·metadata 추출 금지 |
| `GET /api/youtube/playlist?url=…&pageToken=…` | API key로 공개 재생목록 항목 조회. `{items:[{id,videoId,title,url,authorName}],nextPageToken?,provider:"youtube",fetchedAt}` |
| `GET /api/youtube/playlists?pageToken=…` | 연결된 Google 계정이 소유한 일반 재생목록. `{items:[{id,title,itemCount}],nextPageToken?,provider:"youtube",fetchedAt}` |
| `GET /api/youtube/items?playlistId=…&pageToken=…` | 연결 계정 권한으로 재생목록 항목 조회. 공개 조회와 동일한 항목 응답 |
| `POST /api/youtube/connect` | JSON `{}`. `{authorizationUrl}`와 HttpOnly session cookie. 브라우저에서 URL 열기 |
| `GET /api/youtube/callback` | Google 전용 callback. cookie·state·만료 검사 후 앱의 `/integrations?youtube=connected` 또는 `youtube=error`로 이동 |
| `POST /api/youtube/disconnect` | JSON `{}`. Google 토큰 revoke 성공 뒤 메모리 session 삭제와 cookie 만료. `{disconnected:true}`. 원격 실패 시 `revoke_failed`로 재시도 가능 |
| `GET /api/naver/search?q=…` | 2–100자 장소 이름, 최대5개. `{items:[{title,category,address,roadAddress,url,mapx,mapy,latitude?,longitude?}],provider:"naver",fetchedAt}`. 즐겨찾기 조회 아님 |

웹 fetch는 `credentials: 'include'`를 사용한다. 변경 POST에는 `Content-Type: application/json`이 필요하며 정확한 `APP_ORIGIN`의 Origin만 허용한다. 현재 API 연동은 로컬 웹 개발 미리보기 전용이다. `connectionId`는 사용자 식별자가 아닌 연결 성공마다 새로 생성하는 UUID다. 현재 앱은 실제 계정 식별자가 없는 단일 연결이므로 명시적인 해제에서 이 기기의 모든 `account-playlist` 항목을 먼저 삭제한 뒤 remote revoke를 요청한다. 로컬 쓰기가 실패하면 revoke를 요청하지 않고, 원격 해제 실패는 실제 연결 상태를 유지하며 재시도한다.

주요 오류는 `setup_required`(503), `auth_required`(401), `origin_denied`/`access_denied`(403), `unsupported`/입력 오류(400), `not_found`(404), `limited`(429), `upstream_unavailable`/`upstream_invalid`/`revoke_failed`(502)다. 본문은8KiB, 제공자 JSON은1MiB, 외부 요청은8초, 로컬 요청은 분당120회로 제한한다. 재생목록은 페이지당 최대50개이며 다음 페이지는 사용자가 요청할 때만 조회한다.

## OAuth와 데이터 경계

Google은 `youtube.readonly` 최소 읽기 scope, authorization code, PKCE S256, 32-byte random state를 사용한다. state는 HttpOnly·SameSite=Lax cookie의 메모리 session에 묶이고10분 뒤 만료되며 한 번만 사용한다. session은8시간이며 서버 재시작 시 사라진다. 액세스 토큰 만료 시 메모리 refresh token으로 갱신하고 연결 해제·갱신 거절 시 재연결을 안내한다. 토큰은 브라우저 응답, 리디렉션, 로그, 파일에 기록하지 않는다. 상태 조회의 `connected`는 로컬 OAuth session의 유효 상태이며 외부 서비스의 실시간 건강 검사를 뜻하지 않는다.

YouTube의 `WL`(나중에 볼 동영상), `LL`(좋아요) 특수 목록은 이 재생목록 흐름에서 허용하지 않는다. 나중에 볼 목록은 공식 API가 제한하고, 좋아요 영상은 별도의 `videos.list?myRating=like` 경로가 있으나 이번 구현 범위 밖이다. 직접 만든 이름 있는 재생목록을 선택한다. 반환되지 않는 비공개·삭제 영상은 가져오지 않는다. 가져온 YouTube API 데이터의30일 내 갱신/삭제와 연결 해제 후 삭제 정책은 앱 저장 계층에서 적용해야 한다.

네이버는 공식 지역 검색으로 장소 후보만 제공한다. 실제 장소는 사용자가 주소를 확인해 선택해야 한다. 공식2023년 WGS84 전환 공지의 서울시청 sample에서 `mapx=1269873882`, `mapy=375666103`이므로 `longitude=mapx/10^7`, `latitude=mapy/10^7`로 해석한다. 안전한 정수·한국 범위를 확인한 값만 좌표로 반환하며 구형 KATECH sample이나 이상값은 좌표를 만들지 않는다. 표시용 문자열에서 HTML 태그를 제거하며 API 문자열을 HTML로 렌더링하지 않는다.

HUB는 고정 `https://naverapihub.apigw.ntruss.com/search/v1/local`과 `X-NCP-APIGW-API-KEY-ID`, `X-NCP-APIGW-API-KEY` 헤더, `format=json`을 사용한다. legacy는 기존 `https://openapi.naver.com/v1/search/local.json`과 `X-Naver-Client-Id`, `X-Naver-Client-Secret`을 유지한다. `searchConfigured`는 선택한 경로의 키 두 값만 확인하며 실패 시 다른 경로로 자동 대체하지 않는다. 인증/권한 거절은 `access_denied`, 한도는 `limited`, 기타 제공자 장애는 안전한 자체 오류로 반환한다.

앱의 NAVER 결과는 원문·지도 확인을 위한 임시 메모리 데이터다. 새 질의·화면 이탈 또는 최대 24시간 후 결과를 제거하며 영구 저장 경로는 차단한다. 서버는 검색 이력·캐시를 만들지 않는다. 기존 저장값의 호환 읽기는 현재 보존하며 이 변경으로 원본 데이터를 조기 삭제하지 않는다. 이는 기존 30일 정책이 NAVER 약관을 만족한다는 의미가 아니다. [HUB 지역 API](https://api.ncloud-docs.com/docs/naver-api-hub-search-local), [HUB 보관 조건 공지](https://www.ncloud.com/support/notice/all/2243)

Instagram의 oEmbed HTML은 사용자에게 해당 공개 콘텐츠를 보여주는 공식 embed 용도다. 웹 표시 컴포넌트는 scripts/popups만 허용하는 opaque iframe에서 공식 embed.js를 실행하며 same-origin 권한을 주지 않는다. opaque origin에서 제공자의 자동 높이 handshake가 되지 않아 내부 프레임에 고정 스크롤 영역을 적용한다. HTML에서 제목·장소·작성자·썸네일을 추출하거나 기기 저장 콘텐츠로 저장하지 않는다. 일반 소비자 Instagram 저장함과 네이버 지도 개인 즐겨찾기를 읽는 공식 연결은 지원하지 않는다.

## 검사와 공식 근거

```sh
node --test tests/server.test.ts
npm run typecheck
npm run lint
```

서버 테스트는 주입한 fetch로 URL 검증·고정 외부 주소·설정 누락·페이지 제한·공급자 오류·좌표·HTML 표시 계약·cookie/state 재사용·PKCE·토큰 refresh·revoke 실패·요청 제한을 검사한다. 모의 토큰 교환이 실제 계정 OAuth 검증을 대신하지 않는다. 실제 Google 계정·네이버 API 키·앱의 네이티브 callback은 사용자가 자격 증명을 설정한 뒤 별도 검증한다.

2026-10-01 실제 로컬 서버 검증에서는 자격 증명 없이 공개 YouTube `dQw4w9WgXcQ`의 oEmbed 제목·작성자 응답 성공을 확인했다. 공식 Instagram 문서의 공개 예시 `https://www.instagram.com/p/fA9uwTtkSN/`도 tokenless oEmbed 응답 성공, 표시용 HTML6,362자, 제목 필드 없음으로 확인했다. HTML은 검증 중 메모리에서만 확인하고 파일에 저장하지 않았다. 이 동작은 API key 또는 계정 OAuth가 필요한 재생목록·네이버 검색 검증을 뜻하지 않는다.

2026-10-03에는 실제 `YOUTUBE_API_KEY`로 `/api/youtube/playlist`를 호출해 공개 재생목록 17개·HTTP 200 응답과 웹 후보 선택을 확인했다. 실제 Google 계정 OAuth와 NAVER 검색은 아직 검증하지 않았다. 서버 설정 후 앱의 ‘연결 상태 다시 확인’을 눌러 상태를 갱신한다. [실제 검증 범위](verification.md)

- [Google Web Server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server): callback, state, 토큰 교환·갱신·해제
- [YouTube playlists.list](https://developers.google.com/youtube/v3/docs/playlists/list), [playlistItems.list](https://developers.google.com/youtube/v3/docs/playlistItems/list): 소유 재생목록·페이지·접근 제한
- [YouTube videos.list](https://developers.google.com/youtube/v3/docs/videos/list): 좋아요 영상은 별도 API
- [YouTube 개발자 정책](https://developers.google.com/youtube/terms/developer-policies): 저장·갱신·삭제 의무
- [Instagram oEmbed](https://developers.facebook.com/documentation/instagram-platform/oembed.md?locale=en_US):2026-06-15 tokenless 전환, 표시 목적 제한
- [네이버 지역 검색](https://developers.naver.com/docs/serviceapi/search/local/local.md), [WGS84 전환 공지](https://developers.naver.com/notice/article/12567): 장소 검색·좌표 기준
