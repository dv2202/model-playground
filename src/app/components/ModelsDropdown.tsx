'use client'

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";


interface DropdownProps {
  options: { id: string }[];
  selectedModel: string | null;
  onModelChange: (modelId: string) => void;
  placeholder?: string;
}

export default function ModelsDropdown({
  options,
  selectedModel,
  onModelChange,
  placeholder = "Select a model",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const buttonText = selectedModel || placeholder;

  return (
<div ref={dropdownRef} className="relative sm:w-auto md:w-[200px]">
  <Button
    variant="outline"
    role="combobox"
    aria-expanded={isOpen}
    className="w-full justify-between h-[44px] px-3 py-2 text-left bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
    onClick={() => setIsOpen((prev) => !prev)}
  >
    <span className="block truncate">
      {buttonText}
    </span>
    <ChevronDown
      className={cn(
        "ml-2 h-4 w-4 shrink-0 opacity-50",
        isOpen && "rotate-180 transform"
      )}
    />
  </Button>

  {isOpen && (
    <div className="absolute mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
      <ScrollArea className="max-h-[300px] overflow-y-auto">
        <ul
          className="py-1 text-left"
          role="listbox"
          aria-labelledby="options-menu"
        >
          {options.map((option) => (
            <li
              key={option.id}
              className={cn(
                "relative cursor-pointer select-none py-2 px-2 text-gray-900 dark:text-gray-100 text-sm",
                selectedModel === option.id ? "bg-blue-50 dark:bg-blue-900/50" : "hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
              onClick={() => {
                onModelChange(option.id);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={selectedModel === option.id}
            >
              <span className="block truncate font-medium text-sm max-w-[200px]">
                {option.id}
              </span>
              {/* Uncomment this section if you'd like to show a checkmark for the selected item */}
              {/* {selectedModel === option.id && (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                  <Check className="h-5 w-5" aria-hidden="true" />
                </span>
              )} */}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )}
</div>

  );
}