# 핀맵 개발 API 서버

2026-10-08 기준. 제품명은 핀맵으로 바꾸고 저장소·기존 저장 데이터는 유지했다. 현재 codex/anyjev-instagram-analysis는 codex/content-integrations의 03d73fd에서 시작했다. 기본 클라이언트는 React DOM·Vite 웹앱이며 이 서버는 로컬 웹에서 공식 API와 선택 사항인 AnyJev 모델 연결을 확인하는 개발용이다. 사용자 인증·HTTPS 배포·영구 토큰 저장·네이티브 OAuth callback을 구현한 운영 서버가 아니다. 비밀값과 Google 토큰을 앱 코드, URL, localStorage·AsyncStorage, 저장소에 넣지 않는다.

현재 MVP는 YouTube 공개 제목·공개 재생목록, Instagram 공개 원문, 앱의 JSON/TXT 후보 선택 저장과 사용자가 제공한 Instagram 텍스트의 분류 요청 경로다. AnyJev 모델은 현재 미구성이며 실제 모델 추론을 수행하지 않았다. Google OAuth는 후속이고 NAVER API는 사용자 요청으로 보류했다. `/places`는 API 없는 안내이며 기존 검색 화면은 `src/features/integrations/NaverPlacesScreen.tsx`에 보관한다. 아래 OAuth·NAVER endpoint/환경 변수 계약은 후속 개발용으로 유지하며 현재 사용자의 키 발급·결제 등록을 요구하지 않는다. 서버 어댑터를 제거하거나 기존 저장 데이터·직접 공유한 지도 링크를 삭제하지 않았다.

## 실행과 설정

Node.js 24 이상에서 추가 서버 의존성 없이 실행한다. 서버용 환경 파일 `.env.local`을 저장소 루트에 만들고 다음 명령을 사용한다. 기존 `.env.local`과 API 키는 보존한다. 환경 파일은 Git에 포함하지 않는다. `VITE_`는 웹 번들에, `EXPO_PUBLIC_`는 보관한 Expo 앱에 공개되므로 서버의 비밀값에 두 접두사를 붙이지 않는다.

```sh
npm run dev
```

한 명령이 API8787과 Vite8081을 시작하고 함께 종료한다. 서버만 필요하면 `npm run api` 또는 `node --env-file-if-exists=.env.local server/index.ts`를 사용한다. 키 없이 YouTube 제목 조회와 공개 Instagram embed를 시험할 수 있다. 앱 접속 호스트는 `localhost`로 통일한다. `localhost`와 `127.0.0.1`을 섞으면 Google 연결 cookie와 브라우저 저장소 origin이 달라진다.

웹의 `src/web/lib/api.ts`는 API endpoint에 상대 경로 `/api/...`로 요청한다. `vite.config.ts`의 dev와 preview proxy가 `http://127.0.0.1:8787`로 전달하며 `changeOrigin: false`로 browser Origin과 Host를 유지한다. proxy의 내부 목적지 IP는 브라우저 접속 주소를 바꾸지 않는다. 클라이언트가 공급자 endpoint·비밀값을 직접 사용하는 경로는 없다. `EXPO_PUBLIC_API_BASE_URL`은 보관한 Expo 구현용이며 기본 DOM 웹은 사용하지 않는다. 이 proxy·SPA fallback은 로컬 검토 설정이고 운영 배포의 reverse proxy·HTTPS·사용자별 인증을 대신하지 않는다.

