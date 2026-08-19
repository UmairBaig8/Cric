import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle, ChevronDown, Copy, Fingerprint, History,
  Pencil, RefreshCw, Shield, Trash2, UserPlus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase as supabaseRef } from '@/lib/supabase';

type AuditEntry = {
  id: number;
  actor_email: string | null;
  action: string;
  target_id: string | null;
  detail: { name?: string; email?: string; employee_id?: string | null; visitor_id?: string | null; changed?: Record<string, unknown>; note?: string | null; values?: Record<string, unknown>; team_id?: string; role?: string; request_id?: string; patch?: Record<string, unknown> } | null;
  requester: string | null;
  created_at: string;
};

type RegistrationIntel = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  visitor_id: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  isp: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  ip_hash: string | null;
  visit_number: number | null;
  same_ip_regs: number;
  dup_email: number;
  has_session: boolean;
};

type FeedItem = {
  key: string;
  kind: 'reg' | 'audit';
  when: string;
  flagged: boolean;
  title: string;
  sub: string;
  icon: 'add' | 'update' | 'delete' | 'admin' | 'reg';
  reg?: RegistrationIntel;
  audit?: AuditEntry;
  summary: string;
};

const fmtAgo = (iso: string) => {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const iconOf = (kind: FeedItem['icon']) => {
  switch (kind) {
    case 'add': return { icon: UserPlus, cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
    case 'update': return { icon: Pencil, cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
    case 'delete': return { icon: Trash2, cls: 'bg-red-500/10 text-red-600 dark:text-red-400' };
    case 'reg': return { icon: UserPlus, cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
    default: return { icon: Shield, cls: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' };
  }
};

const actionKind = (action: string): FeedItem['icon'] => {
  if (action.startsWith('registration.delete') || action.startsWith('team.delete') || action.startsWith('edit.rejected')) return 'delete';
  if (action.startsWith('registration.add') || action.startsWith('player.add')) return 'add';
  if (action.startsWith('registration.update') || action.startsWith('player.update') || action.startsWith('settings')) return 'update';
  return 'admin';
};

const actionLabel = (action: string) => {
  const map: Record<string, string> = {
    'registration.add': 'Player registered',
    'registration.update': 'Player profile updated',
    'registration.delete': 'Player removed',
    'player.add': 'Player added to team',
    'player.update': 'Player assignment changed',
    'team.delete': 'Team deleted',
    'settings': 'Settings changed',
  };
  for (const [k, v] of Object.entries(map)) if (action.startsWith(k)) return v;
  return action.replace(/\./g, ' · ');
};

function detailSummary(entry: AuditEntry): string {
  const d = entry.detail ?? {};
  const parts: string[] = [];
  if (d.name) parts.push(d.name);
  if (d.email) parts.push(d.email);
  if (d.employee_id) parts.push(`emp ${d.employee_id}`);
  if (d.changed) {
    const keys = Object.keys(d.changed).filter((k) => k !== 'updated_at' && k !== 'id' && k !== 'created_at');
    parts.push(keys.length ? `changed: ${keys.slice(0, 5).join(', ')}` : 'no field changes');
  }
  if (d.patch) parts.push(`patch: ${Object.keys(d.patch).slice(0, 5).join(', ')}`);
  if (d.team_id) parts.push(`team ${String(d.team_id).slice(0, 8)}`);
  if (d.role) parts.push(`role ${d.role}`);
  if (d.request_id) parts.push(`edit req ${String(d.request_id).slice(0, 8)}`);
  if (d.note) parts.push(`note: ${d.note}`);
  return parts.length ? parts.join(' · ') : '';
}

const CHIPS = ['ALL', 'REGISTRATIONS', 'ADMIN ACTIONS', 'NEEDS A LOOK'] as const;
type Chip = (typeof CHIPS)[number];

export default function ActivityTab() {
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [intel, setIntel] = useState<RegistrationIntel[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState<Chip>('ALL');
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    supabaseRef!
      .rpc('admin_audit_log', { max_rows: 100 })
      .then(({ data, error }) => { if (!error && data && alive) setAudit(data as AuditEntry[]); }, () => undefined);
    supabaseRef!
      .rpc('admin_registration_intel')
      .then(({ data, error }) => { if (!error && data && alive) setIntel(data as RegistrationIntel[]); }, () => undefined);
    return () => { alive = false; };
  }, [refreshKey]);

  const copyHash = useCallback(async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(hash.slice(0, 8));
      window.setTimeout(() => setCopied(null), 1200);
    } catch { /* clipboard unavailable */ }
  }, []);

  const feed: FeedItem[] = [
    ...(intel ?? []).map((r): FeedItem => ({
      key: `reg-${r.id}`,
      kind: 'reg',
      when: r.created_at,
      flagged: r.same_ip_regs > 0 || r.dup_email > 0,
      icon: 'reg',
      title: `${r.name} registered`,
      sub: r.email,
      reg: r,
      summary: '',
    })),
    ...(audit ?? []).map((e): FeedItem => ({
      key: `audit-${e.id}`,
      kind: 'audit',
      when: e.created_at,
      flagged: false,
      icon: actionKind(e.action),
      title: actionLabel(e.action),
      sub: [e.actor_email ?? 'SITE VISITOR', e.requester ? `submitted by ${e.requester}` : null].filter(Boolean).join(' · '),
      audit: e,
      summary: detailSummary(e),
    })),
  ].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  const visible = feed.filter((f) => {
    if (filter === 'REGISTRATIONS') return f.kind === 'reg';
    if (filter === 'ADMIN ACTIONS') return f.kind === 'audit';
    if (filter === 'NEEDS A LOOK') return f.flagged;
    return true;
  });

  const flaggedCount = feed.filter((f) => f.flagged).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide transition-colors ${
                filter === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {c}
              {c === 'NEEDS A LOOK' && flaggedCount > 0 ? <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-[9px] text-white">{flaggedCount}</span> : null}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {flaggedCount > 0 ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3.5" /> {flaggedCount} flagged
            </span>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCw className="size-3.5" /> REFRESH
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          <h3 className="font-display text-lg font-bold tracking-wide">ACTIVITY FEED</h3>
          <span className="text-xs text-muted-foreground">{visible.length} event{visible.length === 1 ? '' : 's'}</span>
        </div>
        {feed.length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">Nothing here yet — registrations and admin actions will show up in one feed.</p>
        ) : (
          <div className="space-y-1.5">
            {visible.map((item) => {
              const { icon: Icon, cls } = iconOf(item.icon);
              const isOpen = open === item.key;
              return (
                <div key={item.key} className={`rounded-lg border px-3 py-2 text-sm ${item.flagged ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
                  <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen(isOpen ? null : item.key)}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${cls}`}>
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="truncate text-sm font-semibold">{item.title}</span>
                          {item.flagged ? (
                            <Badge variant="destructive" className="text-[9px]">
                              <AlertTriangle className="size-2.5" /> NEEDS A LOOK
                            </Badge>
                          ) : null}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {item.sub}
                          {item.summary ? <span> · {item.summary}</span> : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground whitespace-nowrap">
                      <div className="text-right">
                        <div>{fmtAgo(item.when)}</div>
                        <div>{new Date(item.when).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <ChevronDown className={`size-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isOpen && item.reg ? (
                    <div className="mt-2 grid gap-2 border-t pt-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">LOCATION</div>
                        <div>{[item.reg.city, item.reg.region, item.reg.country].filter(Boolean).join(', ') || 'Unknown'}</div>
                        <div className="text-[10px] text-muted-foreground">{item.reg.isp}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">DEVICE</div>
                        <div>{[item.reg.device, item.reg.browser, item.reg.os].filter(Boolean).join(' · ') || 'Unknown'}</div>
                        {item.reg.visit_number ? <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">VISIT #{item.reg.visit_number}</div> : null}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">SIGNALS</div>
                        <div className="flex flex-wrap gap-1">
                          {!item.reg.has_session ? <Badge variant="secondary" className="text-[9px]">NO SESSION</Badge> : null}
                          {item.reg.same_ip_regs > 0 ? <Badge variant="destructive" className="text-[9px]">SAME IP ×{item.reg.same_ip_regs}</Badge> : null}
                          {item.reg.dup_email > 0 ? <Badge variant="secondary" className="text-[9px]">DUP EMAIL ×{item.reg.dup_email}</Badge> : null}
                          {!item.reg.has_session && item.reg.same_ip_regs === 0 && item.reg.dup_email === 0 ? <span className="text-[10px] text-muted-foreground">looks clean</span> : null}
                        </div>
                      </div>
                      {item.reg.ip_hash ? (
                        <button
                          type="button"
                          onClick={() => void copyHash(item.reg!.ip_hash!)}
                          title="Copy IP hash"
                          className="inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          <Fingerprint className="size-3" />
                          {item.reg.ip_hash}
                          {copied === item.reg.ip_hash.slice(0, 8) ? <Copy className="size-3 text-emerald-500" /> : null}
                        </button>
                      ) : null}
                      {item.reg.visitor_id ? (
                        <div className="font-mono text-[10px] text-muted-foreground">visitor {item.reg.visitor_id.slice(0, 12)}…</div>
                      ) : null}
                    </div>
                  ) : null}

                  {isOpen && item.audit ? (
                    <div className="mt-2 border-t pt-2">
                      {item.audit.detail ? (
                        <pre className="overflow-x-auto rounded-md bg-muted p-2 font-mono text-[10px] leading-4 text-muted-foreground">
                          {JSON.stringify(item.audit.detail, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-xs text-muted-foreground">No extra details recorded for this event.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}