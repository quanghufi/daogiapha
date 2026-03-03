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
      (settings as Record<string, unknown>)[key] = row.value;
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
