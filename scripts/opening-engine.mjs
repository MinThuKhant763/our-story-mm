import { createHash, randomUUID } from 'node:crypto';
export function openingKey(giftId, openedAt) { return 'opening-' + createHash('sha256').update(giftId + ':' + openedAt).digest('hex'); }
/** One persistent event per gift; stable provider payload/key and a bounded retry window. */
export async function runOpeningNotifications(db, { now = Date.now(), origin, from, dryRun = false, send, clock = Date.now }) {
    const url = new URL(origin);
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname))
        throw Error('APP_URL must use HTTPS.');
    const eligible = `SELECT 1 FROM gifts g JOIN users u ON u.id=g.owner_id JOIN profiles p ON p.user_id=g.owner_id
 WHERE g.id=gift_openings.gift_id AND g.status IN ('published','test') AND g.expires_at>?
 AND (g.reveal_at IS NULL OR g.reveal_at<=?) AND u.verified=1 AND p.opening_notifications=1`;
    const count = (await db.prepare(`SELECT COUNT(*) AS n FROM gift_openings WHERE email_status='pending' AND next_attempt_at<=? AND EXISTS (${eligible})`).get(now, now, now)).n;
    if (dryRun)
        return { due: count, sent: 0, review: 0, skipped: 0 };
    if (!from || !send)
        throw Error('Email delivery is not configured.');
    const lease = randomUUID(), leaseNow = clock();
    const acquired = await db.prepare(`INSERT INTO job_leases(id,token,expires_at) VALUES('opening',?,?) ON CONFLICT(id) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at WHERE job_leases.expires_at<?`).run(lease, leaseNow + 120000, leaseNow);
    if (!acquired.changes)
        return { due: 0, sent: 0, review: 0, skipped: 0, locked: true };
    const summary = { due: count, sent: 0, review: 0, skipped: 0 };
    try {
        await db.prepare(`UPDATE gift_openings SET email_status='cancelled' WHERE email_status='pending' AND NOT EXISTS (${eligible})`).run(now, now);
        const pending = await db.prepare("SELECT * FROM gift_openings WHERE email_status='pending' AND next_attempt_at<=? ORDER BY opened_at LIMIT 50").all(now);
        for (const item of pending) {
            if (item.attempts >= 5 || (item.first_attempt_at !== null && now - item.first_attempt_at >= 23 * 3600000)) {
                await db.prepare("UPDATE gift_openings SET email_status='review' WHERE gift_id=?").run(item.gift_id);
                summary.review++;
                continue;
            }
            const currentTime = clock();
            const owner = await db.prepare(`SELECT u.email,p.language FROM gifts g JOIN users u ON u.id=g.owner_id JOIN profiles p ON p.user_id=g.owner_id
    WHERE g.id=? AND g.status IN ('published','test') AND g.expires_at>? AND (g.reveal_at IS NULL OR g.reveal_at<=?) AND u.verified=1 AND p.opening_notifications=1`).get(item.gift_id, currentTime, currentTime);
            if (!owner) {
                await db.prepare("UPDATE gift_openings SET email_status='cancelled' WHERE gift_id=?").run(item.gift_id);
                summary.skipped++;
                continue;
            }
            const alive = await db.prepare("UPDATE job_leases SET expires_at=? WHERE id='opening' AND token=?").run(clock() + 120000, lease);
            if (!alive.changes)
                throw Error('Opening notification worker lease was lost.');
            let payload = item.payload;
            if (!payload) {
                const my = owner.language !== 'en', opened = new Date(item.opened_at).toLocaleString(my ? 'my-MM' : 'en-GB', { timeZone: 'Asia/Yangon', dateStyle: 'medium', timeStyle: 'short' });
                payload = JSON.stringify({ from, to: [owner.email], subject: my ? 'သင့် OurStory လက်ဆောင်ကို ဖွင့်ကြည့်ခဲ့ပါတယ်' : 'Your OurStory gift was opened', text: (my ? 'သင့်လက်ဆောင်ကို ပထမဆုံးဖွင့်ကြည့်ခဲ့ပါတယ်။' : 'Your gift was opened for the first time.') + '\n\nGift: ' + item.gift_id.slice(-8) + '\n' + opened + ' (Myanmar time)\n\n' + (my ? 'Dashboard မှာ အသိပေးချက်ကို ကြည့်ရန်' : 'View the notification in your dashboard') + ': ' + url.origin + '/dashboard\n' + url.origin + '/edit/' + item.gift_id + '\n\n' + (my ? 'ဒီမှတ်တမ်းက link ကိုင်ထားသူက ဖွင့်ခဲ့ကြောင်းပဲ ပြသသည်။ ဘယ်သူဖြစ်ကြောင်း အတည်မပြုနိုင်ပါ။' : 'This records an opening by someone with access; it does not verify who they are.') + '\n\n' + (my ? 'Email အသိပေးချက် ပိတ်ရန်' : 'Turn off opening emails') + ': ' + url.origin + '/account' });
            }
            // Persist before I/O; ambiguous retries reuse the exact provider payload and key.
            await db.prepare('UPDATE gift_openings SET payload=?,attempts=attempts+1,first_attempt_at=COALESCE(first_attempt_at,?),next_attempt_at=? WHERE gift_id=?').run(payload, now, now + 5 * 60000, item.gift_id);
            try {
                const result = await send(JSON.parse(payload), openingKey(item.gift_id, item.opened_at));
                if (!result?.id)
                    throw Error('Provider did not return a message ID.');
                await db.prepare("UPDATE gift_openings SET email_status='sent',provider_id=?,sent_at=? WHERE gift_id=?").run(result.id, clock(), item.gift_id);
                summary.sent++;
            }
            catch {
                summary.skipped++;
            }
        }
        return summary;
    }
    finally {
        await db.prepare("DELETE FROM job_leases WHERE id='opening' AND token=?").run(lease);
    }
}
