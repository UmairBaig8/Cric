import SiteHeader from './components/SiteHeader';
import { useTheme } from './lib/useTheme';
import { TEAMS } from './teamData';

export default function TeamsPage() {
  const { dark, toggleTheme } = useTheme();

  return (
    <div className={dark ? 'app dark teams-page' : 'app teams-page'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="teams-main shell">
        <section className="teams-grid">
          {TEAMS.map(({ name, code, img, theme, players, champion, owner, captain }, i) => (
            <a className={`team-card ${theme}${champion ? ' champion' : ''}`} key={code} href={`/D2P/teams/${code}`}>
              {champion && (
                <span className="team-champion" title="DPL 2025 Champions">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M12 2l2.6 6.6 7 .6-5.3 4.6 1.6 6.9L12 17.3l-5.9 3.4 1.6-6.9L2.4 9.2l7-.6z"/></svg>
                  CHAMPIONS
                </span>
              )}
              <div className="team-sprite"><img src={img} alt={name} /></div>
              <div className="team-meta">
                <div className="team-code">{code} · TEAM {String(i + 1).padStart(2, '0')}</div>
                <div className="team-name">{name}</div>
                <div className="team-leads">
                  <div className="team-lead"><span>OWNER</span><b>{owner}</b></div>
                  <div className="team-lead"><span>CAPTAIN</span><b>{captain}</b></div>
                </div>
                <div className="team-players"><span className="team-count">{players} PLAYERS</span><span className="team-view">VIEW TEAM</span></div>
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