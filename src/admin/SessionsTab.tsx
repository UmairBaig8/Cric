import { useEffect, useState } from 'react';
import { Activity, Eye, BarChart3, Wifi, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase as supabaseRef } from '@/lib/supabase';
import { onOnlineCount } from '@/lib/analytics';
import { StatCard } from '@/admin/StatCard';

type ViewsSummary = {
  today: number;
  total: number;
  paths: { path: string; views: number }[];
  active_sessions: number;
  sessions_today: number;
  recent_sessions: {
    id: string;
    started_at: string;
    last_seen: string;
    page_count: number;
    device: string | null;
    browser: string | null;
    os: string | null;
    referrer: string | null;
    is_active: boolean;
  }[];
};

const fmtDuration = (start: string, end: string) => {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const fmtAgo = (iso: string) => {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const DeviceIcon = ({ device }: { device: string | null }) => {
  if (device === 'Mobile') return <Smartphone className="size-4 shrink-0 text-muted-foreground" />;
  if (device === 'Tablet') return <Tablet className="size-4 shrink-0 text-muted-foreground" />;
  return <Monitor className="size-4 shrink-0 text-muted-foreground" />;
};

export default function SessionsTab() {
  const [online, setOnline] = useState<number | null>(null);
  const [views, setViews] = useState<ViewsSummary | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => onOnlineCount(setOnline), []);

  useEffect(() => {
    let alive = true;
    supabaseRef!
      .rpc('admin_views_summary')
      .then(({ data, error }) => {
        if (!error && data && alive) setViews(data[0]);
      }, () => undefined);
    return () => { alive = false; };
  }, [refreshKey]);

  useEffect(() => {
    const id = window.setInterval(() => setRefreshKey((key) => key + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<Activity />} label="ONLINE NOW" value={online ?? '…'} sub="live tabs" accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={<Eye />} label="VIEWS TODAY" value={views?.today ?? '…'} sub="unique sessions" accent="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" />
        <StatCard icon={<BarChart3 />} label="TOTAL VIEWS" value={views?.total ?? '…'} sub="all time" accent="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
        <StatCard icon={<Wifi />} label="SESSIONS TODAY" value={views?.sessions_today ?? '…'} sub="visitors started" accent="bg-purple-500/10 text-purple-600 dark:text-purple-400" />
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">TOP PAGES</div>
          {views && views.paths.length ? (
            <div className="space-y-1.5">
              {views.paths.slice(0, 4).map((row) => (
                <div key={row.path} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{row.path === '/' ? 'HOME' : row.path.slice(1).toUpperCase() || 'HOME'}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{row.views}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-3 text-xs text-muted-foreground">No views recorded yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold tracking-wide">RECENT SESSIONS</h3>
          <Badge variant="secondary">ACTIVE NOW: {views?.active_sessions ?? 0}</Badge>
        </div>
        {views && views.recent_sessions.length ? (
          <div className="space-y-2">
            {views.recent_sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <DeviceIcon device={session.device} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {[session.device, session.browser, session.os].filter(Boolean).join(' · ') || 'Unknown device'}
                      {session.is_active && new Date(session.last_seen).getTime() > Date.now() - 120000 ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"><span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />LIVE</span>
                      ) : null}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {session.page_count} {session.page_count === 1 ? 'page' : 'pages'} · {fmtDuration(session.started_at, session.last_seen)}
                      {session.referrer ? ` · via ${session.referrer}` : ' · direct'} · seen {fmtAgo(session.last_seen)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">No sessions recorded yet — visits to the site will show up here.</p>
        )}
      </div>
    </div>
  );
}