// app/create/page.tsx
"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const daysOfWeek = [
  { key: "S", full: "Sunday" },
  { key: "M", full: "Monday" },
  { key: "T", full: "Tuesday" },
  { key: "W", full: "Wednesday" },
  { key: "T", full: "Thursday" },
  { key: "F", full: "Friday" },
  { key: "S", full: "Saturday" },
];

export default function CreateEvent() {
  const router = useRouter();
  const [eventName, setEventName] = useState("");
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 4, 5, 6]); // Default to S, T, F, S as in the screenshot
  const [fromTime, setFromTime] = useState("7:00 AM");
  const [toTime, setToTime] = useState("10:00 PM");

  const handleDayToggle = (index: number) => {
    if (selectedDays.includes(index)) {
      setSelectedDays(selectedDays.filter((day) => day !== index));
    } else {
      setSelectedDays([...selectedDays, index]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // In a real app, you would save this data to a database or state management
    const eventData = {
      eventName,
      username,
      passcode,
      selectedDays,
      fromTime,
      toTime,
    };

    // For demo purposes, we'll just store in localStorage
    localStorage.setItem("eventData", JSON.stringify(eventData));

    // Navigate to the availability page
    router.push("/availability");
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
                      <option value="7:00 AM">7:00 AM</option>
                      <option value="8:00 AM">8:00 AM</option>
                      <option value="9:00 AM">9:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="1:00 PM">1:00 PM</option>
                      <option value="2:00 PM">2:00 PM</option>
                      <option value="3:00 PM">3:00 PM</option>
                      <option value="4:00 PM">4:00 PM</option>
                      <option value="5:00 PM">5:00 PM</option>
                      <option value="6:00 PM">6:00 PM</option>
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
                      <option value="5:00 PM">5:00 PM</option>
                      <option value="6:00 PM">6:00 PM</option>
                      <option value="7:00 PM">7:00 PM</option>
                      <option value="8:00 PM">8:00 PM</option>
                      <option value="9:00 PM">9:00 PM</option>
                      <option value="10:00 PM">10:00 PM</option>
                      <option value="11:00 PM">11:00 PM</option>
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
