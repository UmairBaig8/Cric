import SiteHeader from './components/SiteHeader';
import { useTheme } from './lib/useTheme';

const TEAMS = [
  { name: 'Digi Super Kings', code: 'DSK', img: '/D2P/teams/dsk.png', theme: 'kings', players: 12, champion: false },
  { name: 'Sahadriche Mavale', code: 'SM', img: '/D2P/teams/mavale.png', theme: 'mavale', players: 11, champion: false },
  { name: 'Digi Mitra Mandal', code: 'DMM', img: '/D2P/teams/mitra.png', theme: 'mitra', players: 12, champion: false },
  { name: 'Bhakarwadi Blasters', code: 'BB', img: '/D2P/teams/blaster.png', theme: 'blaster', players: 10, champion: false },
  { name: 'Digi Dhadakebaaz', code: 'DD', img: '/D2P/teams/dhada.png', theme: 'dhada', players: 11, champion: false },
  { name: 'Cricket Wala', code: 'CW', img: '/D2P/teams/wala.png', theme: 'wala', players: 12, champion: false },
  { name: 'Digi Titans', code: 'DT', img: '/D2P/teams/titans.png', theme: 'titans', players: 11, champion: false },
  { name: 'Digi Yodhas', code: 'DY', img: '/D2P/teams/yodhas.png', theme: 'yodhas', players: 10, champion: false },
  { name: 'Gallit Maramari', code: 'GM', img: '/D2P/teams/gallit.png', theme: 'gallit', players: 12, champion: true },
  { name: 'Digi Dhurandhars', code: 'DDH', img: '/D2P/teams/dhurandhars.png', theme: 'dhurandhars', players: 11, champion: false },
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
          {TEAMS.map(({ name, code, img, theme, players, champion }, i) => (
            <article className={`team-card ${theme}${champion ? ' champion' : ''}`} key={code}>
              {champion && <div className="team-champion">★ CHAMPION</div>}
              <div className="team-sprite"><img src={img} alt={name} /></div>
              <div className="team-meta">
                <div className="team-code">{code} · TEAM {String(i + 1).padStart(2, '0')}</div>
                <div className="team-name">{name}</div>
                <div className="team-players"><span className="team-count">{players} PLAYERS</span><span className="team-view">VIEW TEAM</span></div>
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