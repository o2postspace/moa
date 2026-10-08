# 핀맵 · 선택 사항인 AnyJev 실행 서비스

핀맵 서버가 사용자가 제공한 캡션·OCR·전사 텍스트의 분류를 요청할 때 연결할 수 있는 별도 서비스다. AnyJev는 고정 선택지를 next-token 분포에서 읽는다. 이 서비스는 이미지·영상·Instagram URL을 읽거나 내려받지 않으며 장소명·주소·날짜를 새로 생성하지 않는다. Instagram 공개 oEmbed HTML은 원문 표시만 하고 분석 자료로 사용하지 않는다.

현재 PC에는 연결된 모델 endpoint가 없으며, 2026-10-08 확인한 사용 가능한 RAM은 약 1.1 GiB였다. **이 PC에서 torch·모델을 설치하거나 실행하지 않았다.** 실제 모델 정확도·한국어 분류 품질·응답 속도·토큰 비용 절감은 검증하지 않았다. SDK 없는 설정·HTTP 경계 검사는 실제 추론 성공과 구분한다.

## 설치 없이 확인

저장소 루트에서 Python 3.10 이상으로 실행한다. 두 명령은 모델 SDK를 가져오거나 가중치를 다운로드하지 않는다.

```powershell
python services/anyjev/worker.py --dry-run
python -m unittest discover -s services/anyjev -p test_worker.py -v
```

`--dry-run` 결과의 `model_loaded:false`, `memory_checked:false`는 설정만 읽었다는 뜻이다. 모델 이름·SDK 버전·CPU/float32·loopback 주소·요청 제한을 표시한다. 공개 호스트, 다른 모델, CUDA 장치, 범위를 벗어난 포트는 거부한다.

## CPU 서비스: 충분한 메모리가 있는 별도 환경에서 선택

CPU 실험은 공식 `morriszjm/Tacit-1.7B`로 고정한다. FP32 가중치만 약 6.8 GB라는 산술 추정이며 로드 중 복사·활성값·KV cache·OS와 다른 앱 메모리는 별도로 필요하다. 시작 직전 **사용 가능한 물리 RAM이 8 GiB 이상**인지 확인하고 부족하거나 측정에 실패하면 SDK import 전에 종료한다. 이 문턱은 실행 성공이나 속도를 보장하지 않는다. Linux의 측정은 `sysconf`의 사용 가능한 페이지를 사용하므로 컨테이너 할당량·실제 모델 최대 사용량은 별도 확인이 필요하다.

실제 실행용 가상 환경은 웹앱의 npm 의존성과 분리한다. 아래 설치·실행은 충분한 메모리를 확보한 컴퓨터에서 필요할 때 직접 한다. 첫 모델 로드는 Hugging Face에서 가중치를 내려받으므로 이 저장소에 모델 파일을 넣지 않는다.

```powershell
python -m venv .venv-anyjev
.\.venv-anyjev\Scripts\python.exe -m pip install -r services/anyjev/requirements.txt
.\.venv-anyjev\Scripts\python.exe services/anyjev/worker.py
```

Linux에서는 같은 requirements를 별도 venv에 설치하고 해당 환경의 Python으로 `worker.py`를 실행한다. `requirements.txt`는 배포된 `anyjev[hf]==0.3.0`만 정확히 고정한다. upstream은 numpy≥1.24, torch≥2.3, transformers≥4.53의 범위를 제공하며 전체 transitive lock를 제공하지 않는다. 실제 설치 후 Python·torch·transformers·AnyJev의 해석된 버전을 기록해야 재현할 수 있다.

실행기는 `engine="transformers"`, `dtype="float32"`, `device_map=None`, `batch_size=1`을 사용한다. SDK를 가져오기 전에 해당 프로세스의 CUDA 장치를 숨겨 CPU에서 실행한다. `adaptive=False`, `max_cot_share=0`, `cot_max_tokens=0`으로 긴 CoT 생성을 껐다. official SDK의 `AutoTokenizer`·`AutoModelForCausalLM` 로드는 remote code 실행을 켜지 않는 기본값을 사용하며, 실행기는 임의 checkpoint나 코드 경로를 받지 않는다. `trust_remote_code`를 Tacit 함수 인자로 덧붙이지 않는다: 0.3.0의 해당 함수는 이 옵션을 model loader에 전달하는 인터페이스가 아니다.

