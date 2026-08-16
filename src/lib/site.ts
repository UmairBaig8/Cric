import { supabase } from './supabase';
import type { SiteSettings, Team } from '../types';

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('settings').select('*').single();
  return error ? null : (data as SiteSettings);
}

export async function fetchTeams(): Promise<Team[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('teams').select('*').order('sort_order');
  return error ? [] : (data as Team[]);
}

export async function fetchRegistrationsCount(): Promise<number | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('registrations_count');
  return error ? null : (data as number);
}

export type RecentPlayer = { id: string; name: string; photo_url: string | null };

export async function fetchRecentPlayers(limitCount = 5): Promise<RecentPlayer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('recent_registrations', { limit_count: limitCount });
  return error ? [] : (data as RecentPlayer[]);
}

export type PlayerCard = {
  id: string;
  name: string;
  photo_url: string | null;
  player_type: string;
  squad: string;
  jersey_size: string;
  created_at: string;
};

export async function fetchPlayerCards(limitCount = 8): Promise<PlayerCard[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('player_cards', { limit_count: limitCount });
  return error ? [] : (data as PlayerCard[]);
}