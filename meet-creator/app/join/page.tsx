// app/join/page.tsx
"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function JoinEvent() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // In a real app, you would validate against a database
    // For demo purposes, we'll check if there's an event in localStorage
    const eventData = localStorage.getItem("eventData");

    if (eventData) {
      const parsedData = JSON.parse(eventData);

      // Simple validation - in a real app this would be more secure
      if (passcode === parsedData.passcode) {
        // Store the joining user
        localStorage.setItem("joiningUser", username);

        // Navigate to the availability page
        router.push("/availability");
      } else {
        setError("Invalid passcode. Please try again.");
      }
    } else {
      setError(
        "No event found. Please check the passcode or create a new event."
      );
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
            Please enter username and
            <br />
            the passcode to Join
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
                className="gradient-button text-white font-semibold py-3 px-12 rounded-full text-lg w-full"
              >
                Join
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