## 웹앱 서버와 연결

웹앱 루트의 로컬 환경 파일에서 서버 전용 값으로 설정한다. 기존 환경 파일·키를 덮어쓰지 않는다.

```dotenv
ANYJEV_BASE_URL=http://127.0.0.1:8100
```

OpenAI API key는 필요하지 않다. 브라우저가 8100에 직접 요청하지 않고 기존 핀맵 API 서버를 거친다. 연결값을 넣는 것만으로 실제 모델 실행·정확도가 검증됐다고 표시하지 않는다. 웹앱의 증거 전처리·응답 검증·보류 판단은 별도 Node 어댑터에서 수행한다.

CPU 실행기는 공식 `anyjev.serve.make_server`의 `/health`, `/v1/stats`, `/v1/decide` 동작을 재사용하고 HTTP 입력을 제한한다.

| 항목 | 실행기의 제한 |
| --- | --- |
| 호스트 | `127.0.0.1`만, 기본 포트 8100·허용 포트 1–65535 |
| 본문 | UTF-8 JSON, Content-Length 필수, 64 KiB, Transfer-Encoding 거부 |
| 결정 | `choice`만, `state` 8000자·`question` 1000자, 공백 포함 |
| 선택지 | 서로 다른 2–26개, 각각 120자 이하 |
| 배치 | `{"items":[...]}`의 1–8개, 중첩 배치·임의 필드 거부 |
| 동시 결정 | 요청 1개만, 추가 요청은 429; HTTP 읽기 10초 제한 |
| 로그·오류 | HTTP 요청·state·추론 trace 로그 없음, upstream 오류 본문 가림 |

단건은 `{"state":"사용자가 제공한 텍스트","question":"콘텐츠 분류","options":["restaurant","cafe","event","other"],"kind":"choice"}`다. 배치 응답은 `{"decisions":[...]}`이며 결정마다 `answer`, `index`, `probs`, `margin`, `route`가 있다. CPU 실행기는 `one_forward`만 사용한다. 입력 prefill 연산도 발생하므로 생성 토큰이 없다는 사실을 무비용으로 설명하지 않는다.

SDK에서 다른 선택지의 log probability가 `-inf`이면 `margin`이 `+inf`가 될 수 있다. 공식 stock gateway의 기본 JSON 인코더는 이 값을 표준 JSON이 아닌 `Infinity`로 출력할 수 있다. 이 CPU 래퍼는 성공 응답의 단건 또는 `decisions` 목록에서 **유한하지 않은 margin만 `null`로 표현**한다. 확률은 원래의 유한한 값을 유지하며 유한하지 않은 확률이나 다른 비표준 JSON 값이 있으면 일반 오류 500으로 거부한다. 원래 응답은 수정하지 않고 복사하며 margin을 0 등으로 꾸미지 않는다. Node 어댑터는 `margin:null`을 받아 확률값으로 판단한다. 외부 stock gateway를 그대로 사용하여 `Infinity`가 반환되면 Node 어댑터의 표준 JSON 파싱은 실패하고 502 오류로 분석을 보류할 수 있다. 외부 환경도 같은 JSON 호환 처리를 적용한 뒤 실제 연결을 검증해야 한다.

공식 gateway에는 인증이 없고 stock gateway의 본문은 무제한이다. 이 래퍼도 사용자 인증을 제공하지 않으므로 개발 loopback 전용이다. 0.0.0.0으로 바꾸거나 터널을 공개하지 않는다. 로컬의 다른 프로세스까지 사용자별로 격리하는 구조는 아니다. 본문 읽기 시간 제한은 모델 추론 시간 제한이나 취소 보장이 아니다.

## GPU·vLLM: 이미 준비한 별도 서버를 사용할 때

