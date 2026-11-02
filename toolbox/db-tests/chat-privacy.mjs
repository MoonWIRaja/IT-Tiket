// Runs ALL migrations in an in-process Postgres (PGlite) with stubs for the
// Supabase-managed schemas (auth, storage, realtime), then checks closed-ticket
// chat privacy, admin-only reopen and IT-first chat. No cloud, no Docker.
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../supabase/migrations');
const db = new PGlite();

await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
grant anon, authenticated, service_role to postgres;
create schema auth; create schema storage; create schema realtime;
grant usage on schema auth, storage, realtime to anon, authenticated, service_role;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(n text) returns text[] language sql immutable as $$ select string_to_array(n, '/') $$;
create table realtime.messages (id uuid default gen_random_uuid(), extension text, topic text);
alter table realtime.messages enable row level security;
create function realtime.topic() returns text language sql stable as $$ select current_setting('realtime.topic', true) $$;
create publication supabase_realtime;
grant select, insert on storage.objects to authenticated;
grant select, insert on realtime.messages to authenticated;
`);

await db.exec('grant all on all tables in schema public to service_role; grant execute on all functions in schema public to service_role');
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
  try { await db.exec(fs.readFileSync(path.join(dir, f), 'utf8')); console.log('applied', f); }
  catch (e) { console.error('FAILED migration', f, e.message); process.exit(1); }
}

await db.exec('grant all on all tables in schema public to service_role');
const ids = {};
for (const [k, role] of [['emp', 'karyawan'], ['emp2', 'karyawan'], ['it', 'it'], ['admin', 'admin']]) {
  const r = await db.query(`insert into auth.users (email) values ($1) returning id`, [`${k}@test.local`]);
  ids[k] = r.rows[0].id;
  await db.query(`update public.profiles set role=$1 where id=$2`, [role, ids[k]]);
}

let failed = 0;
async function as(who, sql, params = []) {
  const claims = who === 'service' ? { role: 'service_role' } : { sub: ids[who], role: 'authenticated' };
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','${claims.sub ?? ''}',false), set_config('request.jwt.claim.role','${claims.role}',false); set role ${who === 'service' ? 'service_role' : 'authenticated'}`);
  try { const r = await db.query(sql, params); return { ok: true, rows: r.rows }; }
  catch (e) { return { ok: false, err: e.message }; }
  finally { await db.exec('reset role'); }
}
function check(name, cond, extra = '') { console.log(cond ? 'PASS' : 'FAIL', name, cond ? '' : extra); if (!cond) failed++; }

// Ticket created by emp.
const t = (await as('emp', `insert into tickets (requester_id,title,body) values ($1,'t','b') returning id`, [ids.emp])).rows[0].id;
const msg = (who, body = 'hi', vis = 'public') => as(who, `insert into ticket_messages (ticket_id,author_id,body,visibility) values ($1,$2,$3,$4) returning id`, [t, ids[who], body, vis]);
const att = (who, mid, folder = 'public') => as(who, `insert into ticket_attachments (ticket_id,message_id,storage_path,original_name,content_type,size_bytes,uploaded_by) values ($1,$2,$3,'a.txt','text/plain',5,$4)`,
  [t, mid, `${t}/${folder}/${crypto.randomUUID()}`, ids[who]]);
const call = (who) => as(who, `insert into call_sessions (ticket_id,started_by) values ($1,$2)`, [t, ids[who]]);

