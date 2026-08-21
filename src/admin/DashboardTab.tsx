import { useEffect, useMemo, useState } from 'react';
import { Area, Bar, BarChart, ComposedChart, CartesianGrid, Cell, Line, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import { Trophy, Users, ShieldCheck, Crown, Camera, RefreshCw, ClipboardCopy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { supabase as supabaseRef } from '@/lib/supabase';
import { fetchAdminPlayers, fetchAdminTeams, type AdminPlayer, type AdminTeam } from '@/lib/site';
import { resolveAsset } from '@/lib/base';
import { toast } from 'sonner';
import { StatCard } from '@/admin/StatCard';

function DonutCard({ title, rows }: { title: string; rows: { label: string; count: number; color: string }[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold tracking-wide">{title}</h3>
        <Badge variant="secondary">{total}</Badge>
      </div>
      {total === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">No data yet.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-6">
          <ChartContainer config={{ value: { label: 'Players', color: '#873cff' } }} className="h-40 flex-1 basis-40">
            <PieChart>
              <Pie data={rows} dataKey="count" nameKey="label" innerRadius={45} outerRadius={64} paddingAngle={2} strokeWidth={2}>
                {rows.map((row) => <Cell key={row.label} fill={row.color} />)}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
          <div className="min-w-0 flex-1 space-y-2">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 truncate font-medium"><span className="size-2 shrink-0 rounded-full" style={{ background: row.color }} />{row.label}</span>
                <span className="font-semibold tabular-nums text-muted-foreground">{row.count} · {Math.round((row.count / total) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TypesBarCard({ rows }: { rows: { label: string; count: number; color: string }[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold tracking-wide">PLAYER TYPES</h3>
        <Badge variant="secondary">{total}</Badge>
      </div>
      {total === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">No data yet.</p>
      ) : (
        <ChartContainer config={{ value: { label: 'Players', color: '#873cff' } }} className="h-52 w-full">
          <BarChart data={rows} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} interval={0} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} />
            <ChartTooltip cursor={{ fill: 'var(--color-muted)' }} content={<ChartTooltipContent />} />
            <Bar dataKey="count" name="Players" radius={[4, 4, 0, 0]}>
              {rows.map((row) => <Cell key={row.label} fill={row.color} />)}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}

function CapacityGauge({ registered, capacity }: { registered: number; capacity: number }) {
  const pct = Math.min(100, Math.round((registered / capacity) * 100));
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between text-xs font-semibold">
        <span className="tracking-wide">CAPACITY USED</span>
        <span className="text-muted-foreground">{registered} / {capacity}</span>
      </div>
      <div className="relative mx-auto h-36 w-36">
        <ChartContainer config={{ value: { label: 'Capacity', color: '#873cff' } }} className="h-full w-full">
          <RadialBarChart data={[{ value: pct }]} innerRadius="72%" outerRadius="100%" startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" angleAxisId={0} background={{ fill: 'var(--color-muted)' }} cornerRadius={999} fill="var(--color-ring)" />
          </RadialBarChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-2xl font-black leading-none">{pct}%</div>
            <div className="text-[10px] font-semibold text-muted-foreground">FILLED</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BAR_COLORS = ['#09c9d8', '#2867ff', '#873cff', '#ed3aa8', '#ff7b1a', '#16c79a'];
const GENDER_COLORS = ['#2867ff', '#ed3aa8'];
const LOCATION_COLORS = ['#09c9d8', '#873cff', '#ff7b1a'];

const DAY_MS = 86400000;
const HOUR_MS = 3600000;
const TEN_MIN_MS = 600000;
const MAX_TIMELINE_BUCKETS = 600;

const chartConfig = {
  count: {
    label: 'New registrations',
    color: '#873cff',
  },
  cumulative: {
    label: 'Total',
    color: '#09c9d8',
  },
} satisfies ChartConfig;

function CampaignTimeline({ players, openAt, deadlineAt, capacity, onRefresh }: { players: AdminPlayer[]; openAt: string | null; deadlineAt: string | null; capacity: number | null; onRefresh: () => void }) {
  const { rows: buckets, bucketMs } = useMemo(() => {
    const now = new Date();
    let start: Date | null = openAt ? new Date(openAt) : null;
    if (start && start > now) start = null;
    if (!start && players.length) {
      start = new Date(Math.min(...players.map((player) => new Date(player.created_at).getTime())));
    }
    let end: Date | null = deadlineAt ? new Date(deadlineAt) : null;
    if (end && end > now) end = now;
    if (!end) end = now;
    if (!start || end < start) return { rows: [], bucketMs: TEN_MIN_MS };
    const span = end.getTime() - start.getTime();
    const bucketMs = span <= 3 * DAY_MS ? TEN_MIN_MS : span <= 14 * DAY_MS ? HOUR_MS : DAY_MS;
    const bucketCount = Math.min(MAX_TIMELINE_BUCKETS, Math.max(1, Math.ceil(span / bucketMs) + 1));
    const formatLabel = bucketMs < DAY_MS
      ? (date: Date) => date.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : (date: Date) => date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    let running = 0;
    const rows = Array.from({ length: bucketCount }, (_, index) => {
      const bucketStart = new Date(start!.getTime() + index * bucketMs);
      const bucketEnd = new Date(bucketStart.getTime() + bucketMs);
      const count = players.filter((player) => {
        const created = new Date(player.created_at);
        return created >= bucketStart && created < bucketEnd;
      }).length;
      running += count;
      return { label: formatLabel(bucketStart), count, cumulative: running };
    });
    return { rows, bucketMs };
  }, [players, openAt, deadlineAt]);
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  const xInterval = Math.max(0, Math.ceil(buckets.length / 12) - 1);
  const granularity = bucketMs === TEN_MIN_MS ? '10 MIN' : bucketMs === HOUR_MS ? 'HOUR' : 'DAY';

  if (!buckets.length) return null;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold tracking-wide">REGISTRATION CAMPAIGN</h3>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><span className="size-2 rounded-full bg-[#873cff]" /> NEW / {granularity}</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><span className="size-2 rounded-full bg-[#09c9d8]" /> CUMULATIVE</span>
          <Badge variant="secondary">{total} TOTAL · {buckets.length} POINTS</Badge>
          <Button variant="outline" size="sm" onClick={onRefresh}><RefreshCw /> REFRESH</Button>
        </div>
      </div>
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No registrations yet — the chart will fill in as players sign up.</p>
      ) : (
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <ComposedChart data={buckets} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="countFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={xInterval} tickMargin={8} fontSize={10} />
            <YAxis yAxisId="daily" allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} />
            <YAxis yAxisId="cumulative" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} width={30} />
            <ChartTooltip cursor={{ fill: 'var(--color-muted)' }} content={<ChartTooltipContent />} />
            {buckets.length <= 96 ? (
              <Bar yAxisId="daily" dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} name="New registrations" />
            ) : (
              <Area yAxisId="daily" type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={1.5} fill="url(#countFill)" name="New registrations" />
            )}
            <Line yAxisId="cumulative" type="monotone" dataKey="cumulative" stroke="var(--color-cumulative)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="Total" />
            {capacity && capacity > 0 && (
              <ReferenceLine yAxisId="cumulative" y={capacity} stroke="var(--color-ring)" strokeDasharray="5 5" label={{ value: `capacity ${capacity}`, position: 'insideTopRight', fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
            )}
          </ComposedChart>
        </ChartContainer>
      )}
    </div>
  );
}

export default function DashboardTab() {
  const [players, setPlayers] = useState<AdminPlayer[] | null>(null);
  const [teams, setTeams] = useState<AdminTeam[] | null>(null);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [regOpen, setRegOpen] = useState<string | null>(null);
  const [regDeadline, setRegDeadline] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchAdminPlayers(),
      fetchAdminTeams(),
      supabaseRef!.from('settings').select('player_capacity, registration_open, registration_deadline').single(),
    ]).then(([playerRows, teamRows, settings]) => {
      if (!alive) return;
      setPlayers(playerRows);
      setTeams(teamRows);
      setCapacity(settings.data?.player_capacity ?? null);
      setRegOpen(settings.data?.registration_open ?? null);
      setRegDeadline(settings.data?.registration_deadline ?? null);
    });
    return () => { alive = false; };
  }, [refreshKey]);

  useEffect(() => {
    const id = window.setInterval(() => setRefreshKey((key) => key + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

  if (!players || !teams || capacity === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((card) => <Skeleton key={card} className="h-24 w-full" />)}
      </div>
    );
  }

  const registered = players.length;
  const spotsLeft = Math.max(0, capacity - registered);
  const assigned = players.filter((player) => player.team_id).length;
  const unassigned = registered - assigned;
  const vets = players.filter((player) => player.dpl_played).length;
  const withPhoto = players.filter((player) => player.photo_url).length;
  const missingPhoto = registered - withPhoto;
  const avgRating = registered ? (players.reduce((sum, player) => sum + player.self_rating, 0) / registered).toFixed(1) : '—';

  const countBy = (key: 'location' | 'player_type' | 'gender') => {
    const counts = new Map<string, number>();
    for (const player of players) counts.set(player[key], (counts.get(player[key]) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  const teamsWithPlayers = teams
    .map((team) => ({ ...team, count: players.filter((player) => player.team_id === team.id).length }))
    .sort((a, b) => b.count - a.count);

  const copySummary = async () => {
    const topLocations = countBy('location').slice(0, 3).map(([label, count]) => `${label} (${count})`).join(', ');
    const windowState = regOpen && regDeadline
      ? `Registration ${new Date() < new Date(regOpen) ? 'NOT OPEN YET' : new Date() > new Date(regDeadline) ? 'CLOSED' : 'OPEN'} · closes ${new Date(regDeadline).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`
      : 'Registration window: not set';
    const text = [
      'DPL 2026 — ADMIN SUMMARY',
      `Players: ${registered} / ${capacity}`,
      `Spots left: ${spotsLeft}`,
      `Assigned: ${assigned} · Unassigned: ${unassigned}`,
      `No photo: ${missingPhoto}`,
      `DPL vets: ${vets} · Avg self-rating: ${avgRating}★`,
      `Top locations: ${topLocations || '—'}`,
      `Teams: ${teams.length}`,
      windowState,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Summary copied to clipboard.');
    } catch {
      toast.error('Clipboard unavailable — copy failed.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-wide">OVERVIEW</h2>
        <Button variant="outline" size="sm" onClick={copySummary}><ClipboardCopy className="size-3.5" /> COPY SUMMARY</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<Users />} label="REGISTERED" value={registered} sub={`Capacity ${capacity}`} accent="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" />
        <StatCard icon={<Trophy />} label="SPOTS LEFT" value={spotsLeft} accent="bg-orange-500/10 text-orange-600 dark:text-orange-400" />
        <StatCard icon={<ShieldCheck />} label="TEAM ASSIGNED" value={`${assigned}/${registered}`} sub={`${unassigned} unassigned`} accent="bg-purple-500/10 text-purple-600 dark:text-purple-400" />
        <StatCard icon={<Crown />} label="DPL VETS" value={vets} sub={`Avg self-rating ${avgRating}★`} accent="bg-pink-500/10 text-pink-600 dark:text-pink-400" />
        <StatCard icon={<Camera />} label="PHOTOS" value={`${withPhoto}/${registered}`} sub={`${missingPhoto} missing`} accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
      </div>

      {spotsLeft > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CapacityGauge registered={registered} capacity={capacity} />
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
            <DonutCard title="GENDER" rows={countBy('gender').map(([label, count], index) => ({ label, count, color: GENDER_COLORS[index % GENDER_COLORS.length] }))} />
            <DonutCard title="LOCATIONS" rows={countBy('location').map(([label, count], index) => ({ label, count, color: LOCATION_COLORS[index % LOCATION_COLORS.length] }))} />
          </div>
        </div>
      )}

      <CampaignTimeline players={players} openAt={regOpen} deadlineAt={regDeadline} capacity={capacity} onRefresh={() => setRefreshKey((key) => key + 1)} />

      <div className="grid gap-4 lg:grid-cols-2">
        <TypesBarCard rows={countBy('player_type').map(([label, count], index) => ({ label, count, color: BAR_COLORS[index % BAR_COLORS.length] }))} />
        <DonutCard title="SELF RATING" rows={[5, 4, 3, 2, 1].map((star, index) => ({ label: `${star}★`, count: players.filter((player) => player.self_rating === star).length, color: BAR_COLORS[index % BAR_COLORS.length] }))} />
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold tracking-wide">TEAM SQUADS</h3>
          <Badge variant="secondary">{teamsWithPlayers.length} TEAMS</Badge>
        </div>
        {teamsWithPlayers.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No teams yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teamsWithPlayers.map((team) => (
              <div key={team.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {team.icon_url ? <img src={resolveAsset(team.icon_url)} alt="" className="h-10 w-8 rounded object-cover" /> : <div className="h-10 w-8 rounded bg-muted" />}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{team.name}</div>
                    <div className="text-xs text-muted-foreground">{team.code} · {team.theme || '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {team.champion ? <Crown className="size-4 text-amber-500" /> : null}
                  <Badge variant="secondary">{team.count}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}