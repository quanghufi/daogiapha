# Production Code Audit Report — AncestorTree (Đào tộc - Ninh thôn)

**Ngày:** 2026-02-26
**Tổng file quét:** ~80 files
**Xếp hạng tổng: B-**
**URL:** https://daogiapha.vercel.app

---

## Tổng quan

| Hạng mục | CRITICAL | HIGH | MEDIUM | LOW | Điểm |
|----------|----------|------|--------|-----|------|
| Bảo mật | 0 | 4 | 8 | 4 | **C+** |
| Hiệu năng | 0 | 6 | 8 | 6 | **C** |
| Chất lượng code | 0 | 11 | 12 | 8 | **C+** |
| **Tổng** | **0** | **21** | **28** | **18** | **B-** |

**Điểm tốt:**
- Không có secrets/API keys trong source code
- Không có SQL injection (Supabase client dùng parameterized queries)
- Không có XSS (`dangerouslySetInnerHTML` = 0)
- Không có `console.log` debug còn sót
- `.gitignore` đúng chuẩn
- Dependencies đều mới, không có CVE

---

## BẢO MẬT (16 findings)

### HIGH (4)

#### 1. Incomplete Auth Protection in Middleware
- **File:** `src/proxy.ts:13-15`
- **Mô tả:** `authRequiredPaths` chỉ bảo vệ `/admin`, `/contributions`. Các route `/people/new`, `/events`, `/directory`, `/achievements`, `/fund`, `/cau-duong`, `/documents` không có auth middleware gate.
- **Rủi ro:** Unauthenticated users có thể truy cập page HTML. Bảo mật phụ thuộc hoàn toàn vào Supabase RLS.
- **Fix:** Mở rộng `authRequiredPaths` hoặc dùng allowlist chỉ cho public paths.

#### 2. Auth Timeout 5s Silently Degrades to Unauthenticated
- **File:** `src/proxy.ts:47-59`
- **Mô tả:** Nếu Supabase cold start > 5s, `user = null` → admin bị redirect về login dù có session hợp lệ.
- **Fix:** Tăng timeout lên 10-15s hoặc serve page với loading skeleton rồi verify client-side.

#### 3. `canEdit` Bypass — Missing `useCanEditPerson()` Hook
- **File:** `src/app/(main)/people/[id]/page.tsx:60`
- **Mô tả:** `canEdit = isAdmin || profile?.role === 'editor'` — branch editor thấy nút Xóa trên MỌI người, không chỉ subtree được phân quyền.
- **Fix:** Thay bằng `const { data: canEdit } = useCanEditPerson(id)`.

#### 4. Open Redirect Infrastructure
- **File:** `src/proxy.ts:63-65`
- **Mô tả:** Middleware set `?redirect=pathname` nhưng login page không consume nó (luôn redirect về `/`). Hiện tại an toàn nhưng nếu implement sau mà không validate → open redirect.
- **Fix:** Remove unused `redirect` param hoặc validate strict nếu implement.

### MEDIUM (8)

#### 5. No Input Validation on Data Layer
- **File:** `src/lib/supabase-data.ts:588-617`
- **Mô tả:** `createEvent`, `updateEvent`, `createFundTransaction`, etc. không validate server-side. Chỉ có compile-time TypeScript types.
- **Fix:** Apply empty-string-to-null normalization cho tất cả CRUD functions.

#### 6. Storage URL Path Logged
- **File:** `src/lib/supabase-storage.ts:56`
- **Mô tả:** `console.warn` log full Supabase URL ra browser console.
- **Fix:** Strip URL khỏi log message.

#### 7. Profile Fetch Error Logged Raw
- **File:** `src/components/auth/auth-provider.tsx:28`
- **Mô tả:** `console.error('Error fetching profile:', error)` — raw error object visible trong DevTools.
- **Fix:** Log sanitized message: `error instanceof Error ? error.message : 'Unknown error'`.

#### 8. RPC Error Details Exposed
- **File:** `src/lib/supabase-data.ts:484`
- **Mô tả:** `console.error('is_person_in_subtree RPC error:', error)` — PostgreSQL error codes visible.
- **Fix:** Sanitize log output.

#### 9. Client-Side Admin Check Only Defense
- **File:** `src/app/(main)/admin/contributions/page.tsx:75`
- **Mô tả:** Admin pages dùng client-side `isAdmin` check. Mutations chạy trực tiếp qua browser Supabase client. Bảo mật phụ thuộc RLS.
- **Fix:** Verify RLS policies cho tất cả write tables.

