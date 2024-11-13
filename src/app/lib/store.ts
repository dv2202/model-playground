import { create } from "zustand";

interface ModelStateStore{
    selectedModel: string | null;
    setSelectedModel: (model: string) => void;
}

const useModelStore = create<ModelStateStore>((set)=>({
    selectedModel: null,
    setSelectedModel: (model: string) => set({selectedModel: model})
}))

export default useModelStore;