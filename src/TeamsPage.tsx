import { useEffect, useState } from 'react';
import SiteHeader from './components/SiteHeader';
import { useTheme } from './lib/useTheme';
import { fetchTeamsList, type TeamRow } from './lib/site';
import { FALLBACK_TEAMS } from './teamData';

function toFallback() {
  return FALLBACK_TEAMS.map((t) => ({
    id: t.code,
    name: t.name,
    code: t.code,
    icon_url: t.img,
    theme: t.theme,
    owner: t.owner,
    captain: t.captain,
    champion: t.champion,
    player_count: t.players,
    sort_order: 0,
  }));
}

export default function TeamsPage() {
  const { dark, toggleTheme } = useTheme();
  const [teams, setTeams] = useState<TeamRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchTeamsList().then((rows) => {
      if (!alive) return;
      setTeams(rows.length ? rows : toFallback());
    });
    return () => { alive = false; };
  }, []);

  const list = teams ?? toFallback();

  return (
    <div className={dark ? 'app dark teams-page' : 'app teams-page'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="teams-main shell">
        <section className="teams-grid">
          {list.map((t, i) => (
            <a className={`team-card ${t.theme}${t.champion ? ' champion' : ''}`} key={t.code} href={`/D2P/teams/${t.code}`}>
              {t.champion && (
                <span className="team-champion" title="DPL 2025 Champions">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M12 2l2.6 6.6 7 .6-5.3 4.6 1.6 6.9L12 17.3l-5.9 3.4 1.6-6.9L2.4 9.2l7-.6z"/></svg>
                  CHAMPIONS
                </span>
              )}
              <div className="team-sprite"><img src={t.icon_url} alt={t.name} /></div>
              <div className="team-meta">
                <div className="team-code">{t.code} · TEAM {String(i + 1).padStart(2, '0')}</div>
                <div className="team-name">{t.name}</div>
                <div className="team-leads">
                  <div className="team-lead"><span>OWNER</span><b>{t.owner || 'TBD'}</b></div>
                  <div className="team-lead"><span>CAPTAIN</span><b>{t.captain || 'TBD'}</b></div>
                </div>
                <div className="team-players"><span className="team-count">{t.player_count} PLAYERS</span><span className="team-view">VIEW TEAM</span></div>
                <div className="team-arrow">↗</div>
              </div>
            </a>
          ))}
        </section>
      </main>
      <footer>D2P · DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET · BUILT FOR THE PEOPLE WHO TURN COFFEE BREAKS INTO CRICKET DEBATES.</footer>
    </div>
  );
}