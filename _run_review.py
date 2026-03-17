"""Run codex review via MCP bridge with full codex path, no profile flag."""
import json, sys, traceback
from pathlib import Path
from scripts.codex_review_mcp import CodexReviewBridge

CODEX_CMD = r"c:\Users\quangda\Downloads\node-v24.13.0-win-x64\codex.cmd"

try:
    bridge = CodexReviewBridge(
        workspace=Path("."),
        codex_command=CODEX_CMD,
        schema_path=Path("scripts/codex_review_schema.json"),
        codex_timeout_sec=600,
        codex_reasoning_effort=None,
        codex_profile=None,  # config.toml already sets model_provider = "9router"
    )
    result = bridge.run_codex_review(
        workspace=Path("."),
        review_target="uncommitted",
        base_branch=None,
        commit=None,
        max_findings=10,
        instructions="Focus on bugs in codex_bridge_mcp.py, register_antigravity_codex_bridge.ps1, test_codex_bridge_mcp.py. Check for broken logic after Claude CLI removal.",
    )
    out = Path(".agent/handoff/codex-review-bridge-r1.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    review = result.get("review", {})
    print(f"Status: {review.get('status', 'unknown')}")
    print(f"Summary: {review.get('summary', 'N/A')}")
    findings = review.get("findings", [])
    print(f"Findings: {len(findings)}")
    for i, f in enumerate(findings, 1):
        sev = f.get("severity", "?")
        title = f.get("title", "?")
        file = f.get("file", "?")
        line = f.get("line", "?")
        expl = f.get("explanation", "")[:200]
        print(f"  {i}. [{sev}] {file}:{line} - {title}")
        print(f"     {expl}")

    if result.get("codex_stdout"):
        print(f"\n--- Codex stdout (first 500 chars) ---")
        print(result["codex_stdout"][:500])
    if result.get("codex_stderr"):
        print(f"\n--- Codex stderr (first 500 chars) ---")
        print(result["codex_stderr"][:500])
except Exception:
    traceback.print_exc()
    sys.exit(1)
