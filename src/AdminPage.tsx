import { useEffect, useState } from 'react';
import SiteHeader from './components/SiteHeader';
import BorderGlow from './components/BorderGlow';
import { useTheme } from './lib/useTheme';
import { withBase, resolveAsset } from './lib/base';
import { supabase as supabaseRef } from './lib/supabase';
import {
  fetchAdminTeams,
  fetchAdminPlayers,
  isCurrentUserAdmin,
  getCurrentUserEmail,
  signInAdmin,
  signOutAdmin,
  adminSaveSettings,
  adminUpsertTeam,
  adminDeleteTeam,
  adminAssignPlayer,
  adminRemovePlayerFromTeam,
  adminUpdatePlayer,
  type AdminTeam,
  type AdminPlayer,
} from './lib/site';

type Tab = 'settings' | 'teams' | 'players';

type SettingForm = {
  registration_open: string;
  registration_deadline: string;
  player_capacity: string;
  total_teams: string;
  total_matches: string;
  champion: string;
};

function toLocal(dt: string | null | undefined): string {
  if (!dt) return '';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPage() {
  const { dark, toggleTheme } = useTheme();
  const [phase, setPhase] = useState<'checking' | 'anon' | 'admin' | 'denied'>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('settings');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) {
        if (alive) setPhase('anon');
        return;
      }
      const admin = await isCurrentUserAdmin();
      if (!alive) return;
      setPhase(admin ? 'admin' : 'denied');
    })();
    return () => { alive = false; };
  }, []);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setLoginError('');
    const { error } = await signInAdmin(email.trim(), password);
    setBusy(false);
    if (error) {
      setLoginError(error);
      return;
    }
    const admin = await isCurrentUserAdmin();
    setPhase(admin ? 'admin' : 'denied');
  };

  const handleLogout = async () => {
    await signOutAdmin();
    setPhase('anon');
  };

  if (phase === 'checking') {
    return (
      <div className={dark ? 'app dark admin-page' : 'app admin-page'}>
        <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
        <main className="admin-main shell"><p className="admin-loading">Checking…</p></main>
      </div>
    );
  }

  if (phase === 'anon') {
    return (
      <div className={dark ? 'app dark admin-page' : 'app admin-page'}>
        <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
        <main className="admin-main shell">
          <BorderGlow className="admin-login-glow" backgroundColor="#0b1420" colors={['#09c9d8', '#873cff', '#2f7dff']} glowColor="196 100 48" glowIntensity={1.05} glowRadius={26} edgeSensitivity={24} borderRadius={18}>
            <form className="admin-login" onSubmit={handleLogin}>
            <div className="admin-login-icon">🛠️</div>
            <h1>ADMIN ACCESS</h1>
            <p>Sign in with your Supabase Auth account to manage DPL 2026.</p>
            <label>EMAIL
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>
            <label>PASSWORD
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </label>
            {loginError && <div className="admin-error">{loginError}</div>}
            <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'SIGNING IN…' : 'SIGN IN'}</button>
          </form>
          </BorderGlow>
        </main>
      </div>
    );
  }

  if (phase === 'denied') {
    return (
      <div className={dark ? 'app dark admin-page' : 'app admin-page'}>
        <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
        <main className="admin-main shell">
          <div className="admin-denied">
            <div className="admin-login-icon">🔒</div>
            <h1>NOT AUTHORIZED</h1>
            <p>This account isn't on the admin whitelist.</p>
            <button className="btn" type="button" onClick={handleLogout}>SIGN OUT</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={dark ? 'app dark admin-page' : 'app admin-page'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="admin-main shell">
        {toast && <div className="admin-toast">{toast}</div>}
        <div className="admin-bar">
          <div className="admin-tabs">
            {(['settings', 'teams', 'players'] as Tab[]).map((t) => (
              <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t.toUpperCase()}</button>
            ))}
          </div>
          <button className="admin-logout" type="button" onClick={handleLogout}>SIGN OUT</button>
        </div>
        {tab === 'settings' && <SettingsTab notify={notify} />}
        {tab === 'teams' && <TeamsTab notify={notify} />}
        {tab === 'players' && <PlayersTab notify={notify} />}
      </main>
    </div>
  );
}

