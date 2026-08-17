import SiteHeader from './components/SiteHeader';
import { useTheme } from './lib/useTheme';
import { TEAMS } from './teamData';

export default function TeamsPage() {
  const { dark, toggleTheme } = useTheme();

  return (
    <div className={dark ? 'app dark teams-page' : 'app teams-page'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="teams-main shell">
        <div className="teams-head">
          <div className="eyebrow">D2P 2026 · THE LEAGUE</div>
          <h1>MEET THE <span>TEAMS.</span></h1>
          <p className="teams-desc">Ten teams. Ten identities. One trophy. Meet the squads stepping out of the office and onto the pitch.</p>
        </div>
        <section className="teams-grid">
          {TEAMS.map(({ name, code, img, theme, players, champion }, i) => (
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