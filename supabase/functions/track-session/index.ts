const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
    }

    const sid = typeof body.sid === 'string' ? body.sid : '';
    if (!sid) {
      return new Response('sid required', { status: 400, headers: corsHeaders });
    }

    const ip = (
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      ''
    ).slice(0, 45);
    const ipHash = ip ? await sha256(ip) : null;
    console.log('[track-session]', JSON.stringify({ ts: new Date().toISOString(), ip, ipHash, visitor_id: body.visitor_id ?? null }));

    let geo: { country: string | null; region: string | null; city: string | null; isp: string | null } = {
      country: null,
      region: null,
      city: null,
      isp: null,
    };

    if (ipHash) {
      const cached = await rest<Record<string, unknown>[]>(
        `${SUPABASE_URL}/rest/v1/ip_geo?select=country,region,city,isp&ip_hash=eq.${ipHash}`,
        'GET',
      );
      if (cached && cached[0]) {
        const c = cached[0];
        geo = {
          country: (c.country as string) ?? null,
          region: (c.region as string) ?? null,
          city: (c.city as string) ?? null,
          isp: (c.isp as string) ?? null,
        };
      } else {
        try {
          const res = await fetch(`https://ipwho.is/${ip}`, { signal: AbortSignal.timeout(4000) });
          if (res.ok) {
            const d = await res.json();
            if (d && d.success) {
              geo = {
                country: d.country ?? null,
                region: d.region ?? null,
                city: d.city ?? null,
                isp: d.connection?.isp ?? null,
              };
              await rest(`${SUPABASE_URL}/rest/v1/ip_geo?on_conflict=ip_hash`, 'POST', {
                ip_hash: ipHash,
                ...geo,
              }, { Prefer: 'resolution=merge-duplicates' });
            }
          }
        } catch (e) {
          console.error('geo lookup failed', e);
        }
      }
    }

    const visitorId = typeof body.visitor_id === 'string' ? body.visitor_id : null;
    let visitNumber: number | null = null;
    if (visitorId) {
      const count = await restCount(
        `${SUPABASE_URL}/rest/v1/sessions?visitor_id=eq.${visitorId}&select=id`,
      );
      visitNumber = (count ?? 0) + 1;
    }

    const payload: Record<string, unknown> = {
      id: sid,
      started_at: body.started_at,
      last_seen: new Date().toISOString(),
      page_count: typeof body.page_count === 'number' ? body.page_count : 1,
      device: typeof body.device === 'string' ? body.device : null,
      browser: typeof body.browser === 'string' ? body.browser : null,
      os: typeof body.os === 'string' ? body.os : null,
      referrer: typeof body.referrer === 'string' ? body.referrer : null,
      is_active: body.is_active !== false,
      ip_hash: ipHash,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      isp: geo.isp,
      visitor_id: visitorId,
      visit_number: visitNumber,
      fingerprint: typeof body.fingerprint === 'string' ? body.fingerprint : null,
    };

    await rest(`${SUPABASE_URL}/rest/v1/sessions?on_conflict=id`, 'POST', payload, {
      Prefer: 'resolution=merge-duplicates',
    });

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (e) {
    console.error('track-session error', e);
    return new Response('internal: ' + (e instanceof Error ? e.message : String(e)), { status: 500, headers: corsHeaders });
  }
});

async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function rest<T>(
  url: string,
  method: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T | null> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) return null;
  if (res.status === 204) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function restCount(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'count=exact',
        Range: '0-0',
      },
    });
    const cr = res.headers.get('content-range');
    if (!cr) return null;
    const match = cr.match(/\/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}