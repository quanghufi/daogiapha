#!/usr/bin/env python3
"""MCP bridge for bi-directional Antigravity <-> Codex CLI conversation.

Extends the review-only bridge with general ask/delegate tools
and a state machine to manage multi-turn conversation flow.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import textwrap
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, BinaryIO

from scripts.codex_review_mcp import (
    CodexReviewBridge,
    make_error,
    make_success,
    read_framed_message,
    write_framed_message,
)

DEFAULT_PROTOCOL_VERSION = "2025-03-26"

VALID_TRANSITIONS: dict[str, set[str]] = {
    "idle": {"asking", "delegating", "reviewing"},
    "asking": {"completed", "waiting_context", "error"},
    "delegating": {"completed", "waiting_context", "error"},
    "reviewing": {"completed", "error"},
    "waiting_context": {"asking", "delegating", "error"},
    "completed": {"idle", "error"},
    "error": {"idle", "error"},
}

NEEDS_INPUT_PATTERNS = [
    "I need more information",
    "Could you clarify",
    "Please provide",
    "I don't have enough context",
    "Can you share",
    "What do you mean by",
    "Which file",
    "Could you specify",
]


class ConversationState(str, Enum):
    IDLE = "idle"
    ASKING = "asking"
    DELEGATING = "delegating"
    REVIEWING = "reviewing"
    WAITING_CONTEXT = "waiting_context"
    COMPLETED = "completed"
    ERROR = "error"


@dataclass
class Turn:
    role: str
    content: str
    tool_used: str
    timestamp: str
    artifacts: dict[str, str] = field(default_factory=dict)
    state_before: str = ""
    state_after: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class ConversationSession:
    session_id: str
    state: ConversationState
    workspace: str
    created_at: str
    last_activity: str
    turns: list[Turn] = field(default_factory=list)
    pending_tool: str = ""
    pending_prompt: str = ""
    pending_instructions: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "session_id": self.session_id,
            "state": self.state.value,
            "workspace": self.workspace,
            "created_at": self.created_at,
            "last_activity": self.last_activity,
            "turns": [t.to_dict() for t in self.turns],
            "pending_tool": self.pending_tool,
            "pending_prompt": self.pending_prompt,
            "pending_instructions": self.pending_instructions,
        }

    def transition(self, new_state: ConversationState) -> None:
        current = self.state.value
        target = new_state.value
        allowed = VALID_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise ValueError(
                f"Invalid state transition: {current} -> {target}. "
                f"Allowed: {', '.join(sorted(allowed))}"
            )
        self.state = new_state
        self.last_activity = _now_iso()

    def add_turn(
        self,
        role: str,
        content: str,
        tool_used: str,
        artifacts: dict[str, str] | None = None,
        state_before: str = "",
        state_after: str = "",
    ) -> Turn:
        turn = Turn(
            role=role,
            content=content,
            tool_used=tool_used,
            timestamp=_now_iso(),
            artifacts=artifacts or {},
            state_before=state_before,
            state_after=state_after,
        )
        self.turns.append(turn)
        self.last_activity = turn.timestamp
        return turn


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def _detect_needs_input(text: str) -> bool:
    lower = text.lower()
    return any(pattern.lower() in lower for pattern in NEEDS_INPUT_PATTERNS)


def _build_context_prompt(session: ConversationSession, max_turns: int = 6) -> str:
    """Build a context string from recent conversation turns."""
    recent = session.turns[-max_turns:]
    if not recent:
        return ""

    lines = ["Previous conversation context:"]
    for turn in recent:
        # Skip provide_context turns to avoid duplicating context
        if turn.tool_used == "provide_context":
            continue
        role_label = {
            "antigravity": "Antigravity",
            "codex": "Codex",
            "system": "System",
        }.get(turn.role, turn.role)
        lines.append(f"[{role_label}]: {turn.content[:500]}")
    return "\n".join(lines) if len(lines) > 1 else ""


class CodexBridge(CodexReviewBridge):
    """Extends CodexReviewBridge with general conversation and state machine."""

    def __init__(
        self,
        workspace: Path,
        codex_command: str,
        schema_path: Path,
        conversation_schema_path: Path,
        codex_timeout_sec: int,
        codex_reasoning_effort: str | None,
        codex_profile: str | None,
    ) -> None:
        super().__init__(
            workspace=workspace,
            codex_command=codex_command,
            schema_path=schema_path,
            codex_timeout_sec=codex_timeout_sec,
            codex_reasoning_effort=codex_reasoning_effort,
            codex_profile=codex_profile,
        )
        self.conversation_schema_path = conversation_schema_path.resolve()
        self.conversation_schema = json.loads(
            self.conversation_schema_path.read_text(encoding="utf-8")
        )
        self.sessions: dict[str, ConversationSession] = {}



    def get_or_create_session(
        self, session_id: str | None, workspace: Path
    ) -> ConversationSession:
        if session_id and session_id in self.sessions:
            session = self.sessions[session_id]
            resolved = str(workspace.resolve())
            if session.workspace != resolved:
                raise ValueError(
                    f"Session '{session_id}' belongs to workspace "
                    f"'{session.workspace}', not '{resolved}'. "
                    f"Start a new session for this workspace."
                )
            return session

        new_id = session_id or uuid.uuid4().hex[:12]
        now = _now_iso()
        session = ConversationSession(
            session_id=new_id,
            state=ConversationState.IDLE,
            workspace=str(workspace.resolve()),
            created_at=now,
            last_activity=now,
        )
        self.sessions[new_id] = session
        return session

    def run_codex_ask(
        self,
        workspace: Path,
        question: str,
        session_id: str | None = None,
        instructions: str | None = None,
    ) -> dict[str, Any]:
        """Ask Codex a question in read-only mode, return text response."""
        workspace = workspace.resolve()
        session = self.get_or_create_session(session_id, workspace)
        state_before = session.state.value

        if session.state == ConversationState.WAITING_CONTEXT:
            session.transition(ConversationState.ASKING)
        elif session.state in (ConversationState.COMPLETED, ConversationState.ERROR):
            session.transition(ConversationState.IDLE)
            session.transition(ConversationState.ASKING)
        else:
            session.transition(ConversationState.ASKING)

        session.pending_tool = "codex_ask"
        # Only update pending_prompt on fresh calls, not on resume from provide_context
        if state_before != ConversationState.WAITING_CONTEXT.value:
            session.pending_prompt = question
            session.pending_instructions = instructions

        context = _build_context_prompt(session)
        prompt = self._build_ask_prompt(question, instructions, context)

        # Don't record duplicate turn when resuming from provide_context
        if state_before != ConversationState.WAITING_CONTEXT.value:
            session.add_turn(
                role="antigravity",
                content=question,
                tool_used="codex_ask",
                state_before=state_before,
                state_after=session.state.value,
            )

        try:
            codex_home = self.prepare_codex_home(workspace)
            env = os.environ.copy()
            env["HOME"] = str(codex_home)
            env["USERPROFILE"] = str(codex_home)
            env["CODEX_HOME"] = str(codex_home / ".codex")

            command = [
                self.codex_command,
                "exec",
                "-C",
                str(workspace),
                "-s",
                "read-only",
            ]
            if self.codex_profile:
                command.extend(["-p", self.codex_profile])
            if self.codex_reasoning_effort:
                command.extend(
                    ["-c", f'model_reasoning_effort="{self.codex_reasoning_effort}"']
                )
            command.extend(["--color", "never", "-"])

            completed = subprocess.run(
                command,
                input=prompt,
                capture_output=True,
                text=True,
                check=False,
                env=env,
                timeout=self.codex_timeout_sec,
            )

            if completed.returncode != 0:
                detail = self.summarize_process_output(
                    completed.stdout, completed.stderr
                )
                raise RuntimeError(
                    "Codex ask failed with non-zero exit code."
                    + (f" {detail}" if detail else "")
                )

            response_text = completed.stdout.strip()
            if not response_text:
                response_text = "(Codex returned empty response)"

            needs_input = _detect_needs_input(response_text)

            if needs_input:
                session.transition(ConversationState.WAITING_CONTEXT)
            else:
                session.transition(ConversationState.COMPLETED)

            session.add_turn(
                role="codex",
                content=response_text,
                tool_used="codex_ask",
                state_before="asking",
                state_after=session.state.value,
            )

            artifacts = self._safe_write_artifact(workspace, session)

            return {
                "session_id": session.session_id,
                "state": session.state.value,
                "response": response_text,
                "needs_input": needs_input,
                "context_needed": response_text if needs_input else None,
                "workspace": str(workspace),
                "artifacts": artifacts,
            }

        except RuntimeError as exc:
            session.transition(ConversationState.ERROR)
            session.add_turn(
                role="system",
                content=str(exc),
                tool_used="codex_ask",
                state_before="asking",
                state_after="error",
            )
            artifacts = self._safe_write_artifact(workspace, session)
            return {
                "session_id": session.session_id,
                "state": "error",
                "response": str(exc),
                "needs_input": False,
                "context_needed": None,
                "workspace": str(workspace),
                "artifacts": artifacts,
            }
        except subprocess.TimeoutExpired:
            session.transition(ConversationState.ERROR)
            session.add_turn(
                role="system",
                content=f"Timeout after {self.codex_timeout_sec}s",
                tool_used="codex_ask",
                state_before="asking",
                state_after="error",
            )
            artifacts = self._safe_write_artifact(workspace, session)
            return {
                "session_id": session.session_id,
                "state": "error",
                "response": f"Codex timed out after {self.codex_timeout_sec} seconds.",
                "needs_input": False,
                "context_needed": None,
                "workspace": str(workspace),
                "artifacts": artifacts,
            }
        except OSError as exc:
            session.transition(ConversationState.ERROR)
            session.add_turn(
                role="system",
                content=str(exc),
                tool_used="codex_ask",
                state_before="asking",
                state_after="error",
            )
            artifacts = self._safe_write_artifact(workspace, session)
            return {
                "session_id": session.session_id,
                "state": "error",
                "response": f"Failed to start Codex: {exc}",
                "needs_input": False,
                "context_needed": None,
                "workspace": str(workspace),
                "artifacts": artifacts,
            }

    def run_codex_delegate(
        self,
        workspace: Path,
        task: str,
        session_id: str | None = None,
        instructions: str | None = None,
    ) -> dict[str, Any]:
        """Delegate a task to Codex in auto-edit mode."""
        workspace = workspace.resolve()
        session = self.get_or_create_session(session_id, workspace)
        state_before = session.state.value

        if session.state == ConversationState.WAITING_CONTEXT:
            session.transition(ConversationState.DELEGATING)
        elif session.state in (ConversationState.COMPLETED, ConversationState.ERROR):
            session.transition(ConversationState.IDLE)
            session.transition(ConversationState.DELEGATING)
        else:
            session.transition(ConversationState.DELEGATING)

        session.pending_tool = "codex_delegate"
        # Only update pending_prompt on fresh calls, not on resume from provide_context
        if state_before != ConversationState.WAITING_CONTEXT.value:
            session.pending_prompt = task
            session.pending_instructions = instructions

        context = _build_context_prompt(session)
        prompt = self._build_delegate_prompt(task, instructions, context)

        # Don't record duplicate turn when resuming from provide_context
        if state_before != ConversationState.WAITING_CONTEXT.value:
            session.add_turn(
                role="antigravity",
                content=task,
                tool_used="codex_delegate",
                state_before=state_before,
                state_after=session.state.value,
            )

        output_path: Path | None = None
        try:
            codex_home = self.prepare_codex_home(workspace)
            env = os.environ.copy()
            env["HOME"] = str(codex_home)
            env["USERPROFILE"] = str(codex_home)
            env["CODEX_HOME"] = str(codex_home / ".codex")

            with tempfile.NamedTemporaryFile(
                delete=False, suffix=".json"
            ) as temp_output:
                output_path = Path(temp_output.name)

            command = [
                self.codex_command,
                "exec",
                "-C",
                str(workspace),
                "-s",
                "auto-edit",
            ]
            if self.codex_profile:
                command.extend(["-p", self.codex_profile])
            if self.codex_reasoning_effort:
                command.extend(
                    ["-c", f'model_reasoning_effort="{self.codex_reasoning_effort}"']
                )
            command.extend(
                [
                    "--color",
                    "never",
                    "--output-schema",
                    str(self.conversation_schema_path),
                    "-o",
                    str(output_path),
                    "-",
                ]
            )

            completed = subprocess.run(
                command,
                input=prompt,
                capture_output=True,
                text=True,
                check=False,
                env=env,
                timeout=self.codex_timeout_sec,
            )

            try:
                if completed.returncode != 0:
                    detail = self.summarize_process_output(
                        completed.stdout, completed.stderr
                    )
                    raise RuntimeError(
                        "Codex delegate failed with non-zero exit code."
                        + (f" {detail}" if detail else "")
                    )

                result = json.loads(output_path.read_text(encoding="utf-8"))
                self.validate_json_schema(
                    result, self.conversation_schema, "$"
                )
            except (RuntimeError, json.JSONDecodeError, ValueError, OSError) as exc:
                result = {
                    "status": "error",
                    "response": str(exc),
                    "files_modified": [],
                    "context_needed": None,
                    "follow_up_suggestions": [
                        "Check Codex output and retry the task."
                    ],
                }

            status = result.get("status", "completed")
            response_text = result.get("response", "")
            needs_input = status == "needs_input" or _detect_needs_input(response_text)

            if status == "error":
                session.transition(ConversationState.ERROR)
            elif needs_input:
                session.transition(ConversationState.WAITING_CONTEXT)
            else:
                session.transition(ConversationState.COMPLETED)

            session.add_turn(
                role="codex",
                content=response_text,
                tool_used="codex_delegate",
                state_before="delegating",
                state_after=session.state.value,
            )

            artifacts = self._safe_write_artifact(workspace, session)

            return {
                "session_id": session.session_id,
                "state": session.state.value,
                "response": response_text,
                "result": result,
                "needs_input": needs_input,
                "context_needed": result.get("context_needed") or (response_text if needs_input else None),
                "files_modified": result.get("files_modified", []),
                "follow_up_suggestions": result.get("follow_up_suggestions", []),
                "workspace": str(workspace),
                "artifacts": artifacts,
                "codex_stdout": completed.stdout.strip(),
                "codex_stderr": completed.stderr.strip(),
            }

        except subprocess.TimeoutExpired:
            session.transition(ConversationState.ERROR)
            session.add_turn(
                role="system",
                content=f"Timeout after {self.codex_timeout_sec}s",
                tool_used="codex_delegate",
                state_before="delegating",
                state_after="error",
            )
            artifacts = self._safe_write_artifact(workspace, session)
            return {
                "session_id": session.session_id,
                "state": "error",
                "response": f"Codex timed out after {self.codex_timeout_sec} seconds.",
                "result": None,
                "needs_input": False,
                "context_needed": None,
                "files_modified": [],
                "follow_up_suggestions": ["Retry with simpler task or increase timeout."],
                "workspace": str(workspace),
                "artifacts": artifacts,
            }
        except OSError as exc:
            session.transition(ConversationState.ERROR)
            session.add_turn(
                role="system",
                content=str(exc),
                tool_used="codex_delegate",
                state_before="delegating",
                state_after="error",
            )
            artifacts = self._safe_write_artifact(workspace, session)
            return {
                "session_id": session.session_id,
                "state": "error",
                "response": f"Failed to start Codex: {exc}",
                "result": None,
                "needs_input": False,
                "context_needed": None,
                "files_modified": [],
                "follow_up_suggestions": [
                    "Verify Codex CLI is installed and accessible."
                ],
                "workspace": str(workspace),
                "artifacts": artifacts,
            }
        finally:
            if output_path is not None:
                output_path.unlink(missing_ok=True)

    def provide_context(
        self,
        session_id: str,
        context: str,
        workspace: Path | None = None,
    ) -> dict[str, Any]:
        """Provide additional context when session is in WAITING_CONTEXT state."""
        if session_id not in self.sessions:
            raise KeyError(f"Session not found: {session_id}")

        session = self.sessions[session_id]
        if session.state != ConversationState.WAITING_CONTEXT:
            raise ValueError(
                f"Cannot provide context in state '{session.state.value}'. "
                f"Expected 'waiting_context'."
            )

        ws = workspace.resolve() if workspace else Path(session.workspace)
        pending = session.pending_tool
        original_prompt = session.pending_prompt

        # Validate workspace before mutating session
        resolved_ws = str(ws)
        if session.workspace != resolved_ws:
            raise ValueError(
                f"Session '{session_id}' belongs to workspace "
                f"'{session.workspace}', not '{resolved_ws}'."
            )

        # Build combined prompt: always original + only latest context
        combined = (
            f"{original_prompt}\n\nAdditional context provided:\n{context}"
            if original_prompt
            else context
        )

        session.add_turn(
            role="antigravity",
            content=context,
            tool_used="provide_context",
            state_before=session.state.value,
            state_after=session.state.value,
        )

        if pending == "codex_ask":
            return self.run_codex_ask(
                workspace=ws,
                question=combined,
                session_id=session_id,
            )
        elif pending == "codex_delegate":
            return self.run_codex_delegate(
                workspace=ws,
                task=combined,
                session_id=session_id,
                instructions=session.pending_instructions,
            )
        else:
            raise ValueError(f"Unknown pending tool: {pending}")



    def get_session_status(self, session_id: str) -> dict[str, Any]:
        """Return current session state and conversation history."""
        if session_id not in self.sessions:
            raise KeyError(f"Session not found: {session_id}")
        session = self.sessions[session_id]
        return session.to_dict()

    def _build_ask_prompt(
        self,
        question: str,
        instructions: str | None,
        context: str,
    ) -> str:
        extra = instructions.strip() if instructions else ""
        parts = [
            "You are a helpful AI assistant working alongside Antigravity.",
            "Answer the following question concisely and accurately.",
            "",
        ]
        if context:
            parts.extend([context, ""])
        parts.extend([f"Question: {question}", ""])
        if extra:
            parts.extend([f"Additional instructions: {extra}", ""])
        return "\n".join(parts)

    def _build_delegate_prompt(
        self,
        task: str,
        instructions: str | None,
        context: str,
    ) -> str:
        extra = instructions.strip() if instructions else ""

        return textwrap.dedent(
            f"""
            You are an AI coding assistant working alongside Antigravity.
            Perform the following task in the current workspace.

            {context}

            Task: {task}

            Rules:
            - Make minimal, focused changes.
            - Do not modify files unrelated to the task.
            - If you need more information, set status to "needs_input" and describe what you need in "context_needed".
            - If the task is complete, set status to "completed".
            - List all modified files in "files_modified".

            Return valid JSON matching the provided schema.

            {f'Additional instructions: {extra}' if extra else ''}
            """
        ).strip()

    def _safe_write_artifact(
        self, workspace: Path, session: ConversationSession
    ) -> dict[str, str]:
        """Write conversation artifact, returning empty dict on failure."""
        try:
            return self._write_conversation_artifact(workspace, session)
        except OSError as exc:
            import sys
            print(
                f"[codex_bridge_mcp] artifact write failed: {exc}",
                file=sys.stderr,
                flush=True,
            )
            return {}

    def _write_conversation_artifact(
        self, workspace: Path, session: ConversationSession
    ) -> dict[str, str]:
        directory = self.ensure_artifact_dir(workspace)
        json_path = directory / f"codex-session.{session.session_id}.json"
        md_path = directory / f"codex-session.{session.session_id}.md"

        json_text = json.dumps(session.to_dict(), indent=2, ensure_ascii=False) + "\n"
        md_text = self._session_to_markdown(session)

        self.atomic_write_text(json_path, json_text)
        self.atomic_write_text(md_path, md_text)

        return {
            "session_json": str(json_path),
            "session_markdown": str(md_path),
        }

    @staticmethod
    def _session_to_markdown(session: ConversationSession) -> str:
        lines = [
            "# Codex Conversation",
            "",
            f"Session: {session.session_id}",
            f"State: {session.state.value}",
            f"Created: {session.created_at}",
            f"Last activity: {session.last_activity}",
            "",
            "## Turns",
            "",
        ]
        if not session.turns:
            lines.append("No turns recorded.")
        else:
            for i, turn in enumerate(session.turns, 1):
                role_label = {
                    "antigravity": "🟦 Antigravity",
                    "codex": "🟩 Codex",

                    "system": "⚙️ System",
                }.get(turn.role, turn.role)
                lines.extend(
                    [
                        f"### Turn {i} — {role_label}",
                        f"Tool: `{turn.tool_used}`  |  "
                        f"State: {turn.state_before} → {turn.state_after}",
                        "",
                        turn.content[:2000],
                        "",
                    ]
                )
        lines.append("")
        return "\n".join(lines)

    @staticmethod
    def bridge_tool_list() -> list[dict[str, Any]]:
        """Return tool definitions for the conversation bridge."""
        return [
            {
                "name": "codex_ask",
                "description": (
                    "Ask Codex CLI a question and receive a text response. "
                    "Codex runs in read-only mode and cannot modify files."
                ),
                "inputSchema": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "question": {
                            "type": "string",
                            "description": "The question to ask Codex.",
                        },
                        "workspace": {
                            "type": "string",
                            "description": "Workspace path. Defaults to the server workspace.",
                        },
                        "session_id": {
                            "type": "string",
                            "description": "Session ID for multi-turn conversation. "
                            "Omit to start a new session.",
                        },
                        "instructions": {
                            "type": "string",
                            "description": "Extra instructions for Codex.",
                        },
                    },
                    "required": ["question"],
                },
                "annotations": {
                    "readOnlyHint": True,
                    "destructiveHint": False,
                    "idempotentHint": False,
                    "openWorldHint": False,
                },
            },
            {
                "name": "codex_delegate",
                "description": (
                    "Delegate a coding task to Codex CLI. "
                    "Codex runs in auto-edit mode and can create/modify files."
                ),
                "inputSchema": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "task": {
                            "type": "string",
                            "description": "Description of the task to delegate.",
                        },
                        "workspace": {
                            "type": "string",
                            "description": "Workspace path. Defaults to the server workspace.",
                        },
                        "session_id": {
                            "type": "string",
                            "description": "Session ID for multi-turn conversation.",
                        },
                        "instructions": {
                            "type": "string",
                            "description": "Extra instructions for Codex.",
                        },
                    },
                    "required": ["task"],
                },
                "annotations": {
                    "readOnlyHint": False,
                    "destructiveHint": True,
                    "idempotentHint": False,
                    "openWorldHint": False,
                },
            },
            {
                "name": "provide_context",
                "description": (
                    "Provide additional context when a session is "
                    "waiting for more information (state: waiting_context). "
                    "Works with Codex sessions."
                ),
                "inputSchema": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "session_id": {
                            "type": "string",
                            "description": "The session ID to provide context to.",
                        },
                        "context": {
                            "type": "string",
                            "description": "The additional context or answer to the reviewer's question.",
                        },
                        "workspace": {
                            "type": "string",
                            "description": "Workspace path override.",
                        },
                    },
                    "required": ["session_id", "context"],
                },
                "annotations": {
                    "readOnlyHint": False,
                    "destructiveHint": False,
                    "idempotentHint": False,
                    "openWorldHint": False,
                },
            },
            {
                "name": "get_session_status",
                "description": (
                    "Get the current state and conversation history of a session."
                ),
                "inputSchema": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "session_id": {
                            "type": "string",
                            "description": "The session ID to check.",
                        },
                    },
                    "required": ["session_id"],
                },
                "annotations": {
                    "readOnlyHint": True,
                    "destructiveHint": False,
                    "idempotentHint": True,
                    "openWorldHint": False,
                },
            },

        ]


def to_bridge_tool_result(
    payload: dict[str, Any], is_error: bool = False
) -> dict[str, Any]:
    """Format a bridge response as an MCP tool result."""
    state = payload.get("state", "")
    response = payload.get("response", "")
    session_id = payload.get("session_id", "")
    needs_input = payload.get("needs_input", False)

    lines = [
        f"Session: {session_id}",
        f"State: {state}",
    ]
    if needs_input:
        lines.append(f"Context needed: {payload.get('context_needed', '')}")
    if response:
        lines.append(f"Response: {response[:500]}")

    files = payload.get("files_modified", [])
    if files:
        lines.append(f"Files modified: {', '.join(files)}")

    artifacts = payload.get("artifacts", {})
    for key, path in artifacts.items():
        if path:
            lines.append(f"{key}: {path}")

    return {
        "content": [
            {"type": "text", "text": "\n".join(line for line in lines if line).strip()}
        ],
        "structuredContent": payload,
        "isError": is_error,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Antigravity <-> Codex CLI conversation bridge (MCP server)"
    )
    parser.add_argument(
        "--workspace",
        default=".",
        help="Default workspace root",
    )
    parser.add_argument(
        "--codex-command",
        default=os.environ.get("CODEX_COMMAND", "codex"),
        help="Codex executable name or absolute path",
    )
    parser.add_argument(
        "--schema",
        default=str(Path(__file__).with_name("codex_review_schema.json")),
        help="Path to the review JSON schema",
    )
    parser.add_argument(
        "--conversation-schema",
        default=str(Path(__file__).with_name("codex_conversation_schema.json")),
        help="Path to the conversation JSON schema",
    )
    parser.add_argument(
        "--codex-timeout-sec",
        default=int(os.environ.get("CODEX_REVIEW_TIMEOUT_SEC", "600")),
        type=int,
        help="Timeout for a single codex exec invocation",
    )
    parser.add_argument(
        "--codex-reasoning-effort",
        default=os.environ.get("CODEX_REVIEW_REASONING"),
        help="Optional reasoning effort override",
    )
    parser.add_argument(
        "--codex-profile",
        default="9router",
        help="Codex config profile to use",
    )
    args = parser.parse_args()

    bridge = CodexBridge(
        workspace=Path(args.workspace),
        codex_command=args.codex_command,
        schema_path=Path(args.schema),
        conversation_schema_path=Path(args.conversation_schema),
        codex_timeout_sec=args.codex_timeout_sec,
        codex_reasoning_effort=args.codex_reasoning_effort,
        codex_profile=args.codex_profile,
    )

    # Import parent's tool_list for review tools
    from scripts.codex_review_mcp import to_tool_result

    while True:
        try:
            message = read_framed_message(sys.stdin.buffer)
        except Exception as exc:
            print(
                f"[codex_bridge_mcp] failed to read message: {exc}",
                file=sys.stderr,
                flush=True,
            )
            return 1

        if message is None:
            return 0

        message_id = message.get("id")
        method = message.get("method")
        params = message.get("params", {})

        if method == "initialize":
            requested_protocol = params.get(
                "protocolVersion", DEFAULT_PROTOCOL_VERSION
            )
            write_framed_message(
                sys.stdout.buffer,
                make_success(
                    message_id,
                    {
                        "protocolVersion": requested_protocol,
                        "capabilities": {"tools": {"listChanged": False}},
                        "serverInfo": {
                            "name": "codex-bridge",
                            "version": "0.2.0",
                        },
                    },
                ),
            )
            continue

        if method == "notifications/initialized":
            continue

        if method == "ping":
            write_framed_message(
                sys.stdout.buffer, make_success(message_id, {})
            )
            continue

        if method == "tools/list":
            all_tools = bridge.tool_list() + bridge.bridge_tool_list()
            write_framed_message(
                sys.stdout.buffer,
                make_success(message_id, {"tools": all_tools}),
            )
            continue

        if method == "tools/call":
            error_workspace = bridge.workspace
            try:
                tool_name = params["name"]
                tool_args = params.get("arguments", {}) or {}

                # --- Review tools (inherited) ---
                if tool_name == "run_codex_review":
                    workspace = bridge.resolve_workspace(
                        tool_args.get("workspace")
                    )
                    payload = bridge.run_codex_review(
                        workspace=workspace,
                        review_target=tool_args.get(
                            "review_target", "uncommitted"
                        ),
                        base_branch=tool_args.get("base_branch"),
                        commit=tool_args.get("commit"),
                        max_findings=int(tool_args.get("max_findings", 10)),
                        instructions=tool_args.get("instructions"),
                    )
                    write_framed_message(
                        sys.stdout.buffer,
                        make_success(message_id, to_tool_result(payload)),
                    )

                elif tool_name == "get_last_codex_review":
                    workspace = bridge.resolve_workspace(
                        tool_args.get("workspace")
                    )
                    payload = bridge.get_latest_review(workspace)
                    write_framed_message(
                        sys.stdout.buffer,
                        make_success(message_id, to_tool_result(payload)),
                    )

                # --- Conversation tools (new) ---
                elif tool_name == "codex_ask":
                    workspace = bridge.resolve_workspace(
                        tool_args.get("workspace")
                    )
                    payload = bridge.run_codex_ask(
                        workspace=workspace,
                        question=tool_args["question"],
                        session_id=tool_args.get("session_id"),
                        instructions=tool_args.get("instructions"),
                    )
                    write_framed_message(
                        sys.stdout.buffer,
                        make_success(
                            message_id,
                            to_bridge_tool_result(payload),
                        ),
                    )

                elif tool_name == "codex_delegate":
                    workspace = bridge.resolve_workspace(
                        tool_args.get("workspace")
                    )
                    payload = bridge.run_codex_delegate(
                        workspace=workspace,
                        task=tool_args["task"],
                        session_id=tool_args.get("session_id"),
                        instructions=tool_args.get("instructions"),
                    )
                    write_framed_message(
                        sys.stdout.buffer,
                        make_success(
                            message_id,
                            to_bridge_tool_result(payload),
                        ),
                    )

                elif tool_name == "provide_context":
                    workspace_raw = tool_args.get("workspace")
                    ws = (
                        bridge.resolve_workspace(workspace_raw)
                        if workspace_raw
                        else None
                    )
                    payload = bridge.provide_context(
                        session_id=tool_args["session_id"],
                        context=tool_args["context"],
                        workspace=ws,
                    )
                    write_framed_message(
                        sys.stdout.buffer,
                        make_success(
                            message_id,
                            to_bridge_tool_result(payload),
                        ),
                    )

                elif tool_name == "get_session_status":
                    payload = bridge.get_session_status(
                        session_id=tool_args["session_id"]
                    )
                    write_framed_message(
                        sys.stdout.buffer,
                        make_success(
                            message_id,
                            {
                                "content": [
                                    {
                                        "type": "text",
                                        "text": json.dumps(
                                            payload, indent=2, ensure_ascii=False
                                        ),
                                    }
                                ],
                                "structuredContent": payload,
                                "isError": False,
                            },
                        ),
                    )



                else:
                    raise KeyError(f"Unknown tool: {tool_name}")

            except Exception as exc:
                error_payload = {
                    "session_id": "",
                    "state": "error",
                    "response": str(exc),
                    "needs_input": False,
                    "context_needed": None,
                    "workspace": str(error_workspace),
                    "artifacts": {},
                }
                print(
                    f"[codex_bridge_mcp] tool error: {exc}",
                    file=sys.stderr,
                    flush=True,
                )
                write_framed_message(
                    sys.stdout.buffer,
                    make_success(
                        message_id,
                        to_bridge_tool_result(error_payload, is_error=True),
                    ),
                )
            continue

        if method == "resources/list":
            write_framed_message(
                sys.stdout.buffer,
                make_success(message_id, {"resources": []}),
            )
            continue

        if method == "prompts/list":
            write_framed_message(
                sys.stdout.buffer,
                make_success(message_id, {"prompts": []}),
            )
            continue

        if message_id is not None:
            write_framed_message(
                sys.stdout.buffer,
                make_error(message_id, -32601, f"Method not found: {method}"),
            )


if __name__ == "__main__":
    raise SystemExit(main())
