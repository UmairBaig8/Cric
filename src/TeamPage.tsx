import { useParams, Link } from 'react-router-dom';
import SiteHeader from './components/SiteHeader';
import { useTheme } from './lib/useTheme';
import { TEAMS, teamPlayers } from './teamData';

export default function TeamPage() {
  const { dark, toggleTheme } = useTheme();
  const { code } = useParams();
  const team = TEAMS.find((t) => t.code === code);

  if (!team) {
    return (
      <div className={dark ? 'app dark teams-page' : 'app teams-page'}>
        <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
        <main className="teams-main shell">
          <div className="teams-head">
            <h1>TEAM <span>NOT FOUND.</span></h1>
            <Link className="team-back" to="/teams">← ALL TEAMS</Link>
          </div>
        </main>
      </div>
    );
  }

  const players = teamPlayers(team);

  return (
    <div className={`app ${dark ? 'dark ' : ''}teams-page team-detail-page ${team.theme}`}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="teams-main shell">
        <Link className="team-back" to="/teams">← ALL TEAMS</Link>
        <div className="team-hero">
          <div className="team-hero-icon"><img src={team.img} alt={team.name} /></div>
          <div className="team-hero-info">
            <div className="eyebrow">
              {team.code} · D2P 2026{team.champion ? ' · DEFENDING CHAMPIONS' : ''}
            </div>
            <h1>{team.name}</h1>
            <p className="teams-desc">{team.players} players locked in. One goal: lift the DPL 2026 trophy.</p>
            {team.champion && (
              <span className="team-champion hero">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M12 2l2.6 6.6 7 .6-5.3 4.6 1.6 6.9L12 17.3l-5.9 3.4 1.6-6.9L2.4 9.2l7-.6z"/></svg>
                DPL 2025 CHAMPIONS
              </span>
            )}
          </div>
        </div>
        <section className="player-grid team-player-grid">
          {players.map((p) => (
            <article className={`player-card ${team.theme}`} key={p.name}>
              <div className="player-photo"><span>{p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span></div>
              <h3>{p.name}</h3>
              <span className="player-role">{p.role}{p.captain ? ' · CAPTAIN' : ''}</span>
              <div className="team-player-extra">
                <span className="player-squad">{p.location}</span>
                <span className={`player-dpl${p.dpl ? '' : ' no'}`}>{p.dpl ? 'DPL VET' : 'ROOKIE'}</span>
              </div>
            </article>
          ))}
        </section>
      </main>
      <footer>D2P · DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET · BUILT FOR THE PEOPLE WHO TURN COFFEE BREAKS INTO CRICKET DEBATES.</footer>
    </div>
  );
}