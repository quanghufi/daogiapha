-- Fix is_patrilineal cho con gái bị gán sai
-- Bug: khi thêm con gái qua quick dialog, is_patrilineal bị set = false (giống ngoại tộc)
-- Fix: tất cả con (children) của cha chính tộc đều là chính tộc, bất kể giới tính

-- Bước 1: Xem trước những người sẽ bị ảnh hưởng (DRY RUN)
-- Bỏ comment dòng SELECT bên dưới để kiểm tra trước khi chạy UPDATE

-- SELECT p.id, p.display_name, p.gender, p.is_patrilineal, father.display_name AS father_name
-- FROM people p
-- JOIN children c ON c.person_id = p.id
-- JOIN families f ON f.id = c.family_id
-- JOIN people father ON father.id = f.father_id AND father.is_patrilineal = true
-- WHERE p.is_patrilineal = false
-- ORDER BY p.generation, p.display_name;

-- Bước 2: Cập nhật is_patrilineal = true cho tất cả con của cha chính tộc
UPDATE people
SET is_patrilineal = true, updated_at = NOW()
WHERE id IN (
    SELECT p.id
    FROM people p
    JOIN children c ON c.person_id = p.id
    JOIN families f ON f.id = c.family_id
    JOIN people father ON father.id = f.father_id AND father.is_patrilineal = true
    WHERE p.is_patrilineal = false
);
