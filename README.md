# IT-Tiket

IT support ticket system, di bina lengkap (web desktop-first + Flutter kemudian), backend Supabase
(PostgreSQL + Auth + Storage + Realtime). Kerja bermula dari brainstorm dalam channel `IT-Tiket`
OpenBot; keputusan produk/peranan direkodkan oleh Luna (Desktop `.Mcore` memory).

| Bahagian | Sasaran |
|---|---|
| Backend | Supabase — `supabase/` (Gos, Backend & DevOps; model akses kanonik oleh Gok) |
| Web | Next.js + JS, desktop-first (Kid) |
| Aplikasi telefon | Flutter, API sama dengan web |
| Kod sumber | Git / GitHub repository, CI pada push |
| Ujian keselamatan & QA | Strix review + probe RLS + `toolbox/check-access-control.ps1` (Gok) |
| Penyelidikan & dokumentasi | `.Mcore` + docs (Gim, Luna) |

## Jalankan lokal — tanpa Docker (keputusan MoonWiRaja: tia tak gunakan Docker)

Backend tak butuh Docker: guna projek Supabase **cloud** (free) sebagai pemaju DB:

```powershell
npm install -g supabase
$env:SUPABASE_ACCESS_TOKEN = "<token dari supabase.com/dashboard/account/tokens>"
supabase link --project-ref <project_ref>
supabase db push            # apply semua migration + seed ke projek awak
```

Studio projek awak (Auth, Storage, SQL editor, tabel): `https://supabase.com/dashboard`.
Frontend Next.js dan Flutter boleh jalan sepenuhnya di mesin ini tanpa apa-apa container.

Sudah sedia dijimatkan untuk awak: `web/.env.local` (isi sendiri nilai dari settings/api),
`toolbox/check-supabase-config.ps1` (sahkan borang nilai, tiada kunci dicetak) dan
`toolbox/link-supabase.ps1` (link + `db push` + lint + rahsia CI `-SetCiSecrets`). Langkah
penuh: [docs/backend.md](docs/backend.md) → "Sambung projek Supabase".

Butiran backend, skema, RLS, langkah bootstrap admin: [docs/backend.md](docs/backend.md).
