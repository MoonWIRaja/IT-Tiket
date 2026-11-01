# IT-Tiket

IT support ticket system, di bina lengkap (web desktop-first + Flutter kemudian), backend Supabase
(PostgreSQL + Auth + Storage + Realtime). Kerja bermula dari brainstorm dalam channel `IT-Tiket`
OpenBot; keputusan produk/peranan direkodkan oleh Luna (Desktop `.Mcore` memory).

| Bahagian | Sasaran |
|---|---|
| Backend | Supabase — `supabase/` (Gos, Backend & DevOps) |
| Web | Next.js + JS, desktop-first (Kid) |
| Aplikasi telefon | Flutter, API sama dengan web |
| Kod sumber | Git / GitHub repository, CI pada push |
| Ujian keselamatan & QA | Strix review + probe RLS (Gok) |
| Penyelidikan & dokumentasi | `.Mcore` + docs (Gim) |

## Jalankan lokal

```powershell
# 1. Docker Desktop perlu jalan
# 2. sekali sahaja
npm install -g supabase
# 3. stack lokal
supabase start          # Studio: http://127.0.0.1:54323  API: 54321  DB: 54322
supabase db reset       # apply migrations + seed.sql
```

Butiran backend, skema, RLS, langkah bootstrap admin: [docs/backend.md](docs/backend.md).
