export const REMINDER_DURATIONS = Object.freeze({
    "3 Months": { amount: 3, unit: "month" },
    "2 Months": { amount: 2, unit: "month" },
    "1 Month": { amount: 1, unit: "month" },
    "2 Weeks": { amount: 2, unit: "week" },
    "1 Week": { amount: 1, unit: "week" },
    "3 Days": { amount: 3, unit: "day" },
    "1 Day": { amount: 1, unit: "day" },
});

export const DAILY_REMINDER_SCHEDULE = "0 8 * * *";

export function normalizeReminderDurations(value) {
    if (value === undefined || value === null || value === "") {
        return [];
    }

    const durations = Array.isArray(value) ? value : [value];

    if (durations.some((duration) => typeof duration !== "string" || !Object.hasOwn(REMINDER_DURATIONS, duration))) {
        throw new Error("One or more reminder durations are invalid.");
    }

    return [...new Set(durations)];
}

export function getReminderDate(leaseEndDate, reminderType) {
    const duration = REMINDER_DURATIONS[reminderType];
    const match = typeof leaseEndDate === "string" && leaseEndDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!duration || !match) {
        throw new Error("A valid lease end date and reminder duration are required.");
    }

    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText) - 1;
    const day = Number(dayText);
    const leaseDate = new Date(Date.UTC(year, month, day));

    if (
        leaseDate.getUTCFullYear() !== year ||
        leaseDate.getUTCMonth() !== month ||
        leaseDate.getUTCDate() !== day
    ) {
        throw new Error("A valid lease end date and reminder duration are required.");
    }

    if (duration.unit === "month") {
        const targetMonth = new Date(Date.UTC(year, month - duration.amount, 1));
        const lastDayOfTargetMonth = new Date(Date.UTC(
            targetMonth.getUTCFullYear(),
            targetMonth.getUTCMonth() + 1,
            0
        )).getUTCDate();

        targetMonth.setUTCDate(Math.min(day, lastDayOfTargetMonth));
        return targetMonth.toISOString().slice(0, 10);
    }

    leaseDate.setUTCDate(day - duration.amount * (duration.unit === "week" ? 7 : 1));
    return leaseDate.toISOString().slice(0, 10);
}

export function buildCronSchedule() {
    return DAILY_REMINDER_SCHEDULE;
}
