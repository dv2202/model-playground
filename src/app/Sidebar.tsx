'use client';

import React, { useState, useEffect } from "react";
import { Plus, MessageCircle, X } from 'lucide-react';
import { FiSidebar } from "react-icons/fi";
import useSidebarState from "./lib/sidebarStore";
import { signOut, useSession } from "next-auth/react";
import { isSameDay } from "date-fns";
import { useRouter } from "next/navigation";

export function Sidebar() {
    const { isSidebarOpen, toggleSidebar, setIsSidebarOpen, isNewChat, setIsNewChat } = useSidebarState();
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const { data: sessions } = useSession();
    const [allChats, setAllChats] = useState<{ [key: string]: any[] }>({
        Today: [],
        Yesterday: [],
        Older: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleNewChat = () => {
        setIsNewChat(true);
        window.location.reload();
    };

    const fetchChats = async () => {
        if (!sessions?.user) {
            setError("No user logged in.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/getAllChats");
            if (!response.ok) {
                throw new Error("Failed to fetch chats");
            }
            const chats = await response.json();

            const groupedChats = groupChatsByDate(chats);
            setAllChats(groupedChats);
            setLoading(false);
        } catch (error) {
            setError("Failed to fetch chats.");
            setLoading(false);
        }
    };

    const groupChatsByDate = (chats: any[]) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const grouped: { [key: string]: any[] } = {
            Today: [],
            Yesterday: [],
            Older: [],
        };

        chats.forEach((chat) => {
            const chatDate = new Date(chat.createdAt);

            if (isSameDay(chatDate, today)) {
                grouped.Today.push(chat);
            } else if (isSameDay(chatDate, yesterday)) {
                grouped.Yesterday.push(chat);
            } else {
                grouped.Older.push(chat);
            }
        });

        return grouped;
    };

    useEffect(() => {
        if (sessions?.user) {
            fetchChats();
        } else {
            setLoading(false);
        }
    }, [sessions]);

    return (
        <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 flex flex-col h-full w-64 bg-white shadow transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
                {/* Sidebar Header */}
                <div className="border-b p-4 flex justify-between items-center">
                    <button className="flex items-center w-full text-left">
                        <div className="h-8 w-9 rounded-full bg-gray-300 flex items-center justify-center text-sm">
                            {sessions?.user?.name?.charAt(0) || `U`}
                        </div>
                        <div className="w-full flex flex-row justify-between items-center">
                            <span className="ml-3 text-sm font-medium">{sessions?.user?.name || `User`}</span>
                            {
                                sessions?.user ? (
                                    <div onClick={() => signOut()} className="text-sm p-1 border-2 border-black rounded-md">
                                        Logout
                                    </div>
                                ) : (
                                    <div onClick={() => router.push('/login')} className="text-sm p-1 border-2 border-black rounded-md">
                                        Login
                                    </div>
                                )
                            }
                        </div>
                    </button>
                    <button
                        className="md:hidden text-gray-500 hover:text-gray-700"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Sidebar Content */}
                <div className="flex-grow overflow-y-auto p-4 h-full">
                    <div>
                        <div className="flex flex-row justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2">Chats</h3>
                            <FiSidebar
                                className="cursor-pointer text-gray-500 hover:text-gray-700 md:hidden"
                                onClick={() => setIsSidebarOpen(false)}
                            />
                        </div>
                        <div className="space-y-1">
                            {loading ? (
                                <p>Loading chats...</p>
                            ) : error ? (
                                <p>{error}</p>
                            ) : Object.keys(allChats).length === 0 ? (
                                <p>No chats present</p>
                            ) : (
                                Object.keys(allChats).map((section) => (
                                    allChats[section].length > 0 && (
                                        <div key={section}>
                                            <h4 className="text-sm font-semibold text-gray-600 mt-4">
                                                {section}
                                            </h4>
                                            {allChats[section].map((chat: any) => (
                                                <button
                                                    key={chat.chatId}
                                                    onClick={() => setActiveChat(chat.chatId)}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left ${activeChat === chat.chatId
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "hover:bg-gray-100"
                                                        }`}
                                                >
                                                    <MessageCircle className="h-4 w-4 text-gray-500" />
                                                    <div className="flex-1 truncate">
                                                        <span>{chat.content}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="border-t p-4 " onClick={handleNewChat}>
                    <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                        <Plus className="h-4 w-4" />
                        New Chat
                    </button>
                </div>
            </div>

            {/* Sidebar Toggle Button */}
            {!isSidebarOpen && (
                <div className="fixed top-[8%] md:top-0 md:left-0 m-4 md:hidden">
                    <button
                        className="p-2 bg-white rounded-md shadow-md text-gray-500 hover:text-gray-700"
                        onClick={toggleSidebar}
                    >
                        <FiSidebar className="h-6 w-6" />
                    </button>
                </div>
            )}

        </>
    );
}

