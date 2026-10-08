# 핀맵 · Instagram 간단 분석과 AnyJev

2026-10-08 사용자 요청으로 제품명을 핀맵으로 바꾸고, 릴스·게시물 정리의 분석 비용을 줄이기 위한 텍스트 분류 단계를 추가했다. 현재 모델 서버는 없다. **텍스트 정리·UI·HTTP 연결·실행 도구가 구현된 상태**이며 실제 모델 추론·한국어 품질·토큰 절감률은 검증하지 않았다.

## 어떤 비용을 줄이는가

[AnyJev](https://github.com/nokia-applied-research/AnyJev)는 state와 닫힌 선택지를 받아 next-token 분포에서 분류를 읽는다. Tacit의 `one_forward`는 긴 자연어 생성 대신 선택지를 반환한다. 원문 입력의 prefill 연산은 여전히 필요하다. 이 구현은 한 번의 HTTP 배치에서 **분류와 근거 충분 여부 두 결정**을 실행하므로, 단일 생성 호출보다 총 연산이 항상 작다고 보장하지 않는다.

이번 경로는 다음을 구현한다.

1. 사용자가 Instagram 상세에서 캡션·이미지의 글자·릴스 자막을 직접 입력한다.
2. 공백과 동일한 줄을 정리하고 전체 2,400자 이하로 묶는다. 긴 텍스트는 각 입력의 앞·끝을 남기고 생략을 표시한다.
3. 연결된 AnyJev가 `food/cafe/event/other`와 `enough/needs_more`를 선택한다.
4. 원문이 생략됐거나 점수가 모호하면 검토 안내를 표시한다. 사용자가 기존 수정 화면에서 분류를 직접 저장한다.
5. 같은 URL·정리 텍스트·질문 버전의 성공 결과를 잠시 재사용한다. 동시에 들어온 같은 요청은 모델 호출 하나로 합친다.

영상 프레임 압축, 미디어 다운로드, OCR, 음성 전사, 자유로운 장소명·주소·날짜 추출, 소비자 저장함 조회는 이 경로에 없다. `needs_more`는 추가 텍스트를 요청하는 안내이며 유료 vision/STT 호출을 자동 실행하지 않는다. oEmbed HTML은 기존 표시 전용이다. 별도로 사용 허가를 확보한 입력 어댑터를 연결할 때는 출처·사용자 승인·보존 계약을 먼저 맞춘다.

## 화면·코드 책임

| 파일 | 책임 |
| --- | --- |
| [instagramAnalysis.ts](../src/domain/instagramAnalysis.ts) | 8,000자 원문·2,400자 정리, 두 choice 질문, 응답 분포와 수동 검토 기준 |
| [InstagramAnalysis.tsx](../src/web/components/InstagramAnalysis.tsx) | 접기·입력 유지·정리 미리보기·연결 상태·추천 검토. 화면 메모리만 사용 |
| [instagramAnalysisApi.ts](../src/web/lib/instagramAnalysisApi.ts) | 상대 `/api`, 응답 검증, 65초 제한과 브라우저 취소 |
| [anyjev.ts](../server/anyjev.ts) | 고정 loopback 호출·응답 제한·중복 합치기·결과 캐시·실패 변환 |
| [api.ts](../server/api.ts) | 기존 Origin·요청 제한 안에서 상태·분석 route |
| [worker.py](../services/anyjev/worker.py) | 선택 사항: 공식 Tacit-1.7B CPU 실행, CoT 없음, 메모리·HTTP 제한·원문 오류 가림 |

모델 점수 `0.75`, 상위 두 점수 차 `0.25`는 검토 안내를 위한 임시 휴리스틱이다. 정확도·자동 저장 허용 기준이 아니다. 추천은 높은 점수여도 사용자가 확인한다. 입력 변경·다른 상세 이동·언마운트 시 오래된 응답은 UI에 반영하지 않는다. 접었다 펴면 입력은 유지하고, 명시적인 비우기는 이 패널의 입력만 지운다. 기존 저장함 항목을 지우거나 변경하지 않는다.

## API 계약

`GET /api/instagram/analysis/status` → `{provider:"anyjev", configured, reachable}`. 주소가 비어 있으면 외부 요청 없이 둘 다 false다. 설정돼 있으면 `/health`의 HTTP 200·4KiB 이하 `{ok:true}`만 정상으로 읽는다. 건강 응답 성공도 한국어 분석 품질 검증을 뜻하지 않는다.

`POST /api/instagram/analysis` 입력:

```json
{"url":"https://www.instagram.com/reel/EXAMPLE/","caption":"사용자가 제공한 텍스트","ocr":"이미 추출한 화면 글자","transcript":"이미 추출한 자막"}
```

공식 Instagram `/p/`·`/reel/` 링크만 받으며, URL을 가져오는 네트워크 요청은 하지 않는다. 입력은 합계 8,000자, 분석 route 본문은 40KiB다. 다른 API의 기존 8KiB 제한은 그대로다. Node 서버가 정리한 근거를 AnyJev의 `POST /v1/decide` 배치 두 개로 보낸다. 모델 endpoint를 사용자가 요청 본문에서 지정할 수 없다.

반환값은 `category`, `evidence`, `reviewRequired`, `metrics`, `cached`다. probabilities·answer/index 일치·합계·route·추론 토큰 형식을 검증한다. 문자열 오답·비정상 분포·긴 추론·시간 제한은 오류로 반환하며 성공 결과처럼 표시하지 않는다. 성공·오류 응답과 HTTP 로그에 입력 텍스트, 전체 모델 응답, reasoning 내용을 보내지 않는다.

결과 캐시는 서버 프로세스 메모리에만 15분·최대 100개 저장한다. 원문은 해시 키를 만드는 동안만 쓰고 캐시에 남기지 않는다. 다른 고유 분석이 진행 중이면 429이며 동일한 분석은 공유한다. 실패는 재시도할 수 있다. 서버 재시작 시 캐시가 사라진다. 사용자별 운영 인증·격리가 없는 로컬 개발용이므로 그대로 외부에 공개하지 않는다.

## 모델 연결

서버 전용 `.env.local`에 모델이 실제 실행된 뒤 설정한다. 현재 환경 파일은 바꾸지 않았다.

```dotenv
ANYJEV_BASE_URL=http://127.0.0.1:8100
ANYJEV_TIMEOUT_MS=45000
```

비어 있는 주소는 기능 미설정이며 기본 저장함 사용을 막지 않는다. 허용 주소는 credential·경로·query 없는 loopback HTTP origin이다. 공식 gateway는 자체 인증이 없어서 원격 GPU 서버는 인증된 터널의 로컬 주소로 연결한다. 브라우저가 모델 서버를 직접 호출하지 않는다. [CPU 설치와 GPU 연결 예시](../services/anyjev/README.md)를 따른다.

Python 3.10 이상과 `anyjev[hf]==0.3.0`을 별도 환경에 설치하는 선택 사항이다. CPU worker는 `adaptive=False`, `max_cot_share=0`, `cot_max_tokens=0`이며 모델은 공식 Tacit-1.7B로 고정한다. 여유 RAM 8GiB 미만이면 SDK import·모델 다운로드 전에 멈춘다. 이 문턱을 통과해도 로드·지연 성공은 보장하지 않는다. 이 PC는 여유 메모리가 약 1–2GiB여서 SDK·가중치를 설치하거나 실행하지 않았다. OpenAI 키나 새로운 유료 API는 필요하지 않다.

Node의 긴 추론 응답 거부는 이미 발생한 모델 비용을 되돌리지 못한다. gateway도 반드시 adaptive를 꺼야 한다. 브라우저 취소와 Node timeout은 이미 시작한 모델 연산을 중단한다고 보장하지 않는다. SDK의 비유한 margin은 제공한 worker에서 `null`로 표현하며 확률은 바꾸지 않는다. 외부 stock gateway의 비표준 `Infinity` JSON은 보류 오류가 될 수 있다.

## 측정과 남은 검증

UI의 입력/정리 문자 수는 JavaScript 문자열 길이다. prompt·각 질문·선택지·채팅 템플릿 토큰이나 중복 prefill을 포함한 모델 input usage가 아니다. gateway가 제공하는 `reasoning_tokens`는 없으면 null로 유지한다. 긴 설명 생성 없음·결정 route·캐시 재사용과 실제 총 토큰 절감은 별개다.

[공식 평가](https://github.com/nokia-applied-research/AnyJev#-tacit-results)는 개별 선택형 연구 데이터의 결과다. [제약 문서](https://github.com/nokia-applied-research/AnyJev/blob/main/docs/limitations.md)에는 모델 지식·순서 편향·CoT 비용·개별 결정 평가 한계가 있다. 이 숫자를 핀맵의 릴스·한국어 추출 정확도나 비용 절감률로 사용하지 않는다.

실 서버가 준비되면 같은 허가된 한국어 샘플을 기존 분석 경로와 비교한다. 카테고리 정답·추가 근거 판단·잘못된 자동 확정·생략 전후 손실, 실제 tokenizer input·generated tokens·prefill 횟수·캐시 hit·실패·지연·GPU 시간·OCR/STT 비용을 함께 측정한다. 현재 Python 검사는 가짜 SDK와 실제 loopback HTTP 경계, Node 검사는 모의 gateway 계약을 확인한다. 실모델 검증을 대신하지 않는다.

Figma는 기존 저장함의 핀맵 표기와 [웹 Handoff](https://www.figma.com/design/ejriXVtLOBDSwZ336vDKlZ?node-id=28-877)를 갱신했다. 새 분석 패널의 Figma 화면은 아직 작성하지 않았다. [디자인 변경 기록](figma-sync.md)과 [검증 기록](verification.md)을 확인한다.
