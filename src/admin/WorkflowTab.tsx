import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, X, Eye, Loader2, RefreshCw } from 'lucide-react';
import { fetchPendingEdits, fetchAdminPlayers, reviewPlayerEdit, type EditRequest } from '@/lib/site';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const FIELD_LABELS: Record<string, string> = {
  name: 'NAME', player_type: 'ROLE', gender: 'GENDER', location: 'AREA',
  batting_style: 'BATTING', bowling_style: 'BOWLING', bowling_arm: 'BOWLING ARM',
  availability: 'AVAILABILITY', self_rating: 'RATING', dpl_played: 'DPL 2025', jersey_size: 'JERSEY',
};

function timeAgo(dt: string): string {
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function WorkflowTab() {
  const [requests, setRequests] = useState<EditRequest[] | null>(null);
  const [viewing, setViewing] = useState<EditRequest | null>(null);
  const [rejecting, setRejecting] = useState<EditRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [current, setCurrent] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(() => {
    fetchPendingEdits().then(setRequests);
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 60000);
    return () => window.clearInterval(id);
  }, [load]);

  const openView = async (request: EditRequest) => {
    setViewing(request);
    setCurrent(null);
    const rows = await fetchAdminPlayers();
    const player = rows.find((p) => p.id === request.player_id);
    if (player) {
      const snapshot: Record<string, unknown> = {
        name: player.name, player_type: player.player_type, gender: player.gender,
        location: player.location, batting_style: player.batting_style ?? '',
        bowling_style: player.bowling_style ?? '', bowling_arm: player.bowling_arm ?? '',
        availability: player.availability ?? '', self_rating: player.self_rating,
        dpl_played: player.dpl_played, photo_url: player.photo_url ?? '',
        jersey_size: player.jersey_size ?? '',
      };
      setCurrent(snapshot);
    }
  };

  const decide = async (request: EditRequest, decision: 'approved' | 'rejected') => {
    setBusyId(request.id);
    const result = await reviewPlayerEdit(request.id, decision, decision === 'rejected' ? rejectNote.trim() || null : undefined);
    setBusyId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(decision === 'approved' ? 'Edit applied to the player.' : 'Edit rejected.');
    setViewing(null);
    setRejecting(null);
    setRejectNote('');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">WORKFLOW</h2>
          <p className="text-sm text-muted-foreground">Public edit proposals — approve applies them to the player, reject discards.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="size-3.5" /> REFRESH</Button>
      </div>

      {requests === null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No pending edit requests.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{request.player_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Object.keys(request.changes).map((key) => FIELD_LABELS[key] ?? key.toUpperCase()).join(' · ') || '—'} · {timeAgo(request.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{Object.keys(request.changes).length} FIELD{Object.keys(request.changes).length === 1 ? '' : 'S'}</Badge>
                  <Button variant="outline" size="sm" onClick={() => openView(request)}><Eye className="size-3.5" /> VIEW</Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setRejecting(request); setRejectNote(''); }}>
                    <X className="size-3.5" /> REJECT
                  </Button>
                  <Button size="sm" disabled={busyId === request.id} onClick={() => decide(request, 'approved')}>
                    {busyId === request.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} APPROVE
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={viewing !== null} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review edit — {viewing?.player_name}</DialogTitle>
            <DialogDescription>Current value → proposed value. Approving applies it to the player record.</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              {Object.entries(viewing.changes).map(([key, value]) => {
                const label = FIELD_LABELS[key] ?? key.toUpperCase();
                const oldValue = current ? String(current[key] ?? '') : '';
                const newValue = String(value ?? '');
                if (key === 'photo_url') {
                  return (
                    <div key={key} className="rounded-lg border bg-muted/40 p-3">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
                      <div className="flex items-center justify-center gap-4">
                        {[{ src: oldValue, tag: 'CURRENT' }, { src: newValue, tag: 'PROPOSED' }].map((side, i) => (
                          <div key={side.tag} className="flex flex-col items-center gap-1.5">
                            <div className="size-20 overflow-hidden rounded-xl border bg-background shadow-sm">
                              {side.src
                                ? <img src={side.src} alt={side.tag} className="size-full object-cover" />
                                : <span className="flex size-full items-center justify-center text-2xl font-black text-muted-foreground/40">—</span>}
                            </div>
                            <span className={i === 1 ? 'text-[10px] font-bold text-emerald-600 dark:text-emerald-400' : 'text-[10px] font-bold text-muted-foreground'}>{side.tag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className="w-24 shrink-0 font-medium">{label}</span>
                    <span className="flex-1 truncate text-muted-foreground line-through decoration-destructive/60">{oldValue || '—'}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="flex-1 truncate font-medium text-emerald-600 dark:text-emerald-400">{newValue || '—'}</span>
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>CLOSE</Button>
            <Button variant="destructive" onClick={() => decide(viewing!, 'rejected')} disabled={busyId === viewing?.id}>
              {busyId === viewing?.id ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} REJECT
            </Button>
            <Button onClick={() => decide(viewing!, 'approved')} disabled={busyId === viewing?.id}>
              {busyId === viewing?.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} APPROVE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejecting !== null} onOpenChange={(open) => { if (!open) setRejecting(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject edit — {rejecting?.player_name}</DialogTitle>
            <DialogDescription>Optionally tell the submitter why.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-note">Reason (optional)</Label>
            <Input id="reject-note" value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} placeholder="e.g. Photo update not allowed here" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>CANCEL</Button>
            <Button variant="destructive" onClick={() => decide(rejecting!, 'rejected')} disabled={busyId === rejecting?.id}>
              {busyId === rejecting?.id ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} REJECT EDIT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}