import { Resend } from 'npm:resend@6.20.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('CONFIRMATION_FROM_EMAIL') ?? 'DPL 2026 <onboarding@resend.dev>';

const resend = new Resend(RESEND_API_KEY);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: { name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  if (!name || !email) {
    return new Response('name and email are required', { status: 400 });
  }
  if (!RESEND_API_KEY) {
    return new Response('RESEND_API_KEY not configured', { status: 500 });
  }

  let result;
  try {
    result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'You\u2019re in \u2014 DPL 2026 registration confirmed',
      html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#f5f8fb;padding:40px 20px;">
        <div style="max-width:520px;margin:auto;background:#fff;border-radius:16px;padding:36px;border:1px solid #e4ebf1;">
          <div style="font-size:12px;letter-spacing:2px;font-weight:800;color:#09c9d8;">DPL 2026 / DIGITATE PREMIER LEAGUE</div>
          <h1 style="font-size:34px;margin:14px 0 8px;color:#071426;">YOU\u2019RE IN, ${escapeHtml(name)}.</h1>
          <p style="color:#526574;font-size:14px;line-height:1.6;">Thanks for registering. Your player profile is saved \u2014 this email is your confirmation.</p>
          <div style="background:#f0f6f9;border-radius:10px;padding:16px 20px;margin:20px 0;">
            <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#087f91;margin-bottom:10px;">WHAT HAPPENS NEXT</div>
            <div style="font-size:13px;color:#334556;line-height:2;">\u2713 Your player card enters the DPL universe<br/>\u2713 Auction day \u2014 find out who bids for you<br/>\u2713 Match day \u2014 wear your colours, make memories</div>
          </div>
          <a href="https://umairbaig8.github.io/D2P/" style="display:inline-block;background:#2867ff;color:#fff;text-decoration:none;font-size:12px;font-weight:800;padding:13px 22px;border-radius:10px;">VISIT DPL 2026</a>
          <p style="color:#9aa8b4;font-size:11px;margin-top:26px;">Questions? Reach out to the DPL comms team.</p>
        </div>
      </div>
    `,
    } as never);
  } catch (sendError) {
    return new Response(`Failed to send email: ${JSON.stringify(sendError)}`, { status: 500 });
  }

  if (result && 'error' in result && result.error) {
    return new Response(`Failed to send email: ${JSON.stringify(result.error)}`, { status: 500 });
  }
  return new Response('ok', { status: 200 });
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);
}