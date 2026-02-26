/**
 * @project AncestorTree
 * @file src/lib/constants.ts
 * @description Shared constants — magic numbers, enums, config values
 * @version 1.0.0
 * @updated 2026-02-26
 */

// ─── Gender ───────────────────────────────────────────────────────────────────
export const GENDER = {
  MALE: 1,
  FEMALE: 2,
} as const;

export const GENDER_LABEL: Record<number, string> = {
  [GENDER.MALE]: 'Nam',
  [GENDER.FEMALE]: 'Nữ',
};

// ─── Privacy Level ────────────────────────────────────────────────────────────
export const PRIVACY = {
  PUBLIC: 0,
  MEMBERS_ONLY: 1,
  PRIVATE: 2,
} as const;

export const PRIVACY_LABEL: Record<number, string> = {
  [PRIVACY.PUBLIC]: 'Công khai',
  [PRIVACY.MEMBERS_ONLY]: 'Chỉ thành viên',
  [PRIVACY.PRIVATE]: 'Riêng tư',
};

// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLE = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
  GUEST: 'guest',
} as const;

// ─── Storage ──────────────────────────────────────────────────────────────────
export const STORAGE_BUCKET = 'media';
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Locale ───────────────────────────────────────────────────────────────────
export const LOCALE = 'vi-VN';

// ─── Fetch ────────────────────────────────────────────────────────────────────
export const SUPABASE_FETCH_TIMEOUT_MS = 25_000;
