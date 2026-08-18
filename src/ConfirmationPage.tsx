import { useTheme } from './lib/useTheme';
import SiteHeader from './components/SiteHeader';
import { withBase } from './lib/base';

export default function ConfirmationPage() {
  const { dark, toggleTheme } = useTheme();
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name') ?? '';

  return (
    <div className={dark ? 'app dark register-page confirmation-page' : 'app register-page confirmation-page'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="confirmation-main shell">
        <div className="confirmation-card">
          <div className="confirmation-badge">✔</div>
          <p className="eyebrow">DPL 2026 / REGISTRATION RECEIVED</p>
          <h1>YOU&apos;RE IN,<br /><span>{name || 'CHAMP'}</span>.</h1>
          <p className="confirmation-copy">Your player profile has been saved. You&apos;re all set for auction day.</p>
          <div className="confirmation-steps">
            <div><b>01</b><strong>AUCTION DAY</strong><span>Bring your confidence. Find out your team.</span></div>
            <div><b>02</b><strong>JERSEY DAY</strong><span>Wear your team colours. Wear your pride.</span></div>
            <div><b>03</b><strong>MATCH DAY</strong><span>Make memories on the pitch.</span></div>
          </div>
          <a className="btn btn-primary" href={withBase('/')}>← BACK TO D2P</a>
        </div>
      </main>
    </div>
  );
}