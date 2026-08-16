import { useState } from 'react';

const navLinks = [
  ['/tournaments', 'TOURNAMENTS'],
  ['/teams', 'TEAMS'],
  ['/fixtures', 'FIXTURES'],
  ['/auction', 'AUCTION'],
  ['/leaderboard', 'LEADERBOARD'],
  ['/gallery', 'GALLERY'],
  ['/about', 'ABOUT'],
];

type SiteHeaderProps = {
  dark: boolean;
  onToggleTheme: (nextDark: boolean) => void;
  relative?: boolean;
};

export default function SiteHeader({ dark, onToggleTheme, relative }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className={relative ? 'topbar shell register-topbar' : 'topbar shell'}>
      <a className="brand" href="/Cric/" aria-label="D2P home"><img className="brand-mark" src="/Cric/logo-96.png" alt="D2P logo" width="48" height="48" /><span className="brand-text">DPL <b>2026</b><small>DIGITATE PREMIER LEAGUE</small></span></a>
      <button className="nav-toggle" type="button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
      <nav className={open ? 'nav open' : 'nav'}>
        {navLinks.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
      </nav>
      <div className="theme-switch"><button className={!dark ? 'active' : ''} type="button" aria-label="Light theme" onClick={() => onToggleTheme(false)}>☼</button><button className={dark ? 'active' : ''} type="button" aria-label="Dark theme" onClick={() => onToggleTheme(true)}>☾</button></div>
    </header>
  );
}