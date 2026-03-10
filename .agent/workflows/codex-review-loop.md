---
description: 🔄 Codex Review-Debug Loop (5 rounds tự động)
---

# Codex Review-Debug Loop

**2 AI review:** Codex (GPT) review → Antigravity (Gemini) đánh giá + phản biện → fix → test → lặp lại tối đa 5 rounds.

// turbo-all

## Giai đoạn 0: Kiểm tra availability

```powershell
codex --version 2>&1
```

Nếu Codex không có → dừng, báo user cài CLI.

## Giai đoạn 1: Xác định target

1. Hỏi user file nào cần review (hoặc dùng file đang mở)
2. Xác nhận test command (auto-detect)

## Giai đoạn 2: Review Loop (tối đa 5 rounds)

### Step 2.1: Gọi Codex review

Gọi Codex CLI với prompt review. Codex là reviewer duy nhất.

### Step 2.2: Đọc findings

- Đọc findings từ Codex
- Tất cả findings cần Antigravity phản biện (vì chỉ có 1 reviewer)

### Step 2.3: ⚠️ Đánh Giá + Tranh Luận (BẮT BUỘC)

**KHÔNG FIX MÙ QUÁNG.**

Antigravity **BẮT BUỘC phản biện** mọi finding vì chỉ có 1 reviewer:
1. Đọc code tại dòng Codex chỉ ra
2. **Tìm lý do ĐỂ BÁC BỎ** bug — kiểm tra xem có thể là false positive không
3. Nếu tìm được lý do phản bác → tranh luận với Codex:
   ```
   "Bạn báo bug X ở dòng Y, nhưng tôi thấy [lý do phản bác].
    Giải thích tại sao bạn cho rằng đây vẫn là bug?"
   ```
4. Đọc phản hồi của Codex → rút kết luận
5. Nếu không tìm được lý do phản bác → đồng ý fix

> Mục đích: Antigravity đóng vai "devil's advocate" để đảm bảo chỉ fix bug thật.

### Step 2.4: Fix confirmed bugs
- Chỉ fix bugs đã kết luận rõ ràng

### Step 2.5: Chạy tests
```powershell
python -m unittest discover -s scripts -p "test_*.py" -v
```

### Step 2.6: Đánh giá
- round < 5 và còn bugs → quay lại Step 2.1
- clean hoặc round = 5 → bước 3

## Giai đoạn 3: Tổng kết

Báo cáo: rounds, bugs found/fixed/rejected, nguồn (Codex).

## NEXT STEPS menu
```
1. /run    → Chạy thử
2. /test   → Chạy test
3. /deploy → Deploy
4. /next   → Gợi ý tiếp
```
