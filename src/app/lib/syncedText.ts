import { create } from "zustand";

interface SyncedTextStore{
    isSyncedText: boolean;
    setIsSyncedText: (isSyncedText: boolean) => void;
}

const useSyncedTextStore = create<SyncedTextStore>((set)=>({
    isSyncedText: false,
    setIsSyncedText: (isSyncedText: boolean) => set({isSyncedText})
}))

export default useSyncedTextStore;

