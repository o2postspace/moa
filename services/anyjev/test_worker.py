"""Standard-library tests: no AnyJev SDK, weights, GPU, or API key required."""

from __future__ import annotations

import contextlib
import http.client
import http.server
import io
import json
import os
import threading
import unittest
from dataclasses import replace
from unittest import mock

import worker


def choice(state="성수에 새로 생긴 카페입니다."):
    return {
        "state": state,
        "question": "콘텐츠의 분류는 무엇인가요?",
        "options": ["restaurant", "cafe", "event", "other"],
        "kind": "choice",
    }


class ConfigurationTests(unittest.TestCase):
    def test_defaults_are_fixed_cpu_one_forward(self):
        config = worker.parse_config([])
        self.assertEqual((config.host, config.port, config.model), ("127.0.0.1", 8100, worker.MODEL))
        self.assertEqual((config.device, config.dtype, config.adaptive, config.cot_max_tokens), ("cpu", "float32", False, 0))

    def test_public_hosts_models_devices_and_bad_ports_are_refused(self):
        arguments = [
            ["--host", "0.0.0.0"], ["--host", "localhost"],
            ["--model", "unverified/model"], ["--device", "cuda"],
            ["--port", "0"], ["--port", "65536"], ["--port", "not-a-port"],
        ]
        for argv in arguments:
            with self.subTest(argv=argv), contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
                worker.parse_config(argv)

    def test_port_bounds_are_accepted(self):
        for port in (1, 65_535):
            self.assertEqual(worker.parse_config(["--port", str(port)]).port, port)

    def test_direct_configuration_cannot_enable_cot_or_change_device(self):
        base = worker.WorkerConfig()
        for config in (
            replace(base, adaptive=True), replace(base, cot_max_tokens=1),
            replace(base, device="cuda"), replace(base, dtype="bfloat16"),
            replace(base, model="custom/model"), replace(base, host="0.0.0.0"),
            replace(base, port=True), replace(base, dry_run="yes"),
        ):
            with self.subTest(config=config), self.assertRaises(worker.WorkerConfigurationError):
                worker.validate_config(config)

    def test_dry_run_never_reads_memory_or_imports_runtime(self):
        memory = mock.Mock(side_effect=AssertionError("memory must not be read"))
        runtime = mock.Mock(side_effect=AssertionError("SDK must not be imported"))
        output = []
        with mock.patch.dict(os.environ, {"CUDA_VISIBLE_DEVICES": "unchanged"}):
            worker.run_worker(worker.WorkerConfig(dry_run=True), memory_reader=memory, runtime_loader=runtime, writer=output.append)
            self.assertEqual(os.environ["CUDA_VISIBLE_DEVICES"], "unchanged")
        payload = json.loads(output[0])
        self.assertFalse(payload["model_loaded"])
        self.assertFalse(payload["memory_checked"])
        self.assertEqual(payload["limits"]["state_characters"], 8_000)
        memory.assert_not_called()
        runtime.assert_not_called()

    def test_low_memory_stops_before_sdk_import_and_environment_change(self):
        runtime = mock.Mock(side_effect=AssertionError("SDK must not be imported"))
        with mock.patch.dict(os.environ, {"CUDA_VISIBLE_DEVICES": "unchanged"}):
            with self.assertRaisesRegex(worker.WorkerConfigurationError, "8 GiB"):
                worker.run_worker(worker.WorkerConfig(), memory_reader=lambda: 1_100_000_000, runtime_loader=runtime)
            self.assertEqual(os.environ["CUDA_VISIBLE_DEVICES"], "unchanged")
        runtime.assert_not_called()

    def test_memory_floor_and_invalid_values(self):
        worker.check_memory(worker.MIN_AVAILABLE_MEMORY)
        for available in (worker.MIN_AVAILABLE_MEMORY - 1, -1, None, True):
            with self.subTest(available=available), self.assertRaises(worker.WorkerConfigurationError):
                worker.check_memory(available)

    def test_fake_runtime_receives_no_generation_and_server_always_closes(self):
        class FakeHandler:
            pass

        server = mock.Mock(RequestHandlerClass=FakeHandler)
        model = mock.Mock()
        tacit = mock.Mock()
        tacit.from_pretrained.return_value = model
        make_server = mock.Mock(return_value=server)
        writer = mock.Mock()
        with mock.patch.dict(os.environ, {"CUDA_VISIBLE_DEVICES": "must-be-hidden"}):
            worker.run_worker(worker.WorkerConfig(), memory_reader=lambda: 12 * 1024**3,
                              runtime_loader=lambda: (tacit, make_server), writer=writer)
            self.assertEqual(os.environ["CUDA_VISIBLE_DEVICES"], "")
        tacit.from_pretrained.assert_called_once_with(
            worker.MODEL, engine="transformers", dtype="float32", device_map=None,
            adaptive=False, max_cot_share=0.0, cot_max_tokens=0, batch_size=1,
        )
        make_server.assert_called_once_with(model, "127.0.0.1", 8100)
        self.assertTrue(issubclass(server.RequestHandlerClass, FakeHandler))
        server.serve_forever.assert_called_once()
        server.server_close.assert_called_once()
        self.assertNotIn("성수", writer.call_args.args[0])

    def test_serve_failure_still_closes_server(self):
        server = mock.Mock(RequestHandlerClass=type("FakeHandler", (), {}))
        server.serve_forever.side_effect = RuntimeError("test")
        tacit = mock.Mock()
        with mock.patch.dict(os.environ), self.assertRaises(RuntimeError):
            worker.run_worker(worker.WorkerConfig(), memory_reader=lambda: worker.MIN_AVAILABLE_MEMORY,
                              runtime_loader=lambda: (tacit, mock.Mock(return_value=server)), writer=lambda _: None)
        server.server_close.assert_called_once()

    def test_unpinned_sdk_is_refused_before_importing_it(self):
        with mock.patch.object(worker.metadata, "version", return_value="0.4.0"):
            with self.assertRaisesRegex(worker.WorkerConfigurationError, "0.3.0"):
                worker.load_runtime()


