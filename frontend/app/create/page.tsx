// app/create/page.tsx
"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DaySelector } from "@/components/day-selector";
import { TimeSelector } from "@/components/time-selector";

export default function CreateEvent() {
  const router = useRouter();
  const [eventName, setEventName] = useState("");
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [fromTime, setFromTime] = useState("7:00 AM");
  const [toTime, setToTime] = useState("10:00 PM");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // In a real app, we would send this data to a backend
    // For this frontend-only demo, we'll store in localStorage
    const eventData = {
      eventName,
      username,
      passcode,
      selectedDays,
      fromTime,
      toTime,
      createdAt: new Date().toISOString(),
    };

    // Only access localStorage on the client
    if (typeof window !== "undefined") {
      localStorage.setItem("eventData", JSON.stringify(eventData));
      router.push("/schedule");
    }
  };

  return (
    <main className="min-h-screen bg-[#2D2A40] text-white">
      <nav className="p-4 flex justify-between items-center border-b border-gray-800">
        <div className="text-lg font-medium">Create Event</div>
      </nav>

      <div className="flex justify-center items-center p-8">
        <div className="w-full max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-center">Create Event</h1>

          <div className="bg-[#3D3A50] rounded-3xl p-8">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col md:flex-row gap-8"
            >
              <div className="flex-1 space-y-6">
                <Input
                  type="text"
                  placeholder="Event Name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  className="bg-transparent border-gray-600 rounded-full"
                />

                <Input
                  type="text"
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-transparent border-gray-600 rounded-full"
                />

                <Input
                  type="password"
                  placeholder="Enter Passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  required
                  className="bg-transparent border-gray-600 rounded-full"
                />
              </div>

              <div className="flex-1 space-y-6">
                <DaySelector
                  selectedDays={selectedDays}
                  setSelectedDays={setSelectedDays}
                />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    Time Block Availability
                  </h3>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm mb-1">From:</p>
                      <TimeSelector value={fromTime} onChange={setFromTime} />
                    </div>
                    <div>
                      <p className="text-sm mb-1">To:</p>
                      <TimeSelector value={toTime} onChange={setToTime} />
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleSubmit}
                className="px-12 py-6 text-lg rounded-full w-full max-w-md bg-gradient-to-r from-purple-600 to-blue-400 hover:from-purple-700 hover:to-blue-500"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
