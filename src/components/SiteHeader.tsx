import { useState } from 'react';
import { Link } from 'react-router-dom';
import GlassSurface from './GlassSurface';

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
    <header className={relative ? 'topbar register-topbar' : 'topbar'}>
      <GlassSurface
        width="100%"
        height={72}
        borderRadius={999}
        brightness={dark ? 6 : 55}
        opacity={dark ? 0.55 : 0.85}
        blur={16}
        backgroundOpacity={dark ? 0.35 : 0.12}
        saturation={dark ? 1.7 : 1.4}
        borderWidth={0.1}
      >
        <a className="brand" href="/D2P/" aria-label="D2P home"><img className="brand-mark" src="/D2P/logo-96.png" alt="D2P logo" width="48" height="48" /><span className="brand-text">DPL <b>2026</b><small>DIGITATE PREMIER LEAGUE</small></span></a>
        <button className="nav-toggle" type="button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
        <nav className={open ? 'nav open' : 'nav'}>
          {navLinks.map(([to, label]) => <Link key={to} to={to} onClick={() => setOpen(false)}>{label}</Link>)}
        </nav>
        <div className="theme-switch"><button className={!dark ? 'active' : ''} type="button" aria-label="Light theme" onClick={() => onToggleTheme(false)}>☼</button><button className={dark ? 'active' : ''} type="button" aria-label="Dark theme" onClick={() => onToggleTheme(true)}>☾</button></div>
      </GlassSurface>
    </header>
  );
}