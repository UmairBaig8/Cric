import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle, Copy, Fingerprint, History, MapPin,
  RefreshCw, ShieldAlert, User,
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

const fmtAgo = (iso: string) => {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const actionStyle = (action: string) => {
  if (action.startsWith('registration.delete') || action.startsWith('team.delete')) return 'bg-red-500/10 text-red-600 dark:text-red-400';
  if (action.startsWith('registration.add') || action.startsWith('player.add')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  if (action.startsWith('registration.update') || action.startsWith('player.update') || action.startsWith('settings')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  if (action.startsWith('edit.rejected')) return 'bg-red-500/10 text-red-600 dark:text-red-400';
  return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
};

const actionLabel = (action: string) => action.replace(/\./g, ' · ').toUpperCase();

function detailSummary(entry: AuditEntry): string {
  const d = entry.detail ?? {};
  const parts: string[] = [];
  if (d.name) parts.push(d.name);
  if (d.email) parts.push(d.email);
  if (d.employee_id) parts.push(`emp ${d.employee_id}`);
  if (d.changed) {
    const keys = Object.keys(d.changed).filter((k) => k !== 'updated_at' && k !== 'id' && k !== 'created_at');
    if (keys.length) parts.push(`changed: ${keys.slice(0, 6).join(', ')}`);
    else parts.push('no field changes');
  }
  if (d.patch) parts.push(`patch: ${Object.keys(d.patch).slice(0, 6).join(', ')}`);
  if (d.team_id) parts.push(`team ${String(d.team_id).slice(0, 8)}`);
  if (d.role) parts.push(`role ${d.role}`);
  if (d.request_id) parts.push(`edit req ${String(d.request_id).slice(0, 8)}`);
  if (d.note) parts.push(`note: ${d.note}`);
  return parts.length ? parts.join(' · ') : '';
}

export default function ActivityTab() {
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [intel, setIntel] = useState<RegistrationIntel[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
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

  const suspicious = intel?.filter((r) => r.same_ip_regs > 0 || r.dup_email > 0) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldAlert className="size-4" />
          {suspicious.length > 0
            ? `${suspicious.length} registration${suspicious.length === 1 ? '' : 's'} need${suspicious.length === 1 ? 's' : ''} a second look`
            : 'No anomalies flagged'}
        </div>
        <Button size="sm" variant="outline" onClick={() => setRefreshKey((k) => k + 1)}>
          <RefreshCw className="size-3.5" /> REFRESH
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <h3 className="font-display text-lg font-bold tracking-wide">REGISTRATION IDENTITY</h3>
        </div>
        {intel === null ? (
          <p className="py-3 text-xs text-muted-foreground">Loading…</p>
        ) : intel.length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">No registrations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  <th className="py-2 pr-3">PLAYER</th>
                  <th className="py-2 pr-3">WHEN</th>
                  <th className="py-2 pr-3">LOCATION</th>
                  <th className="py-2 pr-3">DEVICE</th>
                  <th className="py-2 pr-3">IP HASH</th>
                  <th className="py-2 pr-3">FLAGS</th>
                </tr>
              </thead>
              <tbody>
                {intel.map((row) => {
                  const flagged = row.same_ip_regs > 0 || row.dup_email > 0;
                  return (
                    <tr key={row.id} className={`border-b last:border-0 ${flagged ? 'bg-amber-500/5' : ''}`}>
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold">{row.name}</div>
                        <div className="text-xs text-muted-foreground">{row.email}</div>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 pr-3 text-xs">
                        {row.city || row.country || '—'}
                        {row.isp ? <div className="text-[10px] text-muted-foreground">{row.isp}</div> : null}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                        {[row.device, row.browser, row.os].filter(Boolean).join(' · ') || '—'}
                        {row.visit_number ? <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">VISIT #{row.visit_number}</div> : null}
                      </td>
                      <td className="py-2.5 pr-3">
                        {row.ip_hash ? (
                          <button
                            type="button"
                            onClick={() => void copyHash(row.ip_hash!)}
                            title="Copy IP hash"
                            className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            <Fingerprint className="size-3" />
                            {row.ip_hash.slice(0, 12)}…
                            {copied === row.ip_hash.slice(0, 8) ? <Copy className="size-3 text-emerald-500" /> : null}
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {!row.has_session ? <Badge variant="secondary" className="text-[9px]">NO SESSION</Badge> : null}
                          {row.same_ip_regs > 0 ? (
                            <Badge variant="destructive" className="text-[9px]">
                              <AlertTriangle className="size-2.5" /> SAME IP ×{row.same_ip_regs}
                            </Badge>
                          ) : null}
                          {row.dup_email > 0 ? (
                            <Badge variant="secondary" className="text-[9px]">DUP EMAIL ×{row.dup_email}</Badge>
                          ) : null}
                          {!flagged ? <span className="text-[10px] text-muted-foreground">ok</span> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          <h3 className="font-display text-lg font-bold tracking-wide">AUDIT TRAIL</h3>
          <span className="text-xs text-muted-foreground">last {audit?.length ?? '…'} events</span>
        </div>
        {audit === null ? (
          <p className="py-3 text-xs text-muted-foreground">Loading…</p>
        ) : audit.length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="space-y-1.5">
            {audit.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Badge className={`shrink-0 text-[9px] ${actionStyle(entry.action)}`}>{actionLabel(entry.action)}</Badge>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">
                      {entry.actor_email ?? 'SITE VISITOR'}
                      {entry.detail?.visitor_id ? <span className="ml-1 font-mono text-[10px] text-muted-foreground">({entry.detail.visitor_id.slice(0, 8)}…)</span> : null}
                    </div>
                    {detailSummary(entry) ? (
                      <div className="truncate text-xs text-muted-foreground">{detailSummary(entry)}</div>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 text-right text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  <div>{fmtAgo(entry.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {suspicious.length > 0 ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
            <MapPin className="size-4" /> ANOMALY FOCUS
          </div>
          <div className="space-y-1.5">
            {suspicious.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 truncate">
                  <span className="font-semibold">{row.name}</span>
                  <span className="text-muted-foreground"> · {row.email}</span>
                </div>
                <div className="shrink-0 text-muted-foreground">
                  {!row.has_session ? 'registered without a browsing session' : ''}
                  {row.same_ip_regs > 0 ? ` · same IP as ${row.same_ip_regs} other registration${row.same_ip_regs === 1 ? '' : 's'}` : ''}
                  {row.dup_email > 0 ? ` · duplicate email` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}