#### 10. No Rate Limiting on Auth Endpoints
- **Files:** `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`
- **Mô tả:** Không có rate limiting → brute-force, email flooding.
- **Fix:** Client-side throttle + Cloudflare WAF.

#### 11. Weak Password Policy (6 chars)
- **Files:** `register/page.tsx:30`, `reset-password/page.tsx:53`
- **Mô tả:** Min password 6 ký tự, dưới NIST SP 800-63B recommendation (8 chars).
- **Fix:** Tăng lên 8 chars. Cập nhật cả Supabase Dashboard settings.

#### 12. Privacy Filtering Client-Side Only
- **File:** `src/app/(main)/directory/page.tsx:49-63`
- **Mô tả:** Dữ liệu `privacy_level=2` vẫn gửi về browser, chỉ mask ở UI. React Query cache chứa raw data.
- **Fix:** Enforce privacy tại RLS layer hoặc Supabase Edge Function.

### LOW (4)

#### 13. `noopLock` Bypasses Navigator LockManager
- **File:** `src/lib/supabase.ts:26-27`
- **Mô tả:** Concurrent tab token refresh có thể race condition. Acceptable trade-off cho single-tab usage.

#### 14. Redirect Parameter Stored But Not Consumed
- **File:** `src/app/(auth)/login/page.tsx:27`
- **Mô tả:** Always redirect to `/`, ignoring `?redirect=`. UX bug nhưng safe security-wise.

#### 15. Fund Balance Fetches 5000 Rows Client-Side
- **File:** `src/lib/supabase-data-fund.ts:36-51`
- **Mô tả:** Fund balance tính bằng JS, fetch tối đa 5000 transactions. Nên dùng RPC.

#### 16. All People Data (Including Private) Fetched to Client
- **Files:** `hooks/use-people.ts`, `supabase-data.ts`
- **Mô tả:** `getPeople()` và `getTreeData()` fetch tất cả với `select('*')`, kể cả `privacy_level=2`.

---

## HIỆU NĂNG (20 findings)

### HIGH (6)

#### 1. Wildcard `.select('*')` Throughout Data Layer
- **File:** `src/lib/supabase-data.ts` (multiple functions)
- **Mô tả:** `getPeople()`, `getTreeData()`, `getFamilies()`, `getContributions()` đều fetch ALL 30 columns. Tree chỉ cần 7-8 columns.
- **Impact:** Multi-hundred KB JSON response trên mỗi page load.
- **Fix:** Column-specific selects cho mỗi use case.

#### 2. FamilyTree — 970-line God Component, No Lazy Loading
- **File:** `src/components/tree/family-tree.tsx` (~970 lines)
- **Mô tả:** Layout algorithm, SVG rendering, pan/zoom, edit panel, search — tất cả trong 1 file. Không dynamic import.
- **Impact:** ~40-80KB JS thêm vào main bundle cho mọi route.
- **Fix:** `dynamic(() => import(...), { ssr: false })`.

#### 3. `buildTreeLayout` Runs on Every Render
- **File:** `src/components/tree/family-tree.tsx:~200-400`
- **Mô tả:** Layout computation chạy inline không `useMemo`. Pan/zoom trigger full recompute.
- **Impact:** 60fps pan/zoom impossible với 100+ nodes.
- **Fix:** `useMemo(() => buildTreeLayout(...), [people, families, children, rootId])`.

#### 4. Most React Query Hooks Have No `staleTime`
- **Files:** `use-cau-duong.ts`, `use-profiles.ts`, `use-contributions.ts`, `use-events.ts`, `use-clan-articles.ts`, `use-achievements.ts`, `use-fund.ts`
- **Mô tả:** Default `staleTime: 0` → refetch mỗi lần mount, window focus, route change.
- **Fix:** Thêm `staleTime: 5 * 60 * 1000` cho stable queries.

#### 5. O(n²) `.find()` Loop in Cầu Đương DFS
- **File:** `src/lib/supabase-data-cau-duong.ts:~260-290`
- **Mô tả:** `.find()` bên trong `for...of` loop → O(n²). 500 members = ~250,000 comparisons.
- **Fix:** Build `Map<person_id, poolEntry>` trước loop.

