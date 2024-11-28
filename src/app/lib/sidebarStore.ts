import { create } from "zustand";

interface SidebarState {
    isSidebarOpen: boolean; 
    toggleSidebar: () => void; 
    setIsSidebarOpen: (isOpen: boolean) => void;
    isNewChat:boolean;
    setIsNewChat:(isNewChat:boolean) => void
}

const useSidebarState = create<SidebarState>((set) => ({
    isSidebarOpen: true, 
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })), 
    setIsSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
    isNewChat:false,
    setIsNewChat:(isNewChat:boolean) => set({isNewChat:isNewChat})
}));

export default useSidebarState;