function SettingsTab({ notify }: { notify: (m: string) => void }) {
  const [form, setForm] = useState<SettingForm | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    supabaseRef!.from('settings').select('*').single().then(({ data }) => {
      if (!alive || !data) return;
      setForm({
        registration_open: toLocal(data.registration_open),
        registration_deadline: toLocal(data.registration_deadline),
        player_capacity: String(data.player_capacity ?? 128),
        total_teams: String(data.total_teams ?? 16),
        total_matches: String(data.total_matches ?? 24),
        champion: data.champion ?? '',
      });
    });
    return () => { alive = false; };
  }, []);

  const set = (key: keyof SettingForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => prev ? { ...prev, [key]: event.target.value } : prev);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    const { error } = await adminSaveSettings({
      registration_open: form.registration_open ? new Date(form.registration_open).toISOString() : null,
      registration_deadline: form.registration_deadline ? new Date(form.registration_deadline).toISOString() : null,
      player_capacity: Number(form.player_capacity),
      total_teams: Number(form.total_teams),
      total_matches: Number(form.total_matches),
      champion: form.champion || null,
    });
    setBusy(false);
    notify(error ? `Failed: ${error}` : 'Settings saved.');
  };

  if (!form) return <p className="admin-loading">Loading settings…</p>;

  return (
    <form className="admin-panel admin-settings" onSubmit={save}>
      <h2>REGISTRATION TIMING</h2>
      <div className="admin-grid">
        <label>OPENING
          <input type="datetime-local" value={form.registration_open} onChange={set('registration_open')} />
        </label>
        <label>DEADLINE
          <input type="datetime-local" value={form.registration_deadline} onChange={set('registration_deadline')} />
        </label>
      </div>
      <h2>COUNTS</h2>
      <div className="admin-grid">
        <label>PLAYER CAPACITY
          <input type="number" min={0} value={form.player_capacity} onChange={set('player_capacity')} />
        </label>
        <label>TOTAL TEAMS
          <input type="number" min={0} value={form.total_teams} onChange={set('total_teams')} />
        </label>
        <label>TOTAL MATCHES
          <input type="number" min={0} value={form.total_matches} onChange={set('total_matches')} />
        </label>
        <label>CHAMPION LABEL
          <input type="text" value={form.champion} onChange={set('champion')} placeholder="e.g. 1" />
        </label>
      </div>
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'SAVING…' : 'SAVE SETTINGS'}</button>
    </form>
  );
}

const THEME_CHOICES = ['kings', 'mavale', 'mitra', 'blaster', 'dhada', 'wala', 'titans', 'yodhas', 'gallit', 'dhurandhars'];

