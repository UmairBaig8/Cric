import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Eye, BarChart3, Wifi, Monitor, Smartphone, Tablet, MapPin, Repeat, UserPlus, Users, Bot } from 'lucide-react';
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

type GroupRow = {
  ip_hash?: string | null;
  fingerprint?: string | null;
  city: string | null;
  country: string | null;
  isp: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  session_count: number;
  visitor_count: number;
  fingerprint_count?: number;
  ip_count?: number;
  active_count: number;
  last_seen: string;
  is_bot: boolean;
};

type GroupData = {
  ip_groups: GroupRow[];
  device_groups: GroupRow[];
  active_visitors: number;
};

const BOT_NOTE = 'These connections belong to cloud/data-center networks, not homes or offices. They are usually automated checks or crawlers, not real people.';

function PersonRow({ row, expanded, onToggle }: { row: GroupRow; expanded: boolean; onToggle: () => void }) {
  const detail = [
    row.ip_hash ? `connection ${row.ip_hash.slice(0, 12)}…` : null,
    row.fingerprint ? `device key ${row.fingerprint.slice(0, 8)}…` : null,
    row.session_count ? `${row.session_count} session${row.session_count === 1 ? '' : 's'}` : null,
    row.visitor_count && row.visitor_count > 1 ? `${row.visitor_count} visitor IDs` : null,
    row.ip_count && row.ip_count > 1 ? `${row.ip_count} connections` : null,
  ].filter(Boolean).join(' · ');
  return (
    <div className="rounded-lg border px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
            {row.device === 'Mobile' ? <Smartphone className="size-4 text-muted-foreground" /> : row.device === 'Tablet' ? <Tablet className="size-4 text-muted-foreground" /> : <Monitor className="size-4 text-muted-foreground" />}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {row.browser ?? 'Unknown'} on {row.os ?? 'Unknown OS'}
              {row.active_count > 0 ? <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"><span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />ONLINE</span> : null}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {row.city && row.country ? `${row.city}, ${row.country}` : row.country ?? 'Unknown location'}
              {row.session_count > 1 ? ` · ${row.session_count} tabs` : ' · 1 tab'}
              {' · '}{row.active_count > 0 ? 'online now' : `seen ${fmtAgo(row.last_seen)}`}
            </div>
          </div>
        </div>
        <button type="button" onClick={onToggle} className="shrink-0 text-[10px] font-bold tracking-wide text-muted-foreground hover:text-foreground">
          {expanded ? 'HIDE DETAILS' : 'DETAILS'}
        </button>
      </div>
      {expanded ? (
        <div className="mt-2 border-t pt-2 font-mono text-[10px] leading-5 text-muted-foreground">
          {detail || 'No technical details for this visit yet.'}
        </div>
      ) : null}
    </div>
  );
}

function SessionGroups({ groups }: { groups: GroupData | null }) {
  const people = (groups?.device_groups ?? []).filter((r) => !r.is_bot);
  const bots = (groups?.device_groups ?? []).filter((r) => r.is_bot);
  const connections = groups?.ip_groups ?? [];
  const sharedConnection = connections.filter((r) => !r.is_bot && (r.fingerprint_count ?? 0) > 1);
  const sharedDevice = (groups?.device_groups ?? []).filter((r) => !r.is_bot && (r.visitor_count ?? 0) > 1);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <h3 className="font-display text-lg font-bold tracking-wide">WHO&apos;S ONLINE</h3>
          <span className="text-xs text-muted-foreground">
            {people.length ? `${people.filter((r) => r.active_count > 0).length} online now · ${people.length} seen today` : 'no human visitors tracked yet'}
          </span>
        </div>
        {people.length ? (
          <div className="space-y-1.5">
            {people.map((row) => (
              <PersonRow key={row.fingerprint} row={row} expanded={open === row.fingerprint} onToggle={() => setOpen(open === row.fingerprint ? null : (row.fingerprint ?? null))} />
            ))}
          </div>
        ) : (
          <p className="py-3 text-xs text-muted-foreground">No human visitors tracked yet — visits will appear here.</p>
        )}
        {sharedConnection.length > 0 || sharedDevice.length > 0 ? (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            {sharedConnection.length > 0
              ? `${sharedConnection.length === 1 ? 'One connection is' : `${sharedConnection.length} connections are`} used by ${sharedConnection.map((r) => `${r.fingerprint_count} devices`).join(' and ')} — usually a household or office WiFi, but worth checking if the same person registered twice. See the ACTIVITY tab.`
              : ''}
            {sharedConnection.length > 0 && sharedDevice.length > 0 ? ' ' : ''}
            {sharedDevice.length > 0
              ? `${sharedDevice.length === 1 ? 'One device is' : `${sharedDevice.length} devices are`} linked to ${sharedDevice.length === 1 ? 'multiple visitor IDs' : 'several visitors'} — same browser used by different people, or cleared tracking.`
              : ''}
          </div>
        ) : null}
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <Bot className="size-4 text-muted-foreground" />
          <h3 className="font-display text-lg font-bold tracking-wide">AUTOMATED TRAFFIC</h3>
          <span className="text-xs text-muted-foreground">{bots.length ? `${bots.length} device${bots.length === 1 ? '' : 's'}` : 'none'}</span>
        </div>
        {bots.length ? (
          <>
            <div className="mb-3 space-y-1.5">
              {bots.map((row) => (
                <div key={row.fingerprint} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0 truncate">
                    <span className="font-medium">{row.isp ?? 'Cloud network'}</span>
                    <span className="text-xs text-muted-foreground"> · {row.country ?? 'Unknown'}</span>
                  </div>
                  <div className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
                    {row.session_count} session{row.session_count === 1 ? '' : 's'} · seen {fmtAgo(row.last_seen)}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{BOT_NOTE}</p>
          </>
        ) : (
          <p className="py-3 text-xs text-muted-foreground">No cloud/bot traffic detected.</p>
        )}
      </div>
    </div>
  );
}

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