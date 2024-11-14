import {create} from "zustand";

interface GenerateStateStore{
    isGenerating: boolean;
    setIsGenerating: (isGenerating: boolean) => void;
}

const useGenerateStore = create<GenerateStateStore>((set)=>({
    isGenerating: false,
    setIsGenerating: (isGenerating: boolean) => set({isGenerating})
}))

export default useGenerateStore;    