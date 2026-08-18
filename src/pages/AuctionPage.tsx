import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/useTheme';
import SiteHeader from '@/components/SiteHeader';
import DepthCarousel from '@/components/DepthCarousel';
import SpotlightCard from '@/components/SpotlightCard';
import { fetchAuctionPlayers, type AuctionPlayer } from '@/lib/site';

const availabilityShort: Record<string, string> = {
  'Available for all matches': 'ALL MATCHES',
  'Available for most matches': 'MOST MATCHES',
  'Need schedule confirmation': 'CONFIRM',
};

function PlayerCard({ player }: { player: AuctionPlayer }) {
  const avail = player.availability === 'Available for all matches' ? 3 : player.availability === 'Available for most matches' ? 2 : 1;
  const availLabel = availabilityShort[player.availability] ?? player.availability;
  return (
    <SpotlightCard className="ac-card-spotlight" spotlightColor="rgba(255, 255, 255, 0.16)">
      <div className="ac-slide">
        <div className="auction-card-top">
          <span className="ac-league">DPL <b>2026</b></span>
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
          <span className="ac-squad"><span className="ac-squad-dot" />{player.location}</span>
          <div className="ac-rating" aria-label={`${player.self_rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} viewBox="0 0 24 24" className={star <= player.self_rating ? 'on' : ''} fill="currentColor" aria-hidden="true"><path d="M12 2l2.6 6.6 7 .6-5.3 4.6 1.6 6.9L12 17.3l-5.9 3.4 1.6-6.9L2.4 9.2l7-.6z"/></svg>
            ))}
            <span className="ac-rating-num">{player.self_rating}.0</span>
          </div>
          <div className="ac-chips">
            <span className="ac-chip"><i className="ac-chip-icon">🏏</i>{player.batting_style.replace('hand batter', '')}</span>
            <span className="ac-chip"><i className="ac-chip-icon">🎯</i>{player.bowling_style.replace('Do not bowl', 'NO BOWL')}</span>
          </div>
          <div className="ac-avail">
            <div className="ac-avail-head"><span>AVAILABILITY</span><b>{availLabel}</b></div>
            <div className="ac-avail-bar"><i className={`lvl-${avail}`} /></div>
          </div>
        </div>
        <div className="ac-bid">
          <div className="ac-bid-top">
            <span className={`ac-bid-status${player.dpl_played ? ' vet' : ''}`}>{player.dpl_played ? '★' : '·'} {player.dpl_played ? 'DPL VET' : 'DPL ROOKIE'}</span>
            <span className="ac-bid-label">OPENING BID</span>
          </div>
          <div className="ac-bid-amount">
            <span className="ac-bid-cur">₹</span>
            <b>0</b>
            <small>/BASE</small>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}

export default function AuctionPage() {
  const { dark, toggleTheme } = useTheme();
  const [players, setPlayers] = useState<AuctionPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void fetchAuctionPlayers().then((data) => {
      setPlayers(data);
      setLoading(false);
    });
  }, []);

  const filtered = query.trim()
    ? players.filter((player) =>
        `${player.name} ${player.player_type} ${player.location} ${player.gender}`.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : players;

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
          <div className="auction-search"><span className="auction-search-icon">🔎</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, role, squad, gender…" /></div>
        </div>
        {loading ? (
          <div className="auction-empty"><div className="auction-empty-badge">⚒</div><h2>LOADING PLAYERS…</h2></div>
        ) : filtered.length ? (
          <div className="auction-carousel-wrap">
            <DepthCarousel
              items={filtered.map((player) => ({ alt: player.name, content: <PlayerCard player={player} /> }))}
              cardWidth={300}
              cardHeight={420}
              radius={18}
              depth={240}
              spread={110}
              tilt={22}
              tiltDirection="right"
              perspective={1400}
              visibleCards={4}
              falloff={0.2}
              blur={6}
              duration={700}
              autoplay
              autoplayDelay={3200}
              loop
              showIndicators={filtered.length <= 8}
            />
          </div>
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