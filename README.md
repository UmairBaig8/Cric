# DPL Cric

Production-ready React/Vite foundation for Digitate Premier League.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Supabase variables, app runs in safe demo mode and does not send data anywhere.

## Supabase setup

1. Create Supabase project.
2. Run `supabase/migrations/20260812000000_create_registrations.sql` in SQL Editor.
3. Add project URL and anon key to `.env.local`.
4. Add same values as GitHub Actions secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Only public anon key belongs in frontend. Never expose service-role key.

## Quality gates

```bash
npm run lint
npm run build
```

Deployment runs both checks before publishing GitHub Pages.
