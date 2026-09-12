"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { daysOfWeek, convertTo24Hour, formatDateLocal } from "../lib/time";
import { createEvent } from "../lib/api";
import { saveEventSession } from "../lib/eventSession";

// How many days out the availability window defaults to when creating an
// event. There's no date-range picker in this UI (yet), so this replaces
// what used to be a hardcoded "April 27 - June 30, 2025" window baked into
// availability/page.tsx - a window that was already in the past for
// anyone using the app after mid-2025.
const DEFAULT_WINDOW_DAYS = 56; // 8 weeks

export default function CreateEvent() {
    const router = useRouter();
    const [eventName, setEventName] = useState("");
    const [username, setUsername] = useState("");
    const [passcode, setPasscode] = useState("");
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 4, 5, 6]); // Default to Su, Th, F, Sa
    const [fromTime, setFromTime] = useState("7:00 AM");
    const [toTime, setToTime] = useState("10:00 PM");
    const [submitting, setSubmitting] = useState(false);

    // Set once the event is created, so we can show the creator their
    // Event ID / join link before sending them on to set their own
    // availability. Previously the app redirected immediately, and the
    // creator had no way to find out the Event ID needed to invite anyone.
    const [createdEvent, setCreatedEvent] = useState<{
        id: number;
        joinUrl: string;
    } | null>(null);

    const handleDayToggle = (index: number) => {
        if (selectedDays.includes(index)) {
            setSelectedDays(selectedDays.filter((day) => day !== index));
        } else {
            setSelectedDays([...selectedDays, index]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + DEFAULT_WINDOW_DAYS);

        const startDateStr = formatDateLocal(today);
        const endDateStr = formatDateLocal(endDate);
        const selectedDayKeys = selectedDays.map((index) => daysOfWeek[index].key);

        try {
            const result = await createEvent({
                title: eventName,
                passcode,
                username,
                selected_days: selectedDayKeys,
                start_date: startDateStr,
                end_date: endDateStr,
                from_time: convertTo24Hour(fromTime),
                to_time: convertTo24Hour(toTime),
            });

            saveEventSession({
                eventId: String(result.id),
                eventName,
                username,
                selectedDays: selectedDayKeys,
                startDate: startDateStr,
                endDate: endDateStr,
                fromTime,
                toTime,
            });

            const joinUrl = `${window.location.origin}/join?eventId=${result.id}`;
            setCreatedEvent({ id: result.id, joinUrl });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Error creating event:", errorMessage);
            alert("Failed to create event. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopyLink = async () => {
        if (!createdEvent) return;
        try {
            await navigator.clipboard.writeText(createdEvent.joinUrl);
            alert("Join link copied to clipboard!");
        } catch {
            // Clipboard API can be unavailable (e.g. insecure context) -
            // the link is still shown on screen for manual copying.
        }
    };

    if (createdEvent) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-900 to-purple-950">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-lg"
                >
                    <h1 className="text-3xl font-bold text-center mb-8 text-white">
                        Event Created!
                    </h1>
                    <div className="bg-purple-900/50 rounded-3xl p-8 shadow-xl text-center space-y-6">
                        <p className="text-white/80">
                            Share this Event ID and the passcode with anyone you want to
                            invite. They&apos;ll need both to join.
                        </p>
                        <div className="bg-purple-800/60 rounded-2xl py-4">
                            <div className="text-sm text-purple-200 uppercase tracking-wide">
                                Event ID
                            </div>
                            <div className="text-4xl font-bold text-white">
                                {createdEvent.id}
                            </div>
                        </div>
                        <div className="text-left">
                            <label className="text-white/80 text-sm mb-1 block">
                                Join link
                            </label>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={createdEvent.joinUrl}
                                    className="flex-1 bg-transparent border border-purple-700/50 rounded-full px-4 py-2 text-white text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleCopyLink}
                                    className="gradient-button text-white font-semibold px-5 rounded-full text-sm"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push("/availability")}
                            className="gradient-button text-white font-semibold py-3 px-12 rounded-full text-lg w-full"
                        >
                            Continue to Set My Availability
                        </motion.button>
                    </div>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-900 to-purple-950">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-3xl"
            >
                <h1 className="text-3xl font-bold text-center mb-8 text-white">
                    Create Event
                </h1>

                <div className="bg-purple-900/50 rounded-3xl p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Event Name"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    required
                                    className="w-full bg-transparent border border-purple-700/50 rounded-full px-4 py-3 text-white placeholder-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <input
                                    type="text"
                                    placeholder="Enter Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full bg-transparent border border-purple-700/50 rounded-full px-4 py-3 text-white placeholder-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <input
                                    type="password"
                                    placeholder="Enter Passcode"
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    required
                                    className="w-full bg-transparent border border-purple-700/50 rounded-full px-4 py-3 text-white placeholder-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-center gap-2">
                                {daysOfWeek.map((day, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleDayToggle(index)}
                                        className={`day-button ${
                                            selectedDays.includes(index) ? "active" : "inactive"
                                        }`}
                                        title={day.full}
                                    >
                                        {day.key}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6">
                                <h3 className="text-white mb-4">Time Block Availability</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-white/80 text-sm mb-1 block">
                                            From:
                                        </label>
                                        <select
                                            value={fromTime}
                                            onChange={(e) => setFromTime(e.target.value)}
                                            className="bg-transparent border border-purple-700/50 rounded-full px-3 py-2 text-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            {Array.from({ length: 17 }, (_, i) => {
                                                const hour = i + 7;
                                                const time = `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`;
                                                return (
                                                    <option
                                                        key={time}
                                                        value={time}
                                                        className="bg-purple-800 text-white"
                                                    >
                                                        {time}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-white/80 text-sm mb-1 block">
                                            To:
                                        </label>
                                        <select
                                            value={toTime}
                                            onChange={(e) => setToTime(e.target.value)}
                                            className="bg-transparent border border-purple-700/50 rounded-full px-3 py-2 text-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            {Array.from({ length: 17 }, (_, i) => {
                                                const hour = i + 7;
                                                const time = `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`;
                                                return (
                                                    <option
                                                        key={time}
                                                        value={time}
                                                        className="bg-purple-800 text-white"
                                                    >
                                                        {time}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 mt-4 flex justify-center">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                type="submit"
                                disabled={submitting}
                                className="gradient-button text-white font-semibold py-3 px-12 rounded-full text-lg w-full max-w-md disabled:opacity-60"
                            >
                                {submitting ? "Creating..." : "Create"}
                            </motion.button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </main>
    );
}