| 서버 환경 변수 | 기본값 / 목적 |
| --- | --- |
| `API_HOST` | `127.0.0.1`. `localhost` 또는 `127.0.0.1`만 허용 |
| `API_PORT` | `8787` |
| `APP_ORIGIN` | `http://localhost:8081`. 경로 없는 로컬 HTTP origin |
| `GOOGLE_REDIRECT_URI` | `http://localhost:8787/api/youtube/callback`. Google Cloud Web OAuth client에 정확히 같은 URI 등록 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth Web client. 계정 재생목록을 읽을 때 필요 |
| `YOUTUBE_API_KEY` | 공개 재생목록 조회에 필요. Google Cloud에서 YouTube Data API v3 활성화 |
| `ANYJEV_BASE_URL` | 빈 값은 분석 비활성화·외부 요청 없음. 연결 시 credential·경로·query 없는 `http://localhost:포트` 또는 `http://127.0.0.1:포트` origin만 허용 |
| `ANYJEV_TIMEOUT_MS` | `45000`. 분석 요청·본문 읽기 전체에 적용하며 정수 1000–60000만 허용 |
| `NAVER_API_PROVIDER` | `legacy` 기본값. 기존 키는 `legacy`, 새 API HUB 키는 `hub` |
| `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | 기존 NAVER 개발자센터 검색 API 키. legacy 경로에서만 사용 |
| `NAVER_HUB_CLIENT_ID`, `NAVER_HUB_CLIENT_SECRET` | NAVER API HUB의 지역 검색 Application 키. hub 경로에서만 사용 |

Instagram oEmbed는 현재 tokenless이다. Instagram 소비자 계정 로그인이나 저장함 읽기 설정을 요구하지 않는다. Google OAuth consent screen의 테스트 사용자를 설정하고 YouTube 읽기 권한에 동의해야 계정 목록을 확인할 수 있다. 자격 증명이 설정되었다는 상태는 로그인 완료나 제공자에서 설정을 검증했다는 뜻이 아니다. Google 계정 연결은 공식 토큰 교환 성공 뒤 별도의 상태로 표시한다.

AnyJev 연결은 새 OpenAI 키나 유료 API 발급을 요구하지 않는다. [텍스트 분석 계약](instagram-analysis.md)과 [별도 모델 worker 설치·실행](../services/anyjev/README.md)을 따른다. 현재 `.env.local`·기존 키는 바꾸지 않았고 모델 SDK·가중치를 설치하거나 추론하지 않았다.

## 응답 계약

모든 응답에 `Cache-Control: no-store`를 적용한다. fetchedAt 등 시각 필드는 ISO 8601 UTC이며 elapsedMs 등 기간은 밀리초다. 오류는 다음 형식이다. 제공자 오류 원문·비밀값은 전달하지 않는다.

```json
{"error":{"code":"setup_required","message":"서버 설정이 필요해요."}}
```

| Endpoint | 요청 / 응답 |
| --- | --- |
| `GET /api/status` | `{youtube:{metadata,oauthConfigured,connected,playlistConfigured,connectionId?},instagram:{embed:true,metadata:false,savedImport:false},naver:{searchConfigured,savedImport:false}}` |
| `POST /api/metadata` | JSON `{url}`. YouTube 영상만 `{title,authorName,provider:"youtube",fetchedAt}`. Instagram은 제목 직접 입력 안내와 `unsupported` |
| `POST /api/instagram/embed` | JSON `{url}`. 공개 게시물·릴스만 `{html,provider:"instagram",fetchedAt}`. HTML은 공식 embed를 즉시 표시하는 용도로만 사용하며 저장·분석·metadata 추출 금지 |
| `GET /api/instagram/analysis/status` | `{provider:"anyjev",configured,reachable}`. 미구성 시 외부 요청 없이 false/false. 설정 시 고정 `/health`의 HTTP 200·4KiB 이하 JSON `{ok:true}` 확인. 실제 분석 품질이나 입력 token usage 검증 아님 |
| `POST /api/instagram/analysis` | JSON `{url,caption?,ocr?,transcript?}`. 공식 Instagram `/p/`·`/reel/` URL, 세 텍스트 합계 8,000자 이하. 반환 `{provider:"anyjev",category,evidence,reviewRequired,metrics,cached}`. 두 결정은 선택형 분류와 근거 충분 여부. URL·미디어·oEmbed 수집 없음 |
| `GET /api/youtube/playlist?url=…&pageToken=…` | API key로 공개 재생목록 항목 조회. `{items:[{id,videoId,title,url,authorName}],nextPageToken?,provider:"youtube",fetchedAt}` |
| `GET /api/youtube/playlists?pageToken=…` | 연결된 Google 계정이 소유한 일반 재생목록. `{items:[{id,title,itemCount}],nextPageToken?,provider:"youtube",fetchedAt}` |
| `GET /api/youtube/items?playlistId=…&pageToken=…` | 연결 계정 권한으로 재생목록 항목 조회. 공개 조회와 동일한 항목 응답 |
| `POST /api/youtube/connect` | JSON `{}`. `{authorizationUrl}`와 HttpOnly session cookie. 브라우저에서 URL 열기 |
| `GET /api/youtube/callback` | Google 전용 callback. cookie·state·만료 검사 후 앱의 `/integrations?youtube=connected` 또는 `youtube=error`로 이동 |
| `POST /api/youtube/disconnect` | JSON `{}`. Google 토큰 revoke 성공 뒤 메모리 session 삭제와 cookie 만료. `{disconnected:true}`. 원격 실패 시 `revoke_failed`로 재시도 가능 |
| `GET /api/naver/search?q=…` | 2–100자 장소 이름, 최대5개. `{items:[{title,category,address,roadAddress,url,mapx,mapy,latitude?,longitude?}],provider:"naver",fetchedAt}`. 즐겨찾기 조회 아님 |

웹 fetch는 `credentials: 'include'`를 사용한다. 변경 POST에는 `Content-Type: application/json`이 필요하며 정확한 `APP_ORIGIN`의 Origin만 허용한다. 현재 API 연동은 로컬 웹 개발 미리보기 전용이다. `connectionId`는 사용자 식별자가 아닌 연결 성공마다 새로 생성하는 UUID다. 현재 앱은 실제 계정 식별자가 없는 단일 연결이므로 명시적인 해제에서 이 기기의 모든 `account-playlist` 항목을 먼저 삭제한 뒤 remote revoke를 요청한다. 로컬 쓰기가 실패하면 revoke를 요청하지 않고, 원격 해제 실패는 실제 연결 상태를 유지하며 재시도한다.

주요 오류는 `setup_required`(503), `auth_required`(401), `origin_denied`/`access_denied`(403), `unsupported`/입력 오류(400), `not_found`(404), `limited`(429), `upstream_unavailable`/`upstream_invalid`/`revoke_failed`(502)다. 분석 경로에는 `invalid_evidence`(400), `analysis_unavailable`/`analysis_invalid`/`analysis_budget`(502)가 추가된다. 기존 본문은8KiB, 제공자 JSON은1MiB, 외부 요청은8초이며 로컬 요청은 공통으로 분당120회 제한한다. AnyJev만 분석 본문 40KiB·모델 응답 64KiB·기본 45초와 아래 건강 검사 제한을 적용한다. 재생목록은 페이지당 최대50개이며 다음 페이지는 사용자가 요청할 때만 조회한다.

## Instagram 텍스트 분석과 모델 경계

`server/anyjev.ts`는 요청 본문의 URL을 네트워크 목적지로 사용하지 않는다. 공식 `instagram.com`·`www.instagram.com` `/p/`·`/reel/` 링크를 정규화한 식별자로만 쓰고, 사용자가 입력한 caption·ocr·transcript를 `src/domain/instagramAnalysis.ts`로 전처리한다. 공백·중복 줄을 정리한 전체 근거는 표시·생략 문구 포함 최대 2,400자다. 긴 입력은 중간 내용이 빠질 수 있으므로 truncated와 수동 검토 안내를 유지한다. 이미지·영상 다운로드, OCR·STT 자동 실행, 장소명·주소·행사 날짜의 자유 생성, 개인 저장함 조회는 없다.

전처리 근거는 설정된 loopback origin의 고정 `POST /v1/decide`로만 보내며 `items`에 두 `kind:"choice"`를 담는다. category 선택지는 `food/cafe/event/other`, evidence 선택지는 `enough/needs_more`다. 반환의 answer/index·확률 키/합계/범위·route·추론 토큰 수를 검증한다. `one_forward`만 성공으로 반환하고 `cot`는 `analysis_budget` 오류로 보류한다. 수치 기준은 보수적인 검토 휴리스틱이며 모델 정확도를 보장하지 않는다. 응답의 decision은 `{value,scores,route,reasoningTokens}`이고 metrics는 `{inputCharacters,preparedCharacters,truncated,sources,decisions:2,reasoningTokens,elapsedMs}`다. SDK의 `reasoning_tokens`가 없으면 `null`을 유지하며 전체 input-token usage나 비용 절감률을 만들어 반환하지 않는다.

성공 결정만 메모리에 15분·최대 100개 저장한다. 키는 질문 버전·정규화 URL·정리 텍스트의 SHA-256이며 원문을 캐시에 기록하지 않는다. 같은 분석이 진행 중이면 그 요청을 공유하고 다른 고유 분석은 429로 거부한다. `cached:true`는 저장된 성공 캐시 재사용이며 진행 중인 요청 공유는 false다. 각 요청의 입력 문자·출처·생략 metrics는 해당 입력 기준이다. 실패는 캐시하지 않고 진행 슬롯을 해제하여 명시적인 재시도가 가능하다. 서버 재시작 시 결과가 사라지며 브라우저의 저장함을 변경하지 않는다.

주소가 비어 있는 상태 조회와 유효 분석 요청은 외부 호출을 하지 않는다. 미설정 분석은 503 `setup_required`이며 기본 수동 저장을 막지 않는다. 주소가 있으면 `/health`를 최대 2초(설정 제한이 더 짧으면 그 값)·4KiB 이하로 읽고 HTTP 200 JSON 객체의 `ok:true`일 때만 reachable=true다. 무관한200·잘못된 JSON·응답 크기 초과·끝나지 않는 스트림은 false다. `/api/status`는 AnyJev 건강 요청을 자동 실행하지 않는다.

분석 요청과 응답 읽기는 기본 45초, 설정 범위 1–60초이며 리디렉션을 따라가지 않는다. 브라우저는 65초 제한과 취소를 제공한다. 이 취소·Node timeout은 이미 시작한 모델 연산을 종료한다는 보장이 아니다. gateway에서 adaptive=False로 긴 추론을 꺼야 비용을 예방할 수 있으며, 이미 반환된 cot 오류가 이전 비용을 되돌리지는 않는다. 제공한 CPU worker는 SDK 0.3.0·Tacit-1.7B·CPU/float32·adaptive=False로 고정하고 모델 없이 설정을 검사할 수 있다. 성공 응답의 비유한 margin은 null로 표현하고 확률을 바꾸지 않는다. 외부 stock gateway가 비표준 Infinity JSON을 반환하면 502로 분석을 보류할 수 있다.

입력 텍스트·전체 모델 응답·추론 trace·비밀값을 응답과 HTTP/예외 로그에 남기지 않는다. 원문은 요청 처리 동안만 사용하며 브라우저는 패널 메모리에 입력을 유지한다. 운영 사용자 인증·사용자별 격리·외부 공개는 제공하지 않는다. 실제 모델 연결과 측정 절차는 [분석 계약](instagram-analysis.md), [선택 사항인 worker](../services/anyjev/README.md)를 따른다.

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
node --test tests/anyjev-server.test.ts tests/instagram-analysis.test.ts tests/web-instagram-analysis-api.test.ts
npm run typecheck
npm run lint
python services/anyjev/worker.py --dry-run
python -m unittest discover -s services/anyjev -p test_worker.py -v
```

