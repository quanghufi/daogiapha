import { supabase } from './supabase';
import type { ClanSettings } from '@/types';

const SETTINGS_KEYS: (keyof ClanSettings)[] = [
  'clan_name', 'clan_motto', 'contact_email', 'contact_phone', 'require_verification',
];

const DEFAULTS: ClanSettings = {
  clan_name: 'Đào tộc - Ninh thôn',
  clan_motto: 'Uống nước nhớ nguồn',
  contact_email: '',
  contact_phone: '',
  require_verification: true,
};

function parseSettingValue(key: keyof ClanSettings, value: unknown): unknown {
  let parsed: unknown = value;

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = value;
    }
  }

  if (key === 'require_verification') {
    if (typeof parsed === 'boolean') return parsed;
    if (typeof parsed === 'string') return parsed === 'true';
    return true;
  }

  if (typeof parsed === 'string') return parsed;
  if (parsed == null) return '';
  return String(parsed);
}

export async function getClanSettings(): Promise<ClanSettings> {
  const { data, error } = await supabase
    .from('clan_settings')
    .select('key, value')
    .in('key', SETTINGS_KEYS);

  if (error) throw error;

  const settings = { ...DEFAULTS };
  for (const row of data || []) {
    const key = row.key as keyof ClanSettings;
    if (key in settings) {
      (settings as Record<string, unknown>)[key] = parseSettingValue(key, row.value);
    }
  }
  return settings;
}

export async function updateClanSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from('clan_settings')
    .upsert(
      { key, value: JSON.stringify(value), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (error) throw error;
}

export async function updateClanSettings(settings: Partial<ClanSettings>): Promise<void> {
  const updates = Object.entries(settings).map(([key, value]) =>
    supabase
      .from('clan_settings')
      .upsert(
        { key, value: JSON.stringify(value), updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
  );

  const results = await Promise.all(updates);
  for (const result of results) {
    if (result.error) throw result.error;
  }
}
