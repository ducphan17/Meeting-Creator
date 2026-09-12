// app/lib/time.ts
//
// Shared day-of-week list and 12h/24h time helpers. These used to be
// copy-pasted (slightly differently each time) into create/page.tsx and
// availability/page.tsx.

// Order matters: index i must equal what Date.prototype.getDay() returns
// for that day (Sunday = 0 ... Saturday = 6).
export const daysOfWeek = [
    { key: "Su", full: "Sunday" },
    { key: "M", full: "Monday" },
    { key: "T", full: "Tuesday" },
    { key: "W", full: "Wednesday" },
    { key: "Th", full: "Thursday" },
    { key: "F", full: "Friday" },
    { key: "Sa", full: "Saturday" },
] as const;

// Convert "7:00 AM" -> minutes since midnight (for comparisons).
export const convertToMinutes = (time: string): number => {
    const [hourMinute, period] = time.split(" ");
    const [hourRaw, minute] = hourMinute.split(":").map(Number);
    let hour = hourRaw;
    if (period === "PM" && hour !== 12) {
        hour += 12;
    } else if (period === "AM" && hour === 12) {
        hour = 0;
    }
    return hour * 60 + minute;
};

// Convert "7:00 AM" -> "07:00:00" (for the backend).
export const convertTo24Hour = (time: string): string => {
    const [hourMinute, period] = time.split(" ");
    const [hourRaw, minute] = hourMinute.split(":").map(Number);
    let hour = hourRaw;
    if (period === "PM" && hour !== 12) {
        hour += 12;
    } else if (period === "AM" && hour === 12) {
        hour = 0;
    }
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
};

// Convert "07:00" or "07:00:00" -> "7:00 AM".
export const formatTo12Hour = (time: string): string => {
    const [hourStr, minuteStr] = time.split(":");
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
};

// Format a Date as YYYY-MM-DD using LOCAL date parts (never
// toISOString(), which shifts to UTC and can land on the wrong day).
export const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// Parse a "YYYY-MM-DD" string into a local-midnight Date. Deliberately NOT
// `new Date("YYYY-MM-DD")`, which parses as UTC midnight and can render as
// the previous day in any timezone west of UTC.
export const parseDateLocal = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
};
