// app/lib/api.ts
//
// Small shared helpers for talking to the Django backend, plus the types
// that mirror events/serializers.py so the shape of what the API returns is
// defined in exactly one place on the frontend instead of being re-typed
// (and re-guessed) inline in every page that fetches it.

export type ApiUser = {
    id: number;
    username: string;
};

export type ApiEvent = {
    id: number;
    title: string;
    creator: ApiUser;
    passcode: string | null;
    created_at: string;
    participants: ApiUser[];
    availabilities: unknown[];
    selected_days: string[];
    start_date: string | null;
    end_date: string | null;
    from_time: string | null; // "HH:MM:SS"
    to_time: string | null; // "HH:MM:SS"
};

function apiBase(): string {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) {
        throw new Error(
            "NEXT_PUBLIC_API_URL is not set - can't reach the backend API."
        );
    }
    return base;
}

async function parseErrorMessage(response: Response): Promise<string> {
    try {
        const data = await response.json();
        if (typeof data?.error === "string") return data.error;
        return JSON.stringify(data);
    } catch {
        return `HTTP error! status: ${response.status}`;
    }
}

export async function fetchEvent(eventId: string | number): Promise<ApiEvent> {
    const response = await fetch(`${apiBase()}/events/${eventId}/`);
    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }
    return response.json();
}

export async function joinEvent(
    eventId: string | number,
    username: string,
    passcode: string
): Promise<ApiEvent> {
    const response = await fetch(`${apiBase()}/events/${eventId}/join/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, passcode }),
    });
    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }
    return response.json();
}

export type CreateEventPayload = {
    title: string;
    passcode: string;
    username: string;
    selected_days: string[];
    start_date: string;
    end_date: string;
    from_time: string; // "HH:MM:SS"
    to_time: string; // "HH:MM:SS"
};

export async function createEvent(payload: CreateEventPayload): Promise<ApiEvent> {
    const response = await fetch(`${apiBase()}/events/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }
    return response.json();
}

export type SubmitAvailabilityPayload = {
    event: number;
    start_time: string;
    end_time: string;
    username: string;
};

export async function submitAvailability(payload: SubmitAvailabilityPayload): Promise<void> {
    const response = await fetch(`${apiBase()}/availabilities/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }
}

// One overlap "row" as returned by GET /events/{id}/overlap/:
// ["YYYY-MM-DD|HH:MM-HH:MM", count]
export type RawOverlapSlot = [string, number];

export type GroupAvailabilityDay = {
    date: string;
    slots: { start: string; end: string; count: number }[];
};

/**
 * Fetch and parse group availability for an event. Both the initial load
 * and the post-submit refresh in availability/page.tsx used to duplicate
 * this exact fetch+parse logic (and both parsed the "date time-time" slot
 * string with a plain split('-'), which silently produced garbage because
 * the date itself contains dashes: "2025-06-02 07:00-08:00".split('-')
 * gives ["2025", "06", "02 07:00", "08:00"] - none of which is the actual
 * start time). The backend now emits an unambiguous "date|start-end"
 * format, parsed here in one place.
 */
export async function fetchGroupAvailability(
    eventId: string | number
): Promise<GroupAvailabilityDay[]> {
    const response = await fetch(`${apiBase()}/events/${eventId}/overlap/`);
    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }
    const data: { overlap: RawOverlapSlot[] } = await response.json();

    const byDate = new Map<string, { start: string; end: string; count: number }[]>();
    for (const [slot, count] of data.overlap) {
        const [date, range] = slot.split("|");
        const [start, end] = range.split("-");
        if (!byDate.has(date)) byDate.set(date, []);
        byDate.get(date)!.push({ start, end, count });
    }

    return Array.from(byDate.entries())
        .map(([date, slots]) => ({ date, slots }))
        .sort((a, b) => a.date.localeCompare(b.date));
}
