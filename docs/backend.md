# Backend (Supabase) — IT-Tiket

Kesiliran akses guna model kanonik **Gok** (`supabase/migrations/20261102120000_access_control.sql`,
dalam `toolbox/check-access-control.ps1` sebagai tolok). Tambahan Gos: realtime streaming + bootstrap
admin pertama (`20261102130000`). Dos migrasi lama saya dikonsolidasi — tidak dua model skema.

## Jalankan projekt tanpa Docker (keputusan MoonWiRaja, 2026-11-02)

```powershell
npm install -g supabase
$env:SUPABASE_ACCESS_TOKEN = "<token supabase.com/dashboard/account/tokens>"
supabase link --project-ref <project_ref>   # projek Supabase cloud (free tier)
supabase db push                             # apply migrations + seed ke projek
```

Studio web (Auth, Storage, SQL editor): `https://supabase.com/dashboard/project/<ref>`.

Kunci: `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` untuk klien; `SUPABASE_SERVICE_ROLE_KEY` hanya server
(Lihat `.env.example`). `service_role` memintas RLS — kekunci di server.

## Skema (model kanonik)

| Jadual | Kandungan |
|---|---|
| `profiles` | `email`, `display_name`, `role` (`karyawan`/`it`/`atasan`/`admin`), `active` |
| `tickets` | `number` (auto), `requester_id`, `assignee_id`, `title`, `body`, `status`, `priority`, `category`, `source` (`app`/`email`), `sender_verified` |
| `ticket_messages` | chat tiket, `visibility` (`public`/`internal`) |
| `ticket_attachments` | metadata lampiran; path `<ticket_uuid>/<uuid>`, 10 MiB, mime senarai putih (png/jpeg/webp/pdf/text) |
| `call_sessions` | log panggilan; `recording_path` server sahaja |
| `audit_events` | jejak audit semua tulis tiket (server-side trigger) |
| `ticket_metrics_monthly` | agregat bulanan untuk dashboard atasan (`refresh_ticket_metrics()` oleh admin/service_role) |

`FORCE RLS` pada jadual jadual; `service_role` memintas; masuk `anon` tiada apa-apa.

Peraturan tiket (trigger `guard_ticket_write`):

- `sender_verified`, `source`, `requester_id`, `number` — imutabel; dua medan pertama hanya server
  (email-masuk ke tiket diisi oleh service_role).
- `karyawan`: hanya buka tiket sendiri; mampu buka semula kaedah `in_progress` bila status
  `resolved`/`closed`, dalam tetingkap **14 hari**, tiada edit ketiga-tiga medan.
- `it`/`admin`: semua update operasi; `closed_at` diisi automatik bila status `resolved`/`closed`.
- `atasan`: tiada akses tulis; baca `ticket_metrics_monthly` sahaja (dashboard/ summari).

Chat: nota `internal` hanya `it`+/`admin` (polisi + trigger). Audit: insert is server-side
(`audit_ticket`), `authenticated` belum ada geran `insert`.

## Bootstrap admin (sekali)

```sql
select public.promote_first_admin('<email-awak>'); -- daftar user dulu (contoh alamat, bukan alamat sebenar)
```

Selepas itu: `admin_set_role(target, role)` / `admin_set_active(target, active)` (admin sahaja),
mesti ada tamat admin terakhir, semua masuk `audit_events`.

## Realtime

`tickets`, `ticket_messages`, `call_sessions` di sini daftar `supabase_realtime`; pelanggan hanya
menerima baris yang rol mereka boleh baca (RLS digunai per subscriber).

## CI

`.github/workflows/supabase-ci.yml` (tanpa Docker): gate statik akses (PowerShell) + dry-run
`db push` ke projek Supabase bila secret repo `SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF` ada.

## Sambung projek Supabase — langkah siap-guna (MoonWiRaja isi sendiri)

1. Buka `.env.local` **di root repo** (fail sudah disediakan, di-gitignore; template: `.env.example`
   yang juga di root). Isi dari `https://supabase.com/dashboard/project/<PROJECT_REF>/settings/api`:
   `NEXT_PUBLIC_SUPABASE_URL` (Project URL), `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon public),
   dan `SUPABASE_SERVICE_ROLE_KEY` jika skrin admin akan digunakan (server sahaja).
   Next.js di `web/` memuat nilaian ini secara automatik: `npm run dev`/`build`/`start`
   laksanakan `toolbox/sync-web-env.mjs` (predev/prebuild/prestart) yang menyalin root
   `.env.local` ke `web/.env.local`; suntingan terus dalam `web/.env.local` dihormati selagi
   fail itu lebih baharu daripada root.
2. Sahkan borang nilai: `powershell toolbox/check-supabase-config.ps1` -> semua nilai asas PASS,
   tiada kunci dicetak.
3. Dalam terminal awak sendiri, set token sekali:
   `$env:SUPABASE_ACCESS_TOKEN = "<token dari supabase.com/dashboard/account/tokens>"`,
   kemudian `powershell toolbox/link-supabase.ps1 -ProjectRef <PROJECT_REF> -SetCiSecrets`
   → `supabase link` + `supabase db push` + `db lint` + rahsia `SUPABASE_*` repo CI disetel.
   Pilihan direct connection Postgres (dibenarkan MoonWiRaja): letak `SUPABASE_DB_PASSWORD`
   atau `SUPABASE_DB_URL` dalam `.env.local` — `link-supabase.ps1` memakannya automatik
   (kata-laluan melalui stdin sahaja; nilai tidak dicetak). Untuk app web, sambungan tetap
   REST/PostgREST supaya RLS aktif; direct connection hanya untuk CLI/ops/migrasi.
4. Push satu commit (fail dalam `supabase/`, `toolbox/`, `docs/`) supaya backend-ci jalankan
   `db push --dry-run` dengan rahsia baharu.

## Baki (akan datang / perlu keputusan)

1. Projek Supabase cloud untuk pembangunan (tiada Docker) — perlu akaun MoonWiRaja atau pilihan.
2. Email provider (webhook SMTP/IMAP) — keputusan MoonWiRaja diperlukan.
3. TURN server (coturn) atau LiveKit untuk panggilan melintasi NAT; keputusan deploy.
4. Matriks permission per tindakan yang boleh diurus admin di UI; start dengan Kid + Gok.
5. Review keselamatan Gok: audit + probe kebocoran RLS (toolbox harness sebagai pintu).
