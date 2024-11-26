import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Clipboard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import { GoPencil } from "react-icons/go";
import { BsLightningCharge } from "react-icons/bs";

type RoleType = "user" | "assistant";

interface ChatSectionProps {
  panelId: string;
  selectedModel: string | null;
  content: string;
  onContentChange: (newContent: string) => void;
  responseText: string;
  handleSubmit: () => void;
  conversation: { question: string; response: string }[];
  editingQuestionId: number | null;
  editedQuestion: string;
  startEditingQuestion: (index: number) => void;
  saveEditedQuestion: () => void;
  cancelEditing: () => void;
  completionUsage: any;
  onEditedQuestionChange: (value: string) => void;
  isGeneratingText: boolean; // Proper prop definition for spinner handling
}

export default function ChatSection({
  panelId,
  content,
  onContentChange,
  responseText,
  handleSubmit: handleSubmitProp,
  conversation,
  editingQuestionId,
  editedQuestion,
  startEditingQuestion,
  saveEditedQuestion,
  cancelEditing,
  onEditedQuestionChange,
  completionUsage,
  isGeneratingText,
}: ChatSectionProps) {
  const [selectedRole, setSelectedRole] = useState<RoleType>("user");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const [showMatrix, setShowMatrix] = useState(false);

  const toggleRole = (value: string) => {
    setSelectedRole(value as RoleType);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(responseText);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text", error);
      toast.error("Failed to copy text");
    }
  };

  const handleSubmit = async () => {
    await handleSubmitProp();
  };
  
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        300
      )}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [content]);

  return (
    <Card className="flex flex-col h-[100%] w-full border-none rounded-none">
      {/* Content */}
      <CardContent className="flex-grow p-2 space-y-4 border-b-2 border-t-1 shadow-none rounded-none min-h-[400px]">
        <ScrollArea className="md:h-[calc(100vh-350px)] w-full sm:h-[calc(100vh-200px)] ">
          {conversation.length > 0 ? (
            conversation.map((item, index) => (
              <div
                key={index}
                className="p-4 relative group break-words border-b  text-sm sm:text-base"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{selectedRole.toUpperCase()}</p>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 text-lg text-orange-400 rounded-md"
                      onMouseEnter={() => setShowMatrix(true)}
                      onMouseLeave={() => setShowMatrix(false)}
                    >
                      <BsLightningCharge />
                    </button>
                  </div>
                </div>
                {showMatrix && (
                  <div className="absolute top-[40px] right-[5%] z-30 w-[300px] p-4 bg-gray-100 dark:bg-gray-800 rounded-md shadow-lg">
                    <p className="font-semibold text-center text-gray-800 dark:text-gray-200">
                      Inference Details
                    </p>
                    <p className="text-orange-500 dark:text-orange-500 text-center">
                      Queue Time: {completionUsage.queue_time?.toFixed(3)} seconds
                    </p>
                    <p className="text-orange-500 dark:text-orange-500 text-center">
                      Prompt Tokens: {completionUsage.prompt_tokens?.toFixed(3)}
                    </p>
                    <p className="text-orange-500 dark:text-orange-500 text-center">
                      Prompt Time: {completionUsage.prompt_time?.toFixed(3)} seconds
                    </p>
                    <p className="text-orange-500 dark:text-orange-500 text-center">
                      Completion Tokens: {completionUsage.completion_tokens?.toFixed(3)}
                    </p>
                    <p className="text-orange-500 dark:text-orange-500 text-center">
                      Completion Time: {completionUsage.completion_time?.toFixed(3)} seconds
                    </p>
                    <p className="text-orange-500 dark:text-orange-500 text-center">
                      Total Tokens: {completionUsage.total_tokens?.toFixed(3)}
                    </p>
                    <p className="text-orange-500 dark:text-orange-500 text-center">
                      Total Time: {completionUsage.total_time?.toFixed(3)} seconds
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {editingQuestionId === index ? (
                    <>
                      <input
                        type="text"
                        value={editedQuestion}
                        onChange={(e) => onEditedQuestionChange(e.target.value)}
                        className="border rounded p-1 flex-grow w-full"
                      />
                      <button
                        onClick={saveEditedQuestion}
                        className="text-blue-500"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="text-gray-500"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm flex-grow">{item.question}</p>
                      <GoPencil
                        className="cursor-pointer text-gray-500 mr-3"
                        onClick={() => startEditingQuestion(panelId,index)}
                      />
                    </>
                  )}
                </div>
                <div className="flex flex-row items-center justify-between ">
                <p className="font-semibold mt-2">Response:</p>
                <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Clipboard className="h-4 w-4" />
                      )}
                      <span className="sr-only">Copy to clipboard</span>
                    </Button>
                </div>
                
                <ReactMarkdown className="prose dark:prose-dark">
                  {item.response}
                </ReactMarkdown>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Responses will appear here</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex flex-col mt-2 gap-3 p-3 sm:p-4">
        <div className="flex items-center justify-between w-full">
          <ToggleGroup
            type="single"
            value={selectedRole}
            onValueChange={toggleRole}
            className="text-xs"
          >
            <ToggleGroupItem
              value="user"
              aria-label="Toggle user role"
              className="flex items-center gap-1"
            >
              <User className="h-4 w-4" />
              User
            </ToggleGroupItem>
            <ToggleGroupItem
              value="assistant"
              aria-label="Toggle assistant role"
              className="flex items-center gap-1"
            >
              <Bot className="h-4 w-4" />
              Assistant
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-xs text-muted-foreground">
            Press Shift + Enter for new line
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2">
          <div className="flex-grow relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="min-h-[44px] resize-none pr-16"
            />
            <div className="absolute right-3 bottom-3 text-xs text-muted-foreground">
              {content.length} chars
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isGeneratingText}
            size="icon"
          >
            {isGeneratingText ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isGeneratingText ? "Generating" : "Send message"}
            </span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
