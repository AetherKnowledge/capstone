"use server";

import { ParsedChat } from "@/@types/network";
import { UserStatus } from "@/app/generated/prisma";
import authOptions from "@/lib/auth/authOptions";
import { isUserOnline } from "@/lib/redis";
import { Message } from "@/lib/socket/hooks/useMessaging";
import { authenticateUser } from "@/lib/utils";
import { prisma } from "@/prisma/client";
import { getServerSession } from "next-auth";

export async function getChats(): Promise<ParsedChat[]> {
  console.log("Fetching chats...");
  const session = await getServerSession(authOptions);

  if (!session || !(await authenticateUser(session))) {
    throw new Error("Unauthorized");
  }

  const chats = await prisma.chat.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },

    select: {
      id: true,
      name: true,
      createdAt: true,
      type: true,
      members: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          content: true,
          createdAt: true,
        },
      },
      lastMessageAt: true,
    },

    orderBy: {
      lastMessageAt: "desc",
    },
  });

  if (!chats || chats.length === 0) {
    return [];
  }

  const parsedChats = await Promise.all(
    chats.map(async (chat) => {
      const member = chat.members.find(
        (member) => member.user.id !== session.user.id
      )?.user;

      return {
        id: chat.id,
        name: member?.name || member?.email || "Unknown",
        type: chat.type,
        src: member?.image,
        status: (await isUserOnline(member?.id || ""))
          ? UserStatus.Online
          : UserStatus.Offline,
        latestMessageAt: chat.lastMessageAt,
      } as ParsedChat;
    })
  );

  return parsedChats;
}

export async function getChatById(id: string): Promise<Message[]> {
  const session = await getServerSession(authOptions);
  if (!session || !authenticateUser(session)) {
    throw new Error("Unauthorized");
  }

  if (!id || typeof id !== "string") {
    throw new Error("Invalid chat ID");
  }

  const chat = await prisma.chat.findUnique({
    where: { id },
    include: {
      members: {
        where: { userId: session.user.id },
        select: { userId: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: { name: true, image: true },
          },
        },
      },
    },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  if (!chat.members.some((member) => member.userId === session.user.id)) {
    throw new Error("You are not a member of this chat");
  }

  const messages: Message[] = chat.messages.map((msg) => ({
    id: msg.id,
    chatId: msg.chatId,
    userId: msg.userId,
    content: msg.content,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    name: msg.user?.name || "Unknown",
    src: msg.user?.image || undefined,
  }));

  return messages as Message[];
}
