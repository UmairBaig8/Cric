import { useState } from 'react';
import { Pencil } from 'lucide-react';

type ProfileCardProps = {
  avatarUrl?: string | null;
  name: string;
  title: string;
  handle: string;
  status: string;
  fallbackInitials: string;
  rating: number | null;
  batting: string | null;
  onEdit: () => void;
};

export default function ProfileCard({ avatarUrl, name, title, handle, status, fallbackInitials, rating, batting, onEdit }: ProfileCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="player-card-lite">
      <div className="player-card-bg player-card-bg-fallback">{fallbackInitials}</div>
      {avatarUrl && !failed ? (
        <img
          className="player-card-bg"
          src={avatarUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity .35s ease' }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
      <div className="player-card-shade" />
      <div className="player-card-top">
        <div className="player-card-id">
          <h3>{name}</h3>
          <p>{title} · {handle}</p>
        </div>
        <button className="player-card-edit" type="button" onClick={onEdit} aria-label={`Edit ${name}`}>
          <Pencil className="size-3.5" /> EDIT
        </button>
      </div>
      <div className="player-card-bottom">
        <span className="player-card-status">{status}</span>
        <div className="player-card-stats">
          <div><b>{rating ?? '—'}</b><span>RATING</span></div>
          <div><b>{batting || '—'}</b><span>BATTING</span></div>
        </div>
      </div>
    </div>
  );
}