// components/ui/separator.tsx

"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Plus } from "lucide-react";

type TimeBlockProps = {
  day: string;
  options: string[];
  onSelect: (timeBlock: string) => void;
};

export function TimeBlock({ day, options, onSelect }: TimeBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: string) => {
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full bg-transparent border-gray-600"
        >
          <Plus size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1 bg-[#2D2A40] border-gray-700">
        {options.map((option) => (
          <Button
            key={option}
            variant="ghost"
            className="w-full justify-start font-normal"
            onClick={() => handleSelect(option)}
          >
            {option}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
