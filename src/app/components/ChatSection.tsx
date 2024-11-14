'use client'

import { useState, useRef, useEffect } from "react"
import { Send, User, Bot, Clipboard, Check } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "react-hot-toast"

type RoleType = "user" | "assistant"

interface ChatSectionProps {
    selectedModel: string | null
    content: string
    onContentChange: (newContent: string) => void
    responseText: string
    handleSubmit: () => void
}

export default function ChatSection({
    content,
    onContentChange,
    responseText,
    handleSubmit: handleSubmitProp,
}: ChatSectionProps) {
    const [selectedRole, setSelectedRole] = useState<RoleType>("user")
    const [copied, setCopied] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const responseRef = useRef<HTMLDivElement>(null)

    const toggleRole = (value: string) => {
        setSelectedRole(value as RoleType)
    }

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(responseText)
            setCopied(true)
            toast.success("Copied to clipboard!")
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error("Failed to copy text")
        }
    }

    const handleSubmit = async () => {
        setIsGenerating(true)
        await handleSubmitProp()
        setIsGenerating(false)
    }

    useEffect(() => {
        if (responseRef.current) {
            responseRef.current.scrollTop = responseRef.current.scrollHeight
        }
    }, [responseText])

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`
        }
    }

    useEffect(() => {
        adjustTextareaHeight()
    }, [content])

    return (
        <Card className="flex flex-col h-full w-full">
            <CardContent className="flex-grow p-4 space-y-4">
                <ScrollArea className="h-[calc(100vh-250px)] w-full rounded-md border">
                    {isGenerating && (
                        <div className="flex items-center justify-center h-12 bg-muted">
                            <div className="animate-pulse flex space-x-1">
                                <div className="w-1 h-1 bg-foreground rounded-full"></div>
                                <div className="w-1 h-1 bg-foreground rounded-full"></div>
                                <div className="w-1 h-1 bg-foreground rounded-full"></div>
                            </div>
                        </div>
                    )}
                    {responseText ? (
                        <div className="relative group p-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={copyToClipboard}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Clipboard className="h-4 w-4" />
                                )}
                                <span className="sr-only">Copy to clipboard</span>
                            </Button>
                            <pre className="text-sm whitespace-pre-wrap font-sans">{responseText}</pre>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            <p className="text-sm">Responses will appear here</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
                <div className="flex items-center justify-between w-full">
                    <ToggleGroup type="single" value={selectedRole} onValueChange={toggleRole}>
                        <ToggleGroupItem value="user" aria-label="Toggle user role">
                            <User className="h-4 w-4 mr-2" />
                            User
                        </ToggleGroupItem>
                        <ToggleGroupItem value="assistant" aria-label="Toggle assistant role">
                            <Bot className="h-4 w-4 mr-2" />
                            Assistant
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <p className="text-xs text-muted-foreground">
                        Press Shift + Enter for new line
                    </p>
                </div>
                <div className="flex w-full space-x-2">
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
                        disabled={!content.trim() || isGenerating}
                        size="icon"
                    >
                        {isGenerating ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        <span className="sr-only">{isGenerating ? 'Generating' : 'Send message'}</span>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}