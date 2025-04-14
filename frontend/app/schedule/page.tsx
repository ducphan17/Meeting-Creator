// app/schedule/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TimeBlock } from "../../components/time-block";
import { ChevronRight, ChevronDown } from "lucide-react";

type Availability = {
  day: string;
  timeBlocks: string[];
};

type GroupAvailability = {
  [key: string]: {
    [key: string]: number;
  };
};

export default function SchedulePage() {
  const router = useRouter();
  const [userAvailability, setUserAvailability] = useState<Availability[]>([]);
  const [groupAvailability, setGroupAvailability] = useState<GroupAvailability>(
    {}
  );
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sample time blocks
  const timeBlockOptions = [
    "12:30PM-4:00PM",
    "7:00PM-10:30PM",
    "2:30PM-6:00PM",
  ];

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // In a real app, we would fetch this data from a backend
    const storedEventData = localStorage.getItem("eventData");

    if (storedEventData) {
      try {
        const parsedData = JSON.parse(storedEventData);
        setEventData(parsedData);

        // Initialize user availability based on selected days
        const initialAvailability = parsedData.selectedDays.map(
          (day: string) => ({
            day,
            timeBlocks: [],
          })
        );

        setUserAvailability(initialAvailability);

        // Initialize group availability with consistent mock data
        const mockGroupAvailability: GroupAvailability = {};

        // Use fixed values instead of random to avoid hydration errors
        parsedData.selectedDays.forEach((day: string, index: number) => {
          mockGroupAvailability[day] = {
            "12:30PM-4:00PM": index % 4,
            "7:00PM-10:30PM": (index + 1) % 4,
          };

          // Add more time blocks for some days to demonstrate the heat map
          if (day === "Fri") {
            mockGroupAvailability[day]["2:30PM-6:00PM"] = 3;
          }
        });

        setGroupAvailability(mockGroupAvailability);
      } catch (error) {
        console.error("Error parsing event data:", error);
      }
    } else {
      // If no data, redirect back to create page
      router.push("/create");
    }

    setIsLoading(false);
  }, [router]);

  const toggleDayExpansion = (day: string) => {
    if (expandedDays.includes(day)) {
      setExpandedDays(expandedDays.filter((d) => d !== day));
    } else {
      setExpandedDays([...expandedDays, day]);
    }
  };

  const addTimeBlock = (day: string, timeBlock: string) => {
    setUserAvailability((prev) =>
      prev.map((item) =>
        item.day === day
          ? { ...item, timeBlocks: [...item.timeBlocks, timeBlock] }
          : item
      )
    );
  };

  const removeTimeBlock = (day: string, timeBlock: string) => {
    setUserAvailability((prev) =>
      prev.map((item) =>
        item.day === day
          ? {
              ...item,
              timeBlocks: item.timeBlocks.filter((tb) => tb !== timeBlock),
            }
          : item
      )
    );
  };

  // Function to determine color based on availability count
  const getAvailabilityColor = (count: number) => {
    if (count === 0) return "bg-white text-gray-800";
    if (count === 1) return "bg-yellow-400 text-gray-800";
    if (count === 2) return "bg-orange-500 text-white";
    return "bg-red-700 text-white"; // crimson for 3+
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#2D2A40] text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-[#2D2A40] text-white flex items-center justify-center">
        No event data found. Please create an event.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#2D2A40] text-white">
      <nav className="p-4 flex justify-between items-center border-b border-gray-800">
        <div className="text-lg font-medium">Create Schedule</div>
      </nav>

      <div className="p-8">
        <div className="bg-[#3D3A50] rounded-3xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* User Availability */}
            <div>
              <h2 className="text-xl font-bold mb-6">Your Availability</h2>

              <div className="space-y-4">
                {userAvailability.map((item) => (
                  <div key={item.day} className="bg-[#2D2A40] rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mr-2">
                        <span className="text-xs">
                          {item.day.substring(0, 3)}
                        </span>
                      </div>
                      <span className="font-medium">{item.day}:</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.timeBlocks.map((block) => (
                        <div
                          key={`${item.day}-${block}`}
                          className="bg-white text-gray-800 rounded-full px-3 py-1 text-sm"
                        >
                          {block}
                        </div>
                      ))}

                      {/* Add time block button */}
                      <TimeBlock
                        day={item.day}
                        options={timeBlockOptions}
                        onSelect={(timeBlock) =>
                          addTimeBlock(item.day, timeBlock)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Group Availability */}
            <div>
              <h2 className="text-xl font-bold mb-6">Group's Availability</h2>

              <div className="space-y-4">
                {Object.entries(groupAvailability).map(([day, timeBlocks]) => (
                  <div key={day} className="bg-[#2D2A40] rounded-xl p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleDayExpansion(day)}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mr-2">
                          <span className="text-xs">{day.substring(0, 3)}</span>
                        </div>
                        <span className="font-medium">{day}:</span>
                      </div>
                      {expandedDays.includes(day) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </div>

                    <div
                      className={`mt-2 flex flex-wrap gap-2 ${
                        expandedDays.includes(day) ? "block" : "hidden"
                      }`}
                    >
                      {Object.entries(timeBlocks).map(([timeBlock, count]) => (
                        <div
                          key={`${day}-${timeBlock}`}
                          className={`rounded-full px-3 py-1 text-sm ${getAvailabilityColor(
                            count
                          )}`}
                        >
                          {timeBlock}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
