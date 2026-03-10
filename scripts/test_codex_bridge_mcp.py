import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts.codex_bridge_mcp import (
    CodexBridge,
    ConversationSession,
    ConversationState,
    Turn,
    _build_context_prompt,
    _detect_needs_input,
    _now_iso,
)


class ConversationStateTests(unittest.TestCase):
    """Tests for the state machine transitions."""

    def _make_session(
        self, state: ConversationState = ConversationState.IDLE
    ) -> ConversationSession:
        return ConversationSession(
            session_id="test-001",
            state=state,
            workspace="/tmp/test",
            created_at=_now_iso(),
            last_activity=_now_iso(),
        )

    def test_idle_allows_asking(self) -> None:
        session = self._make_session(ConversationState.IDLE)
        session.transition(ConversationState.ASKING)
        self.assertEqual(session.state, ConversationState.ASKING)

    def test_idle_allows_delegating(self) -> None:
        session = self._make_session(ConversationState.IDLE)
        session.transition(ConversationState.DELEGATING)
        self.assertEqual(session.state, ConversationState.DELEGATING)

    def test_idle_allows_reviewing(self) -> None:
        session = self._make_session(ConversationState.IDLE)
        session.transition(ConversationState.REVIEWING)
        self.assertEqual(session.state, ConversationState.REVIEWING)

    def test_idle_rejects_completed(self) -> None:
        session = self._make_session(ConversationState.IDLE)
        with self.assertRaises(ValueError):
            session.transition(ConversationState.COMPLETED)

    def test_asking_allows_completed(self) -> None:
        session = self._make_session(ConversationState.ASKING)
        session.transition(ConversationState.COMPLETED)
        self.assertEqual(session.state, ConversationState.COMPLETED)

    def test_asking_allows_waiting_context(self) -> None:
        session = self._make_session(ConversationState.ASKING)
        session.transition(ConversationState.WAITING_CONTEXT)
        self.assertEqual(session.state, ConversationState.WAITING_CONTEXT)

    def test_asking_allows_error(self) -> None:
        session = self._make_session(ConversationState.ASKING)
        session.transition(ConversationState.ERROR)
        self.assertEqual(session.state, ConversationState.ERROR)

    def test_asking_rejects_delegating(self) -> None:
        session = self._make_session(ConversationState.ASKING)
        with self.assertRaises(ValueError):
            session.transition(ConversationState.DELEGATING)

    def test_waiting_context_allows_asking(self) -> None:
        session = self._make_session(ConversationState.WAITING_CONTEXT)
        session.transition(ConversationState.ASKING)
        self.assertEqual(session.state, ConversationState.ASKING)

    def test_waiting_context_allows_delegating(self) -> None:
        session = self._make_session(ConversationState.WAITING_CONTEXT)
        session.transition(ConversationState.DELEGATING)
        self.assertEqual(session.state, ConversationState.DELEGATING)

    def test_completed_allows_idle(self) -> None:
        session = self._make_session(ConversationState.COMPLETED)
        session.transition(ConversationState.IDLE)
        self.assertEqual(session.state, ConversationState.IDLE)

    def test_completed_rejects_asking(self) -> None:
        session = self._make_session(ConversationState.COMPLETED)
        with self.assertRaises(ValueError):
            session.transition(ConversationState.ASKING)

    def test_error_allows_idle(self) -> None:
        session = self._make_session(ConversationState.ERROR)
        session.transition(ConversationState.IDLE)
        self.assertEqual(session.state, ConversationState.IDLE)

    def test_error_rejects_asking(self) -> None:
        session = self._make_session(ConversationState.ERROR)
        with self.assertRaises(ValueError):
            session.transition(ConversationState.ASKING)

    def test_delegating_allows_completed(self) -> None:
        session = self._make_session(ConversationState.DELEGATING)
        session.transition(ConversationState.COMPLETED)
        self.assertEqual(session.state, ConversationState.COMPLETED)

    def test_reviewing_allows_completed(self) -> None:
        session = self._make_session(ConversationState.REVIEWING)
        session.transition(ConversationState.COMPLETED)
        self.assertEqual(session.state, ConversationState.COMPLETED)

    def test_reviewing_rejects_waiting_context(self) -> None:
        session = self._make_session(ConversationState.REVIEWING)
        with self.assertRaises(ValueError):
            session.transition(ConversationState.WAITING_CONTEXT)


