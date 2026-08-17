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
  location: string;
  created_at: string;
};

export async function fetchPlayerCards(limitCount = 8): Promise<PlayerCard[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('player_cards', { limit_count: limitCount });
  return error ? [] : (data as PlayerCard[]);
}

export type AuctionPlayer = {
  id: string;
  name: string;
  employee_id: string;
  photo_url: string | null;
  player_type: string;
  gender: string;
  location: string;
  dpl_played: boolean;
  availability: string;
  batting_style: string;
  bowling_style: string;
  created_at: string;
};

export async function fetchAuctionPlayers(): Promise<AuctionPlayer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('auction_players');
  return error ? [] : (data as AuctionPlayer[]);
}

export type TeamRow = {
  id: string;
  name: string;
  code: string;
  icon_url: string;
  theme: string;
  owner: string | null;
  captain: string | null;
  champion: boolean;
  player_count: number;
  sort_order: number;
};

export async function fetchTeamsList(): Promise<TeamRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('teams_list');
  return error ? [] : (data as TeamRow[]);
}

export type TeamRosterPlayer = {
  id: string;
  name: string;
  photo_url: string | null;
  player_type: string;
  location: string;
  dpl_played: boolean;
  role: string;
};

export async function fetchTeamRoster(teamCode: string): Promise<TeamRosterPlayer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('team_roster', { team_code: teamCode });
  return error ? [] : (data as TeamRosterPlayer[]);
}