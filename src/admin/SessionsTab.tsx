import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Eye, BarChart3, Wifi, Monitor, Smartphone, Tablet, MapPin, Repeat, UserPlus, Network, MonitorSmartphone } from 'lucide-react';
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
  top_cities: { label: string; sessions: number }[];
  referrers: { label: string; sessions: number }[];
  hours: { hour: number; views: number }[];
  heatmap: { dow: number; hour: number; views: number }[];
  registered_visitors: number;
  recent_sessions: {
    id: string;
    started_at: string;
    last_seen: string;
    page_count: number;
    device: string | null;
    browser: string | null;
    os: string | null;
    language: string | null;
    screen: string | null;
    referrer: string | null;
    is_active: boolean;
    country: string | null;
    region: string | null;
    city: string | null;
    isp: string | null;
    visit_number: number | null;
    pages: string[];
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

const fmtPage = (path: string) => (path === '/' ? 'HOME' : path.slice(1).toUpperCase() || 'HOME');

const DOW_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function HourlyChart({ hours }: { hours: { hour: number; views: number }[] }) {
  const buckets = Array.from({ length: 24 }, (_, index) => {
    const epoch = hours.find((h) => new Date(h.hour * 1000).getHours() === index);
    return { hour: index, views: epoch?.views ?? 0 };
  });
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="mb-3 font-display text-lg font-bold tracking-wide">TRAFFIC — LAST 24H</h3>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={buckets} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="hourFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#873cff" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#873cff" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="hour" tickFormatter={(h: number) => `${String(h).padStart(2, '0')}:00`} tickLine={false} axisLine={false} tickMargin={6} fontSize={10} interval={2} tick={{ fill: 'var(--color-muted-foreground)' }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} tick={{ fill: 'var(--color-muted-foreground)' }} />
            <Tooltip formatter={(value) => [`${value} views`]} labelFormatter={(h) => `${String(h).padStart(2, '0')}:00`} contentStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="views" stroke="#873cff" strokeWidth={2} fill="url(#hourFill)" name="Views" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PeakHeatmap({ heatmap }: { heatmap: { dow: number; hour: number; views: number }[] }) {
  const max = Math.max(1, ...heatmap.map((c) => c.views));
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="mb-3 font-display text-lg font-bold tracking-wide">PEAK HOURS — LAST 7 DAYS</h3>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="mb-1 flex gap-1 pl-8">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="flex-1 text-center text-[9px] font-semibold text-muted-foreground">{hour % 3 === 0 ? hour : ''}</div>
            ))}
          </div>
          {DOW_NAMES.map((day, dow) => (
            <div key={day} className="mb-1 flex items-center gap-1">
              <div className="w-8 text-right text-[9px] font-bold text-muted-foreground">{day}</div>
              {Array.from({ length: 24 }, (_, hour) => {
                const views = heatmap.find((c) => c.dow === dow && c.hour === hour)?.views ?? 0;
                const intensity = views ? 0.1 + 0.9 * (views / max) : 0;
                return (
                  <div
                    key={hour}
                    title={`${day} ${String(hour).padStart(2, '0')}:00 — ${views} views`}
                    className="h-4 flex-1 rounded-[3px]"
                    style={{ background: views ? `rgba(135, 60, 255, ${intensity})` : 'color-mix(in srgb, var(--color-muted) 45%, transparent)' }}
                  />
                );
              })}
            </div>
          ))}
          <div className="mt-1 flex items-center gap-1 pl-8 text-[9px] text-muted-foreground">
            <span>less</span>
            <div className="h-2 flex-1 rounded bg-gradient-to-r from-muted via-purple-500/50 to-purple-600" />
            <span>more</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const DeviceIcon = ({ device }: { device: string | null }) => {
  if (device === 'Mobile') return <Smartphone className="size-4 shrink-0 text-muted-foreground" />;
  if (device === 'Tablet') return <Tablet className="size-4 shrink-0 text-muted-foreground" />;
  return <Monitor className="size-4 shrink-0 text-muted-foreground" />;
};