지속적인 사용에는 사용량·품질을 측정한 GPU 서버를 별도로 준비할 수 있다. 아래는 이미 운영자가 준비한 Linux/vLLM 환경의 연결 예시이며 현재 PC에서 설치하거나 실행하지 않았다. CUDA·vLLM·모델 설치와 GPU 메모리 적합성은 해당 환경의 검증 범위다. Tacit 2B·9B는 Qwen3.5 기반으로 Transformers 5 이상 등 추가 제약이 있다.

```sh
vllm serve morriszjm/Tacit-1.7B --host 127.0.0.1 --port 8000
python -m anyjev.serve --model morriszjm/Tacit-1.7B --upstream http://127.0.0.1:8000 --port 8100 --cot-max-tokens 0
```

위 stock gateway는 `--adaptive`를 넣지 않아 CoT를 끈다. Python gateway를 실행하는 별도 서버 환경에는 `anyjev[client]==0.3.0`과 호환 tokenizer가 필요하다. GPU 예시는 CPU 래퍼의 추가 HTTP 제한을 자동 제공하지 않는다. 운영자가 입력 제한·인증·동시 요청·추론 제한을 따로 마련해야 한다. 공식 stock gateway의 자체 인증 없음과 입력 한계를 유지한 채 외부 주소로 연결하지 않는다.

이미 접근 권한이 있는 원격 서버를 쓸 때는 SSH가 로컬 loopback으로만 전달하도록 설정할 수 있다.

```sh
ssh -N -L 127.0.0.1:8100:127.0.0.1:8100 developer@your-server
```

이후 웹앱은 같은 `ANYJEV_BASE_URL=http://127.0.0.1:8100`을 사용한다. SSH 접속·외부 서버 비용·모델 실행은 이 작업에서 수행하지 않았다.

## 연구 수치·라이선스·재현 기준

조사 기준은 2026-10-08 공식 소스 commit [`d458d13968eec0e2cfa8c81b64629b96cf5cb4a9`](https://github.com/nokia-applied-research/AnyJev/commit/d458d13968eec0e2cfa8c81b64629b96cf5cb4a9)와 [PyPI 0.3.0 배포 metadata](https://pypi.org/pypi/anyjev/0.3.0/json)다. main의 배포 이후 변경과 PyPI package는 같은 파일 목록이라고 가정하지 않는다. 0.3.0 wheel SHA-256은 `24217f23eecb3859353d625b89e0047d02c70c8ce993f956e118d7e39b9dcf3f`이다.

SDK·Tacit checkpoint는 [Apache-2.0](https://github.com/nokia-applied-research/AnyJev/blob/main/LICENSE)이며 연구 데이터셋의 라이선스는 [THIRD_PARTY](https://github.com/nokia-applied-research/AnyJev/blob/main/THIRD_PARTY.md)에서 구분한다. SDK 소스·가중치·데이터셋을 복사해 이 저장소에 넣지 않았다.

[공식 README](https://github.com/nokia-applied-research/AnyJev)의 처리량·분류 결과는 특정 연구 데이터셋에서 측정했다. 한국어 Instagram 장소 추출·릴스 분석이나 핀맵 서비스의 비용 절감률이 아니다. [한계 문서](https://github.com/nokia-applied-research/AnyJev/blob/main/docs/limitations.md)는 개별 결정 평가, 모델 지식·선택지 순서·추가 추론 비용의 한계를 명시한다. [연구 보고서](https://arxiv.org/abs/2610.00831), [모델 카드](https://huggingface.co/morriszjm/Tacit-1.7B), [실행 코드](https://github.com/nokia-applied-research/AnyJev/blob/main/anyjev/tacit.py), [공식 gateway](https://github.com/nokia-applied-research/AnyJev/blob/main/anyjev/serve.py)를 근거로 확인했다.

실제 절감률은 같은 승인된 샘플·추출 목표로 baseline과 비교해야 한다. 정확도·보류율·잘못 확정한 필드·요청 수·prefill/생성 토큰·지연 시간·서버 비용을 함께 기록한다. gateway는 input-token usage를 반환하지 않으므로 토크나이저를 실행하기 전에는 문자 감소를 실제 토큰 절감으로 표시하지 않는다.
