'use client'
import { useState } from "react";

type RoleType = "user" | "assistant";

interface ChatSectionProps {
    selectedModel: string | null;
    content: string;
    onContentChange: (newContent: string) => void;
    responseText: string;
    handleSubmit: () => void;
}

export default function ChatSection({
    content,
    onContentChange,
    responseText,
    handleSubmit,
}: ChatSectionProps) {
    const [selectedRole, setSelectedRole] = useState<RoleType>("user");

    const toggleRole = () => {
        setSelectedRole((prevRole) => (prevRole === "user" ? "assistant" : "user"));
    };

    return (
        <div className="flex flex-col h-full w-full p-2 shadow-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-300">
            <div className="flex-grow w-full p-4 rounded-lg overflow-y-auto mb-4 min-h-0 flex flex-col justify-start bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
                {responseText && <p className="text-sm whitespace-pre-wrap">{responseText}</p>}
            </div>


            <div className="w-full  flex gap-2 items-center">
                <div
                    onClick={toggleRole}
                    className={`cursor-pointer h-10 px-6 flex items-center justify-center rounded-md font-medium text-sm transition-colors duration-300 ${selectedRole === "user"
                        ? "bg-blue-600 dark:bg-blue-700 text-white"
                        : "bg-green-600 dark:bg-green-700 text-white"
                        }`}
                >
                    {selectedRole === "user" ? "User" : "Assistant"}
                </div>
                <textarea
                    name="content"
                    id="content"
                    className="flex w-full h-[40px] rounded-md border border-input placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-0 focus-visible:border-none focus-visible:ring-ring max-h-[300px] flex-1 resize-none bg-inherit px-3 py-2 text-base lg:px-4 lg:py-2 focus:bg-background focus-visible:ring-2"
                    placeholder="Type your message..."
                    value={content}
                    onChange={(e) => onContentChange(e.target.value)}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";  
                        target.style.height = `${target.scrollHeight}px`;  
                    }}
                ></textarea>

                <button
                    className="h-10 px-4 bg-blue-600 dark:bg-blue-700 text-white font-medium rounded-md shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300"
                    onClick={handleSubmit}
                >
                    Submit
                </button>
            </div>
        </div>
    );
}
