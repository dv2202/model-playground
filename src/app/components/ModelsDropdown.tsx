'use client'
import { useState } from "react";

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
  placeholder = "Select an option",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-[350px] h-fixed" >
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-[40px] px-3 py-1 text-left border rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
      >
        {selectedModel || placeholder}
      </button>
      {isOpen && (
        <ul className="absolute w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md mt-1 z-10 shadow-lg">
          {options.map((option) => (
            <li
              key={option.id}
              className={`p-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors ${
                selectedModel === option.id ? "bg-blue-100 dark:bg-blue-900" : ""
              } text-gray-800 dark:text-gray-100`}
              onClick={() => {
                onModelChange(option.id);
                setIsOpen(false);
              }}
            >
              {option.id}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