서버 테스트는 주입한 fetch로 URL 검증·고정 외부 주소·설정 누락·페이지 제한·공급자 오류·좌표·HTML 표시 계약·cookie/state 재사용·PKCE·토큰 refresh·revoke 실패·요청 제한을 검사한다. 모의 토큰 교환이 실제 계정 OAuth 검증을 대신하지 않는다. 실제 Google 계정·네이버 API 키·앱의 네이티브 callback은 사용자가 자격 증명을 설정한 뒤 별도 검증한다.

2026-10-08 전체 Node 테스트 117개·Python 테스트 22개가 통과했다. AnyJev 검사는 전처리·수동 입력 계약·미구성 상태·health JSON/크기/시간 제한·정상/오류 응답·캐시/동시 요청·기한·긴 추론 거부·로그 가림과 가상 SDK를 확인한다. 실제 loopback HTTP 경계 검사는 실제 모델 추론과 구분한다. 현재 모델은 실행하지 않았으며 한국어 품질·실측 input/generated token·지연·비용 절감률은 검증하지 않았다. 이 분기의 새 PR은 문서 갱신 시 아직 생성하지 않았다.

2026-10-01 실제 로컬 서버 검증에서는 자격 증명 없이 공개 YouTube `dQw4w9WgXcQ`의 oEmbed 제목·작성자 응답 성공을 확인했다. 공식 Instagram 문서의 공개 예시 `https://www.instagram.com/p/fA9uwTtkSN/`도 tokenless oEmbed 응답 성공, 표시용 HTML6,362자, 제목 필드 없음으로 확인했다. HTML은 검증 중 메모리에서만 확인하고 파일에 저장하지 않았다. 이 동작은 API key 또는 계정 OAuth가 필요한 재생목록·네이버 검색 검증을 뜻하지 않는다.

