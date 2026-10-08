"""Optional, loopback-only AnyJev CPU worker. No SDK is imported in dry-run mode."""

from __future__ import annotations

import argparse
import ctypes
import io
import json
import math
import os
import sys
import threading
from dataclasses import dataclass
from importlib import metadata
from typing import Callable, Sequence

SDK_VERSION = "0.3.0"
MODEL = "morriszjm/Tacit-1.7B"
HOST = "127.0.0.1"
MIN_AVAILABLE_MEMORY = 8 * 1024**3
MAX_BODY_BYTES = 64 * 1024
MAX_STATE_CHARS = 8_000
MAX_QUESTION_CHARS = 1_000
MAX_OPTION_CHARS = 120
MAX_OPTIONS = 26
MAX_BATCH_ITEMS = 8
REQUEST_TIMEOUT_SECONDS = 10


class WorkerConfigurationError(ValueError):
    """An actionable configuration failure that never includes submitted state."""


@dataclass(frozen=True)
class WorkerConfig:
    host: str = HOST
    port: int = 8100
    model: str = MODEL
    device: str = "cpu"
    dtype: str = "float32"
    adaptive: bool = False
    cot_max_tokens: int = 0
    dry_run: bool = False


def validate_config(config: WorkerConfig) -> None:
    if config.host != HOST:
        raise WorkerConfigurationError("호스트는 127.0.0.1만 사용할 수 있습니다.")
    if type(config.port) is not int or not 1 <= config.port <= 65_535:
        raise WorkerConfigurationError("포트는 1부터 65535 사이의 정수여야 합니다.")
    if config.model != MODEL:
        raise WorkerConfigurationError("이 CPU 실행기는 공식 Tacit-1.7B만 사용합니다.")
    if config.device != "cpu" or config.dtype != "float32":
        raise WorkerConfigurationError("이 실행기의 장치와 자료형은 cpu / float32로 고정됩니다.")
    if config.adaptive is not False or config.cot_max_tokens != 0:
        raise WorkerConfigurationError("추론 생성은 꺼야 합니다: adaptive=False, cot_max_tokens=0.")
    if type(config.dry_run) is not bool:
        raise WorkerConfigurationError("dry_run은 참 또는 거짓이어야 합니다.")


def parse_config(argv: Sequence[str] | None = None) -> WorkerConfig:
    parser = argparse.ArgumentParser(description="핀맵용 선택 사항: AnyJev CPU 분류 서비스")
    parser.add_argument("--host", choices=[HOST], default=HOST)
    parser.add_argument("--port", type=int, default=8100)
    parser.add_argument("--model", choices=[MODEL], default=MODEL)
    parser.add_argument("--device", choices=["cpu"], default="cpu")
    parser.add_argument("--dry-run", action="store_true", help="SDK·모델 없이 설정만 확인합니다.")
    args = parser.parse_args(argv)
    config = WorkerConfig(**vars(args))
    try:
        validate_config(config)
    except WorkerConfigurationError as error:
        parser.error(str(error))
    return config


def public_config(config: WorkerConfig) -> dict:
    return {
        "model": config.model,
        "sdk_version": SDK_VERSION,
        "host": config.host,
        "port": config.port,
        "device": config.device,
        "dtype": config.dtype,
        "adaptive": config.adaptive,
        "cot_max_tokens": config.cot_max_tokens,
        "minimum_available_memory_gib": MIN_AVAILABLE_MEMORY // 1024**3,
        "limits": {
            "body_bytes": MAX_BODY_BYTES,
            "state_characters": MAX_STATE_CHARS,
            "question_characters": MAX_QUESTION_CHARS,
            "options": MAX_OPTIONS,
            "batch_items": MAX_BATCH_ITEMS,
            "concurrent_decision_requests": 1,
        },
        "model_loaded": False,
        "memory_checked": False,
    }


def available_memory_bytes() -> int:
    """Read free physical memory without importing torch or downloading a model."""
    if sys.platform == "win32":
        class MemoryStatusEx(ctypes.Structure):
            _fields_ = [
                ("dwLength", ctypes.c_uint32),
                ("dwMemoryLoad", ctypes.c_uint32),
                ("ullTotalPhys", ctypes.c_uint64),
                ("ullAvailPhys", ctypes.c_uint64),
                ("ullTotalPageFile", ctypes.c_uint64),
                ("ullAvailPageFile", ctypes.c_uint64),
                ("ullTotalVirtual", ctypes.c_uint64),
                ("ullAvailVirtual", ctypes.c_uint64),
                ("ullAvailExtendedVirtual", ctypes.c_uint64),
            ]

        try:
            status = MemoryStatusEx()
            status.dwLength = ctypes.sizeof(status)
            read_status = ctypes.WinDLL("kernel32", use_last_error=True).GlobalMemoryStatusEx
            read_status.argtypes = [ctypes.POINTER(MemoryStatusEx)]
            read_status.restype = ctypes.c_int
            if not read_status(ctypes.byref(status)):
                raise WorkerConfigurationError("Windows의 사용 가능한 메모리를 확인하지 못했습니다.")
            return int(status.ullAvailPhys)
        except (AttributeError, OSError):
            raise WorkerConfigurationError("Windows 메모리 확인을 사용할 수 없습니다.") from None
    if sys.platform.startswith("linux"):
        try:
            pages = os.sysconf("SC_AVPHYS_PAGES")
            page_size = os.sysconf("SC_PAGE_SIZE")
            if pages < 0 or page_size <= 0:
                raise ValueError
            return int(pages * page_size)
        except (AttributeError, OSError, ValueError):
            raise WorkerConfigurationError("Linux의 사용 가능한 메모리를 확인하지 못했습니다.") from None
    raise WorkerConfigurationError("CPU 실행 전 Windows 또는 Linux에서 메모리를 확인해야 합니다.")


