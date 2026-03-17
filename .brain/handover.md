━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 HANDOVER DOCUMENT — 2026-03-10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Đang làm: Multi-AI Review Loop (Codex + Claude + Antigravity)
🔢 Đến bước: Claude CLI integration done, blocked on -p mode Windows bug

✅ ĐÃ XONG:
   - claude_ask tool trong codex_bridge_mcp.py ✓
   - claude_ask registration + dispatch wiring ✓
   - 9router env từ ~/.claude/settings.json ✓
   - codex-review-loop.md (dual/single+debate modes) ✓
   - Bug fixes: --claude-command arg, provide_context desc, -- prompt injection ✓
   - 43/43 unit tests pass ✓
   - Claude CLI diagnostic (5 tests) ✓
   - Bridge re-registered ✓

⏳ CÒN LẠI:
   - Claude -p mode Windows bug → chờ fix hoặc dùng HTTP API qua 9router
   - Test dual review loop khi Claude hoạt động
   - Consider taskkill /F workaround for subprocess timeout

🔧 QUYẾT ĐỊNH QUAN TRỌNG:
   - provide_context dùng superseding (latest only), không additive
   - Đọc 9router config từ ~/.claude/settings.json (không hardcode)
   - Dùng -- separator trước prompt để chống injection

⚠️ LƯU Ý CHO SESSION SAU:
   - Claude -p KHÔNG hoạt động trên Windows (hangs, can't kill)
   - Claude interactive mode OK, chỉ -p (headless) bị
   - ANTHROPIC_API_KEY từ Antigravity proxy phải xóa trước khi gọi Claude
   - Codex review loop hoạt động tốt (đã fix 14+ bugs qua 7+ rounds)

📁 FILES QUAN TRỌNG:
   - scripts/codex_bridge_mcp.py (bridge MCP server, 7 tools)
   - scripts/test_codex_bridge_mcp.py (43 tests)
   - .agent/workflows/codex-review-loop.md (multi-AI workflow)
   - .agent/handoff/claude_diag.txt (diagnostic results)
   - ~/.claude/settings.json (9router config)
   - .brain/brain.json (project knowledge)
   - .brain/session.json (session state)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Đã lưu! Để tiếp tục: Gõ /recap
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
