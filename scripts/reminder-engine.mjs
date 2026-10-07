import { createHash, randomUUID } from 'node:crypto';
const DAY = 86400000;
export function reminderWindow(expiresAt, now) { const left = expiresAt - now; return left > 0 && left <= DAY ? 1 : left > DAY && left <= 7 * DAY ? 7 : null; }
export function reminderKey(giftId, expiresAt, days) { return 'renewal-' + createHash('sha256').update(giftId + ':' + expiresAt + ':' + days).digest('hex'); }
/** Stable payload + persistent ledger + provider key. Never automatically retry an ambiguous send beyond 23 hours. */
export async function runReminders(db, { now = Date.now(), origin, from, dryRun = false, send, clock = Date.now }) {
    const url = new URL(origin);
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname))
        throw Error('APP_URL must use HTTPS.');
    const rows = async () => await db.prepare(`SELECT g.id,g.expires_at,g.status,g.paid_order_id,u.email,p.language FROM gifts g JOIN users u ON u.id=g.owner_id JOIN profiles p ON p.user_id=u.id WHERE g.status='published' AND g.paid_order_id IS NOT NULL AND g.expires_at>? AND g.expires_at<=? AND u.verified=1 AND p.renewal_reminders=1`).all(now, now + 7 * DAY);
    const due = (await rows()).map(g => ({ ...g, days: reminderWindow(g.expires_at, now) }));
    if (dryRun)
        return { due: due.length, sent: 0, review: 0, skipped: 0 };
    if (!from || !send)
        throw Error('Email delivery is not configured.');
    const lease = randomUUID(), leaseNow = clock();
    const acquired = await db.prepare(`INSERT INTO job_leases(id,token,expires_at) VALUES('renewal',?,?) ON CONFLICT(id) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at WHERE job_leases.expires_at<?`).run(lease, leaseNow + 120000, leaseNow);
    if (!acquired.changes)
        return { due: 0, sent: 0, review: 0, skipped: 0, locked: true };
    const summary = { due: due.length, sent: 0, review: 0, skipped: 0 };
    try {
        for (const g of due) {
            const id = reminderKey(g.id, g.expires_at, g.days), my = g.language !== 'en';
            const expiry = new Date(g.expires_at).toLocaleString(my ? 'my-MM' : 'en-GB', { timeZone: 'Asia/Yangon', dateStyle: 'medium', timeStyle: 'short' });
            const payload = JSON.stringify({ from, to: [g.email], subject: my ? 'OurStory လက်ဆောင် သက်တမ်းတိုးရန် သတိပေးချက်' : 'Your OurStory hosting renewal reminder', text: (my ? 'သင့်လက်ဆောင်၏ hosting သက်တမ်း မကြာမီကုန်တော့ပါမယ်။' : 'Your gift hosting expires soon.') + '\n\nGift: ' + g.id.slice(-8) + '\n' + expiry + ' (Myanmar time)\n\n' + (my ? 'သက်တမ်းတိုးရန်' : 'Review and renew') + ': ' + url.origin + '/edit/' + g.id + '?step=3\n\n' + (my ? 'Reminder ပိတ်ရန် Account settings သို့ဝင်ပါ။' : 'To stop reminders, turn them off in Account settings.') + '\n' + url.origin + '/account\n\n' + (my ? 'အလိုအလျောက် ငွေမဖြတ်ပါ။' : 'No automatic payment will be charged.') });
            await db.prepare(`INSERT OR IGNORE INTO reminder_deliveries (id,gift_id,expires_at,days,payload,status) VALUES(?,?,?,?,?,'pending')`).run(id, g.id, g.expires_at, g.days, payload);
        }
        // Cancel stale queued messages after renewal, refund, deletion or consent withdrawal.
        await db.prepare(`UPDATE reminder_deliveries SET status='cancelled' WHERE status='pending' AND NOT EXISTS (SELECT 1 FROM gifts g JOIN profiles p ON p.user_id=g.owner_id JOIN users u ON u.id=g.owner_id WHERE g.id=reminder_deliveries.gift_id AND g.expires_at=reminder_deliveries.expires_at AND g.status='published' AND g.paid_order_id IS NOT NULL AND g.expires_at>? AND p.renewal_reminders=1 AND u.verified=1)`).run(now);
        const pending = await db.prepare("SELECT * FROM reminder_deliveries WHERE status='pending' AND next_attempt_at<=? ORDER BY COALESCE(first_attempt_at,0),id LIMIT 50").all(now);
        for (const item of pending) {
            if (item.attempts >= 5 || (item.first_attempt_at !== null && now - item.first_attempt_at >= 23 * 3600000)) {
                await db.prepare("UPDATE reminder_deliveries SET status='review' WHERE id=?").run(item.id);
                summary.review++;
                continue;
            }
            // A delayed 7-day retry is no longer useful when the 1-day notice is due.
            if (reminderWindow(item.expires_at, now) !== item.days) {
                await db.prepare("UPDATE reminder_deliveries SET status='cancelled' WHERE id=?").run(item.id);
                summary.skipped++;
                continue;
            }
            const currentTime = clock();
            const stillEligible = await db.prepare(`SELECT 1 FROM gifts g JOIN profiles p ON p.user_id=g.owner_id JOIN users u ON u.id=g.owner_id WHERE g.id=? AND g.expires_at=? AND g.expires_at>? AND g.status='published' AND g.paid_order_id IS NOT NULL AND p.renewal_reminders=1 AND u.verified=1`).get(item.gift_id, item.expires_at, currentTime);
            if (!stillEligible) {
                await db.prepare("UPDATE reminder_deliveries SET status='cancelled' WHERE id=?").run(item.id);
                summary.skipped++;
                continue;
            }
            const alive = await db.prepare("UPDATE job_leases SET expires_at=? WHERE id='renewal' AND token=?").run(clock() + 120000, lease);
            if (!alive.changes)
                throw Error('Reminder worker lease was lost.');
            // Persist before network I/O so a crash uses the same request and retry window.
            await db.prepare('UPDATE reminder_deliveries SET attempts=attempts+1,first_attempt_at=COALESCE(first_attempt_at,?),last_attempt_at=?,next_attempt_at=? WHERE id=?').run(now, now, now + 15 * 60000, item.id);
            try {
                const result = await send(JSON.parse(item.payload), item.id);
                if (!result?.id)
                    throw Error('Provider did not return a message ID.');
                await db.prepare("UPDATE reminder_deliveries SET status='sent',provider_id=?,sent_at=? WHERE id=?").run(result.id, clock(), item.id);
                summary.sent++;
            }
            catch {
                summary.skipped++;
            }
        }
        return summary;
    }
    finally {
        await db.prepare("DELETE FROM job_leases WHERE id='renewal' AND token=?").run(lease);
    }
}