#### 6. Book/GEDCOM Generators Not Lazy-Loaded
- **File:** `src/app/(main)/documents/book/page.tsx`
- **Mô tả:** `book-generator.ts` và `gedcom-export.ts` imported top-level dù chỉ dùng khi click Print/Export.
- **Fix:** Dynamic `import()` inside event handlers.

### MEDIUM (8)

#### 7. Sequential Inserts in `generateNextAssignments()`
- **File:** `src/lib/supabase-data-cau-duong.ts:~395-470`
- **Mô tả:** 50 assignments = 50 sequential HTTP requests.
- **Fix:** Batch insert: `supabase.from('cau_duong_assignments').insert(assignments)`.

#### 8. `usePeople()` in PersonForm — Full People List for Dropdowns
- **File:** `src/components/people/person-form.tsx`
- **Mô tả:** Fetch toàn bộ people (500+ × 30 columns) chỉ để populate 2 dropdowns (chỉ cần `id, display_name`).
- **Fix:** Tạo `usePeopleMinimal()` hook với stripped select.

#### 9. Missing `loading.tsx` / `error.tsx` on Multiple Routes
- **Files:** 7-9 route segments thiếu error.tsx, 5-9 thiếu loading.tsx.
- **Impact:** Blank screen 25s khi Supabase cold start.
- **Fix:** Thêm minimal loading/error cho mỗi route.

#### 10. Native `<img>` Tags — No Next.js Image Optimization
- **Files:** `photo-gallery.tsx`, `avatar-upload.tsx`
- **Mô tả:** Không có WebP conversion, lazy loading, responsive srcset.
- **Fix:** Replace với `next/image`.

#### 11. `getPeople()` No Pagination — Unbounded Dataset
- **File:** `src/lib/supabase-data.ts:12-20`
- **Mô tả:** Không có `.limit()` → payload tăng vô hạn theo số lượng thành viên.
- **Fix:** Cursor-based pagination hoặc `.limit(500)` safety cap.

#### 12. `getProfiles()` Wildcard Select with Auth Data
- **File:** `src/lib/supabase-data.ts:406-415`
- **Mô tả:** Fetch all columns + separate `auth.admin.listUsers()` = 2 round-trips.

#### 13. `setPrimaryMedia()` 3 Sequential DB Calls
- **File:** `src/lib/supabase-data.ts:784-812`
- **Mô tả:** 3 sequential requests cho 1 simple "set primary photo". Race condition giữa step 2-3.
- **Fix:** Supabase RPC atomic swap.

#### 14. Wildcard Select — Media
- **File:** `src/lib/supabase-data.ts:741-749`
- **Mô tả:** `getMediaByPerson()` fetch metadata JSONB không cần thiết.

### LOW (6)

#### 15. Pan/Zoom Handlers Recreated Every Render
- **File:** `src/components/tree/family-tree.tsx:~597-700`
- **Fix:** Wrap với `useCallback`.

#### 16. `getStats()` Makes 5 Separate Count Queries
- **File:** `src/lib/supabase-data.ts:494-519`
- **Fix:** Tạo `get_stats()` PostgreSQL function.

#### 17. No Global QueryClient Defaults
- **File:** `src/components/providers/query-provider.tsx`
- **Fix:** Set global `staleTime: 2min`, `gcTime: 10min`.

#### 18. `reviewContribution()` 3 Sequential Round-trips
- **File:** `src/lib/supabase-data.ts:670-723`
- **Fix:** PostgreSQL function atomic approve.

#### 19. `getPersonRelations()` Wildcard Select
- **File:** `src/lib/supabase-data.ts:269-274`
- **Mô tả:** Relations chỉ cần 7 columns, fetch 30.

#### 20. Large Component Files
- `family-tree.tsx` (~970 lines), `person-form.tsx` (~500 lines), `admin/users/page.tsx` (~400 lines).

---

## CHẤT LƯỢNG CODE (31 findings)

### HIGH (11)

#### God Files (4)
| File | Lines | Vấn đề |
|------|-------|--------|
| `components/tree/family-tree.tsx` | ~970 | 5+ responsibilities: layout, SVG, pan/zoom, edit, search |
| `app/(main)/admin/cau-duong/page.tsx` | ~550 | Pool mgmt, assignment, dialogs, combobox |
| `app/(main)/admin/users/page.tsx` | ~500 | Listing, role editing, linking, deletion |
| `app/(main)/events/page.tsx` | ~420 | Calendar, event CRUD, lunar, filter |

