import { useEffect, useState } from 'react';
import { hasSupabaseConfig } from './env';
import { fetchRecentPlayers, fetchRegistrationsCount, fetchSiteSettings, fetchTeams, fetchPlayerCards } from './lib/site';
import type { RecentPlayer, PlayerCard } from './lib/site';
import { useTheme } from './lib/useTheme';
import FlameWrap from './components/canvasui/FlameWrap';
import SiteHeader from './components/SiteHeader';

const steps = [
  ['✎', 'REGISTER', 'Sign up and create your player profile.'],
  ['⚒', 'AUCTION', 'Get picked by your favourite team.'],
  ['👕', 'JERSEY DAY', 'Wear your team colours. Wear your pride.'],
  ['🏏', 'MATCH DAY', 'Compete. Perform. Make memories.'],
  ['🏆', 'BECOME LEGEND', 'Top the leaderboard. Be the legend.'],
];

const benefits = [
  ['02', 'THE AUCTION.', "Bring your confidence. Bring your game. Find out who thinks you're worth the bid.", 'auction'],
  ['03', 'YOUR PLAYER CARD.', 'Your name, photo, role and stats become part of the DPL universe.', ''],
  ['04', 'BRAGGING RIGHTS.', 'Runs. Wickets. Wins. Rankings. Let the office leaderboard do the talking.', 'leaderboard'],
  ['05', 'THE MEMORIES.', "Because six months from now, nobody remembers the Tuesday status call. They'll remember that six.", 'gallery'],
];

const FALLBACK_TEAMS = ['THUNDER ⚡', 'TITANS ◈', 'WARRIORS ✦', 'STRIKERS ◉', 'ROYALS ♛', 'MAVERICKS ◆'];
const FALLBACK_SECONDS = 15 * 86400 + 8 * 3600 + 42 * 60 + 33;

