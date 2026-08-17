import { supabase } from './supabase';
import type { RegistrationInput } from '../types';

const PHOTO_BUCKET = 'player-photos';

export async function checkEmployeeExists(employeeId: string): Promise<boolean> {
  if (!supabase) return false;
  const { count, error } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', employeeId);
  if (error) throw new Error(error.message);
  return Boolean(count && count > 0);
}

async function uploadPhoto(file: File): Promise<string> {
  if (!supabase) throw new Error('Database not connected');
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function registerPlayer(input: RegistrationInput, photo?: File) {
  if (!supabase) return { ok: true as const, demo: true as const };

  const photoUrl = photo ? await uploadPhoto(photo) : null;
  const { error } = await supabase.from('registrations').insert({ ...input, photo_url: photoUrl });
  if (error) throw new Error(error.message);
  return { ok: true as const, demo: false as const };
}