class RequestValidationTests(unittest.TestCase):
    def test_single_and_batch_choice_requests(self):
        worker.validate_decision_request(choice())
        worker.validate_decision_request({"items": [choice()] * worker.MAX_BATCH_ITEMS})

    def test_state_and_question_limits_include_whitespace(self):
        worker.validate_decision_request(choice("가" * worker.MAX_STATE_CHARS))
        for item in (
            choice("가" * (worker.MAX_STATE_CHARS + 1)), choice(" " * 8_000 + "x"),
            choice(""), choice("   "), {**choice(), "question": "가" * 1_001},
        ):
            with self.subTest(length=len(item["state"])), self.assertRaises(worker.WorkerConfigurationError):
                worker.validate_decision_request(item)

    def test_options_types_duplicates_and_unknown_fields_are_refused(self):
        for item in (
            {**choice(), "options": ["same", "same"]}, {**choice(), "options": ["one"]},
            {**choice(), "options": [str(i) for i in range(27)]},
            {**choice(), "options": ["a", 1]}, {**choice(), "options": ["a", " "]},
            {**choice(), "options": ["a", "x" * 121]},
            {**choice(), "kind": "yes_no"}, {**choice(), "adaptive": True},
            {**choice(), "state": {"image": "data:..."}}, {}, None,
        ):
            with self.subTest(item_type=type(item).__name__), self.assertRaises(worker.WorkerConfigurationError):
                worker.validate_decision_request(item)

    def test_empty_oversized_nested_and_mixed_batches_are_refused(self):
        for request in (
            {"items": []}, {"items": [choice()] * 9}, {"items": "bad"},
            {"items": [{"items": [choice()]}]}, {"items": [choice()], "state": "extra"},
            {"items": [choice(), {"state": "missing fields"}]},
        ):
            with self.subTest(request=request), self.assertRaises(worker.WorkerConfigurationError):
                worker.validate_decision_request(request)


