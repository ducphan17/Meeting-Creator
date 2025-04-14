// app/join/page.tsx

"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function JoinEvent() {
  const router = useRouter();
  const [eventCode, setEventCode] = useState("");
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // In a real app, we would validate this data with a backend
    // For this frontend-only demo, we'll just redirect to the schedule page
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "joinedEvent",
        JSON.stringify({
          eventCode,
          username,
          passcode,
        })
      );

      router.push("/schedule");
    }
  };

  return (
    <main className="min-h-screen bg-[#2D2A40] text-white">
      <nav className="p-4 flex justify-between items-center border-b border-gray-800">
        <div className="text-lg font-medium">Join Event</div>
      </nav>

      <div className="flex justify-center items-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold mb-8 text-center">Join Event</h1>

          <div className="bg-[#3D3A50] rounded-3xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="text"
                placeholder="Event Code"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                required
                className="bg-transparent border-gray-600 rounded-full"
              />

              <Input
                type="text"
                placeholder="Your Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-transparent border-gray-600 rounded-full"
              />

              <Input
                type="password"
                placeholder="Event Passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
                className="bg-transparent border-gray-600 rounded-full"
              />

              <Button
                type="submit"
                className="w-full px-6 py-4 text-lg rounded-full bg-gradient-to-r from-purple-600 to-blue-400 hover:from-purple-700 hover:to-blue-500"
              >
                Join
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