2026-10-03에는 실제 `YOUTUBE_API_KEY`로 `/api/youtube/playlist`를 호출해 공개 재생목록 17개·HTTP 200 응답과 웹 후보 선택을 확인했다. 실제 Google 계정 OAuth와 NAVER 검색은 아직 검증하지 않았다. 서버 설정 후 앱의 ‘연결 상태 다시 확인’을 눌러 상태를 갱신한다. [실제 검증 범위](verification.md)

- [Google Web Server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server): callback, state, 토큰 교환·갱신·해제
- [YouTube playlists.list](https://developers.google.com/youtube/v3/docs/playlists/list), [playlistItems.list](https://developers.google.com/youtube/v3/docs/playlistItems/list): 소유 재생목록·페이지·접근 제한
- [YouTube videos.list](https://developers.google.com/youtube/v3/docs/videos/list): 좋아요 영상은 별도 API
- [YouTube 개발자 정책](https://developers.google.com/youtube/terms/developer-policies): 저장·갱신·삭제 의무
- [Instagram oEmbed](https://developers.facebook.com/documentation/instagram-platform/oembed.md?locale=en_US):2026-06-15 tokenless 전환, 표시 목적 제한
- [네이버 지역 검색](https://developers.naver.com/docs/serviceapi/search/local/local.md), [WGS84 전환 공지](https://developers.naver.com/notice/article/12567): 장소 검색·좌표 기준
- [AnyJev 공식 gateway](https://github.com/nokia-applied-research/AnyJev/blob/main/anyjev/serve.py), [Tacit 구현](https://github.com/nokia-applied-research/AnyJev/blob/main/anyjev/tacit.py): 텍스트 choice 배치·one_forward/adaptive·추론 토큰 계약. 검증 버전과 설치 한계는 [실행 서비스](../services/anyjev/README.md#연구-수치라이선스재현-기준)를 따른다.
