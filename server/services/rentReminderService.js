import cron from "node-cron";
import { Resend } from "resend";
import db from "../config/db.js";

// Define the cron schedule for daily rent reminders at 8 AM
export const DAILY_REMINDER_SCHEDULE = "0 8 * * *";

export function buildCronSchedule() {
    return DAILY_REMINDER_SCHEDULE;
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
            t.currency
        FROM rent_reminders rr
        INNER JOIN tenants t ON t.id = rr.tenant_id
        WHERE rr.sent_at IS NULL
          AND rr.scheduled_for <= CURRENT_DATE
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
                text: `Hello ${reminder.full_name},\n\nThis is a ${reminder.reminder_type} reminder for your rent due on ${reminder.scheduled_for}.\nYour current rent amount is ${reminder.currency || "USD"} ${Number(reminder.rent_amount).toFixed(2)}.\n\nPlease ensure payment is made on time.\n\nThanks,\nTenTraq`,
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
