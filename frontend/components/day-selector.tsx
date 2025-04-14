// app/components/day-selector.tsx

"use client";

import { Button } from "./ui/button";

type DaySelectorProps = {
  selectedDays: string[];
  setSelectedDays: (days: string[]) => void;
};

const days = [
  { key: "S", full: "Sun" },
  { key: "M", full: "Mon" },
  { key: "T", full: "Tue" },
  { key: "W", full: "Wed" },
  { key: "T", full: "Thu" },
  { key: "F", full: "Fri" },
  { key: "S", full: "Sat" },
];

export function DaySelector({
  selectedDays,
  setSelectedDays,
}: DaySelectorProps) {
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-center gap-2">
        {days.map((day, index) => (
          <Button
            key={`${day.key}-${index}`}
            type="button"
            variant="outline"
            className={`w-8 h-8 p-0 rounded-full ${
              selectedDays.includes(day.full)
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-transparent text-white border-gray-600"
            }`}
            onClick={() => toggleDay(day.full)}
          >
            {day.key}
          </Button>
        ))}
      </div>
    </div>
  );
}
