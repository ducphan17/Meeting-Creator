// components/time-selector.tsx

"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";

type TimeSelectorProps = {
  value: string;
  onChange: (time: string) => void;
};

export function TimeSelector({ value, onChange }: TimeSelectorProps) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = ["00", "15", "30", "45"];
  const periods = ["AM", "PM"];

  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (time: string) => {
    onChange(time);
    setIsOpen(false);
  };

  // Generate time options
  const timeOptions = [];
  for (const period of periods) {
    for (const hour of hours) {
      for (const minute of minutes) {
        timeOptions.push(`${hour}:${minute} ${period}`);
      }
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-28 justify-between bg-transparent border-gray-600 rounded-full"
        >
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0 bg-[#2D2A40] border-gray-700">
        <ScrollArea className="h-60">
          <div className="p-1">
            {timeOptions.map((time) => (
              <Button
                key={time}
                variant="ghost"
                className="w-full justify-start font-normal"
                onClick={() => handleSelect(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
