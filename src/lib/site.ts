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

// ---------- Admin ----------

export type AdminPlayer = {
  id: string;
  name: string;
  email: string;
  employee_id: string | null;
  photo_url: string | null;
  player_type: string;
  gender: string;
  location: string;
  dpl_played: boolean;
  created_at: string;
  team_id: string | null;
  team_code: string | null;
  role: string | null;
};

export async function fetchAdminPlayers(): Promise<AdminPlayer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('admin_players');
  return error ? [] : (data as AdminPlayer[]);
}

export type AdminTeam = {
  id: string;
  name: string;
  icon: string;
  code: string | null;
  icon_url: string;
  theme: string;
  owner: string | null;
  captain: string | null;
  champion: boolean;
  sort_order: number;
};

export async function fetchAdminTeams(): Promise<AdminTeam[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('admin_teams');
  return error ? [] : (data as AdminTeam[]);
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}

export async function getCurrentUserEmail(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

export async function signInAdmin(email: string, password: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { error: error.message } : {};
}

export async function signOutAdmin(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function adminSaveSettings(patch: {
  registration_open?: string | null;
  registration_deadline?: string | null;
  player_capacity?: number;
  total_teams?: number;
  total_matches?: number;
  champion?: string | null;
}): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { error } = await supabase.from('settings').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1);
  return error ? { error: error.message } : {};
}

export async function adminUpsertTeam(team: {
  id?: string;
  name: string;
  code: string;
  icon_url: string;
  theme: string;
  owner: string;
  captain: string;
  champion: boolean;
  sort_order: number;
}): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { error } = team.id
    ? await supabase.from('teams').update(team).eq('id', team.id)
    : await supabase.from('teams').insert(team);
  return error ? { error: error.message } : {};
}

export async function adminDeleteTeam(id: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { error } = await supabase.from('teams').delete().eq('id', id);
  return error ? { error: error.message } : {};
}

export async function adminAssignPlayer(playerId: string, teamId: string, role: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { error } = await supabase.from('team_players').upsert(
    { team_id: teamId, player_id: playerId, role },
    { onConflict: 'team_id,player_id' },
  );
  return error ? { error: error.message } : {};
}

export async function adminRemovePlayerFromTeam(playerId: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { error } = await supabase.from('team_players').delete().eq('player_id', playerId);
  return error ? { error: error.message } : {};
}

export async function adminUpdatePlayer(playerId: string, patch: { name?: string; location?: string; dpl_played?: boolean; player_type?: string }): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { error } = await supabase.from('registrations').update(patch).eq('id', playerId);
  return error ? { error: error.message } : {};
}