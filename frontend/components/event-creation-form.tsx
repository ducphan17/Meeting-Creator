"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TimePicker } from "./time-picker";

const daysOfWeek = [
  { label: "S", value: "sunday" },
  { label: "M", value: "monday" },
  { label: "T", value: "tuesday" },
  { label: "W", value: "wednesday" },
  { label: "T", value: "thursday" },
  { label: "F", value: "friday" },
  { label: "S", value: "saturday" },
];

export default function EventCreationForm() {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("07:00 AM");
  const [endTime, setEndTime] = useState("10:00 PM");
  const [eventName, setEventName] = useState("");
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      eventName,
      username,
      passcode,
      selectedDays,
      timeBlock: { startTime, endTime },
    });
    // Here you would typically send this data to your backend
  };

  return (
    <div className="w-full max-w-4xl p-8">
      <h1 className="text-4xl font-bold text-center text-white mb-8">
        Create Event
      </h1>

      <div className="bg-purple-900/50 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Input
                type="text"
                placeholder="Event Name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="bg-purple-800/50 border-purple-700 text-white placeholder:text-purple-300 h-12 rounded-full"
              />
            </div>

            <div>
              <Input
                type="text"
                placeholder="Enter Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-purple-800/50 border-purple-700 text-white placeholder:text-purple-300 h-12 rounded-full"
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Enter Passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="bg-purple-800/50 border-purple-700 text-white placeholder:text-purple-300 h-12 rounded-full"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium transition-all",
                    selectedDays.includes(day.value)
                      ? "bg-gradient-to-r from-purple-600 to-blue-400"
                      : "bg-purple-800/50 hover:bg-purple-700/50"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="text-white text-lg mb-4">
                Time Block Availability
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-white">From:</div>
                <TimePicker value={startTime} onChange={setStartTime} />

                <div className="text-white">To:</div>
                <TimePicker value={endTime} onChange={setEndTime} />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 mt-8 flex justify-center">
            <Button
              type="submit"
              className="w-full max-w-md h-16 rounded-full text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-400 hover:from-purple-700 hover:to-blue-500 transition-all"
            >
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
