import SiteHeader from './components/SiteHeader';
import { useTheme } from './lib/useTheme';

export default function TeamsPage() {
  const { dark, toggleTheme } = useTheme();

  return (
    <div className={dark ? 'app dark teams-page' : 'app teams-page'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="teams-main shell">
        <div className="teams-card">
          <p className="eyebrow">DPL 2026 / TEAMS</p>
          <h1>MEET THE<br /><span>TEAMS.</span></h1>
          <p className="teams-copy">Teams, captains, and squads take shape after the auction. Your squad is loading — check back soon.</p>
          <a className="btn btn-primary" href="/D2P/">← BACK TO D2P</a>
        </div>
      </main>
      <footer>D2P · DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET · BUILT FOR THE PEOPLE WHO TURN COFFEE BREAKS INTO CRICKET DEBATES.</footer>
    </div>
  );
}