class LocalHttpGuardTests(unittest.TestCase):
    """Exercise only a local standard-library fake gateway, never a real model."""

    @classmethod
    def setUpClass(cls):
        cls.readouts = []

        class FakeGateway(http.server.BaseHTTPRequestHandler):
            def _send(self, code, obj):
                body = json.dumps(obj).encode()
                self.send_response(code)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def do_GET(self):
                self._send(200, {"ok": True})

            def do_POST(self):
                request = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                if request.get("state") == "private-evidence":
                    return self._send(400, {"error": "model error: private-evidence"})
                if request.get("state") == "unexpected-private-evidence":
                    raise Exception("unexpected model failure: private-evidence")
                sdk_decision = {
                    "answer": "cafe", "index": 1, "probs": {"restaurant": 0.0, "cafe": 1.0},
                    "margin": float("inf"), "route": "one_forward",
                }
                if request.get("state") == "sdk-infinite-margin":
                    return self._send(200, sdk_decision)
                if "items" in request:
                    return self._send(200, {"decisions": [sdk_decision for _ in request["items"]]})
                if request.get("state") == "sdk-invalid-probability":
                    return self._send(200, {**sdk_decision, "probs": {"restaurant": 0.0, "cafe": float("nan")}})
                cls.readouts.append(request)
                self._send(200, {"answer": "cafe", "route": "one_forward"})

        cls.server = worker.guard_server(http.server.ThreadingHTTPServer(("127.0.0.1", 0), FakeGateway))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def request(self, body=None, headers=None, method="POST"):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        try:
            connection.request(method, "/v1/decide" if method == "POST" else "/health", body=body,
                               headers=headers or {"Content-Type": "application/json"})
            response = connection.getresponse()
            return response.status, response.read().decode()
        finally:
            connection.close()

    def test_valid_request_reaches_fake_readout_and_health_is_preserved(self):
        request = choice()
        code, body = self.request(json.dumps(request).encode())
        self.assertEqual(code, 200)
        self.assertEqual(json.loads(body)["route"], "one_forward")
        self.assertEqual(self.readouts[-1], request)
        self.assertEqual(self.request(method="GET")[0], 200)

    def test_bad_json_invalid_evidence_and_transfer_encoding_do_not_reach_model(self):
        count = len(self.readouts)
        for body, headers in (
            (b"{broken", None), (json.dumps(choice("x" * 8_001)).encode(), None),
            (b"{}", {"Content-Type": "application/json", "Transfer-Encoding": "chunked"}),
            (b"{}", {"Content-Type": "text/plain"}),
        ):
            with self.subTest(headers=headers):
                self.assertIn(self.request(body, headers)[0], (400, 415))
        self.assertEqual(len(self.readouts), count)

    def test_over_body_limit_is_refused_before_readout(self):
        count = len(self.readouts)
        code, _ = self.request(b"x" * (worker.MAX_BODY_BYTES + 1))
        self.assertEqual(code, 413)
        self.assertEqual(len(self.readouts), count)

    def test_raw_upstream_errors_are_not_exposed(self):
        code, body = self.request(json.dumps(choice("private-evidence")).encode())
        self.assertEqual(code, 400)
        self.assertNotIn("private-evidence", body)

    def test_unexpected_handler_exception_does_not_leak_evidence_or_traceback(self):
        output = io.StringIO()
        with contextlib.redirect_stderr(output), self.assertRaises(http.client.RemoteDisconnected):
            self.request(json.dumps(choice("unexpected-private-evidence")).encode())
        self.assertIn("AnyJev HTTP", output.getvalue())
        self.assertNotIn("private-evidence", output.getvalue())
        self.assertNotIn("Traceback", output.getvalue())

    def test_sdk_infinite_margin_single_and_batch_are_strict_json_null(self):
        def reject_constant(_value):
            raise ValueError("non-standard JSON constant")

        requests = [choice("sdk-infinite-margin"), {"items": [choice(), choice()]}]
        for request in requests:
            with self.subTest(batch="items" in request):
                code, body = self.request(json.dumps(request).encode())
                self.assertEqual(code, 200)
                payload = json.loads(body, parse_constant=reject_constant)
                decisions = payload["decisions"] if "items" in request else [payload]
                for decision in decisions:
                    self.assertIsNone(decision["margin"])
                    self.assertEqual(decision["probs"], {"restaurant": 0.0, "cafe": 1.0})
                self.assertNotIn("Infinity", body)

    def test_nonfinite_sdk_probability_is_rejected_without_inventing_a_value(self):
        code, body = self.request(json.dumps(choice("sdk-invalid-probability")).encode())
        self.assertEqual(code, 500)
        payload = json.loads(body)
        self.assertNotIn("probs", payload)
        self.assertNotIn("NaN", body)
        self.assertNotIn("sdk-invalid-probability", body)

    def test_sdk_response_copy_preserves_original_and_finite_margin(self):
        original = {"probs": {"a": 0.75, "b": 0.25}, "margin": float("inf")}
        normalised = worker.strict_decision_response(original)
        self.assertIsNone(normalised["margin"])
        self.assertEqual(original["margin"], float("inf"))
        finite = {"probs": {"a": 0.75, "b": 0.25}, "margin": 1.2}
        self.assertEqual(worker.strict_decision_response(finite), finite)


if __name__ == "__main__":
    unittest.main()
