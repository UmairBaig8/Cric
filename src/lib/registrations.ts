import { supabase } from './supabase';
import type { RegistrationInput } from '../types';

export async function registerPlayer(input: RegistrationInput) {
  if (!supabase) return { ok: true as const, demo: true as const };

  const { error } = await supabase.from('registrations').insert(input);
  if (error) throw new Error(error.message);
  return { ok: true as const, demo: false as const };
}
