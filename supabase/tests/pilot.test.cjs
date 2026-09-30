// npm run test:backend — executes the migration in a disposable PostgreSQL engine.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

const migrations = fs.readdirSync(path.join(__dirname, '../migrations')).filter(file => file.endsWith('.sql')).sort()
  .map(file => fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8'));
const users = [1, 2, 3, 4, 5, 6].map(n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`);

async function main() {
  const db = new PGlite();
  let assertions = 0;
  const check = (actual, expected) => { assert.deepEqual(actual, expected); assertions++; };
  const query = (sql, params = []) => db.query(sql, params);
  const as = async (role, user = null) => {
    await query('reset role');
    await query("select set_config('request.jwt.claim.sub', $1, false)", [user || '']);
    await query(`set role ${role}`);
  };
  const rejects = async (fn, label) => {
    await assert.rejects(fn, undefined, label);
    assertions++;
  };
  const create = async (name = 'Pier 2', kind = 'open_now') =>
    (await query('select public.pilot_create_request($1,$2,$3,$4,$5,$6) as id',
      [name, 40.7, -73.9, 'By the entrance', kind, 10])).rows[0].id;
  const status = async id => (await query('select status, observer_id, answer from public.pilot_requests where id=$1', [id])).rows[0];

  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users (id uuid primary key, email_confirmed_at timestamptz, is_anonymous boolean default false);
      create function auth.uid() returns uuid language sql stable
        as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public, auth to anon, authenticated, service_role;
      grant execute on function auth.uid() to anon, authenticated, service_role;
    `);
    for (const migration of migrations) await db.exec(migration);
    await query('insert into auth.users(id) select unnest($1::uuid[])', [users]);
    await query('insert into public.pilot_members(user_id) select unnest($1::uuid[])', [users.slice(0, 5)]);

    await as('anon');
    await rejects(() => query('select * from public.pilot_requests'), 'anon cannot read');
    await rejects(() => create(), 'anon cannot create');
    await as('authenticated', users[5]);
    check((await query('select * from public.pilot_requests')).rows.length, 0);
    await rejects(() => create(), 'nonmember cannot create');

    await as('authenticated', users[0]);
    check((await query('select user_id from public.pilot_members')).rows.map(r => r.user_id), [users[0]]);
    const answered = await create();
    await rejects(() => query("insert into public.pilot_requests(requester_id,place_name,latitude,longitude,landmark,question_kind,expires_at) values ($1,'forged',1,1,'x','open_now',now()+interval '10 min')", [users[0]]), 'direct insert');
    await rejects(() => query('update public.pilot_requests set place_name=$1 where id=$2', ['forged', answered]), 'direct update');
    await rejects(() => query('delete from public.pilot_requests where id=$1', [answered]), 'direct delete');
    await rejects(() => query('select public.pilot_claim_request($1)', [answered]), 'self claim');
    await rejects(() => query('select public.pilot_create_request($1,40,-73,$2,$3,60)', ['x', 'x', 'open_now']), 'invalid deadline');
    await rejects(() => query('select public.pilot_create_request($1,40,-73,$2,$3,10)', ['x', '', 'open_now']), 'short place name');
    await rejects(() => query('select public.pilot_create_request($1,40,-73,$2,$3,10)', ['Valid', '', 'unknown']), 'invalid question');
    await rejects(() => query('select public.pilot_create_request($1,40,-73,$2,$3,null)', ['Valid', '', 'queue']), 'null deadline');
    const noLandmark = (await query('select public.pilot_create_request($1,40,-73,$2,$3,10) as id',
      ['No landmark', '', 'open_now'])).rows[0].id;
    await query('select public.pilot_cancel_request($1)', [noLandmark]);

    await as('authenticated', users[1]);
    check((await query('select id from public.pilot_requests')).rows.map(r => r.id), [answered]);
    await query('select public.pilot_claim_request($1)', [answered]);
    check(await status(answered), {status: 'claimed', observer_id: users[1], answer: null});
    await rejects(() => query('select public.pilot_answer_request($1,$2,$3)', [answered, '241', '']), 'wrong answer');
    await rejects(() => query('select public.pilot_answer_request($1,$2,$3)', [answered, null, '']), 'null answer');
    await rejects(() => query('select public.pilot_answer_request($1,$2,$3)', [answered, 'yes', 'x'.repeat(281)]), 'long note');
    await as('authenticated', users[2]);
    await rejects(() => query('select public.pilot_claim_request($1)', [answered]), 'double claim');
    await rejects(() => query('select public.pilot_answer_request($1,$2,$3)', [answered, 'yes', '']), 'third party answer');
    check((await query('select id from public.pilot_requests')).rows.length, 0);
    await as('authenticated', users[1]);
    await query('select public.pilot_answer_request($1,$2,$3)', [answered, 'yes', 'Looks open']);
    check(await status(answered), {status: 'answered', observer_id: users[1], answer: 'yes'});
    await rejects(() => query('select public.pilot_answer_request($1,$2,$3)', [answered, 'no', '']), 'repeat answer');
    await as('authenticated', users[0]);
    check((await query('select answer from public.pilot_requests where id=$1', [answered])).rows[0].answer, 'yes');

    const active = [await create('AA'), await create('BB'), await create('CC')];
    await rejects(() => create('DD'), 'requester limit');
    await as('authenticated', users[1]);
    for (const id of active) await query('select public.pilot_claim_request($1)', [id]);
    await as('authenticated', users[2]);
    const fourthClaim = await create('Own task');
    await as('authenticated', users[1]);
    await rejects(() => query('select public.pilot_claim_request($1)', [fourthClaim]), 'observer limit');
    await query('select public.pilot_release_request($1)', [active[0]]);
    check(await status(active[0]), {status: 'open', observer_id: null, answer: null});
    await query('select public.pilot_claim_request($1)', [fourthClaim]);

    await as('authenticated', users[0]);
    await query('select public.pilot_cancel_request($1)', [active[0]]);
    check(await status(active[0]), {status: 'cancelled', observer_id: null, answer: null});
    await rejects(() => query('select public.pilot_cancel_request($1)', [active[0]]), 'repeat cancel');
    await as('authenticated', users[1]);
    await rejects(() => query('select public.pilot_cancel_request($1)', [active[1]]), 'observer cannot cancel');
    await query('select public.pilot_report_request($1,$2)', [active[1], 'unsafe']);
    await rejects(() => query('select public.pilot_report_request($1,$2)', [active[1], 'spam']), 'repeat report');
    await rejects(() => query('select public.pilot_report_request($1,$2)', [active[1], 'other']), 'invalid reason');
    await rejects(() => query('select public.pilot_block_user($1)', [users[4]]), 'block requires interaction');
    await query('select public.pilot_block_user($1)', [users[0]]);
    await as('service_role');
    check(await status(active[1]), {status: 'open', observer_id: null, answer: null});
    check(await status(active[2]), {status: 'open', observer_id: null, answer: null});
    await as('authenticated', users[1]);
    check((await query('select id from public.pilot_requests where id=$1', [active[1]])).rows.length, 0);
    await rejects(() => query('select public.pilot_claim_request($1)', [active[1]]), 'block bars claim');
    await rejects(() => query('select public.pilot_report_request($1,$2)', [active[1], 'spam']), 'block bars report');
    check((await query('select answer,note from public.pilot_requests where id=$1', [answered])).rows.length, 0);
    await as('authenticated', users[0]);
    check((await query('select id from public.pilot_requests where id=$1', [active[1]])).rows.length, 0);
    check((await query('select answer, note from public.pilot_requests where id=$1', [answered])).rows.length, 0);
    await rejects(() => query('select public.pilot_claim_request($1)', [fourthClaim]), 'other requester own claim');
    await as('authenticated', users[2]);
    await query('select public.pilot_report_request($1,$2)', [active[1], 'spam']);

    await as('authenticated', users[3]);
    const expired = await create('Expired', 'queue');
    await as('service_role');
    await query("update public.pilot_requests set expires_at=now()-interval '1 minute', created_at=now()-interval '2 minutes' where id=$1", [expired]);
    await as('authenticated', users[2]);
    check((await query('select id from public.pilot_requests where id=$1', [expired])).rows.length, 0);
    await rejects(() => query('select public.pilot_claim_request($1)', [expired]), 'expired claim');
    await as('authenticated', users[3]);
    await rejects(() => query('select public.pilot_cancel_request($1)', [expired]), 'expired cancel');
    const queue = await create('Queue', 'queue');
    await as('authenticated', users[2]);
    await query('select public.pilot_claim_request($1)', [queue]);
    await rejects(() => query('select public.pilot_answer_request($1,$2,$3)', [queue, '241', '']), 'queue too high');
    await rejects(() => query('select public.pilot_answer_request($1,$2,$3)', [queue, 'yes', '']), 'queue wrong kind');
    await query('select public.pilot_answer_request($1,$2,$3)', [queue, '0', '']);
    check((await status(queue)).answer, '0');

    await as('authenticated', users[4]);
    const expiredClaim = await create('Late answer');
    await as('authenticated', users[2]);
    await query('select public.pilot_claim_request($1)', [expiredClaim]);
    await as('service_role');
    await query("update public.pilot_requests set expires_at=now()-interval '1 minute', created_at=now()-interval '2 minutes' where id=$1", [expiredClaim]);
    await as('authenticated', users[2]);
    await rejects(() => query('select public.pilot_answer_request($1,$2,$3)', [expiredClaim, 'yes', '']), 'expired claim cannot answer');

    await as('service_role');
    await query('update public.pilot_members set active=false where user_id=$1', [users[3]]);
    await as('authenticated', users[3]);
    check((await query('select id from public.pilot_requests')).rows.length, 0);
    await rejects(() => create(), 'revoked member cannot create');
    await query('select public.pilot_delete_account()');
    await query('reset role');
    check((await query('select count(*)::integer as count from auth.users where id=$1', [users[3]])).rows[0].count, 0);
    check((await query('select count(*)::integer as count from public.pilot_requests where id in ($1,$2)', [expired, queue])).rows[0].count, 0);
    await as('authenticated', users[5]);
    await rejects(() => query('select public.pilot_block_user($1)', [users[0]]), 'nonmember cannot block');
    await as('authenticated', users[4]);
    for (const [name, landmark] of [['Watch him', 'Entrance'], ['Cafe', 'private apartment'], ['Fucking cafe', 'Entrance']]) {
      await rejects(() => query('select public.pilot_create_request($1,40,-73,$2,$3,10)', [name, landmark, 'open_now']), 'unsafe request text');
    }
    const moderation = await create('Moderated cafe');
    await as('authenticated', users[0]);
    await query('select public.pilot_claim_request($1)', [moderation]);
    await rejects(() => query('select public.pilot_answer_request($1,$2,$3)', [moderation, 'yes', 'watch her at her house']), 'unsafe answer note');
    await rejects(() => query('select public.pilot_answer_request($1,$2,$3)', [moderation, 'yes', 'kill yourself']), 'abusive answer note');
    await query('select public.pilot_answer_request($1,$2,$3)', [moderation, 'yes', 'Public entrance is open']);
    await as('authenticated', users[4]);
    await query('select public.pilot_report_request($1,$2)', [moderation, 'unsafe']);
    check((await query('select * from public.pilot_requests where id=$1', [moderation])).rows.length, 0);
    await as('authenticated', users[0]);
    check((await query('select * from public.pilot_requests where id=$1', [moderation])).rows.length, 0);
    await query('select public.pilot_report_request($1,$2)', [moderation, 'inaccurate']);
    await rejects(() => query('select * from public.pilot_reports'), 'reports are operator-only');
    await as('service_role');
    check((await query('select hidden from public.pilot_requests where id=$1', [moderation])).rows[0].hidden, true);
    await query('update public.pilot_requests set hidden=false where id=$1', [moderation]);
    await query('update public.pilot_reports set resolved_at=now() where request_id=$1', [moderation]);
    await as('authenticated', users[4]);
    check((await query('select answer from public.pilot_requests where id=$1', [moderation])).rows[0].answer, 'yes');
    await query('select public.pilot_block_user($1)', [users[0]]);
    check((await query('select answer,note from public.pilot_requests where id=$1', [moderation])).rows.length, 0);
    await as('authenticated', users[0]);
    check((await query('select answer,note from public.pilot_requests where id=$1', [moderation])).rows.length, 0);

    await as('authenticated', users[2]);
    const quarantined = await create('Quarantine cafe');
    await as('authenticated', users[4]);
    await query('select public.pilot_claim_request($1)', [quarantined]);
    await query('select public.pilot_report_request($1,$2)', [quarantined, 'spam']);
    await rejects(() => query('select public.pilot_answer_request($1,$2,$3)', [quarantined, 'yes', '']), 'quarantined answer');
    await query('select public.pilot_release_request($1)', [quarantined]);
    await as('authenticated', users[0]);
    await rejects(() => query('select public.pilot_claim_request($1)', [quarantined]), 'quarantined claim');

    await query('reset role');
    const verified = '00000000-0000-4000-8000-000000000007';
    const anonymous = '00000000-0000-4000-8000-000000000008';
    await query('insert into auth.users(id,email_confirmed_at) values($1,now())', [verified]);
    await query('insert into auth.users(id,email_confirmed_at,is_anonymous) values($1,now(),true)', [anonymous]);
    check((await query('select active from public.pilot_members where user_id=$1', [verified])).rows[0].active, true);
    check((await query('select * from public.pilot_members where user_id=$1', [anonymous])).rows.length, 0);
    await query('update auth.users set email_confirmed_at=now() where id=$1', [users[5]]);
    await as('authenticated', users[5]);
    const enrolled = await create('Verified cafe');
    check(Boolean(enrolled), true);
    await as('service_role');
    await query('update public.pilot_members set active=false where user_id=$1', [verified]);
    await query('reset role');
    await query('update auth.users set email_confirmed_at=now() where id=$1', [verified]);
    check((await query('select active from public.pilot_members where user_id=$1', [verified])).rows[0].active, false);

    await as('service_role');
    await query("update public.pilot_requests set created_at=now()-interval '31 days', expires_at=now()-interval '30 days' where id=$1", [quarantined]);
    await as('authenticated', users[2]);
    check((await query('select * from public.pilot_requests where id=$1', [quarantined])).rows.length, 0);
    await rejects(() => query('select public.pilot_cleanup_expired_data()'), 'cleanup is operator-only');
    await as('service_role');
    check((await query('select public.pilot_cleanup_expired_data() as count')).rows[0].count, 1);
    check((await query('select * from public.pilot_reports where request_id=$1', [quarantined])).rows.length, 0);
    check((await query('select * from public.pilot_requests where id=$1', [enrolled])).rows.length, 1);
    await as('authenticated', users[4]);
    await query('select public.pilot_delete_account()');
    await as('service_role');
    check((await query('select * from public.pilot_requests where id=$1', [moderation])).rows.length, 0);
    check((await query('select * from public.pilot_reports where request_id=$1', [moderation])).rows.length, 0);
    check((await query('select * from public.pilot_requests where id=$1', [enrolled])).rows.length, 1);
    console.log(`pilot SQL: ${assertions} assertions passed`);
  } finally {
    await db.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
