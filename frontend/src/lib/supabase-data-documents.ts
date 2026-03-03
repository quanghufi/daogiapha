import { supabase } from './supabase';
import type { ClanDocument, DocumentCategory, CreateClanDocumentInput, UpdateClanDocumentInput } from '@/types';

export async function getDocuments(category?: DocumentCategory): Promise<ClanDocument[]> {
  let query = supabase
    .from('clan_documents')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAllDocuments(category?: DocumentCategory): Promise<ClanDocument[]> {
  let query = supabase
    .from('clan_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getDocument(id: string): Promise<ClanDocument | null> {
  const { data, error } = await supabase
    .from('clan_documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createDocument(input: CreateClanDocumentInput): Promise<ClanDocument> {
  const { data, error } = await supabase
    .from('clan_documents')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDocument(id: string, input: UpdateClanDocumentInput): Promise<ClanDocument> {
  const { data, error } = await supabase
    .from('clan_documents')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function archiveDocument(id: string): Promise<ClanDocument> {
  const { data, error } = await supabase
    .from('clan_documents')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('clan_documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
