"use client";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { daysOfWeek, convertToMinutes, convertTo24Hour, formatDateLocal, parseDateLocal } from "../lib/time";
import { fetchEvent, submitAvailability, fetchGroupAvailability, type GroupAvailabilityDay } from "../lib/api";
import { loadEventSession, saveEventSession } from "../lib/eventSession";

// Utility function to normalize a date to midnight in local timezone
const normalizeDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

// Generate calendar days for a given month and year, restricted to the
// event's own [minDate, maxDate] window (previously this range was
// hardcoded to April 27 - June 30, 2025, which meant the calendar had no
// selectable days at all for anyone using the app after that window
// passed).
const generateCalendarDays = (year: number, month: number, minDate: Date, maxDate: Date) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const today = normalizeDate(new Date());
    const days: { date: Date; isInRange: boolean; isPast: boolean }[] = [];

    // Add padding days before the first day of the month
    const firstDayIndex = firstDayOfMonth.getDay();
    for (let i = 0; i < firstDayIndex; i++) {
        const date = new Date(year, month, 1 - (firstDayIndex - i));
        const isPast = normalizeDate(date) < today;
        days.push({ date, isInRange: false, isPast });
    }

    // Add days of the month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const date = new Date(year, month, day);
        const isInRange = date >= minDate && date <= maxDate;
        const isPast = normalizeDate(date) < today;
        days.push({ date, isInRange, isPast });
    }

    // Add padding days after the last day of the month to fill the grid
    const lastDayIndex = lastDayOfMonth.getDay();
    const remainingDays = (7 - (lastDayIndex + 1)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        const isPast = normalizeDate(date) < today;
        days.push({ date, isInRange: false, isPast });
    }

    return days;
};

