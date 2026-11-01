# Backend (Supabase) — IT-Tiket

Fondasi awal oleh Gos. Semua perubahan DB melalui fail baru dalam `supabase/migrations/`
(migration diterapkan tidak boleh diedit oleh klien lain).

## Skema

| Jadual | Kandungan | Nota |
|---|---|---|
| `profiles` | Satu baris setiap pengguna auth: nama, no pekerja, jabatan, `role`, `is_active` | trigger `handle_new_user` buat automatik bila user daftar |
| `role_permissions` | Matriks izin per tindakan, contoh `ticket.assign` | role bukan hardcode UI; UI boleh baca matriks |
| `ticket_categories` | Kategori tiket (seed 6 default) | boleh diurus staff/admin |
| `tickets` | Tajuk, deskripsi, status, keutamaan, kategori, penyumbang, assign, SLA, tarikh selesai/tutup | `ticket_no` automatik `TT-000123`; `created_by` tak boleh berubah (trigger) |
| `ticket_messages` | Chat tiket; `kind = reply \| internal_note` | nota dalaman hanya untuk IT/admin |
| `attachments` | Metadata lampiran (fail sebenar dalam storage) | bucket `ticket-attachments`, 20 MiB limit |
| `ticket_events` | Audit besutan: create/assign/status/priority/reply/note/lampiran/panggilan | append-only; tiada delete kepada role biasa |
| `calls` | Log panggilan dalam tiket: bilik, pemicu, status, masa | signaling WebRTC di aplikasi; log kekal di sini |

Status tiket: `new → assigned → in_progress → waiting_user → resolved → closed`
(plus `reopened` bila karyawan tak setuju). Keutamaan: `low|medium|high|urgent`.

Role: `employee`, `it_agent`, `executive` (atasan), `admin`.

## RLS (ringkas)

| Jadual | Karyawan | IT/Admin | Atasan | Admin |
|---|---|---|---|---|
| profiles | baca sendiri | baca semua | baca sendiri | urus semua |
| tickets | sendiri (baca/buat) | semua (baca/ubah) | — (tiada akses langsung) | semua |
| ticket_messages | peserta; nota dalaman tertutup | semua, termasuk nota dalaman | — | semua |
| attachments | peserta | semua | — | semua |
| ticket_events | — | baca | — | baca |
| calls | peserta | baca | — | baca |
| role_permissions / categories | baca | urus | baca | baca/urus |

Helper `security definer`: `is_staff()`, `is_admin()`, `can_view_ticket(uuid)`,
`can_view_ticket_path(text)` (untuk polisi storage, path `<ticket_uuid>/<nama_fail>`).

Storage bucket `ticket-attachments` privat: baca mengikut tiket, muat naik oleh peserta/staff,
hapus oleh staff atau pemilik fail. Pola nama diikat: folder pertama `uuid` tiket.

Realtime: `tickets`, `ticket_messages`, `calls` dimasukkan ke publication `supabase_realtime`
(subscribers melalui RLS, jadi tiada kebocoran).

## Bootstrap admin (sekali, bootstrap pertama sahaja)

```sql
select public.promote_first_admin('budakatidatada@example.com');
```

- Di local: daftar dulu via Studio Auth (email/password), kemudian panggil fungsi ini dengan
  `SQL Editor` atau `psql` (connection string DB dari `supabase status`).
- Fungsi dinolkan jika sudah ada admin — perubahan role seterusnya ialah admin-managed
  (mest ada audit; Gok: tambah polisi kawalan).

## Langkah seterusnya backend

1. **Perkukuh auth**: magic link/OTP, sesi SSR Next.js — Kid/Luna spec.
2. **Email masuk → tiket**: Edge Function + webhook (SendGrid/Mailgun) atau IMAP poller
   lokal. Perlu keputusan provider email (belum dijawab).
3. **WebRTC call**: signaling (realtime broadcast di channel `call:<ticket_id>`),
   STUN/TURN: local test boleh STUN; produksi perlukan TURN server self-host (coturn) atau
   LiveKit — keputusan deploy.
4. **Laporan atasan**: security-definer RPC agregat `exec_report(bulan)` — jumlah tiket, SLA rate,
   masa masuk dan tutup, kategori; baris isi tiket tidak terbocor kepada role executive.
5. **Notifikasi email keluar**: Edge Function + SMTP key (secrets di vault, bukan repo).
