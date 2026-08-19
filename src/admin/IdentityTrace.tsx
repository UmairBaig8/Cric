import { useEffect, useState } from 'react';
import { Copy, Fingerprint, Globe, History, MonitorSmartphone, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase as supabaseRef } from '@/lib/supabase';

type TraceSession = {
  visitor_id: string | null;
  started_at: string;
  last_seen: string;
  page_count: number;
  device: string | null;
  browser: string | null;
  os: string | null;
  city: string | null;
  country: string | null;
  is_active: boolean;
  visit_number: number | null;
  fingerprint: string | null;
};

type TraceReg = { name: string; email: string; created_at: string; visitor_id: string | null; employee_id: string | null };
type TraceReq = { player_name: string; status: string; created_at: string; visitor_id: string | null };

type TraceData = { sessions: TraceSession[]; registrations: TraceReg[]; edit_requests: TraceReq[] };

const fmtAgo = (iso: string) => {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export function IdentityTrace({ connHash, open, onOpenChange }: { connHash: string | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [data, setData] = useState<TraceData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !connHash) return;
    let alive = true;
    setData(null);
    supabaseRef!
      .rpc('admin_identity_trace', { conn_hash: connHash })
      .then(({ data: rows, error }) => { if (!error && rows && rows[0] && alive) setData(rows[0] as TraceData); }, () => undefined);
    return () => { alive = false; };
  }, [open, connHash]);

  const copyHash = async () => {
    if (!connHash) return;
    try {
      await navigator.clipboard.writeText(connHash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch { /* clipboard unavailable */ }
  };

  const visitorIds = new Set<string | null>([...((data?.registrations ?? []).map((r) => r.visitor_id)), ...((data?.edit_requests ?? []).map((r) => r.visitor_id))]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="size-4 text-muted-foreground" /> CONNECTION TRACE
          </DialogTitle>
          <DialogDescription>
            Everything linked to one connection — every visit, registration and edit request on it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">{connHash}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void copyHash()}>
            <Copy className="size-3" /> {copied ? 'COPIED' : 'COPY HASH'}
          </Button>
        </div>

        {data === null ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                <History className="size-3.5" /> SESSIONS · {data.sessions.length}
              </div>
              {data.sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No sessions on this connection.</p>
              ) : (
                <div className="space-y-1">
                  {data.sessions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-1.5 text-xs">
                      <div className="min-w-0 truncate">
                        <span className="font-semibold">{[s.device, s.browser, s.os].filter(Boolean).join(' · ') || 'Unknown device'}</span>
                        {s.city && s.country ? <span className="text-muted-foreground"> · {s.city}, {s.country}</span> : null}
                        {s.is_active ? <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"><span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />ONLINE</span> : null}
                      </div>
                      <div className="shrink-0 text-right text-[10px] text-muted-foreground whitespace-nowrap">
                        {s.page_count} page{s.page_count === 1 ? '' : 's'} · visit #{s.visit_number ?? '—'} · {fmtAgo(s.last_seen)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                <UserPlus className="size-3.5" /> REGISTRATIONS · {data.registrations.length}
              </div>
              {data.registrations.length === 0 ? (
                <p className="text-xs text-muted-foreground">No registrations from this connection.</p>
              ) : (
                <div className="space-y-1">
                  {data.registrations.map((r) => (
                    <div key={r.email} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-1.5 text-xs">
                      <div className="min-w-0 truncate">
                        <span className="font-semibold">{r.name}</span>
                        <span className="text-muted-foreground"> · {r.email}{r.employee_id ? ` · emp ${r.employee_id}` : ''}</span>
                      </div>
                      <div className="shrink-0 text-right text-[10px] text-muted-foreground whitespace-nowrap">{fmtAgo(r.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                <MonitorSmartphone className="size-3.5" /> EDIT REQUESTS · {data.edit_requests.length}
              </div>
              {data.edit_requests.length === 0 ? (
                <p className="text-xs text-muted-foreground">No edit requests from this connection.</p>
              ) : (
                <div className="space-y-1">
                  {data.edit_requests.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-1.5 text-xs">
                      <div className="min-w-0 truncate">
                        <span className="font-semibold">{r.player_name}</span>
                        <Badge variant={r.status === 'pending' ? 'secondary' : r.status === 'approved' ? 'default' : 'destructive'} className="ml-1.5 text-[9px]">
                          {r.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="shrink-0 text-right text-[10px] text-muted-foreground whitespace-nowrap">{fmtAgo(r.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {visitorIds.size > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <Fingerprint className="size-3.5 text-muted-foreground" />
                {[...visitorIds].filter(Boolean).map((id) => (
                  <span key={id} className="rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">visitor {id?.slice(0, 12)}…</span>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}