// Add `delta` months to a {year, month} pair, handling year rollover in
// both directions (the old code assumed a single hardcoded year and broke
// when navigating across a year boundary).
const addMonths = (year: number, month: number, delta: number) => {
    const d = new Date(year, month + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
};

const monthDiff = (a: { year: number; month: number }, b: { year: number; month: number }) =>
    (b.year - a.year) * 12 + (b.month - a.month);

export default function Availability() {
    const router = useRouter();
    const [eventId, setEventId] = useState("");
    const [eventName, setEventName] = useState("");
    const [username, setUsername] = useState("");
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [minDate, setMinDate] = useState<Date | null>(null);
    const [maxDate, setMaxDate] = useState<Date | null>(null);
    const [loadError, setLoadError] = useState("");
    const [selectedDates, setSelectedDates] = useState<{ date: string; dayIndex: number }[]>([]);
    const [availability, setAvailability] = useState<{ [date: string]: { start: string; end: string } }>({});
    const [groupAvailability, setGroupAvailability] = useState<GroupAvailabilityDay[]>([]);
    const [error, setError] = useState("");
    const [monthOffset, setMonthOffset] = useState(0);

    // Load "who am I / which event" from this browser's session, then get
    // the authoritative event config (name, selectable days, date window)
    // from the backend. Previously the *creator's* selectedDays/eventName
    // lived only in localStorage, so anyone who joined from a different
    // browser had no idea what days were even selectable, and their own
    // localStorage might not have an "eventData" entry at all.
    useEffect(() => {
        const session = loadEventSession();
        if (!session || !session.eventId) {
            router.push("/create");
            return;
        }
        setEventId(session.eventId);
        setEventName(session.eventName);
        setUsername(session.username || "");
        setSelectedDays(session.selectedDays || []);

        fetchEvent(session.eventId)
            .then((event) => {
                setEventName(event.title);
                setSelectedDays(event.selected_days || []);

                const start = event.start_date ? parseDateLocal(event.start_date) : new Date();
                const end = event.end_date
                    ? parseDateLocal(event.end_date)
                    : new Date(start.getFullYear(), start.getMonth(), start.getDate() + 56);
                setMinDate(normalizeDate(start));
                setMaxDate(normalizeDate(end));

                saveEventSession({
                    ...session,
                    eventName: event.title,
                    selectedDays: event.selected_days || [],
                    startDate: event.start_date ?? session.startDate,
                    endDate: event.end_date ?? session.endDate,
                });
            })
            .catch((err: unknown) => {
                const message = err instanceof Error ? err.message : String(err);
                setLoadError(`Could not load this event: ${message}`);
            });
    }, [router]);

    const loadGroupAvailability = useCallback(async () => {
        if (!eventId) return;
        try {
            const grouped = await fetchGroupAvailability(eventId);
            setGroupAvailability(grouped);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error("Error fetching group availability:", message);
        }
    }, [eventId]);

    useEffect(() => {
        loadGroupAvailability();
    }, [loadGroupAvailability]);

    const toggleDateSelection = (date: Date) => {
        const dateString = formatDateLocal(date);
        const dayIndex = date.getDay();

        const dayKey = daysOfWeek[dayIndex].key;
        if (!selectedDays.includes(dayKey)) return;

        setSelectedDates(prev => {
            const existingDate = prev.find(item => item.date === dateString);
            if (existingDate) {
                return prev.filter(item => item.date !== dateString);
            }
            return [...prev, { date: dateString, dayIndex }];
        });

        setAvailability(prev => {
            if (prev[dateString]) {
                const rest = { ...prev };
                delete rest[dateString];
                return rest;
            }
            return {
                ...prev,
                [dateString]: { start: "7:00 AM", end: "8:00 AM" },
            };
        });
    };

    const updateAvailability = (date: string, field: "start" | "end", value: string) => {
        setAvailability(prev => ({
            ...prev,
            [date]: {
                ...prev[date],
                [field]: value,
            },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        for (const { date } of selectedDates) {
            const entry = availability[date];
            if (!entry) continue;

            const startMinutes = convertToMinutes(entry.start);
            const endMinutes = convertToMinutes(entry.end);

            if (endMinutes <= startMinutes) {
                const dayIndex = selectedDates.find(d => d.date === date)!.dayIndex;
                setError(`End time must be after start time for ${daysOfWeek[dayIndex].full} (${date}).`);
                return;
            }
        }

        try {
            for (const { date } of selectedDates) {
                const entry = availability[date];
                if (!entry) continue;

                const startTime24 = convertTo24Hour(entry.start);
                const endTime24 = convertTo24Hour(entry.end);

                await submitAvailability({
                    event: parseInt(eventId),
                    start_time: `${date}T${startTime24}`,
                    end_time: `${date}T${endTime24}`,
                    username: username,
                });
            }

            await loadGroupAvailability();
            alert("Availability submitted successfully!");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setError(`Failed to submit availability: ${errorMessage}`);
        }
    };

    const handleDone = () => {
        router.push("/");
    };

    // The visible month is expressed as an offset (in months) from the
    // event's start month, bounded by how many months the event's window
    // actually spans - this replaces logic that assumed a single
    // hardcoded year (2025) and a "current vs. next month only" limit.
    const minView = minDate ? { year: minDate.getFullYear(), month: minDate.getMonth() } : null;
    const maxView = maxDate ? { year: maxDate.getFullYear(), month: maxDate.getMonth() } : null;
    const totalMonths = minView && maxView ? Math.max(0, monthDiff(minView, maxView)) : 0;
    const currentView = minView ? addMonths(minView.year, minView.month, monthOffset) : null;

    const handlePreviousMonth = () => {
        if (monthOffset > 0) setMonthOffset(prev => prev - 1);
    };

    const handleNextMonth = () => {
        if (monthOffset < totalMonths) setMonthOffset(prev => prev + 1);
    };

    const calendarDays =
        currentView && minDate && maxDate
            ? generateCalendarDays(currentView.year, currentView.month, minDate, maxDate)
            : [];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    if (loadError) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-950">
                <div className="bg-white/10 rounded-2xl p-8 text-white text-center max-w-md">
                    <p className="mb-4">{loadError}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="gradient-button text-white font-semibold py-2 px-6 rounded-full"
                    >
                        Back to Home
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-950">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-5xl"
            >
                <h1 className="text-4xl font-bold text-center mb-6 text-white tracking-tight">
                    Set Your Availability for <span className="text-indigo-300">{eventName}</span>
                </h1>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                    <h2 className="text-2xl font-semibold text-white mb-6">Select Dates</h2>
                    {currentView && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={handlePreviousMonth}
                                    disabled={monthOffset === 0}
                                    className={`text-white p-2 rounded-full hover:bg-white/20 transition-all ${
                                        monthOffset === 0 ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h3 className="text-xl font-medium text-white">
                                    {monthNames[currentView.month]} {currentView.year}
                                </h3>
                                <button
                                    onClick={handleNextMonth}
                                    disabled={monthOffset === totalMonths}
                                    className={`text-white p-2 rounded-full hover:bg-white/20 transition-all ${
                                        monthOffset === totalMonths ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {daysOfWeek.map(day => (
                                    <div key={day.key} className="text-center text-sm font-medium text-gray-300">
                                        {day.key}
                                    </div>
                                ))}
                                {calendarDays.map(({ date, isInRange, isPast }, index) => {
                                    const dateString = formatDateLocal(date);
                                    const dayIndex = date.getDay();
                                    const dayKey = daysOfWeek[dayIndex].key;
                                    const isSelectable = isInRange && selectedDays.includes(dayKey) && !isPast;
                                    const isSelected = selectedDates.some(item => item.date === dateString);
                                    const isCurrentMonth = date.getMonth() === currentView.month;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => isSelectable && toggleDateSelection(date)}
                                            disabled={!isSelectable}
                                            className={`p-2 text-center rounded-lg transition-all duration-200 ${
                                                isCurrentMonth
                                                    ? isSelectable
                                                        ? isSelected
                                                            ? "bg-indigo-500 text-white shadow-lg"
                                                            : "bg-white/10 text-white hover:bg-indigo-400 hover:text-white"
                                                        : "bg-white/5 text-gray-500 cursor-not-allowed"
                                                    : "bg-transparent text-gray-600"
                                            }`}
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {selectedDates.length > 0 && (
                        <>
                            <h2 className="text-2xl font-semibold text-white mb-6">Set Times</h2>
                            {error && (
                                <p className="text-red-400 text-center mb-4">{error}</p>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                                {selectedDates.map(({ date, dayIndex }) => {
                                    const entry = availability[date] || { start: "7:00 AM", end: "8:00 AM" };
                                    return (
                                        <div key={date} className="flex items-center gap-4 bg-white/5 p-4 rounded-lg">
                                            <div className="w-32 text-white font-medium">
                                                {daysOfWeek[dayIndex].full} ({date})
                                            </div>
                                            <select
                                                value={entry.start}
                                                onChange={(e) => updateAvailability(date, "start", e.target.value)}
                                                className="bg-indigo-800 border border-indigo-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                                            >
                                                {Array.from({ length: 17 }, (_, i) => {
                                                    const hour = i + 7;
                                                    const time = `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`;
                                                    return (
                                                        <option
                                                            key={time}
                                                            value={time}
                                                            className="bg-indigo-800 text-white"
                                                        >
                                                            {time}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <span className="text-white font-bold">-</span>
                                            <select
                                                value={entry.end}
                                                onChange={(e) => updateAvailability(date, "end", e.target.value)}
                                                className="bg-indigo-800 border border-indigo-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                                            >
                                                {Array.from({ length: 17 }, (_, i) => {
                                                    const hour = i + 7;
                                                    const time = `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`;
                                                    return (
                                                        <option
                                                            key={time}
                                                            value={time}
                                                            className="bg-indigo-800 text-white"
                                                        >
                                                            {time}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    );
                                })}
                                <div className="flex gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 px-8 rounded-lg text-lg w-full shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
                                    >
                                        Submit Availability
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={handleDone}
                                        className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-8 rounded-lg text-lg w-full shadow-lg hover:from-gray-600 hover:to-gray-700 transition-all"
                                    >
                                        Done
                                    </motion.button>
                                </div>
                            </form>
                        </>
                    )}

                    <h2 className="text-2xl font-semibold text-white mb-6">Group Availability</h2>
                    <div className="space-y-4">
                        {groupAvailability.length === 0 && (
                            <p className="text-white/60">No availability submitted yet.</p>
                        )}
                        {groupAvailability.map(({ date, slots }) => (
                            <div key={date} className="flex flex-col gap-2 bg-white/5 p-4 rounded-lg">
                                <div className="text-white font-medium">{date}</div>
                                <div className="ml-4 flex flex-wrap gap-2">
                                    {slots.map(({ start, end, count }, index) => (
                                        <span
                                            key={index}
                                            className={`px-4 py-1 rounded-full text-white text-sm font-medium ${
                                                count >= 3 ? "bg-red-500" :
                                                count === 2 ? "bg-orange-500" :
                                                count === 1 ? "bg-yellow-500" :
                                                "bg-indigo-600"
                                            }`}
                                        >
                                            {start}-{end} ({count} user{count !== 1 ? "s" : ""})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
