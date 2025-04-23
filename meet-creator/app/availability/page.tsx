"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Plus } from "lucide-react";

type TimeBlock = {
  start: string;
  end: string;
};

type DayAvailability = {
  day: string;
  blocks: TimeBlock[];
};

// Mock data for group availability
const mockGroupAvailability: DayAvailability[] = [
  {
    day: "Sun",
    blocks: [
      { start: "12:30PM", end: "4:00PM" },
      { start: "7:00PM", end: "10:30PM" },
    ],
  },
  {
    day: "Thu",
    blocks: [
      { start: "12:30PM", end: "4:00PM" },
      { start: "7:00PM", end: "10:30PM" },
    ],
  },
  {
    day: "Fri",
    blocks: [
      { start: "12:30PM", end: "4:00PM" },
      { start: "7:00PM", end: "10:30PM" },
    ],
  },
  {
    day: "Sat",
    blocks: [
      { start: "12:30PM", end: "4:00PM" },
      { start: "7:00PM", end: "10:30PM" },
    ],
  },
];

// Mock data for user's availability
const initialUserAvailability: DayAvailability[] = [
  {
    day: "Sun",
    blocks: [
      { start: "12:30PM", end: "4:00PM" },
      { start: "5:30PM", end: "9:00PM" },
    ],
  },
  {
    day: "Thu",
    blocks: [
      { start: "12:30PM", end: "4:00PM" },
      { start: "5:30PM", end: "9:00PM" },
    ],
  },
  {
    day: "Fri",
    blocks: [
      { start: "12:30PM", end: "4:00PM" },
      { start: "5:30PM", end: "9:00PM" },
    ],
  },
  {
    day: "Sat",
    blocks: [
      { start: "12:30PM", end: "4:00PM" },
      { start: "5:30PM", end: "9:00PM" },
    ],
  },
];

// Time options for the dropdown
const timeOptions = [
  "7:00AM",
  "8:00AM",
  "9:00AM",
  "10:00AM",
  "11:00AM",
  "12:00PM",
  "1:00PM",
  "2:00PM",
  "3:00PM",
  "4:00PM",
  "5:00PM",
  "6:00PM",
  "7:00PM",
  "8:00PM",
  "9:00PM",
  "10:00PM",
  "11:00PM",
];

// Function to determine availability level (for color coding)
const getAvailabilityLevel = (day: string, block: TimeBlock): string => {
  // In a real app, this would calculate based on how many people are available
  // For demo purposes, we'll use a simple pattern
  if (day === "Sun" && block.start === "12:30PM") return "availability-high";
  if (day === "Thu" && block.start === "7:00PM") return "availability-medium";
  if (day === "Fri" && block.start === "12:30PM") return "availability-low";
  return "availability-none";
};

export default function Availability() {
  const [userAvailability, setUserAvailability] = useState<DayAvailability[]>(
    initialUserAvailability
  );
  const [eventData, setEventData] = useState<any>(null);
  const [showAddBlock, setShowAddBlock] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("10:00AM");
  const [endTime, setEndTime] = useState("5:00PM");

  useEffect(() => {
    // In a real app, you would fetch this data from an API
    // For demo purposes, we'll use localStorage
    const storedEventData = localStorage.getItem("eventData");
    if (storedEventData) {
      setEventData(JSON.parse(storedEventData));
    }
  }, []);

  const addTimeBlock = (day: string) => {
    const newBlock = { start: startTime, end: endTime };
    setUserAvailability((prev) =>
      prev.map((dayData) =>
        dayData.day === day
          ? { ...dayData, blocks: [...dayData.blocks, newBlock] }
          : dayData
      )
    );
    setShowAddBlock(null); // Hide the form after adding
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-900 to-purple-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-purple-900/50 rounded-3xl p-8 shadow-xl">
          <div className="flex flex-col gap-8">
            {/* User's Availability */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">
                Your Availability
              </h2>

              <div className="space-y-4">
                {userAvailability.map((dayData, dayIndex) => (
                  <div key={dayIndex}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="day-button active w-10 h-10">
                        {dayData.day.charAt(0)}
                      </div>

                      <div className="flex-1 flex flex-wrap gap-2">
                        {dayData.blocks.map((block, blockIndex) => (
                          <div
                            key={blockIndex}
                            className="availability-block availability-none"
                          >
                            {block.start}-{block.end}
                          </div>
                        ))}

                        <button
                          onClick={() => setShowAddBlock(dayData.day)}
                          className="p-1 rounded-full bg-purple-700/50 hover:bg-purple-700/80 transition-colors"
                          title="Add time block"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Add time block form */}
                    {showAddBlock === dayData.day && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="ml-12 mb-4 p-3 bg-purple-800/50 rounded-lg"
                      >
                        <div className="flex flex-wrap gap-4 items-center">
                          <div>
                            <label className="text-white/80 text-xs block mb-1">
                              From:
                            </label>
                            <select
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="bg-transparent border border-purple-700/50 rounded-full px-3 py-1 text-white text-sm"
                            >
                              {timeOptions.map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-white/80 text-xs block mb-1">
                              To:
                            </label>
                            <select
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="bg-transparent border border-purple-700/50 rounded-full px-3 py-1 text-white text-sm"
                            >
                              {timeOptions.map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => addTimeBlock(dayData.day)}
                              className="gradient-button text-white text-sm font-medium py-1 px-4 rounded-full"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => setShowAddBlock(null)}
                              className="bg-transparent border border-purple-700/50 text-white text-sm font-medium py-1 px-4 rounded-full"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Horizontal Divider */}
            <div className="w-full h-px bg-purple-700/30"></div>

            {/* Group's Availability */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">
                Group's Availability
              </h2>

              <div className="space-y-4">
                {mockGroupAvailability.map((dayData, dayIndex) => (
                  <div key={dayIndex} className="flex items-center gap-3">
                    <ChevronRight className="text-white w-5 h-5" />

                    <div className="w-10">
                      <span className="text-white font-medium">
                        {dayData.day}:
                      </span>
                    </div>

                    <div className="flex-1 flex flex-wrap gap-2">
                      {dayData.blocks.map((block, blockIndex) => (
                        <div
                          key={blockIndex}
                          className={`availability-block ${getAvailabilityLevel(
                            dayData.day,
                            block
                          )}`}
                        >
                          {block.start}-{block.end}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
