"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import DatePicker, { DatePickerProps } from "react-datepicker";

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
    return hour * 60 + minute; // Convert to minutes for comparison
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

// Custom styles for react-datepicker
const calendarStyles = `
    .react-datepicker {
        font-family: Arial, sans-serif;
        border: 1px solid #ccc;
        border-radius: 8px;
        width: 100%;
        max-width: 600px; /* Increase the overall width */
        background-color: #fff;
    }
    .react-datepicker__header {
        background-color: #f0f0f0;
        border-bottom: 1px solid #ccc;
        padding: 15px 0; /* Increase header padding */
        font-size: 1.2rem; /* Increase header font size */
    }
    .react-datepicker__navigation {
        top: 15px; /* Adjust navigation button position */
    }
    .react-datepicker__navigation--previous {
        left: 15px;
    }
    .react-datepicker__navigation--next {
        right: 15px;
    }
    .react-datepicker__month {
        margin: 10px; /* Increase margin around the month */
    }
    .react-datepicker__day-name,
    .react-datepicker__day {
        width: 3rem; /* Increase the size of day cells */
        height: 3rem;
        line-height: 3rem;
        font-size: 1.2rem; /* Increase font size of days */
        margin: 0.2rem; /* Adjust spacing between days */
    }
    .react-datepicker__day--selected,
    .react-datepicker__day--keyboard-selected {
        background-color: #007bff; /* Highlight color for selected days */
        color: white;
        border-radius: 50%;
    }
    .react-datepicker__day--disabled {
        color: #ccc;
        cursor: not-allowed;
    }
`;

export default function Availability() {
    const router = useRouter();
    const [eventId, setEventId] = useState("");
    const [eventName, setEventName] = useState("");
    const [username, setUsername] = useState("");
    const [selectedDays, setSelectedDays] = useState<string[]>([]); // e.g., ["Su", "M", "T"]
    const [selectedDates, setSelectedDates] = useState<{ date: string; dayIndex: number }[]>([]); // e.g., [{ date: "2025-05-17", dayIndex: 6 }]
    const [availability, setAvailability] = useState<{ [date: string]: { start: string; end: string } }>({});
    const [groupAvailability, setGroupAvailability] = useState<{ date: string; slots: GroupAvailabilitySlot[] }[]>([]);
    const [error, setError] = useState(""); // Add error state for validation messages

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
        // Convert date to UTC string to ensure consistency
        const dateString = date.toISOString().split("T")[0];
        const dayIndex = date.getUTCDay(); // Use UTC day to match dateString

        const dayKey = daysOfWeek[dayIndex].key;
        if (!selectedDays.includes(dayKey)) return; // Only allow selection for event days

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
        setError(""); // Reset error message

        // Validate time ranges for each selected date
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
            // Submit availability for each selected date
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

            // Refresh group availability
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
            // Stay on the page to see updated group availability
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setError(`Failed to submit availability: ${errorMessage}`);
        }
    };

    const handleDone = () => {
        router.push("/");
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-900 to-purple-950">
            <style>{calendarStyles}</style>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-4xl"
            >
                <h1 className="text-3xl font-bold text-center mb-4 text-white">
                    Set Your Availability for {eventName}
                </h1>
                <div className="bg-purple-900/50 rounded-3xl p-8 shadow-xl">
                    <h2 className="text-xl font-semibold text-white mb-4">Select Dates</h2>
                    <DatePicker
                        inline
                        selected={null}
                        onChange={(date: Date) => toggleDateSelection(date)}
                        highlightDates={selectedDates.map(item => {
                            const [year, month, day] = item.date.split("-").map(Number);
                            return new Date(Date.UTC(year, month - 1, day));
                        })}
                        filterDate={(date: Date) => {
                            const dayIndex = date.getUTCDay(); // Use UTC day to match dateString
                            const dayKey = daysOfWeek[dayIndex].key;
                            return selectedDays.includes(dayKey);
                        }}
                        minDate={new Date(2025, 3, 27)} // April 27, 2025
                        maxDate={new Date(2025, 4, 26)} // May 26, 2025
                        className="react-datepicker-custom"
                    />

                    {selectedDates.length > 0 && (
                        <>
                            <h2 className="text-xl font-semibold text-white mb-4">Set Times</h2>
                            {error && (
                                <p className="text-red-400 text-center mb-4">{error}</p>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                                {selectedDates.map(({ date, dayIndex }) => {
                                    const entry = availability[date] || { start: "7:00 AM", end: "8:00 AM" };
                                    console.log(`Set Times - Date: ${date}, Day Index: ${dayIndex}, Day: ${daysOfWeek[dayIndex].full}`);
                                    return (
                                        <div key={date} className="flex items-center gap-4">
                                            <div className="w-20 text-white">
                                                {daysOfWeek[dayIndex].full} ({date})
                                            </div>
                                            <select
                                                value={entry.start}
                                                onChange={(e) => updateAvailability(date, "start", e.target.value)}
                                                className="bg-purple-800 border border-purple-700/50 rounded-full px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                                            <span className="text-white">-</span>
                                            <select
                                                value={entry.end}
                                                onChange={(e) => updateAvailability(date, "end", e.target.value)}
                                                className="bg-purple-800 border border-purple-700/50 rounded-full px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                                    );
                                })}
                                <div className="flex gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        type="submit"
                                        className="gradient-button text-white font-semibold py-3 px-12 rounded-full text-lg w-full"
                                    >
                                        Submit Availability
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        type="button"
                                        onClick={handleDone}
                                        className="gradient-button text-white font-semibold py-3 px-12 rounded-full text-lg w-full"
                                    >
                                        Done
                                    </motion.button>
                                </div>
                            </form>
                        </>
                    )}

                    <h2 className="text-xl font-semibold text-white mb-4">Group Availability</h2>
                    <div className="space-y-2">
                        {groupAvailability.map(({ date, slots }) => (
                            <div key={date} className="flex flex-col gap-2">
                                <div className="text-white">{date}</div>
                                <div className="ml-4 flex flex-wrap gap-2">
                                    {slots.map(([slot, count], index) => (
                                        <span
                                            key={index}
                                            className={`px-3 py-1 rounded-full text-white ${
                                                count >= 3 ? "bg-red-500" :
                                                count === 2 ? "bg-orange-500" :
                                                count === 1 ? "bg-yellow-500" :
                                                "bg-purple-700"
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