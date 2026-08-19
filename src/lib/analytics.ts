import { supabase } from './supabase';

const SESSION_KEY = 'dpl_session_id';
const SEEN_PREFIX = 'dpl_pv_seen_';
const START_KEY = 'dpl_session_start';
const VISITOR_KEY = 'dpl_visitor_id';
const HEARTBEAT_MS = 30000;

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

function sessionStart(): string {
  try {
    let start = window.sessionStorage.getItem(START_KEY);
    if (!start) {
      start = new Date().toISOString();
      window.sessionStorage.setItem(START_KEY, start);
    }
    return start;
  } catch {
    return new Date().toISOString();
  }
}

function pageCount(): number {
  try {
    return Object.keys(window.sessionStorage).filter((key) => key.startsWith(SEEN_PREFIX)).length;
  } catch {
    return 1;
  }
}

function parseUA(ua: string): { device: string; browser: string; os: string } {
  const os = /iphone|ipad|ipod/i.test(ua) ? 'iOS'
    : /android/i.test(ua) ? 'Android'
    : /mac os x/i.test(ua) ? 'macOS'
    : /windows/i.test(ua) ? 'Windows'
    : /linux/i.test(ua) ? 'Linux' : 'Other';
  const mobile = /mobile/i.test(ua);
  const device = /iphone|ipod/i.test(ua) || (mobile && /android/i.test(ua)) ? 'Mobile'
    : /ipad/i.test(ua) || (!mobile && /android/i.test(ua)) ? 'Tablet'
    : /mac os x|windows|linux/i.test(ua) ? 'Desktop' : 'Other';
  const browser = /edg(?:e|a)?\//i.test(ua) ? 'Edge'
    : /opr\//i.test(ua) ? 'Opera'
    : /firefox\//i.test(ua) ? 'Firefox'
    : /chrome\//i.test(ua) ? 'Chrome'
    : /safari\//i.test(ua) ? 'Safari' : 'Other';
  return { device, browser, os };
}

function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

const profile = (() => {
  try {
    const ua = navigator.userAgent;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number };
    const fingerprint = hashString(
      JSON.stringify([
        ua,
        navigator.language ?? '',
        window.screen?.width ?? 0,
        window.screen?.height ?? 0,
        window.screen?.colorDepth ?? 0,
        tz,
        nav.deviceMemory ?? 0,
        nav.hardwareConcurrency ?? 0,
        navigator.platform ?? '',
        navigator.maxTouchPoints ?? 0,
      ]),
    );
    return {
      ...parseUA(ua),
      language: navigator.language?.slice(0, 10) ?? null,
      screen: window.screen?.width && window.screen?.height ? `${window.screen.width}x${window.screen.height}` : null,
      fingerprint,
    };
  } catch {
    return { device: 'Other', browser: 'Other', os: 'Other', language: null, screen: null, fingerprint: null };
  }
})();

function referrer(): string | null {
  try {
    const ref = document.referrer;
    if (!ref) return null;
    try {
      const host = new URL(ref).hostname;
      return host && !host.endsWith(window.location.hostname) ? host.replace(/^www\./, '') : null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

function syncSession(flush: boolean) {
  if (!supabase) return;
  try {
    const sid = sessionId();
    void supabase
      .from('sessions')
      .upsert(
        {
          id: sid,
          started_at: sessionStart(),
          last_seen: new Date().toISOString(),
          page_count: pageCount(),
          ...profile,
          referrer: referrer(),
          is_active: !flush,
        },
        { onConflict: 'id' },
      )
      .then(() => undefined);
  } catch {
    /* analytics must never break the app */
  }
}

export function trackPageView(path: string) {
  if (!supabase) return;
  try {
    const seenKey = SEEN_PREFIX + path;
    if (window.sessionStorage.getItem(seenKey)) return;
    window.sessionStorage.setItem(seenKey, '1');
    const sid = sessionId();
    void supabase
      .from('page_views')
      .insert({ path, session_id: sid, ...profile, referrer: referrer() })
      .then(() => undefined);
    syncSession(false);
  } catch {
    /* analytics must never break the app */
  }
}

function visitorId(): string | null {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function getVisitorId(): string | null {
  return visitorId();
}

function initSession() {
  if (!supabase) return;
  try {
    void supabase.functions.invoke('track-session', {
      body: {
        sid: sessionId(),
        started_at: sessionStart(),
        page_count: pageCount(),
        ...profile,
        referrer: referrer(),
        visitor_id: visitorId(),
        is_active: true,
      },
    }).then(() => undefined);
  } catch {
    /* analytics must never break the app */
  }
}

let heartbeatId: number | null = null;

export function startSessionHeartbeat(): () => void {
  syncSession(false);
  initSession();
  if (heartbeatId === null) {
    heartbeatId = window.setInterval(() => syncSession(false), HEARTBEAT_MS);
  }
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') syncSession(true);
    else syncSession(false);
  };
  const onPageHide = () => syncSession(true);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
  return () => {
    if (heartbeatId !== null) {
      window.clearInterval(heartbeatId);
      heartbeatId = null;
    }
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
    syncSession(true);
  };
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
