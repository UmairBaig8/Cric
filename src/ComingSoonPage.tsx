import SiteHeader from './components/SiteHeader';
import { useTheme } from './lib/useTheme';

type ComingSoonPageProps = {
  eyebrow: string;
  title: string;
  copy: string;
  icon?: string;
};

export default function ComingSoonPage({ eyebrow, title, copy, icon = '🏏' }: ComingSoonPageProps) {
  const { dark, toggleTheme } = useTheme();

  return (
    <div className={dark ? 'app dark coming-soon-page' : 'app coming-soon-page'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="coming-soon-main shell">
        <div className="coming-soon-card">
          <div className="coming-soon-icon">{icon}</div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>COMING<br /><span>SOON.</span></h1>
          <h2>{title}</h2>
          <p className="coming-soon-copy">{copy}</p>
          <a className="btn btn-primary" href="/D2P/">← BACK TO D2P</a>
        </div>
      </main>
      <footer>D2P · DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET · BUILT FOR THE PEOPLE WHO TURN COFFEE BREAKS INTO CRICKET DEBATES.</footer>
    </div>
  );
}