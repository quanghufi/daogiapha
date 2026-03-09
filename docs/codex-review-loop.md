# Antigravity -> Codex Review Loop

This workspace includes a local MCP server that lets Antigravity call Codex as a read-only reviewer.

## Files

- `scripts/codex_review_mcp.py`: local MCP bridge
- `scripts/codex_review_schema.json`: structured review schema for Codex
- `.agent/rules/require-codex-review.md`: workspace rule for the loop
- `scripts/register_antigravity_codex_review.ps1`: optional one-shot registration script
- `scripts/test_codex_review_mcp.py`: unit tests for path confinement and change discovery

## What the bridge does

The bridge exposes two tools:

- `run_codex_review`
- `get_last_codex_review`

`run_codex_review` starts `codex exec` in `read-only` mode, asks it to review the current staged, unstaged, and untracked change set, and forces the final response to match `scripts/codex_review_schema.json`.

The default Codex timeout is 600 seconds. The bridge always runs with the `9router` Codex profile, and it inherits reasoning settings from your main `~/.codex/config.toml` because it copies that file into the isolated review home before every run. If you need a review-specific reasoning override, pass `--codex-reasoning-effort` or `CODEX_REVIEW_REASONING`.

The bridge writes review artifacts to `.agent/handoff/`:

- `codex-review.latest.json`
- `codex-review.latest.md`
- timestamped history files

The bridge keeps its temporary Codex home outside the repository, copies `~/.codex/auth.json` and `~/.codex/config.toml` into that isolated home so your `9router` profile and normal reasoning settings still apply, and excludes generated paths such as `.agent/handoff/`, `.agent/codex-review-home/`, and `scripts/__pycache__/` from review input.

## Workspace setup

Run the registration script so Antigravity gets absolute paths for your local machine:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\register_antigravity_codex_review.ps1
```

Register the bridge for a different repo on the same machine:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\register_antigravity_codex_review_global.ps1 -RepoPath "C:\path\to\other\repo"
```

Interpreter resolution is Windows-friendly:

- The script tries `python` first.
- If `python` is missing, it falls back to `py -3`.
- If neither exists, registration stops with a clear error.

Manual verification:

```powershell
python --version
```

or, on machines that only expose the launcher:

```powershell
py -3 --version
```

## Expected agent loop

1. Antigravity edits code.
2. Antigravity calls `run_codex_review`.
3. Codex returns structured findings plus `.agent/handoff/codex-review.latest.md`.
4. Antigravity fixes blocking findings.
5. Antigravity reruns `run_codex_review`.
6. Antigravity stops only when blocking findings are gone or the retry budget is exhausted.

## Suggested Antigravity prompt

```text
Use the workspace rule in .agent/rules/require-codex-review.md.
After each behavior-changing edit, call run_codex_review.
Fix critical and high findings before completion.
If the review returns clean, summarize what changed and stop.
```
