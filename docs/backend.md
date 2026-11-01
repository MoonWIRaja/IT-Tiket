# Backend (Supabase) — IT-Tiket

Kesiliran akses guna model kanonik **Gok** (`supabase/migrations/20261102120000_access_control.sql`,
dalam `toolbox/check-access-control.ps1` sebagai tolok). Tambahan Gos: realtime streaming + bootstrap
admin pertama (`20261102130000`). Dos migrasi lama saya dikonsolidasi — tidak dua model skema.

## Jalankan lokal

```powershell
# Docker Desktop perlu jalan
supabase init        # (sekali; config.toml dalam repo)
supabase start       # Studio http://127.0.0.1:54323, API 54321, DB 54322
supabase db reset    # apply semua migrations + seed
supabase status      # connection string untuk psql / env
```

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
select public.promote_first_admin('moonwiraja@example.com'); -- daftar user dulu
```

Selepas itu: `admin_set_role(target, role)` / `admin_set_active(target, active)` (admin sahaja),
mesti ada tamat admin terakhir, semua masuk `audit_events`.

## Realtime

`tickets`, `ticket_messages`, `call_sessions` di sini daftar `supabase_realtime`; pelanggan hanya
menerima baris yang rol mereka boleh baca (RLS digunai per subscriber).

## CI

`.github/workflows/supabase-ci.yml`: `supabase start` → `db reset` → `db lint` di pencerobohon.

## Baki (akan datang / perlu keputusan)

1. Email provider (webhook SMTP/IMAP) - keputusan MoonWiRaja diperlukan.
2. TURN server (coturn) atau LiveKit untuk panggilan di jalur non-NAT; sip dashbor kontroli.
3. Perintah permission per tindakan dipapar UI (matrix diumpuk docs; diaadmins) - bermula dengan Kid.
4. Review keselamatan Gok: audit + probe kebocoran RLS (toolbox harness sebagai pintu).
