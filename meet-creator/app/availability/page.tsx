"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Define the days of the week
const daysOfWeek = [
    { key: "Su", full: "Sunday", index: 0 },
    { key: "M", full: "Monday", index: 1 },
    { key: "T", full: "Tuesday", index: 2 },
    { key: "W", full: "Wednesday", index: 3 },
    { key: "Th", full: "Thursday", index: 4 },
    { key: "F", full: "Friday", index: 5 },
    { key: "Sa", full: "Saturday", index: 6 },
];

// Type for group availability slots
type GroupAvailabilitySlot = [string, number];

// Utility function to convert 12-hour time to minutes for comparison
const convertToMinutes = (time: string) => {
    const [hourMinute, period] = time.split(" ");
    let [hour, minute] = hourMinute.split(":").map(Number);
    if (period === "PM" && hour !== 12) {
        hour += 12;
    } else if (period === "AM" && hour === 12) {
        hour = 0;
    }
    return hour * 60 + minute;
};

// Utility function to convert 12-hour time to 24-hour format
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

// Utility function to format 24-hour time to 12-hour format
const formatTo12Hour = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
};

// Utility function to normalize a date to midnight in local timezone
const normalizeDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

// Generate calendar days for a given month and year
const generateCalendarDays = (year: number, month: number) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const today = normalizeDate(new Date()); // Normalize today's date to midnight
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
        const minDate = new Date(2025, 3, 27); // April 27, 2025
        const maxDate = new Date(2025, 5, 30); // June 30, 2025
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

