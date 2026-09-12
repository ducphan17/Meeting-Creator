// app/lib/eventSession.ts
//
// Shared shape + helpers for the "which event am I looking at, and as whom"
// state that used to be scattered ad-hoc across localStorage.setItem calls
// in create/page.tsx, join/page.tsx and availability/page.tsx (with the
// join page writing a completely different, never-read "joiningUser" key).
// Centralizing it means both the creator and anyone who joins later end up
// with the exact same shape in their own browser's storage.

export type EventSession = {
    eventId: string;
    eventName: string;
    username: string;
    selectedDays: string[];
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    fromTime: string; // e.g. "7:00 AM"
    toTime: string; // e.g. "10:00 PM"
};

const STORAGE_KEY = "eventData";

export function saveEventSession(session: EventSession) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadEventSession(): EventSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as EventSession;
    } catch {
        return null;
    }
}
