import { supabase } from './supabase';

const SESSION_KEY = 'dpl_session_id';
const SEEN_PREFIX = 'dpl_pv_seen_';

function sessionId(): string {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

export function trackPageView(path: string) {
  if (!supabase) return;
  try {
    const seenKey = SEEN_PREFIX + path;
    if (window.sessionStorage.getItem(seenKey)) return;
    window.sessionStorage.setItem(seenKey, '1');
    const sid = sessionId();
    void supabase.from('page_views').insert({ path, session_id: sid }).then(() => undefined);
  } catch {
    /* analytics must never break the app */
  }
}

type OnlineListener = (count: number) => void;

const onlineListeners = new Set<OnlineListener>();

export function onOnlineCount(listener: OnlineListener): () => void {
  onlineListeners.add(listener);
  return () => {
    onlineListeners.delete(listener);
  };
}

export function joinPresence(): () => void {
  if (!supabase) return () => undefined;
  const channel = supabase.channel('dpl-online');
  const emit = () => {
    const count = Object.keys(channel.presenceState()).length;
    onlineListeners.forEach((listener) => listener(count));
  };
  channel
    .on('presence', { event: 'sync' }, emit)
    .on('presence', { event: 'join' }, emit)
    .on('presence', { event: 'leave' }, emit)
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ onlineAt: new Date().toISOString() });
      }
    });
  return () => {
    channel.unsubscribe();
  };
}
