import { useEffect, useState } from 'react';
import { useTheme } from './lib/useTheme';
import SiteHeader from './components/SiteHeader';
import { fetchAuctionPlayers, type AuctionPlayer } from './lib/site';

const availabilityShort: Record<string, string> = {
  'Available for all matches': 'ALL MATCHES',
  'Available for most matches': 'MOST MATCHES',
  'Need schedule confirmation': 'CONFIRM',
};

const experienceShort: Record<string, string> = {
  'New to cricket': 'NEWBIE',
  'Casual player': 'CASUAL',
  'Club / college player': 'CLUB',
  'Experienced league player': 'PRO',
};

const PAGE_SIZE = 24;

export default function AuctionPage() {
  const { dark, toggleTheme } = useTheme();
  const [players, setPlayers] = useState<AuctionPlayer[]>([]);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void fetchAuctionPlayers().then((data) => {
      setPlayers(data);
      setVisible(PAGE_SIZE);
      setLoading(false);
    });
  }, []);

  const filtered = query.trim()
    ? players.filter((player) =>
        `${player.name} ${player.player_type} ${player.squad} ${player.gender}`.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : players;

  const shown = filtered.slice(0, visible);

  return (
    <div className={dark ? 'app dark auction-page' : 'app auction-page'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="auction-main shell">
        <section className="auction-head">
          <h1>READY FOR<br /><span>AUCTION.</span></h1>
          <p>Every registered player is up for grabs. Study the profile, set your price, bid on auction day.</p>
        </section>
        <div className="auction-toolbar">
          <div className="auction-count">{players.length} PLAYERS IN THE POOL</div>
          <div className="auction-search"><input value={query} onChange={(event) => { setQuery(event.target.value); setVisible(PAGE_SIZE); }} placeholder="Search name, role, squad, gender…" /></div>
        </div>
        {loading ? (
          <div className="auction-empty"><div className="auction-empty-badge">⚒</div><h2>LOADING PLAYERS…</h2></div>
        ) : filtered.length ? (
          <>
            <div className="auction-grid">
              {shown.map((player) => (
                <article className="auction-card" key={player.id}>
                <div className="auction-card-top">
                  <span className="ac-league">D2P <b>2026</b></span>
                  <span className="ac-no">#{player.employee_id}</span>
                </div>
                <div className="ac-photo">
                  {player.photo_url ? <img alt={player.name} src={player.photo_url} /> : <span className="ac-photo-fallback"><i>{player.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</i></span>}
                  <span className="ac-photo-grad" />
                  <span className="ac-role">{player.player_type}</span>
                  <span className={`ac-gender ${player.gender?.toLowerCase()}`}>{player.gender === 'Female' ? '♀' : '♂'}</span>
                </div>
                <div className="ac-body">
                  <strong className="ac-name">{player.name}</strong>
                  <span className="ac-squad">{player.squad}</span>
                  <div className="ac-tags">
                    <span>{experienceShort[player.cricket_experience] ?? player.cricket_experience}</span>
                    <span>JERSEY {player.jersey_size}</span>
                  </div>
                  <div className="ac-styles">
                    <span>{player.batting_style}</span>
                    <span>{player.bowling_style}</span>
                  </div>
                  <div className="ac-avail">
                    <i className={player.availability === 'Available for all matches' ? 'on' : player.availability === 'Available for most matches' ? 'mid' : 'low'} />
                    {availabilityShort[player.availability] ?? player.availability}
                  </div>
                </div>
                <div className="ac-bid">
                  <span>OPENING BID</span>
                  <b>₹0</b>
                  <small>BID ON AUCTION DAY</small>
                </div>
              </article>
            ))}
            </div>
            {visible < filtered.length ? (
              <div className="auction-more">
                <button type="button" className="btn btn-ghost" onClick={() => setVisible((count) => count + PAGE_SIZE)}>LOAD MORE PLAYERS ({filtered.length - visible} LEFT) ↓</button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="auction-empty">
            <div className="auction-empty-badge">{query.trim() ? '🔍' : '⚒'}</div>
            <h2>{query.trim() ? 'NO MATCHES' : 'NO PLAYERS YET'}</h2>
            <p>{query.trim() ? `Nothing matches "${query.trim()}". Try a different search.` : 'Players registered so far will appear here as soon as they sign up.'}</p>
            {query.trim() ? null : <a className="btn btn-primary" href="/D2P/register">🏏 REGISTER AS A PLAYER →</a>}
          </div>
        )}
      </main>
      <footer>DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET</footer>
    </div>
  );
}