class TurnTests(unittest.TestCase):
    """Tests for Turn creation and serialization."""

    def test_turn_to_dict(self) -> None:
        turn = Turn(
            role="antigravity",
            content="Hello",
            tool_used="codex_ask",
            timestamp="2026-03-10T00:00:00.000000Z",
            state_before="idle",
            state_after="asking",
        )
        d = turn.to_dict()
        self.assertEqual(d["role"], "antigravity")
        self.assertEqual(d["content"], "Hello")
        self.assertEqual(d["tool_used"], "codex_ask")

    def test_session_add_turn(self) -> None:
        session = ConversationSession(
            session_id="t-001",
            state=ConversationState.ASKING,
            workspace="/tmp/test",
            created_at=_now_iso(),
            last_activity=_now_iso(),
        )
        session.add_turn(
            role="antigravity",
            content="What is this?",
            tool_used="codex_ask",
            state_before="idle",
            state_after="asking",
        )
        self.assertEqual(len(session.turns), 1)
        self.assertEqual(session.turns[0].role, "antigravity")


class DetectNeedsInputTests(unittest.TestCase):
    """Tests for needs-input pattern detection."""

    def test_detects_need_for_info(self) -> None:
        self.assertTrue(_detect_needs_input("I need more information about the database."))

    def test_detects_clarification_request(self) -> None:
        self.assertTrue(_detect_needs_input("Could you clarify what you mean?"))

    def test_no_false_positive_on_normal_response(self) -> None:
        self.assertFalse(_detect_needs_input("The function returns a list of users."))

    def test_case_insensitive(self) -> None:
        self.assertTrue(_detect_needs_input("PLEASE PROVIDE the file path."))


class ContextPromptTests(unittest.TestCase):
    """Tests for context prompt building."""

    def test_empty_session_returns_empty(self) -> None:
        session = ConversationSession(
            session_id="c-001",
            state=ConversationState.IDLE,
            workspace="/tmp",
            created_at=_now_iso(),
            last_activity=_now_iso(),
        )
        result = _build_context_prompt(session)
        self.assertEqual(result, "")

    def test_includes_recent_turns(self) -> None:
        session = ConversationSession(
            session_id="c-002",
            state=ConversationState.ASKING,
            workspace="/tmp",
            created_at=_now_iso(),
            last_activity=_now_iso(),
        )
        session.add_turn(
            role="antigravity",
            content="What does function X do?",
            tool_used="codex_ask",
        )
        session.add_turn(
            role="codex",
            content="Function X parses JSON.",
            tool_used="codex_ask",
        )
        result = _build_context_prompt(session)
        self.assertIn("Antigravity", result)
        self.assertIn("Codex", result)
        self.assertIn("Function X", result)


