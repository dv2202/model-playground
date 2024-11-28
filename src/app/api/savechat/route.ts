import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/option";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const { panels, contentToSubmit, completionText } = await req.json(); // Assuming panels is an array of multiple panels
    if (!panels || !contentToSubmit || !completionText) {
      return NextResponse.json({ message: "Missing required data" }, { status: 400 });
    }

    // Loop through each panel and handle updates or creations individually
    const chatUpdates = [];
    for (const panel of panels) {
      const { chatId, panelId } = panel;

      if (!chatId || !panelId) {
        continue; // Skip if chatId or panelId is missing
      }

      const existingChat = await prisma.chat.findFirst({
        where: {
          userId: session.user.id,
          chatId: chatId as string,
          panelId: panelId as number, // Ensure unique identification of the panel
        },
      });

      if (existingChat) {
        console.log("Existing chat found for panelId:", panelId);
        const updatedConversation = [
          ...(Array.isArray(existingChat.conversation) ? existingChat.conversation : []),
          { question: contentToSubmit, response: completionText },
        ];

        console.log("Updated conversation:", updatedConversation);

        if (!Array.isArray(updatedConversation)) {
          throw new Error("Updated conversation is not an array.");
        }

        // Add update operation to batch
        chatUpdates.push(
          prisma.chat.update({
            where: { id: existingChat.id },
            data: {
              content: contentToSubmit,
              response: completionText,
              conversation: updatedConversation,
            },
          })
        );
      } else {
        // Add create operation to batch if no existing chat found
        chatUpdates.push(
          prisma.chat.create({
            data: {
              userId: session.user.id,
              parentModel: panel.parentModel,
              selectedModel: panel.selectedModel,
              response: completionText,
              isMatrixVisible: panel.isMatrixVisible,
              conversation: [
                { question: contentToSubmit, response: completionText },
              ], 
              content: contentToSubmit,
              isGeneratingText: false,
              chatId: chatId as string,
              panelId: panelId as number, // Store panelId to distinguish different panels
            },
          })
        );
      }
    }

    // Execute all updates and creates concurrently
    const savedChats = await Promise.all(chatUpdates);

    console.log("Chat objects saved:", savedChats);

    // Ensure chat is not null or undefined before returning it
    if (savedChats.length > 0) {
      return NextResponse.json(savedChats);
    } else {
      throw new Error("Failed to create or update chats");
    }
  } catch (error) {
    console.error("Error saving chats:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