def check_memory(available: int) -> None:
    if type(available) is not int or available < 0:
        raise WorkerConfigurationError("사용 가능한 메모리 측정값이 올바르지 않습니다.")
    if available < MIN_AVAILABLE_MEMORY:
        raise WorkerConfigurationError(
            "사용 가능한 RAM이 8 GiB 미만이라 모델을 불러오지 않았습니다. "
            "별도 서버를 사용하거나 충분한 메모리를 확보한 뒤 실행하세요. "
            "8 GiB도 로드 성공을 보장하는 값은 아닙니다."
        )


def validate_decision_request(request: object) -> None:
    """Bound text-only choice requests before the upstream SDK sees them."""
    if not isinstance(request, dict):
        raise WorkerConfigurationError("요청은 JSON 객체여야 합니다.")
    if "items" in request:
        items = request["items"]
        if set(request) != {"items"} or not isinstance(items, list) or not 1 <= len(items) <= MAX_BATCH_ITEMS:
            raise WorkerConfigurationError("배치 요청은 1부터 8개의 결정만 포함할 수 있습니다.")
        for item in items:
            validate_choice(item)
    else:
        validate_choice(request)


def validate_choice(item: object) -> None:
    if not isinstance(item, dict) or not {"state", "question", "options"} <= set(item):
        raise WorkerConfigurationError("state·question·options가 필요합니다.")
    if not set(item) <= {"state", "question", "options", "kind"} or item.get("kind", "choice") != "choice":
        raise WorkerConfigurationError("텍스트 choice 결정만 지원합니다.")
    if not isinstance(item["state"], str) or not 1 <= len(item["state"].strip()) <= MAX_STATE_CHARS:
        raise WorkerConfigurationError("state는 8000자 이하의 비어 있지 않은 텍스트여야 합니다.")
    if len(item["state"]) > MAX_STATE_CHARS:
        raise WorkerConfigurationError("state는 공백을 포함해 8000자 이하여야 합니다.")
    if not isinstance(item["question"], str) or not 1 <= len(item["question"].strip()) <= MAX_QUESTION_CHARS:
        raise WorkerConfigurationError("question은 1000자 이하의 비어 있지 않은 텍스트여야 합니다.")
    if len(item["question"]) > MAX_QUESTION_CHARS:
        raise WorkerConfigurationError("question은 공백을 포함해 1000자 이하여야 합니다.")
    options = item["options"]
    if not isinstance(options, list) or not 2 <= len(options) <= MAX_OPTIONS:
        raise WorkerConfigurationError("서로 다른 선택지 2부터 26개가 필요합니다.")
    if any(not isinstance(option, str) or not option.strip() or len(option) > MAX_OPTION_CHARS for option in options):
        raise WorkerConfigurationError("각 선택지는 120자 이하의 비어 있지 않은 텍스트여야 합니다.")
    if len(set(options)) != len(options):
        raise WorkerConfigurationError("선택지는 서로 달라야 합니다.")


def strict_decision_response(response: object) -> object:
    """Represent an unbounded SDK margin as null, never as an invented finite value."""
    def decision_copy(decision: object) -> dict:
        if not isinstance(decision, dict) or not isinstance(decision.get("probs"), dict):
            raise ValueError("invalid decision response")
        probabilities = decision["probs"]
        if not probabilities or any(
            type(probability) not in (int, float) or not math.isfinite(probability)
            for probability in probabilities.values()
        ):
            raise ValueError("non-finite probabilities")
        copy = dict(decision)
        margin = copy.get("margin")
        if type(margin) in (int, float) and not math.isfinite(margin):
            copy["margin"] = None
        return copy

    if isinstance(response, dict) and "decisions" in response:
        if not isinstance(response["decisions"], list):
            raise ValueError("invalid batch response")
        return {**response, "decisions": [decision_copy(item) for item in response["decisions"]]}
    if isinstance(response, dict) and "probs" in response:
        return decision_copy(response)
    return response