class CodexBridgeTests(unittest.TestCase):
    """Tests for the CodexBridge class."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.workspace = Path(self.temp_dir.name).resolve()
        scripts_dir = Path(__file__).resolve().parent
        self.bridge = CodexBridge(
            workspace=self.workspace,
            codex_command="codex",
            schema_path=scripts_dir / "codex_review_schema.json",
            conversation_schema_path=scripts_dir / "codex_conversation_schema.json",
            codex_timeout_sec=300,
            codex_reasoning_effort=None,
            codex_profile="9router",
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_get_or_create_session_creates_new(self) -> None:
        session = self.bridge.get_or_create_session(None, self.workspace)
        self.assertEqual(session.state, ConversationState.IDLE)
        self.assertIn(session.session_id, self.bridge.sessions)

    def test_get_or_create_session_reuses_existing(self) -> None:
        s1 = self.bridge.get_or_create_session("my-session", self.workspace)
        s2 = self.bridge.get_or_create_session("my-session", self.workspace)
        self.assertIs(s1, s2)

    def test_get_session_status_returns_dict(self) -> None:
        session = self.bridge.get_or_create_session("status-test", self.workspace)
        status = self.bridge.get_session_status("status-test")
        self.assertEqual(status["session_id"], "status-test")
        self.assertEqual(status["state"], "idle")

    def test_get_session_status_unknown_session_raises(self) -> None:
        with self.assertRaises(KeyError):
            self.bridge.get_session_status("nonexistent")

    def test_provide_context_rejects_wrong_state(self) -> None:
        self.bridge.get_or_create_session("ctx-test", self.workspace)
        with self.assertRaises(ValueError):
            self.bridge.provide_context(
                session_id="ctx-test",
                context="some context",
            )

    def test_provide_context_rejects_unknown_session(self) -> None:
        with self.assertRaises(KeyError):
            self.bridge.provide_context(
                session_id="unknown",
                context="some context",
            )

    @mock.patch("scripts.codex_bridge_mcp.subprocess.run")
    @mock.patch.object(CodexBridge, "prepare_codex_home")
    def test_codex_ask_returns_response(
        self,
        mock_prepare: mock.Mock,
        mock_run: mock.Mock,
    ) -> None:
        mock_prepare.return_value = self.workspace
        mock_run.return_value = mock.Mock(
            returncode=0,
            stdout="This is a test response from Codex.",
            stderr="",
        )

        result = self.bridge.run_codex_ask(
            workspace=self.workspace,
            question="What is Python?",
        )

        self.assertEqual(result["state"], "completed")
        self.assertIn("test response", result["response"])
        self.assertFalse(result["needs_input"])
        self.assertIn("session_id", result)

    @mock.patch("scripts.codex_bridge_mcp.subprocess.run")
    @mock.patch.object(CodexBridge, "prepare_codex_home")
    def test_codex_ask_detects_needs_input(
        self,
        mock_prepare: mock.Mock,
        mock_run: mock.Mock,
    ) -> None:
        mock_prepare.return_value = self.workspace
        mock_run.return_value = mock.Mock(
            returncode=0,
            stdout="I need more information about the database schema.",
            stderr="",
        )

        result = self.bridge.run_codex_ask(
            workspace=self.workspace,
            question="Review the DB layer",
        )

        self.assertEqual(result["state"], "waiting_context")
        self.assertTrue(result["needs_input"])
        self.assertIsNotNone(result["context_needed"])

    @mock.patch("scripts.codex_bridge_mcp.subprocess.run")
    @mock.patch.object(CodexBridge, "prepare_codex_home")
    def test_codex_ask_uses_read_only_sandbox(
        self,
        mock_prepare: mock.Mock,
        mock_run: mock.Mock,
    ) -> None:
        mock_prepare.return_value = self.workspace
        mock_run.return_value = mock.Mock(
            returncode=0, stdout="response", stderr=""
        )

        self.bridge.run_codex_ask(
            workspace=self.workspace, question="Hello"
        )

        call_args = mock_run.call_args
        command = call_args[0][0] if call_args[0] else call_args[1].get("args", [])
        # Verify read-only sandbox
        self.assertIn("-s", command)
        ro_index = command.index("-s")
        self.assertEqual(command[ro_index + 1], "read-only")

    @mock.patch("scripts.codex_bridge_mcp.subprocess.run")
    @mock.patch.object(CodexBridge, "prepare_codex_home")
    def test_codex_ask_handles_timeout(
        self,
        mock_prepare: mock.Mock,
        mock_run: mock.Mock,
    ) -> None:
        mock_prepare.return_value = self.workspace
        mock_run.side_effect = subprocess.TimeoutExpired(cmd="codex", timeout=300)

        result = self.bridge.run_codex_ask(
            workspace=self.workspace,
            question="Something slow",
        )

        self.assertEqual(result["state"], "error")
        self.assertIn("timed out", result["response"])

    @mock.patch("scripts.codex_bridge_mcp.subprocess.run")
    @mock.patch.object(CodexBridge, "prepare_codex_home")
    def test_codex_ask_handles_spawn_error(
        self,
        mock_prepare: mock.Mock,
        mock_run: mock.Mock,
    ) -> None:
        mock_prepare.return_value = self.workspace
        mock_run.side_effect = FileNotFoundError("codex not found")

        result = self.bridge.run_codex_ask(
            workspace=self.workspace,
            question="Will fail",
        )

        self.assertEqual(result["state"], "error")
        self.assertIn("Failed to start Codex", result["response"])

    @mock.patch("scripts.codex_bridge_mcp.subprocess.run")
    @mock.patch.object(CodexBridge, "prepare_codex_home")
    def test_codex_delegate_uses_auto_edit_sandbox(
        self,
        mock_prepare: mock.Mock,
        mock_run: mock.Mock,
    ) -> None:
        mock_prepare.return_value = self.workspace

        def fake_codex_run(command, **_):
            output_path = Path(command[command.index("-o") + 1])
            output_path.write_text(
                json.dumps(
                    {
                        "status": "completed",
                        "response": "Done",
                        "files_modified": ["test.py"],
                        "context_needed": None,
                        "follow_up_suggestions": [],
                    }
                ),
                encoding="utf-8",
            )
            return mock.Mock(returncode=0, stdout="", stderr="")

        mock_run.side_effect = fake_codex_run

        result = self.bridge.run_codex_delegate(
            workspace=self.workspace,
            task="Create a test file",
        )

        call_args = mock_run.call_args
        command = call_args[0][0] if call_args[0] else call_args[1].get("args", [])
        self.assertIn("-s", command)
        ae_index = command.index("-s")
        self.assertEqual(command[ae_index + 1], "auto-edit")
        self.assertEqual(result["state"], "completed")
        self.assertEqual(result["files_modified"], ["test.py"])

    @mock.patch("scripts.codex_bridge_mcp.subprocess.run")
    @mock.patch.object(CodexBridge, "prepare_codex_home")
    def test_codex_delegate_handles_needs_input(
        self,
        mock_prepare: mock.Mock,
        mock_run: mock.Mock,
    ) -> None:
        mock_prepare.return_value = self.workspace

        def fake_codex_run(command, **_):
            output_path = Path(command[command.index("-o") + 1])
            output_path.write_text(
                json.dumps(
                    {
                        "status": "needs_input",
                        "response": "Which database do you use?",
                        "files_modified": [],
                        "context_needed": "Database type (PostgreSQL, MySQL, etc.)",
                        "follow_up_suggestions": [],
                    }
                ),
                encoding="utf-8",
            )
            return mock.Mock(returncode=0, stdout="", stderr="")

        mock_run.side_effect = fake_codex_run

        result = self.bridge.run_codex_delegate(
            workspace=self.workspace,
            task="Set up database migrations",
        )

        self.assertEqual(result["state"], "waiting_context")
        self.assertTrue(result["needs_input"])
        self.assertIn("Database type", result["context_needed"])

    @mock.patch("scripts.codex_bridge_mcp.subprocess.run")
    @mock.patch.object(CodexBridge, "prepare_codex_home")
    def test_codex_ask_persists_session_artifact(
        self,
        mock_prepare: mock.Mock,
        mock_run: mock.Mock,
    ) -> None:
        mock_prepare.return_value = self.workspace
        mock_run.return_value = mock.Mock(
            returncode=0, stdout="The answer is 42.", stderr=""
        )

        result = self.bridge.run_codex_ask(
            workspace=self.workspace,
            question="What is the meaning of life?",
        )

        session_json = Path(result["artifacts"]["session_json"])
        self.assertTrue(session_json.exists())
        persisted = json.loads(session_json.read_text(encoding="utf-8"))
        self.assertEqual(persisted["session_id"], result["session_id"])
        self.assertEqual(len(persisted["turns"]), 2)  # antigravity + codex

    @mock.patch("scripts.codex_bridge_mcp.subprocess.run")
    @mock.patch.object(CodexBridge, "prepare_codex_home")
    def test_session_continues_multi_turn(
        self,
        mock_prepare: mock.Mock,
        mock_run: mock.Mock,
    ) -> None:
        mock_prepare.return_value = self.workspace
        mock_run.return_value = mock.Mock(
            returncode=0, stdout="First answer.", stderr=""
        )

        result1 = self.bridge.run_codex_ask(
            workspace=self.workspace,
            question="First question",
        )
        sid = result1["session_id"]
        self.assertEqual(result1["state"], "completed")

        mock_run.return_value = mock.Mock(
            returncode=0, stdout="Second answer with context.", stderr=""
        )
        result2 = self.bridge.run_codex_ask(
            workspace=self.workspace,
            question="Follow-up question",
            session_id=sid,
        )

        self.assertEqual(result2["session_id"], sid)
        session = self.bridge.sessions[sid]
        self.assertEqual(len(session.turns), 4)  # 2 turns per ask

    def test_bridge_tool_list_has_four_tools(self) -> None:
        tools = CodexBridge.bridge_tool_list()
        names = {t["name"] for t in tools}
        self.assertEqual(
            names,
            {"codex_ask", "codex_delegate", "provide_context", "get_session_status"},
        )

    def test_session_serialization_roundtrip(self) -> None:
        session = ConversationSession(
            session_id="serial-001",
            state=ConversationState.ASKING,
            workspace="/tmp/test",
            created_at="2026-03-10T00:00:00.000000Z",
            last_activity="2026-03-10T00:00:01.000000Z",
        )
        session.add_turn(
            role="antigravity",
            content="Hello",
            tool_used="codex_ask",
            state_before="idle",
            state_after="asking",
        )
        d = session.to_dict()
        json_text = json.dumps(d)
        loaded = json.loads(json_text)
        self.assertEqual(loaded["session_id"], "serial-001")
        self.assertEqual(loaded["state"], "asking")
        self.assertEqual(len(loaded["turns"]), 1)

    def test_session_markdown_generation(self) -> None:
        session = ConversationSession(
            session_id="md-001",
            state=ConversationState.COMPLETED,
            workspace="/tmp/test",
            created_at="2026-03-10T00:00:00.000000Z",
            last_activity="2026-03-10T00:00:01.000000Z",
        )
        session.add_turn(
            role="antigravity",
            content="What is X?",
            tool_used="codex_ask",
            state_before="idle",
            state_after="asking",
        )
        session.add_turn(
            role="codex",
            content="X is a variable.",
            tool_used="codex_ask",
            state_before="asking",
            state_after="completed",
        )
        md = CodexBridge._session_to_markdown(session)
        self.assertIn("# Codex Conversation", md)
        self.assertIn("Antigravity", md)
        self.assertIn("Codex", md)
        self.assertIn("X is a variable", md)


if __name__ == "__main__":
    unittest.main()