function TeamsTab({ notify }: { notify: (m: string) => void }) {
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [editing, setEditing] = useState<AdminTeam | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    fetchAdminTeams().then((rows) => setTeams(rows));
  };

  useEffect(reload, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    const payload = {
      name: editing.name.trim(),
      code: (editing.code ?? '').trim().toUpperCase(),
      icon_url: editing.icon_url.trim(),
      theme: editing.theme.trim(),
      owner: editing.owner ?? '',
      captain: editing.captain ?? '',
      champion: editing.champion,
      sort_order: editing.sort_order,
    };
    const { error } = await adminUpsertTeam(editing.id ? { ...payload, id: editing.id } : { ...payload, id: undefined });
    setBusy(false);
    if (!error) {
      setEditing(null);
      reload();
      notify('Team saved.');
    } else {
      notify(`Failed: ${error}`);
    }
  };

  const remove = async (team: AdminTeam) => {
    if (!window.confirm(`Delete ${team.name}? This removes its player mappings.`)) return;
    const { error } = await adminDeleteTeam(team.id);
    notify(error ? `Failed: ${error}` : 'Team deleted.');
    if (!error) reload();
  };

  const empty: AdminTeam = { id: '', name: '', icon: '', code: '', icon_url: withBase('/teams/'), theme: '', owner: '', captain: '', champion: false, sort_order: teams.length + 1 };

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>TEAMS</h2>
        <button className="btn" type="button" onClick={() => setEditing(empty)}>+ ADD TEAM</button>
      </div>
      {editing && (
        <form className="admin-edit" onSubmit={save}>
          <h3>{editing.id ? `EDIT ${editing.name.toUpperCase()}` : 'NEW TEAM'}</h3>
          <div className="admin-grid">
            <label>NAME<input type="text" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
            <label>CODE<input type="text" required value={editing.code ?? ''} onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></label>
            <label>ICON URL<input type="text" value={editing.icon_url} onChange={(e) => setEditing({ ...editing, icon_url: e.target.value })} /></label>
            <label>THEME
              <select value={editing.theme} onChange={(e) => setEditing({ ...editing, theme: e.target.value })}>
                <option value="">—</option>
                {THEME_CHOICES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>OWNER<input type="text" value={editing.owner ?? ''} onChange={(e) => setEditing({ ...editing, owner: e.target.value })} /></label>
            <label>CAPTAIN<input type="text" value={editing.captain ?? ''} onChange={(e) => setEditing({ ...editing, captain: e.target.value })} /></label>
            <label>SORT ORDER<input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></label>
            <label className="admin-check"><input type="checkbox" checked={editing.champion} onChange={(e) => setEditing({ ...editing, champion: e.target.checked })} /> CHAMPIONS</label>
          </div>
          <div className="admin-actions">
            <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'SAVING…' : 'SAVE'}</button>
            <button className="btn" type="button" onClick={() => setEditing(null)}>CANCEL</button>
          </div>
        </form>
      )}
      <div className="admin-table">
        {teams.map((team) => (
          <div className="admin-row" key={team.id}>
            <img src={resolveAsset(team.icon_url)} alt="" className="admin-thumb" />
            <div className="admin-row-main">
              <b>{team.name}</b>
              <span>{team.code} · {team.theme} · owner: {team.owner || 'TBD'} · captain: {team.captain || 'TBD'}{team.champion ? ' · ★' : ''}</span>
            </div>
            <div className="admin-row-actions">
              <button className="btn" type="button" onClick={() => setEditing(team)}>EDIT</button>
              <button className="btn btn-danger" type="button" onClick={() => remove(team)}>DELETE</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayersTab({ notify }: { notify: (m: string) => void }) {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);

  const reload = () => {
    fetchAdminPlayers().then(setPlayers);
    fetchAdminTeams().then(setTeams);
  };

  useEffect(reload, []);

  const assign = async (player: AdminPlayer, teamId: string, role: string) => {
    if (!teamId) return;
    const { error } = await adminAssignPlayer(player.id, teamId, role);
    notify(error ? `Failed: ${error}` : `Assigned ${player.name}.`);
    if (!error) reload();
  };

  const unassign = async (player: AdminPlayer) => {
    const { error } = await adminRemovePlayerFromTeam(player.id);
    notify(error ? `Failed: ${error}` : `Removed ${player.name}.`);
    if (!error) reload();
  };

  const flipDpl = async (player: AdminPlayer) => {
    const { error } = await adminUpdatePlayer(player.id, { dpl_played: !player.dpl_played });
    notify(error ? `Failed: ${error}` : `${player.name} DPL status toggled.`);
    if (!error) reload();
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>PLAYERS ({players.length})</h2>
      </div>
      <div className="admin-table">
        {players.map((player) => (
          <div className="admin-row" key={player.id}>
            <div className="admin-row-main">
              <b>{player.name}</b>
              <span>{player.employee_id || '—'} · {player.location} · {player.player_type}{player.dpl_played ? ' · DPL VET' : ''}</span>
            </div>
            <div className="admin-row-actions">
              <select
                className="admin-assign"
                value={player.team_id ?? ''}
                onChange={(e) => {
                  if (e.target.value === '') { if (player.team_id) unassign(player); return; }
                  assign(player, e.target.value, player.role ?? 'player');
                }}
              >
                <option value="">— team —</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.code}</option>)}
              </select>
              <select
                className="admin-role"
                value={player.role ?? 'player'}
                disabled={!player.team_id}
                onChange={(e) => { if (player.team_id) assign(player, player.team_id, e.target.value); }}
              >
                <option value="player">PLAYER</option>
                <option value="vice_captain">VICE CAPTAIN</option>
                <option value="captain">CAPTAIN</option>
              </select>
              <button className="btn" type="button" onClick={() => flipDpl(player)}>{player.dpl_played ? 'VET' : 'ROOKIE'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