function SessionGroups({ groups }: { groups: GroupData | null }) {
  const ipRows = groups?.ip_groups ?? [];
  const devRows = groups?.device_groups ?? [];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
          <Network className="size-3.5" /> CONNECTIONS — GROUPED BY IP HASH
        </div>
        {ipRows.length ? (
          <div className="space-y-1.5">
            {ipRows.slice(0, 8).map((row) => {
              const shared = (row.visitor_count ?? 0) > 1 || (row.fingerprint_count ?? 0) > 1;
              return (
                <div key={row.ip_hash} className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-sm ${shared ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-muted-foreground">{row.ip_hash.slice(0, 12)}…</span>
                      {shared ? <Badge variant="secondary" className="text-[9px]">SHARED</Badge> : null}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[row.city, row.country].filter(Boolean).join(', ')}{row.isp ? ` · ${row.isp}` : ''}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-[10px] text-muted-foreground whitespace-nowrap">
                    <div className="font-bold text-foreground">{row.session_count} session{row.session_count === 1 ? '' : 's'}</div>
                    {row.visitor_count > 1 ? <div>{row.visitor_count} visitors</div> : null}
                    {row.fingerprint_count > 1 ? <div>{row.fingerprint_count} devices</div> : null}
                    {row.active_count > 0 ? <div className="text-emerald-600 dark:text-emerald-400">{row.active_count} live</div> : null}
                    <div>seen {fmtAgo(row.last_seen)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-3 text-xs text-muted-foreground">No connection data yet.</p>
        )}
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
          <MonitorSmartphone className="size-3.5" /> DEVICES — GROUPED BY FINGERPRINT
        </div>
        {devRows.length ? (
          <div className="space-y-1.5">
            {devRows.slice(0, 8).map((row) => {
              const shared = (row.visitor_count ?? 0) > 1 || (row.ip_count ?? 0) > 1;
              return (
                <div key={row.fingerprint} className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-sm ${shared ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-muted-foreground">fp:{row.fingerprint.slice(0, 8)}…</span>
                      {shared ? <Badge variant="secondary" className="text-[9px]">SHARED</Badge> : null}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[row.device, row.browser, row.os].filter(Boolean).join(' · ') || 'Unknown device'}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-[10px] text-muted-foreground whitespace-nowrap">
                    <div className="font-bold text-foreground">{row.session_count} session{row.session_count === 1 ? '' : 's'}</div>
                    {row.visitor_count > 1 ? <div>{row.visitor_count} visitors</div> : null}
                    {row.ip_count > 1 ? <div>{row.ip_count} connections</div> : null}
                    {row.active_count > 0 ? <div className="text-emerald-600 dark:text-emerald-400">{row.active_count} live</div> : null}
                    <div>seen {fmtAgo(row.last_seen)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-3 text-xs text-muted-foreground">Fingerprints kick in with the next visit.</p>
        )}
      </div>
    </div>
  );
}

type GroupData = {
  ip_groups: {
    ip_hash: string; city: string | null; region: string | null; country: string | null; isp: string | null;
    device: string | null; browser: string | null; os: string | null;
    session_count: number; visitor_count: number; fingerprint_count: number; active_count: number; last_seen: string;
  }[];
  device_groups: {
    fingerprint: string; device: string | null; browser: string | null; os: string | null;
    session_count: number; visitor_count: number; ip_count: number; active_count: number; last_seen: string;
  }[];
  active_visitors: number;
};

export default function SessionsTab() {
  const [online, setOnline] = useState<number | null>(null);
  const [views, setViews] = useState<ViewsSummary | null>(null);
  const [groups, setGroups] = useState<GroupData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => onOnlineCount(setOnline), []);

  useEffect(() => {
    let alive = true;
    supabaseRef!
      .rpc('admin_views_summary')
      .then(({ data, error }) => {
        if (!error && data && alive) setViews(data[0]);
      }, () => undefined);
    supabaseRef!
      .rpc('admin_session_groups')
      .then(({ data, error }) => {
        if (!error && data && alive) setGroups(data[0]);
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
        <StatCard icon={<Activity />} label="ONLINE NOW" value={groups?.active_visitors ?? online ?? '…'} sub="unique visitors" accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={<Eye />} label="VIEWS TODAY" value={views?.today ?? '…'} sub="unique sessions" accent="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" />
        <StatCard icon={<BarChart3 />} label="TOTAL VIEWS" value={views?.total ?? '…'} sub="all time" accent="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
        <StatCard icon={<Wifi />} label="SESSIONS TODAY" value={views?.sessions_today ?? '…'} sub="visitors started" accent="bg-purple-500/10 text-purple-600 dark:text-purple-400" />
        <StatCard icon={<UserPlus />} label="REGISTERED" value={views?.registered_visitors ?? '…'} sub={views?.sessions_today ? `${Math.round(((views.registered_visitors ?? 0) / views.sessions_today) * 100)}% of today's sessions` : 'tracked visitors'} accent="bg-pink-500/10 text-pink-600 dark:text-pink-400" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HourlyChart hours={views?.hours ?? []} />
        <PeakHeatmap heatmap={views?.heatmap ?? []} />
      </div>

      <SessionGroups groups={groups} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">TOP PAGES</div>
          {views && views.paths.length ? (
            <div className="space-y-1.5">
              {views.paths.slice(0, 6).map((row) => (
                <div key={row.path} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{fmtPage(row.path)}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{row.views}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-3 text-xs text-muted-foreground">No views recorded yet.</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground"><MapPin className="size-3.5" /> TOP CITIES TODAY</div>
          {views && views.top_cities.length ? (
            <div className="space-y-1.5">
              {views.top_cities.slice(0, 6).map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{row.label}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{row.sessions}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-3 text-xs text-muted-foreground">No location data yet — kicks in with the next visit.</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">REFERRERS TODAY</div>
          {views && views.referrers.length ? (
            <div className="space-y-1.5">
              {views.referrers.slice(0, 6).map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium capitalize">{row.label}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{row.sessions}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-3 text-xs text-muted-foreground">No referrer data yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold tracking-wide">RECENT SESSIONS</h3>
          <Badge variant="secondary">ACTIVE NOW: {groups?.active_visitors ?? views?.active_sessions ?? 0} unique</Badge>
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
                      {session.visit_number !== null && session.visit_number > 1 ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400"><Repeat className="size-3" />RETURN #{session.visit_number}</span>
                      ) : null}
                      {session.is_active && new Date(session.last_seen).getTime() > Date.now() - 120000 ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"><span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />LIVE</span>
                      ) : null}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[session.city && session.country ? `${session.city}, ${session.country}` : session.country, session.isp].filter(Boolean).join(' · ') || 'Unknown location'}
                      {session.language ? ` · ${session.language}` : ''}{session.screen ? ` · ${session.screen}` : ''}
                      {' · '}{session.page_count} {session.page_count === 1 ? 'page' : 'pages'} · {fmtDuration(session.started_at, session.last_seen)}
                      {session.referrer ? ` · via ${session.referrer}` : ' · direct'} · seen {fmtAgo(session.last_seen)}
                    </div>
                    {session.pages.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {session.pages.slice(0, 5).map((page, index) => (
                          <span key={`${page}-${index}`} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{fmtPage(page)}</span>
                        ))}
                        {session.pages.length > 5 ? <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">+{session.pages.length - 5}</span> : null}
                      </div>
                    ) : null}
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