import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabaseStorageEnabled = Boolean(url && anonKey);
const client = supabaseStorageEnabled ? createClient(url ?? '', anonKey ?? '', { auth: { persistSession: true, autoRefreshToken: true } }) : null;
const bucket = 'service-orders';

async function ensureSession() {
  if (!client) throw new Error('Supabase Storage não está configurado.');
  const { data: current } = await client.auth.getSession();
  if (current.session) return client;
  const { error } = await client.auth.signInAnonymously();
  if (error) throw new Error('Ative Anonymous Sign-Ins no Supabase para enviar anexos.');
  return client;
}

export async function uploadServiceFileToSupabase(serviceOrderId: string, file: File) {
  const supabase = await ensureSession();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${serviceOrderId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (uploadError) throw uploadError;
  const { data, error: urlError } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
  if (urlError || !data?.signedUrl) throw urlError ?? new Error('Não foi possível criar o link do anexo.');
  return data.signedUrl;
}
