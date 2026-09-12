// app/join/page.tsx
"use client";

import type React from "react";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { fetchEvent, joinEvent } from "../lib/api";
import { saveEventSession } from "../lib/eventSession";

function JoinEventForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // A join link created on the "event created" screen looks like
    // /join?eventId=123, so pre-fill it when present.
    const [eventId, setEventId] = useState(searchParams.get("eventId") ?? "");
    const [username, setUsername] = useState("");
    const [passcode, setPasscode] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            // Previously this page never talked to the backend at all - it
            // only checked localStorage for an "eventData" key that would
            // only exist if the person joining happened to be using the
            // *same browser* the event was created in. Anyone joining from
            // a different device or browser always hit "No event found",
            // no matter how correct their Event ID and passcode were.
            await joinEvent(eventId, username, passcode);
            const event = await fetchEvent(eventId);

            saveEventSession({
                eventId: String(event.id),
                eventName: event.title,
                username,
                selectedDays: event.selected_days ?? [],
                startDate: event.start_date ?? "",
                endDate: event.end_date ?? "",
                fromTime: event.from_time ?? "7:00 AM",
                toTime: event.to_time ?? "10:00 PM",
            });

            router.push("/availability");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || "Could not join that event. Check the Event ID and passcode.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-900 to-purple-950">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <h1 className="text-3xl font-bold text-center mb-8 text-white">
                    Join an Event
                </h1>

                <div className="bg-purple-900/50 rounded-3xl p-8 shadow-xl">
                    <p className="text-center text-white mb-6">
                        Enter the Event ID, your username, and
                        <br />
                        the passcode to join
                    </p>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg mb-4 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Event ID"
                                value={eventId}
                                onChange={(e) => setEventId(e.target.value)}
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

                        <div className="mt-8">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                type="submit"
                                disabled={submitting}
                                className="gradient-button text-white font-semibold py-3 px-12 rounded-full text-lg w-full disabled:opacity-60"
                            >
                                {submitting ? "Joining..." : "Join"}
                            </motion.button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </main>
    );
}

export default function JoinEvent() {
    return (
        <Suspense fallback={null}>
            <JoinEventForm />
        </Suspense>
    );
}
