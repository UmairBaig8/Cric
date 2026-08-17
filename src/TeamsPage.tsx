import SiteHeader from './components/SiteHeader';
import { useTheme } from './lib/useTheme';

const TEAMS = [
  ['Digi Super Kings', 'DSK', 0, 0, 'kings'],
  ['Sahadriche Mavale', 'SM', 1, 0, 'mavale'],
  ['Digi Mitra Mandal', 'DMM', 2, 0, 'mitra'],
  ['Bhakarwadi Blasters', 'BB', 3, 0, 'blaster'],
  ['Digi Dhadakebaaz', 'DD', 4, 0, 'dhada'],
  ['Cricket Wala', 'CW', 0, 1, 'wala'],
  ['Digi Titans', 'DT', 1, 1, 'titans'],
  ['Digi Yodhas', 'DY', 2, 1, 'yodhas'],
  ['Gallit Maramari', 'GM', 3, 1, 'gallit'],
  ['Digi Dhurandhars', 'DDH', 4, 1, 'dhurandhars'],
] as const;

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
          {TEAMS.map(([name, code, col, row, theme], i) => (
            <article className={`team-card ${theme}`} style={{ '--col': col, '--row': row } as React.CSSProperties} key={code}>
              <div className="team-sprite"><img src="/D2P/teams-icons.png" alt={name} /></div>
              <div className="team-meta">
                <div className="team-code">{code} · TEAM {String(i + 1).padStart(2, '0')}</div>
                <div className="team-name">{name}</div>
                <div className="team-players">08 PLAYERS · VIEW TEAM</div>
                <div className="team-arrow">↗</div>
              </div>
            </article>
          ))}
        </section>
      </main>
      <footer>D2P · DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET · BUILT FOR THE PEOPLE WHO TURN COFFEE BREAKS INTO CRICKET DEBATES.</footer>
    </div>
  );
}