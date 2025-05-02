"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const daysOfWeek = [
    { key: "Su", full: "Sunday" },
    { key: "M", full: "Monday" },
    { key: "T", full: "Tuesday" },
    { key: "W", full: "Wednesday" },
    { key: "Th", full: "Thursday" },
    { key: "F", full: "Friday" },
    { key: "Sa", full: "Saturday" },
];

// Utility function to convert 12-hour time to 24-hour format for backend
const convertTo24Hour = (time: string) => {
    const [hourMinute, period] = time.split(" ");
    let [hour, minute] = hourMinute.split(":").map(Number);
    if (period === "PM" && hour !== 12) {
        hour += 12;
    } else if (period === "AM" && hour === 12) {
        hour = 0;
    }
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
};

export default function CreateEvent() {
    const router = useRouter();
    const [eventName, setEventName] = useState("");
    const [username, setUsername] = useState("");
    const [passcode, setPasscode] = useState("");
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 4, 5, 6]); // Default to Su, Th, F, Sa
    const [fromTime, setFromTime] = useState("7:00 AM");
    const [toTime, setToTime] = useState("10:00 PM");

    const handleDayToggle = (index: number) => {
        if (selectedDays.includes(index)) {
            setSelectedDays(selectedDays.filter((day) => day !== index));
        } else {
            setSelectedDays([...selectedDays, index]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prepare the event data to send to the backend
        const eventData = {
            title: eventName,
            passcode: passcode,
            username: username,
            selectedDays: selectedDays.map(index => daysOfWeek[index].key),
            start_time: fromTime,
            end_time: toTime,
        };

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(eventData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Event created:", result);

            localStorage.setItem("eventData", JSON.stringify({
                eventId: result.id,
                eventName,
                username,
                passcode,
                selectedDays: selectedDays.map(index => daysOfWeek[index].key),
                fromTime,
                toTime,
            }));

            router.push("/availability");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Error creating event:", errorMessage);
            alert("Failed to create event. Please try again.");
        }
    };

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
                                className="gradient-button text-white font-semibold py-3 px-12 rounded-full text-lg w-full max-w-md"
                            >
                                Create
                            </motion.button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </main>
    );
}