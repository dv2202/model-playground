'use client'
import { useState } from "react";
import ModelsDropdown from "./ModelsDropdown";
import ChatSection from "./ChatSection";
import { Plus, X } from "lucide-react";
import Groq from "groq-sdk";
import { CompletionUsage } from "groq-sdk/resources/completions.mjs";
import toast from "react-hot-toast";

interface PlaygroundChatProps {
  models: { id: string }[];
}

interface ChatPanel {
  id: number;
  selectedModel: string | null;
  response: string;
  usage: CompletionUsage | null;
  isMatrixVisible: boolean; 
  conversation: { question: string; response: string }[]; 
}

export default function PlaygroundChat({ models }: PlaygroundChatProps) {
  const [chatPanels, setChatPanels] = useState<ChatPanel[]>([
    {
      id: 1,
      selectedModel: models[0]?.id || null,
      response: "",
      usage: null,
      isMatrixVisible: false,
      conversation: [] 
    }
  ]);
  const [sharedContent, setSharedContent] = useState<string>("");
  const client = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const addChatPanel = () => {
    const newPanel = {
      id: chatPanels.length + 1,
      selectedModel: models[chatPanels.length % models.length]?.id || null,
      response: "",
      usage: null,
      isMatrixVisible: false,
      conversation:[]
    };
    setChatPanels((prev) => [...prev, newPanel]);
  };

  const deleteChatPanel = (id: number) => {
    setChatPanels((prev) => prev.filter((panel) => panel.id !== id));
  };

  const handleModelChange = (panelId: number, modelId: string) => {
    setChatPanels((prev) =>
      prev.map((panel) =>
        panel.id === panelId ? { ...panel, selectedModel: modelId } : panel
      )
    );
  };

  const handleContentChange = (newContent: string) => {
    setSharedContent(newContent);
  };


  const handleSubmitAll = async () => {
    const missingModelPanel = chatPanels.find((panel) => panel.selectedModel === null);
    if (missingModelPanel) {
      toast.error("Please select a model for all panels.");
      return;
    }

    const updatedPanels = await Promise.all(
      chatPanels.map(async (panel) => {
        try {
          const chatCompletion = await client.chat.completions.create({
            model: panel.selectedModel as string,
            messages: [{ role: "user", content: sharedContent }],
          });
  
          const completionText = chatCompletion.choices[0].message.content || "";
          const usageDetails = chatCompletion.usage;
  
          return {
            ...panel,
            response: completionText,
            usage: usageDetails || null,
            conversation: [
              ...panel.conversation,
              { question: sharedContent, response: completionText }
            ]
          };
        } catch (error) {
          console.error("Error:", error);
          return { 
            ...panel, 
            response: "Error fetching response.", 
            usage: null,
            conversation: [
              ...panel.conversation,
              { question: sharedContent, response: "Error fetching response." }
            ]
          };
        }
      })
    );
  
    setChatPanels(updatedPanels);
    setSharedContent("");
  };
  
  // Toggle inference matrix visibility for each panel
  const handleMouseEnter = (id: number) => {
    setChatPanels((prev) =>
      prev.map((panel) =>
        panel.id === id ? { ...panel, isMatrixVisible: true } : panel
      )
    );
  };

  const handleMouseLeave = (id: number) => {
    setChatPanels((prev) =>
      prev.map((panel) =>
        panel.id === id ? { ...panel, isMatrixVisible: false } : panel
      )
    );
  };

  return (
    <div className="relative w-full h-full flex rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-300 overflow-x-auto">
      {chatPanels.map((panel, index) => (
        <div key={panel.id} className="flex-1 flex flex-col border dark:border-gray-700">
          <div className="p-2 h-auto flex flex-row justify-between  border-b dark:border-gray-700">
            <div className="flex gap-3">
              <ModelsDropdown
                options={models}
                selectedModel={panel.selectedModel}
                onModelChange={(modelId) => handleModelChange(panel.id, modelId)}
              />
              {panel.usage && (
                <button
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md"
                  onMouseEnter={() => handleMouseEnter(panel.id)}
                  onMouseLeave={() => handleMouseLeave(panel.id)}
                >
                view inference 
                </button>
              )}
            </div>
            <div className="flex-grow relative ">
              {panel.isMatrixVisible && panel.usage && (
                <div className="absolute top-[40px] right-[93%] z-30 w-[400px] p-4 bg-gray-100 dark:bg-gray-800 rounded-md shadow-lg">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    Inference Details for {panel.selectedModel}
                  </p>
                  <p className="text-orange-500 dark:text-orange-500 text-center">
                    Queue Time: {panel.usage.queue_time?.toFixed(3)} seconds
                  </p>
                  <p className="text-orange-500 dark:text-orange-500 text-center">
                    Prompt Tokens: {panel.usage.prompt_tokens?.toFixed(3)}
                  </p>
                  <p className="text-orange-500 dark:text-orange-500 text-center">
                    Prompt Time: {panel.usage.prompt_time?.toFixed(3)} seconds
                  </p>
                  <p className="text-orange-500 dark:text-orange-500 text-center">
                    Completion Tokens: {panel.usage.completion_tokens?.toFixed(3)}
                  </p>
                  <p className="text-orange-500 dark:text-orange-500 text-center">
                    Completion Time: {panel.usage.completion_time?.toFixed(3)} seconds
                  </p>
                  <p className="text-orange-500 dark:text-orange-500 text-center">
                    Total Tokens: {panel.usage.total_tokens?.toFixed(3)}
                  </p>
                  <p className="text-orange-500 dark:text-orange-500 text-center">
                    Total Time: {panel.usage.total_time?.toFixed(3)} seconds
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-1">
              {index === chatPanels.length - 1 && (
                <div
                  className="border p-1 items-center justify-center flex rounded-md cursor-pointer bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  onClick={addChatPanel}
                >
                  <Plus size={20} />
                </div>
              )}
              {chatPanels.length > 1 && (
                <div
                  className="border p-1 items-center justify-center flex rounded-md cursor-pointer bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => deleteChatPanel(panel.id)}
                >
                  <X size={20} />
                </div>
              )}
            </div>
          </div>
          <div className="flex-grow h-[90%] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200">
            <ChatSection
              selectedModel={panel.selectedModel}
              content={sharedContent}
              onContentChange={handleContentChange}
              responseText={panel.response}
              handleSubmit={() => handleSubmitAll()}
              conversation={panel.conversation}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
