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
  return (
    <div className="player-card-lite">
      {avatarUrl ? (
        <img className="player-card-bg" src={avatarUrl} alt={name} loading="lazy" />
      ) : (
        <div className="player-card-bg player-card-bg-fallback">{fallbackInitials}</div>
      )}
      <div className="player-card-shade" />
      <div className="player-card-top">
        <div className="player-card-id">
          <h3>{name}</h3>
          <p>{title} · @{handle}</p>
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