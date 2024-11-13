'use client'
import axios from "axios";
import { useEffect, useState } from "react";
import PlaygroundChat from "./components/PlaygroundChat";


export default function Home() {
  const [models, setModels] = useState<{ id: string }[]>([]);
  const getModels = async () => {
    try {
      const response = await axios.get("https://api.groq.com/openai/v1/models", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
        },
      });
      setModels(response.data.data);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  useEffect(() => {
    getModels();
  }, []);

  return (
    <div className="w-[100vw] h-[100vh] overflow-x-hidden p-3 flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <p className="h-[40px] text-lg font-semibold dark:text-gray-100">AI Models Playground</p>
      <PlaygroundChat
        models={models}
      />
    </div>
  );
}
