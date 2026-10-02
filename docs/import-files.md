# 파일에서 기존 링크 가져오기

파일 가져오기는 사용자가 고른 JSON·TXT에서 지원하는 링크 후보를 읽어 **저장 전 확인 목록**을 만드는 기능이다. `src/domain/imports.ts`는 파일 업로드·외부 API 호출·저장·원본 내용 로깅을 하지 않는다. 저장할 항목과 제목은 화면에서 확인한다.

기본 웹앱은 `src/web/pages/IntegrationsPage.tsx`의 HTML 파일 입력과 `src/web/lib/readImportFile.ts`의 File/엄격한 UTF-8 TextDecoder를 사용한다. 원본 파일은 브라우저에서만 읽고 같은 파일도 다시 선택할 수 있도록 입력을 초기화한다. 실패하면 이미 검토하던 후보를 보존한다. 보관한 Expo 파일 선택 어댑터와 실기기 검증은 별도다.

## 지원 범위와 제한

- UTF-8 기준 최대 2MiB, 한 번에 최대 200개 입력 레코드·링크 후보를 처리한다. 초과하면 파일 전체를 거부하며 앞부분만 조용히 가져오지 않는다. 파일 선택 화면에서도 읽기 전 크기를 확인한다.
- 명시적으로 `https://`로 시작하는 Instagram·YouTube·NAVER 공식 도메인의 링크만 후보가 된다. 공식 도메인의 하위 도메인을 허용하고 `youtu.be`, `naver.me` 단축 링크를 포함한다. NAVER 링크가 지도 장소나 저장 리스트임을 자동 확정하지 않는다.
- HTTP, 스킴 생략, 사용자정보 포함 주소, 위장 도메인, 제어문자·역슬래시, 비표준 포트, 4,096자를 넘는 URL은 제외한다. URL을 요청하거나 단축 링크를 펼치지 않는다.
- `normalizeUrl`로 추적 파라미터를 제거하고 같은 정규화 URL을 중복으로 집계한다. 재생 시점·재생목록 등 의미 있는 값은 유지하므로 영상 ID만 같다고 중복으로 취급하지 않는다.
- `duplicates`는 파일 안의 정규화 URL 중복 수다. 기존 저장함과의 중복은 저장 단계에서 별도로 검사한다. `unsupported`는 제외된 레코드·href 후보 수다.
- 제목이 없으면 `Instagram 링크`, `YouTube 링크`, `네이버 링크`를 검토용 제목으로 채운다. 제목은 앞뒤 공백을 제거하고 저장 규칙의 120자 제한에 맞춰 줄인다. 자동으로 원문 제목·장소·행사 기간을 분석한 결과가 아니다.

## TXT

한 줄에 HTTPS 링크 하나를 넣는다. 빈 줄은 무시하고 UTF-8 BOM과 Windows·Unix 줄바꿈을 처리한다. 제목이나 설명을 링크와 같은 줄에 붙이는 형식은 지원하지 않는다.

```text
https://www.instagram.com/p/USER_CONFIRMED_SHORTCODE/
https://www.youtube.com/watch?v=USER_CONFIRMED_VIDEO_ID
https://naver.me/USER_CONFIRMED_SHARE_ID
```

위 값은 구조 설명용 자리표시자다. 실제 게시물·영상·장소가 아니다. 가져오기 후보는 유효한 공식 도메인 링크인지 확인하며, 삭제·비공개·원문 접근 가능 여부는 이 로컬 parser가 검사하지 않는다.

## 직접 준비한 JSON

최상위 배열의 항목에서 `url`과 선택적인 문자열 `title`만 읽는다. 다른 속성 안의 링크는 탐색하지 않는다. 숫자 제목이나 URL이 없는 항목은 제외한다.

```json
[
  {
    "url": "https://naver.me/USER_CONFIRMED_SHARE_ID",
    "title": "내가 확인한 장소"
  }
]
```

## 제한적으로 읽는 `saved_saved_media` 형태

최상위 `saved_saved_media` 배열이 있을 때 각 항목의 `string_map_data` 바로 아래 객체의 `href`만 읽는다. 항목 자체의 문자열 `title`을 검토 제목으로 사용한다. 다른 최상위 항목·메시지·프로필·중첩된 링크는 재귀 탐색하지 않는다.

```json
{
  "saved_saved_media": [
    {
      "title": "사용자가 확인할 제목",
      "string_map_data": {
        "Saved on": {
          "href": "https://www.instagram.com/p/USER_CONFIRMED_SHORTCODE/"
        }
      }
    }
  ]
}
```

이 형태는 이 앱이 읽도록 제한한 **호환 입력 형태**다. Instagram의 공식·고정 내보내기 규격으로 검증하지 않았다. 특정 파일명이나 언어별 필드명을 요구하지 않으며, 실제 계정에서 내보낸 파일을 이번 구현에서 검증하지 않았다. 전체 개인정보 ZIP·HTML, 알 수 없는 JSON 구조는 지원하지 않는다. 알 수 없는 구조는 오류를 안내하고 링크 배열 JSON 또는 TXT로 준비하도록 한다.

## 외부 저장함과 구분

파일에서 읽은 링크는 사용자가 제공한 후보이며 OAuth로 계정 저장함을 동기화한 데이터가 아니다. 파일을 고르는 행위만으로 기존 저장함에 자동 추가하지 않는다. 후보 검토·선택과 기존 링크 중복 검사·저장 결과를 거친다. `parseImportCandidates(text, 'json' | 'txt')`가 돌려주는 값은 `{ items: [{ url, title }], duplicates, unsupported }`다.

Instagram은 [공식 정보 내보내기 도구](https://help.instagram.com/181231772500920/)를 제공하고 Google은 [데이터 내보내기](https://support.google.com/accounts/answer/3024190?hl=en)를 안내한다. 이 도구들의 안내는 위 예시 JSON이 공식 export 규격이라는 근거가 아니다. [NAVER 지도 리스트 공유](https://help.naver.com/service/5637/contents/21479?lang=ko&osType=COMMONOS)는 원본 리스트를 여는 기능이며 링크 하나에서 모든 장소를 일괄 가져올 수 있다는 뜻이 아니다.

실제 export 호환성을 확장할 때는 동의받고 개인 식별 정보가 제거된 샘플로 현재 parser가 필요한 링크만 읽는지 확인한다. 사용자 원본 파일·메시지·인증정보는 공개 저장소나 검증 이미지에 넣지 않는다.
