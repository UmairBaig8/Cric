import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, Loader2 } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import ProfileCard from '@/components/ProfileCard';
import { useTheme } from '@/lib/useTheme';
import { fetchPlayersList, submitPlayerEdit, type PublicPlayer } from '@/lib/site';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const ROLE_OPTIONS = ['Batter', 'Bowler', 'All-rounder', 'Wicketkeeper-batter'];
const BATTING_OPTIONS = ['Right-hand batter', 'Left-hand batter'];
const BOWLING_OPTIONS = ['Right-arm pace', 'Left-arm pace', 'Right-arm spin', 'Left-arm spin', 'Do not bowl'];
const ARM_OPTIONS = ['Right arm', 'Left arm', 'Not applicable'];

const editSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  player_type: z.string().min(1, 'Role is required.'),
  gender: z.string().min(1, 'Gender is required.'),
  location: z.string().min(1, 'Area is required.'),
  batting_style: z.string(),
  bowling_style: z.string(),
  bowling_arm: z.string(),
  availability: z.string(),
  self_rating: z.string().regex(/^[1-5]$/, 'Rate 1–5.'),
  dpl_played: z.string().min(1, 'Select an option.'),
  jersey_size: z.string(),
});

type EditValues = z.infer<typeof editSchema>;

export default function PlayersPage() {
  const { dark, toggleTheme } = useTheme();
  const [players, setPlayers] = useState<PublicPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<PublicPlayer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const query = params.get('q') ?? '';
  const role = params.get('role') ?? 'ALL ROLES';
  const area = params.get('area') ?? 'ALL AREAS';
  const roles = useMemo(() => ['ALL ROLES', ...Array.from(new Set(players.map((p) => p.player_type).filter(Boolean)))], [players]);
  const areas = useMemo(() => ['ALL AREAS', ...Array.from(new Set(players.map((p) => p.location).filter(Boolean)))], [players]);

  useEffect(() => {
    let alive = true;
    fetchPlayersList().then((rows) => {
      if (!alive) return;
      setPlayers(rows);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.player_type.toLowerCase().includes(q)) return false;
      if (role !== 'ALL ROLES' && p.player_type !== role) return false;
      if (area !== 'ALL AREAS' && p.location !== area) return false;
      return true;
    });
  }, [players, query, role, area]);

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '', player_type: '', gender: '', location: '',
      batting_style: '', bowling_style: '', bowling_arm: '',
      availability: 'FULL TIME', self_rating: '3', dpl_played: 'NO', jersey_size: '',
    },
  });

  const openEdit = (player: PublicPlayer) => {
    setEditing(player);
    form.reset({
      name: player.name,
      player_type: player.player_type,
      gender: player.gender,
      location: player.location,
      batting_style: player.batting_style ?? '',
      bowling_style: player.bowling_style ?? '',
      bowling_arm: player.bowling_arm ?? '',
      availability: player.availability ?? 'FULL TIME',
      self_rating: String(player.self_rating ?? 3),
      dpl_played: player.dpl_played ? 'YES' : 'NO',
      jersey_size: player.jersey_size ?? '',
    });
  };

  const onSubmit = async (values: EditValues) => {
    if (!editing) return;
    const changes: Record<string, unknown> = {};
    if (values.name !== editing.name) changes.name = values.name;
    if (values.player_type !== editing.player_type) changes.player_type = values.player_type;
    if (values.gender !== editing.gender) changes.gender = values.gender;
    if (values.location !== editing.location) changes.location = values.location;
    if (values.batting_style !== (editing.batting_style ?? '')) changes.batting_style = values.batting_style;
    if (values.bowling_style !== (editing.bowling_style ?? '')) changes.bowling_style = values.bowling_style;
    if (values.bowling_arm !== (editing.bowling_arm ?? '')) changes.bowling_arm = values.bowling_arm;
    if (values.availability !== (editing.availability ?? 'FULL TIME')) changes.availability = values.availability;
    if (values.self_rating !== String(editing.self_rating ?? 3)) changes.self_rating = Number(values.self_rating);
    if (values.dpl_played !== (editing.dpl_played ? 'YES' : 'NO')) changes.dpl_played = values.dpl_played === 'YES';
    if (values.jersey_size !== (editing.jersey_size ?? '')) changes.jersey_size = values.jersey_size;

    if (Object.keys(changes).length === 0) {
      toast.info('Nothing changed.');
      return;
    }

    setSubmitting(true);
    const result = await submitPlayerEdit(editing.id, editing.name, changes);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Edit submitted for admin approval.');
    setEditing(null);
  };

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'ALL ROLES' && value !== 'ALL AREAS') next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className={dark ? 'app dark players-page' : 'app players-page'}>
      <Toaster theme={dark ? 'dark' : 'light'} position="bottom-center" richColors />
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="players-main shell">
        <div className="players-toolbar">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="players-search"
              className="pl-9"
              placeholder="Search by name or role…"
              value={query}
              onChange={(event) => setParam('q', event.target.value)}
            />
          </div>
          <Select value={role} onValueChange={(value) => setParam('role', value)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={area} onValueChange={(value) => setParam('area', value)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="px-3 py-1">{filtered.length} PLAYERS</Badge>
        </div>

        <section className="players-grid">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-5">
                  <Skeleton className="mx-auto size-20 rounded-2xl" />
                  <Skeleton className="mx-auto mt-3 h-4 w-24" />
                  <Skeleton className="mx-auto mt-2 h-3 w-16" />
                </CardContent>
              </Card>
            ))
            : filtered.map((player) => (
              <ProfileCard
                key={player.id}
                avatarUrl={player.photo_url}
                name={player.name}
                title={player.player_type}
                handle={player.location || 'DPL 2026'}
                status={player.dpl_played ? '★ DPL 2025 ALUM' : 'NEW TO DPL 2026'}
                fallbackInitials={player.name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                onEdit={() => openEdit(player)}
              />
            ))}
        </section>

        {!loading && filtered.length === 0 && (
          <p className="players-empty">No players match your search.</p>
        )}
      </main>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Propose edit — {editing?.name}</DialogTitle>
            <DialogDescription>
              Your changes go to the tournament committee for approval. Nothing updates live.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="player_type" render={({ field }) => (
                  <FormItem><FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem><FormLabel>Gender</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Area</FormLabel><FormControl><Input {...field} placeholder="e.g. CZ, SP, Baner…" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="batting_style" render={({ field }) => (
                  <FormItem><FormLabel>Batting style</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger>
                        <SelectContent>
                          {BATTING_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bowling_style" render={({ field }) => (
                  <FormItem><FormLabel>Bowling style</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger>
                        <SelectContent>
                          {BOWLING_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bowling_arm" render={({ field }) => (
                  <FormItem><FormLabel>Bowling arm</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select arm" /></SelectTrigger>
                        <SelectContent>
                          {ARM_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="jersey_size" render={({ field }) => (
                  <FormItem><FormLabel>Jersey size</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="XL">XL</SelectItem>
                          <SelectItem value="XXL">XXL</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="self_rating" render={({ field }) => (
                  <FormItem><FormLabel>Self rating (1–5)</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Rate yourself" /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{'★'.repeat(n)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dpl_played" render={({ field }) => (
                  <FormItem><FormLabel>Played DPL 2025</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">Yes</SelectItem>
                          <SelectItem value="NO">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="availability" render={({ field }) => (
                  <FormItem><FormLabel>Availability</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FULL TIME">Full time</SelectItem>
                          <SelectItem value="PART TIME">Part time</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditing(null)}>CANCEL</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  SUBMIT FOR APPROVAL
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <footer>D2P · DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET · BUILT FOR THE PEOPLE WHO TURN COFFEE BREAKS INTO CRICKET DEBATES.</footer>
    </div>
  );
}