def guard_server(server):
    """Keep AnyJev's routes/readout while adding bounded local HTTP ingress."""
    upstream_handler = server.RequestHandlerClass
    admission = threading.BoundedSemaphore(1)

    def handle_error(_request, _client_address):
        # ThreadingHTTPServer otherwise prints exception text and a traceback to stderr.
        print("AnyJev HTTP 요청 처리 중 오류가 발생했습니다.", file=sys.stderr)

    class BoundedHandler(upstream_handler):
        def setup(self):
            super().setup()
            self.connection.settimeout(REQUEST_TIMEOUT_SECONDS)

        def _send(self, code, obj):
            # Upstream exceptions may include submitted strings; return no raw error details.
            if code >= 400:
                obj = {"error": "AnyJev 결정 요청을 처리하지 못했습니다."}
            elif code == 200:
                try:
                    obj = strict_decision_response(obj)
                    # Reject any remaining non-standard JSON rather than replacing other fields.
                    json.dumps(obj, allow_nan=False)
                except (TypeError, ValueError, OverflowError):
                    code = 500
                    obj = {"error": "AnyJev 결정 응답을 확인하지 못했습니다."}
            return super()._send(code, obj)

        def _reject(self, code: int, message: str):
            return super()._send(code, {"error": message})

        def do_POST(self):
            self.close_connection = True
            if self.path != "/v1/decide":
                return self._reject(404, "지원하지 않는 경로입니다.")
            if self.headers.get("Transfer-Encoding") is not None:
                return self._reject(400, "Content-Length 요청만 지원합니다.")
            lengths = self.headers.get_all("Content-Length", [])
            if len(lengths) != 1 or not 1 <= len(lengths[0]) <= 6 or not lengths[0].isascii() or not lengths[0].isdecimal():
                return self._reject(400, "Content-Length가 필요합니다.")
            length = int(lengths[0])
            if not 1 <= length <= MAX_BODY_BYTES:
                return self._reject(413, "요청은 64 KiB 이하여야 합니다.")
            if self.headers.get_content_type() != "application/json":
                return self._reject(415, "application/json 요청만 지원합니다.")
            if not admission.acquire(blocking=False):
                return self._reject(429, "결정 요청을 처리 중입니다. 잠시 후 다시 시도하세요.")
            original_stream = self.rfile
            try:
                body = original_stream.read(length)
                if len(body) != length:
                    return self._reject(400, "요청 본문이 완전하지 않습니다.")
                try:
                    request = json.loads(body.decode("utf-8"))
                    validate_decision_request(request)
                except (UnicodeDecodeError, json.JSONDecodeError, RecursionError, WorkerConfigurationError):
                    return self._reject(400, "텍스트 길이·선택지·JSON 요청 형식을 확인하세요.")
                self.rfile = io.BytesIO(body)
                return super().do_POST()
            except (OSError, TimeoutError):
                return self._reject(408, "요청을 읽는 시간이 초과됐습니다.")
            finally:
                self.rfile = original_stream
                admission.release()

        def log_message(self, fmt, *args):
            # Neither HTTP paths nor submitted evidence/model reasoning enter stdout.
            pass

    server.RequestHandlerClass = BoundedHandler
    server.handle_error = handle_error
    return server


def load_runtime():
    try:
        if metadata.version("anyjev") != SDK_VERSION:
            raise WorkerConfigurationError("별도 환경에 anyjev[hf]==0.3.0을 설치하세요.")
        from anyjev import Tacit
        from anyjev.serve import make_server
    except (ImportError, metadata.PackageNotFoundError):
        raise WorkerConfigurationError("별도 환경에 services/anyjev/requirements.txt를 설치하세요.") from None
    return Tacit, make_server


def run_worker(
    config: WorkerConfig,
    *,
    memory_reader: Callable[[], int] = available_memory_bytes,
    runtime_loader: Callable = load_runtime,
    writer: Callable[[str], None] = print,
) -> None:
    validate_config(config)
    if config.dry_run:
        writer(json.dumps(public_config(config), ensure_ascii=False, indent=2))
        return
    check_memory(memory_reader())
    # Tacit's loader automatically chooses CUDA if visible; hide it before importing torch.
    os.environ["CUDA_VISIBLE_DEVICES"] = ""
    Tacit, make_server = runtime_loader()
    tacit = Tacit.from_pretrained(
        config.model,
        engine="transformers",
        dtype=config.dtype,
        device_map=None,
        adaptive=False,
        max_cot_share=0.0,
        cot_max_tokens=0,
        batch_size=1,
    )
    server = guard_server(make_server(tacit, config.host, config.port))
    writer(f"AnyJev CPU worker: http://{config.host}:{config.port}/v1/decide · one_forward only")
    try:
        server.serve_forever()
    finally:
        server.server_close()


def main(argv: Sequence[str] | None = None) -> int:
    if sys.version_info < (3, 10):
        print("AnyJev worker에는 Python 3.10 이상이 필요합니다.", file=sys.stderr)
        return 2
    config = parse_config(argv)
    try:
        run_worker(config)
    except WorkerConfigurationError as error:
        print(str(error), file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        return 0
    except Exception:
        # Model/download failures can include URLs or evidence. Keep startup errors generic.
        print("AnyJev 실행에 실패했습니다. 설치·모델 다운로드·메모리·포트 상태를 확인하세요.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
