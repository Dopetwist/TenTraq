import cron from "node-cron";
import { Resend } from "resend";
import db from "../config/db.js";
import {
    buildCronSchedule,
    getReminderDate,
    normalizeReminderDurations
} from "./reminderSchedule.js";

export {
    buildCronSchedule,
    getReminderDate,
    normalizeReminderDurations
} from "./reminderSchedule.js";

export async function syncTenantRentReminders(client, tenantId, leaseEndDate, reminderDurations, resetSentReminders = false) {
    const existingResult = await client.query(
        "SELECT id, reminder_type FROM rent_reminders WHERE tenant_id = $1 FOR UPDATE",
        [tenantId]
    );
    const existingReminders = existingResult.rows;

    await client.query(
        "DELETE FROM rent_reminders WHERE tenant_id = $1 AND NOT (reminder_type = ANY($2::text[]))",
        [tenantId, reminderDurations]
    );

    for (const reminderType of reminderDurations) {
        const matchingRows = existingReminders.filter((reminder) => reminder.reminder_type === reminderType);
        const scheduledFor = getReminderDate(leaseEndDate, reminderType);

        if (matchingRows.length === 0) {
            await client.query(
                "INSERT INTO rent_reminders (tenant_id, reminder_type, scheduled_for) VALUES ($1, $2, $3)",
                [tenantId, reminderType, scheduledFor]
            );
            continue;
        }

        const [existingReminder, ...duplicateRows] = matchingRows;
        await client.query(
            `UPDATE rent_reminders
             SET scheduled_for = $2,
                 sent_at = CASE WHEN $3 OR scheduled_for IS DISTINCT FROM $2::date THEN NULL ELSE sent_at END
             WHERE id = $1`,
            [existingReminder.id, scheduledFor, resetSentReminders]
        );

        for (const duplicate of duplicateRows) {
            await client.query("DELETE FROM rent_reminders WHERE id = $1", [duplicate.id]);
        }
    }
}

// Create a Resend client when email delivery is configured.
export function createResendClient() {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey || !from) {
        return null;
    }

    return new Resend(apiKey);
}

// Fetch due rent reminders from the database
export async function getDueRentReminders() {
    const result = await db.query(`
        SELECT
            rr.id,
            rr.tenant_id,
            rr.reminder_type,
            rr.scheduled_for,
            t.full_name,
            t.email,
            t.rent_amount,
            t.currency,
            t.lease_end_date
        FROM rent_reminders rr
        INNER JOIN tenants t ON t.id = rr.tenant_id
        WHERE rr.sent_at IS NULL
          AND rr.scheduled_for <= CURRENT_DATE
          AND t.status = 'active'
        ORDER BY rr.scheduled_for ASC
    `);

    return result.rows;
}

// Process and send due rent reminders
export async function processRentReminders() {
    const dueReminders = await getDueRentReminders();

    if (dueReminders.length === 0) {
        return { sent: 0, total: 0 };
    }

    const resend = createResendClient();

    if (!resend) {
        console.warn("Resend email delivery is not configured. Skipping rent reminder delivery.");
        return { sent: 0, total: dueReminders.length, skipped: dueReminders.length };
    }

    let sentCount = 0;

    for (const reminder of dueReminders) {
        try {
            const { error } = await resend.emails.send({
                from: process.env.EMAIL_FROM,
                to: reminder.email,
                subject: `Rent reminder for ${reminder.full_name}`,
                text: `Hello ${reminder.full_name},\n\nThis is your ${reminder.reminder_type} reminder that your lease ends on ${reminder.lease_end_date}.\nYour current rent amount is ${reminder.currency || "USD"} ${Number(reminder.rent_amount).toFixed(2)}.\n\nPlease contact your landlord if you would like to discuss renewing your lease.\n\nThanks,\nTenTraq`,
            });

            if (error) {
                throw error;
            }

            await db.query(
                "UPDATE rent_reminders SET sent_at = NOW() WHERE id = $1",
                [reminder.id]
            );

            sentCount += 1;
        } catch (error) {
            console.error(`Failed to send reminder ${reminder.id} to ${reminder.email}:`, error);
        }
    }

    return { sent: sentCount, total: dueReminders.length };
}

// Start the rent reminder scheduler
export async function startRentReminderScheduler() {
    const schedule = buildCronSchedule();

    cron.schedule(schedule, async () => {
        console.log(`Running rent reminder check: ${schedule}`);

        try {
            const result = await processRentReminders();
            console.log(`Rent reminder check complete. Sent ${result.sent} of ${result.total}.`);
        } catch (error) {
            console.error("Rent reminder job failed:", error.message);
        }
    }, {
        timezone: "Africa/Lagos",
    });

    console.log(`Rent reminder scheduler started with cron expression: ${schedule}`);
}