export default function Availability() {
    const router = useRouter();
    const [eventId, setEventId] = useState("");
    const [eventName, setEventName] = useState("");
    const [username, setUsername] = useState("");
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [selectedDates, setSelectedDates] = useState<{ date: string; dayIndex: number }[]>([]);
    const [availability, setAvailability] = useState<{ [date: string]: { start: string; end: string } }>({});
    const [groupAvailability, setGroupAvailability] = useState<{ date: string; slots: GroupAvailabilitySlot[] }[]>([]);
    const [error, setError] = useState("");

    // Determine the current month dynamically based on today's date
    const today = new Date(); // Current date: May 1, 2025
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth(); // 0-based month (May is 4)
    const [currentMonth, setCurrentMonth] = useState(currentMonthIndex); // Start with current month (May 2025)

    // Define the months to display: current month and next month
    const monthsToDisplay = [currentMonthIndex, currentMonthIndex + 1].filter(month => month <= 5); // Filter to not exceed June (month 5)

    // Load event details from localStorage
    useEffect(() => {
        const storedEventData = localStorage.getItem("eventData");
        if (storedEventData) {
            const eventData = JSON.parse(storedEventData);
            setEventId(eventData.eventId);
            setEventName(eventData.eventName);
            setUsername(eventData.username || "");
            setSelectedDays(eventData.selectedDays || []);
        } else {
            router.push("/create");
        }
    }, [router]);

    // Fetch group availability
    useEffect(() => {
        if (eventId) {
            const fetchGroupAvailability = async () => {
                try {
                    const response = await fetch(`http://18.188.250.248:8000/events/${eventId}/overlap/`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch group availability: ${response.statusText}`);
                    }
                    const data = await response.json();
                    const grouped: { date: string; slots: GroupAvailabilitySlot[] }[] = [];
                    const dateMap: { [date: string]: GroupAvailabilitySlot[] } = {};
                    data.overlap.forEach(([slot, count]: GroupAvailabilitySlot) => {
                        const [dateTime, _] = slot.split("-");
                        const date = dateTime.split(" ")[0];
                        if (!dateMap[date]) {
                            dateMap[date] = [];
                        }
                        dateMap[date].push([slot, count]);
                    });
                    Object.keys(dateMap).forEach(date => {
                        grouped.push({ date, slots: dateMap[date] });
                    });
                    grouped.sort((a, b) => a.date.localeCompare(b.date));
                    setGroupAvailability(grouped);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error("Error fetching group availability:", errorMessage);
                    alert(`Error fetching group availability: ${errorMessage}`);
                }
            };
            fetchGroupAvailability();
        }
    }, [eventId]);

    const toggleDateSelection = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dateString = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        const dayIndex = date.getDay();

        const dayKey = daysOfWeek[dayIndex].key;
        if (!selectedDays.includes(dayKey)) return;

        setSelectedDates(prev => {
            const existingDate = prev.find(item => item.date === dateString);
            if (existingDate) {
                return prev.filter(item => item.date !== dateString);
            }
            const newDates = [...prev, { date: dateString, dayIndex }];
            console.log(`Toggled Date: ${dateString}, Day Index: ${dayIndex}, Day: ${daysOfWeek[dayIndex].full}, Selected Dates: ${JSON.stringify(newDates)}`);
            return newDates;
        });

        setAvailability(prev => {
            if (prev[dateString]) {
                const { [dateString]: _, ...rest } = prev;
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

                const availabilityData = {
                    event: parseInt(eventId),
                    start_time: `${date}T${startTime24}`,
                    end_time: `${date}T${endTime24}`,
                    username: username,
                };

                console.log("Submitting availability:", availabilityData);

                const response = await fetch("http://18.188.250.248:8000/availabilities/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(availabilityData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status} - ${response.statusText}`);
                }
            }

            const fetchGroupAvailability = async () => {
                try {
                    const response = await fetch(`http://18.188.250.248:8000/events/${eventId}/overlap/`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch group availability: ${response.statusText}`);
                    }
                    const data = await response.json();
                    const grouped: { date: string; slots: GroupAvailabilitySlot[] }[] = [];
                    const dateMap: { [date: string]: GroupAvailabilitySlot[] } = {};
                    data.overlap.forEach(([slot, count]: GroupAvailabilitySlot) => {
                        const [dateTime, _] = slot.split("-");
                        const date = dateTime.split(" ")[0];
                        if (!dateMap[date]) {
                            dateMap[date] = [];
                        }
                        dateMap[date].push([slot, count]);
                    });
                    Object.keys(dateMap).forEach(date => {
                        grouped.push({ date, slots: dateMap[date] });
                    });
                    grouped.sort((a, b) => a.date.localeCompare(b.date));
                    setGroupAvailability(grouped);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error("Error fetching group availability:", errorMessage);
                    alert(`Error fetching group availability: ${errorMessage}`);
                }
            };
            fetchGroupAvailability();

            alert("Availability submitted successfully!");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setError(`Failed to submit availability: ${errorMessage}`);
        }
    };

    const handleDone = () => {
        router.push("/");
    };

    const handlePreviousMonth = () => {
        if (currentMonth > currentMonthIndex) { // Don't go before the current month
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth < currentMonthIndex + 1) { // Only allow up to the next month
            setCurrentMonth(prev => prev + 1);
        }
    };

    const calendarDays = generateCalendarDays(2025, currentMonth);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handlePreviousMonth}
                                disabled={currentMonth === currentMonthIndex}
                                className={`text-white p-2 rounded-full hover:bg-white/20 transition-all ${
                                    currentMonth === currentMonthIndex ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h3 className="text-xl font-medium text-white">
                                {monthNames[currentMonth]} 2025
                            </h3>
                            <button
                                onClick={handleNextMonth}
                                disabled={currentMonth === currentMonthIndex + 1}
                                className={`text-white p-2 rounded-full hover:bg-white/20 transition-all ${
                                    currentMonth === currentMonthIndex + 1 ? "opacity-50 cursor-not-allowed" : ""
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
                                const year = date.getFullYear();
                                const month = date.getMonth() + 1;
                                const day = date.getDate();
                                const dateString = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                                const dayIndex = date.getDay();
                                const dayKey = daysOfWeek[dayIndex].key;
                                const isSelectable = isInRange && selectedDays.includes(dayKey) && !isPast;
                                const isSelected = selectedDates.some(item => item.date === dateString);
                                const isCurrentMonth = date.getMonth() === currentMonth;

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
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

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
                        {groupAvailability.map(({ date, slots }) => (
                            <div key={date} className="flex flex-col gap-2 bg-white/5 p-4 rounded-lg">
                                <div className="text-white font-medium">{date}</div>
                                <div className="ml-4 flex flex-wrap gap-2">
                                    {slots.map(([slot, count], index) => (
                                        <span
                                            key={index}
                                            className={`px-4 py-1 rounded-full text-white text-sm font-medium ${
                                                count >= 3 ? "bg-red-500" :
                                                count === 2 ? "bg-orange-500" :
                                                count === 1 ? "bg-yellow-500" :
                                                "bg-indigo-600"
                                            }`}
                                        >
                                            {slot.split(" ")[1]}-{slot.split("-")[1]} ({count} user{count !== 1 ? "s" : ""})
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