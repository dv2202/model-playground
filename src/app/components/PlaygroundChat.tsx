'use client'
import { useEffect, useState } from "react";
import ModelsDropdown from "./ModelsDropdown";
import ChatSection from "./ChatSection";
import { Plus, X } from "lucide-react";
import Groq from "groq-sdk";
import { CompletionUsage } from "groq-sdk/resources/completions.mjs";
import toast from "react-hot-toast";
import { Switch } from "@radix-ui/react-switch";
import useSyncedTextStore from "../lib/syncedText";
import prisma from "@/lib/prisma";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { useSession } from "next-auth/react";

interface PlaygroundChatProps {
  models: { id: string }[];
  openaiModels: any[];
}

export interface ChatPanel {
  id: number;
  parentModel: string;
  selectedModel: string | null;
  response: string;
  usage: CompletionUsage | null;
  isMatrixVisible: boolean;
  conversation: { question: string; response: string }[];
  content: string;
  isGeneratingText: boolean;
  chatId: string;
}

const generateUniqueId = (): string => {
  return Math.floor(Math.random() * 1000000).toString();
};

export default function PlaygroundChat({ models, openaiModels }: PlaygroundChatProps) {
  const parentModels = ["Groq", "OpenAI"];
  const { isSyncedText, setIsSyncedText } = useSyncedTextStore();
  const { data: session } = useSession()
  const [sharedContent, setSharedContent] = useState<string>("");
  const [editingQuestionIds, setEditingQuestionIds] = useState<Record<number, number | null>>({});
  const [editedQuestions, setEditedQuestions] = useState<Record<number, string>>({});
  const [generatedChatId, setGeneratedChatId] = useState<string>("");

  const [chatPanels, setChatPanels] = useState<ChatPanel[]>([
    {
      id: 1,
      parentModel: parentModels[0],
      selectedModel: models[3]?.id || null,
      response: "",
      usage: null,
      isMatrixVisible: false,
      conversation: [],
      content: "",
      isGeneratingText: false,
      chatId: generateUniqueId(),
    },
    {
      id: 2,
      parentModel: parentModels[0],
      selectedModel: models[Math.floor(Math.random() * 18)]?.id || null,
      response: "",
      usage: null,
      isMatrixVisible: false,
      conversation: [],
      content: "",
      isGeneratingText: false,
      chatId: generateUniqueId(),
    }
  ]);
  
  useEffect(() => {
    setGeneratedChatId(generateUniqueId());
    {
      isSyncedText ? (
        setChatPanels((prev) =>
          prev.map((panel) => ({
            ...panel,
            chatId: generatedChatId,
          }))
        )
      ) : (
        setChatPanels((prev) =>
          prev.map((panel) => ({
            ...panel,
            chatId: generateUniqueId(),
          })))
      )
    }

  }, [isSyncedText]);


  const updateParentModel = (panelId: number, newParentModel: string) => {
    setChatPanels((prevPanels) =>
      prevPanels.map((panel) =>
        panel.id === panelId
          ? {
            ...panel,
            parentModel: newParentModel,
            selectedModel: newParentModel === "Groq" ? models[0]?.id || null : openaiModels[0]?.id || null,
          }
          : panel
      )
    );
  };

  const startEditingQuestion = (panelId: number, index: number) => {

    const questionToEdit = chatPanels.find(panel => panel.id === panelId)?.conversation[index]?.question || "";
    setEditingQuestionIds((prev) => ({ ...prev, [panelId]: index }));
    setEditedQuestions((prev) => ({ ...prev, [panelId]: questionToEdit }));
  };


  const cancelEditing = (panelId: number) => {
    setEditingQuestionIds((prev) => ({ ...prev, [panelId]: null }));
    setEditedQuestions((prev) => ({ ...prev, [panelId]: "" }));
  };

  const onEditedQuestionChange = (panelId: number, value: string) => {
    setEditedQuestions((prev) => ({ ...prev, [panelId]: value }));
  };

  const client = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true
  });


  const addChatPanel = () => {
    const newPanel: ChatPanel = {
      id: chatPanels.length + 1,
      parentModel: parentModels[0],
      selectedModel: models[chatPanels.length % models.length]?.id || null,
      response: "",
      usage: null,
      isMatrixVisible: false,
      conversation: [],
      content: "",
      isGeneratingText: false,
      chatId: isSyncedText ? generatedChatId : generateUniqueId().toString(),
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


  // const saveEditedQuestion = async (panelId: number) => {
  //   const updatedPanels = chatPanels.map((panel) => ({
  //     ...panel,
  //     conversation: panel.conversation.map((item, index) => {
  //       if (index === editingQuestionIds[panelId]) {
  //         return { ...item, question: editedQuestions[panelId], response: "" };
  //       }
  //       return item;
  //     }),
  //   }));

  //   setChatPanels(updatedPanels);

  //   await updateResponseForPanel(editedQuestions[panelId], updatedPanels);

  //   setEditingQuestionIds((prev) => ({ ...prev, [panelId]: null }));
  //   setEditedQuestions((prev) => ({ ...prev, [panelId]: "" }));
  // };

  const saveEditedQuestion = async (panelId: number) => {
    const updatedPanels = chatPanels.map((panel) => {
      if (panel.id === panelId) {
        const updatedConversation = panel.conversation.map((item, index) => {
          if (index === editingQuestionIds[panelId]) {
            return { ...item, question: editedQuestions[panelId], response: "" };
          }
          return item;
        });
        return {
          ...panel,
          conversation: updatedConversation,
        };
      }
      return panel;
    });

    // Update the state with the new panels
    setChatPanels(updatedPanels);
    // Update the response for the edited question in the specified panel
    await updateResponseForPanel(editedQuestions[panelId], updatedPanels);

    // Reset the editing state for the specified panel
    setEditingQuestionIds((prev) => ({ ...prev, [panelId]: null }));
    setEditedQuestions((prev) => ({ ...prev, [panelId]: "" }));
  };


  const updateResponseForPanel = async (question: string, panels: typeof chatPanels) => {

    const updatedPanels = await Promise.all(
      panels.map(async (panel) => {
        // Check if sync is off and ensure we only update the current panel's response
        if (isSyncedText) {
          // If sync is on, update responses for all panels
          const questionIndex = panel.conversation.findIndex((item) => item.question === question);
          if (questionIndex === -1) return panel;

          try {
            const chatCompletion = await client.chat.completions.create({
              model: panel.selectedModel as string,
              messages: [{ role: "user", content: question }],
            });

            const completionText = chatCompletion.choices[0].message.content || "";
            const usageDetails = chatCompletion.usage;
            const payload = {
              panel: { ...panel, chatId: panel.chatId },
              question,
              completionText,
            };
  
            if (!payload.panel || !payload.question || !payload.completionText) {
              throw new Error("Invalid payload structure");
            }
  
            try {
              const response = await fetch("/api/savechat", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              });
            
              if (!response.ok) {
                throw new Error(`Failed to save chat: ${response.status}`);
              }
            
              const data = await response.json();
              console.log("Chat saved:", data);
            } catch (error) {
              console.error("Error saving chat:", error);
            }
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
        } else {
          // If sync is off, only generate a response for the panel that is submitting the question
          const questionIndex = panel.conversation.findIndex((item) => item.question === question);
          if (questionIndex === -1) return panel;

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
        }
      })
    );

    setChatPanels(updatedPanels);
  };

  // const updateResponseForPanel = async (question: string, panels: typeof chatPanels) => {
  //   const updatedPanels = await Promise.all(
  //     panels.map(async (panel) => {
  //       const questionIndex = panel.conversation.findIndex((item) => item.question === question);
  //       if (questionIndex === -1) return panel;

  //       try {
  //         const chatCompletion = await client.chat.completions.create({
  //           model: panel.selectedModel as string,
  //           messages: [{ role: "user", content: question }],
  //         });

  //         const completionText = chatCompletion.choices[0].message.content || "";
  //         const usageDetails = chatCompletion.usage;

  //         const updatedConversation = panel.conversation.map((item, index) =>
  //           index === questionIndex
  //             ? { ...item, response: completionText }
  //             : item
  //         );

  //         return {
  //           ...panel,
  //           response: completionText,
  //           usage: usageDetails || null,
  //           conversation: updatedConversation,
  //         };
  //       } catch (error) {
  //         console.error("Error:", error);

  //         const updatedConversation = panel.conversation.map((item, index) =>
  //           index === questionIndex
  //             ? { ...item, response: "Error fetching response." }
  //             : item
  //         );

  //         return {
  //           ...panel,
  //           response: "Error fetching response.",
  //           usage: null,
  //           conversation: updatedConversation,
  //         };
  //       }
  //     })
  //   );

  //   setChatPanels(updatedPanels);
  // };

  // function getModelGroupName(
  //   modelId: string | null,
  //   groupedModels: { group: string; models: { id: string }[] }[]
  // ): string | null {
  //   const group = groupedModels.find((group) =>
  //     group.models.some((model) => model.id === modelId)
  //   );

  //   return group ? group.group : null;
  // }



  const handleSubmitAll = async () => {
    const missingModelPanel = chatPanels.find((panel) => panel.selectedModel === null);
    if (missingModelPanel) {
      toast.error("Please select a model for all panels.");
      return;
    } 

    const updatedPanels = await Promise.all(
      chatPanels.map(async (panel) => {
        const contentToSubmit = isSyncedText ? sharedContent : panel.content;

        if (!contentToSubmit) {
          return panel;
        }
        setChatPanels((prev) =>
          prev.map((p) =>
            p.id === panel.id ? { ...p, isGeneratingText: true } : p
          )
        );

        try {
          const chatCompletion = await client.chat.completions.create({
            model: panel.selectedModel as string,
            messages: [{ role: "user", content: contentToSubmit }],
          });

          const completionText = chatCompletion.choices[0].message.content || "";
          const usageDetails = chatCompletion.usage;
          const payload = {
            panel: { ...panel, chatId: panel.chatId },
            contentToSubmit,
            completionText,
          };
          if (!payload.panel || !payload.contentToSubmit || !payload.completionText) {
            throw new Error("Invalid payload structure");
          }

          try {
            const response = await fetch("/api/savechat", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
          
            if (!response.ok) {
              throw new Error(`Failed to save chat: ${response.status}`);
            }
          
            const data = await response.json();
            console.log("Chat saved:", data);
          } catch (error) {
            console.error("Error saving chat:", error);
          }
          
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

    setChatPanels((prevPanels) =>
      prevPanels.map((panel) => ({
        ...panel,
        content: isSyncedText ? sharedContent : "", // Reset content for all panels or use sharedContent
      })));

    if (isSyncedText) {
      setSharedContent("");
    }
  };


  // const handleMouseEnter = (id: number) => {
  //   setChatPanels((prev) =>
  //     prev.map((panel) =>
  //       panel.id === id ? { ...panel, isMatrixVisible: true } : panel
  //     )
  //   );
  // };

  // const handleMouseLeave = (id: number) => {
  //   setChatPanels((prev) =>
  //     prev.map((panel) =>
  //       panel.id === id ? { ...panel, isMatrixVisible: false } : panel
  //     )
  //   );
  // };

  return (
    <div className="relative w-full h-auto flex flex-wrap border-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-300 overflow-x-auto">
      {chatPanels.map((panel, index) => (
        <div
          key={panel.id}
          className={`flex-1 min-w-[300px] flex flex-col border-gray-300 dark:border-gray-700 ${index < chatPanels.length - 1 ? "border-r dark:border-gray-700" : ""
            }`}
        >
          {/* Panel Header */}
          <div className="p-2 h-auto flex flex-wrap  justify-around items-center border-b dark:border-gray-700 gap-2">
            <div className="flex gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="px-3 py-2 h-[44px] border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 outline-none"
                  >
                    {panel.parentModel}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="mt-2 w-fit bg-white rounded-lg shadow-lg border border-gray-200 z-50 opacity-100"
                >
                  {parentModels.map((model, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => updateParentModel(panel.id, model)}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md "
                    >
                      {model}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <ModelsDropdown
                options={panel.parentModel === "Groq" ? models : openaiModels}
                selectedModel={panel.selectedModel}
                onModelChange={(modelId) => handleModelChange(panel.id, modelId)}
              />
            </div>

            <div
              className="relative flex-grow flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center justify-end"
            >
              <div className="w-full flex justify-end items-center">
                <label className="flex items-center gap-2 text-black" title={isSyncedText ? "Sync On" : "Sync Off"}>
                  <Switch
                    checked={isSyncedText}
                    onCheckedChange={(checked) => setIsSyncedText(checked)}
                    className={`w-7 h-4 rounded-full relative ${isSyncedText ? "bg-black" : "bg-gray-300"}`}
                  >
                    <span
                      className={`block w-2 h-2 bg-white rounded-full absolute top-1 ${isSyncedText ? "translate-x-4" : "translate-x-1"}`}
                    />
                  </Switch>
                </label>
              </div>
              {index === chatPanels.length - 1 && chatPanels.length < 3 && (
                <div
                  className="p-1  items-center justify-end flex rounded-md cursor-pointer hover:text-blue-600 dark:hover:text-blue-600 transition-colors"
                  onClick={addChatPanel}
                >
                  <Plus size={20} />
                </div>
              )}
              {chatPanels.length > 1 && (
                <div
                  className="p-1 items-center justify-end flex rounded-md cursor-pointer dark:bg-gray-700 hover:text-red-600 dark:hover:text-red-600 transition-colors"
                  onClick={() => deleteChatPanel(panel.id)}
                >
                  <X size={20} />
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex-grow h-[90%] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border-none">
            <ChatSection
              panelId={panel.id}
              selectedModel={panel.selectedModel}
              content={isSyncedText ? sharedContent : panel.content}
              onContentChange={(newContent) => handleContentChange(panel.id, newContent)}
              responseText={panel.response}
              handleSubmit={() => handleSubmitAll()}
              conversation={panel.conversation}
              editingQuestionId={editingQuestionIds[panel.id]}
              editedQuestion={editedQuestions[panel.id]}
              startEditingQuestion={startEditingQuestion}
              saveEditedQuestion={saveEditedQuestion}
              cancelEditing={cancelEditing}
              onEditedQuestionChange={onEditedQuestionChange}
              isGeneratingText={panel.isGeneratingText}
            />
          </div>
        </div>
      ))}
    </div>

  )
}
