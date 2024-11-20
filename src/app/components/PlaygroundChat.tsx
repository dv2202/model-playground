'use client'
import { useState } from "react";
import ModelsDropdown from "./ModelsDropdown";
import ChatSection from "./ChatSection";
import { Plus, X } from "lucide-react";
import Groq from "groq-sdk";
import { CompletionUsage } from "groq-sdk/resources/completions.mjs";
import toast from "react-hot-toast";
import { BsLightningCharge } from "react-icons/bs";
import { Switch } from "@radix-ui/react-switch";
import useSyncedTextStore from "../lib/syncedText";
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
  content: string;
}


export default function PlaygroundChat({ models }: PlaygroundChatProps) {
  const [chatPanels, setChatPanels] = useState<ChatPanel[]>([
    {
      id: 1,
      selectedModel: models[0]?.id || null,
      response: "",
      usage: null,
      isMatrixVisible: false,
      conversation: [],
      content: "", // Individual content
    },
    {
      id: 2,
      selectedModel: models[Math.floor(Math.random() * 20)]?.id || null,
      response: "",
      usage: null,
      isMatrixVisible: false,
      conversation: [],
      content: "", // Individual content
    }
  ]);
  const { isSyncedText, setIsSyncedText } = useSyncedTextStore();

  const [sharedContent, setSharedContent] = useState<string>("");
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<string>("");

  const startEditingQuestion = (index: number) => {
    const questionToEdit = chatPanels[0]?.conversation[index]?.question || "";
    setEditingQuestionId(index);
    setEditedQuestion(questionToEdit);
  };
  // const saveEditedQuestion = async () => {
  //   setChatPanels((prev) =>
  //     prev.map((panel) => ({
  //       ...panel,
  //       conversation: panel.conversation.map((item, index) =>
  //         index === editingQuestionId
  //           ? { ...item, question: editedQuestion, response: "" } 
  //           : item
  //       ),
  //     }))

  //   );
  //   await updateResponse();
  //   setEditingQuestionId(null);
  //   setEditedQuestion("");
  // };

  const cancelEditing = () => {
    setEditingQuestionId(null);
    setEditedQuestion("");
  };

  const onEditedQuestionChange = (value: string) => {
    setEditedQuestion(value);
  };


  const client = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const addChatPanel = () => {
    const newPanel: ChatPanel = {
      id: chatPanels.length + 1,
      selectedModel: models[chatPanels.length % models.length]?.id || null,
      response: "",
      usage: null,
      isMatrixVisible: false,
      conversation: [],
      content: "",
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

  const handleContentChange = (panelId: number, newContent: string) => {
    if (isSyncedText) {
      setSharedContent(newContent);
    } else {
      setChatPanels((prev) =>
        prev.map((panel) =>
          panel.id === panelId ? { ...panel, content: newContent } : panel
        )
      );
    }
  };


  const saveEditedQuestion = async () => {
    const updatedPanels = chatPanels.map((panel) => ({
      ...panel,
      conversation: panel.conversation.map((item, index) => {
        if (index === Number(editingQuestionId)) {
          return { ...item, question: editedQuestion, response: "" };
        }
        return item;
      }),
    }));

    setChatPanels(updatedPanels);

    await updateResponseForPanel(editedQuestion, updatedPanels);

    setEditingQuestionId(null);
    setEditedQuestion("");
  };

  const updateResponseForPanel = async (question: string, panels: typeof chatPanels) => {
    const updatedPanels = await Promise.all(
      panels.map(async (panel) => {
        // Find the index of the question in the current panel
        const questionIndex = panel.conversation.findIndex((item) => item.question === question);
        if (questionIndex === -1) return panel; // Skip if the question is not in this panel

        try {
          const chatCompletion = await client.chat.completions.create({
            model: panel.selectedModel as string,
            messages: [{ role: "user", content: question }],
          });

          const completionText = chatCompletion.choices[0].message.content || "";
          const usageDetails = chatCompletion.usage;

          const updatedConversation = panel.conversation.map((item, index) =>
            index === questionIndex
              ? { ...item, response: completionText }
              : item
          );

          return {
            ...panel,
            response: completionText,
            usage: usageDetails || null,
            conversation: updatedConversation,
          };
        } catch (error) {
          console.error("Error:", error);

          const updatedConversation = panel.conversation.map((item, index) =>
            index === questionIndex
              ? { ...item, response: "Error fetching response." }
              : item
          );

          return {
            ...panel,
            response: "Error fetching response.",
            usage: null,
            conversation: updatedConversation,
          };
        }
      })
    );

    setChatPanels(updatedPanels);
  };


  const handleSubmitAll = async () => {
    const missingModelPanel = chatPanels.find((panel) => panel.selectedModel === null);
    if (missingModelPanel) {
      toast.error("Please select a model for all panels.");
      return;
    }

    const updatedPanels = await Promise.all(
      chatPanels.map(async (panel) => {
        // Use individual content for each panel when sync is off
        const contentToSubmit = isSyncedText ? sharedContent : panel.content;

        // Skip processing if the panel's content is empty and sync is off
        if (!contentToSubmit) {
          return panel;
        }

        try {
          const chatCompletion = await client.chat.completions.create({
            model: panel.selectedModel as string,
            messages: [{ role: "user", content: contentToSubmit }],
          });

          const completionText = chatCompletion.choices[0].message.content || "";
          const usageDetails = chatCompletion.usage;

          return {
            ...panel,
            response: completionText,
            usage: usageDetails || null,
            conversation: [
              ...panel.conversation,
              { question: contentToSubmit, response: completionText },
            ],
          };
        } catch (error) {
          console.error("Error:", error);
          return {
            ...panel,
            response: "Error fetching response.",
            usage: null,
            conversation: [
              ...panel.conversation,
              { question: contentToSubmit, response: "Error fetching response." },
            ],
          };
        }
      })
    );

    setChatPanels(updatedPanels);

    // Clear shared content only when sync is enabled
    if (isSyncedText) {
      setSharedContent("");
    }
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
    <div className="relative w-full h-full flex border-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-300 overflow-x-auto">
      {chatPanels.map((panel, index) => (
        <div key={panel.id}
        className={`flex-1 flex flex-col dark:border-gray-700 ${
          index < chatPanels.length - 1 ? "border-r border-gray-300 dark:border-gray-700" : ""
        }`}>
          <div className="p-2 h-auto flex flex-row justify-between  border-b dark:border-gray-700">
            <div className="flex gap-3 justify-around">
              <ModelsDropdown
                options={models}
                selectedModel={panel.selectedModel}
                onModelChange={(modelId) => handleModelChange(panel.id, modelId)}
              />

            </div>
            <div className="flex-grow relative ">
              {panel.isMatrixVisible && panel.usage && (
                <div className="absolute top-[40px] left-[5%] z-30 w-[300px] p-4 bg-gray-100 dark:bg-gray-800 rounded-md shadow-lg">
                  <p className="font-semibold text-center text-gray-800 dark:text-gray-200">
                    Inference Details
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
              <div className="flex justify-end p-2">
                <label className="flex items-center gap-2">
                  {
                    isSyncedText && (
                      <span className="text-sm">Sync Content</span>
                    )
                  }
                  <Switch
                    checked={isSyncedText}
                    onCheckedChange={(checked) => setIsSyncedText(checked)}
                    className={`w-7 h-4 rounded-full relative transition-colors ${isSyncedText ? "bg-black" : "bg-gray-300"
                      }`}
                  >
                    <span
                      className={`block w-2 h-2 bg-white rounded-full absolute top-1 transition-transform ${isSyncedText ? "translate-x-4" : "translate-x-1"
                        }`}
                    />
                  </Switch>
                </label>
              </div>
              {panel.usage && (
                <button
                  className="px-3 py-1 text-lg text-orange-400 rounded-md"
                  onMouseEnter={() => handleMouseEnter(panel.id)}
                  onMouseLeave={() => handleMouseLeave(panel.id)}
                >
                  <BsLightningCharge />
                </button>
              )}
              {index === chatPanels.length - 1 && chatPanels.length < 3 && (
                <div
                  className=" p-1 items-center justify-center flex rounded-md cursor-pointer hover:text-blue-600 dark:hover:text-blue-600 transition-colors"
                  onClick={addChatPanel}
                >
                  <Plus size={20} />
                </div>
              )}

              {chatPanels.length > 1 && (
                <div
                  className=" p-1 items-center justify-center flex rounded-md cursor-pointer dark:bg-gray-700 hover:text-red-600 dark:hover:text-red-600 transition-colors"
                  onClick={() => deleteChatPanel(panel.id)}
                >
                  <X size={20} />
                </div>
              )}
            </div>
          </div>
          <div className="flex-grow h-[90%] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border-none">
            <ChatSection
              selectedModel={panel.selectedModel}
              content={isSyncedText ? sharedContent : panel.content}
              onContentChange={(newContent) => handleContentChange(panel.id, newContent)}
              responseText={panel.response}
              handleSubmit={() => handleSubmitAll()}
              conversation={panel.conversation}
              editingQuestionId={editingQuestionId}
              editedQuestion={editedQuestion}
              startEditingQuestion={startEditingQuestion}
              saveEditedQuestion={saveEditedQuestion}
              cancelEditing={cancelEditing}
              onEditedQuestionChange={onEditedQuestionChange}
            />

          </div>
        </div>
      ))}
    </div>
  );
}