// --- IT-first chat ---
let r = await msg('emp');
check('employee cannot send before staff starts', !r.ok, r.err);
r = await att('emp', null);
check('employee can still add initial attachment (no message)', r.ok, r.err);
r = await call('emp');
check('employee cannot call before staff chat', !r.ok, r.err);
r = await call('it');
check('IT can call without a chat first', r.ok, r.err);
await db.exec(`reset role; set realtime.topic = 'call:${t}'`);
r = await as('emp', `insert into realtime.messages (extension, topic) values ('broadcast', 'call:${t}')`);
check('requester can signal so a staff call reaches them before any chat', r.ok, r.err);
check('another employee cannot signal', !(await as('emp2', `insert into realtime.messages (extension, topic) values ('broadcast', 'call:${t}')`)).ok);
check('employee cannot log control for a ticket that is not theirs', !(await as('emp2', `select log_remote_control($1,'remote_control_granted')`, [t])).ok);
check('requester can log a control grant', (await as('emp', `select log_remote_control($1,'remote_control_granted')`, [t])).ok);
check('invalid control action refused', !(await as('emp', `select log_remote_control($1,'x')`, [t])).ok);
await as('emp', `insert into push_subscriptions (endpoint,user_id,p256dh,auth) values ('https://p/1',$1,'k','a')`, [ids.emp]);
check('push subscriptions are private', (await as('emp2', `select count(*)::int c from push_subscriptions`)).rows[0].c === 0 && (await as('emp', `select count(*)::int c from push_subscriptions`)).rows[0].c === 1);
r = await msg('it', 'internal note', 'internal');
check('internal IT note does not start the chat', (await msg('emp')).ok === false);
r = await msg('it', 'hello, how can I help');
check('IT can start the chat', r.ok, r.err);
const itMsg = r.rows?.[0]?.id;
check('IT can call after starting public chat', (await call('it')).ok);
r = await msg('emp', 'my screen is black');
check('employee can reply after IT started', r.ok, r.err);
const empMsg = r.rows?.[0]?.id;
check('employee can call after chat started', (await call('emp')).ok);
check('employee can attach to a message after chat started', (await att('emp', empMsg)).ok);
check('employee cannot post internal message', !(await msg('emp', 'x', 'internal')).ok);
const otherSees = await as('emp2', `select count(*)::int c from ticket_messages where ticket_id=$1`, [t]);
check('another employee sees nothing', otherSees.rows[0].c === 0);
const seen = async (who) => (await as(who, `select (select count(*)::int from ticket_messages where ticket_id=$1) m, (select count(*)::int from ticket_attachments where ticket_id=$1) a, (select count(*)::int from call_sessions where ticket_id=$1) c, (select count(*)::int from tickets where id=$1) t`, [t])).rows[0];
let s = await seen('emp');
check('employee sees chat while open', s.m >= 2 && s.a >= 1 && s.c >= 1, JSON.stringify(s));

// --- close / reopen ---
r = await as('it', `update tickets set status='closed' where id=$1`, [t]);
check('IT can close', r.ok, r.err);
s = await seen('emp');
check('employee sees NO messages/attachments/calls after close', s.m === 0 && s.a === 0 && s.c === 0, JSON.stringify(s));
check('employee still sees the ticket row (status)', s.t === 1);
s = await seen('it');
check('IT still sees everything after close', s.m >= 3 && s.a >= 1 && s.c >= 1, JSON.stringify(s));
check('employee cannot send on closed ticket', !(await msg('emp')).ok);
check('employee cannot call on closed ticket', !(await call('emp')).ok);
check('employee cannot attach on closed ticket', !(await att('emp', null)).ok);
check('employee cannot reopen closed ticket', !(await as('emp', `update tickets set status='in_progress' where id=$1`, [t])).ok);
r = await as('it', `update tickets set status='in_progress' where id=$1`, [t]);
check('IT cannot reopen closed ticket', !r.ok, r.err);
check('closed ticket still closed', (await as('admin', `select status from tickets where id=$1`, [t])).rows[0].status === 'closed');
await db.exec(`reset role; set realtime.topic = 'call:${t}'`);
r = await as('emp', `select count(*)::int c from realtime.messages`);
check('employee call-signal policy denies on closed ticket (no rows)', r.ok && r.rows[0].c === 0);
r = await as('admin', `update tickets set status='in_progress' where id=$1`, [t]);
check('Admin can reopen', r.ok, r.err);
s = await seen('emp');
check('employee sees chat again after admin reopen', s.m >= 2 && s.a >= 1, JSON.stringify(s));
const audit = (await db.query(`select action, actor_id, meta from audit_events where entity_id=$1 and action in ('ticket_closed','ticket_reopened') order by at`, [t])).rows;
check('audit has ticket_closed by IT then ticket_reopened by admin',
  audit.length === 2 && audit[0].action === 'ticket_closed' && audit[0].actor_id === ids.it
  && audit[1].action === 'ticket_reopened' && audit[1].actor_id === ids.admin && audit[1].meta.from === 'closed', JSON.stringify(audit));
// employee reopen from 'resolved' still works
await as('it', `update tickets set status='resolved' where id=$1`, [t]);
r = await as('emp', `update tickets set status='in_progress' where id=$1`, [t]);
check('employee can still reopen a resolved (not closed) ticket', r.ok, r.err);
r = await as('service', `update tickets set status='closed' where id=$1`, [t]);
check('service role unaffected', r.ok, r.err);

console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
process.exit(failed ? 1 : 0);