export default function App() {
  const { dark, toggleTheme } = useTheme();
  const [deadlineAt, setDeadlineAt] = useState<number | null>(null);
  const [fallbackSeconds, setFallbackSeconds] = useState(FALLBACK_SECONDS);
  const [now, setNow] = useState(() => Date.now());

  const [playerCount, setPlayerCount] = useState(87);
  const [capacity, setCapacity] = useState(128);
  const [totalTeams, setTotalTeams] = useState(16);
  const [totalMatches, setTotalMatches] = useState(24);
  const [championLabel, setChampionLabel] = useState('1');
  const [teams, setTeams] = useState<string[]>(FALLBACK_TEAMS);
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([]);
  const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchSiteSettings(), fetchTeams(), fetchRegistrationsCount(), fetchRecentPlayers(5), fetchPlayerCards(8)]).then(([settings, teamRows, count, players, cards]) => {
      if (!mounted) return;
      if (settings) {
        if (settings.registration_deadline) setDeadlineAt(new Date(settings.registration_deadline).getTime());
        setCapacity(settings.player_capacity);
        setTotalTeams(settings.total_teams);
        setTotalMatches(settings.total_matches);
        if (settings.champion) setChampionLabel(settings.champion);
      }
      if (teamRows.length) setTeams(teamRows.map((team) => `${team.name} ${team.icon}`.trim()));
      if (typeof count === 'number') setPlayerCount(count);
      if (players.length) setRecentPlayers(players);
      if (cards.length) setPlayerCards(cards);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      setFallbackSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const secondsLeft = deadlineAt !== null ? Math.max(0, Math.floor((deadlineAt - now) / 1000)) : fallbackSeconds;
  const spotsLeft = Math.max(0, capacity - playerCount);
  const meterWidth = capacity > 0 ? Math.min(100, Math.round((playerCount / capacity) * 100)) : 0;
  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  const secs = secondsLeft % 60;
  const time = (value: number) => String(value).padStart(2, '0');

  return (
    <div className={dark ? 'app dark' : 'app'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} />

      <main id="top">
        <section className="hero" id="tournament">
          <div className="hero-art" aria-hidden="true" />
          <div className="shell hero-content">
            <div className="kicker"><i /> D2P 2026 · REGISTRATION LIVE</div>
            <div className="social-proof"><div className="avatars">{(recentPlayers.length ? recentPlayers : []).map((player) => player.photo_url ? <img alt={player.name} className="avatar" key={player.id} src={player.photo_url} /> : <i className="avatar" key={player.id} />)}{!recentPlayers.length ? [1, 2, 3, 4, 5].map((avatar) => <i className="avatar" key={avatar} />) : null}</div><strong>{playerCount}+</strong> players already joined</div>
            <h1>DESK TO<br /><span>PITCH.</span></h1>
            <div className="hero-sub">DIGITATE PREMIER LEAGUE · THE OFFICE CRICKET LEAGUE</div>
            <div className="hero-copy">Same office. Different game.<br />This time, let&apos;s <strong>play for keeps.</strong></div>
            <div className="actions"><a className="btn btn-primary" href="/D2P/register">🏏 JOIN DPL 2026 →</a><a className="btn btn-secondary" href="#teams">VIEW TOURNAMENT</a></div>
            <div className="hero-stats"><div className="stat"><b>{totalTeams}</b><small>TEAMS</small></div><div className="stat"><b>{playerCount}</b><small>PLAYERS</small></div><div className="stat"><b>{totalMatches}</b><small>MATCHES</small></div><div className="stat"><b>{championLabel}</b><small>CHAMPION</small></div></div>
          </div>
          <FlameWrap className="hero-flame" height={170} radius={20} melt={14} scorch={1.5} ember={2.5} distortion={14} smoke={1.5} rim={3} intensity={0.6}><aside className="hero-panel"><div className="panel-label">DPL 2026 / REGISTRATION WINDOW</div><div className="panel-title">Your spot is waiting.</div><div className="countdown"><div className="time"><b>{time(days)}</b><span>DAYS</span></div><div className="time"><b>{time(hours)}</b><span>HRS</span></div><div className="time"><b>{time(mins)}</b><span>MINS</span></div><div className="time"><b>{time(secs)}</b><span>SECS</span></div></div><div className="capacity"><div className="capacity-head"><span>PLAYER CAPACITY</span><strong><span>{playerCount}</span> / {capacity}</strong></div><div className="meter"><i style={{ width: `${meterWidth}%` }} /></div><div className="spots">Only <strong>{spotsLeft} spots</strong> left. Don&apos;t sit this one out.</div></div><a className="btn btn-primary panel-cta" href="/D2P/register">YES, COUNT ME IN →</a></aside></FlameWrap>
        </section>

        <section className="ribbon"><div className="shell ribbon-grid">{[['🪑', 'BREAK THE ROUTINE', 'Step out of the chair. Into the game.'], ['🤝', 'TEAM UP', 'Bond beyond projects. Build real teamwork.'], ['🎯', 'COMPETE', 'Challenge rivals. Bring your A-game.'], ['🏆', 'WIN GLORY', 'Lift the trophy. Earn the bragging rights.']].map(([icon, title, copy]) => <div className="ribbon-item" key={title}><div className="ribbon-icon">{icon}</div><div><b>{title}</b><p>{copy}</p></div></div>)}</div></section>

        <section className="desk-pitch" id="journey"><div className="shell"><div className="section-head"><div className="eyebrow cyan">THE D2P JOURNEY</div><h2>FROM DESK.<br /><span>TO PITCH.</span></h2><p>Same colleagues. Different battlefield. The transformation that makes D2P what it is.</p></div><div className="dp-track"><article className="dp-card desk"><div className="dp-icon">💻</div><div className="dp-time">9:00 AM</div><h3>THE DESK</h3><p>Emails · Meetings · Code · Deadlines</p></article><div className="dp-arrow" aria-hidden="true">→</div><article className="dp-card pitch"><div className="dp-icon">🏏</div><div className="dp-time">7:00 PM</div><h3>THE PITCH</h3><p>Teams · Sixes · Rivalries · Glory</p></article></div><p className="dp-tagline">Same colleagues. <span>Different battlefield.</span></p></div></section>

        <section className="squad" id="players"><div className="shell"><div className="section-head"><div className="eyebrow">ALREADY IN</div><h2>MEET THE SQUAD.</h2><p>These players have locked in their spot. Your player card could be next.</p></div>{playerCards.length ? <div className="player-grid">{playerCards.map((player) => <article className="player-card" key={player.id}><div className="player-photo">{player.photo_url ? <img alt={player.name} src={player.photo_url} /> : <span>{player.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span>}</div><h3>{player.name}</h3><span className="player-role">{player.player_type}</span><span className="player-squad">{player.squad}</span></article>)}</div> : <div className="player-grid">{[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => <article className="player-card placeholder" key={slot}><div className="player-photo"><span>?</span></div><h3>YOUR NAME</h3><span className="player-role">YOUR ROLE</span><span className="player-squad">YOUR SQUAD</span></article>)}</div>}<div className="squad-cta"><a className="btn btn-primary" href="/D2P/register">🏏 ADD YOUR CARD →</a></div></div></section>

        <section className="section" id="how"><div className="shell"><div className="section-head"><div className="eyebrow">FROM SIGN-UP TO TROPHY</div><h2>HOW DPL WORKS</h2><p>One simple journey from your desk to match day. Your player profile follows you all the way to the final.</p></div><div className="steps">{steps.map(([icon, title, copy]) => <article className="step" key={title}><div className="step-dot">{icon}</div><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

        <section className="benefits" id="teams"><div className="shell"><div className="section-head"><div className="eyebrow cyan">THE OFFICE. THE TEAMS. THE STORY.</div><h2>DPL IS MORE THAN CRICKET.</h2><p>It&apos;s the part of the year where the person sitting two desks away suddenly becomes your biggest rival.</p></div><div className="benefit-grid"><article className="benefit"><div className="num">01</div><h3>MEET YOUR OTHER TEAM.</h3><p>Forget the org chart for a day. Developers, designers, sales, HR, managers — everyone starts on the same pitch.</p><div className="team-cloud">{teams.map((team) => <span className="team" key={team}>{team}</span>)}</div></article>{benefits.map(([number, title, copy, id]) => <article className="benefit" id={id} key={number}><div className="num">{number}</div><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

        <section className="cta" id="register"><div className="shell"><div className="eyebrow">YOUR NEXT OFFICE STORY</div><h2>DON&apos;T JUST WORK<br /><span>PLAY TOGETHER.</span></h2><p>Registration takes a minute. The memories last much longer.</p><a className="btn btn-primary" href="/D2P/register">🏏 YES, COUNT ME IN →</a></div></section>
      </main>
      <footer id="about">D2P · DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET · BUILT FOR THE PEOPLE WHO TURN COFFEE BREAKS INTO CRICKET DEBATES. {hasSupabaseConfig ? '· CONNECTED' : '· DEMO MODE'}</footer>
    </div>
  );
}