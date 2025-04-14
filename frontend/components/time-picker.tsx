"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(value);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = ["00", "15", "30", "45"];
  const periods = ["AM", "PM"];

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onChange(time);
    setOpen(false);
  };

  const generateTimeOptions = () => {
    const options: string[] = [];

    periods.forEach((period) => {
      hours.forEach((hour) => {
        minutes.forEach((minute) => {
          options.push(
            `${hour.toString().padStart(2, "0")}:${minute} ${period}`
          );
        });
      });
    });

    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[120px] justify-between bg-purple-800/50 border-purple-700 text-white rounded-full"
        >
          {selectedTime}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-purple-800 border-purple-700 text-white">
        <div className="h-[200px] overflow-y-auto">
          {timeOptions.map((time) => (
            <div
              key={time}
              className={cn(
                "px-4 py-2 cursor-pointer hover:bg-purple-700",
                selectedTime === time && "bg-purple-600"
              )}
              onClick={() => handleTimeSelect(time)}
            >
              {time}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
