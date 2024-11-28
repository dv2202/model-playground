import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/option";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest){
    try {
        const session = await getServerSession(authOptions);
    
        if (!session?.user?.id) {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
        }
    
        const chats = await prisma.chat.findMany({
        where: {
            userId: session.user.id,
        },
        });
        return NextResponse.json(chats);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}