#### Code Duplication (3)
- `getStatusBadge()` duplicated verbatim: `fund/page.tsx` + `admin/fund/page.tsx`
- `toLocaleDateString('vi-VN')` repeated 14+ times — no `formatDate()` helper
- `PersonCombobox` inline search duplicated: `admin/cau-duong/page.tsx` + `admin/users/page.tsx`

#### Missing Error Boundaries (3)
- 7 routes missing `error.tsx`: tree, directory, documents, documents/book, cau-duong, fund, charter

#### Missing Loading States (1 — counted as HIGH)
- 5+ routes missing `loading.tsx`: tree, documents/book, cau-duong, admin/cau-duong, admin/fund

### MEDIUM (12)

#### Type Safety
- `as any` assertions in `supabase-data.ts`
- `parseInt()` without radix in `people/page.tsx`
- `window.location.reload()` instead of React Query invalidation in `admin/users/page.tsx`
- Loose query key strings — no central registry
- `supabase-storage.ts` silently swallows delete errors
- `book-generator.ts` and `gedcom-export.ts` no top-level try/catch

#### Code Duplication
- Role check `profile?.role === 'admin' || profile?.role === 'editor'` duplicated — should use `isEditor` from `useAuth()`
- `'vi-VN'` locale string repeated 14+ times
- Error toast pattern `error instanceof Error ? error.message : 'Đã xảy ra lỗi'` repeated in every hook
- `staleTime: 5 * 60 * 1000` repeated without named constant

#### Naming
- `proxy.ts` — non-standard filename, needs comment
- `supabase-data.ts` handles 7+ entities, should decompose like other modules

### LOW (8)

#### Magic Numbers / Strings (HIGH severity but grouped here for completeness)
- `gender === 1/2` scattered across 12+ files — no `GENDER` constant
- `privacy_level === 0/1/2` inline — no `PRIVACY` constant
- `5 * 1024 * 1024` file size limit — no `MAX_UPLOAD_SIZE_BYTES` constant
- `'media'` bucket name hardcoded in multiple files
- `25000` fetch timeout inline, no comment
- Role strings `'admin'`, `'editor'`, `'viewer'` as raw literals

#### Dead Code
- `getPersonByHandle()` exported but never imported
- `use-mobile.ts` hook with limited usage
- `format.ts` only has `formatVND`, missing `formatDate`

#### Accessibility
- Icon-only buttons in `family-tree.tsx` lack `aria-label`
- `avatar-upload.tsx` file input has no accessible label
- `photo-gallery.tsx` images use empty `alt=""`
- Calendar day cells not keyboard-navigable (div instead of button)
- Missing per-page `metadata` for SEO

---

## KẾ HOẠCH FIX

### Đợt 1 — Bảo mật + Crash Prevention
- [ ] Mở rộng `authRequiredPaths` trong `proxy.ts`
- [ ] Dùng `useCanEditPerson(id)` trong `people/[id]/page.tsx`
- [ ] Thêm `error.tsx` cho 7 routes
- [ ] Thêm `loading.tsx` cho 5+ routes
- [ ] Tăng min password lên 8 chars
- [ ] Sanitize `console.error` logs (3 files)

### Đợt 2 — Hiệu năng
- [ ] Replace `.select('*')` với column-specific selects
- [ ] Thêm `staleTime` cho tất cả hooks
- [ ] Lazy load `FamilyTree` với `dynamic()`
- [ ] Wrap `buildTreeLayout` trong `useMemo`
- [ ] Fix O(n²) loop với `Map` lookup
- [ ] Batch insert cầu đương assignments
- [ ] Set global QueryClient defaults

### Đợt 3 — Code Quality
- [ ] Tạo `src/lib/constants.ts` (GENDER, PRIVACY, STORAGE_BUCKET, MAX_UPLOAD_SIZE, STALE_TIME, LOCALE)
- [ ] Tạo `formatDate()` trong `format.ts`, replace 14 inline calls
- [ ] Tạo shared `PersonCombobox` component
- [ ] Extract `getStatusBadge` vào shared util
- [ ] Tách `family-tree.tsx` thành sub-components
- [ ] Replace `window.location.reload()` với `queryClient.invalidateQueries`
- [ ] Thêm `aria-label` cho icon buttons
- [ ] Remove dead code (`getPersonByHandle`)

---

*Audit thực hiện bởi Claude Code (3 parallel agents: Security, Performance, Code Quality)*
